import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { PRICECHARTING_HEADERS } from "../lib/providers/pricecharting/PriceChartingBulkImport";
import { PRICECHARTING_CSV_MIN_INTERVAL_MS, PriceChartingDailySync } from "../lib/providers/pricecharting/PriceChartingDailySync";
import { PricingRepository } from "../lib/pricing/repository";

function row(overrides: Record<string, string>) {
  const values: Record<string, string> = Object.fromEntries(PRICECHARTING_HEADERS.map((header) => [header, ""]));
  Object.assign(values, { id: "1", "loose-price": "100", "sales-volume": "1", "release-date": "2025-01-01" }, overrides);
  return PRICECHARTING_HEADERS.map((header) => values[header]).join(",");
}
function csv(values: string[]) { return `${PRICECHARTING_HEADERS.join(",")}\n${values.join("\n")}\n`; }
function prepare() {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-pricecharting-daily-"));
  const databasePath = join(directory, "pricing.sqlite");
  const pricing = new PricingRepository(databasePath);
  const insert = pricing.database.prepare("INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url) VALUES(?,?,'SINGLE',?,?,?,?, 'English',NULL)");
  insert.run("magic-en", "magic-1", "Lightning Bolt", "Magic 2010 (M10)", "146", "Normal");
  insert.run("onepiece-en", "op-1", "Monkey.D.Luffy", "Romance Dawn", "OP01-003", "Normal");
  pricing.close();
  return { databasePath, receipts: join(directory, "receipts") };
}

test("daily sync spaces provider CSV calls, activates both games, and is restart-idempotent", async () => {
  const context = prepare();
  let clock = Date.parse("2026-08-01T06:15:00.000Z");
  const sleeps: number[] = []; const calls: string[] = [];
  const bodies = new Map([
    ["https://www.pricecharting.com/private/magic.csv", csv([row({ "console-name": "Magic M10", "product-name": "Lightning Bolt #146", genre: "Magic Card" })])],
    ["https://www.pricecharting.com/private/onepiece.csv", csv([row({ "console-name": "One Piece Romance Dawn", "product-name": "Monkey.D.Luffy OP01-003", genre: "One Piece Card" })])],
  ]);
  const sync = new PriceChartingDailySync({
    databasePath: context.databasePath, receiptDirectory: context.receipts, now: () => new Date(clock),
    sleep: async (milliseconds) => { sleeps.push(milliseconds); clock += milliseconds; },
    fetcher: async (input) => { const url = String(input); calls.push(url); return new Response(bodies.get(url), { headers: { "content-type": "text/csv" } }); },
  });
  const sources = [
    { gameProfile: "magic-en" as const, url: "https://www.pricecharting.com/private/magic.csv" },
    { gameProfile: "onepiece-en" as const, url: "https://www.pricecharting.com/private/onepiece.csv" },
  ];
  const first = await sync.run(sources);
  assert.deepEqual(first.map((result) => result.status), ["SUCCEEDED", "SUCCEEDED"]);
  assert.deepEqual(sleeps, [PRICECHARTING_CSV_MIN_INTERVAL_MS]);
  const second = await sync.run(sources);
  assert.deepEqual(second.map((result) => result.status), ["SKIPPED_ALREADY_CURRENT", "SKIPPED_ALREADY_CURRENT"]);
  assert.equal(calls.length, 2);
  sync.close();
  const database = new DatabaseSync(context.databasePath);
  assert.equal((database.prepare("SELECT COUNT(*) count FROM provider_import_active_state").get() as { count: number }).count, 2);
  database.close();
});

test("daily sync rejects a non-PriceCharting URL without sending a request or storing the URL", async () => {
  const context = prepare(); let calls = 0;
  const sync = new PriceChartingDailySync({ databasePath: context.databasePath, receiptDirectory: context.receipts, fetcher: async () => { calls += 1; return new Response(); } });
  const result = await sync.run([{ gameProfile: "magic-en", url: "https://attacker.example/magic.csv?token=secret" }]);
  assert.equal(calls, 0); assert.equal(result[0].status, "FAILED"); assert.equal(result[0].errorCode, "PRICECHARTING_DOWNLOAD_URL_REJECTED");
  sync.close();
  const database = new DatabaseSync(context.databasePath);
  const state = database.prepare("SELECT error_code FROM pricecharting_daily_sync_state").get() as { error_code: string };
  assert.equal(state.error_code, "PRICECHARTING_DOWNLOAD_URL_REJECTED");
  const serialized = JSON.stringify(database.prepare("SELECT * FROM pricecharting_daily_sync_state").all());
  assert.equal(serialized.includes("secret"), false); database.close();
});

test("a failed second game preserves the first activation and retries only the failed game", async () => {
  const context = prepare(); let clock = Date.parse("2026-08-01T06:15:00.000Z"); const sleeps: number[] = [];
  const magicCsv = csv([row({ "console-name": "Magic M10", "product-name": "Lightning Bolt #146", genre: "Magic Card" })]);
  const onePieceCsv = csv([row({ "console-name": "One Piece Romance Dawn", "product-name": "Monkey.D.Luffy OP01-003", genre: "One Piece Card" })]);
  let onePieceBody = magicCsv;
  const sync = new PriceChartingDailySync({
    databasePath: context.databasePath, receiptDirectory: context.receipts, now: () => new Date(clock),
    sleep: async (milliseconds) => { sleeps.push(milliseconds); clock += milliseconds; },
    fetcher: async (input) => new Response(String(input).includes("onepiece") ? onePieceBody : magicCsv, { headers: { "content-type": "text/csv" } }),
  });
  const first = await sync.run([
    { gameProfile: "magic-en", url: "https://www.pricecharting.com/private/magic.csv" },
    { gameProfile: "onepiece-en", url: "https://www.pricecharting.com/private/onepiece.csv" },
  ]);
  assert.deepEqual(first.map((result) => result.status), ["SUCCEEDED", "FAILED"]);
  let database = new DatabaseSync(context.databasePath);
  assert.deepEqual((database.prepare("SELECT game_profile FROM provider_import_active_state ORDER BY game_profile").all() as Array<{ game_profile: string }>).map((row) => row.game_profile), ["magic-en"]);
  database.close();
  onePieceBody = onePieceCsv;
  const retry = await sync.run([{ gameProfile: "onepiece-en", url: "https://www.pricecharting.com/private/onepiece.csv" }]);
  assert.equal(retry[0].status, "SUCCEEDED"); assert.deepEqual(sleeps, [PRICECHARTING_CSV_MIN_INTERVAL_MS, PRICECHARTING_CSV_MIN_INTERVAL_MS]);
  sync.close();
  database = new DatabaseSync(context.databasePath);
  assert.equal((database.prepare("SELECT COUNT(*) count FROM provider_import_active_state").get() as { count: number }).count, 2);
  database.close();
});
