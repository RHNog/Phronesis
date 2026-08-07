import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  artSeriesCollectorIdentity,
  artSeriesProductNameCompatible,
  calculateArbitrage,
  collectorSuffixBase,
  collectorSuffixProductNameCompatible,
  crossMarketAnchorKey,
  crossMarketIdentityKey,
  crossMarketNameEditionVariantKey,
  documentedEditionTreatmentBase,
  documentedTreatmentProductNameCompatible,
  editionTreatmentIdentity,
  editionAliasCompatible,
  explicitCatalogueTarget,
  explicitHistoricalEditionTarget,
  genericVariantBaseEdition,
  isArtSeriesEdition,
  isArtSeriesFoilShell,
  isFoilOnlyTreatmentNormalShell,
  isHistoricallyImpossibleFoilEdition,
  normalizeCollectorNumber,
  normalizeRegionalVariant,
  permitsPreExodusCollectorFallback,
  tokenBaseEdition,
  tokenCollectorIdentity,
  tokenNameIdentity,
  variantProductNameCompatible,
  type ArbitrageDirection,
  type RegionalCostProfile,
  type RegionalMarketEvidence,
} from "@/lib/regional/domain";
import { normalizeSearchText } from "@/lib/pricing/domain";

type Sql = Record<string, string | number | null>;

export type CrosswalkReport = {
  sourceRunId: string;
  sourceHash: string;
  pricingFingerprint: string;
  total: number;
  supportedTotal: number;
  matched: number;
  exactMatched: number;
  aliasMatched: number;
  missingTcgCollectorMatched: number;
  missingTcgCollectorExactEditionMatched: number;
  missingTcgCollectorAliasEditionMatched: number;
  preExodusNonprintedCollectorMatched: number;
  explicitHistoricalEditionMatched: number;
  explicitCatalogueSchemeMatched: number;
  worldChampionshipMetadataMatched: number;
  editionTreatmentNameMatched: number;
  documentedProductTreatmentNameMatched: number;
  artSeriesIdentityMatched: number;
  collectorSuffixIdentityMatched: number;
  doubleSidedTokenPairMatched: number;
  tokenIdentityMatched: number;
  genericVariantIdentityMatched: number;
  unmatched: number;
  ambiguous: number;
  unsupportedVariant: number;
  historicalFoilShellQuarantined: number;
  artSeriesFoilShellQuarantined: number;
  foilOnlyTreatmentNormalShellQuarantined: number;
  unsupportedVariantQuarantined: number;
  targetCollisionQuarantined: number;
  derivedEditionAliasCount: number;
  matchedCoveragePercent: number;
  matchedWithLigaConsumerPrice: number;
  matchedWithTcgNearMintPrice: number;
  comparableBoth: number;
  comparableCoveragePercent: number;
  unmatchedWithLigaConsumerPrice: number;
  ambiguousWithLigaConsumerPrice: number;
  supportedWithLigaConsumerPrice: number;
  consumerPricedMatchedCoveragePercent: number;
  matchedWithAnyLigaPrice: number;
  supportedWithAnyLigaPrice: number;
  anyLigaPriceMatchedCoveragePercent: number;
  supportedWithoutAnyLigaPrice: number;
  crosswalkFingerprint: string;
  worldChampionshipPlayerAliasCount: number;
  worldChampionshipPlayerAliases: Array<{
    year: string;
    ligaPlayerCode: string;
    tcgplayerPlayer: string;
    anchorCount: number;
  }>;
  editionAliases: Array<{
    ligaEdition: string;
    tcgplayerEdition: string;
    anchorCount: number;
  }>;
  topUnmatchedEditions: Array<{
    edition: string;
    count: number;
    withConsumerPrice: number;
  }>;
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
  acquisitionMarket: "TCGplayer" | "LigaMagic";
  acquisitionBenchmark: string;
  acquisitionValue: number;
  acquisitionCurrency: "USD" | "BRL";
  exitMarket: "TCGplayer" | "LigaMagic";
  exitBenchmark: string;
  grossProceeds: number;
  grossCurrency: "USD" | "BRL";
  state: string;
  blocker: string | null;
  grossSpread: number | null;
  totalCost: number | null;
  netProfit: number | null;
  profitMarginPercent: number | null;
  roiPercent: number | null;
  meetsTargets: boolean | null;
  targetBlockers: string[];
  evidenceObservedAt: string;
  evidenceAgeHours: number;
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
        brl_per_usd_buy REAL,
        brl_per_usd_sell REAL,
        fx_observed_at TEXT,
        fx_fetched_at TEXT,
        fx_last_attempt_at TEXT,
        fx_source TEXT,
        fx_last_error TEXT,
        us_to_brazil_fixed_brl REAL,
        us_to_brazil_percent REAL,
        us_to_brazil_min_acquisition_usd REAL,
        us_to_brazil_max_acquisition_usd REAL,
        us_to_brazil_min_gross_proceeds_brl REAL,
        us_to_brazil_min_gross_spread_brl REAL,
        us_to_brazil_min_net_profit_brl REAL,
        us_to_brazil_min_profit_margin_percent REAL,
        us_to_brazil_min_roi_percent REAL,
        brazil_to_us_fixed_usd REAL,
        brazil_to_us_percent REAL,
        brazil_to_us_min_acquisition_brl REAL,
        brazil_to_us_max_acquisition_brl REAL,
        brazil_to_us_min_gross_proceeds_usd REAL,
        brazil_to_us_min_gross_spread_usd REAL,
        brazil_to_us_min_net_profit_usd REAL,
        brazil_to_us_min_profit_margin_percent REAL,
        brazil_to_us_min_roi_percent REAL,
        max_evidence_age_hours REAL,
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
    this.ensureProfileColumn("brl_per_usd_buy", "REAL");
    this.ensureProfileColumn("brl_per_usd_sell", "REAL");
    this.ensureProfileColumn("fx_fetched_at", "TEXT");
    this.ensureProfileColumn("fx_last_attempt_at", "TEXT");
    this.ensureProfileColumn("fx_last_error", "TEXT");
    for (const column of [
      "us_to_brazil_min_acquisition_usd",
      "us_to_brazil_max_acquisition_usd",
      "us_to_brazil_min_gross_proceeds_brl",
      "us_to_brazil_min_gross_spread_brl",
      "us_to_brazil_min_net_profit_brl",
      "us_to_brazil_min_profit_margin_percent",
      "us_to_brazil_min_roi_percent",
      "brazil_to_us_min_acquisition_brl",
      "brazil_to_us_max_acquisition_brl",
      "brazil_to_us_min_gross_proceeds_usd",
      "brazil_to_us_min_gross_spread_usd",
      "brazil_to_us_min_net_profit_usd",
      "brazil_to_us_min_profit_margin_percent",
      "brazil_to_us_min_roi_percent",
      "max_evidence_age_hours",
    ])
      this.ensureProfileColumn(column, "REAL");
  }

  private ensureProfileColumn(name: string, type: "REAL" | "TEXT"): void {
    const columns = this.database
      .prepare("PRAGMA table_info(regional_cost_profile)")
      .all() as Array<{ name: string }>;
    if (!columns.some((column) => column.name === name))
      this.database.exec(
        `ALTER TABLE regional_cost_profile ADD COLUMN ${name} ${type}`,
      );
  }

  getProfile(): RegionalCostProfile {
    const row = this.database
      .prepare("SELECT * FROM regional_cost_profile WHERE id = 1")
      .get() as Sql;
    return {
      brlPerUsd: numberOrNull(row.brl_per_usd),
      brlPerUsdBuy: numberOrNull(row.brl_per_usd_buy),
      brlPerUsdSell: numberOrNull(row.brl_per_usd_sell),
      fxObservedAt: stringOrNull(row.fx_observed_at),
      fxFetchedAt: stringOrNull(row.fx_fetched_at),
      fxLastAttemptAt: stringOrNull(row.fx_last_attempt_at),
      fxSource: stringOrNull(row.fx_source),
      fxLastError: stringOrNull(row.fx_last_error),
      usToBrazilFixedBrl: numberOrNull(row.us_to_brazil_fixed_brl),
      usToBrazilPercent: numberOrNull(row.us_to_brazil_percent),
      usToBrazilMinAcquisitionUsd: numberOrNull(
        row.us_to_brazil_min_acquisition_usd,
      ),
      usToBrazilMaxAcquisitionUsd: numberOrNull(
        row.us_to_brazil_max_acquisition_usd,
      ),
      usToBrazilMinGrossProceedsBrl: numberOrNull(
        row.us_to_brazil_min_gross_proceeds_brl,
      ),
      usToBrazilMinGrossSpreadBrl: numberOrNull(
        row.us_to_brazil_min_gross_spread_brl,
      ),
      usToBrazilMinNetProfitBrl: numberOrNull(
        row.us_to_brazil_min_net_profit_brl,
      ),
      usToBrazilMinProfitMarginPercent: numberOrNull(
        row.us_to_brazil_min_profit_margin_percent,
      ),
      usToBrazilMinRoiPercent: numberOrNull(
        row.us_to_brazil_min_roi_percent,
      ),
      brazilToUsFixedUsd: numberOrNull(row.brazil_to_us_fixed_usd),
      brazilToUsPercent: numberOrNull(row.brazil_to_us_percent),
      brazilToUsMinAcquisitionBrl: numberOrNull(
        row.brazil_to_us_min_acquisition_brl,
      ),
      brazilToUsMaxAcquisitionBrl: numberOrNull(
        row.brazil_to_us_max_acquisition_brl,
      ),
      brazilToUsMinGrossProceedsUsd: numberOrNull(
        row.brazil_to_us_min_gross_proceeds_usd,
      ),
      brazilToUsMinGrossSpreadUsd: numberOrNull(
        row.brazil_to_us_min_gross_spread_usd,
      ),
      brazilToUsMinNetProfitUsd: numberOrNull(
        row.brazil_to_us_min_net_profit_usd,
      ),
      brazilToUsMinProfitMarginPercent: numberOrNull(
        row.brazil_to_us_min_profit_margin_percent,
      ),
      brazilToUsMinRoiPercent: numberOrNull(
        row.brazil_to_us_min_roi_percent,
      ),
      maxEvidenceAgeHours: numberOrNull(row.max_evidence_age_hours),
      updatedAt: stringOrNull(row.updated_at),
    };
  }

  updateProfile(profile: RegionalCostProfile): RegionalCostProfile {
    validateProfile(profile);
    const updatedAt = new Date().toISOString();
    this.database
      .prepare(
        `UPDATE regional_cost_profile SET
          brl_per_usd=?, brl_per_usd_buy=?, brl_per_usd_sell=?,
          fx_observed_at=?, fx_fetched_at=?, fx_last_attempt_at=?, fx_source=?, fx_last_error=?,
          us_to_brazil_fixed_brl=?, us_to_brazil_percent=?,
          us_to_brazil_min_acquisition_usd=?, us_to_brazil_max_acquisition_usd=?,
          us_to_brazil_min_gross_proceeds_brl=?, us_to_brazil_min_gross_spread_brl=?,
          us_to_brazil_min_net_profit_brl=?, us_to_brazil_min_profit_margin_percent=?,
          us_to_brazil_min_roi_percent=?,
          brazil_to_us_fixed_usd=?, brazil_to_us_percent=?,
          brazil_to_us_min_acquisition_brl=?, brazil_to_us_max_acquisition_brl=?,
          brazil_to_us_min_gross_proceeds_usd=?, brazil_to_us_min_gross_spread_usd=?,
          brazil_to_us_min_net_profit_usd=?, brazil_to_us_min_profit_margin_percent=?,
          brazil_to_us_min_roi_percent=?, max_evidence_age_hours=?, updated_at=?
        WHERE id=1`,
      )
      .run(
        profile.brlPerUsd,
        profile.brlPerUsdBuy,
        profile.brlPerUsdSell,
        profile.fxObservedAt,
        profile.fxFetchedAt,
        profile.fxLastAttemptAt,
        profile.fxSource,
        profile.fxLastError,
        profile.usToBrazilFixedBrl,
        profile.usToBrazilPercent,
        profile.usToBrazilMinAcquisitionUsd,
        profile.usToBrazilMaxAcquisitionUsd,
        profile.usToBrazilMinGrossProceedsBrl,
        profile.usToBrazilMinGrossSpreadBrl,
        profile.usToBrazilMinNetProfitBrl,
        profile.usToBrazilMinProfitMarginPercent,
        profile.usToBrazilMinRoiPercent,
        profile.brazilToUsFixedUsd,
        profile.brazilToUsPercent,
        profile.brazilToUsMinAcquisitionBrl,
        profile.brazilToUsMaxAcquisitionBrl,
        profile.brazilToUsMinGrossProceedsUsd,
        profile.brazilToUsMinGrossSpreadUsd,
        profile.brazilToUsMinNetProfitUsd,
        profile.brazilToUsMinProfitMarginPercent,
        profile.brazilToUsMinRoiPercent,
        profile.maxEvidenceAgeHours,
        updatedAt,
      );
    return this.getProfile();
  }

  updateDecisionSettings(settings: RegionalCostProfile): RegionalCostProfile {
    const current = this.getProfile();
    return this.updateProfile({
      ...current,
      usToBrazilFixedBrl: settings.usToBrazilFixedBrl,
      usToBrazilPercent: settings.usToBrazilPercent,
      usToBrazilMinAcquisitionUsd: settings.usToBrazilMinAcquisitionUsd,
      usToBrazilMaxAcquisitionUsd: settings.usToBrazilMaxAcquisitionUsd,
      usToBrazilMinGrossProceedsBrl: settings.usToBrazilMinGrossProceedsBrl,
      usToBrazilMinGrossSpreadBrl: settings.usToBrazilMinGrossSpreadBrl,
      usToBrazilMinNetProfitBrl: settings.usToBrazilMinNetProfitBrl,
      usToBrazilMinProfitMarginPercent:
        settings.usToBrazilMinProfitMarginPercent,
      usToBrazilMinRoiPercent: settings.usToBrazilMinRoiPercent,
      brazilToUsFixedUsd: settings.brazilToUsFixedUsd,
      brazilToUsPercent: settings.brazilToUsPercent,
      brazilToUsMinAcquisitionBrl: settings.brazilToUsMinAcquisitionBrl,
      brazilToUsMaxAcquisitionBrl: settings.brazilToUsMaxAcquisitionBrl,
      brazilToUsMinGrossProceedsUsd: settings.brazilToUsMinGrossProceedsUsd,
      brazilToUsMinGrossSpreadUsd: settings.brazilToUsMinGrossSpreadUsd,
      brazilToUsMinNetProfitUsd: settings.brazilToUsMinNetProfitUsd,
      brazilToUsMinProfitMarginPercent:
        settings.brazilToUsMinProfitMarginPercent,
      brazilToUsMinRoiPercent: settings.brazilToUsMinRoiPercent,
      maxEvidenceAgeHours: settings.maxEvidenceAgeHours,
    });
  }

  recordOfficialFx(input: {
    buyBrlPerUsd: number;
    sellBrlPerUsd: number;
    observedAt: string;
    fetchedAt: string;
    source: string;
  }): RegionalCostProfile {
    return this.updateProfile({
      ...this.getProfile(),
      brlPerUsd: input.sellBrlPerUsd,
      brlPerUsdBuy: input.buyBrlPerUsd,
      brlPerUsdSell: input.sellBrlPerUsd,
      fxObservedAt: input.observedAt,
      fxFetchedAt: input.fetchedAt,
      fxLastAttemptAt: input.fetchedAt,
      fxSource: input.source,
      fxLastError: null,
    });
  }

  recordOfficialFxFailure(attemptedAt: string): RegionalCostProfile {
    return this.updateProfile({
      ...this.getProfile(),
      fxLastAttemptAt: attemptedAt,
      fxLastError: "Official BCB PTAX refresh is temporarily unavailable.",
    });
  }

  evidenceFor(categoryId: string, sku: string): RegionalMarketEvidence | null {
    const row =
      categoryId === "pokemon-en" &&
      this.tableExists("regional_pokemon_crosswalk") &&
      this.tableExists("regional_pokemon_evidence")
        ? (this.database
            .prepare(`
          SELECT
            'ligapokemon' AS provider_id,
            c.source_run_id,
            c.category_id,
            c.sku,
            e.liga_identity_key,
            e.card_name,
            e.set_name AS edition_name,
            e.set_code AS edition_code,
            e.collector_number,
            e.variant,
            e.condition_key,
            e.language,
            e.observed_at,
            e.consumer_low_centavos,
            e.consumer_average_centavos,
            e.consumer_high_centavos,
            e.store_buy_low_centavos,
            e.store_buy_average_centavos,
            e.store_buy_high_centavos
          FROM regional_pokemon_crosswalk c
          JOIN regional_pokemon_evidence e USING(liga_identity_key)
          WHERE c.status='MATCHED' AND c.category_id=? AND c.sku=?
          ORDER BY e.observed_at DESC, c.reconciled_at DESC, e.liga_identity_key
          LIMIT 1
        `)
            .get(categoryId, sku) as Sql | undefined)
        : categoryId === "magic-en"
          ? (this.database
              .prepare(`
            SELECT
              'ligamagic' AS provider_id,
              c.source_run_id,
              c.category_id,
              c.sku,
              e.*,
              NULL AS condition_key,
              NULL AS language
            FROM regional_crosswalk c
            JOIN regional_evidence e USING(liga_identity_key)
            WHERE c.status='MATCHED' AND c.category_id=? AND c.sku=?
            ORDER BY e.observed_at DESC, c.reconciled_at DESC, e.liga_identity_key
            LIMIT 1
          `)
              .get(categoryId, sku) as Sql | undefined)
          : undefined;
    if (!row) return null;
    return evidenceDto(row);
  }

  private tableExists(tableName: string): boolean {
    return Boolean(
      this.database
        .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
        .get(tableName),
    );
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
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
      }>
    >();
    const anchorIndex = new Map<
      string,
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
      }>
    >();
    const missingCollectorProductIndex = new Map<
      string,
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
      }>
    >();
    const nameEditionVariantProductIndex = new Map<
      string,
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
      }>
    >();
    const worldChampionshipAnchorIndex = new Map<
      string,
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
        player: string;
      }>
    >();
    const worldChampionshipProductIndex = new Map<
      string,
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
        player: string;
      }>
    >();
    const tokenProductIndex = new Map<
      string,
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
      }>
    >();
    const collectorVariantProductIndex = new Map<
      string,
      Array<{
        categoryId: string;
        sku: string;
        edition: string;
        normalizedEdition: string;
        name: string;
        collectorNumber: string;
      }>
    >();
    const productRows = this.database
      .prepare(
        `SELECT category_id, sku, name, set_name, collector_number, variant FROM pricing_products WHERE category_id='magic-en' AND product_type='SINGLE'`,
      )
      .all() as Sql[];
    for (const row of productRows) {
      const key = crossMarketIdentityKey({
        name: String(row.name),
        edition: String(row.set_name),
        collectorNumber: String(row.collector_number ?? ""),
        variant: String(row.variant),
      });
      const anchorKey = crossMarketAnchorKey({
        name: String(row.name),
        collectorNumber: String(row.collector_number ?? ""),
        variant: String(row.variant),
      });
      const nameEditionVariantKey = crossMarketNameEditionVariantKey({
        name: String(row.name),
        edition: String(row.set_name),
        variant: String(row.variant),
        collectorNumber: String(row.collector_number ?? ""),
      });
      const candidate = {
        categoryId: String(row.category_id),
        sku: String(row.sku),
        edition: String(row.set_name),
        normalizedEdition: normalizeSearchText(String(row.set_name)),
      };
      if (key && anchorKey) {
        productIndex.set(key, [...(productIndex.get(key) ?? []), candidate]);
        anchorIndex.set(anchorKey, [
          ...(anchorIndex.get(anchorKey) ?? []),
          candidate,
        ]);
      }
      if (
        !normalizeCollectorNumber(String(row.collector_number ?? "")) &&
        nameEditionVariantKey
      ) {
        missingCollectorProductIndex.set(nameEditionVariantKey, [
          ...(missingCollectorProductIndex.get(nameEditionVariantKey) ?? []),
          candidate,
        ]);
      }
      if (nameEditionVariantKey)
        nameEditionVariantProductIndex.set(nameEditionVariantKey, [
          ...(nameEditionVariantProductIndex.get(nameEditionVariantKey) ?? []),
          candidate,
        ]);
      const worldChampionship =
        String(row.set_name) === "World Championship Decks" &&
        String(row.variant) === "Normal"
          ? parseTcgplayerWorldChampionshipName(String(row.name))
          : null;
      if (worldChampionship) {
        const championshipCandidate = {
          ...candidate,
          player: worldChampionship.player,
        };
        const anchorKey = worldChampionshipAnchorKey(worldChampionship);
        worldChampionshipAnchorIndex.set(anchorKey, [
          ...(worldChampionshipAnchorIndex.get(anchorKey) ?? []),
          championshipCandidate,
        ]);
        const productKey = worldChampionshipProductKey(worldChampionship);
        worldChampionshipProductIndex.set(productKey, [
          ...(worldChampionshipProductIndex.get(productKey) ?? []),
          championshipCandidate,
        ]);
      }
      const tokenCollector = normalizeSearchText(String(row.name)).endsWith(
        "token",
      )
        ? tokenCollectorIdentity(String(row.collector_number ?? ""))
        : null;
      const tokenName = tokenCollector
        ? tokenNameIdentity(String(row.name))
        : null;
      const tokenVariant = normalizeRegionalVariant(String(row.variant));
      if (tokenCollector && tokenName && tokenVariant) {
        const tokenKey = `${tokenCollector}|${tokenVariant.toLowerCase()}|${tokenName}`;
        tokenProductIndex.set(tokenKey, [
          ...(tokenProductIndex.get(tokenKey) ?? []),
          candidate,
        ]);
      }
      const normalizedCollector = normalizeCollectorNumber(
        String(row.collector_number ?? ""),
      );
      if (normalizedCollector && tokenVariant) {
        const collectorVariantKey = `${normalizedCollector}|${tokenVariant.toLowerCase()}`;
        collectorVariantProductIndex.set(collectorVariantKey, [
          ...(collectorVariantProductIndex.get(collectorVariantKey) ?? []),
          {
            ...candidate,
            name: String(row.name),
            collectorNumber: String(row.collector_number ?? ""),
          },
        ]);
      }
    }
    const liga = new DatabaseSync(ligaDatabasePath);
    liga.exec("PRAGMA query_only = ON");
    const ligaRows = liga
      .prepare("SELECT * FROM ligamagic_price ORDER BY identity_key")
      .all() as Sql[];
    const aliasCandidates = new Map<
      string,
      {
        sourceEdition: string;
        targets: Map<string, { edition: string; anchors: Set<string> }>;
      }
    >();
    for (const row of ligaRows) {
      const normalizedVariant = normalizeRegionalVariant(String(row.extras));
      const variant =
        (normalizedVariant === "Foil" &&
          isHistoricallyImpossibleFoilEdition(String(row.edition_en))) ||
        isArtSeriesFoilShell(String(row.edition_en), String(row.extras)) ||
        isFoilOnlyTreatmentNormalShell(
          String(row.edition_en),
          String(row.extras),
        )
          ? null
          : normalizedVariant;
      if (!variant) continue;
      const anchorKey = crossMarketAnchorKey({
        name: String(row.card_en),
        collectorNumber: String(row.collector_number),
        variant,
      });
      if (!anchorKey) continue;
      const candidates = anchorIndex.get(anchorKey) ?? [];
      const sourceEdition = String(row.edition_en);
      const normalizedSource = normalizeSearchText(sourceEdition);
      const compatibleEditions = new Map<
        string,
        (typeof candidates)[number]
      >();
      for (const candidate of candidates) {
        if (!editionAliasCompatible(sourceEdition, candidate.edition)) continue;
        compatibleEditions.set(candidate.normalizedEdition, candidate);
      }
      if (compatibleEditions.size !== 1) continue;
      const candidate = [...compatibleEditions.values()][0];
      if (normalizedSource === candidate.normalizedEdition) continue;
      const evidence = aliasCandidates.get(normalizedSource) ?? {
        sourceEdition,
        targets: new Map(),
      };
      const target = evidence.targets.get(candidate.normalizedEdition) ?? {
        edition: candidate.edition,
        anchors: new Set<string>(),
      };
      target.anchors.add(anchorKey);
      evidence.targets.set(candidate.normalizedEdition, target);
      aliasCandidates.set(normalizedSource, evidence);
    }
    const editionAliases = new Map<
      string,
      { edition: string; normalizedEdition: string; anchorCount: number; sourceEdition: string }
    >();
    for (const [source, evidence] of aliasCandidates) {
      if (evidence.targets.size !== 1) continue;
      const [normalizedEdition, target] = [...evidence.targets.entries()][0];
      if (target.anchors.size < 2) continue;
      if (!editionAliasCompatible(evidence.sourceEdition, target.edition)) continue;
      editionAliases.set(source, {
        edition: target.edition,
        normalizedEdition,
        anchorCount: target.anchors.size,
        sourceEdition: evidence.sourceEdition,
      });
    }
    const championshipAliasEvidence = new Map<
      string,
      {
        year: string;
        ligaPlayerCode: string;
        targets: Map<string, Set<string>>;
      }
    >();
    for (const row of ligaRows) {
      if (
        String(row.extras) !== "" ||
        !isWorldChampionshipSourceEdition(String(row.edition_en))
      )
        continue;
      const source = parseLigaWorldChampionshipName(String(row.card_en));
      if (!source) continue;
      const candidates = worldChampionshipAnchorIndex.get(
        worldChampionshipAnchorKey(source),
      ) ?? [];
      const players = new Set(candidates.map((candidate) => candidate.player));
      if (players.size !== 1) continue;
      const player = [...players][0];
      const aliasKey = `${source.year}|${source.playerCode}`;
      const evidence = championshipAliasEvidence.get(aliasKey) ?? {
        year: source.year,
        ligaPlayerCode: source.playerCode,
        targets: new Map(),
      };
      const anchors = evidence.targets.get(player) ?? new Set<string>();
      anchors.add(worldChampionshipAnchorKey(source));
      evidence.targets.set(player, anchors);
      championshipAliasEvidence.set(aliasKey, evidence);
    }
    const worldChampionshipPlayerAliases = new Map<
      string,
      {
        year: string;
        ligaPlayerCode: string;
        tcgplayerPlayer: string;
        anchorCount: number;
      }
    >();
    for (const [aliasKey, evidence] of championshipAliasEvidence) {
      if (evidence.targets.size !== 1) continue;
      const [tcgplayerPlayer, anchors] = [...evidence.targets.entries()][0];
      if (anchors.size < 3) continue;
      worldChampionshipPlayerAliases.set(aliasKey, {
        year: evidence.year,
        ligaPlayerCode: evidence.ligaPlayerCode,
        tcgplayerPlayer,
        anchorCount: anchors.size,
      });
    }
    const insertCrosswalk = this.database.prepare(
      `INSERT INTO regional_crosswalk(liga_identity_key,category_id,sku,status,method,reason,source_run_id,source_hash,pricing_fingerprint,reconciled_at) VALUES(?,?,?,?,?,?,?,?,?,?)`,
    );
    const insertEvidence = this.database.prepare(
      `INSERT INTO regional_evidence(liga_identity_key,card_name,edition_name,edition_code,collector_number,variant,observed_at,consumer_low_centavos,consumer_average_centavos,consumer_high_centavos,store_buy_low_centavos,store_buy_average_centavos,store_buy_high_centavos) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    );
    const counts = {
      total: 0,
      matched: 0,
      exactMatched: 0,
      aliasMatched: 0,
      missingTcgCollectorMatched: 0,
      missingTcgCollectorExactEditionMatched: 0,
      missingTcgCollectorAliasEditionMatched: 0,
      preExodusNonprintedCollectorMatched: 0,
      explicitHistoricalEditionMatched: 0,
      explicitCatalogueSchemeMatched: 0,
      worldChampionshipMetadataMatched: 0,
      editionTreatmentNameMatched: 0,
      documentedProductTreatmentNameMatched: 0,
      artSeriesIdentityMatched: 0,
      collectorSuffixIdentityMatched: 0,
      doubleSidedTokenPairMatched: 0,
      tokenIdentityMatched: 0,
      genericVariantIdentityMatched: 0,
      unmatched: 0,
      ambiguous: 0,
      unsupportedVariant: 0,
      historicalFoilShellQuarantined: 0,
      artSeriesFoilShellQuarantined: 0,
      foilOnlyTreatmentNormalShellQuarantined: 0,
      unsupportedVariantQuarantined: 0,
      targetCollisionQuarantined: 0,
    };
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.exec(
        "DELETE FROM regional_evidence; DELETE FROM regional_crosswalk;",
      );
      for (const row of ligaRows) {
        counts.total += 1;
        const normalizedVariant = normalizeRegionalVariant(String(row.extras));
        const historicalFoilShell =
          normalizedVariant === "Foil" &&
          isHistoricallyImpossibleFoilEdition(String(row.edition_en));
        const artSeriesFoilShell = isArtSeriesFoilShell(
          String(row.edition_en),
          String(row.extras),
        );
        const foilOnlyTreatmentNormalShell =
          isFoilOnlyTreatmentNormalShell(
            String(row.edition_en),
            String(row.extras),
          );
        const variant =
          historicalFoilShell ||
          artSeriesFoilShell ||
          foilOnlyTreatmentNormalShell
            ? null
            : normalizedVariant;
        const exactKey = variant
          ? crossMarketIdentityKey({
              name: String(row.card_en),
              edition: String(row.edition_en),
              collectorNumber: String(row.collector_number),
              variant,
            })
          : null;
        const exactCandidates = exactKey ? (productIndex.get(exactKey) ?? []) : [];
        const alias = variant
          ? editionAliases.get(normalizeSearchText(String(row.edition_en)))
          : null;
        const aliasKey = alias && variant
          ? crossMarketIdentityKey({
              name: String(row.card_en),
              edition: alias.edition,
              collectorNumber: String(row.collector_number),
              variant,
            })
          : null;
        const aliasCandidatesForRow = exactCandidates.length === 0 && aliasKey
          ? (productIndex.get(aliasKey) ?? [])
          : [];
        const exactMissingCollectorKey = variant
          ? crossMarketNameEditionVariantKey({
              name: String(row.card_en),
              edition: String(row.edition_en),
              variant,
              collectorNumber: String(row.collector_number),
            })
          : null;
        const exactMissingCollectorCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorKey
            ? (missingCollectorProductIndex.get(exactMissingCollectorKey) ?? [])
            : [];
        const aliasMissingCollectorKey = alias && variant
          ? crossMarketNameEditionVariantKey({
              name: String(row.card_en),
              edition: alias.edition,
              variant,
              collectorNumber: String(row.collector_number),
            })
          : null;
        const aliasMissingCollectorCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorKey
            ? (missingCollectorProductIndex.get(aliasMissingCollectorKey) ?? [])
            : [];
        const historicalEditionTarget = explicitHistoricalEditionTarget(
          String(row.edition_en),
        );
        const historicalEditionKey = historicalEditionTarget && variant
          ? crossMarketNameEditionVariantKey({
              name: String(row.card_en),
              edition: historicalEditionTarget,
              variant,
              collectorNumber: String(row.collector_number),
            })
          : null;
        const historicalEditionCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionKey
            ? (missingCollectorProductIndex.get(historicalEditionKey) ?? [])
            : [];
        const catalogueTarget = explicitCatalogueTarget(String(row.edition_en));
        const catalogueName = catalogueTarget?.nameSuffix
          ? `${String(row.card_en)} (${catalogueTarget.nameSuffix})`
          : String(row.card_en);
        const catalogueKey = catalogueTarget && variant
          ? crossMarketNameEditionVariantKey({
              name: catalogueName,
              edition: catalogueTarget.edition,
              variant,
              collectorNumber: String(row.collector_number),
            })
          : null;
        const catalogueCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueKey
            ? (nameEditionVariantProductIndex.get(catalogueKey) ?? [])
            : [];
        const treatmentIdentity = variant
          ? editionTreatmentIdentity(
              String(row.edition_en),
              String(row.card_en),
            )
          : null;
        const treatmentAnchorKey = treatmentIdentity && variant
          ? crossMarketAnchorKey({
              name: treatmentIdentity.targetCardName,
              collectorNumber: String(row.collector_number),
              variant,
            })
          : null;
        const treatmentCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentAnchorKey &&
          treatmentIdentity
            ? (anchorIndex.get(treatmentAnchorKey) ?? []).filter((candidate) =>
                editionAliasCompatible(
                  treatmentIdentity.baseEdition,
                  candidate.edition,
                ),
              )
            : [];
        const sourceVariantCollector = normalizeCollectorNumber(
          String(row.collector_number),
        );
        const compatibleSourceEdition =
          treatmentIdentity?.baseEdition ??
          documentedEditionTreatmentBase(String(row.edition_en)) ??
          alias?.edition ??
          String(row.edition_en);
        const documentedProductTreatmentCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentCandidates.length === 0 &&
          !genericVariantBaseEdition(String(row.edition_en)) &&
          sourceVariantCollector &&
          variant
            ? (collectorVariantProductIndex.get(
                `${sourceVariantCollector}|${variant.toLowerCase()}`,
              ) ?? []).filter(
                (candidate) =>
                  editionAliasCompatible(
                    compatibleSourceEdition,
                    candidate.edition,
                  ) &&
                  documentedTreatmentProductNameCompatible({
                    sourceName: String(row.card_en),
                    sourceCollectorNumber: String(row.collector_number),
                    sourceEdition: String(row.edition_en),
                    targetName: candidate.name,
                    targetCollectorNumber: candidate.collectorNumber,
                    targetEdition: candidate.edition,
                  }),
              )
            : [];
        const sourceArtSeriesCollector =
          variant === "Normal" && isArtSeriesEdition(String(row.edition_en))
            ? artSeriesCollectorIdentity(String(row.collector_number))
            : null;
        const artSeriesCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentCandidates.length === 0 &&
          documentedProductTreatmentCandidates.length === 0 &&
          sourceArtSeriesCollector
            ? (collectorVariantProductIndex.get(
                `${sourceArtSeriesCollector}|normal`,
              ) ?? []).filter(
                (candidate) =>
                  isArtSeriesEdition(candidate.edition) &&
                  editionAliasCompatible(
                    compatibleSourceEdition,
                    candidate.edition,
                  ) &&
                  artSeriesProductNameCompatible({
                    sourceName: String(row.card_en),
                    targetName: candidate.name,
                  }),
              )
            : [];
        const sourceCollectorSuffix = collectorSuffixBase(
          String(row.collector_number),
        );
        const collectorSuffixCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentCandidates.length === 0 &&
          documentedProductTreatmentCandidates.length === 0 &&
          artSeriesCandidates.length === 0 &&
          sourceCollectorSuffix &&
          variant
            ? (collectorVariantProductIndex.get(
                `${sourceCollectorSuffix}|${variant.toLowerCase()}`,
              ) ?? []).filter(
                (candidate) =>
                  editionAliasCompatible(
                    compatibleSourceEdition,
                    candidate.edition,
                  ) &&
                  collectorSuffixProductNameCompatible({
                    sourceName: String(row.card_en),
                    sourceCollectorNumber: String(row.collector_number),
                    sourceEdition: String(row.edition_en),
                    targetName: candidate.name,
                    targetCollectorNumber: candidate.collectorNumber,
                    targetEdition: candidate.edition,
                  }),
              )
            : [];
        const sourceTokenEdition = tokenBaseEdition(String(row.edition_en));
        const sourceTokenCollector = sourceTokenEdition
          ? tokenCollectorIdentity(String(row.collector_number))
          : null;
        const sourceTokenName = sourceTokenCollector
          ? tokenNameIdentity(String(row.card_en))
          : null;
        const tokenKey =
          sourceTokenCollector && sourceTokenName && variant
            ? `${sourceTokenCollector}|${variant.toLowerCase()}|${sourceTokenName}`
            : null;
        const tokenCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentCandidates.length === 0 &&
          documentedProductTreatmentCandidates.length === 0 &&
          artSeriesCandidates.length === 0 &&
          collectorSuffixCandidates.length === 0 &&
          tokenKey &&
          sourceTokenEdition
            ? (tokenProductIndex.get(tokenKey) ?? []).filter((candidate) =>
                editionAliasCompatible(sourceTokenEdition, candidate.edition),
              )
            : [];
        const genericVariantEdition = genericVariantBaseEdition(
          String(row.edition_en),
        );
        const genericVariantCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentCandidates.length === 0 &&
          documentedProductTreatmentCandidates.length === 0 &&
          artSeriesCandidates.length === 0 &&
          collectorSuffixCandidates.length === 0 &&
          tokenCandidates.length === 0 &&
          genericVariantEdition &&
          sourceVariantCollector &&
          variant
            ? (collectorVariantProductIndex.get(
                `${sourceVariantCollector}|${variant.toLowerCase()}`,
              ) ?? []).filter(
                (candidate) =>
                  editionAliasCompatible(
                    genericVariantEdition,
                    candidate.edition,
                  ) &&
                  variantProductNameCompatible({
                    sourceName: String(row.card_en),
                    sourceCollectorNumber: String(row.collector_number),
                    sourceEdition: String(row.edition_en),
                    targetName: candidate.name,
                    targetCollectorNumber: candidate.collectorNumber,
                    targetEdition: candidate.edition,
                  }),
              )
            : [];
        const championshipSource =
          variant === "Normal" &&
          isWorldChampionshipSourceEdition(String(row.edition_en))
            ? parseLigaWorldChampionshipName(String(row.card_en))
            : null;
        const championshipAlias = championshipSource
          ? worldChampionshipPlayerAliases.get(
              `${championshipSource.year}|${championshipSource.playerCode}`,
            )
          : null;
        const championshipCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentCandidates.length === 0 &&
          documentedProductTreatmentCandidates.length === 0 &&
          artSeriesCandidates.length === 0 &&
          collectorSuffixCandidates.length === 0 &&
          tokenCandidates.length === 0 &&
          genericVariantCandidates.length === 0 &&
          championshipSource &&
          championshipAlias
            ? (worldChampionshipProductIndex.get(
                worldChampionshipProductKey({
                  ...championshipSource,
                  player: championshipAlias.tcgplayerPlayer,
                }),
              ) ?? [])
            : [];
        const preExodusCollectorCandidates =
          exactCandidates.length === 0 &&
          aliasCandidatesForRow.length === 0 &&
          exactMissingCollectorCandidates.length === 0 &&
          aliasMissingCollectorCandidates.length === 0 &&
          historicalEditionCandidates.length === 0 &&
          catalogueCandidates.length === 0 &&
          treatmentCandidates.length === 0 &&
          documentedProductTreatmentCandidates.length === 0 &&
          artSeriesCandidates.length === 0 &&
          collectorSuffixCandidates.length === 0 &&
          tokenCandidates.length === 0 &&
          genericVariantCandidates.length === 0 &&
          championshipCandidates.length === 0 &&
          exactMissingCollectorKey &&
          permitsPreExodusCollectorFallback(String(row.edition_en))
            ? (nameEditionVariantProductIndex.get(exactMissingCollectorKey) ?? [])
            : [];
        const candidates = exactCandidates.length
          ? exactCandidates
          : aliasCandidatesForRow.length
            ? aliasCandidatesForRow
            : exactMissingCollectorCandidates.length
              ? exactMissingCollectorCandidates
              : aliasMissingCollectorCandidates.length
                ? aliasMissingCollectorCandidates
                : historicalEditionCandidates.length
                  ? historicalEditionCandidates
                  : catalogueCandidates.length
                    ? catalogueCandidates
                    : treatmentCandidates.length
                      ? treatmentCandidates
                      : documentedProductTreatmentCandidates.length
                        ? documentedProductTreatmentCandidates
                        : artSeriesCandidates.length
                          ? artSeriesCandidates
                          : collectorSuffixCandidates.length
                            ? collectorSuffixCandidates
                            : tokenCandidates.length
                              ? tokenCandidates
                              : genericVariantCandidates.length
                                ? genericVariantCandidates
                                : championshipCandidates.length
                                  ? championshipCandidates
                                  : preExodusCollectorCandidates;
        const missingTcgCollectorUsed =
          exactMissingCollectorCandidates.length > 0 ||
          aliasMissingCollectorCandidates.length > 0;
        const preExodusCollectorFallbackUsed =
          preExodusCollectorCandidates.length > 0;
        const historicalEditionUsed = historicalEditionCandidates.length > 0;
        const catalogueSchemeUsed = catalogueCandidates.length > 0;
        const championshipMetadataUsed = championshipCandidates.length > 0;
        const treatmentNameUsed = treatmentCandidates.length > 0;
        const documentedProductTreatmentUsed =
          documentedProductTreatmentCandidates.length > 0;
        const artSeriesIdentityUsed = artSeriesCandidates.length > 0;
        const collectorSuffixIdentityUsed =
          collectorSuffixCandidates.length > 0;
        const tokenIdentityUsed = tokenCandidates.length > 0;
        const genericVariantUsed = genericVariantCandidates.length > 0;
        const aliasUsed =
          aliasCandidatesForRow.length > 0 ||
          aliasMissingCollectorCandidates.length > 0;
        const status = !variant
          ? "UNSUPPORTED_VARIANT"
          : candidates.length === 1
            ? "MATCHED"
            : candidates.length > 1
              ? "AMBIGUOUS"
              : "UNMATCHED";
        if (status === "MATCHED") {
          counts.matched += 1;
          if (missingTcgCollectorUsed) {
            counts.missingTcgCollectorMatched += 1;
            if (aliasUsed)
              counts.missingTcgCollectorAliasEditionMatched += 1;
            else counts.missingTcgCollectorExactEditionMatched += 1;
          } else if (historicalEditionUsed)
            counts.explicitHistoricalEditionMatched += 1;
          else if (catalogueSchemeUsed)
            counts.explicitCatalogueSchemeMatched += 1;
          else if (treatmentNameUsed)
            counts.editionTreatmentNameMatched += 1;
          else if (documentedProductTreatmentUsed)
            counts.documentedProductTreatmentNameMatched += 1;
          else if (artSeriesIdentityUsed)
            counts.artSeriesIdentityMatched += 1;
          else if (collectorSuffixIdentityUsed)
            counts.collectorSuffixIdentityMatched += 1;
          else if (tokenIdentityUsed) {
            counts.tokenIdentityMatched += 1;
            if (sourceTokenCollector?.includes("|"))
              counts.doubleSidedTokenPairMatched += 1;
          }
          else if (genericVariantUsed)
            counts.genericVariantIdentityMatched += 1;
          else if (championshipMetadataUsed)
            counts.worldChampionshipMetadataMatched += 1;
          else if (preExodusCollectorFallbackUsed)
            counts.preExodusNonprintedCollectorMatched += 1;
          else if (aliasUsed) counts.aliasMatched += 1;
          else counts.exactMatched += 1;
        }
        else if (status === "AMBIGUOUS") counts.ambiguous += 1;
        else if (status === "UNSUPPORTED_VARIANT")
          {
            counts.unsupportedVariant += 1;
            if (historicalFoilShell)
              counts.historicalFoilShellQuarantined += 1;
            else if (artSeriesFoilShell)
              counts.artSeriesFoilShellQuarantined += 1;
            else if (foilOnlyTreatmentNormalShell)
              counts.foilOnlyTreatmentNormalShellQuarantined += 1;
            else counts.unsupportedVariantQuarantined += 1;
          }
        else counts.unmatched += 1;
        const candidate = candidates.length === 1 ? candidates[0] : null;
        insertCrosswalk.run(
          row.identity_key,
          candidate?.categoryId ?? null,
          candidate?.sku ?? null,
          status,
          historicalFoilShell
            ? "QUARANTINED_PREMIUM_IMPOSSIBLE_FOIL_SHELL_V1"
            : artSeriesFoilShell
              ? "QUARANTINED_ART_SERIES_FOIL_SHELL_V1"
            : foilOnlyTreatmentNormalShell
              ? "QUARANTINED_FOIL_ONLY_TREATMENT_NORMAL_SHELL_V1"
            : !variant
              ? "QUARANTINED_UNSUPPORTED_VARIANT_V1"
          : historicalEditionUsed
            ? "EXPLICIT_HISTORICAL_EDITION_UNIQUE_NAME_VARIANT_V1"
            : catalogueSchemeUsed
              ? "EXPLICIT_CATALOGUE_SCHEME_UNIQUE_NAME_VARIANT_V1"
              : treatmentNameUsed
                ? "EDITION_TREATMENT_TO_PRODUCT_NAME_FULL_IDENTITY_V1"
                : documentedProductTreatmentUsed
                  ? "DOCUMENTED_PRODUCT_TREATMENT_FULL_IDENTITY_V1"
                  : artSeriesIdentityUsed
                    ? "ART_SERIES_PHYSICAL_PRODUCT_IDENTITY_V1"
                    : collectorSuffixIdentityUsed
                      ? "COLLECTOR_SUFFIX_FULL_IDENTITY_V1"
                      : tokenIdentityUsed
                        ? "TOKEN_NAME_COLLECTOR_EDITION_VARIANT_V1"
                        : genericVariantUsed
                          ? "GENERIC_VARIANT_FULL_COLLECTOR_IDENTITY_V1"
              : championshipMetadataUsed
                ? "EVIDENCE_DERIVED_WORLD_CHAMPIONSHIP_PLAYER_METADATA_V1"
            : preExodusCollectorFallbackUsed
            ? "UNIQUE_NAME_EDITION_VARIANT_PRE_EXODUS_NONPRINTED_COLLECTOR_V1"
            : missingTcgCollectorUsed
            ? aliasUsed
              ? "EVIDENCE_ALIAS_UNIQUE_NAME_EDITION_VARIANT_MISSING_TCG_COLLECTOR_V5"
              : "UNIQUE_NAME_EDITION_VARIANT_MISSING_TCG_COLLECTOR_V5"
            : aliasUsed
              ? "EVIDENCE_DERIVED_EDITION_ALIAS_V4"
              : "EXACT_NAME_EDITION_COLLECTOR_VARIANT_V2",
          status === "MATCHED"
            ? historicalEditionUsed
              ? `Unique normalized card name and finish after the explicit historical edition label mapping to ${historicalEditionTarget}.`
              : catalogueSchemeUsed
                ? `Unique normalized card name and finish under the explicit catalogue mapping to ${catalogueTarget?.edition}.`
                : treatmentNameUsed
                  ? `Unique full identity after moving the documented ${treatmentIdentity?.treatment} treatment from the LigaMagic edition label to the TCGplayer product name.`
                  : documentedProductTreatmentUsed
                    ? "Unique full identity after reconciling a documented TCGplayer treatment suffix omitted by the LigaMagic product name."
                    : artSeriesIdentityUsed
                      ? "Unique physical Art Series product from compatible edition, base collector, Art-side name, signature state, and Normal finish."
                      : collectorSuffixIdentityUsed
                        ? "Unique full identity after reconciling LigaMagic's one-letter collector variant suffix to the TCGplayer base collector."
                        : tokenIdentityUsed
                          ? "Unique token from the compatible base edition, exact finish, normalized face name, and one- or two-side collector identity."
                          : genericVariantUsed
                            ? "Unique generic-variant product from exact collector, finish, compatible base edition, and card name after trailing treatment labels are removed."
                : championshipMetadataUsed
                  ? `Unique World Championship printing after a unanimous ${championshipAlias?.anchorCount ?? 0}-card Liga player-code mapping to ${championshipAlias?.tcgplayerPlayer}.`
              : preExodusCollectorFallbackUsed
              ? "Unique normalized name, exact pre-Exodus edition, and finish; the source catalogues use nonprinted collector-order values."
              : missingTcgCollectorUsed
              ? aliasUsed
                ? `Unique name, finish, and conflict-free edition alias (${alias?.anchorCount ?? 0} anchors); the canonical TCGplayer collector number is absent.`
                : "Unique normalized name, edition, and finish; the canonical TCGplayer collector number is absent."
              : aliasUsed
              ? `Unique full identity after conflict-free edition alias (${alias?.anchorCount ?? 0} anchors).`
              : "Unique exact normalized identity."
            : !variant
              ? historicalFoilShell
                ? "LigaMagic Foil shell is quarantined because the named edition predates the first premium Magic printing."
                : artSeriesFoilShell
                  ? "LigaMagic Art Series Foil mirror is quarantined because TCGplayer represents Art Series physical products as Normal, with signature state in the product identity."
                : foilOnlyTreatmentNormalShell
                  ? "LigaMagic Normal mirror is quarantined because the edition identifies a foil-only treatment."
                : "LigaMagic variant is quarantined."
              : candidates.length > 1
                ? historicalEditionUsed
                  ? "More than one canonical product shares the explicit historical edition identity."
                  : catalogueSchemeUsed
                    ? "More than one canonical product shares the explicit catalogue identity."
                    : treatmentNameUsed
                      ? "More than one compatible product shares the treatment-aware full identity."
                      : documentedProductTreatmentUsed
                        ? "More than one compatible product shares the documented treatment-aware full identity."
                        : artSeriesIdentityUsed
                          ? "More than one physical Art Series product shares the collector, Art-side name, signature state, and edition identity."
                          : collectorSuffixIdentityUsed
                            ? "More than one compatible product shares the collector-suffix identity."
                            : tokenIdentityUsed
                              ? "More than one compatible token shares the collector, finish, and normalized face identity."
                              : genericVariantUsed
                                ? "More than one compatible product shares the generic-variant collector, finish, and reduced card name."
                    : championshipMetadataUsed
                      ? "More than one World Championship product shares the player, year, card, sideboard, and finish identity."
                  : preExodusCollectorFallbackUsed
                  ? "More than one canonical product shares the pre-Exodus reduced identity."
                  : missingTcgCollectorUsed
                  ? "More than one collector-less canonical product shares the reduced exact key."
                  : "More than one canonical product shares the exact key."
                : "No canonical product under the deterministic matching cascade.",
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
      const collisionRows = this.database.prepare(`
        SELECT c.liga_identity_key,c.category_id,c.sku,c.method,e.collector_number
        FROM regional_crosswalk c JOIN regional_evidence e USING(liga_identity_key)
        WHERE c.status='MATCHED' AND EXISTS(
          SELECT 1 FROM regional_crosswalk other
          WHERE other.status='MATCHED'
            AND other.category_id=c.category_id AND other.sku=c.sku
            AND other.liga_identity_key!=c.liga_identity_key
        )
        ORDER BY c.category_id,c.sku,c.liga_identity_key
      `).all() as Array<{
        liga_identity_key: string;
        category_id: string;
        sku: string;
        method: string;
        collector_number: string;
      }>;
      const collisionGroups = new Map<string, typeof collisionRows>();
      for (const row of collisionRows) {
        const key = `${row.category_id}|${row.sku}`;
        collisionGroups.set(key, [...(collisionGroups.get(key) ?? []), row]);
      }
      const quarantineCollision = this.database.prepare(`
        UPDATE regional_crosswalk
        SET status='AMBIGUOUS',method='TARGET_COLLISION_QUARANTINE_V1',
          reason='More than one LigaMagic identity resolves to this TCGplayer product; no unique canonical source identity was adopted.'
        WHERE liga_identity_key=?
      `);
      for (const rows of collisionGroups.values()) {
        const bestPriority = Math.min(
          ...rows.map((row) => matchMethodPriority(row.method)),
        );
        const bestRows = rows.filter(
          (row) => matchMethodPriority(row.method) === bestPriority,
        );
        const losers = bestRows.length === 1
          ? rows.filter((row) => row !== bestRows[0])
          : rows;
        for (const row of losers) {
          counts.matched -= 1;
          counts.ambiguous += 1;
          counts.targetCollisionQuarantined += 1;
          switch (row.method) {
            case "EXACT_NAME_EDITION_COLLECTOR_VARIANT_V2":
              counts.exactMatched -= 1;
              break;
            case "EVIDENCE_DERIVED_EDITION_ALIAS_V4":
              counts.aliasMatched -= 1;
              break;
            case "UNIQUE_NAME_EDITION_VARIANT_MISSING_TCG_COLLECTOR_V5":
              counts.missingTcgCollectorMatched -= 1;
              counts.missingTcgCollectorExactEditionMatched -= 1;
              break;
            case "EVIDENCE_ALIAS_UNIQUE_NAME_EDITION_VARIANT_MISSING_TCG_COLLECTOR_V5":
              counts.missingTcgCollectorMatched -= 1;
              counts.missingTcgCollectorAliasEditionMatched -= 1;
              break;
            case "UNIQUE_NAME_EDITION_VARIANT_PRE_EXODUS_NONPRINTED_COLLECTOR_V1":
              counts.preExodusNonprintedCollectorMatched -= 1;
              break;
            case "EXPLICIT_HISTORICAL_EDITION_UNIQUE_NAME_VARIANT_V1":
              counts.explicitHistoricalEditionMatched -= 1;
              break;
            case "EXPLICIT_CATALOGUE_SCHEME_UNIQUE_NAME_VARIANT_V1":
              counts.explicitCatalogueSchemeMatched -= 1;
              break;
            case "EVIDENCE_DERIVED_WORLD_CHAMPIONSHIP_PLAYER_METADATA_V1":
              counts.worldChampionshipMetadataMatched -= 1;
              break;
            case "EDITION_TREATMENT_TO_PRODUCT_NAME_FULL_IDENTITY_V1":
              counts.editionTreatmentNameMatched -= 1;
              break;
            case "DOCUMENTED_PRODUCT_TREATMENT_FULL_IDENTITY_V1":
              counts.documentedProductTreatmentNameMatched -= 1;
              break;
            case "ART_SERIES_PHYSICAL_PRODUCT_IDENTITY_V1":
              counts.artSeriesIdentityMatched -= 1;
              break;
            case "COLLECTOR_SUFFIX_FULL_IDENTITY_V1":
              counts.collectorSuffixIdentityMatched -= 1;
              break;
            case "TOKEN_NAME_COLLECTOR_EDITION_VARIANT_V1":
              counts.tokenIdentityMatched -= 1;
              if (tokenCollectorIdentity(row.collector_number)?.includes("|"))
                counts.doubleSidedTokenPairMatched -= 1;
              break;
            case "GENERIC_VARIANT_FULL_COLLECTOR_IDENTITY_V1":
              counts.genericVariantIdentityMatched -= 1;
              break;
          }
          quarantineCollision.run(row.liga_identity_key);
        }
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    } finally {
      liga.close();
    }
    const coverage = this.crosswalkCoverage();
    return {
      sourceRunId: manifest.runId,
      sourceHash,
      pricingFingerprint,
      ...counts,
      supportedTotal: counts.total - counts.unsupportedVariant,
      derivedEditionAliasCount: editionAliases.size,
      matchedCoveragePercent: percent(counts.matched, counts.total - counts.unsupportedVariant),
      ...coverage,
      crosswalkFingerprint: this.crosswalkFingerprint(),
      worldChampionshipPlayerAliasCount:
        worldChampionshipPlayerAliases.size,
      worldChampionshipPlayerAliases: [
        ...worldChampionshipPlayerAliases.values(),
      ].sort((left, right) =>
        `${left.year}|${left.ligaPlayerCode}`.localeCompare(
          `${right.year}|${right.ligaPlayerCode}`,
        ),
      ),
      editionAliases: [...editionAliases.values()]
        .map((alias) => ({
          ligaEdition: alias.sourceEdition,
          tcgplayerEdition: alias.edition,
          anchorCount: alias.anchorCount,
        }))
        .sort((left, right) => left.ligaEdition.localeCompare(right.ligaEdition)),
      topUnmatchedEditions: this.topUnmatchedEditions(),
    };
  }

  private crosswalkCoverage(): Pick<
    CrosswalkReport,
    | "matchedWithLigaConsumerPrice"
    | "matchedWithTcgNearMintPrice"
    | "comparableBoth"
    | "comparableCoveragePercent"
    | "unmatchedWithLigaConsumerPrice"
    | "ambiguousWithLigaConsumerPrice"
    | "supportedWithLigaConsumerPrice"
    | "consumerPricedMatchedCoveragePercent"
    | "matchedWithAnyLigaPrice"
    | "supportedWithAnyLigaPrice"
    | "anyLigaPriceMatchedCoveragePercent"
    | "supportedWithoutAnyLigaPrice"
  > {
    const row = this.database.prepare(`
      SELECT
        SUM(CASE WHEN c.status='MATCHED' AND e.consumer_low_centavos>0 THEN 1 ELSE 0 END) matched_liga,
        SUM(CASE WHEN c.status='MATCHED' AND EXISTS(
          SELECT 1 FROM pricing_latest latest
          WHERE latest.category_id=c.category_id AND latest.sku=c.sku
            AND latest.condition_key='NEAR_MINT'
            AND COALESCE(NULLIF(latest.delivered_price_cents,0), NULLIF(latest.listing_price_cents,0), NULLIF(latest.market_price_cents,0))>0
        ) THEN 1 ELSE 0 END) matched_tcg,
        SUM(CASE WHEN c.status='MATCHED' AND e.consumer_low_centavos>0 AND EXISTS(
          SELECT 1 FROM pricing_latest latest
          WHERE latest.category_id=c.category_id AND latest.sku=c.sku
            AND latest.condition_key='NEAR_MINT'
            AND COALESCE(NULLIF(latest.delivered_price_cents,0), NULLIF(latest.listing_price_cents,0), NULLIF(latest.market_price_cents,0))>0
        ) THEN 1 ELSE 0 END) comparable,
        SUM(CASE WHEN c.status='UNMATCHED' AND e.consumer_low_centavos>0 THEN 1 ELSE 0 END) unmatched_liga,
        SUM(CASE WHEN c.status='AMBIGUOUS' AND e.consumer_low_centavos>0 THEN 1 ELSE 0 END) ambiguous_liga,
        SUM(CASE WHEN c.status!='UNSUPPORTED_VARIANT' AND e.consumer_low_centavos>0 THEN 1 ELSE 0 END) supported_liga,
        SUM(CASE WHEN c.status='MATCHED' AND COALESCE(
          e.consumer_low_centavos,e.consumer_average_centavos,e.consumer_high_centavos,
          e.store_buy_low_centavos,e.store_buy_average_centavos,e.store_buy_high_centavos,0
        )>0 THEN 1 ELSE 0 END) matched_any_liga,
        SUM(CASE WHEN c.status!='UNSUPPORTED_VARIANT' AND COALESCE(
          e.consumer_low_centavos,e.consumer_average_centavos,e.consumer_high_centavos,
          e.store_buy_low_centavos,e.store_buy_average_centavos,e.store_buy_high_centavos,0
        )>0 THEN 1 ELSE 0 END) supported_any_liga,
        SUM(CASE WHEN c.status!='UNSUPPORTED_VARIANT' AND COALESCE(
          e.consumer_low_centavos,e.consumer_average_centavos,e.consumer_high_centavos,
          e.store_buy_low_centavos,e.store_buy_average_centavos,e.store_buy_high_centavos,0
        )<=0 THEN 1 ELSE 0 END) supported_without_any_liga
      FROM regional_crosswalk c JOIN regional_evidence e USING(liga_identity_key)
    `).get() as Sql;
    const matched = Number(this.database.prepare(
      "SELECT COUNT(*) count FROM regional_crosswalk WHERE status='MATCHED'",
    ).get()?.count ?? 0);
    const comparableBoth = Number(row.comparable ?? 0);
    const matchedWithLigaConsumerPrice = Number(row.matched_liga ?? 0);
    const supportedWithLigaConsumerPrice = Number(row.supported_liga ?? 0);
    const matchedWithAnyLigaPrice = Number(row.matched_any_liga ?? 0);
    const supportedWithAnyLigaPrice = Number(row.supported_any_liga ?? 0);
    return {
      matchedWithLigaConsumerPrice,
      matchedWithTcgNearMintPrice: Number(row.matched_tcg ?? 0),
      comparableBoth,
      comparableCoveragePercent: percent(comparableBoth, matched),
      unmatchedWithLigaConsumerPrice: Number(row.unmatched_liga ?? 0),
      ambiguousWithLigaConsumerPrice: Number(row.ambiguous_liga ?? 0),
      supportedWithLigaConsumerPrice,
      consumerPricedMatchedCoveragePercent: percent(
        matchedWithLigaConsumerPrice,
        supportedWithLigaConsumerPrice,
      ),
      matchedWithAnyLigaPrice,
      supportedWithAnyLigaPrice,
      anyLigaPriceMatchedCoveragePercent: percent(
        matchedWithAnyLigaPrice,
        supportedWithAnyLigaPrice,
      ),
      supportedWithoutAnyLigaPrice: Number(
        row.supported_without_any_liga ?? 0,
      ),
    };
  }

  private crosswalkFingerprint(): string {
    const hash = createHash("sha256");
    const rows = this.database.prepare(`
      SELECT liga_identity_key,status,category_id,sku,method
      FROM regional_crosswalk ORDER BY liga_identity_key
    `).all() as Sql[];
    for (const row of rows) {
      hash.update([
        row.liga_identity_key,
        row.status,
        row.category_id ?? "",
        row.sku ?? "",
        row.method,
      ].join("|")).update("\n");
    }
    return hash.digest("hex");
  }

  private topUnmatchedEditions(): CrosswalkReport["topUnmatchedEditions"] {
    return (this.database.prepare(`
      SELECT e.edition_name, COUNT(*) count,
        SUM(CASE WHEN e.consumer_low_centavos>0 THEN 1 ELSE 0 END) priced
      FROM regional_crosswalk c JOIN regional_evidence e USING(liga_identity_key)
      WHERE c.status='UNMATCHED'
      GROUP BY e.edition_name ORDER BY count DESC, e.edition_name LIMIT 25
    `).all() as Sql[]).map((row) => ({
      edition: String(row.edition_name),
      count: Number(row.count),
      withConsumerPrice: Number(row.priced),
    }));
  }

  listCandidates(limit = 100): ArbitrageCandidate[] {
    const profile = this.getProfile();
    const maximumEvidenceAgeHours = profile.maxEvidenceAgeHours ?? 7 * 24;
    const rows = this.database
      .prepare(
        `
      SELECT c.category_id,c.sku,p.name,p.set_name,p.collector_number,p.variant,e.*,
        COALESCE(NULLIF(l.delivered_price_cents,0),NULLIF(l.listing_price_cents,0),NULLIF(l.market_price_cents,0)) us_acquisition_price_cents,
        COALESCE(NULLIF(l.market_price_cents,0),NULLIF(l.listing_price_cents,0),NULLIF(l.delivered_price_cents,0)) us_resale_price_cents,
        l.snapshot_date us_observed_at
      FROM regional_crosswalk c JOIN regional_evidence e USING(liga_identity_key)
      JOIN pricing_products p ON p.category_id=c.category_id AND p.sku=c.sku
      JOIN pricing_latest l ON l.category_id=c.category_id AND l.sku=c.sku
      WHERE c.status='MATCHED' AND l.condition_key='NEAR_MINT'
        AND COALESCE(NULLIF(l.delivered_price_cents,0),NULLIF(l.listing_price_cents,0),NULLIF(l.market_price_cents,0))>0
        AND COALESCE(NULLIF(l.market_price_cents,0),NULLIF(l.listing_price_cents,0),NULLIF(l.delivered_price_cents,0))>0
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
        const verifiedAt = verification
          ? String(verification.observed_at)
          : null;
        const verified = Boolean(
          verifiedAt && Date.now() - Date.parse(verifiedAt) <= 24 * 3_600_000,
        );
        const observedUsPrice = Number(
          direction === "US_TO_BRAZIL"
            ? row.us_acquisition_price_cents
            : row.us_resale_price_cents,
        ) / 100;
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
            fresh(String(row.observed_at), maximumEvidenceAgeHours) &&
            fresh(String(row.us_observed_at), maximumEvidenceAgeHours),
          availabilityVerified: verified,
        });
        const acquisitionMarket =
          direction === "US_TO_BRAZIL" ? "TCGplayer" : "LigaMagic";
        const acquisitionValue =
          direction === "US_TO_BRAZIL" ? usPriceUsd : brazilPriceBrl;
        const acquisitionCurrency =
          direction === "US_TO_BRAZIL" ? "USD" : "BRL";
        const exitMarket =
          direction === "US_TO_BRAZIL" ? "LigaMagic" : "TCGplayer";
        const grossProceeds =
          direction === "US_TO_BRAZIL" ? brazilPriceBrl : usPriceUsd;
        const grossCurrency =
          direction === "US_TO_BRAZIL" ? "BRL" : "USD";
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
          acquisitionMarket,
          acquisitionBenchmark:
            direction === "US_TO_BRAZIL"
              ? verified
                ? "Verified executable US acquisition"
                : "US delivered/listing acquisition"
              : verified
                ? "Verified executable Brazil acquisition"
                : "LigaMagic consumer-low retail acquisition",
          acquisitionValue,
          acquisitionCurrency,
          exitMarket,
          exitBenchmark:
            direction === "US_TO_BRAZIL"
              ? "LigaMagic consumer-low retail exit"
              : "US market/listing resale benchmark",
          grossProceeds,
          grossCurrency,
          state: result.state,
          blocker: result.blocker,
          grossSpread: result.grossSpread,
          totalCost: result.totalCost,
          netProfit: result.netProfit,
          profitMarginPercent: result.profitMarginPercent,
          roiPercent: result.roiPercent,
          meetsTargets: result.meetsTargets,
          targetBlockers: result.targetBlockers,
          evidenceObservedAt: String(row.observed_at),
          evidenceAgeHours: Math.max(
            ageHours(String(row.observed_at)),
            ageHours(String(row.us_observed_at)),
          ),
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
    if (
      !candidate ||
      !["COSTED", "ACTIONABLE", "REJECTED"].includes(candidate.state)
    ) {
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
  const providerId =
    String(row.provider_id) === "ligapokemon"
      ? "ligapokemon"
      : "ligamagic";
  return {
    providerId,
    providerLabel:
      providerId === "ligapokemon" ? "LigaPokémon" : "LigaMagic",
    sourceRunId: String(row.source_run_id),
    ligaIdentityKey: String(row.liga_identity_key),
    categoryId: String(row.category_id),
    sku: String(row.sku),
    cardName: String(row.card_name),
    editionName: String(row.edition_name),
    editionCode: String(row.edition_code),
    collectorNumber: String(row.collector_number),
    variant: String(row.variant),
    condition: stringOrNull(row.condition_key),
    language: stringOrNull(row.language),
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
function fresh(value: string, maximumAgeHours: number): boolean {
  return (
    !Number.isNaN(Date.parse(value)) &&
    Date.now() - Date.parse(value) <= maximumAgeHours * 3_600_000
  );
}
function ageHours(value: string): number {
  if (Number.isNaN(Date.parse(value))) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 3_600_000));
}
function validateProfile(profile: RegionalCostProfile): void {
  for (const value of [
    profile.usToBrazilFixedBrl,
    profile.usToBrazilPercent,
    profile.usToBrazilMinAcquisitionUsd,
    profile.usToBrazilMaxAcquisitionUsd,
    profile.usToBrazilMinGrossProceedsBrl,
    profile.usToBrazilMinGrossSpreadBrl,
    profile.usToBrazilMinNetProfitBrl,
    profile.usToBrazilMinProfitMarginPercent,
    profile.usToBrazilMinRoiPercent,
    profile.brazilToUsFixedUsd,
    profile.brazilToUsPercent,
    profile.brazilToUsMinAcquisitionBrl,
    profile.brazilToUsMaxAcquisitionBrl,
    profile.brazilToUsMinGrossProceedsUsd,
    profile.brazilToUsMinGrossSpreadUsd,
    profile.brazilToUsMinNetProfitUsd,
    profile.brazilToUsMinProfitMarginPercent,
    profile.brazilToUsMinRoiPercent,
  ])
    if (value !== null && (!Number.isFinite(value) || value < 0))
      throw new Error("Costs and targets must be non-negative numbers or null.");
  if (
    profile.maxEvidenceAgeHours !== null &&
    (!Number.isFinite(profile.maxEvidenceAgeHours) ||
      profile.maxEvidenceAgeHours <= 0)
  )
    throw new Error("Maximum evidence age must be a positive number or null.");
  if (
    profile.usToBrazilMinAcquisitionUsd !== null &&
    profile.usToBrazilMaxAcquisitionUsd !== null &&
    profile.usToBrazilMinAcquisitionUsd > profile.usToBrazilMaxAcquisitionUsd
  )
    throw new Error("US acquisition minimum cannot exceed its maximum.");
  if (
    profile.brazilToUsMinAcquisitionBrl !== null &&
    profile.brazilToUsMaxAcquisitionBrl !== null &&
    profile.brazilToUsMinAcquisitionBrl > profile.brazilToUsMaxAcquisitionBrl
  )
    throw new Error("Brazil acquisition minimum cannot exceed its maximum.");
  if (
    profile.brlPerUsd !== null &&
    (!Number.isFinite(profile.brlPerUsd) || profile.brlPerUsd <= 0)
  )
    throw new Error("BRL per USD must be positive.");
  for (const value of [profile.brlPerUsdBuy, profile.brlPerUsdSell])
    if (value !== null && (!Number.isFinite(value) || value <= 0))
      throw new Error("Official BRL per USD quotes must be positive.");
  if (
    profile.brlPerUsdBuy !== null &&
    profile.brlPerUsdSell !== null &&
    profile.brlPerUsdBuy > profile.brlPerUsdSell
  )
    throw new Error("Official PTAX buy cannot exceed sell.");
  if (profile.fxObservedAt && Number.isNaN(Date.parse(profile.fxObservedAt)))
    throw new Error("FX observation time must be valid.");
  for (const value of [profile.fxFetchedAt, profile.fxLastAttemptAt])
    if (value && Number.isNaN(Date.parse(value)))
      throw new Error("FX retrieval time must be valid.");
}

function percent(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 10_000) / 100 : 0;
}

function matchMethodPriority(method: string): number {
  switch (method) {
    case "EXACT_NAME_EDITION_COLLECTOR_VARIANT_V2":
      return 0;
    case "EVIDENCE_DERIVED_EDITION_ALIAS_V4":
      return 1;
    case "UNIQUE_NAME_EDITION_VARIANT_MISSING_TCG_COLLECTOR_V5":
      return 2;
    case "EVIDENCE_ALIAS_UNIQUE_NAME_EDITION_VARIANT_MISSING_TCG_COLLECTOR_V5":
      return 3;
    default:
      return 4;
  }
}

type WorldChampionshipIdentity = {
  baseName: string;
  year: string;
  sideboard: boolean;
};

type LigaWorldChampionshipIdentity = WorldChampionshipIdentity & {
  playerCode: string;
};

type TcgplayerWorldChampionshipIdentity = WorldChampionshipIdentity & {
  player: string;
};

function isWorldChampionshipSourceEdition(edition: string): boolean {
  return edition === "World Championship Decks" || edition === "Pro Tour Decks";
}

function parseLigaWorldChampionshipName(
  value: string,
): LigaWorldChampionshipIdentity | null {
  const match = value.match(
    /^(.*?)(-SB)?\s*\(([A-Z]{1,5})-(\d{2})\)([A-Z])?$/i,
  );
  if (!match) return null;
  const year = `${Number(match[4]) >= 90 ? "19" : "20"}${match[4]}`;
  return {
    baseName: normalizeWorldChampionshipBaseName(match[1]),
    year,
    playerCode: match[3].toUpperCase(),
    sideboard: Boolean(match[2]),
  };
}

function parseTcgplayerWorldChampionshipName(
  value: string,
): TcgplayerWorldChampionshipIdentity | null {
  const match = value.match(
    /^(.*?) - ((?:19|20)\d{2}) (.+?) \([^)]+\)(?: \(SB\))?$/,
  );
  if (!match) return null;
  return {
    baseName: normalizeWorldChampionshipBaseName(match[1]),
    year: match[2],
    player: match[3],
    sideboard: /\(SB\)$/.test(value),
  };
}

function normalizeWorldChampionshipBaseName(value: string): string {
  return normalizeSearchText(
    value.replace(/\s*\((?:#\s*)?\d+[a-z]?\)\s*$/i, "").trim(),
  );
}

function worldChampionshipAnchorKey(
  identity: WorldChampionshipIdentity,
): string {
  return [
    identity.year,
    identity.baseName,
    identity.sideboard ? "sideboard" : "main",
  ].join("|");
}

function worldChampionshipProductKey(
  identity: TcgplayerWorldChampionshipIdentity,
): string {
  return [
    identity.year,
    identity.player,
    identity.baseName,
    identity.sideboard ? "sideboard" : "main",
  ].join("|");
}
