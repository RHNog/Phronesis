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
  type PricingSearchResolvedAlias,
  type PricingSearchPlan,
} from "@/lib/pricing/searchPlan";
import {
  canonicalOnePieceCollectorNumber,
  canonicalOnePieceSetCode,
  deriveOnePieceSetAliases,
  type OnePieceSetEvidenceRow,
} from "@/lib/pricing/setAliases";
import { normalizeSearchText } from "@/lib/pricing/searchText";
import {
  dominantTypoCorrection,
  searchTrigrams,
} from "@/lib/pricing/typoCorrection";
import type { PricingExportContract } from "@/lib/pricing/contract";
import {
  parsePricingExport,
  PricingContractError,
} from "@/lib/pricing/contract";
import type {
  NormalizedPricingRow,
  PriceState,
  PricingCondition,
  ProductType,
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

export type ArtworkReviewState = "PENDING" | "ACCEPTED" | "REJECTED";

export type ArtworkReviewCandidateInput = {
  sku: string;
  sourcePath: string;
  sourceUrl: string;
  productClass: string;
  reason: string;
  rank: number;
};

export type ArtworkReviewCandidate = ArtworkReviewCandidateInput & {
  state: ArtworkReviewState;
  reviewedAt: string | null;
};

export type ArtworkReviewProduct = {
  categoryId: string;
  sku: string;
  name: string;
  setName: string;
  productClass: string;
  reason: string;
  galleryActive: boolean;
  candidates: ArtworkReviewCandidate[];
};

export type ArtworkReviewQueue = {
  items: ArtworkReviewProduct[];
  page: { limit: number; offset: number; total: number };
  summary: {
    exact: number;
    representative: number;
    ownerRepresentative: number;
    assistedRepresentative: number;
    packagingGallery: number;
    visible: number;
    totalSealed: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
};

export type ArtworkResolutionProvenance = {
  kind: "OWNER_APPROVED_REPRESENTATIVE" | "ASSISTED_REPRESENTATIVE" | "OWNER_APPROVED_PACKAGING_GALLERY";
  label: string;
  reviewedAt: string;
};

export type AssistedArtworkReviewResult =
  | "APPLIED"
  | "ALREADY_APPLIED"
  | "BLOCKED_BY_REVIEW"
  | "BLOCKED_BY_RESOLUTION";

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
        direct_low_cents INTEGER,
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
      CREATE TABLE IF NOT EXISTS pricing_artwork_review_candidates (
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        identity_key TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        source_path TEXT NOT NULL,
        source_url TEXT NOT NULL,
        product_class TEXT NOT NULL,
        reason TEXT NOT NULL,
        candidate_rank INTEGER NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
        staged_at TEXT NOT NULL,
        PRIMARY KEY(category_id, sku, source_url),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS pricing_artwork_review_queue
        ON pricing_artwork_review_candidates(category_id, active, candidate_rank, sku);
      CREATE TABLE IF NOT EXISTS pricing_artwork_review_events (
        id INTEGER PRIMARY KEY,
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        identity_key TEXT NOT NULL,
        source_url TEXT NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('ACCEPT','REJECT','RESTORE','REVOKE')),
        actor_user_id TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS pricing_artwork_review_event_latest
        ON pricing_artwork_review_events(category_id, sku, source_url, id DESC);
      CREATE TABLE IF NOT EXISTS pricing_artwork_resolution_provenance (
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        identity_key TEXT NOT NULL,
        resolution_kind TEXT NOT NULL CHECK(resolution_kind IN ('OWNER_APPROVED_REPRESENTATIVE','ASSISTED_REPRESENTATIVE')),
        provider_id TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        source_path TEXT NOT NULL,
        source_url TEXT NOT NULL,
        reviewed_by TEXT NOT NULL,
        reviewed_at TEXT NOT NULL,
        PRIMARY KEY(category_id, sku),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS pricing_artwork_galleries (
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        identity_key TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        source_path TEXT NOT NULL,
        source_url TEXT NOT NULL,
        position INTEGER NOT NULL CHECK(position >= 0),
        reviewed_by TEXT NOT NULL,
        reviewed_at TEXT NOT NULL,
        PRIMARY KEY(category_id, sku, source_url),
        UNIQUE(category_id, sku, position),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS pricing_artwork_gallery_identity
        ON pricing_artwork_galleries(category_id, sku, identity_key, position);
      CREATE TABLE IF NOT EXISTS pricing_history (
        id INTEGER PRIMARY KEY,
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        condition_key TEXT NOT NULL,
        market_price_cents INTEGER,
        direct_low_cents INTEGER,
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
      CREATE TABLE IF NOT EXISTS pricing_search_aliases (
        category_id TEXT NOT NULL,
        alias TEXT NOT NULL,
        canonical_text TEXT NOT NULL,
        evidence_count INTEGER NOT NULL CHECK(evidence_count >= 2),
        runner_up_count INTEGER NOT NULL CHECK(runner_up_count >= 0),
        PRIMARY KEY(category_id, alias)
      );
      CREATE TABLE IF NOT EXISTS pricing_search_vocabulary (
        category_id TEXT NOT NULL,
        term TEXT NOT NULL,
        document_count INTEGER NOT NULL CHECK(document_count > 0),
        PRIMARY KEY(category_id, term)
      );
      CREATE TABLE IF NOT EXISTS pricing_search_trigrams (
        category_id TEXT NOT NULL,
        trigram TEXT NOT NULL,
        term TEXT NOT NULL,
        document_count INTEGER NOT NULL CHECK(document_count > 0),
        PRIMARY KEY(category_id, trigram, term),
        FOREIGN KEY(category_id, term)
          REFERENCES pricing_search_vocabulary(category_id, term)
          ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS pricing_search_trigram_lookup
        ON pricing_search_trigrams(category_id, trigram, document_count DESC);
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
    const latestColumns = this.database.prepare("PRAGMA table_info(pricing_latest)").all() as Array<{ name: string }>;
    if (!latestColumns.some((column) => column.name === "direct_low_cents")) this.database.exec("ALTER TABLE pricing_latest ADD COLUMN direct_low_cents INTEGER");
    const historyColumns = this.database.prepare("PRAGMA table_info(pricing_history)").all() as Array<{ name: string }>;
    if (!historyColumns.some((column) => column.name === "direct_low_cents")) this.database.exec("ALTER TABLE pricing_history ADD COLUMN direct_low_cents INTEGER");
    this.migrateArtworkRepresentativeProvenance();
    this.ensureColumn("pricing_latest", "source_sku", "TEXT");
    this.ensureColumn("pricing_history", "source_sku", "TEXT");
    this.ensureColumn("pricing_category_state", "checkpoint_at", "TEXT");
    this.ensureColumn("pricing_category_state", "source_hash", "TEXT");
    this.ensureColumn("pricing_category_state", "contract_version", "TEXT");
    this.ensureSearchVocabulary();
    this.refreshOnePieceSetAliases();
  }

  private ensureSearchVocabulary(): void {
    const searchable = Number(
      (
        this.database.prepare("SELECT COUNT(*) count FROM pricing_search").get() as
          | SqlRow
          | undefined
      )?.count ?? 0,
    );
    const vocabulary = Number(
      (
        this.database
          .prepare("SELECT COUNT(*) count FROM pricing_search_vocabulary")
          .get() as SqlRow
      ).count,
    );
    if (searchable > 0 && vocabulary === 0) this.refreshSearchVocabulary();
  }

  private refreshSearchVocabulary(categoryId?: string): void {
    const rows = this.database
      .prepare(
        `SELECT s.category_id, s.sku, p.name
         FROM pricing_search s
         JOIN pricing_products p
           ON p.category_id = s.category_id AND p.sku = s.sku
         ${categoryId ? "WHERE s.category_id = ?" : ""}`,
      )
      .all(...(categoryId ? [categoryId] : [])) as SqlRow[];
    const counts = new Map<string, number>();
    for (const row of rows) {
      const terms = new Set(
        normalizeSearchText(String(row.name))
          .split(" ")
          .filter((term) => /^[a-z]{4,}$/.test(term)),
      );
      for (const term of terms) {
        const key = `${String(row.category_id)}\u0000${term}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
    this.database.exec("SAVEPOINT refresh_search_vocabulary");
    try {
      if (categoryId) {
        this.database
          .prepare("DELETE FROM pricing_search_vocabulary WHERE category_id = ?")
          .run(categoryId);
      } else {
        this.database.prepare("DELETE FROM pricing_search_vocabulary").run();
      }
      const insertTerm = this.database.prepare(
        `INSERT INTO pricing_search_vocabulary(
          category_id, term, document_count
        ) VALUES(?, ?, ?)`,
      );
      const insertTrigram = this.database.prepare(
        `INSERT INTO pricing_search_trigrams(
          category_id, trigram, term, document_count
        ) VALUES(?, ?, ?, ?)`,
      );
      for (const [key, documentCount] of counts) {
        const [candidateCategoryId, term] = key.split("\u0000");
        insertTerm.run(candidateCategoryId, term, documentCount);
        for (const trigram of searchTrigrams(term)) {
          insertTrigram.run(
            candidateCategoryId,
            trigram,
            term,
            documentCount,
          );
        }
      }
      this.database.exec("RELEASE refresh_search_vocabulary");
    } catch (error) {
      this.database.exec("ROLLBACK TO refresh_search_vocabulary");
      this.database.exec("RELEASE refresh_search_vocabulary");
      throw error;
    }
  }

  private migrateArtworkRepresentativeProvenance(): void {
    const row = this.database.prepare(
      "SELECT sql FROM sqlite_master WHERE type='table' AND name='pricing_artwork_resolution_provenance'",
    ).get() as { sql?: string } | undefined;
    if (row?.sql?.includes("ASSISTED_REPRESENTATIVE")) return;
    this.database.exec(`
      BEGIN IMMEDIATE;
      ALTER TABLE pricing_artwork_resolution_provenance RENAME TO pricing_artwork_resolution_provenance_legacy;
      CREATE TABLE pricing_artwork_resolution_provenance (
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        identity_key TEXT NOT NULL,
        resolution_kind TEXT NOT NULL CHECK(resolution_kind IN ('OWNER_APPROVED_REPRESENTATIVE','ASSISTED_REPRESENTATIVE')),
        provider_id TEXT NOT NULL,
        source_revision TEXT NOT NULL,
        source_path TEXT NOT NULL,
        source_url TEXT NOT NULL,
        reviewed_by TEXT NOT NULL,
        reviewed_at TEXT NOT NULL,
        PRIMARY KEY(category_id, sku),
        FOREIGN KEY(category_id, sku) REFERENCES pricing_products(category_id, sku) ON DELETE CASCADE
      );
      INSERT INTO pricing_artwork_resolution_provenance(
        category_id,sku,identity_key,resolution_kind,provider_id,source_revision,
        source_path,source_url,reviewed_by,reviewed_at
      )
      SELECT category_id,sku,identity_key,resolution_kind,provider_id,source_revision,
        source_path,source_url,reviewed_by,reviewed_at
      FROM pricing_artwork_resolution_provenance_legacy;
      DROP TABLE pricing_artwork_resolution_provenance_legacy;
      COMMIT;
    `);
  }

  private refreshOnePieceSetAliases(): void {
    const rows = this.database
      .prepare(
        `
        SELECT p.sku, p.set_name, p.collector_number
        FROM pricing_search s
        JOIN pricing_products p
          ON p.category_id=s.category_id AND p.sku=s.sku
        WHERE p.category_id='onepiece-en' AND p.product_type='SINGLE'
          AND p.collector_number IS NOT NULL AND p.collector_number <> ''
      `,
      )
      .all() as SqlRow[];
    const aliases = deriveOnePieceSetAliases(
      rows.map(
        (row): OnePieceSetEvidenceRow => ({
          sku: String(row.sku),
          setName: String(row.set_name),
          collectorNumber: row.collector_number as string | null,
        }),
      ),
    );
    const insert = this.database.prepare(`
      INSERT INTO pricing_search_aliases(
        category_id, alias, canonical_text, evidence_count, runner_up_count
      ) VALUES('onepiece-en', ?, ?, ?, ?)
    `);
    this.database.exec("SAVEPOINT refresh_onepiece_search_aliases");
    try {
      this.database
        .prepare("DELETE FROM pricing_search_aliases WHERE category_id='onepiece-en'")
        .run();
      for (const alias of aliases) {
        insert.run(
          alias.alias,
          alias.canonicalSetName,
          alias.evidenceCount,
          alias.runnerUpCount,
        );
      }
      this.database.exec("RELEASE refresh_onepiece_search_aliases");
    } catch (error) {
      this.database.exec("ROLLBACK TO refresh_onepiece_search_aliases");
      this.database.exec("RELEASE refresh_onepiece_search_aliases");
      throw error;
    }
  }

  private createSearchPlan(
    categoryId: string,
    query: string,
    suppliedAliases: readonly PricingSearchResolvedAlias[] = [],
  ): PricingSearchPlan {
    const basePlan = createPricingSearchPlan(query, suppliedAliases);
    if (categoryId !== "onepiece-en" || !basePlan.tokens.length) {
      return basePlan;
    }
    const findAlias = this.database.prepare(`
      SELECT canonical_text FROM pricing_search_aliases
      WHERE category_id=? AND alias=?
    `);
    const resolved = basePlan.tokens.flatMap((token) => {
      const alias = canonicalOnePieceSetCode(token.token);
      if (alias) {
        const row = findAlias.get(categoryId, alias) as SqlRow | undefined;
        if (row) {
          const canonical = String(row.canonical_text);
          return [
            {
              input: token.token,
              canonical,
              message: `Understood ${alias.toUpperCase()} as ${canonical}`,
            },
          ];
        }
      }
      const collectorNumber = canonicalOnePieceCollectorNumber(token.token);
      if (!collectorNumber || collectorNumber === token.token) return [];
      return [
        {
          input: token.token,
          canonical: collectorNumber,
          message: `Understood collector ${token.token} as ${collectorNumber}`,
        },
      ];
    });
    return resolved.length
      ? createPricingSearchPlan(query, [...suppliedAliases, ...resolved])
      : basePlan;
  }

  private typoAliases(
    categoryId: string,
    plan: PricingSearchPlan,
  ): PricingSearchResolvedAlias[] {
    const exactTerm = this.database.prepare(
      `SELECT 1 FROM pricing_search_vocabulary
       WHERE category_id = ? AND term = ?`,
    );
    const aliases: PricingSearchResolvedAlias[] = [];
    for (const token of plan.tokens) {
      if (aliases.length >= 2) break;
      if (!/^[a-z]{4,}$/.test(token.token)) continue;
      if (exactTerm.get(categoryId, token.token)) continue;
      const trigrams = searchTrigrams(token.token);
      if (!trigrams.length) continue;
      const rows = this.database
        .prepare(
          `SELECT term, MAX(document_count) document_count,
                  COUNT(DISTINCT trigram) overlap_count
           FROM pricing_search_trigrams
           WHERE category_id = ? AND trigram IN (${trigrams
             .map(() => "?")
             .join(", ")})
           GROUP BY term
           ORDER BY overlap_count DESC, document_count DESC, term
           LIMIT 32`,
        )
        .all(categoryId, ...trigrams) as SqlRow[];
      const correction = dominantTypoCorrection(
        token.token,
        rows.map((row) => ({
          term: String(row.term),
          documentCount: Number(row.document_count),
        })),
      );
      if (!correction) continue;
      const display = `${correction.term[0].toUpperCase()}${correction.term.slice(1)}`;
      aliases.push({
        input: token.token,
        canonical: correction.term,
        message: `Did you mean ${display}? Showing matches for ${display}.`,
      });
    }
    return aliases;
  }

  private searchCandidates(
    categoryId: string,
    plan: PricingSearchPlan,
  ): SqlRow[] {
    return this.database
      .prepare(
        `SELECT p.* FROM pricing_search s
         JOIN pricing_products p
           ON p.category_id = s.category_id AND p.sku = s.sku
         WHERE pricing_search MATCH ? AND s.category_id = ? LIMIT 160`,
      )
      .all(plan.ftsQuery, categoryId) as SqlRow[];
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
          direct_low_cents INTEGER,
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
          variant, language, image_url, market_price_cents, direct_low_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            row.directLowCents ?? null,
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
          category_id, sku, condition_key, market_price_cents, direct_low_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        )
        SELECT s.category_id, s.sku, s.condition_key, s.market_price_cents, s.direct_low_cents, s.listing_price_cents,
          s.shipping_cents, s.shipping_source, s.delivered_price_cents, s.snapshot_date, s.source_sku
        FROM pricing_import_stage s
        LEFT JOIN pricing_latest l ON l.category_id=s.category_id AND l.sku=s.sku AND l.condition_key=s.condition_key
        WHERE l.sku IS NULL OR l.market_price_cents IS NOT s.market_price_cents
          OR l.direct_low_cents IS NOT s.direct_low_cents
          OR l.listing_price_cents IS NOT s.listing_price_cents
          OR l.shipping_cents IS NOT s.shipping_cents
          OR l.shipping_source IS NOT s.shipping_source
          OR l.delivered_price_cents IS NOT s.delivered_price_cents;
      `);
      snapshotsInserted = Number(
        (this.database.prepare("SELECT changes() AS count").get() as SqlRow)
          .count,
      );
      this.refreshSearchVocabulary(metadata.categoryId);
      if (metadata.categoryId === "onepiece-en") {
        this.refreshOnePieceSetAliases();
      }
      this.database.exec(`
        INSERT INTO pricing_latest(
          category_id, sku, condition_key, market_price_cents, direct_low_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        )
        SELECT category_id, sku, condition_key, market_price_cents, direct_low_cents, listing_price_cents,
          shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku
        FROM pricing_import_stage WHERE true
        ON CONFLICT(category_id, sku, condition_key) DO UPDATE SET
          market_price_cents=excluded.market_price_cents, direct_low_cents=excluded.direct_low_cents, listing_price_cents=excluded.listing_price_cents,
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
    let plan = this.createSearchPlan(categoryId, query);
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
    let candidates = this.searchCandidates(categoryId, plan);
    if (candidates.length === 0) {
      const typoAliases = this.typoAliases(categoryId, plan);
      if (typoAliases.length) {
        const correctedPlan = this.createSearchPlan(
          categoryId,
          query,
          typoAliases,
        );
        const correctedCandidates = this.searchCandidates(
          categoryId,
          correctedPlan,
        );
        if (correctedCandidates.length) {
          plan = correctedPlan;
          candidates = correctedCandidates;
        }
      }
    }
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
    const interpretations = [
      ...new Map(
        responses
          .flatMap((response) => response.interpretations ?? [])
          .map((interpretation) => [
            `${interpretation.input}|${interpretation.canonical}`,
            interpretation,
          ]),
      ).values(),
    ];
    return {
      query,
      interpretations,
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

  listArtworkCandidates(
    categoryId: string,
    productType: ProductType = "SINGLE",
  ): ArtworkWarmCandidate[] {
    const rows = this.database
      .prepare(
        `
      SELECT p.*, MAX(COALESCE(l.market_price_cents, l.listing_price_cents, 0)) AS artwork_priority_cents
      FROM pricing_products p
      LEFT JOIN pricing_latest l ON l.category_id=p.category_id AND l.sku=p.sku
      WHERE p.category_id=? AND p.product_type=?
      GROUP BY p.category_id, p.sku
      ORDER BY artwork_priority_cents DESC, p.name, p.sku
    `,
      )
      .all(categoryId, productType) as SqlRow[];
    return rows.map((candidate) => ({
      categoryId: String(candidate.category_id),
      sku: String(candidate.sku),
      productType,
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

  getArtworkGalleries(matches: readonly SearchMatch[]): Record<string, CardImageUrls[]> {
    const galleries: Record<string, CardImageUrls[]> = {};
    const statement = this.database.prepare(`
      SELECT identity_key, source_url
      FROM pricing_artwork_galleries
      WHERE category_id=? AND sku=?
      ORDER BY position, source_path
    `);
    for (const match of matches) {
      const rows = statement.all(match.categoryId, match.sku) as SqlRow[];
      if (!rows.length || rows.some((row) => String(row.identity_key) !== artworkIdentityKey(match))) continue;
      galleries[match.sku] = rows.map((row) => ({
        small: String(row.source_url),
        normal: String(row.source_url),
        large: String(row.source_url),
      }));
    }
    return galleries;
  }

  getArtworkResolutionProvenance(matches: readonly SearchMatch[]): Record<string, ArtworkResolutionProvenance> {
    const provenance: Record<string, ArtworkResolutionProvenance> = {};
    const galleryStatement = this.database.prepare(`
      SELECT identity_key, reviewed_at
      FROM pricing_artwork_galleries
      WHERE category_id=? AND sku=?
      ORDER BY position LIMIT 1
    `);
    const statement = this.database.prepare(`
      SELECT p.identity_key, p.resolution_kind, p.reviewed_at
      FROM pricing_artwork_resolution_provenance p
      JOIN pricing_artwork_resolutions r ON r.category_id=p.category_id AND r.sku=p.sku
      WHERE p.category_id=? AND p.sku=? AND r.identity_key=p.identity_key
    `);
    for (const match of matches) {
      const gallery = galleryStatement.get(match.categoryId, match.sku) as SqlRow | undefined;
      if (gallery && String(gallery.identity_key) === artworkIdentityKey(match)) {
        provenance[match.sku] = {
          kind: "OWNER_APPROVED_PACKAGING_GALLERY",
          label: "Owner-approved packaging gallery",
          reviewedAt: String(gallery.reviewed_at),
        };
        continue;
      }
      const row = statement.get(match.categoryId, match.sku) as SqlRow | undefined;
      if (!row || String(row.identity_key) !== artworkIdentityKey(match)) continue;
      const kind = String(row.resolution_kind);
      if (kind !== "OWNER_APPROVED_REPRESENTATIVE" && kind !== "ASSISTED_REPRESENTATIVE") continue;
      provenance[match.sku] = {
        kind,
        label: kind === "ASSISTED_REPRESENTATIVE"
          ? "Phronesis-assisted representative image"
          : "Owner-approved representative image",
        reviewedAt: String(row.reviewed_at),
      };
    }
    return provenance;
  }

  stageArtworkReviewCandidates(
    categoryId: string,
    providerId: string,
    sourceRevision: string,
    matches: readonly SearchMatch[],
    candidates: readonly ArtworkReviewCandidateInput[],
  ): number {
    const matchesBySku = new Map(matches.map((match) => [match.sku, match]));
    const stagedAt = new Date().toISOString();
    const statement = this.database.prepare(`
      INSERT INTO pricing_artwork_review_candidates(
        category_id,sku,identity_key,provider_id,source_revision,source_path,source_url,
        product_class,reason,candidate_rank,active,staged_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,1,?)
      ON CONFLICT(category_id,sku,source_url) DO UPDATE SET
        identity_key=excluded.identity_key,
        provider_id=excluded.provider_id,
        source_revision=excluded.source_revision,
        source_path=excluded.source_path,
        product_class=excluded.product_class,
        reason=excluded.reason,
        candidate_rank=excluded.candidate_rank,
        active=1,
        staged_at=excluded.staged_at
    `);
    let staged = 0;
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(
        "UPDATE pricing_artwork_review_candidates SET active=0 WHERE category_id=? AND provider_id=?",
      ).run(categoryId, providerId);
      for (const candidate of candidates) {
        const match = matchesBySku.get(candidate.sku);
        if (!match || match.categoryId !== categoryId || match.productType !== "SEALED") continue;
        staged += Number(statement.run(
          categoryId,
          match.sku,
          artworkIdentityKey(match),
          providerId,
          sourceRevision,
          candidate.sourcePath,
          candidate.sourceUrl,
          candidate.productClass,
          candidate.reason,
          candidate.rank,
          stagedAt,
        ).changes);
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return staged;
  }

  getArtworkReviewQueue(input: {
    categoryId?: string;
    state?: ArtworkReviewState;
    query?: string;
    limit?: number;
    offset?: number;
  } = {}): ArtworkReviewQueue {
    const categoryId = input.categoryId ?? "pokemon-en";
    const state = input.state ?? "PENDING";
    const limit = Math.max(1, Math.min(50, Math.trunc(input.limit ?? 8)));
    const offset = Math.max(0, Math.trunc(input.offset ?? 0));
    const query = (input.query ?? "").trim().toLowerCase();
    const rows = this.database.prepare(`
      SELECT c.*, p.name, p.set_name,
        (SELECT e.action FROM pricing_artwork_review_events e
          WHERE e.category_id=c.category_id AND e.sku=c.sku AND e.source_url=c.source_url
          ORDER BY e.id DESC LIMIT 1) AS latest_action,
        (SELECT e.created_at FROM pricing_artwork_review_events e
          WHERE e.category_id=c.category_id AND e.sku=c.sku AND e.source_url=c.source_url
          ORDER BY e.id DESC LIMIT 1) AS reviewed_at,
        rp.source_url AS active_representative_url,
        EXISTS(SELECT 1 FROM pricing_artwork_galleries g
          WHERE g.category_id=c.category_id AND g.sku=c.sku
            AND g.identity_key=c.identity_key AND g.source_url=c.source_url) AS active_gallery,
        r.identity_key AS resolution_identity_key
      FROM pricing_artwork_review_candidates c
      JOIN pricing_products p ON p.category_id=c.category_id AND p.sku=c.sku
      LEFT JOIN pricing_artwork_resolution_provenance rp ON rp.category_id=c.category_id AND rp.sku=c.sku
      LEFT JOIN pricing_artwork_resolutions r ON r.category_id=c.category_id AND r.sku=c.sku
      WHERE c.category_id=? AND c.active=1
      ORDER BY p.set_name, p.name, c.candidate_rank, c.source_path
    `).all(categoryId) as SqlRow[];
    const grouped = new Map<string, { product: ArtworkReviewProduct; hasResolution: boolean; activeRepresentativeUrl: string | null; galleryActive: boolean }>();
    for (const row of rows) {
      const identityCurrent = String(row.identity_key) === String(row.resolution_identity_key ?? row.identity_key);
      const activeRepresentativeUrl = identityCurrent && row.active_representative_url ? String(row.active_representative_url) : null;
      const latestAction = String(row.latest_action ?? "");
      const galleryActive = Boolean(Number(row.active_gallery ?? 0));
      const candidateState: ArtworkReviewState = activeRepresentativeUrl === String(row.source_url) || galleryActive
        ? "ACCEPTED"
        : latestAction === "REJECT"
          ? "REJECTED"
          : "PENDING";
      const key = `${row.category_id}|${row.sku}`;
      const entry = grouped.get(key) ?? {
        product: {
          categoryId: String(row.category_id),
          sku: String(row.sku),
          name: String(row.name),
          setName: String(row.set_name),
          productClass: String(row.product_class),
          reason: String(row.reason),
          galleryActive,
          candidates: [],
        },
        hasResolution: identityCurrent && row.resolution_identity_key !== null,
        activeRepresentativeUrl,
        galleryActive,
      };
      entry.galleryActive ||= galleryActive;
      entry.product.galleryActive ||= galleryActive;
      entry.product.candidates.push({
        sku: String(row.sku),
        sourcePath: String(row.source_path),
        sourceUrl: String(row.source_url),
        productClass: String(row.product_class),
        reason: String(row.reason),
        rank: Number(row.candidate_rank),
        state: candidateState,
        reviewedAt: row.reviewed_at ? String(row.reviewed_at) : null,
      });
      grouped.set(key, entry);
    }
    const all = [...grouped.values()];
    const pendingProducts = all.filter((entry) => !entry.hasResolution && entry.product.candidates.some((candidate) => candidate.state === "PENDING"));
    const acceptedProducts = all.filter((entry) => Boolean(entry.activeRepresentativeUrl) || entry.galleryActive);
    const rejectedProducts = all.filter((entry) => !entry.hasResolution && entry.product.candidates.some((candidate) => candidate.state === "REJECTED"));
    const stateProducts = state === "ACCEPTED" ? acceptedProducts : state === "REJECTED" ? rejectedProducts : pendingProducts;
    const searched = query
      ? stateProducts.filter(({ product }) => [product.name, product.setName, product.sku, ...product.candidates.map((candidate) => candidate.sourcePath)]
          .some((value) => value.toLowerCase().includes(query)))
      : stateProducts;
    const items = searched.slice(offset, offset + limit).map(({ product }) => ({
      ...product,
      candidates: product.candidates.filter((candidate) =>
        state === "ACCEPTED" ? candidate.state === "ACCEPTED" : state === "REJECTED" ? candidate.state === "REJECTED" : candidate.state === "PENDING",
      ),
    }));
    const sealed = this.listArtworkCandidates(categoryId, "SEALED");
    const resolved = this.getArtworkResolutions(sealed);
    const activeProvenance = this.getArtworkResolutionProvenance(sealed);
    const packagingGallery = Object.values(activeProvenance)
      .filter((item) => item.kind === "OWNER_APPROVED_PACKAGING_GALLERY").length;
    const representative = Object.values(activeProvenance)
      .filter((item) => item.kind !== "OWNER_APPROVED_PACKAGING_GALLERY").length;
    const ownerRepresentative = Object.values(activeProvenance)
      .filter((item) => item.kind === "OWNER_APPROVED_REPRESENTATIVE").length;
    const assistedRepresentative = representative - ownerRepresentative;
    const visible = Object.keys(resolved).length;
    return {
      items,
      page: { limit, offset, total: searched.length },
      summary: {
        exact: Math.max(0, visible - representative - packagingGallery),
        representative,
        ownerRepresentative,
        assistedRepresentative,
        packagingGallery,
        visible,
        totalSealed: sealed.length,
        pending: pendingProducts.length,
        accepted: acceptedProducts.length,
        rejected: rejectedProducts.length,
      },
    };
  }

  decideArtworkGallery(input: {
    action: "ACCEPT" | "UNDO";
    categoryId: string;
    sku: string;
    sourceUrls?: readonly string[];
    actorUserId: string;
    note?: string;
  }): "APPLIED" | "ALREADY_APPLIED" | "REVOKED" {
    const match = this.findBySku(input.categoryId, input.sku);
    if (!match || match.productType !== "SEALED") throw new Error("A current sealed product is required.");
    const identityKey = artworkIdentityKey(match);
    const currentGallery = this.database.prepare(`
      SELECT * FROM pricing_artwork_galleries
      WHERE category_id=? AND sku=? AND identity_key=?
      ORDER BY position
    `).all(input.categoryId, input.sku, identityKey) as SqlRow[];
    const at = new Date().toISOString();
    if (input.action === "UNDO") {
      if (!currentGallery.length) throw new Error("Matching packaging gallery was not found.");
      this.database.exec("BEGIN IMMEDIATE");
      try {
        this.database.prepare(
          "DELETE FROM pricing_artwork_resolutions WHERE category_id=? AND sku=? AND identity_key=? AND provider_id='ptcg-assets-owner-gallery'",
        ).run(input.categoryId, input.sku, identityKey);
        this.database.prepare(
          "DELETE FROM pricing_artwork_galleries WHERE category_id=? AND sku=? AND identity_key=?",
        ).run(input.categoryId, input.sku, identityKey);
        const event = this.database.prepare(`
          INSERT INTO pricing_artwork_review_events(category_id,sku,identity_key,source_url,action,actor_user_id,note,created_at)
          VALUES(?,?,?,?,?,?,?,?)
        `);
        for (const row of currentGallery) {
          event.run(
            input.categoryId, input.sku, identityKey, String(row.source_url), "REVOKE",
            input.actorUserId, input.note?.trim() || "Packaging gallery revoked.", at,
          );
        }
        this.database.exec("COMMIT");
      } catch (error) {
        this.database.exec("ROLLBACK");
        throw error;
      }
      return "REVOKED";
    }

    const requested = [...new Set(input.sourceUrls ?? [])];
    if (requested.length < 2) throw new Error("Select at least two packaging images for a gallery.");
    const candidateStatement = this.database.prepare(`
      SELECT * FROM pricing_artwork_review_candidates
      WHERE category_id=? AND sku=? AND source_url=? AND active=1
    `);
    const candidates = requested.map((sourceUrl) =>
      candidateStatement.get(input.categoryId, input.sku, sourceUrl) as SqlRow | undefined
    );
    if (candidates.some((candidate) => !candidate || String(candidate.identity_key) !== identityKey)) {
      throw new Error("Every packaging image must be an active candidate for the current SKU identity.");
    }
    const ordered = (candidates as SqlRow[]).sort((left, right) =>
      Number(left.candidate_rank) - Number(right.candidate_rank) || String(left.source_path).localeCompare(String(right.source_path))
    );
    if (currentGallery.length &&
      currentGallery.map((row) => String(row.source_url)).join("\n") === ordered.map((row) => String(row.source_url)).join("\n")) {
      return "ALREADY_APPLIED";
    }
    const existing = this.database.prepare(
      "SELECT identity_key,provider_id FROM pricing_artwork_resolutions WHERE category_id=? AND sku=?",
    ).get(input.categoryId, input.sku) as SqlRow | undefined;
    const provenance = this.database.prepare(
      "SELECT 1 AS present FROM pricing_artwork_resolution_provenance WHERE category_id=? AND sku=? AND identity_key=?",
    ).get(input.categoryId, input.sku, identityKey) as SqlRow | undefined;
    if (existing && !currentGallery.length) {
      throw new Error(provenance
        ? "Undo the current representative approval before creating a packaging gallery."
        : "An exact artwork resolution already exists and cannot be overwritten.");
    }
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(
        "DELETE FROM pricing_artwork_galleries WHERE category_id=? AND sku=?",
      ).run(input.categoryId, input.sku);
      const primaryUrl = String(ordered[0].source_url);
      const urls = JSON.stringify({ small: primaryUrl, normal: primaryUrl, large: primaryUrl });
      this.database.prepare(`
        INSERT INTO pricing_artwork_resolutions(category_id,sku,identity_key,provider_id,image_urls_json,verified_at)
        VALUES(?,?,?,?,?,?)
        ON CONFLICT(category_id,sku) DO UPDATE SET
          identity_key=excluded.identity_key,provider_id=excluded.provider_id,
          image_urls_json=excluded.image_urls_json,verified_at=excluded.verified_at
      `).run(input.categoryId, input.sku, identityKey, "ptcg-assets-owner-gallery", urls, at);
      const gallery = this.database.prepare(`
        INSERT INTO pricing_artwork_galleries(
          category_id,sku,identity_key,provider_id,source_revision,source_path,
          source_url,position,reviewed_by,reviewed_at
        ) VALUES(?,?,?,?,?,?,?,?,?,?)
      `);
      const event = this.database.prepare(`
        INSERT INTO pricing_artwork_review_events(category_id,sku,identity_key,source_url,action,actor_user_id,note,created_at)
        VALUES(?,?,?,?,?,?,?,?)
      `);
      ordered.forEach((candidate, position) => {
        gallery.run(
          input.categoryId, input.sku, identityKey, String(candidate.provider_id), String(candidate.source_revision),
          String(candidate.source_path), String(candidate.source_url), position, input.actorUserId, at,
        );
        event.run(
          input.categoryId, input.sku, identityKey, String(candidate.source_url), "ACCEPT",
          input.actorUserId, input.note?.trim() || "Approved as a packaging-gallery image.", at,
        );
      });
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return "APPLIED";
  }

  decideArtworkReview(input: {
    action: "ACCEPT" | "REJECT" | "RESTORE" | "UNDO";
    categoryId: string;
    sku: string;
    sourceUrl: string;
    actorUserId: string;
    note?: string;
    resolutionKind?: "OWNER_APPROVED_REPRESENTATIVE" | "ASSISTED_REPRESENTATIVE";
  }): void {
    const candidate = this.database.prepare(`
      SELECT * FROM pricing_artwork_review_candidates
      WHERE category_id=? AND sku=? AND source_url=? AND active=1
    `).get(input.categoryId, input.sku, input.sourceUrl) as SqlRow | undefined;
    const match = this.findBySku(input.categoryId, input.sku);
    if (!candidate || !match || match.productType !== "SEALED") throw new Error("Active sealed artwork candidate was not found.");
    const identityKey = artworkIdentityKey(match);
    if (String(candidate.identity_key) !== identityKey) throw new Error("Catalogue identity changed; refresh candidates before reviewing.");
    const existing = this.database.prepare(
      "SELECT identity_key,provider_id,image_urls_json FROM pricing_artwork_resolutions WHERE category_id=? AND sku=?",
    ).get(input.categoryId, input.sku) as SqlRow | undefined;
    const provenance = this.database.prepare(
      "SELECT * FROM pricing_artwork_resolution_provenance WHERE category_id=? AND sku=?",
    ).get(input.categoryId, input.sku) as SqlRow | undefined;
    const gallery = this.database.prepare(
      "SELECT 1 AS present FROM pricing_artwork_galleries WHERE category_id=? AND sku=? AND identity_key=? LIMIT 1",
    ).get(input.categoryId, input.sku, identityKey) as SqlRow | undefined;
    if (gallery) throw new Error("Undo the packaging gallery before changing an individual candidate.");
    const eventAction = input.action === "UNDO" ? "REVOKE" : input.action;
    const resolutionKind = input.resolutionKind ?? "OWNER_APPROVED_REPRESENTATIVE";
    const resolutionProvider = resolutionKind === "ASSISTED_REPRESENTATIVE"
      ? "ptcg-assets-assisted-review"
      : "ptcg-assets-owner-review";
    const at = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (input.action === "ACCEPT") {
        if (existing && String(existing.identity_key) === identityKey && !provenance) {
          throw new Error("An exact artwork resolution already exists and cannot be overwritten.");
        }
        if (provenance && String(provenance.source_url) !== input.sourceUrl) {
          throw new Error("Undo the current representative approval before selecting another image.");
        }
        const urls = JSON.stringify({ small: input.sourceUrl, normal: input.sourceUrl, large: input.sourceUrl });
        this.database.prepare(`
          INSERT INTO pricing_artwork_resolutions(category_id,sku,identity_key,provider_id,image_urls_json,verified_at)
          VALUES(?,?,?,?,?,?)
          ON CONFLICT(category_id,sku) DO UPDATE SET identity_key=excluded.identity_key,provider_id=excluded.provider_id,image_urls_json=excluded.image_urls_json,verified_at=excluded.verified_at
        `).run(input.categoryId, input.sku, identityKey, resolutionProvider, urls, at);
        this.database.prepare(`
          INSERT INTO pricing_artwork_resolution_provenance(
            category_id,sku,identity_key,resolution_kind,provider_id,source_revision,source_path,source_url,reviewed_by,reviewed_at
          ) VALUES(?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(category_id,sku) DO UPDATE SET
            identity_key=excluded.identity_key,resolution_kind=excluded.resolution_kind,provider_id=excluded.provider_id,
            source_revision=excluded.source_revision,source_path=excluded.source_path,source_url=excluded.source_url,
            reviewed_by=excluded.reviewed_by,reviewed_at=excluded.reviewed_at
        `).run(
          input.categoryId, input.sku, identityKey, resolutionKind, String(candidate.provider_id), String(candidate.source_revision),
          String(candidate.source_path), input.sourceUrl, input.actorUserId, at,
        );
      } else if (input.action === "UNDO") {
        if (!provenance || String(provenance.source_url) !== input.sourceUrl || String(provenance.identity_key) !== identityKey) {
          throw new Error("Matching representative approval was not found.");
        }
        this.database.prepare(
          "DELETE FROM pricing_artwork_resolutions WHERE category_id=? AND sku=? AND provider_id=? AND identity_key=?",
        ).run(input.categoryId, input.sku, String(existing?.provider_id ?? ""), identityKey);
        this.database.prepare(
          "DELETE FROM pricing_artwork_resolution_provenance WHERE category_id=? AND sku=? AND source_url=?",
        ).run(input.categoryId, input.sku, input.sourceUrl);
      } else if (provenance) {
        throw new Error("Undo the representative approval before changing this candidate.");
      }
      this.database.prepare(`
        INSERT INTO pricing_artwork_review_events(category_id,sku,identity_key,source_url,action,actor_user_id,note,created_at)
        VALUES(?,?,?,?,?,?,?,?)
      `).run(
        input.categoryId, input.sku, identityKey, input.sourceUrl, eventAction,
        input.actorUserId, input.note?.trim() || null, at,
      );
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  applyAssistedArtworkReview(input: {
    categoryId: string;
    sku: string;
    sourceUrl: string;
    policyVersion: string;
    rationale: string;
  }): AssistedArtworkReviewResult {
    const candidate = this.database.prepare(`
      SELECT * FROM pricing_artwork_review_candidates
      WHERE category_id=? AND sku=? AND source_url=? AND active=1
    `).get(input.categoryId, input.sku, input.sourceUrl) as SqlRow | undefined;
    if (!candidate) throw new Error("Active sealed artwork candidate was not found.");
    const latestEvent = this.database.prepare(`
      SELECT action FROM pricing_artwork_review_events
      WHERE category_id=? AND sku=? AND source_url=?
      ORDER BY id DESC LIMIT 1
    `).get(input.categoryId, input.sku, input.sourceUrl) as SqlRow | undefined;
    if (String(latestEvent?.action ?? "") === "REJECT") return "BLOCKED_BY_REVIEW";
    const resolution = this.database.prepare(`
      SELECT r.identity_key,r.provider_id,p.resolution_kind,p.source_url
      FROM pricing_artwork_resolutions r
      LEFT JOIN pricing_artwork_resolution_provenance p
        ON p.category_id=r.category_id AND p.sku=r.sku AND p.identity_key=r.identity_key
      WHERE r.category_id=? AND r.sku=?
    `).get(input.categoryId, input.sku) as SqlRow | undefined;
    if (resolution) {
      return String(resolution.resolution_kind ?? "") === "ASSISTED_REPRESENTATIVE" &&
        String(resolution.source_url ?? "") === input.sourceUrl
        ? "ALREADY_APPLIED"
        : "BLOCKED_BY_RESOLUTION";
    }
    this.decideArtworkReview({
      action: "ACCEPT",
      categoryId: input.categoryId,
      sku: input.sku,
      sourceUrl: input.sourceUrl,
      actorUserId: `phronesis-assisted-review:${input.policyVersion}`,
      note: `${input.policyVersion}: ${input.rationale}`,
      resolutionKind: "ASSISTED_REPRESENTATIVE",
    });
    return "APPLIED";
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

  saveMissingArtworkResolutions(
    matches: readonly SearchMatch[],
    artwork: Record<string, CardImageUrls>,
    providerId: string,
  ): number {
    return this.writeArtworkResolutions(matches, artwork, providerId, false, true);
  }

  private writeArtworkResolutions(
    matches: readonly SearchMatch[],
    artwork: Record<string, CardImageUrls>,
    providerId: string,
    replaceCategory: boolean,
    preserveValidIdentity = false,
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
      ${preserveValidIdentity ? "WHERE pricing_artwork_resolutions.identity_key <> excluded.identity_key" : ""}
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
        const result = statement.run(
          match.categoryId,
          match.sku,
          artworkIdentityKey(match),
          providerId,
          JSON.stringify(urls),
          verifiedAt,
        );
        saved += Number(result.changes);
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
        directLowCents: row.direct_low_cents as number | null,
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
