import { DatabaseSync } from "node:sqlite";
import type { RecognitionCatalogue, RecognitionSearchMatch } from "@/lib/cardRecognition/pipeline";
import type { RecognitionOfferDraftLine } from "@/lib/cardRecognition/repository";

export const TCG_LOW_80_PRESET_ID = "tcg-low-80";

export type RecognitionValuationSnapshot = {
  priceSnapshotId: string;
  priceSnapshotAt: string;
  tcgLowCents: number | null;
  tcgMarketCents: number | null;
  tcgDirectLowCents: number | null;
  suggestedOfferCents: number | null;
  regionalLowCentavos: number | null;
  regionalProvider: "LigaPokemon" | "LigaMagic" | null;
  regionalObservedAt: string | null;
  regionalCondition: string | null;
  regionalLanguage: string | null;
};

export type RecognitionValuationSummary = {
  unitCount: number;
  tcgLow: { currency: "USD"; totalCents: number; coveredUnits: number };
  tcgMarket: { currency: "USD"; totalCents: number; coveredUnits: number };
  regionalLow: { currency: "BRL"; totalCentavos: number; coveredUnits: number; providers: string[] };
  suggestedOffer: { currency: "USD"; totalCents: number; coveredUnits: number; presetId: typeof TCG_LOW_80_PRESET_ID };
};

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

  private hasTable(name: string): boolean {
    return Boolean(this.database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name));
  }

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

  valuationSnapshot(categoryId: string, sku: string, condition: string): RecognitionValuationSnapshot | null {
    const row = this.database.prepare(`SELECT snapshot_date,source_sku,direct_low_cents,market_price_cents,listing_price_cents
      FROM pricing_latest WHERE category_id=? AND sku=? AND condition_key=?`).get(categoryId, sku, condition) as Record<string, string | number | null> | undefined;
    if (!row) return null;
    const sourceSku = row.source_sku ? String(row.source_sku) : sku;
    const snapshotAt = String(row.snapshot_date).includes("T") ? String(row.snapshot_date) : `${String(row.snapshot_date)}T00:00:00.000Z`;
    const regional = categoryId === "pokemon-en" && this.hasTable("regional_pokemon_crosswalk") && this.hasTable("regional_pokemon_evidence")
      ? this.database.prepare(`SELECT e.consumer_low_centavos,e.observed_at,e.condition_key,e.language
          FROM regional_pokemon_crosswalk c JOIN regional_pokemon_evidence e ON e.liga_identity_key=c.liga_identity_key
          WHERE c.category_id=? AND c.sku=? AND c.status='MATCHED'
          ORDER BY e.observed_at DESC,e.liga_identity_key LIMIT 1`).get(categoryId, sku) as Record<string, string | number | null> | undefined
      : categoryId === "magic-en" && this.hasTable("regional_crosswalk") && this.hasTable("regional_evidence")
        ? this.database.prepare(`SELECT e.consumer_low_centavos,e.observed_at
            FROM regional_crosswalk c JOIN regional_evidence e ON e.liga_identity_key=c.liga_identity_key
            WHERE c.category_id=? AND c.sku=? AND c.status='MATCHED'
            ORDER BY e.observed_at DESC,e.liga_identity_key LIMIT 1`).get(categoryId, sku) as Record<string, string | number | null> | undefined
        : undefined;
    const tcgLowCents = row.listing_price_cents === null ? null : Number(row.listing_price_cents);
    return {
      priceSnapshotId: `pricing:${categoryId}:${sku}:${condition}:${row.snapshot_date}:${sourceSku}`,
      priceSnapshotAt: snapshotAt,
      tcgLowCents,
      tcgMarketCents: row.market_price_cents === null ? null : Number(row.market_price_cents),
      tcgDirectLowCents: row.direct_low_cents === null ? null : Number(row.direct_low_cents),
      suggestedOfferCents: tcgLowCents === null ? null : Math.round(tcgLowCents * 0.8),
      regionalLowCentavos: regional?.consumer_low_centavos === null || regional?.consumer_low_centavos === undefined ? null : Number(regional.consumer_low_centavos),
      regionalProvider: categoryId === "pokemon-en" && regional ? "LigaPokemon" : categoryId === "magic-en" && regional ? "LigaMagic" : null,
      regionalObservedAt: regional?.observed_at ? String(regional.observed_at) : null,
      regionalCondition: regional?.condition_key ? String(regional.condition_key) : null,
      regionalLanguage: regional?.language ? String(regional.language) : null,
    };
  }
}

export function summarizeRecognitionValuation(lines: RecognitionOfferDraftLine[], catalogue: SqliteRecognitionCatalogue): RecognitionValuationSummary {
  const summary: RecognitionValuationSummary = {
    unitCount: 0,
    tcgLow: { currency: "USD", totalCents: 0, coveredUnits: 0 },
    tcgMarket: { currency: "USD", totalCents: 0, coveredUnits: 0 },
    regionalLow: { currency: "BRL", totalCentavos: 0, coveredUnits: 0, providers: [] },
    suggestedOffer: { currency: "USD", totalCents: 0, coveredUnits: 0, presetId: TCG_LOW_80_PRESET_ID },
  };
  const providers = new Set<string>();
  for (const line of lines) {
    if (!line.candidate) continue;
    summary.unitCount += line.quantity;
    const valuation = catalogue.valuationSnapshot(line.candidate.categoryId, line.candidate.sku, line.condition);
    if (!valuation) continue;
    if (valuation.tcgLowCents !== null) {
      summary.tcgLow.totalCents += valuation.tcgLowCents * line.quantity;
      summary.tcgLow.coveredUnits += line.quantity;
    }
    if (valuation.tcgMarketCents !== null) {
      summary.tcgMarket.totalCents += valuation.tcgMarketCents * line.quantity;
      summary.tcgMarket.coveredUnits += line.quantity;
    }
    if (valuation.regionalLowCentavos !== null) {
      summary.regionalLow.totalCentavos += valuation.regionalLowCentavos * line.quantity;
      summary.regionalLow.coveredUnits += line.quantity;
      if (valuation.regionalProvider) providers.add(valuation.regionalProvider);
    }
    if (valuation.suggestedOfferCents !== null) {
      summary.suggestedOffer.totalCents += valuation.suggestedOfferCents * line.quantity;
      summary.suggestedOffer.coveredUnits += line.quantity;
    }
  }
  summary.regionalLow.providers = [...providers].sort();
  return summary;
}
