import { DatabaseSync } from "node:sqlite";
import type { RecognitionCatalogue, RecognitionSearchMatch } from "@/lib/cardRecognition/pipeline";

function ftsQuery(input: string): string {
  const tokens = input.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return tokens.slice(0, 10).map((token) => `"${token}"`).join(" AND ");
}

export class SqliteRecognitionCatalogue implements RecognitionCatalogue {
  private readonly database: DatabaseSync;

  constructor(databasePath: string) {
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA query_only=ON;");
  }

  close(): void { this.database.close(); }

  search(categoryId: string, query: string): RecognitionSearchMatch[] {
    const match = ftsQuery(query);
    if (!match) return [];
    const rows = this.database.prepare(`SELECT p.category_id,p.sku,p.name,p.set_name,p.collector_number,p.variant,p.language
      FROM pricing_search s JOIN pricing_products p ON p.category_id=s.category_id AND p.sku=s.sku
      WHERE pricing_search MATCH ? AND s.category_id=? AND p.product_type='SINGLE'
      ORDER BY bm25(pricing_search),p.name,p.set_name,p.sku LIMIT 20`).all(match, categoryId) as Array<Record<string, string | null>>;
    return rows.map((row) => ({ categoryId: String(row.category_id), sku: String(row.sku), name: String(row.name), setName: String(row.set_name), collectorNumber: row.collector_number, variant: String(row.variant), language: String(row.language) }));
  }

  priceSnapshot(categoryId: string, sku: string, condition: string) {
    const row = this.database.prepare(`SELECT snapshot_date,source_sku,direct_low_cents,market_price_cents,delivered_price_cents
      FROM pricing_latest WHERE category_id=? AND sku=? AND condition_key=?`).get(categoryId, sku, condition) as Record<string, string | number | null> | undefined;
    if (!row) return null;
    const referenceCents = row.direct_low_cents ?? row.market_price_cents ?? row.delivered_price_cents;
    if (referenceCents === null) return null;
    const sourceSku = row.source_sku ? String(row.source_sku) : sku;
    const snapshotAt = String(row.snapshot_date).includes("T") ? String(row.snapshot_date) : `${String(row.snapshot_date)}T00:00:00.000Z`;
    return {
      priceSnapshotId: `pricing:${categoryId}:${sku}:${condition}:${row.snapshot_date}:${sourceSku}`,
      priceSnapshotAt: snapshotAt,
      referenceCents: Number(referenceCents),
      referenceKind: row.direct_low_cents !== null ? "TCG_DIRECT_LOW" : row.market_price_cents !== null ? "TCG_MARKET" : "DELIVERED_LOW",
    };
  }
}
