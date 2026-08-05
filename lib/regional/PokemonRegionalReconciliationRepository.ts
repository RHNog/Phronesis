import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  ligaPokemonEnglishSetScope,
  ligaPokemonExactVariant,
  pokemonCrossMarketIdentityKey,
} from "@/lib/pricing/pokemonIdentity";

type Sql = Record<string, string | number | null>;

export type PokemonCrosswalkReport = {
  sourceRunId: string;
  sourceHash: string;
  pricingFingerprint: string;
  total: number;
  matched: number;
  unmatched: number;
  ambiguous: number;
  unsupportedVariant: number;
  unsupportedMarketScope: number;
  targetCollisionQuarantined: number;
  matchedCoveragePercent: number;
  matchedWithLigaConsumerPrice: number;
  matchedWithTcgNearMintPrice: number;
  comparableBoth: number;
  comparableCoveragePercent: number;
  crosswalkFingerprint: string;
  topUnmatchedSets: Array<{
    setName: string;
    count: number;
    withConsumerPrice: number;
  }>;
};

export class PokemonRegionalReconciliationRepository {
  constructor(readonly database: DatabaseSync) {
    this.migrate();
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS regional_pokemon_crosswalk (
        liga_identity_key TEXT PRIMARY KEY,
        category_id TEXT,
        sku TEXT,
        status TEXT NOT NULL CHECK(status IN (
          'MATCHED','UNMATCHED','AMBIGUOUS','UNSUPPORTED_VARIANT','UNSUPPORTED_MARKET_SCOPE'
        )),
        method TEXT NOT NULL,
        reason TEXT NOT NULL,
        source_run_id TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        pricing_fingerprint TEXT NOT NULL,
        reconciled_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS regional_pokemon_crosswalk_product
        ON regional_pokemon_crosswalk(category_id, sku, status);
      CREATE TABLE IF NOT EXISTS regional_pokemon_evidence (
        liga_identity_key TEXT PRIMARY KEY,
        card_name TEXT NOT NULL,
        set_name TEXT NOT NULL,
        set_code TEXT NOT NULL,
        collector_number TEXT NOT NULL,
        variant TEXT NOT NULL,
        condition_key TEXT NOT NULL,
        language TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        consumer_low_centavos INTEGER,
        consumer_average_centavos INTEGER,
        consumer_high_centavos INTEGER,
        store_buy_low_centavos INTEGER,
        store_buy_average_centavos INTEGER,
        store_buy_high_centavos INTEGER,
        FOREIGN KEY(liga_identity_key)
          REFERENCES regional_pokemon_crosswalk(liga_identity_key)
          ON DELETE CASCADE
      );
    `);
  }

  buildCrosswalk(
    snapshotDatabasePath: string,
    manifestPath: string,
  ): PokemonCrosswalkReport {
    if (!existsSync(snapshotDatabasePath) || !existsSync(manifestPath)) {
      throw new Error("Verified LigaPokemon snapshot files were not found.");
    }
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      runId?: unknown;
      status?: unknown;
      completedAt?: unknown;
      databaseFile?: unknown;
      contractVersion?: unknown;
      uniqueIdentities?: unknown;
      conflictingDuplicates?: unknown;
    };
    if (
      manifest.status !== "DRY_RUN_COMPLETE" ||
      typeof manifest.runId !== "string" ||
      typeof manifest.completedAt !== "string" ||
      typeof manifest.databaseFile !== "string" ||
      typeof manifest.contractVersion !== "string" ||
      typeof manifest.uniqueIdentities !== "number" ||
      manifest.conflictingDuplicates !== 0
    ) {
      throw new Error(
        "LigaPokemon reconciliation requires a complete snapshot manifest.",
      );
    }
    if (
      resolve(snapshotDatabasePath) !==
      resolve(dirname(manifestPath), manifest.databaseFile)
    ) {
      throw new Error(
        "LigaPokemon snapshot database does not match the complete manifest receipt.",
      );
    }
    const sourceHash = hashFile(snapshotDatabasePath);
    const pricingFingerprint = this.pricingFingerprint();
    const targetIndex = new Map<
      string,
      Array<{ categoryId: string; sku: string }>
    >();
    const targetRows = this.database
      .prepare(
        `
        SELECT category_id,sku,name,set_name,collector_number,variant
        FROM pricing_products
        WHERE category_id='pokemon-en' AND product_type='SINGLE'
          AND language='English'
        ORDER BY sku
      `,
      )
      .all() as Sql[];
    for (const row of targetRows) {
      const key = pokemonCrossMarketIdentityKey({
        name: String(row.name),
        setName: String(row.set_name),
        collectorNumber: stringOrNull(row.collector_number),
        variant: String(row.variant),
      });
      if (!key) continue;
      targetIndex.set(key, [
        ...(targetIndex.get(key) ?? []),
        { categoryId: String(row.category_id), sku: String(row.sku) },
      ]);
    }

    const source = new DatabaseSync(snapshotDatabasePath);
    source.exec("PRAGMA query_only = ON");
    const sourceRows = source
      .prepare("SELECT * FROM ligapokemon_price ORDER BY identity_key")
      .all() as Sql[];
    source.close();
    if (sourceRows.length !== manifest.uniqueIdentities) {
      throw new Error(
        "LigaPokemon snapshot row count does not match the complete manifest receipt.",
      );
    }

    const insertCrosswalk = this.database.prepare(`
      INSERT INTO regional_pokemon_crosswalk(
        liga_identity_key,category_id,sku,status,method,reason,
        source_run_id,source_hash,pricing_fingerprint,reconciled_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?)
    `);
    const insertEvidence = this.database.prepare(`
      INSERT INTO regional_pokemon_evidence(
        liga_identity_key,card_name,set_name,set_code,collector_number,variant,
        condition_key,language,observed_at,consumer_low_centavos,
        consumer_average_centavos,consumer_high_centavos,store_buy_low_centavos,
        store_buy_average_centavos,store_buy_high_centavos
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);
    const reconciledAt = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.exec(`
        DELETE FROM regional_pokemon_evidence;
        DELETE FROM regional_pokemon_crosswalk;
      `);
      for (const row of sourceRows) {
        const sourceVariant = String(row.extras);
        const variant = ligaPokemonExactVariant(sourceVariant);
        const marketScopeSupported =
          String(row.condition) === "NM" &&
          String(row.language) === "EN" &&
          ligaPokemonEnglishSetScope(String(row.edition_en));
        const key = variant
          ? pokemonCrossMarketIdentityKey({
              name: String(row.card_en),
              setName: String(row.edition_en),
              collectorNumber: String(row.collector_number),
              variant,
            })
          : null;
        const candidates = key ? (targetIndex.get(key) ?? []) : [];
        const status = !marketScopeSupported
          ? "UNSUPPORTED_MARKET_SCOPE"
          : !variant
            ? "UNSUPPORTED_VARIANT"
            : candidates.length === 1
              ? "MATCHED"
              : candidates.length > 1
                ? "AMBIGUOUS"
                : "UNMATCHED";
        const candidate = status === "MATCHED" ? candidates[0] : null;
        const method =
          status === "MATCHED"
            ? "EXACT_POKEMON_NAME_SET_COLLECTOR_FINISH_V1"
            : status === "AMBIGUOUS"
              ? "AMBIGUOUS_EXACT_POKEMON_IDENTITY_V1"
              : status === "UNSUPPORTED_VARIANT"
                ? "QUARANTINED_UNSUPPORTED_POKEMON_VARIANT_V1"
                : status === "UNSUPPORTED_MARKET_SCOPE"
                  ? "QUARANTINED_UNSUPPORTED_POKEMON_MARKET_SCOPE_V1"
                  : "UNMATCHED_EXACT_POKEMON_IDENTITY_V1";
        const reason =
          status === "MATCHED"
            ? "Unique exact English Pokémon name, bounded set identity, collector numerator, and physical finish."
            : status === "AMBIGUOUS"
              ? "More than one English Pokémon catalogue product shares the exact normalized identity."
              : status === "UNSUPPORTED_VARIANT"
                ? "LigaPokemon treatment is not admitted by the exact Normal, Holofoil, or Reverse Holofoil policy."
                : status === "UNSUPPORTED_MARKET_SCOPE"
                  ? "LigaPokemon row is outside the English Near Mint reconciliation scope."
                  : "No English Pokémon catalogue product shares the complete exact identity.";
        insertCrosswalk.run(
          String(row.identity_key),
          candidate?.categoryId ?? null,
          candidate?.sku ?? null,
          status,
          method,
          reason,
          manifest.runId,
          sourceHash,
          pricingFingerprint,
          reconciledAt,
        );
        insertEvidence.run(
          String(row.identity_key),
          String(row.card_en),
          String(row.edition_en),
          String(row.edition_code),
          String(row.collector_number),
          variant ?? sourceVariant,
          String(row.condition),
          String(row.language),
          manifest.completedAt,
          positiveIntegerOrNull(row.consumer_low_centavos),
          positiveIntegerOrNull(row.consumer_average_centavos),
          positiveIntegerOrNull(row.consumer_high_centavos),
          positiveIntegerOrNull(row.store_buy_low_centavos),
          positiveIntegerOrNull(row.store_buy_average_centavos),
          positiveIntegerOrNull(row.store_buy_high_centavos),
        );
      }
      const collisions = this.database
        .prepare(
          `
        SELECT category_id,sku
        FROM regional_pokemon_crosswalk
        WHERE status='MATCHED'
        GROUP BY category_id,sku HAVING COUNT(*) > 1
      `,
        )
        .all() as Sql[];
      const quarantine = this.database.prepare(`
        UPDATE regional_pokemon_crosswalk
        SET status='AMBIGUOUS',
          method='TARGET_COLLISION_QUARANTINE_V1',
          reason='More than one LigaPokemon identity resolves to this Pokémon TCGplayer SKU; the complete collision group is quarantined.'
        WHERE status='MATCHED' AND category_id=? AND sku=?
      `);
      for (const collision of collisions) {
        quarantine.run(collision.category_id, collision.sku);
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.report({
      sourceRunId: manifest.runId,
      sourceHash,
      pricingFingerprint,
    });
  }

  private report(input: {
    sourceRunId: string;
    sourceHash: string;
    pricingFingerprint: string;
  }): PokemonCrosswalkReport {
    const counts = this.database
      .prepare(
        `
      SELECT COUNT(*) total,
        SUM(status='MATCHED') matched,
        SUM(status='UNMATCHED') unmatched,
        SUM(status='AMBIGUOUS') ambiguous,
        SUM(status='UNSUPPORTED_VARIANT') unsupported_variant,
        SUM(status='UNSUPPORTED_MARKET_SCOPE') unsupported_market_scope,
        SUM(method='TARGET_COLLISION_QUARANTINE_V1') target_collisions
      FROM regional_pokemon_crosswalk
    `,
      )
      .get() as Sql;
    const prices = this.database
      .prepare(
        `
      SELECT
        SUM(CASE WHEN c.status='MATCHED' AND e.consumer_low_centavos>0 THEN 1 ELSE 0 END) matched_liga,
        SUM(CASE WHEN c.status='MATCHED' AND EXISTS(
          SELECT 1 FROM pricing_latest latest
          WHERE latest.category_id=c.category_id AND latest.sku=c.sku
            AND latest.condition_key='NEAR_MINT'
            AND COALESCE(NULLIF(latest.delivered_price_cents,0),
              NULLIF(latest.listing_price_cents,0),
              NULLIF(latest.market_price_cents,0))>0
        ) THEN 1 ELSE 0 END) matched_tcg,
        SUM(CASE WHEN c.status='MATCHED' AND e.consumer_low_centavos>0 AND EXISTS(
          SELECT 1 FROM pricing_latest latest
          WHERE latest.category_id=c.category_id AND latest.sku=c.sku
            AND latest.condition_key='NEAR_MINT'
            AND COALESCE(NULLIF(latest.delivered_price_cents,0),
              NULLIF(latest.listing_price_cents,0),
              NULLIF(latest.market_price_cents,0))>0
        ) THEN 1 ELSE 0 END) comparable
      FROM regional_pokemon_crosswalk c
      JOIN regional_pokemon_evidence e USING(liga_identity_key)
    `,
      )
      .get() as Sql;
    const total = numeric(counts.total);
    const matched = numeric(counts.matched);
    const comparableBoth = numeric(prices.comparable);
    return {
      ...input,
      total,
      matched,
      unmatched: numeric(counts.unmatched),
      ambiguous: numeric(counts.ambiguous),
      unsupportedVariant: numeric(counts.unsupported_variant),
      unsupportedMarketScope: numeric(counts.unsupported_market_scope),
      targetCollisionQuarantined: numeric(counts.target_collisions),
      matchedCoveragePercent: percent(matched, total),
      matchedWithLigaConsumerPrice: numeric(prices.matched_liga),
      matchedWithTcgNearMintPrice: numeric(prices.matched_tcg),
      comparableBoth,
      comparableCoveragePercent: percent(comparableBoth, matched),
      crosswalkFingerprint: this.crosswalkFingerprint(),
      topUnmatchedSets: (
        this.database
          .prepare(
            `
        SELECT e.set_name,COUNT(*) count,
          SUM(CASE WHEN e.consumer_low_centavos>0 THEN 1 ELSE 0 END) priced
        FROM regional_pokemon_crosswalk c
        JOIN regional_pokemon_evidence e USING(liga_identity_key)
        WHERE c.status='UNMATCHED'
        GROUP BY e.set_name ORDER BY count DESC,e.set_name LIMIT 25
      `,
          )
          .all() as Sql[]
      ).map((row) => ({
        setName: String(row.set_name),
        count: numeric(row.count),
        withConsumerPrice: numeric(row.priced),
      })),
    };
  }

  private pricingFingerprint(): string {
    const rows = this.database
      .prepare(
        `
      SELECT category_id,snapshot_date,source_hash
      FROM pricing_category_state WHERE category_id='pokemon-en'
      ORDER BY category_id
    `,
      )
      .all();
    return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
  }

  private crosswalkFingerprint(): string {
    const hash = createHash("sha256");
    const rows = this.database
      .prepare(
        `
      SELECT liga_identity_key,status,category_id,sku,method
      FROM regional_pokemon_crosswalk ORDER BY liga_identity_key
    `,
      )
      .all() as Sql[];
    for (const row of rows) {
      hash
        .update(
          [
            row.liga_identity_key,
            row.status,
            row.category_id ?? "",
            row.sku ?? "",
            row.method,
          ].join("|"),
        )
        .update("\n");
    }
    return hash.digest("hex");
  }
}

function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function positiveIntegerOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function numeric(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0
    ? Number(((numerator / denominator) * 100).toFixed(2))
    : 0;
}
