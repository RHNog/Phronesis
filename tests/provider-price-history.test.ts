import assert from "node:assert/strict";
import test from "node:test";
import { MarketHistoryRepository } from "../lib/market/history.ts";
import { PricingRepository } from "../lib/pricing/repository.ts";

test("provider history returns bounded independent TCGplayer and Liga series", () => {
  const pricing = new PricingRepository();
  pricing.database.exec(`
    INSERT INTO pricing_products(
      category_id,sku,product_type,name,set_name,collector_number,
      variant,language,image_url
    ) VALUES(
      'pokemon-en','gardevoir','SINGLE','Gardevoir GX','Hidden Fates',
      'SV75/SV94','Holofoil','English',NULL
    );
    INSERT INTO pricing_history(
      category_id,sku,condition_key,market_price_cents,direct_low_cents,
      listing_price_cents,shipping_cents,shipping_source,
      delivered_price_cents,snapshot_date,source_sku
    ) VALUES
      ('pokemon-en','gardevoir','NEAR_MINT',8000,8200,7900,0,'EXPORTED',7900,'2026-06-01','4170254'),
      ('pokemon-en','gardevoir','NEAR_MINT',8500,8900,7999,0,'EXPORTED',7999,'2026-08-01','4170254'),
      ('pokemon-en','gardevoir','NEAR_MINT',9000,9200,8300,0,'EXPORTED',8300,'2026-08-07','4170254');
  `);
  const history = new MarketHistoryRepository(pricing.database);
  pricing.database.exec(`
    INSERT INTO regional_price_history(
      provider_id,category_id,sku,liga_identity_key,evidence_lane,value_minor,
      currency,observed_at,source_run_id,match_quality,match_method,recorded_at
    ) VALUES
      ('ligapokemon','pokemon-en','gardevoir','liga-gardevoir','CONSUMER_LOW',15990,
       'BRL','2026-08-01T12:00:00.000Z','run-1','EXACT','EXACT_FIXTURE','2026-08-01T12:00:00.000Z'),
      ('ligapokemon','pokemon-en','gardevoir','liga-gardevoir','CONSUMER_LOW',16990,
       'BRL','2026-08-07T12:00:00.000Z','run-2','EXACT','EXACT_FIXTURE','2026-08-07T12:00:00.000Z');
  `);

  const result = history.history({
    categoryId: "pokemon-en",
    sku: "gardevoir",
    condition: "NEAR_MINT",
    range: "30D",
    now: new Date("2026-08-07T18:00:00.000Z"),
  });
  assert.deepEqual(
    result.providers.map((provider) => provider.id),
    ["tcgplayer", "ligapokemon"],
  );
  const tcgMarket = result.providers[0].series.find(
    (series) => series.id === "market",
  );
  assert.deepEqual(
    tcgMarket?.points.map((point) => point.valueMinor),
    [8500, 9000],
  );
  assert.equal(
    result.providers[1].series[0].points.at(-1)?.matchQuality,
    "EXACT",
  );
  assert.equal(
    history.history({
      categoryId: "pokemon-en",
      sku: "gardevoir",
      condition: "NEAR_MINT",
      range: "7D",
      now: new Date("2026-08-07T18:00:00.000Z"),
    }).range,
    "7D",
  );
  pricing.close();
});

test("Vendor Workspace exposes responsive provider range controls", async () => {
  const { readFileSync } = await import("node:fs");
  const history = readFileSync(
    new URL(
      "../features/vendor/components/ProviderPriceHistory.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const workspace = readFileSync(
    new URL(
      "../features/vendor/components/SnapshotVendorWorkspace.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(history, /MARKET_HISTORY_RANGES/);
  assert.match(history, /grid grid-cols-4/);
  assert.match(history, /min-h-11/);
  assert.match(workspace, /ProviderPriceHistory/);
  assert.match(workspace, /enabledProviderIds/);
});
