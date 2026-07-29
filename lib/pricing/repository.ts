import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getActivePricingCategory, pricingLookupConfig } from "@/config/pricingLookup";
import { deliveredPriceFor, isStale, normalizeSearchText, queryClearlyTargetsSingle, searchScore } from "@/lib/pricing/domain";
import type { PricingExportContract } from "@/lib/pricing/contract";
import { parsePricingExport, PricingContractError } from "@/lib/pricing/contract";
import type {
  NormalizedPricingRow,
  PricingCondition,
  PricingSearchResponse,
  SearchMatch,
} from "@/lib/pricing/types";

type SqlRow = Record<string, string | number | null>;

export type ImportResult = {
  status: "IMPORTED" | "ALREADY_IMPORTED";
  sourceHash: string;
  rowsRead: number;
  productsUpserted: number;
  snapshotsInserted: number;
};

export class PricingRepository {
  readonly database: DatabaseSync;

  constructor(databasePath = ":memory:") {
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
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
        PRIMARY KEY(category_id, sku, condition_key),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
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
      CREATE TABLE IF NOT EXISTS pricing_category_state (
        category_id TEXT PRIMARY KEY,
        snapshot_date TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        source_schema_version TEXT NOT NULL
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
  }

  importCsv(categoryId: string, csv: string, contract: PricingExportContract): ImportResult {
    const category = getActivePricingCategory(categoryId);
    if (!category) throw new PricingContractError(`Category ${categoryId} is not active. Edit configuration before importing.`);
    if (contract.status !== "AUTHORITATIVE") {
      throw new PricingContractError("Production imports require an AUTHORITATIVE schema contract. TEST_ONLY contracts are accepted only by deterministic fixtures.");
    }
    return this.importRows(csv, contract, parsePricingExport(csv, contract, categoryId));
  }

  importTestCsv(categoryId: string, csv: string, contract: PricingExportContract): ImportResult {
    if (!getActivePricingCategory(categoryId)) throw new PricingContractError(`Category ${categoryId} is not active.`);
    return this.importRows(csv, contract, parsePricingExport(csv, contract, categoryId));
  }

  private importRows(csv: string, contract: PricingExportContract, rows: NormalizedPricingRow[]): ImportResult {
    const sourceHash = createHash("sha256").update(csv).digest("hex");
    const already = this.database
      .prepare("SELECT 1 FROM pricing_imports WHERE category_id = ? AND source_hash = ? AND contract_version = ?")
      .get(rows[0]?.categoryId ?? "", sourceHash, contract.contractVersion);
    if (already) return { status: "ALREADY_IMPORTED", sourceHash, rowsRead: rows.length, productsUpserted: 0, snapshotsInserted: 0 };
    if (!rows.length) throw new PricingContractError("Export contains no data rows.");
    const snapshotDates = new Set(rows.map((row) => row.snapshotDate));
    if (snapshotDates.size !== 1) throw new PricingContractError("One export must contain exactly one snapshot date.");
    const categoryIds = new Set(rows.map((row) => row.categoryId));
    if (categoryIds.size !== 1) throw new PricingContractError("One export must contain exactly one category.");
    const rowKeys = new Set<string>();
    for (const row of rows) {
      const key = `${row.sku}\0${row.condition ?? "NO_CONDITION"}`;
      if (rowKeys.has(key)) throw new PricingContractError(`Duplicate SKU/condition row: ${row.sku}/${row.condition ?? "no condition"}.`);
      rowKeys.add(key);
    }

    let snapshotsInserted = 0;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const upsertProduct = this.database.prepare(`
        INSERT INTO pricing_products(category_id, sku, product_type, name, set_name, collector_number, variant, language, image_url)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(category_id, sku) DO UPDATE SET
          product_type=excluded.product_type, name=excluded.name, set_name=excluded.set_name,
          collector_number=excluded.collector_number, variant=excluded.variant,
          language=excluded.language, image_url=excluded.image_url
      `);
      const getLatest = this.database.prepare("SELECT * FROM pricing_latest WHERE category_id=? AND sku=? AND condition_key=?");
      const deleteSearch = this.database.prepare("DELETE FROM pricing_search WHERE category_id=? AND sku=?");
      const insertSearch = this.database.prepare("INSERT INTO pricing_search(category_id, sku, name, set_name, collector_number, variant) VALUES(?, ?, ?, ?, ?, ?)");
      const upsertLatest = this.database.prepare(`
        INSERT INTO pricing_latest(category_id, sku, condition_key, market_price_cents, listing_price_cents, shipping_cents, shipping_source, delivered_price_cents, snapshot_date)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(category_id, sku, condition_key) DO UPDATE SET
          market_price_cents=excluded.market_price_cents, listing_price_cents=excluded.listing_price_cents,
          shipping_cents=excluded.shipping_cents, shipping_source=excluded.shipping_source,
          delivered_price_cents=excluded.delivered_price_cents, snapshot_date=excluded.snapshot_date
      `);
      const insertHistory = this.database.prepare(`
        INSERT INTO pricing_history(category_id, sku, condition_key, market_price_cents, listing_price_cents, shipping_cents, shipping_source, delivered_price_cents, snapshot_date)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rows) {
        upsertProduct.run(row.categoryId, row.sku, row.productType, row.name, row.setName, row.collectorNumber, row.variant, row.language, row.imageUrl);
        deleteSearch.run(row.categoryId, row.sku);
        insertSearch.run(row.categoryId, row.sku, row.name, row.setName, row.collectorNumber ?? "", row.variant);
        const conditionKey = row.condition ?? "NO_CONDITION";
        const delivery = deliveredPriceFor(row.productType, row.listingPriceCents, row.shippingCents);
        const values = [row.categoryId, row.sku, conditionKey, row.marketPriceCents, row.listingPriceCents, delivery.shippingCents, delivery.shippingSource, delivery.deliveredPriceCents, row.snapshotDate] as const;
        const latest = getLatest.get(row.categoryId, row.sku, conditionKey) as SqlRow | undefined;
        const changed = !latest || [
          ["market_price_cents", row.marketPriceCents],
          ["listing_price_cents", row.listingPriceCents],
          ["shipping_cents", delivery.shippingCents],
          ["shipping_source", delivery.shippingSource],
          ["delivered_price_cents", delivery.deliveredPriceCents],
        ].some(([key, value]) => latest[key as string] !== value);
        if (changed) {
          insertHistory.run(...values);
          snapshotsInserted += 1;
        }
        upsertLatest.run(...values);
      }
      const categoryId = rows[0].categoryId;
      const snapshotDate = rows[0].snapshotDate;
      const importedAt = new Date().toISOString();
      this.database.prepare(`
        INSERT INTO pricing_category_state(category_id, snapshot_date, imported_at, source_schema_version)
        VALUES(?, ?, ?, ?)
        ON CONFLICT(category_id) DO UPDATE SET snapshot_date=excluded.snapshot_date, imported_at=excluded.imported_at, source_schema_version=excluded.source_schema_version
      `).run(categoryId, snapshotDate, importedAt, contract.sourceSchemaVersion);
      this.database.prepare(`
        INSERT INTO pricing_imports(category_id, source_hash, contract_version, source_schema_version, snapshot_date, imported_at, row_count)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(categoryId, sourceHash, contract.contractVersion, contract.sourceSchemaVersion, snapshotDate, importedAt, rows.length);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return { status: "IMPORTED", sourceHash, rowsRead: rows.length, productsUpserted: new Set(rows.map((row) => row.sku)).size, snapshotsInserted };
  }

  search(categoryId: string, query: string, now = new Date()): PricingSearchResponse {
    const category = getActivePricingCategory(categoryId);
    if (!category) {
      return { query, category: { categoryId, label: categoryId, snapshotDate: null, stale: false, loaded: false }, sealed: [], singles: [], sealedSuppressed: false };
    }
    const state = this.database.prepare("SELECT snapshot_date FROM pricing_category_state WHERE category_id=?").get(categoryId) as SqlRow | undefined;
    const freshness = { categoryId, label: category.label, snapshotDate: (state?.snapshot_date as string | undefined) ?? null, stale: isStale((state?.snapshot_date as string | undefined) ?? null, now), loaded: Boolean(state) };
    const trimmed = query.trim();
    if (!state || trimmed.length < pricingLookupConfig.minimumQueryLength) return { query, category: freshness, sealed: [], singles: [], sealedSuppressed: queryClearlyTargetsSingle(query) };
    const terms = normalizeSearchText(trimmed).split(" ").filter(Boolean);
    if (!terms.length) return { query, category: freshness, sealed: [], singles: [], sealedSuppressed: queryClearlyTargetsSingle(query) };
    const ftsQuery = terms.map((term) => `"${term.replaceAll('"', '""')}"*`).join(" AND ");
    const candidates = this.database.prepare(`
      SELECT p.* FROM pricing_search s
      JOIN pricing_products p ON p.category_id=s.category_id AND p.sku=s.sku
      WHERE pricing_search MATCH ? AND s.category_id=? LIMIT 160
    `).all(ftsQuery, categoryId) as SqlRow[];
    const matches = candidates.map((candidate) => this.hydrateMatch(candidate, query)).filter((match) => match.score > 0).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.sku.localeCompare(b.sku));
    const sealedSuppressed = queryClearlyTargetsSingle(query);
    return {
      query,
      category: freshness,
      sealedSuppressed,
      sealed: sealedSuppressed ? [] : matches.filter((match) => match.productType === "SEALED" && match.score >= pricingLookupConfig.sealedRelevanceThreshold).slice(0, pricingLookupConfig.resultLimit),
      singles: matches.filter((match) => match.productType === "SINGLE").slice(0, pricingLookupConfig.resultLimit),
    };
  }

  private hydrateMatch(candidate: SqlRow, query: string): SearchMatch {
    const categoryId = String(candidate.category_id);
    const sku = String(candidate.sku);
    const latest = this.database.prepare("SELECT * FROM pricing_latest WHERE category_id=? AND sku=?").all(categoryId, sku) as SqlRow[];
    const prices: SearchMatch["prices"] = {};
    let sealedPrice: SearchMatch["sealedPrice"] = null;
    for (const row of latest) {
      const state = {
        marketPriceCents: row.market_price_cents as number | null,
        listingPriceCents: row.listing_price_cents as number | null,
        shippingCents: row.shipping_cents as number | null,
        shippingSource: row.shipping_source as "EXPORTED" | "ASSUMED" | "UNKNOWN",
        deliveredPriceCents: row.delivered_price_cents as number | null,
        snapshotDate: String(row.snapshot_date),
      };
      if (row.condition_key === "NO_CONDITION") sealedPrice = state;
      else prices[row.condition_key as PricingCondition] = state;
    }
    const movementCondition = candidate.product_type === "SEALED" ? "NO_CONDITION" : pricingLookupConfig.defaultCondition;
    const history = this.database.prepare(`SELECT market_price_cents, snapshot_date FROM pricing_history WHERE category_id=? AND sku=? AND condition_key=? ORDER BY snapshot_date DESC, id DESC LIMIT 2`).all(categoryId, sku, movementCondition) as SqlRow[];
    const identity = {
      name: String(candidate.name), setName: String(candidate.set_name), collectorNumber: candidate.collector_number as string | null,
      variant: String(candidate.variant), productType: candidate.product_type as "SINGLE" | "SEALED",
    };
    return {
      categoryId, sku, ...identity, language: String(candidate.language), imageUrl: candidate.image_url as string | null,
      score: searchScore(identity, query), prices, sealedPrice,
      previousMarketPriceCents: history[1]?.market_price_cents as number | null ?? null,
      previousSnapshotDate: history[1]?.snapshot_date as string | null ?? null,
    };
  }
}
