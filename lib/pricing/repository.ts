import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  getActivePricingCategory,
  pricingLookupConfig,
} from "@/config/pricingLookup";
import {
  artworkIdentityKey,
  deliveredPriceFor,
  isStale,
  queryClearlyTargetsSingle,
  searchScore,
} from "@/lib/pricing/domain";
import type { CardImageUrls } from "@/types/card";
import {
  createPricingSearchPlan,
  type PricingSearchPlan,
} from "@/lib/pricing/searchPlan";
import type { PricingExportContract } from "@/lib/pricing/contract";
import {
  parsePricingExport,
  PricingContractError,
} from "@/lib/pricing/contract";
import type {
  NormalizedPricingRow,
  PriceState,
  PricingCondition,
  PricingSearchResponse,
  PricingSyncState,
  PricingSyncStatus,
  SearchMatch,
  UnifiedPricingSearchResponse,
} from "@/lib/pricing/types";

type SqlRow = Record<string, string | number | null>;

export type ImportResult = {
  status: "IMPORTED" | "ALREADY_IMPORTED";
  sourceHash: string;
  rowsRead: number;
  productsUpserted: number;
  snapshotsInserted: number;
};

export type NormalizedImportMetadata = {
  categoryId: string;
  sourceHash: string;
  contractVersion: string;
  sourceSchemaVersion: string;
  checkpointAt?: string | null;
};

export type ArtworkWarmCandidate = SearchMatch & {
  artworkPriorityCents: number;
};

export class PricingRepository {
  readonly database: DatabaseSync;

  constructor(databasePath = ":memory:") {
    if (databasePath !== ":memory:")
      mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.migrate();
  }

  close(): void {
    this.database.close();
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS pricing_products (
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        product_type TEXT NOT NULL CHECK(product_type IN ('SINGLE','SEALED')),
        name TEXT NOT NULL,
        set_name TEXT NOT NULL,
        collector_number TEXT,
        variant TEXT NOT NULL,
        language TEXT NOT NULL,
        image_url TEXT,
        PRIMARY KEY(category_id, sku)
      );
      CREATE TABLE IF NOT EXISTS pricing_latest (
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        condition_key TEXT NOT NULL,
        market_price_cents INTEGER,
        listing_price_cents INTEGER,
        shipping_cents INTEGER,
        shipping_source TEXT NOT NULL,
        delivered_price_cents INTEGER,
        snapshot_date TEXT NOT NULL,
        source_sku TEXT,
        PRIMARY KEY(category_id, sku, condition_key),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS pricing_artwork_resolutions (
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        identity_key TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        image_urls_json TEXT NOT NULL,
        verified_at TEXT NOT NULL,
        PRIMARY KEY(category_id, sku),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS pricing_artwork_resolution_identity
        ON pricing_artwork_resolutions(category_id, identity_key);
      CREATE TABLE IF NOT EXISTS pricing_history (
        id INTEGER PRIMARY KEY,
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        condition_key TEXT NOT NULL,
        market_price_cents INTEGER,
        listing_price_cents INTEGER,
        shipping_cents INTEGER,
        shipping_source TEXT NOT NULL,
        delivered_price_cents INTEGER,
        snapshot_date TEXT NOT NULL,
        source_sku TEXT,
        UNIQUE(category_id, sku, condition_key, snapshot_date),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS pricing_history_lookup
        ON pricing_history(category_id, sku, condition_key, snapshot_date DESC, id DESC);
      CREATE TABLE IF NOT EXISTS pricing_imports (
        category_id TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        contract_version TEXT NOT NULL,
        source_schema_version TEXT NOT NULL,
        snapshot_date TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        PRIMARY KEY(category_id, source_hash, contract_version)
      );
      CREATE TABLE IF NOT EXISTS pricing_catalogue_receipts (
        category_id TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        contract_version TEXT NOT NULL,
        checkpoint_key TEXT NOT NULL,
        snapshot_date TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        PRIMARY KEY(category_id, source_hash, contract_version, checkpoint_key)
      );
      CREATE TABLE IF NOT EXISTS pricing_category_state (
        category_id TEXT PRIMARY KEY,
        snapshot_date TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        source_schema_version TEXT NOT NULL,
        checkpoint_at TEXT,
        source_hash TEXT,
        contract_version TEXT
      );
      CREATE TABLE IF NOT EXISTS pricing_sync_state (
        category_id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        checkpoint_at TEXT,
        started_at TEXT,
        completed_at TEXT,
        source_hash TEXT,
        source_path TEXT,
        rows_read INTEGER,
        products_upserted INTEGER,
        snapshots_inserted INTEGER,
        last_error TEXT
      );
      CREATE VIRTUAL TABLE IF NOT EXISTS pricing_search USING fts5(
        category_id UNINDEXED,
        sku UNINDEXED,
        name,
        set_name,
        collector_number,
        variant,
        tokenize='unicode61 remove_diacritics 2'
      );
    `);
    this.ensureColumn("pricing_latest", "source_sku", "TEXT");
    this.ensureColumn("pricing_history", "source_sku", "TEXT");
    this.ensureColumn("pricing_category_state", "checkpoint_at", "TEXT");
    this.ensureColumn("pricing_category_state", "source_hash", "TEXT");
    this.ensureColumn("pricing_category_state", "contract_version", "TEXT");
  }

  private ensureColumn(
    table: string,
    column: string,
    definition: string,
  ): void {
    const columns = this.database
      .prepare(`PRAGMA table_info(${table})`)
      .all() as SqlRow[];
    if (!columns.some((candidate) => candidate.name === column)) {
      this.database.exec(
        `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
      );
    }
  }

  importCsv(
    categoryId: string,
    csv: string,
    contract: PricingExportContract,
  ): ImportResult {
    const category = getActivePricingCategory(categoryId);
    if (!category)
      throw new PricingContractError(
        `Category ${categoryId} is not active. Edit configuration before importing.`,
      );
    if (contract.status !== "AUTHORITATIVE") {
      throw new PricingContractError(
        "Production imports require an AUTHORITATIVE schema contract. TEST_ONLY contracts are accepted only by deterministic fixtures.",
      );
    }
    const sourceHash = createHash("sha256").update(csv).digest("hex");
    return this.importNormalizedRows(
      parsePricingExport(csv, contract, categoryId),
      {
        categoryId,
        sourceHash,
        contractVersion: contract.contractVersion,
        sourceSchemaVersion: contract.sourceSchemaVersion,
      },
    );
  }

  importTestCsv(
    categoryId: string,
    csv: string,
    contract: PricingExportContract,
  ): ImportResult {
    if (!getActivePricingCategory(categoryId))
      throw new PricingContractError(`Category ${categoryId} is not active.`);
    const sourceHash = createHash("sha256").update(csv).digest("hex");
    return this.importNormalizedRows(
      parsePricingExport(csv, contract, categoryId),
      {
        categoryId,
        sourceHash,
        contractVersion: contract.contractVersion,
        sourceSchemaVersion: contract.sourceSchemaVersion,
      },
    );
  }

  hasImport(metadata: NormalizedImportMetadata): boolean {
    return Boolean(
      this.database
        .prepare(
          "SELECT 1 FROM pricing_catalogue_receipts WHERE category_id = ? AND source_hash = ? AND contract_version = ? AND checkpoint_key = ?",
        )
        .get(
          metadata.categoryId,
          metadata.sourceHash,
          metadata.contractVersion,
          this.receiptKey(metadata),
        ),
    );
  }

  private receiptKey(metadata: NormalizedImportMetadata): string {
    return metadata.checkpointAt ?? `source:${metadata.sourceHash}`;
  }

  importNormalizedRows(
    rows: Iterable<NormalizedPricingRow>,
    metadata: NormalizedImportMetadata,
  ): ImportResult {
    if (!getActivePricingCategory(metadata.categoryId)) {
      throw new PricingContractError(
        `Category ${metadata.categoryId} is not active.`,
      );
    }
    if (this.hasImport(metadata)) {
      return {
        status: "ALREADY_IMPORTED",
        sourceHash: metadata.sourceHash,
        rowsRead: 0,
        productsUpserted: 0,
        snapshotsInserted: 0,
      };
    }
    let snapshotDate: string | null = null;
    let rowsRead = 0;
    let snapshotsInserted = 0;
    let productsUpserted = 0;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.exec(`
        CREATE TEMP TABLE IF NOT EXISTS pricing_import_stage (
          category_id TEXT NOT NULL,
          sku TEXT NOT NULL,
          condition_key TEXT NOT NULL,
          product_type TEXT NOT NULL,
          name TEXT NOT NULL,
          set_name TEXT NOT NULL,
          collector_number TEXT,
          variant TEXT NOT NULL,
          language TEXT NOT NULL,
          image_url TEXT,
          market_price_cents INTEGER,
          listing_price_cents INTEGER,
          shipping_cents INTEGER,
          shipping_source TEXT NOT NULL,
          delivered_price_cents INTEGER,
          snapshot_date TEXT NOT NULL,
          source_sku TEXT,
          PRIMARY KEY(category_id, sku, condition_key)
        ) WITHOUT ROWID;
        DELETE FROM pricing_import_stage;
      `);
      const stageRow = this.database.prepare(`
        INSERT INTO pricing_import_stage(
          category_id, sku, condition_key, product_type, name, set_name, collector_number,
          variant, language, image_url, market_price_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rows) {
        rowsRead += 1;
        if (row.categoryId !== metadata.categoryId) {
          throw new PricingContractError(
            `One export must contain exactly category ${metadata.categoryId}.`,
          );
        }
        snapshotDate ??= row.snapshotDate;
        if (row.snapshotDate !== snapshotDate) {
          throw new PricingContractError(
            "One export must contain exactly one snapshot timestamp.",
          );
        }
        const conditionKey = row.condition ?? "NO_CONDITION";
        const computedDelivery = deliveredPriceFor(
          row.productType,
          row.listingPriceCents,
          row.shippingCents,
        );
        const delivery =
          row.exportedDeliveredPriceCents !== undefined &&
          row.exportedDeliveredPriceCents !== null
            ? {
                deliveredPriceCents: row.exportedDeliveredPriceCents,
                shippingCents: row.shippingCents,
                shippingSource:
                  row.shippingCents === null
                    ? row.shippingSource
                    : ("EXPORTED" as const),
              }
            : computedDelivery;
        try {
          stageRow.run(
            row.categoryId,
            row.sku,
            conditionKey,
            row.productType,
            row.name,
            row.setName,
            row.collectorNumber,
            row.variant,
            row.language,
            row.imageUrl,
            row.marketPriceCents,
            row.listingPriceCents,
            delivery.shippingCents,
            delivery.shippingSource,
            delivery.deliveredPriceCents,
            row.snapshotDate,
            row.sourceSku ?? null,
          );
        } catch (error) {
          if (
            error instanceof Error &&
            /UNIQUE constraint failed/.test(error.message)
          ) {
            throw new PricingContractError(
              `Duplicate product/condition row: ${row.sku}/${conditionKey}.`,
            );
          }
          throw error;
        }
      }
      if (rowsRead === 0 || snapshotDate === null)
        throw new PricingContractError("Export contains no data rows.");
      const collision = this.database
        .prepare(
          `
        SELECT sku FROM pricing_import_stage GROUP BY sku HAVING
          MIN(product_type) IS NOT MAX(product_type) OR MIN(name) IS NOT MAX(name) OR
          MIN(set_name) IS NOT MAX(set_name) OR MIN(COALESCE(collector_number, '')) IS NOT MAX(COALESCE(collector_number, '')) OR
          MIN(variant) IS NOT MAX(variant) OR MIN(language) IS NOT MAX(language) LIMIT 1
      `,
        )
        .get() as SqlRow | undefined;
      if (collision)
        throw new PricingContractError(
          `Deterministic product-key collision for ${String(collision.sku)}.`,
        );

      productsUpserted = Number(
        (
          this.database
            .prepare(
              "SELECT count(DISTINCT sku) AS count FROM pricing_import_stage",
            )
            .get() as SqlRow
        ).count,
      );
      this.database.exec(`
        INSERT INTO pricing_products(category_id, sku, product_type, name, set_name, collector_number, variant, language, image_url)
        SELECT category_id, sku, MIN(product_type), MIN(name), MIN(set_name), MIN(collector_number), MIN(variant), MIN(language), MAX(image_url)
        FROM pricing_import_stage GROUP BY category_id, sku
        ON CONFLICT(category_id, sku) DO UPDATE SET
          product_type=excluded.product_type, name=excluded.name, set_name=excluded.set_name,
          collector_number=excluded.collector_number, variant=excluded.variant,
          language=excluded.language, image_url=excluded.image_url;

      `);
      this.database
        .prepare("DELETE FROM pricing_search WHERE category_id=?")
        .run(metadata.categoryId);
      this.database.exec(`
        INSERT INTO pricing_search(category_id, sku, name, set_name, collector_number, variant)
        SELECT category_id, sku, MIN(name), MIN(set_name), COALESCE(MIN(collector_number), ''), MIN(variant)
        FROM pricing_import_stage GROUP BY category_id, sku;
        INSERT OR IGNORE INTO pricing_history(
          category_id, sku, condition_key, market_price_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        )
        SELECT s.category_id, s.sku, s.condition_key, s.market_price_cents, s.listing_price_cents,
          s.shipping_cents, s.shipping_source, s.delivered_price_cents, s.snapshot_date, s.source_sku
        FROM pricing_import_stage s
        LEFT JOIN pricing_latest l ON l.category_id=s.category_id AND l.sku=s.sku AND l.condition_key=s.condition_key
        WHERE l.sku IS NULL OR l.market_price_cents IS NOT s.market_price_cents
          OR l.listing_price_cents IS NOT s.listing_price_cents
          OR l.shipping_cents IS NOT s.shipping_cents
          OR l.shipping_source IS NOT s.shipping_source
          OR l.delivered_price_cents IS NOT s.delivered_price_cents;
      `);
      snapshotsInserted = Number(
        (this.database.prepare("SELECT changes() AS count").get() as SqlRow)
          .count,
      );
      this.database.exec(`
        INSERT INTO pricing_latest(
          category_id, sku, condition_key, market_price_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        )
        SELECT category_id, sku, condition_key, market_price_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        FROM pricing_import_stage WHERE true
        ON CONFLICT(category_id, sku, condition_key) DO UPDATE SET
          market_price_cents=excluded.market_price_cents, listing_price_cents=excluded.listing_price_cents,
          shipping_cents=excluded.shipping_cents, shipping_source=excluded.shipping_source,
          delivered_price_cents=excluded.delivered_price_cents, snapshot_date=excluded.snapshot_date,
          source_sku=excluded.source_sku;
      `);
      const importedAt = new Date().toISOString();
      this.database
        .prepare(
          `
        INSERT INTO pricing_category_state(category_id, snapshot_date, imported_at, source_schema_version, checkpoint_at, source_hash, contract_version)
        VALUES(?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(category_id) DO UPDATE SET snapshot_date=excluded.snapshot_date, imported_at=excluded.imported_at,
          source_schema_version=excluded.source_schema_version, checkpoint_at=excluded.checkpoint_at,
          source_hash=excluded.source_hash, contract_version=excluded.contract_version
      `,
        )
        .run(
          metadata.categoryId,
          snapshotDate,
          importedAt,
          metadata.sourceSchemaVersion,
          metadata.checkpointAt ?? null,
          metadata.sourceHash,
          metadata.contractVersion,
        );
      this.database
        .prepare(
          `
        INSERT INTO pricing_imports(category_id, source_hash, contract_version, source_schema_version, snapshot_date, imported_at, row_count)
        VALUES(?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(category_id, source_hash, contract_version) DO NOTHING
      `,
        )
        .run(
          metadata.categoryId,
          metadata.sourceHash,
          metadata.contractVersion,
          metadata.sourceSchemaVersion,
          snapshotDate,
          importedAt,
          rowsRead,
        );
      this.database
        .prepare(
          `
        INSERT INTO pricing_catalogue_receipts(
          category_id, source_hash, contract_version, checkpoint_key, snapshot_date, imported_at, row_count
        ) VALUES(?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .run(
          metadata.categoryId,
          metadata.sourceHash,
          metadata.contractVersion,
          this.receiptKey(metadata),
          snapshotDate,
          importedAt,
          rowsRead,
        );
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return {
      status: "IMPORTED",
      sourceHash: metadata.sourceHash,
      rowsRead,
      productsUpserted,
      snapshotsInserted,
    };
  }

  recordSyncState(input: {
    categoryId: string;
    status: PricingSyncStatus;
    checkpointAt?: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    sourceHash?: string | null;
    sourcePath?: string | null;
    result?: ImportResult | null;
    lastError?: string | null;
  }): void {
    this.database
      .prepare(
        `
      INSERT INTO pricing_sync_state(category_id, status, checkpoint_at, started_at, completed_at, source_hash, source_path, rows_read, products_upserted, snapshots_inserted, last_error)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(category_id) DO UPDATE SET status=excluded.status, checkpoint_at=excluded.checkpoint_at,
        started_at=excluded.started_at, completed_at=excluded.completed_at, source_hash=excluded.source_hash,
        source_path=excluded.source_path, rows_read=excluded.rows_read, products_upserted=excluded.products_upserted,
        snapshots_inserted=excluded.snapshots_inserted, last_error=excluded.last_error
    `,
      )
      .run(
        input.categoryId,
        input.status,
        input.checkpointAt ?? null,
        input.startedAt ?? null,
        input.completedAt ?? null,
        input.sourceHash ?? null,
        input.sourcePath ?? null,
        input.result?.rowsRead ?? null,
        input.result?.productsUpserted ?? null,
        input.result?.snapshotsInserted ?? null,
        input.lastError ?? null,
      );
  }

  getSyncStates(): PricingSyncState[] {
    return (
      this.database
        .prepare("SELECT * FROM pricing_sync_state ORDER BY category_id")
        .all() as SqlRow[]
    ).map((row) => ({
      categoryId: String(row.category_id),
      status: String(row.status) as PricingSyncStatus,
      checkpointAt: row.checkpoint_at as string | null,
      startedAt: row.started_at as string | null,
      completedAt: row.completed_at as string | null,
      sourceHash: row.source_hash as string | null,
      sourcePath: row.source_path as string | null,
      rowsRead: row.rows_read as number | null,
      productsUpserted: row.products_upserted as number | null,
      snapshotsInserted: row.snapshots_inserted as number | null,
      lastError: row.last_error as string | null,
    }));
  }

  search(
    categoryId: string,
    query: string,
    now = new Date(),
  ): PricingSearchResponse {
    const plan = createPricingSearchPlan(query);
    const category = getActivePricingCategory(categoryId);
    if (!category) {
      return {
        query,
        interpretations: plan.interpretations,
        category: {
          categoryId,
          label: categoryId,
          snapshotDate: null,
          stale: false,
          loaded: false,
        },
        sealed: [],
        singles: [],
        sealedSuppressed: false,
      };
    }
    const state = this.database
      .prepare(
        `
      SELECT c.*, s.status AS sync_status, s.last_error FROM pricing_category_state c
      LEFT JOIN pricing_sync_state s ON s.category_id=c.category_id WHERE c.category_id=?
    `,
      )
      .get(categoryId) as SqlRow | undefined;
    const freshness = {
      categoryId,
      label: category.label,
      snapshotDate: (state?.snapshot_date as string | undefined) ?? null,
      stale: isStale((state?.snapshot_date as string | undefined) ?? null, now),
      loaded: Boolean(state),
      importedAt: (state?.imported_at as string | null) ?? null,
      checkpointAt: (state?.checkpoint_at as string | null) ?? null,
      sourceSchemaVersion:
        (state?.source_schema_version as string | null) ?? null,
      syncStatus: (state?.sync_status as PricingSyncStatus | null) ?? null,
      lastError: (state?.last_error as string | null) ?? null,
    };
    const trimmed = query.trim();
    if (!state || trimmed.length < pricingLookupConfig.minimumQueryLength)
      return {
        query,
        interpretations: plan.interpretations,
        category: freshness,
        sealed: [],
        singles: [],
        sealedSuppressed: queryClearlyTargetsSingle(query),
      };
    if (!plan.tokens.length)
      return {
        query,
        interpretations: plan.interpretations,
        category: freshness,
        sealed: [],
        singles: [],
        sealedSuppressed: queryClearlyTargetsSingle(query),
      };
    const candidates = this.database
      .prepare(
        `
      SELECT p.* FROM pricing_search s
      JOIN pricing_products p ON p.category_id=s.category_id AND p.sku=s.sku
      WHERE pricing_search MATCH ? AND s.category_id=? LIMIT 160
    `,
      )
      .all(plan.ftsQuery, categoryId) as SqlRow[];
    const matches = candidates
      .map((candidate) => this.hydrateMatch(candidate, query, plan))
      .filter((match) => match.score > 0)
      .sort(
        (a, b) =>
          b.score - a.score ||
          a.name.localeCompare(b.name) ||
          a.sku.localeCompare(b.sku),
      );
    const sealedSuppressed = queryClearlyTargetsSingle(query);
    return {
      query,
      interpretations: plan.interpretations,
      category: freshness,
      sealedSuppressed,
      sealed: sealedSuppressed
        ? []
        : matches
            .filter(
              (match) =>
                match.productType === "SEALED" &&
                match.score >= pricingLookupConfig.sealedRelevanceThreshold,
            )
            .slice(0, pricingLookupConfig.resultLimit),
      singles: matches
        .filter((match) => match.productType === "SINGLE")
        .slice(0, pricingLookupConfig.resultLimit),
    };
  }

  searchAll(query: string, now = new Date()): UnifiedPricingSearchResponse {
    const responses = pricingLookupConfig.categories
      .filter((category) => category.active)
      .map((category) => this.search(category.id, query, now));
    const rank = (a: SearchMatch, b: SearchMatch) =>
      b.score - a.score ||
      a.name.localeCompare(b.name) ||
      a.categoryId.localeCompare(b.categoryId) ||
      a.sku.localeCompare(b.sku);
    return {
      query,
      interpretations: responses[0]?.interpretations ?? [],
      categories: responses.map((response) => response.category),
      sealedSuppressed: queryClearlyTargetsSingle(query),
      singles: responses
        .flatMap((response) => response.singles)
        .sort(rank)
        .slice(0, pricingLookupConfig.unifiedCandidateLimit),
      sealed: responses
        .flatMap((response) => response.sealed)
        .sort(rank)
        .slice(0, pricingLookupConfig.resultLimit),
    };
  }

  listArtworkCandidates(categoryId: string): ArtworkWarmCandidate[] {
    const rows = this.database
      .prepare(
        `
      SELECT p.*, MAX(COALESCE(l.market_price_cents, l.listing_price_cents, 0)) AS artwork_priority_cents
      FROM pricing_products p
      LEFT JOIN pricing_latest l ON l.category_id=p.category_id AND l.sku=p.sku
      WHERE p.category_id=? AND p.product_type='SINGLE'
      GROUP BY p.category_id, p.sku
      ORDER BY artwork_priority_cents DESC, p.name, p.sku
    `,
      )
      .all(categoryId) as SqlRow[];
    return rows.map((candidate) => ({
      categoryId: String(candidate.category_id),
      sku: String(candidate.sku),
      productType: "SINGLE",
      name: String(candidate.name),
      setName: String(candidate.set_name),
      collectorNumber: candidate.collector_number as string | null,
      variant: String(candidate.variant),
      language: String(candidate.language),
      imageUrl: candidate.image_url as string | null,
      score: 0,
      prices: {},
      sealedPrice: null,
      previousMarketPriceCents: null,
      previousSnapshotDate: null,
      artworkPriorityCents: Number(candidate.artwork_priority_cents ?? 0),
    }));
  }

  getArtworkResolutions(matches: readonly SearchMatch[]): Record<string, CardImageUrls> {
    const artwork: Record<string, CardImageUrls> = {};
    const statement = this.database.prepare(
      `SELECT identity_key, image_urls_json FROM pricing_artwork_resolutions WHERE category_id=? AND sku=?`,
    );
    for (const match of matches) {
      const row = statement.get(match.categoryId, match.sku) as SqlRow | undefined;
      if (!row || String(row.identity_key) !== artworkIdentityKey(match)) continue;
      try {
        const parsed = JSON.parse(String(row.image_urls_json)) as Record<string, unknown>;
        const urls: CardImageUrls = {};
        for (const key of ["artCrop", "large", "normal", "small"] as const) {
          if (typeof parsed[key] === "string" && parsed[key].length > 0) urls[key] = parsed[key];
        }
        if (urls.artCrop || urls.large || urls.normal || urls.small) artwork[match.sku] = urls;
      } catch {
        // A malformed local row is ignored and can be replaced by the next verified provider result.
      }
    }
    return artwork;
  }

  saveArtworkResolutions(
    matches: readonly SearchMatch[],
    artwork: Record<string, CardImageUrls>,
    providerId: string,
  ): number {
    return this.writeArtworkResolutions(matches, artwork, providerId, false);
  }

  replaceArtworkResolutions(
    matches: readonly SearchMatch[],
    artwork: Record<string, CardImageUrls>,
    providerId: string,
  ): number {
    return this.writeArtworkResolutions(matches, artwork, providerId, true);
  }

  private writeArtworkResolutions(
    matches: readonly SearchMatch[],
    artwork: Record<string, CardImageUrls>,
    providerId: string,
    replaceCategory: boolean,
  ): number {
    const matchesBySku = new Map(matches.map((match) => [match.sku, match]));
    const statement = this.database.prepare(`
      INSERT INTO pricing_artwork_resolutions(category_id, sku, identity_key, provider_id, image_urls_json, verified_at)
      VALUES(?, ?, ?, ?, ?, ?)
      ON CONFLICT(category_id, sku) DO UPDATE SET
        identity_key=excluded.identity_key,
        provider_id=excluded.provider_id,
        image_urls_json=excluded.image_urls_json,
        verified_at=excluded.verified_at
    `);
    const verifiedAt = new Date().toISOString();
    let saved = 0;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (replaceCategory) {
        const categories = [...new Set(matches.map((match) => match.categoryId))];
        for (const categoryId of categories) {
          this.database.prepare(
            "DELETE FROM pricing_artwork_resolutions WHERE category_id=? AND provider_id=?",
          ).run(categoryId, providerId);
        }
      }
      for (const [sku, urls] of Object.entries(artwork)) {
        const match = matchesBySku.get(sku);
        if (!match || !(urls.artCrop || urls.large || urls.normal || urls.small)) continue;
        statement.run(
          match.categoryId,
          match.sku,
          artworkIdentityKey(match),
          providerId,
          JSON.stringify(urls),
          verifiedAt,
        );
        saved += 1;
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return saved;
  }

  findBySku(categoryId: string, sku: string): SearchMatch | null {
    const candidate = this.database
      .prepare(
        `
      SELECT * FROM pricing_products WHERE category_id = ? AND sku = ?
    `,
      )
      .get(categoryId, sku) as SqlRow | undefined;
    return candidate
      ? this.hydrateMatch(candidate, String(candidate.name))
      : null;
  }

  findByName(categoryId: string, name: string): SearchMatch[] {
    const candidates = this.database
      .prepare(
        `
      SELECT * FROM pricing_products
      WHERE category_id = ? AND name = ? COLLATE NOCASE
      ORDER BY sku LIMIT 200
    `,
      )
      .all(categoryId, name.trim()) as SqlRow[];
    return candidates.map((candidate) =>
      this.hydrateMatch(candidate, String(candidate.name)),
    );
  }

  private hydrateMatch(
    candidate: SqlRow,
    query: string,
    plan?: PricingSearchPlan,
  ): SearchMatch {
    const categoryId = String(candidate.category_id);
    const sku = String(candidate.sku);
    const latest = this.database
      .prepare("SELECT * FROM pricing_latest WHERE category_id=? AND sku=?")
      .all(categoryId, sku) as SqlRow[];
    const prices: SearchMatch["prices"] = {};
    let sealedPrice: SearchMatch["sealedPrice"] = null;
    for (const row of latest) {
      const state: PriceState = {
        marketPriceCents: row.market_price_cents as number | null,
        listingPriceCents: row.listing_price_cents as number | null,
        shippingCents: row.shipping_cents as number | null,
        shippingSource: row.shipping_source as
          "EXPORTED" | "ASSUMED" | "UNKNOWN",
        deliveredPriceCents: row.delivered_price_cents as number | null,
        snapshotDate: String(row.snapshot_date),
        sourceSku: row.source_sku as string | null,
      };
      const history = this.database
        .prepare(
          `
        SELECT market_price_cents, snapshot_date FROM pricing_history
        WHERE category_id=? AND sku=? AND condition_key=? ORDER BY snapshot_date DESC, id DESC LIMIT 2
      `,
        )
        .all(categoryId, sku, String(row.condition_key)) as SqlRow[];
      state.previousMarketPriceCents =
        (history[1]?.market_price_cents as number | null) ?? null;
      state.previousSnapshotDate =
        (history[1]?.snapshot_date as string | null) ?? null;
      if (row.condition_key === "NO_CONDITION") sealedPrice = state;
      else prices[row.condition_key as PricingCondition] = state;
    }
    const movementCondition =
      candidate.product_type === "SEALED"
        ? "NO_CONDITION"
        : pricingLookupConfig.defaultCondition;
    const history = this.database
      .prepare(
        `SELECT market_price_cents, snapshot_date FROM pricing_history WHERE category_id=? AND sku=? AND condition_key=? ORDER BY snapshot_date DESC, id DESC LIMIT 2`,
      )
      .all(categoryId, sku, movementCondition) as SqlRow[];
    const identity = {
      name: String(candidate.name),
      setName: String(candidate.set_name),
      collectorNumber: candidate.collector_number as string | null,
      variant: String(candidate.variant),
      productType: candidate.product_type as "SINGLE" | "SEALED",
    };
    return {
      categoryId,
      sku,
      ...identity,
      language: String(candidate.language),
      imageUrl: candidate.image_url as string | null,
      score: searchScore(identity, query, plan),
      prices,
      sealedPrice,
      previousMarketPriceCents:
        (history[1]?.market_price_cents as number | null) ?? null,
      previousSnapshotDate:
        (history[1]?.snapshot_date as string | null) ?? null,
    };
  }
}
