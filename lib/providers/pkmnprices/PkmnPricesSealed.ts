import type { DatabaseSync } from "node:sqlite";
import { artworkIdentityKey, normalizeSearchText } from "@/lib/pricing/domain";
import type { SearchMatch } from "@/lib/pricing/types";

export const PKMNPRICES_DAILY_SEALED_BUDGET = 100;
export const pokemonReleaseManifestUrl =
  "https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master/sets/en.json";

export type PokemonRelease = {
  id: string;
  name: string;
  releaseDate: string;
};

export type PkmnPricesSealedProduct = {
  id: number;
  tcgPlayerId: number | null;
  name: string;
  imageUrl: string | null;
  set: { id: number; name: string };
};

export type PkmnPricesSealedPage = {
  products: PkmnPricesSealedProduct[];
  page: number;
  totalPages: number;
  creditsCharged: number;
  providerCreditLimit: number | null;
};

export type SealedSyncStatus =
  | "NOT_CONFIGURED"
  | "ACCESS_REQUIRED"
  | "READY"
  | "BUDGET_EXHAUSTED"
  | "SOURCE_COMPLETE"
  | "RATE_LIMITED"
  | "FAILED";

export type SealedSyncSummary = {
  status: SealedSyncStatus;
  creditsUsed: number;
  dailyBudget: number;
  productsStored: number;
  productsResolved: number;
  nextRelease: string | null;
  lastError: string | null;
};

type JsonRecord = Record<string, unknown>;
type SqlRow = Record<string, string | number | null>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function parsePokemonReleaseManifest(value: unknown): PokemonRelease[] {
  if (!Array.isArray(value)) throw new Error("Pokémon release metadata is not an array.");
  const releases = value.flatMap((candidate): PokemonRelease[] => {
    const item = record(candidate);
    const id = optionalString(item?.id);
    const name = optionalString(item?.name);
    const rawDate = optionalString(item?.releaseDate);
    if (!id || !name || !rawDate || !/^\d{4}\/\d{2}\/\d{2}$/.test(rawDate)) return [];
    return [{ id, name, releaseDate: rawDate.replaceAll("/", "-") }];
  });
  return releases.sort(
    (left, right) =>
      right.releaseDate.localeCompare(left.releaseDate) ||
      left.name.localeCompare(right.name) ||
      left.id.localeCompare(right.id),
  );
}

export class PkmnPricesProviderError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "PkmnPricesProviderError";
  }
}

export class PokemonReleaseSource {
  constructor(private readonly fetcher: typeof fetch = fetch) {}

  async list(): Promise<PokemonRelease[]> {
    const response = await this.fetcher(pokemonReleaseManifestUrl, {
      headers: { Accept: "application/json" },
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(`Pokémon release source returned ${response.status}.`);
    return parsePokemonReleaseManifest(await response.json());
  }
}

export class PkmnPricesSealedClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async listByRelease(input: {
    releaseName: string;
    page: number;
    perPage: number;
  }): Promise<PkmnPricesSealedPage> {
    if (!this.apiKey.trim()) throw new Error("PkmnPrices API key is required.");
    if (!input.releaseName.trim()) throw new Error("Release name is required.");
    if (!Number.isInteger(input.page) || input.page < 1) throw new Error("Page must be positive.");
    if (!Number.isInteger(input.perPage) || input.perPage < 1 || input.perPage > 100) {
      throw new Error("Page size must be between 1 and 100.");
    }
    const url = new URL("https://api.pkmnprices.com/v1/sealed");
    url.searchParams.set("name", input.releaseName);
    url.searchParams.set("language", "en");
    url.searchParams.set("sort", "name_asc");
    url.searchParams.set("page", String(input.page));
    url.searchParams.set("per_page", String(input.perPage));
    const response = await this.fetcher(url, {
      headers: { Accept: "application/json", "X-API-Key": this.apiKey },
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const body = record(await response.json().catch(() => null));
      const error = record(body?.error);
      const code = optionalString(error?.code) ?? `http_${response.status}`;
      throw new PkmnPricesProviderError(
        response.status,
        code,
        response.status === 403
          ? "The configured PkmnPrices plan does not permit sealed access."
          : response.status === 401
            ? "The configured PkmnPrices credential was rejected."
            : response.status === 429
              ? "PkmnPrices rate or credit limit was reached."
              : `PkmnPrices sealed request failed with ${response.status}.`,
      );
    }
    const body = record(await response.json());
    const data = body?.data;
    const pagination = record(body?.pagination);
    if (!Array.isArray(data) || !pagination) {
      throw new Error("PkmnPrices returned an invalid sealed response.");
    }
    const products = data.map((candidate): PkmnPricesSealedProduct => {
      const item = record(candidate);
      const set = record(item?.set);
      const id = positiveInteger(item?.id);
      const name = optionalString(item?.name);
      const setId = positiveInteger(set?.id);
      const setName = optionalString(set?.name);
      if (!id || !name || !setId || !setName) {
        throw new Error("PkmnPrices returned an invalid sealed product.");
      }
      const imageUrl = optionalString(item?.image_url);
      if (imageUrl) {
        const parsed = new URL(imageUrl);
        if (parsed.protocol !== "https:" || parsed.hostname !== "images.pkmnprices.com") {
          throw new Error("PkmnPrices returned an unapproved image origin.");
        }
      }
      return {
        id,
        tcgPlayerId: positiveInteger(item?.tcg_player_id),
        name,
        imageUrl,
        set: { id: setId, name: setName },
      };
    });
    const chargedHeader = response.headers.get("x-credits-charged");
    const charged = positiveInteger(chargedHeader) ?? Math.max(1, products.length);
    return {
      products,
      page: positiveInteger(pagination.page) ?? input.page,
      totalPages: positiveInteger(pagination.total_pages) ?? (products.length ? input.page : 0),
      creditsCharged: charged,
      providerCreditLimit: positiveInteger(response.headers.get("x-credits-limit")),
    };
  }
}

function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function canonicalSealedText(value: string): string {
  return normalizeSearchText(value).replace(/\band\b/g, " ").replace(/\s+/g, " ").trim();
}

function canonicalSealedSet(value: string): string {
  return canonicalSealedText(
    value.replace(/^(?:(?:sv|swsh|sm)\d+(?:\.\d+)?|xy)\s*[:\-]\s*/i, ""),
  );
}

export class PkmnPricesSealedRepository {
  constructor(readonly database: DatabaseSync) {
    this.migrate();
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS pkmnprices_sealed_usage (
        utc_date TEXT PRIMARY KEY,
        credits_used INTEGER NOT NULL DEFAULT 0 CHECK(credits_used >= 0),
        request_count INTEGER NOT NULL DEFAULT 0 CHECK(request_count >= 0),
        status TEXT NOT NULL,
        last_error TEXT,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pkmnprices_sealed_set_progress (
        release_id TEXT PRIMARY KEY,
        release_name TEXT NOT NULL,
        release_date TEXT NOT NULL,
        next_page INTEGER NOT NULL DEFAULT 1 CHECK(next_page >= 1),
        completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0,1)),
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS pkmnprices_sealed_product (
        provider_product_id INTEGER PRIMARY KEY,
        tcgplayer_product_id INTEGER,
        name TEXT NOT NULL,
        provider_set_id INTEGER NOT NULL,
        set_name TEXT NOT NULL,
        release_id TEXT NOT NULL,
        release_date TEXT NOT NULL,
        image_url TEXT,
        retrieved_at TEXT NOT NULL,
        matched_category_id TEXT,
        matched_sku TEXT,
        match_method TEXT CHECK(match_method IN ('TCGPLAYER_ID','EXACT_NAME_SET') OR match_method IS NULL)
      );
      CREATE INDEX IF NOT EXISTS pkmnprices_sealed_unresolved
        ON pkmnprices_sealed_product(matched_sku, release_date DESC);
    `);
  }

  creditsUsed(now = new Date()): number {
    const row = this.database
      .prepare("SELECT credits_used FROM pkmnprices_sealed_usage WHERE utc_date=?")
      .get(utcDay(now)) as SqlRow | undefined;
    return Number(row?.credits_used ?? 0);
  }

  nextRelease(releases: readonly PokemonRelease[]): { release: PokemonRelease; page: number } | null {
    const statement = this.database.prepare(
      "SELECT next_page, completed FROM pkmnprices_sealed_set_progress WHERE release_id=?",
    );
    for (const release of releases) {
      const row = statement.get(release.id) as SqlRow | undefined;
      if (Number(row?.completed ?? 0) !== 1) {
        return { release, page: Number(row?.next_page ?? 1) };
      }
    }
    return null;
  }

  recordFailure(status: SealedSyncStatus, message: string, now = new Date()): void {
    const day = utcDay(now);
    this.database.prepare(`
      INSERT INTO pkmnprices_sealed_usage(utc_date, credits_used, request_count, status, last_error, updated_at)
      VALUES(?, 0, 0, ?, ?, ?)
      ON CONFLICT(utc_date) DO UPDATE SET status=excluded.status, last_error=excluded.last_error, updated_at=excluded.updated_at
    `).run(day, status, message, now.toISOString());
  }

  recordPage(input: {
    release: PokemonRelease;
    page: PkmnPricesSealedPage;
    now: Date;
  }): void {
    const day = utcDay(input.now);
    const currentCredits = this.creditsUsed(input.now);
    if (currentCredits + input.page.creditsCharged > PKMNPRICES_DAILY_SEALED_BUDGET) {
      throw new Error("PkmnPrices sealed page exceeds the remaining daily budget.");
    }
    const localProducts = this.database
      .prepare("SELECT * FROM pricing_products WHERE category_id='pokemon-en' AND product_type='SEALED'")
      .all() as SqlRow[];
    const latestSource = this.database.prepare(`
      SELECT DISTINCT p.* FROM pricing_products p
      JOIN pricing_latest l ON l.category_id=p.category_id AND l.sku=p.sku
      WHERE p.category_id='pokemon-en' AND p.product_type='SEALED' AND l.source_sku=?
    `);
    const saveProduct = this.database.prepare(`
      INSERT INTO pkmnprices_sealed_product(
        provider_product_id, tcgplayer_product_id, name, provider_set_id, set_name,
        release_id, release_date, image_url, retrieved_at, matched_category_id, matched_sku, match_method
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(provider_product_id) DO UPDATE SET
        tcgplayer_product_id=excluded.tcgplayer_product_id, name=excluded.name,
        provider_set_id=excluded.provider_set_id, set_name=excluded.set_name,
        release_id=excluded.release_id, release_date=excluded.release_date,
        image_url=excluded.image_url, retrieved_at=excluded.retrieved_at,
        matched_category_id=excluded.matched_category_id, matched_sku=excluded.matched_sku,
        match_method=excluded.match_method
    `);
    const saveArtwork = this.database.prepare(`
      INSERT INTO pricing_artwork_resolutions(category_id, sku, identity_key, provider_id, image_urls_json, verified_at)
      VALUES('pokemon-en', ?, ?, 'pkmnprices-sealed', ?, ?)
      ON CONFLICT(category_id, sku) DO UPDATE SET
        identity_key=excluded.identity_key, provider_id=excluded.provider_id,
        image_urls_json=excluded.image_urls_json, verified_at=excluded.verified_at
    `);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      for (const product of input.page.products) {
        let matched: SqlRow | null = null;
        let matchMethod: "TCGPLAYER_ID" | "EXACT_NAME_SET" | null = null;
        if (product.tcgPlayerId) {
          const candidates = (latestSource.all(String(product.tcgPlayerId)) as SqlRow[]).filter(
            (candidate) =>
              canonicalSealedText(String(candidate.name)) === canonicalSealedText(product.name) &&
              canonicalSealedSet(String(candidate.set_name)) === canonicalSealedSet(product.set.name),
          );
          if (candidates.length === 1) {
            matched = candidates[0];
            matchMethod = "TCGPLAYER_ID";
          }
        }
        if (!matched) {
          const candidates = localProducts.filter(
            (candidate) =>
              canonicalSealedText(String(candidate.name)) === canonicalSealedText(product.name) &&
              canonicalSealedSet(String(candidate.set_name)) === canonicalSealedSet(product.set.name),
          );
          if (candidates.length === 1) {
            matched = candidates[0];
            matchMethod = "EXACT_NAME_SET";
          }
        }
        saveProduct.run(
          product.id,
          product.tcgPlayerId,
          product.name,
          product.set.id,
          product.set.name,
          input.release.id,
          input.release.releaseDate,
          product.imageUrl,
          input.now.toISOString(),
          matched ? "pokemon-en" : null,
          matched?.sku ?? null,
          matchMethod,
        );
        if (matched && product.imageUrl) {
          const identity: Pick<SearchMatch, "categoryId" | "productType" | "name" | "setName" | "collectorNumber" | "language" | "sku"> = {
            categoryId: "pokemon-en",
            productType: "SEALED",
            name: String(matched.name),
            setName: String(matched.set_name),
            collectorNumber: matched.collector_number as string | null,
            language: String(matched.language),
            sku: String(matched.sku),
          };
          saveArtwork.run(
            String(matched.sku),
            artworkIdentityKey(identity),
            JSON.stringify({ large: product.imageUrl, normal: product.imageUrl, small: product.imageUrl }),
            input.now.toISOString(),
          );
        }
      }
      const completed =
        input.page.totalPages === 0 || input.page.page >= input.page.totalPages;
      this.database.prepare(`
        INSERT INTO pkmnprices_sealed_set_progress(release_id, release_name, release_date, next_page, completed, updated_at)
        VALUES(?, ?, ?, ?, ?, ?)
        ON CONFLICT(release_id) DO UPDATE SET
          release_name=excluded.release_name, release_date=excluded.release_date,
          next_page=excluded.next_page, completed=excluded.completed, updated_at=excluded.updated_at
      `).run(
        input.release.id,
        input.release.name,
        input.release.releaseDate,
        completed ? input.page.page : input.page.page + 1,
        completed ? 1 : 0,
        input.now.toISOString(),
      );
      this.database.prepare(`
        INSERT INTO pkmnprices_sealed_usage(utc_date, credits_used, request_count, status, last_error, updated_at)
        VALUES(?, ?, 1, 'READY', NULL, ?)
        ON CONFLICT(utc_date) DO UPDATE SET
          credits_used=pkmnprices_sealed_usage.credits_used + excluded.credits_used,
          request_count=pkmnprices_sealed_usage.request_count + 1,
          status='READY', last_error=NULL, updated_at=excluded.updated_at
      `).run(day, input.page.creditsCharged, input.now.toISOString());
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  summary(input: { configured: boolean; releases?: readonly PokemonRelease[]; now?: Date }): SealedSyncSummary {
    const now = input.now ?? new Date();
    const usage = this.database
      .prepare("SELECT status, last_error FROM pkmnprices_sealed_usage WHERE utc_date=?")
      .get(utcDay(now)) as SqlRow | undefined;
    const counts = this.database.prepare(`
      SELECT count(*) AS stored, count(matched_sku) AS resolved FROM pkmnprices_sealed_product
    `).get() as SqlRow;
    const creditsUsed = this.creditsUsed(now);
    const next = input.releases ? this.nextRelease(input.releases) : null;
    const storedNext = this.database.prepare(`
      SELECT release_name FROM pkmnprices_sealed_set_progress
      WHERE completed=0 ORDER BY release_date DESC, release_name LIMIT 1
    `).get() as SqlRow | undefined;
    const storedStatus = usage?.status as SealedSyncStatus | undefined;
    const status: SealedSyncStatus = !input.configured
      ? "NOT_CONFIGURED"
      : creditsUsed >= PKMNPRICES_DAILY_SEALED_BUDGET
        ? "BUDGET_EXHAUSTED"
        : storedStatus ?? "READY";
    return {
      status,
      creditsUsed,
      dailyBudget: PKMNPRICES_DAILY_SEALED_BUDGET,
      productsStored: Number(counts.stored ?? 0),
      productsResolved: Number(counts.resolved ?? 0),
      nextRelease: next?.release.name ?? (storedNext?.release_name as string | undefined) ?? null,
      lastError: (usage?.last_error as string | null) ?? null,
    };
  }
}

export class PkmnPricesSealedSync {
  constructor(
    private readonly repository: PkmnPricesSealedRepository,
    private readonly releaseSource: PokemonReleaseSource,
    private readonly client: PkmnPricesSealedClient | null,
    private readonly options: { now?: () => Date; pause?: () => Promise<void> } = {},
  ) {}

  async run(): Promise<SealedSyncSummary> {
    const now = this.options.now?.() ?? new Date();
    if (!this.client) return this.repository.summary({ configured: false, now });
    let releases: PokemonRelease[];
    try {
      releases = await this.releaseSource.list();
      if (!releases.length) throw new Error("Pokémon release metadata is empty.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Release metadata failed.";
      this.repository.recordFailure("FAILED", message, now);
      return this.repository.summary({ configured: true, now });
    }
    while (this.repository.creditsUsed(now) < PKMNPRICES_DAILY_SEALED_BUDGET) {
      const next = this.repository.nextRelease(releases);
      if (!next) {
        this.repository.recordFailure("SOURCE_COMPLETE", "All release pages are complete.", now);
        break;
      }
      const remaining = PKMNPRICES_DAILY_SEALED_BUDGET - this.repository.creditsUsed(now);
      try {
        const page = await this.client.listByRelease({
          releaseName: next.release.name,
          page: next.page,
          perPage: remaining,
        });
        this.repository.recordPage({ release: next.release, page, now });
      } catch (error) {
        const status: SealedSyncStatus =
          error instanceof PkmnPricesProviderError && error.statusCode === 403
            ? "ACCESS_REQUIRED"
            : error instanceof PkmnPricesProviderError && error.statusCode === 429
              ? "RATE_LIMITED"
              : "FAILED";
        this.repository.recordFailure(
          status,
          error instanceof Error ? error.message : "PkmnPrices sealed sync failed.",
          now,
        );
        break;
      }
      if (this.repository.creditsUsed(now) < PKMNPRICES_DAILY_SEALED_BUDGET) {
        await (this.options.pause?.() ?? new Promise((resolve) => setTimeout(resolve, 1_100)));
      }
    }
    return this.repository.summary({ configured: true, releases, now });
  }
}
