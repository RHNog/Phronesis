import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  calculateArbitrage,
  crossMarketIdentityKey,
  normalizeCollectorNumber,
  normalizeRegionalVariant,
  type RegionalCostProfile,
} from "../lib/regional/domain.ts";
import { RegionalIntelligenceRepository } from "../lib/regional/RegionalIntelligenceRepository.ts";

const completeProfile: RegionalCostProfile = {
  brlPerUsd: 5,
  brlPerUsdBuy: 5,
  brlPerUsdSell: 5,
  fxObservedAt: new Date().toISOString(),
  fxFetchedAt: new Date().toISOString(),
  fxLastAttemptAt: new Date().toISOString(),
  fxSource: "Owner observation",
  fxLastError: null,
  usToBrazilFixedBrl: 10,
  usToBrazilPercent: 10,
  brazilToUsFixedUsd: 2,
  brazilToUsPercent: 5,
  updatedAt: null,
};

test("cross-market identity normalization preserves exact printing dimensions", () => {
  assert.equal(normalizeCollectorNumber("0275/332"), "275");
  assert.equal(normalizeRegionalVariant(""), "Normal");
  assert.equal(normalizeRegionalVariant("Foil"), "Foil");
  assert.equal(normalizeRegionalVariant("Textless"), null);
  assert.equal(
    crossMarketIdentityKey({
      name: "Mox Opal",
      edition: "Double Masters",
      collectorNumber: "275",
      variant: "Normal",
    }),
    "mox opal|double masters|275|normal",
  );
});

test("arbitrage remains gated until explicit costs and availability exist", () => {
  const missing = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile: { ...completeProfile, usToBrazilPercent: null },
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(missing.state, "IDENTITY_VERIFIED");
  assert.match(missing.blocker ?? "", /costs are incomplete/);
  const costed = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile: completeProfile,
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(costed.state, "COSTED");
  assert.equal(costed.netProfit, 35);
  const actionable = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile: completeProfile,
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: true,
  });
  assert.equal(actionable.state, "ACTIONABLE");
});

test("arbitrage uses the conservative direction-specific official PTAX side", () => {
  const profile = {
    ...completeProfile,
    brlPerUsdBuy: 4,
    brlPerUsdSell: 5,
    fxSource: "Banco Central do Brasil PTAX — closing bulletin",
  };
  const inbound = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile,
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(inbound.totalCost, 65);
  const outbound = calculateArbitrage({
    direction: "BRAZIL_TO_US",
    profile,
    usPriceUsd: 100,
    brazilPriceBrl: 40,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(outbound.totalCost, 12.5);
});

test("official FX failure retains the last-good PTAX quote", () => {
  const database = new DatabaseSync(":memory:");
  const repository = new RegionalIntelligenceRepository(database);
  repository.recordOfficialFx({
    buyBrlPerUsd: 5.0733,
    sellBrlPerUsd: 5.0739,
    observedAt: "2026-07-30T16:07:32.344Z",
    fetchedAt: "2026-07-30T18:00:00.000Z",
    source: "Banco Central do Brasil PTAX — closing bulletin",
  });
  const failed = repository.recordOfficialFxFailure("2026-07-30T19:00:00.000Z");
  assert.equal(failed.brlPerUsdBuy, 5.0733);
  assert.equal(failed.brlPerUsdSell, 5.0739);
  assert.equal(failed.fxFetchedAt, "2026-07-30T18:00:00.000Z");
  assert.equal(failed.fxLastAttemptAt, "2026-07-30T19:00:00.000Z");
  assert.match(failed.fxLastError ?? "", /temporarily unavailable/);
  database.close();
});

test("repository adopts one exact identity and quarantines Textless", () => {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-regional-"));
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','mox-normal','SINGLE','Mox Opal','Double Masters','275','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
    INSERT INTO pricing_latest VALUES('magic-en','mox-normal','NEAR_MINT',2000,2000,'${new Date().toISOString()}');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('normal','Double Masters','2XM','Mox Opal','275','',10000,11000,12000,5000,6000,7000);
    INSERT INTO ligamagic_price VALUES('textless','Double Masters','2XM','Mox Opal','275','Textless',10000,11000,12000,5000,6000,7000);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "test",
      completedAt: new Date().toISOString(),
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.matched, 1);
  assert.equal(report.unsupportedVariant, 1);
  assert.equal(
    repository.evidenceFor("magic-en", "mox-normal")?.consumerAverageCentavos,
    11000,
  );
  repository.updateProfile(completeProfile);
  const before = repository
    .listCandidates()
    .find((candidate) => candidate.direction === "US_TO_BRAZIL");
  assert.equal(before?.state, "COSTED");
  assert.equal(before?.netProfit, -20);
  repository.verifyAvailability({
    categoryId: "magic-en",
    sku: "mox-normal",
    direction: "US_TO_BRAZIL",
    executablePrice: 5,
    quantity: 1,
    counterpartyLabel: "Verified seller",
    observedAt: new Date().toISOString(),
    notes: "Test observation",
  });
  const after = repository
    .listCandidates()
    .find((candidate) => candidate.direction === "US_TO_BRAZIL");
  assert.equal(after?.state, "ACTIONABLE");
  assert.equal(after?.usPriceUsd, 5);
  assert.equal(after?.netProfit, 62.5);
  pricing.close();
});
