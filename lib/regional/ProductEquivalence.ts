import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

type Sql = Record<string, string | number | null>;

export type RegionalProductEquivalenceStatus =
  | "EXACT"
  | "COMPATIBLE"
  | "AMBIGUOUS"
  | "UNAVAILABLE";

export type RegionalProductEquivalenceProvider =
  | "ligamagic"
  | "ligapokemon";

export type RegionalProductEquivalenceSummary = {
  targetTotal: number;
  targetExact: number;
  targetCompatible: number;
  targetAmbiguous: number;
  targetUnavailable: number;
  targetWithLigaConsumerPrice: number;
  targetPricedCoveragePercent: number;
  targetLedgerFingerprint: string;
};

export function ensureRegionalProductEquivalenceTable(
  database: DatabaseSync,
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS regional_product_equivalence (
      category_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      provider_id TEXT NOT NULL CHECK(provider_id IN ('ligamagic','ligapokemon')),
      liga_identity_key TEXT,
      status TEXT NOT NULL CHECK(status IN ('EXACT','COMPATIBLE','AMBIGUOUS','UNAVAILABLE')),
      method TEXT NOT NULL,
      confidence INTEGER NOT NULL CHECK(confidence BETWEEN 0 AND 100),
      reason TEXT NOT NULL,
      source_run_id TEXT NOT NULL,
      source_hash TEXT NOT NULL,
      pricing_fingerprint TEXT NOT NULL,
      reconciled_at TEXT NOT NULL,
      PRIMARY KEY(category_id, sku, provider_id)
    );
    CREATE INDEX IF NOT EXISTS regional_product_equivalence_source
      ON regional_product_equivalence(provider_id, liga_identity_key, status);
    CREATE INDEX IF NOT EXISTS regional_product_equivalence_status
      ON regional_product_equivalence(provider_id, category_id, status);
  `);
}

export function regionalProductEquivalenceSummary(
  database: DatabaseSync,
  input: {
    providerId: RegionalProductEquivalenceProvider;
    categoryId: string;
    evidenceTable: "regional_evidence" | "regional_pokemon_evidence";
  },
): RegionalProductEquivalenceSummary {
  const counts = database
    .prepare(
      `SELECT COUNT(*) target_total,
        SUM(status='EXACT') target_exact,
        SUM(status='COMPATIBLE') target_compatible,
        SUM(status='AMBIGUOUS') target_ambiguous,
        SUM(status='UNAVAILABLE') target_unavailable
      FROM regional_product_equivalence
      WHERE provider_id=? AND category_id=?`,
    )
    .get(input.providerId, input.categoryId) as Sql;
  const priced = database
    .prepare(
      `SELECT COUNT(*) priced
      FROM regional_product_equivalence q
      JOIN ${input.evidenceTable} e
        ON e.liga_identity_key=q.liga_identity_key
      WHERE q.provider_id=? AND q.category_id=?
        AND q.status IN ('EXACT','COMPATIBLE')
        AND COALESCE(
          e.consumer_low_centavos,e.consumer_average_centavos,
          e.consumer_high_centavos,0
        )>0`,
    )
    .get(input.providerId, input.categoryId) as Sql;
  const targetTotal = numeric(counts.target_total);
  const targetWithLigaConsumerPrice = numeric(priced.priced);
  return {
    targetTotal,
    targetExact: numeric(counts.target_exact),
    targetCompatible: numeric(counts.target_compatible),
    targetAmbiguous: numeric(counts.target_ambiguous),
    targetUnavailable: numeric(counts.target_unavailable),
    targetWithLigaConsumerPrice,
    targetPricedCoveragePercent: percent(
      targetWithLigaConsumerPrice,
      targetTotal,
    ),
    targetLedgerFingerprint: regionalProductEquivalenceFingerprint(
      database,
      input.providerId,
      input.categoryId,
    ),
  };
}

export function regionalProductEquivalenceFingerprint(
  database: DatabaseSync,
  providerId: RegionalProductEquivalenceProvider,
  categoryId: string,
): string {
  const hash = createHash("sha256");
  const rows = database
    .prepare(
      `SELECT category_id,sku,provider_id,COALESCE(liga_identity_key,'') liga_identity_key,
        status,method,confidence,source_run_id,source_hash,pricing_fingerprint
      FROM regional_product_equivalence
      WHERE provider_id=? AND category_id=?
      ORDER BY category_id,sku,provider_id`,
    )
    .all(providerId, categoryId) as Sql[];
  for (const row of rows) {
    hash
      .update(
        [
          row.category_id,
          row.sku,
          row.provider_id,
          row.liga_identity_key,
          row.status,
          row.method,
          row.confidence,
          row.source_run_id,
          row.source_hash,
          row.pricing_fingerprint,
        ].join("|"),
      )
      .update("\n");
  }
  return hash.digest("hex");
}

function numeric(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(2))
    : 0;
}
