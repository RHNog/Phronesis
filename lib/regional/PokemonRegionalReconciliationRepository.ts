import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  ligaPokemonEnglishSetScope,
  ligaPokemonExactVariant,
  pokemonCardNameIdentity,
  pokemonCollectorIdentity,
  pokemonCrossMarketIdentityKey,
  pokemonMaterialTreatmentIdentity,
  pokemonSetIdentity,
  pokemonSetLabelsStructurallyCompatible,
} from "@/lib/pricing/pokemonIdentity";
import {
  ensureRegionalProductEquivalenceTable,
  regionalProductEquivalenceSummary,
  type RegionalProductEquivalenceStatus,
} from "@/lib/regional/ProductEquivalence";

type Sql = Record<string, string | number | null>;

type PokemonSourceCandidate = {
  ligaIdentityKey: string;
  nameIdentity: string;
  setIdentity: string;
  sourceSetName: string;
  collectorIdentity: string;
  variant: "Normal" | "Holofoil" | "Reverse Holofoil";
  materialTreatmentIdentity: string;
  evidenceSignature: string;
};

type PokemonEquivalenceDecision = {
  ligaIdentityKey: string | null;
  status: RegionalProductEquivalenceStatus;
  method: string;
  confidence: number;
  reason: string;
};

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
  targetTotal: number;
  targetExact: number;
  targetCompatible: number;
  targetAmbiguous: number;
  targetUnavailable: number;
  targetWithLigaConsumerPrice: number;
  targetPricedCoveragePercent: number;
  targetLedgerFingerprint: string;
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
    ensureRegionalProductEquivalenceTable(this.database);
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
    const allTargetRows = this.database
      .prepare(
        `
        SELECT category_id,sku,product_type,name,set_name,collector_number,
          variant,language
        FROM pricing_products
        WHERE category_id='pokemon-en'
        ORDER BY sku
      `,
      )
      .all() as Sql[];
    const targetRows = allTargetRows.filter(
      (row) =>
        String(row.product_type) === "SINGLE" &&
        String(row.language) === "English",
    );
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

    const sourceCandidates = sourceRows
      .map(pokemonSourceCandidate)
      .filter((candidate): candidate is PokemonSourceCandidate => Boolean(candidate));
    const sourceByIdentity = new Map(
      sourceCandidates.map((candidate) => [candidate.ligaIdentityKey, candidate]),
    );
    const fullIdentityIndex = indexPokemonCandidates(
      sourceCandidates,
      (candidate) =>
        [
          candidate.nameIdentity,
          candidate.setIdentity,
          candidate.collectorIdentity,
          candidate.variant,
        ].join("|"),
    );
    const setCollectorVariantIndex = indexPokemonCandidates(
      sourceCandidates,
      (candidate) =>
        [
          candidate.setIdentity,
          candidate.collectorIdentity,
          candidate.variant,
        ].join("|"),
    );
    const nameCollectorVariantIndex = indexPokemonCandidates(
      sourceCandidates,
      (candidate) =>
        [
          candidate.nameIdentity,
          candidate.collectorIdentity,
          candidate.variant,
        ].join("|"),
    );
    const nameSetCollectorIndex = indexPokemonCandidates(
      sourceCandidates,
      (candidate) =>
        [
          candidate.nameIdentity,
          candidate.setIdentity,
          candidate.collectorIdentity,
        ].join("|"),
    );
    const setCollectorIndex = indexPokemonCandidates(
      sourceCandidates,
      (candidate) =>
        [candidate.setIdentity, candidate.collectorIdentity].join("|"),
    );

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
        DELETE FROM regional_product_equivalence
          WHERE provider_id='ligapokemon' AND category_id='pokemon-en';
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
      const exactBySku = new Map<string, PokemonSourceCandidate[]>();
      const acceptedRows = this.database
        .prepare(
          `SELECT sku,liga_identity_key FROM regional_pokemon_crosswalk
          WHERE status='MATCHED' AND category_id='pokemon-en'
          ORDER BY sku,liga_identity_key`,
        )
        .all() as Sql[];
      for (const row of acceptedRows) {
        const candidate = sourceByIdentity.get(String(row.liga_identity_key));
        if (!candidate) continue;
        const sku = String(row.sku);
        exactBySku.set(sku, [...(exactBySku.get(sku) ?? []), candidate]);
      }
      const insertEquivalence = this.database.prepare(`
        INSERT INTO regional_product_equivalence(
          category_id,sku,provider_id,liga_identity_key,status,method,
          confidence,reason,source_run_id,source_hash,pricing_fingerprint,
          reconciled_at
        ) VALUES(?,?,'ligapokemon',?,?,?,?,?,?,?,?,?)
      `);
      for (const target of allTargetRows) {
        const decision = pokemonEquivalenceDecision({
          target,
          acceptedExactCandidates: exactBySku.get(String(target.sku)) ?? [],
          fullIdentityIndex,
          setCollectorVariantIndex,
          nameCollectorVariantIndex,
          nameSetCollectorIndex,
          setCollectorIndex,
        });
        insertEquivalence.run(
          String(target.category_id),
          String(target.sku),
          decision.ligaIdentityKey,
          decision.status,
          decision.method,
          decision.confidence,
          decision.reason,
          manifest.runId,
          sourceHash,
          pricingFingerprint,
          reconciledAt,
        );
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
      ...regionalProductEquivalenceSummary(this.database, {
        providerId: "ligapokemon",
        categoryId: "pokemon-en",
        evidenceTable: "regional_pokemon_evidence",
      }),
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

function pokemonSourceCandidate(row: Sql): PokemonSourceCandidate | null {
  const variant = ligaPokemonExactVariant(String(row.extras));
  if (
    !variant ||
    String(row.condition) !== "NM" ||
    String(row.language) !== "EN" ||
    !ligaPokemonEnglishSetScope(String(row.edition_en))
  ) {
    return null;
  }
  const collectorIdentity = pokemonCollectorIdentity(
    String(row.collector_number),
  );
  const nameIdentity = pokemonCardNameIdentity({
    name: String(row.card_en),
    collectorNumber: String(row.collector_number),
  });
  const setIdentity = pokemonSetIdentity(String(row.edition_en));
  if (!collectorIdentity || !nameIdentity || !setIdentity) return null;
  return {
    ligaIdentityKey: String(row.identity_key),
    nameIdentity,
    setIdentity,
    sourceSetName: String(row.edition_en),
    collectorIdentity,
    variant,
    materialTreatmentIdentity: pokemonMaterialTreatmentIdentity(
      String(row.card_en),
    ),
    evidenceSignature: [
      row.edition_code,
      row.consumer_low_centavos,
      row.consumer_average_centavos,
      row.consumer_high_centavos,
      row.store_buy_low_centavos,
      row.store_buy_average_centavos,
      row.store_buy_high_centavos,
    ].join("|"),
  };
}

function indexPokemonCandidates(
  candidates: PokemonSourceCandidate[],
  keyFor: (candidate: PokemonSourceCandidate) => string,
): Map<string, PokemonSourceCandidate[]> {
  const index = new Map<string, PokemonSourceCandidate[]>();
  for (const candidate of candidates) {
    const key = keyFor(candidate);
    index.set(key, [...(index.get(key) ?? []), candidate]);
  }
  return index;
}

function pokemonEquivalenceDecision(input: {
  target: Sql;
  acceptedExactCandidates: PokemonSourceCandidate[];
  fullIdentityIndex: Map<string, PokemonSourceCandidate[]>;
  setCollectorVariantIndex: Map<string, PokemonSourceCandidate[]>;
  nameCollectorVariantIndex: Map<string, PokemonSourceCandidate[]>;
  nameSetCollectorIndex: Map<string, PokemonSourceCandidate[]>;
  setCollectorIndex: Map<string, PokemonSourceCandidate[]>;
}): PokemonEquivalenceDecision {
  if (String(input.target.product_type) !== "SINGLE") {
    return unavailablePokemonDecision(
      "LIGA_COLLECTION_EXPORT_HAS_NO_SEALED_IDENTITY_V1",
      "The authenticated LigaPokemon collection export contains card identities, not sealed catalogue identities.",
    );
  }
  if (String(input.target.language) !== "English") {
    return unavailablePokemonDecision(
      "UNAVAILABLE_OUTSIDE_ENGLISH_MARKET_SCOPE_V1",
      "The TCGplayer product is outside the English LigaPokemon reconciliation scope.",
    );
  }
  const collectorIdentity = pokemonCollectorIdentity(
    stringOrNull(input.target.collector_number),
  );
  const nameIdentity = pokemonCardNameIdentity({
    name: String(input.target.name),
    collectorNumber: stringOrNull(input.target.collector_number),
  });
  const setIdentity = pokemonSetIdentity(String(input.target.set_name));
  const variant = String(input.target.variant).trim();
  const materialTreatmentIdentity = pokemonMaterialTreatmentIdentity(
    String(input.target.name),
  );
  if (!collectorIdentity || !nameIdentity || !setIdentity || !variant) {
    return unavailablePokemonDecision(
      "UNAVAILABLE_INCOMPLETE_TARGET_IDENTITY_V1",
      "The TCGplayer product lacks the structural identity required for a deterministic LigaPokemon equivalent.",
    );
  }

  const accepted = resolvePokemonCandidate(input.acceptedExactCandidates);
  if (accepted.kind === "unique") {
    return acceptedPokemonDecision(
      accepted.candidate,
      "EXACT",
      "ACCEPTED_EXACT_SOURCE_CROSSWALK_V1",
      100,
      "The existing collision-safe source crosswalk proves a unique exact printing.",
    );
  }
  if (accepted.kind === "ambiguous") {
    return ambiguousPokemonDecision(
      "AMBIGUOUS_ACCEPTED_SOURCE_CROSSWALK_V1",
      "More than one accepted LigaPokemon identity resolves to this target.",
    );
  }

  const tiers: Array<{
    candidates: PokemonSourceCandidate[];
    status: Extract<RegionalProductEquivalenceStatus, "EXACT" | "COMPATIBLE">;
    method: string;
    confidence: number;
    reason: string;
  }> = [
    {
      candidates:
        input.fullIdentityIndex.get(
          [nameIdentity, setIdentity, collectorIdentity, variant].join("|"),
        ) ?? [],
      status: "EXACT",
      method: "EXACT_POKEMON_NAME_SET_COLLECTOR_FINISH_V2",
      confidence: 100,
      reason:
        "Unique normalized name, bounded set identity, collector numerator, and physical finish.",
    },
    {
      candidates:
        (
          input.setCollectorVariantIndex.get(
            [setIdentity, collectorIdentity, variant].join("|"),
          ) ?? []
        ).filter(
          (candidate) =>
            candidate.materialTreatmentIdentity === materialTreatmentIdentity,
        ),
      status: "EXACT",
      method: "EXACT_POKEMON_SET_COLLECTOR_FINISH_UNIQUE_SOURCE_V1",
      confidence: 96,
      reason:
        "Unique source printing from exact set, collector numerator, and finish; provider title decoration differs.",
    },
    {
      candidates: (
        input.nameCollectorVariantIndex.get(
          [nameIdentity, collectorIdentity, variant].join("|"),
        ) ?? []
      ).filter((candidate) =>
        pokemonSetLabelsStructurallyCompatible(
          String(input.target.set_name),
          candidate.sourceSetName,
        ),
      ),
      status: "EXACT",
      method: "EXACT_POKEMON_STRUCTURAL_SET_NAME_COLLECTOR_FINISH_V1",
      confidence: 92,
      reason:
        "Unique source printing from exact name, collector, and finish with only bounded set-label decoration drift.",
    },
  ];
  if (materialTreatmentIdentity) {
    tiers.push({
      candidates: (
        input.setCollectorVariantIndex.get(
          [setIdentity, collectorIdentity, variant].join("|"),
        ) ?? []
      ).filter((candidate) =>
        pokemonMaterialTreatmentCompatible(
          candidate.materialTreatmentIdentity,
          materialTreatmentIdentity,
        ),
      ),
      status: "COMPATIBLE",
      method: "COMPATIBLE_POKEMON_UNSPECIFIED_MATERIAL_TREATMENT_V1",
      confidence: 72,
      reason:
        "Unique set, collector, and finish identity, but LigaPokemon does not separately name every material treatment carried by the TCGplayer product.",
    });
  }
  const compatibleVariant = compatibleLigaPokemonVariant(variant);
  if (compatibleVariant) {
    tiers.push(
      {
        candidates: (
          input.nameSetCollectorIndex.get(
            [nameIdentity, setIdentity, collectorIdentity].join("|"),
          ) ?? []
        ).filter((candidate) => candidate.variant === compatibleVariant),
        status: "COMPATIBLE",
        method: "COMPATIBLE_POKEMON_FINISH_FAMILY_FULL_IDENTITY_V1",
        confidence: 82,
        reason:
          "Unique name, set, and collector identity; LigaPokemon publishes only the compatible generic finish family.",
      },
      {
        candidates: (
          input.setCollectorIndex.get(
            [setIdentity, collectorIdentity].join("|"),
          ) ?? []
        ).filter((candidate) => candidate.variant === compatibleVariant),
        status: "COMPATIBLE",
        method: "COMPATIBLE_POKEMON_FINISH_FAMILY_UNIQUE_SOURCE_V1",
        confidence: 78,
        reason:
          "Unique set and collector identity after provider title decoration drift; LigaPokemon publishes only the compatible generic finish family.",
      },
    );
  }
  for (const tier of tiers) {
    const resolution = resolvePokemonCandidate(tier.candidates);
    if (resolution.kind === "none") continue;
    if (resolution.kind === "ambiguous") {
      return ambiguousPokemonDecision(
        `AMBIGUOUS_${tier.method}`,
        "More than one non-identical LigaPokemon source identity remains at the strongest applicable matching tier.",
      );
    }
    return acceptedPokemonDecision(
      resolution.candidate,
      tier.status,
      tier.method,
      tier.confidence,
      tier.reason,
    );
  }
  return unavailablePokemonDecision(
    "UNAVAILABLE_NO_STRUCTURAL_LIGAPOKEMON_IDENTITY_V1",
    "No eligible LigaPokemon identity in the acquired snapshot satisfies the bounded structural matching policy.",
  );
}

function resolvePokemonCandidate(
  candidates: PokemonSourceCandidate[],
):
  | { kind: "none" }
  | { kind: "ambiguous" }
  | { kind: "unique"; candidate: PokemonSourceCandidate } {
  if (candidates.length === 0) return { kind: "none" };
  const semanticGroups = new Map<string, PokemonSourceCandidate[]>();
  for (const candidate of candidates) {
    const semanticKey = [
      candidate.nameIdentity,
      candidate.setIdentity,
      candidate.collectorIdentity,
      candidate.variant,
    ].join("|");
    semanticGroups.set(semanticKey, [
      ...(semanticGroups.get(semanticKey) ?? []),
      candidate,
    ]);
  }
  if (semanticGroups.size !== 1) return { kind: "ambiguous" };
  const group = [...semanticGroups.values()][0];
  if (new Set(group.map((candidate) => candidate.evidenceSignature)).size !== 1)
    return { kind: "ambiguous" };
  return {
    kind: "unique",
    candidate: [...group].sort((left, right) =>
      left.ligaIdentityKey.localeCompare(right.ligaIdentityKey),
    )[0],
  };
}

function compatibleLigaPokemonVariant(
  targetVariant: string,
): PokemonSourceCandidate["variant"] | null {
  const normalized = targetVariant.normalize("NFKC").trim().toLowerCase();
  if (/^(?:1st edition|unlimited)$/.test(normalized)) return "Normal";
  if (/^(?:1st edition|unlimited) holofoil$/.test(normalized))
    return "Holofoil";
  return null;
}

function pokemonMaterialTreatmentCompatible(
  source: string,
  target: string,
): boolean {
  if (!target || source === target) return false;
  const sourceTreatments = new Set(source.split("|").filter(Boolean));
  const targetTreatments = new Set(target.split("|").filter(Boolean));
  return [...sourceTreatments].every((treatment) =>
    targetTreatments.has(treatment),
  );
}

function acceptedPokemonDecision(
  candidate: PokemonSourceCandidate,
  status: Extract<RegionalProductEquivalenceStatus, "EXACT" | "COMPATIBLE">,
  method: string,
  confidence: number,
  reason: string,
): PokemonEquivalenceDecision {
  return {
    ligaIdentityKey: candidate.ligaIdentityKey,
    status,
    method,
    confidence,
    reason,
  };
}

function ambiguousPokemonDecision(
  method: string,
  reason: string,
): PokemonEquivalenceDecision {
  return {
    ligaIdentityKey: null,
    status: "AMBIGUOUS",
    method,
    confidence: 0,
    reason,
  };
}

function unavailablePokemonDecision(
  method: string,
  reason: string,
): PokemonEquivalenceDecision {
  return {
    ligaIdentityKey: null,
    status: "UNAVAILABLE",
    method,
    confidence: 0,
    reason,
  };
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
