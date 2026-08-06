import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { PRICECHARTING_HEADERS, PRICECHARTING_RESOLVER_VERSION, PRICECHARTING_SCHEMA_VERSION, PriceChartingBulkRepository, importPriceChartingCsv } from "../lib/providers/pricecharting/PriceChartingBulkImport";
import { PricingRepository } from "../lib/pricing/repository";

function csvRow(overrides: Record<string, string>) {
  const base: Record<string, string> = Object.fromEntries(PRICECHARTING_HEADERS.map((header) => [header, ""]));
  Object.assign(base, { id: "100", "console-name": "Pokemon Base Set", "product-name": "Pikachu #58/102", "loose-price": "325", "graded-price": "2200", "manual-only-price": "11500", genre: "Pokemon Card", "release-date": "1999-01-09" }, overrides);
  return PRICECHARTING_HEADERS.map((header) => base[header]).join(",");
}

function fixture(rows: string[]) { return `${PRICECHARTING_HEADERS.join(",")}\n${rows.join("\n")}\n`; }
function prepare() {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-pricecharting-")); const databasePath = join(directory, "pricing.sqlite");
  const pricing = new PricingRepository(databasePath);
  pricing.database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES('pokemon-en','sku-58','SINGLE','Pikachu','Base Set','58/102','Normal','English',NULL)").run();
  pricing.database.prepare("INSERT INTO pricing_latest(category_id,sku,condition_key,market_price_cents,direct_low_cents,listing_price_cents,shipping_cents,shipping_source,delivered_price_cents,snapshot_date) VALUES('pokemon-en','sku-58','NEAR_MINT',500,700,450,50,'EXPORTED',500,'2026-08-01')").run();
  pricing.close(); return { directory, databasePath, receipts: join(directory, "receipts") };
}

test("dry-run stages exact evidence without changing the active pointer or TCGplayer lanes", () => {
  const context = prepare(); const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({})]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.outcome, "DRY_RUN"); assert.equal(report.accepted, 1); assert.equal(report.activeReceipt, null);
  const database = new DatabaseSync(context.databasePath);
  assert.equal((database.prepare("SELECT COUNT(*) count FROM provider_import_active_state").get() as { count: number }).count, 0);
  assert.equal(new PriceChartingBulkRepository(database).getSummary().status, "DRY_RUN");
  const preserved = database.prepare("SELECT market_price_cents,direct_low_cents FROM pricing_latest WHERE sku='sku-58'").get() as { market_price_cents: number; direct_low_cents: number };
  assert.equal(preserved.market_price_cents, 500); assert.equal(preserved.direct_low_cents, 700);
  database.close();
});

test("apply promotes atomically and imported graded evidence is available by exact SKU", () => {
  const context = prepare(); const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({})]));
  importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts, apply: true });
  assert.equal(report.outcome, "APPLIED"); assert.equal(report.activeReceipt, report.receiptId);
  const database = new DatabaseSync(context.databasePath); const evidence = new PriceChartingBulkRepository(database).getEvidence("pokemon-en", "sku-58");
  assert.equal(evidence.length, 1); assert.equal(evidence[0].prices["PSA 10"], 11500); assert.equal(evidence[0].source, "IMPORTED"); database.close();
});

test("multiple provider products converging on one SKU are all quarantined as collisions", () => {
  const context = prepare(); const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ id: "100" }), csvRow({ id: "101" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts, apply: true });
  assert.equal(report.accepted, 0); assert.equal(report.collisions, 2);
  const database = new DatabaseSync(context.databasePath); assert.equal((database.prepare("SELECT COUNT(*) count FROM provider_identity_mapping").get() as { count: number }).count, 0); database.close();
});

test("schema drift fails closed before a receipt is parsed", () => {
  const context = prepare(); const file = join(context.directory, "bad.csv"); writeFileSync(file, `id,product-name\n1,Pikachu\n`);
  assert.throws(() => importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts }), /schema drift/);
});

test("a source without physical-variation evidence cannot attach to a reverse-holo target", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET variant='Reverse Holofoil' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({})]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 0); assert.equal(report.unmatched, 1);
});

test("an unqualified naturally holographic card resolves to its only base holo printing", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET variant='Holofoil' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({})]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1);
});

test("documented modern set prefixes and Base Set suffixes normalize without fuzzy containment", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET set_name='SV: Scarlet & Violet Base Set' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "console-name": "Pokemon Scarlet & Violet" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1); assert.equal(report.countsByMethod.DOCUMENTED_SET_ALIAS_IDENTITY, 1);
});

test("generic PriceCharting Promo resolves only to a uniquely identified local promo set", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET set_name='SWSH: Sword & Shield Promo' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "console-name": "Pokemon Promo" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1); assert.equal(report.countsByMethod.DOCUMENTED_SET_ALIAS_IDENTITY, 1);
});

test("Sun and Moon Base Set alias requires the known 149-card denominator", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET collector_number='58/149' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "console-name": "Pokemon Sun & Moon", "product-name": "Pikachu #58" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1);
});

test("documented Pokémon printed-name aliases still require exact set and collector", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET name='Nidoran M',set_name='Aquapolis',collector_number='96/147' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "console-name": "Pokemon Aquapolis", "product-name": "Nidoran #96" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1); assert.equal(report.countsByMethod.DOCUMENTED_NAME_ALIAS_IDENTITY, 1);
});

test("card names containing qualifier substrings do not become physical qualifiers", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET name='Goldeen',set_name='Aquapolis',collector_number='78/147' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "console-name": "Pokemon Aquapolis", "product-name": "Goldeen #78" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1);
});

test("collector-derived rarity labels may be target-only after exact set and collector proof", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET name='Pikachu (Full Art)',variant='Holofoil' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({})]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1);
});

test("Poké Ball and Master Ball annotations resolve only to their exact physical patterns", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES('pokemon-en','sku-poke','SINGLE','Pikachu (Poke Ball Pattern)','Base Set','58/102','Holofoil','English',NULL)").run();
  database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES('pokemon-en','sku-master','SINGLE','Pikachu (Master Ball Pattern)','Base Set','58/102','Holofoil','English',NULL)").run();
  database.close();
  const file = join(context.directory, "guide.csv");
  writeFileSync(file, fixture([csvRow({ id: "100" }), csvRow({ id: "101", "product-name": "Pikachu [Poke Ball] #58/102" }), csvRow({ id: "102", "product-name": "Pikachu [Master Ball] #58/102" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 3); assert.equal(report.ambiguous, 0);
  const resultDatabase = new DatabaseSync(context.databasePath);
  const targets = resultDatabase.prepare("SELECT provider_product_id,target_sku FROM provider_identity_candidate WHERE receipt_id=? ORDER BY provider_product_id").all(report.receiptId) as Array<{ provider_product_id: string; target_sku: string }>;
  assert.deepEqual(targets.map((target) => ({ ...target })), [{ provider_product_id: "100", target_sku: "sku-58" }, { provider_product_id: "101", target_sku: "sku-poke" }, { provider_product_id: "102", target_sku: "sku-master" }]);
  resultDatabase.close();
});

test("special-release annotations cannot collapse onto an ordinary base printing", () => {
  const context = prepare(); const file = join(context.directory, "guide.csv");
  writeFileSync(file, fixture([csvRow({ "product-name": "Pikachu [Poster Holo] #58/102" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 0); assert.equal(report.unmatched, 1);
});

test("Base Set Shadowless evidence resolves against the local Shadowless set identity", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET set_name='Base Set (Shadowless)' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "product-name": "Pikachu [Shadowless] #58/102" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1); assert.equal(report.countsByMethod.DOCUMENTED_SET_ALIAS_IDENTITY, 1);
});

test("SH collector numbers prove the legacy Shiny reverse-holo treatment", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET name='Bagon (Shiny)',set_name='Arceus',collector_number='SH10',variant='Reverse Holofoil' WHERE sku='sku-58'").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "console-name": "Pokemon Arceus", "product-name": "Bagon #SH10" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1);
});

test("an explicit sibling Holo row makes an unqualified row the base non-holo printing", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES('pokemon-en','sku-holo','SINGLE','Pikachu','Base Set','58/102','Holofoil','English',NULL)").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ id: "100" }), csvRow({ id: "101", "product-name": "Pikachu [Holo] #58/102" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 2, JSON.stringify(report)); assert.equal(report.ambiguous, 0);
  const resultDatabase = new DatabaseSync(context.databasePath);
  const targets = resultDatabase.prepare("SELECT provider_product_id,target_sku FROM provider_identity_candidate WHERE receipt_id=? ORDER BY provider_product_id").all(report.receiptId) as Array<{ provider_product_id: string; target_sku: string }>;
  assert.deepEqual(targets.map((target) => ({ ...target })), [{ provider_product_id: "100", target_sku: "sku-58" }, { provider_product_id: "101", target_sku: "sku-holo" }]); resultDatabase.close();
});

test("an exact player annotation breaks World Championship deck ties", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET name='Pikachu - 2008 (Alice Smith)',set_name='World Championship Decks' WHERE sku='sku-58'").run();
  database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES('pokemon-en','sku-bob','SINGLE','Pikachu - 2008 (Bob Jones)','World Championship Decks','58/102','Normal','English',NULL)").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "console-name": "Pokemon World Championships 2008", "product-name": "Pikachu [Alice Smith] #58/102" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1); assert.equal(report.ambiguous, 0);
  const resultDatabase = new DatabaseSync(context.databasePath); const target = resultDatabase.prepare("SELECT target_sku FROM provider_identity_candidate WHERE receipt_id=?").get(report.receiptId) as { target_sku: string };
  assert.equal(target.target_sku, "sku-58"); resultDatabase.close();
});

test("explicit Prize Pack evidence routes to the dedicated local catalogue", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET name='Pikachu - 58/102',set_name='Prize Pack Series Cards' WHERE sku='sku-58'").run();
  database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES('pokemon-en','sku-prize-holo','SINGLE','Pikachu - 58/102','Prize Pack Series Cards','58/102','Holofoil','English',NULL)").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ id: "100", "product-name": "Pikachu [Prize Pack] #58/102" }), csvRow({ id: "101", "product-name": "Pikachu [Prize Pack Holo] #58/102" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 2); assert.equal(report.countsByMethod.DOCUMENTED_SET_ALIAS_IDENTITY, 2);
});

test("Non-Holo labels cannot satisfy a Holo request", () => {
  const context = prepare(); const database = new DatabaseSync(context.databasePath);
  database.prepare("UPDATE pricing_products SET name='Pikachu (Non-Holo)' WHERE sku='sku-58'").run();
  database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES('pokemon-en','sku-holo','SINGLE','Pikachu (Holo)','Base Set','58/102','Holofoil','English',NULL)").run(); database.close();
  const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({ "product-name": "Pikachu [Holo] #58/102" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(report.accepted, 1); assert.equal(report.ambiguous, 0);
  const resultDatabase = new DatabaseSync(context.databasePath); const target = resultDatabase.prepare("SELECT target_sku FROM provider_identity_candidate WHERE receipt_id=?").get(report.receiptId) as { target_sku: string };
  assert.equal(target.target_sku, "sku-holo"); resultDatabase.close();
});

test("same dry-run is idempotent and returns its deterministic report", () => {
  const context = prepare(); const file = join(context.directory, "guide.csv"); writeFileSync(file, fixture([csvRow({})]));
  const first = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  const second = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts });
  assert.equal(second.outcome, "ALREADY_IMPORTED"); assert.equal(second.receiptId, first.receiptId);
  assert.equal(JSON.parse(readFileSync(join(context.receipts, `${first.sourceHash}-${PRICECHARTING_SCHEMA_VERSION}-${PRICECHARTING_RESOLVER_VERSION}-report.json`), "utf8")).crosswalkFingerprint, first.crosswalkFingerprint);
});
