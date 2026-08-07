import { DatabaseSync } from "node:sqlite";
import type { PricingCondition } from "@/lib/pricing/types";
import type { MarketProviderId } from "@/lib/market/providers";

type Sql = Record<string, string | number | null>;

export const MARKET_HISTORY_RANGES = ["7D", "30D", "3M", "1Y"] as const;
export type MarketHistoryRange = (typeof MARKET_HISTORY_RANGES)[number];

export type MarketHistoryPoint = {
  observedAt: string;
  valueMinor: number;
  sourceRef: string | null;
  matchQuality: "EXACT" | "COMPATIBLE" | null;
};

export type MarketHistorySeries = {
  id: string;
  label: string;
  currency: "USD" | "BRL";
  points: MarketHistoryPoint[];
};

export type MarketHistoryProvider = {
  id: MarketProviderId;
  label: string;
  currency: "USD" | "BRL";
  series: MarketHistorySeries[];
};

export type MarketHistoryResponse = {
  categoryId: string;
  sku: string;
  condition: PricingCondition;
  range: MarketHistoryRange;
  providers: MarketHistoryProvider[];
};

const rangeMilliseconds: Record<MarketHistoryRange, number> = {
  "7D": 7 * 24 * 60 * 60 * 1000,
  "30D": 30 * 24 * 60 * 60 * 1000,
  "3M": 92 * 24 * 60 * 60 * 1000,
  "1Y": 366 * 24 * 60 * 60 * 1000,
};

export function isMarketHistoryRange(
  value: unknown,
): value is MarketHistoryRange {
  return MARKET_HISTORY_RANGES.includes(value as MarketHistoryRange);
}

export function ensureRegionalPriceHistoryTable(
  database: DatabaseSync,
): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS regional_price_history (
      id INTEGER PRIMARY KEY,
      provider_id TEXT NOT NULL CHECK(provider_id IN ('ligamagic','ligapokemon')),
      category_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      liga_identity_key TEXT NOT NULL,
      evidence_lane TEXT NOT NULL,
      value_minor INTEGER NOT NULL CHECK(value_minor > 0),
      currency TEXT NOT NULL CHECK(currency='BRL'),
      observed_at TEXT NOT NULL,
      source_run_id TEXT NOT NULL,
      match_quality TEXT NOT NULL CHECK(match_quality IN ('EXACT','COMPATIBLE')),
      match_method TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      UNIQUE(provider_id,category_id,sku,evidence_lane,observed_at,source_run_id)
    );
    CREATE INDEX IF NOT EXISTS regional_price_history_lookup
      ON regional_price_history(provider_id,category_id,sku,observed_at,id);
  `);
}

function tableExists(database: DatabaseSync, tableName: string): boolean {
  return Boolean(
    database
      .prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?")
      .get(tableName),
  );
}

export function appendPokemonRegionalPriceHistory(
  database: DatabaseSync,
): void {
  ensureRegionalPriceHistoryTable(database);
  if (
    !tableExists(database, "regional_product_equivalence") ||
    !tableExists(database, "regional_pokemon_evidence")
  )
    return;
  appendRegionalRows(database, {
    providerId: "ligapokemon",
    categoryId: "pokemon-en",
    sourceSql: `
      SELECT q.category_id,q.sku,q.liga_identity_key,q.source_run_id,
        q.status AS match_quality,q.method AS match_method,
        e.observed_at,e.consumer_low_centavos,e.consumer_average_centavos,
        e.consumer_high_centavos,e.store_buy_low_centavos,
        e.store_buy_average_centavos,e.store_buy_high_centavos
      FROM regional_product_equivalence q
      JOIN regional_pokemon_evidence e
        ON e.liga_identity_key=q.liga_identity_key
      WHERE q.provider_id='ligapokemon'
        AND q.category_id='pokemon-en'
        AND q.status IN ('EXACT','COMPATIBLE')
    `,
  });
}

export function seedPokemonRegionalPriceHistory(database: DatabaseSync): void {
  ensureRegionalPriceHistoryTable(database);
  const row = database
    .prepare(
      "SELECT 1 FROM regional_price_history WHERE provider_id='ligapokemon' LIMIT 1",
    )
    .get();
  if (!row) appendPokemonRegionalPriceHistory(database);
}

export function appendMagicRegionalPriceHistory(
  database: DatabaseSync,
): void {
  ensureRegionalPriceHistoryTable(database);
  if (
    !tableExists(database, "regional_crosswalk") ||
    !tableExists(database, "regional_evidence")
  )
    return;
  appendRegionalRows(database, {
    providerId: "ligamagic",
    categoryId: "magic-en",
    sourceSql: `
      SELECT c.category_id,c.sku,c.liga_identity_key,c.source_run_id,
        'EXACT' AS match_quality,c.method AS match_method,
        e.observed_at,e.consumer_low_centavos,e.consumer_average_centavos,
        e.consumer_high_centavos,e.store_buy_low_centavos,
        e.store_buy_average_centavos,e.store_buy_high_centavos
      FROM regional_crosswalk c
      JOIN regional_evidence e USING(liga_identity_key)
      WHERE c.category_id='magic-en' AND c.status='MATCHED'
    `,
  });
}

export function seedMagicRegionalPriceHistory(database: DatabaseSync): void {
  ensureRegionalPriceHistoryTable(database);
  const row = database
    .prepare(
      "SELECT 1 FROM regional_price_history WHERE provider_id='ligamagic' LIMIT 1",
    )
    .get();
  if (!row) appendMagicRegionalPriceHistory(database);
}

function appendRegionalRows(
  database: DatabaseSync,
  input: {
    providerId: "ligamagic" | "ligapokemon";
    categoryId: "magic-en" | "pokemon-en";
    sourceSql: string;
  },
): void {
  const recordedAt = new Date().toISOString();
  const insert = database.prepare(`
    INSERT OR IGNORE INTO regional_price_history(
      provider_id,category_id,sku,liga_identity_key,evidence_lane,value_minor,
      currency,observed_at,source_run_id,match_quality,match_method,recorded_at
    ) VALUES(?,?,?,?,?,?,'BRL',?,?,?,?,?)
  `);
  const rows = database.prepare(input.sourceSql).all() as Sql[];
  const lanes = [
    ["CONSUMER_LOW", "consumer_low_centavos"],
    ["CONSUMER_AVERAGE", "consumer_average_centavos"],
    ["CONSUMER_HIGH", "consumer_high_centavos"],
    ["STORE_BUY_LOW", "store_buy_low_centavos"],
    ["STORE_BUY_AVERAGE", "store_buy_average_centavos"],
    ["STORE_BUY_HIGH", "store_buy_high_centavos"],
  ] as const;
  for (const row of rows) {
    for (const [lane, column] of lanes) {
      const value = row[column];
      if (typeof value !== "number" || !Number.isInteger(value) || value <= 0)
        continue;
      insert.run(
        input.providerId,
        input.categoryId,
        String(row.sku),
        String(row.liga_identity_key),
        lane,
        value,
        String(row.observed_at),
        String(row.source_run_id),
        String(row.match_quality),
        String(row.match_method),
        recordedAt,
      );
    }
  }
}

export class MarketHistoryRepository {
  constructor(readonly database: DatabaseSync) {
    ensureRegionalPriceHistoryTable(database);
    seedMagicRegionalPriceHistory(database);
    seedPokemonRegionalPriceHistory(database);
  }

  history(input: {
    categoryId: string;
    sku: string;
    condition: PricingCondition;
    range: MarketHistoryRange;
    now?: Date;
  }): MarketHistoryResponse {
    const cutoff = new Date(
      (input.now ?? new Date()).getTime() - rangeMilliseconds[input.range],
    ).toISOString();
    const providers = [
      this.tcgplayerHistory(input, cutoff),
      this.regionalHistory(input, cutoff),
      this.priceChartingHistory(input, cutoff),
    ].filter((provider): provider is MarketHistoryProvider => Boolean(provider));
    return {
      categoryId: input.categoryId,
      sku: input.sku,
      condition: input.condition,
      range: input.range,
      providers,
    };
  }

  private tcgplayerHistory(
    input: { categoryId: string; sku: string; condition: PricingCondition },
    cutoff: string,
  ): MarketHistoryProvider | null {
    const rows = this.database
      .prepare(`
        SELECT snapshot_date,market_price_cents,direct_low_cents,
          delivered_price_cents,source_sku
        FROM pricing_history
        WHERE category_id=? AND sku=? AND condition_key=? AND snapshot_date>=?
        ORDER BY snapshot_date,id
      `)
      .all(input.categoryId, input.sku, input.condition, cutoff) as Sql[];
    const series = [
      seriesFromRows(rows, {
        id: "market",
        label: "Market price",
        currency: "USD",
        valueColumn: "market_price_cents",
        timeColumn: "snapshot_date",
        sourceColumn: "source_sku",
      }),
      seriesFromRows(rows, {
        id: "direct-low",
        label: "Direct Low",
        currency: "USD",
        valueColumn: "direct_low_cents",
        timeColumn: "snapshot_date",
        sourceColumn: "source_sku",
      }),
      seriesFromRows(rows, {
        id: "delivered-low",
        label: "Delivered low",
        currency: "USD",
        valueColumn: "delivered_price_cents",
        timeColumn: "snapshot_date",
        sourceColumn: "source_sku",
      }),
    ].filter((item): item is MarketHistorySeries => Boolean(item));
    return series.length
      ? { id: "tcgplayer", label: "TCGplayer", currency: "USD", series }
      : null;
  }

  private regionalHistory(
    input: { categoryId: string; sku: string },
    cutoff: string,
  ): MarketHistoryProvider | null {
    const providerId =
      input.categoryId === "pokemon-en"
        ? "ligapokemon"
        : input.categoryId === "magic-en"
          ? "ligamagic"
          : null;
    if (!providerId) return null;
    const rows = this.database
      .prepare(`
        SELECT evidence_lane,value_minor,observed_at,source_run_id,match_quality
        FROM regional_price_history
        WHERE provider_id=? AND category_id=? AND sku=? AND observed_at>=?
        ORDER BY observed_at,id
      `)
      .all(providerId, input.categoryId, input.sku, cutoff) as Sql[];
    const labels: Record<string, string> = {
      CONSUMER_LOW: "Retail low",
      CONSUMER_AVERAGE: "Retail average",
      CONSUMER_HIGH: "Retail high",
      STORE_BUY_LOW: "Dealer-buy low",
      STORE_BUY_AVERAGE: "Dealer-buy average",
      STORE_BUY_HIGH: "Dealer-buy high",
    };
    const series = [...new Set(rows.map((row) => String(row.evidence_lane)))]
      .map((lane) => {
        const points = rows
          .filter((row) => String(row.evidence_lane) === lane)
          .map((row) => ({
            observedAt: String(row.observed_at),
            valueMinor: Number(row.value_minor),
            sourceRef: String(row.source_run_id),
            matchQuality: String(
              row.match_quality,
            ) as MarketHistoryPoint["matchQuality"],
          }));
        return {
          id: lane.toLowerCase().replaceAll("_", "-"),
          label: labels[lane] ?? lane,
          currency: "BRL" as const,
          points: downsample(points),
        };
      })
      .filter((series) => series.points.length > 0);
    return series.length
      ? {
          id: providerId,
          label: providerId === "ligapokemon" ? "LigaPokémon" : "LigaMagic",
          currency: "BRL",
          series,
        }
      : null;
  }

  private priceChartingHistory(
    input: { categoryId: string; sku: string },
    cutoff: string,
  ): MarketHistoryProvider | null {
    if (
      !tableExists(this.database, "provider_market_observation") ||
      !tableExists(this.database, "provider_identity_mapping") ||
      !tableExists(this.database, "provider_import_receipt")
    )
      return null;
    const rows = this.database
      .prepare(`
        SELECT o.evidence_lane,o.value_cents,o.observed_at,
          CAST(o.receipt_id AS TEXT) AS source_ref
        FROM provider_market_observation o
        JOIN provider_identity_mapping m ON m.id=o.mapping_id
        JOIN provider_import_receipt r ON r.id=o.receipt_id
        WHERE o.provider_id='pricecharting' AND r.outcome='APPLIED'
          AND m.target_category_id=? AND m.target_sku=? AND o.observed_at>=?
        ORDER BY o.observed_at,o.id
      `)
      .all(input.categoryId, input.sku, cutoff) as Sql[];
    const series = [...new Set(rows.map((row) => String(row.evidence_lane)))]
      .map((lane) => ({
        id: lane.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-"),
        label: lane,
        currency: "USD" as const,
        points: downsample(
          rows
            .filter((row) => String(row.evidence_lane) === lane)
            .map((row) => ({
              observedAt: String(row.observed_at),
              valueMinor: Number(row.value_cents),
              sourceRef: String(row.source_ref),
              matchQuality: "EXACT" as const,
            })),
        ),
      }))
      .filter((series) => series.points.length > 0);
    return series.length
      ? {
          id: "pricecharting",
          label: "PriceCharting",
          currency: "USD",
          series,
        }
      : null;
  }
}

function seriesFromRows(
  rows: Sql[],
  input: {
    id: string;
    label: string;
    currency: "USD" | "BRL";
    valueColumn: string;
    timeColumn: string;
    sourceColumn: string;
  },
): MarketHistorySeries | null {
  const points = rows.flatMap((row): MarketHistoryPoint[] => {
    const value = row[input.valueColumn];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
      return [];
    return [
      {
        observedAt: String(row[input.timeColumn]),
        valueMinor: value,
        sourceRef:
          row[input.sourceColumn] === null
            ? null
            : String(row[input.sourceColumn]),
        matchQuality: "EXACT",
      },
    ];
  });
  return points.length
    ? { ...input, points: downsample(points) }
    : null;
}

function downsample(points: MarketHistoryPoint[], maximum = 366) {
  if (points.length <= maximum) return points;
  const selected = new Set([0, points.length - 1]);
  const stride = (points.length - 1) / (maximum - 1);
  for (let index = 1; index < maximum - 1; index += 1) {
    selected.add(Math.round(index * stride));
  }
  return [...selected]
    .sort((left, right) => left - right)
    .map((index) => points[index]);
}
