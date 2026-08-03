import { artworkIdentityName } from "@/lib/pricing/domain";
import { resolveSnapshotArtwork } from "@/lib/pricing/artwork";
import type { SearchMatch } from "@/lib/pricing/types";
import type { Card, CardImageUrls } from "@/types/card";

const defaultHomepage = "https://pokefiles.com/";
const allowedImageHosts = new Set(["images.pokemontcg.io", "images.scrydex.com"]);
const materialArtworkQualifier = /\b(?:championship|event|league|pitch black|prerelease|pre-release|prize|regional|staff|stamped|tournament|winner)\b/i;

type PokefilesSetRow = {
  id?: unknown;
  name?: unknown;
  synced_at?: unknown;
};

type PokefilesCardRow = {
  id?: unknown;
  set_id?: unknown;
  name?: unknown;
  number?: unknown;
  rarity?: unknown;
  image_small?: unknown;
  image_large?: unknown;
  synced_at?: unknown;
};

export type PokefilesPublicConfiguration = {
  supabaseUrl: string;
  anonKey: string;
};

export type PokefilesSnapshot = {
  cards: Card[];
  setCount: number;
  sourceCardCount: number;
  syncedAt: string | null;
  upstreamHosts: Record<string, number>;
};

export type PokefilesArtworkSourceOptions = {
  anonKey?: string;
  fetcher?: typeof fetch;
  homepage?: string;
  pageSize?: number;
  supabaseUrl?: string;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalized(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function verifiedImageUrl(value: unknown): string | undefined {
  const candidate = text(value);
  if (!candidate) return undefined;
  try {
    const url = new URL(candidate);
    if (url.protocol !== "https:" || url.username || url.password || !allowedImageHosts.has(url.hostname)) return undefined;
    if (url.hostname === "images.scrydex.com" && !/^\/pokemon\/[A-Za-z0-9._-]+\/(?:small|medium|large)$/.test(url.pathname)) return undefined;
    if (url.hostname === "images.pokemontcg.io" && !/^\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(?:_hires)?\.png$/.test(url.pathname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

function decodeJwtPayload(value: string): Record<string, unknown> | null {
  try {
    const encoded = value.split(".")[1];
    if (!encoded) return null;
    const padding = "=".repeat((4 - (encoded.length % 4)) % 4);
    return JSON.parse(Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/") + padding, "base64").toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function parsePokefilesPublicConfiguration(bundle: string): PokefilesPublicConfiguration {
  const urls = bundle.match(/https:\/\/[a-z0-9]+\.supabase\.co/gi) ?? [];
  const keys = bundle.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g) ?? [];
  for (const supabaseUrl of [...new Set(urls)]) {
    const ref = new URL(supabaseUrl).hostname.split(".")[0];
    for (const anonKey of [...new Set(keys)]) {
      const payload = decodeJwtPayload(anonKey);
      if (payload?.role === "anon" && payload.ref === ref && payload.iss === "supabase") {
        return { supabaseUrl, anonKey };
      }
    }
  }
  throw new Error("PokéFiles public catalogue configuration was not found or was not a matching anonymous Supabase client.");
}

function materialQualifierIsProven(match: SearchMatch, cards: readonly Card[]): boolean {
  if (!materialArtworkQualifier.test(match.name)) return true;
  const expectedName = normalized(artworkIdentityName(match.name));
  return cards.some((card) => normalized(card.name) === expectedName);
}

export function resolvePokefilesArtwork(
  matches: SearchMatch[],
  cards: Card[],
): Record<string, CardImageUrls> {
  const eligible = matches.filter((match) =>
    match.categoryId === "pokemon-en" &&
    match.productType === "SINGLE" &&
    materialQualifierIsProven(match, cards),
  );
  return resolveSnapshotArtwork(eligible, cards);
}

export class PokefilesArtworkSource {
  private readonly fetcher: typeof fetch;
  private readonly homepage: URL;
  private readonly pageSize: number;
  private readonly configured?: PokefilesPublicConfiguration;

  constructor(options: PokefilesArtworkSourceOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.homepage = new URL(options.homepage ?? defaultHomepage);
    if (this.homepage.protocol !== "https:" || !new Set(["pokefiles.com", "www.pokefiles.com"]).has(this.homepage.hostname)) {
      throw new Error("PokéFiles homepage must be the public HTTPS site.");
    }
    this.pageSize = options.pageSize ?? 1_000;
    if (!Number.isInteger(this.pageSize) || this.pageSize < 1 || this.pageSize > 1_000) {
      throw new Error("PokéFiles page size must be from 1 through 1000.");
    }
    if (Boolean(options.supabaseUrl) !== Boolean(options.anonKey)) {
      throw new Error("PokéFiles Supabase URL and anonymous key must be supplied together.");
    }
    if (options.supabaseUrl && options.anonKey) {
      const parsed = parsePokefilesPublicConfiguration(`${options.supabaseUrl}\" ${options.anonKey}`);
      this.configured = parsed;
    }
  }

  async snapshot(): Promise<PokefilesSnapshot> {
    const configuration = this.configured ?? await this.discoverConfiguration();
    const [setRows, cardRows] = await Promise.all([
      this.fetchRows<PokefilesSetRow>(configuration, "pokemon_sets", "id,name,synced_at", 2_000),
      this.fetchRows<PokefilesCardRow>(configuration, "pokemon_cards", "id,set_id,name,number,rarity,image_small,image_large,synced_at", 50_000),
    ]);
    const sets = new Map(setRows
      .map((row) => [text(row.id), text(row.name)] as const)
      .filter(([id, name]) => id && name));
    const upstreamHosts: Record<string, number> = {};
    let syncedAt: string | null = null;
    const cards: Card[] = [];
    for (const row of cardRows) {
      const id = text(row.id);
      const setId = text(row.set_id);
      const name = text(row.name);
      const number = text(row.number);
      const set = sets.get(setId);
      const small = verifiedImageUrl(row.image_small);
      const large = verifiedImageUrl(row.image_large);
      const primary = large ?? small;
      if (!id || !setId || !set || !name || !number || !primary) continue;
      const host = new URL(primary).hostname;
      upstreamHosts[host] = (upstreamHosts[host] ?? 0) + 1;
      const rowSync = text(row.synced_at);
      if (rowSync && (!syncedAt || rowSync > syncedAt)) syncedAt = rowSync;
      cards.push({
        id: `pokefiles:${id}`,
        name,
        game: "Pokemon",
        set,
        setCode: setId,
        providerSetId: setId,
        number,
        rarity: text(row.rarity) || "Unknown",
        finish: "Unknown",
        imageUrl: primary,
        imageUrls: { small, normal: large ?? small, large },
        language: "English",
        providerIdentity: { providerId: "pokefiles", providerRecordId: id },
      });
    }
    return { cards, setCount: sets.size, sourceCardCount: cardRows.length, syncedAt, upstreamHosts };
  }

  private async discoverConfiguration(): Promise<PokefilesPublicConfiguration> {
    const homepageResponse = await this.fetcher(this.homepage, {
      headers: { Accept: "text/html", "User-Agent": "Phronesis/0.1 community artwork indexer" },
      redirect: "follow",
      signal: AbortSignal.timeout(20_000),
    });
    if (!homepageResponse.ok) throw new Error(`PokéFiles homepage returned ${homepageResponse.status}.`);
    const html = await homepageResponse.text();
    const script = html.match(/<script[^>]+type=["']module["'][^>]+src=["']([^"']+)["']/i)?.[1]
      ?? html.match(/<script[^>]+src=["']([^"']+)["'][^>]+type=["']module["']/i)?.[1];
    if (!script) throw new Error("PokéFiles public application bundle was not declared.");
    const bundleUrl = new URL(script, this.homepage);
    if (bundleUrl.origin !== this.homepage.origin || !/^\/assets\/[A-Za-z0-9._-]+\.js$/.test(bundleUrl.pathname)) {
      throw new Error("PokéFiles public application bundle URL was outside the expected origin.");
    }
    const bundleResponse = await this.fetcher(bundleUrl, {
      headers: { Accept: "text/javascript", "User-Agent": "Phronesis/0.1 community artwork indexer" },
      redirect: "error",
      signal: AbortSignal.timeout(20_000),
    });
    if (!bundleResponse.ok) throw new Error(`PokéFiles application bundle returned ${bundleResponse.status}.`);
    return parsePokefilesPublicConfiguration(await bundleResponse.text());
  }

  private async fetchRows<T>(
    configuration: PokefilesPublicConfiguration,
    table: "pokemon_cards" | "pokemon_sets",
    select: string,
    maximumRows: number,
  ): Promise<T[]> {
    const base = new URL(configuration.supabaseUrl);
    if (base.protocol !== "https:" || !/^[a-z0-9]+\.supabase\.co$/.test(base.hostname)) {
      throw new Error("PokéFiles public database origin was invalid.");
    }
    const rows: T[] = [];
    for (let offset = 0; offset < maximumRows; offset += this.pageSize) {
      const url = new URL(`/rest/v1/${table}`, base);
      url.searchParams.set("select", select);
      url.searchParams.set("order", "id.asc");
      const response = await this.fetcher(url, {
        headers: {
          Accept: "application/json",
          apikey: configuration.anonKey,
          Range: `${offset}-${offset + this.pageSize - 1}`,
          "User-Agent": "Phronesis/0.1 community artwork indexer",
        },
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`PokéFiles ${table} page returned ${response.status}.`);
      const page = await response.json() as unknown;
      if (!Array.isArray(page)) throw new Error(`PokéFiles ${table} page was not an array.`);
      rows.push(...page as T[]);
      if (page.length < this.pageSize) return rows;
    }
    throw new Error(`PokéFiles ${table} exceeded the configured safety ceiling.`);
  }
}
