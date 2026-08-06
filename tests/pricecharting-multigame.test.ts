import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { PRICECHARTING_HEADERS, importPriceChartingCsv, inspectPriceChartingCsv } from "../lib/providers/pricecharting/PriceChartingBulkImport";
import { PricingRepository } from "../lib/pricing/repository";

function csvRow(overrides: Record<string, string>) {
  const row: Record<string, string> = Object.fromEntries(PRICECHARTING_HEADERS.map((header) => [header, ""]));
  Object.assign(row, { id: "1", "loose-price": "100", "sales-volume": "1", "release-date": "2025-01-01" }, overrides);
  return PRICECHARTING_HEADERS.map((header) => row[header]).join(",");
}
function fixture(rows: string[]) { return `${PRICECHARTING_HEADERS.join(",")}\n${rows.join("\n")}\n`; }
function prepare() {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-pricecharting-multigame-"));
  const databasePath = join(directory, "pricing.sqlite");
  new PricingRepository(databasePath).close();
  return { databasePath, directory, receipts: join(directory, "receipts") };
}
function insert(databasePath: string, values: { category: string; sku: string; name: string; set: string; collector: string; variant: string }) {
  const database = new DatabaseSync(databasePath);
  database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES(?,?,'SINGLE',?,?,?,?, 'English',NULL)")
    .run(values.category, values.sku, values.name, values.set, values.collector, values.variant);
  database.close();
}

test("Magic collector identity permits a generic Foil label to resolve a collector-specific treatment", () => {
  const context = prepare();
  insert(context.databasePath, { category: "magic-en", sku: "who-1045", name: "Ace's Baseball Bat (Extended Art) (Surge Foil)", set: "Universes Beyond: Doctor Who", collector: "1045", variant: "Foil" });
  const file = join(context.directory, "magic.csv");
  writeFileSync(file, fixture([csvRow({ "console-name": "Magic Doctor Who", "product-name": "Ace's Baseball Bat [Foil] #1045", genre: "Magic Card", "tcg-id": "15023" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts, gameProfile: "magic-en" });
  assert.equal(report.accepted, 1);
  const database = new DatabaseSync(context.databasePath);
  assert.equal((database.prepare("SELECT target_sku FROM provider_identity_candidate WHERE receipt_id=?").get(report.receiptId) as { target_sku: string }).target_sku, "who-1045");
  database.close();
});

test("One Piece PRB01 qualifier resolves the exact premium-booster artwork despite its source catalogue", () => {
  const context = prepare();
  insert(context.databasePath, { category: "onepiece-en", sku: "baby-prb", name: "Baby 5 (OP05-034) (Alternate Art)", set: "Premium Booster -The Best-", collector: "OP05-034", variant: "Foil" });
  insert(context.databasePath, { category: "onepiece-en", sku: "baby-base", name: "Baby 5 (034)", set: "Awakening of the New Era", collector: "OP05-034", variant: "Foil" });
  const file = join(context.directory, "onepiece.csv");
  writeFileSync(file, fixture([csvRow({ "console-name": "One Piece Awakening of the New Era", "product-name": "Baby 5 [Alternate Art PRB01] OP05-034", genre: "One Piece Card" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts, gameProfile: "onepiece-en" });
  assert.equal(report.accepted, 1); assert.equal(report.ambiguous, 0);
  const database = new DatabaseSync(context.databasePath);
  assert.equal((database.prepare("SELECT target_sku FROM provider_identity_candidate WHERE receipt_id=?").get(report.receiptId) as { target_sku: string }).target_sku, "baby-prb");
  database.close();
});

test("One Piece PRB02 plain and foil rows remain separate physical products", () => {
  const context = prepare();
  insert(context.databasePath, { category: "onepiece-en", sku: "adio-normal", name: "Adio", set: "Premium Booster -The Best- Vol. 2", collector: "P-078", variant: "Normal" });
  insert(context.databasePath, { category: "onepiece-en", sku: "adio-pirate", name: "Adio (Pirate Foil)", set: "Premium Booster -The Best- Vol. 2", collector: "P-078", variant: "Foil" });
  const file = join(context.directory, "onepiece.csv");
  writeFileSync(file, fixture([
    csvRow({ id: "1", "console-name": "One Piece Premium Booster 2", "product-name": "Adio [PRB-02] P-078", genre: "One Piece Cards" }),
    csvRow({ id: "2", "console-name": "One Piece Premium Booster 2", "product-name": "Adio [Foil PRB-02] P-078", genre: "One Piece Cards" }),
  ]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts, gameProfile: "onepiece-en" });
  assert.equal(report.accepted, 2); assert.equal(report.collisions, 0);
});

test("One Piece Alt Art shorthand selects the parallel and never the base printing", () => {
  const context = prepare();
  insert(context.databasePath, { category: "onepiece-en", sku: "luffy-base", name: "Monkey.D.Luffy (003)", set: "Romance Dawn", collector: "OP01-003", variant: "Normal" });
  insert(context.databasePath, { category: "onepiece-en", sku: "luffy-parallel", name: "Monkey.D.Luffy (003) (Parallel)", set: "Romance Dawn", collector: "OP01-003", variant: "Foil" });
  const file = join(context.directory, "onepiece.csv");
  writeFileSync(file, fixture([csvRow({ "console-name": "One Piece Romance Dawn", "product-name": "Monkey.D.Luffy [Alt Art] OP01-003", genre: "One Piece Card" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts, gameProfile: "onepiece-en" });
  assert.equal(report.accepted, 1); assert.equal(report.ambiguous, 0);
  const database = new DatabaseSync(context.databasePath);
  assert.equal((database.prepare("SELECT target_sku FROM provider_identity_candidate WHERE receipt_id=?").get(report.receiptId) as { target_sku: string }).target_sku, "luffy-parallel");
  database.close();
});

test("English One Piece import explicitly rejects Japanese rows", () => {
  const context = prepare();
  insert(context.databasePath, { category: "onepiece-en", sku: "luffy", name: "Monkey.D.Luffy", set: "Romance Dawn", collector: "OP01-003", variant: "Normal" });
  const file = join(context.directory, "onepiece.csv");
  writeFileSync(file, fixture([csvRow({ "console-name": "One Piece Japanese Romance Dawn", "product-name": "Monkey.D.Luffy OP01-003", genre: "Japanese Cards" })]));
  const report = importPriceChartingCsv({ file, databasePath: context.databasePath, receiptDirectory: context.receipts, gameProfile: "onepiece-en" });
  assert.equal(report.unsupported, 1); assert.equal(report.accepted, 0);
});

test("profile inspection rejects a valid CSV for the wrong game before import", () => {
  const csv = fixture([csvRow({ "console-name": "Magic Doctor Who", "product-name": "Ace #1", genre: "Magic Card" })]);
  assert.throws(() => inspectPriceChartingCsv(csv, "onepiece-en"), /game-profile mismatch/);
});
