import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  calculateArbitrage,
  crossMarketIdentityKey,
  normalizeRegionalVariant,
  type ArbitrageDirection,
  type RegionalCostProfile,
  type RegionalMarketEvidence,
} from "@/lib/regional/domain";

type Sql = Record<string, string | number | null>;

export type CrosswalkReport = {
  sourceRunId: string;
  sourceHash: string;
  pricingFingerprint: string;
  total: number;
  matched: number;
  unmatched: number;
  ambiguous: number;
  unsupportedVariant: number;
};

export type ArbitrageCandidate = {
  id: string;
  categoryId: string;
  sku: string;
  name: string;
  setName: string;
  collectorNumber: string;
  variant: string;
  direction: ArbitrageDirection;
  usPriceUsd: number;
  brazilPriceBrl: number;
  state: string;
  blocker: string | null;
  netProfit: number | null;
  roiPercent: number | null;
  evidenceObservedAt: string;
  availabilityVerifiedAt: string | null;
};

export class RegionalIntelligenceRepository {
  constructor(readonly database: DatabaseSync) {
    this.migrate();
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS regional_crosswalk (
        liga_identity_key TEXT PRIMARY KEY,
        category_id TEXT,
        sku TEXT,
        status TEXT NOT NULL CHECK(status IN ('MATCHED','UNMATCHED','AMBIGUOUS','UNSUPPORTED_VARIANT')),
        method TEXT NOT NULL,
        reason TEXT NOT NULL,
        source_run_id TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        pricing_fingerprint TEXT NOT NULL,
        reconciled_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS regional_crosswalk_product ON regional_crosswalk(category_id, sku, status);
      CREATE TABLE IF NOT EXISTS regional_evidence (
        liga_identity_key TEXT PRIMARY KEY,
        card_name TEXT NOT NULL,
        edition_name TEXT NOT NULL,
        edition_code TEXT NOT NULL,
        collector_number TEXT NOT NULL,
        variant TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        consumer_low_centavos INTEGER,
        consumer_average_centavos INTEGER,
        consumer_high_centavos INTEGER,
        store_buy_low_centavos INTEGER,
        store_buy_average_centavos INTEGER,
        store_buy_high_centavos INTEGER,
        FOREIGN KEY(liga_identity_key) REFERENCES regional_crosswalk(liga_identity_key) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS regional_cost_profile (
        id INTEGER PRIMARY KEY CHECK(id = 1),
        brl_per_usd REAL,
        fx_observed_at TEXT,
        fx_source TEXT,
        us_to_brazil_fixed_brl REAL,
        us_to_brazil_percent REAL,
        brazil_to_us_fixed_usd REAL,
        brazil_to_us_percent REAL,
        updated_at TEXT
      );
      INSERT OR IGNORE INTO regional_cost_profile(id) VALUES(1);
      CREATE TABLE IF NOT EXISTS regional_availability_verification (
        id TEXT PRIMARY KEY,
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        direction TEXT NOT NULL CHECK(direction IN ('US_TO_BRAZIL','BRAZIL_TO_US')),
        executable_price REAL NOT NULL CHECK(executable_price > 0),
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        counterparty_label TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        notes TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS regional_verification_product ON regional_availability_verification(category_id, sku, direction, observed_at DESC);
    `);
  }

  getProfile(): RegionalCostProfile {
    const row = this.database
      .prepare("SELECT * FROM regional_cost_profile WHERE id = 1")
      .get() as Sql;
    return {
      brlPerUsd: numberOrNull(row.brl_per_usd),
      fxObservedAt: stringOrNull(row.fx_observed_at),
      fxSource: stringOrNull(row.fx_source),
      usToBrazilFixedBrl: numberOrNull(row.us_to_brazil_fixed_brl),
      usToBrazilPercent: numberOrNull(row.us_to_brazil_percent),
      brazilToUsFixedUsd: numberOrNull(row.brazil_to_us_fixed_usd),
      brazilToUsPercent: numberOrNull(row.brazil_to_us_percent),
      updatedAt: stringOrNull(row.updated_at),
    };
  }

  updateProfile(profile: RegionalCostProfile): RegionalCostProfile {
    validateProfile(profile);
    const updatedAt = new Date().toISOString();
    this.database
      .prepare(
        `UPDATE regional_cost_profile SET brl_per_usd=?, fx_observed_at=?, fx_source=?, us_to_brazil_fixed_brl=?, us_to_brazil_percent=?, brazil_to_us_fixed_usd=?, brazil_to_us_percent=?, updated_at=? WHERE id=1`,
      )
      .run(
        profile.brlPerUsd,
        profile.fxObservedAt,
        profile.fxSource,
        profile.usToBrazilFixedBrl,
        profile.usToBrazilPercent,
        profile.brazilToUsFixedUsd,
        profile.brazilToUsPercent,
        updatedAt,
      );
    return this.getProfile();
  }

  evidenceFor(categoryId: string, sku: string): RegionalMarketEvidence | null {
    const row = this.database
      .prepare(
        `SELECT e.*, c.category_id, c.sku FROM regional_crosswalk c JOIN regional_evidence e USING(liga_identity_key) WHERE c.status='MATCHED' AND c.category_id=? AND c.sku=?`,
      )
      .get(categoryId, sku) as Sql | undefined;
    if (!row) return null;
    return evidenceDto(row);
  }

  buildCrosswalk(
    ligaDatabasePath: string,
    manifestPath: string,
  ): CrosswalkReport {
    if (!existsSync(ligaDatabasePath) || !existsSync(manifestPath))
      throw new Error("Verified LigaMagic snapshot files were not found.");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      runId: string;
      completedAt: string;
      databaseFile: string;
    };
    const sourceHash = hashFile(ligaDatabasePath);
    const pricingFingerprint = this.pricingFingerprint();
    const productIndex = new Map<
      string,
      Array<{ categoryId: string; sku: string }>
    >();
    for (const row of this.database
      .prepare(
        `SELECT category_id, sku, name, set_name, collector_number, variant FROM pricing_products WHERE category_id='magic-en' AND product_type='SINGLE'`,
      )
      .all() as Sql[]) {
      const key = crossMarketIdentityKey({
        name: String(row.name),
        edition: String(row.set_name),
        collectorNumber: String(row.collector_number ?? ""),
        variant: String(row.variant),
      });
      if (!key) continue;
      const candidate = {
        categoryId: String(row.category_id),
        sku: String(row.sku),
      };
      productIndex.set(key, [...(productIndex.get(key) ?? []), candidate]);
    }
    const liga = new DatabaseSync(ligaDatabasePath);
    liga.exec("PRAGMA query_only = ON");
    const insertCrosswalk = this.database.prepare(
      `INSERT INTO regional_crosswalk(liga_identity_key,category_id,sku,status,method,reason,source_run_id,source_hash,pricing_fingerprint,reconciled_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    );
    const insertEvidence = this.database.prepare(
      `INSERT INTO regional_evidence(liga_identity_key,card_name,edition_name,edition_code,collector_number,variant,observed_at,consumer_low_centavos,consumer_average_centavos,consumer_high_centavos,store_buy_low_centavos,store_buy_average_centavos,store_buy_high_centavos) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    );
    const counts = {
      total: 0,
      matched: 0,
      unmatched: 0,
      ambiguous: 0,
      unsupportedVariant: 0,
    };
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.exec(
        "DELETE FROM regional_evidence; DELETE FROM regional_crosswalk;",
      );
      for (const row of liga
        .prepare("SELECT * FROM ligamagic_price ORDER BY identity_key")
        .all() as Sql[]) {
        counts.total += 1;
        const variant = normalizeRegionalVariant(String(row.extras));
        const key = variant
          ? crossMarketIdentityKey({
              name: String(row.card_en),
              edition: String(row.edition_en),
              collectorNumber: String(row.collector_number),
              variant,
            })
          : null;
        const candidates = key ? (productIndex.get(key) ?? []) : [];
        const status = !variant
          ? "UNSUPPORTED_VARIANT"
          : candidates.length === 1
            ? "MATCHED"
            : candidates.length > 1
              ? "AMBIGUOUS"
              : "UNMATCHED";
        if (status === "MATCHED") counts.matched += 1;
        else if (status === "AMBIGUOUS") counts.ambiguous += 1;
        else if (status === "UNSUPPORTED_VARIANT")
          counts.unsupportedVariant += 1;
        else counts.unmatched += 1;
        const candidate = candidates.length === 1 ? candidates[0] : null;
        insertCrosswalk.run(
          row.identity_key,
          candidate?.categoryId ?? null,
          candidate?.sku ?? null,
          status,
          "EXACT_NAME_EDITION_COLLECTOR_VARIANT_V1",
          status === "MATCHED"
            ? "Unique exact normalized identity."
            : !variant
              ? "LigaMagic variant is quarantined."
              : candidates.length > 1
                ? "More than one canonical product shares the exact key."
                : "No exact canonical product.",
          manifest.runId,
          sourceHash,
          pricingFingerprint,
          new Date().toISOString(),
        );
        insertEvidence.run(
          row.identity_key,
          row.card_en,
          row.edition_en,
          row.edition_code,
          row.collector_number,
          variant ?? String(row.extras),
          manifest.completedAt,
          nullablePrice(row.consumer_low_centavos),
          nullablePrice(row.consumer_average_centavos),
          nullablePrice(row.consumer_high_centavos),
          nullablePrice(row.store_buy_low_centavos),
          nullablePrice(row.store_buy_average_centavos),
          nullablePrice(row.store_buy_high_centavos),
        );
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    } finally {
      liga.close();
    }
    return {
      sourceRunId: manifest.runId,
      sourceHash,
      pricingFingerprint,
      ...counts,
    };
  }

  listCandidates(limit = 100): ArbitrageCandidate[] {
    const profile = this.getProfile();
    const rows = this.database
      .prepare(
        `
      SELECT c.category_id,c.sku,p.name,p.set_name,p.collector_number,p.variant,e.*,
        COALESCE(l.delivered_price_cents,l.market_price_cents) us_price_cents,
        l.snapshot_date us_observed_at
      FROM regional_crosswalk c JOIN regional_evidence e USING(liga_identity_key)
      JOIN pricing_products p ON p.category_id=c.category_id AND p.sku=c.sku
      JOIN pricing_latest l ON l.category_id=c.category_id AND l.sku=c.sku
      WHERE c.status='MATCHED' AND l.condition_key='NEAR_MINT' AND COALESCE(l.delivered_price_cents,l.market_price_cents)>0
        AND e.consumer_low_centavos>0
      ORDER BY e.consumer_low_centavos DESC LIMIT 2000`,
      )
      .all() as Sql[];
    const candidates: ArbitrageCandidate[] = [];
    const latestVerification = this.database.prepare(
      `SELECT executable_price, observed_at FROM regional_availability_verification
       WHERE category_id=? AND sku=? AND direction=?
       ORDER BY observed_at DESC, created_at DESC LIMIT 1`,
    );
    for (const row of rows) {
      for (const direction of ["US_TO_BRAZIL", "BRAZIL_TO_US"] as const) {
        const verification = latestVerification.get(
          row.category_id,
          row.sku,
          direction,
        ) as Sql | undefined;
        const verifiedAt = verification ? String(verification.observed_at) : null;
        const verified = Boolean(
          verifiedAt && Date.now() - Date.parse(verifiedAt) <= 24 * 3_600_000,
        );
        const observedUsPrice = Number(row.us_price_cents) / 100;
        const observedBrazilPrice = Number(row.consumer_low_centavos) / 100;
        const usPriceUsd =
          direction === "US_TO_BRAZIL" && verified
            ? Number(verification?.executable_price)
            : observedUsPrice;
        const brazilPriceBrl =
          direction === "BRAZIL_TO_US" && verified
            ? Number(verification?.executable_price)
            : observedBrazilPrice;
        const result = calculateArbitrage({
          direction,
          profile,
          usPriceUsd,
          brazilPriceBrl,
          identityVerified: true,
          sourcesFresh:
            fresh(String(row.observed_at)) && fresh(String(row.us_observed_at)),
          availabilityVerified: verified,
        });
        candidates.push({
          id: `${row.category_id}:${row.sku}:${direction}`,
          categoryId: String(row.category_id),
          sku: String(row.sku),
          name: String(row.name),
          setName: String(row.set_name),
          collectorNumber: String(row.collector_number ?? ""),
          variant: String(row.variant),
          direction,
          usPriceUsd,
          brazilPriceBrl,
          state: result.state,
          blocker: result.blocker,
          netProfit: result.netProfit,
          roiPercent: result.roiPercent,
          evidenceObservedAt: String(row.observed_at),
          availabilityVerifiedAt: verified ? verifiedAt : null,
        });
      }
    }
    return candidates
      .sort((a, b) => (b.netProfit ?? -Infinity) - (a.netProfit ?? -Infinity))
      .slice(0, limit);
  }

  verifyAvailability(input: {
    categoryId: string;
    sku: string;
    direction: ArbitrageDirection;
    executablePrice: number;
    quantity: number;
    counterpartyLabel: string;
    observedAt: string;
    notes: string;
  }): string {
    if (
      !(input.executablePrice > 0) ||
      !Number.isInteger(input.quantity) ||
      input.quantity < 1 ||
      !input.counterpartyLabel.trim() ||
      Number.isNaN(Date.parse(input.observedAt))
    )
      throw new Error(
        "Complete executable price, quantity, counterparty, and observation time are required.",
      );
    const candidate = this.listCandidates(200).find(
      (item) =>
        item.categoryId === input.categoryId &&
        item.sku === input.sku &&
        item.direction === input.direction,
    );
    if (!candidate || !["COSTED", "ACTIONABLE"].includes(candidate.state)) {
      throw new Error(
        "Complete fresh identity, FX, and direction-specific costs before verifying availability.",
      );
    }
    const id = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    this.database
      .prepare(
        `INSERT OR IGNORE INTO regional_availability_verification(id,category_id,sku,direction,executable_price,quantity,counterparty_label,observed_at,notes,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
      )
      .run(
        id,
        input.categoryId,
        input.sku,
        input.direction,
        input.executablePrice,
        input.quantity,
        input.counterpartyLabel.trim(),
        input.observedAt,
        input.notes.trim(),
        new Date().toISOString(),
      );
    return id;
  }

  private pricingFingerprint(): string {
    const rows = this.database
      .prepare(
        "SELECT category_id,snapshot_date,source_hash FROM pricing_category_state ORDER BY category_id",
      )
      .all() as Sql[];
    return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  }
}

export function discoverLatestLigaSnapshot(
  root = resolve(".data/ligamagic/runs"),
): { databasePath: string; manifestPath: string } {
  const candidates = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("dry-run-"))
    .map((entry) => join(root, entry.name))
    .sort()
    .reverse();
  for (const directory of candidates) {
    const manifestPath = join(directory, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      status: string;
      databaseFile: string;
    };
    const databasePath = join(directory, manifest.databaseFile);
    if (manifest.status === "DRY_RUN_COMPLETE" && existsSync(databasePath))
      return { databasePath, manifestPath };
  }
  throw new Error("No complete LigaMagic dry-run snapshot was found.");
}

function evidenceDto(row: Sql): RegionalMarketEvidence {
  return {
    ligaIdentityKey: String(row.liga_identity_key),
    categoryId: String(row.category_id),
    sku: String(row.sku),
    cardName: String(row.card_name),
    editionName: String(row.edition_name),
    editionCode: String(row.edition_code),
    collectorNumber: String(row.collector_number),
    variant: String(row.variant),
    observedAt: String(row.observed_at),
    consumerLowCentavos: numberOrNull(row.consumer_low_centavos),
    consumerAverageCentavos: numberOrNull(row.consumer_average_centavos),
    consumerHighCentavos: numberOrNull(row.consumer_high_centavos),
    storeBuyLowCentavos: numberOrNull(row.store_buy_low_centavos),
    storeBuyAverageCentavos: numberOrNull(row.store_buy_average_centavos),
    storeBuyHighCentavos: numberOrNull(row.store_buy_high_centavos),
  };
}
function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}
function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function nullablePrice(value: unknown): number | null {
  const parsed = numberOrNull(value);
  return parsed && parsed > 0 ? parsed : null;
}
function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
function fresh(value: string): boolean {
  return (
    !Number.isNaN(Date.parse(value)) &&
    Date.now() - Date.parse(value) <= 7 * 86_400_000
  );
}
function validateProfile(profile: RegionalCostProfile): void {
  for (const value of [
    profile.usToBrazilFixedBrl,
    profile.usToBrazilPercent,
    profile.brazilToUsFixedUsd,
    profile.brazilToUsPercent,
  ])
    if (value !== null && (!Number.isFinite(value) || value < 0))
      throw new Error("Costs must be non-negative numbers or null.");
  if (
    profile.brlPerUsd !== null &&
    (!Number.isFinite(profile.brlPerUsd) || profile.brlPerUsd <= 0)
  )
    throw new Error("BRL per USD must be positive.");
  if (profile.fxObservedAt && Number.isNaN(Date.parse(profile.fxObservedAt)))
    throw new Error("FX observation time must be valid.");
}
