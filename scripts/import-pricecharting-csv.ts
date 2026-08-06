import { join, resolve } from "node:path";
import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import { importPriceChartingCsv } from "../lib/providers/pricecharting/PriceChartingBulkImport";

const argumentsList = process.argv.slice(2);
function value(flag: string): string | undefined { const index = argumentsList.indexOf(flag); return index >= 0 ? argumentsList[index + 1] : undefined; }
const file = value("--file");
if (!file) throw new Error("Usage: npm run pricecharting:import -- --file <absolute-csv-path> --game <pokemon-en|magic-en|onepiece-en> [--apply]");
const report = importPriceChartingCsv({
  file: resolve(file),
  gameProfile: value("--game") ?? "pokemon-en",
  apply: argumentsList.includes("--apply"),
  databasePath: operationalPricingDatabasePath(),
  receiptDirectory: process.env.PHRONESIS_PRICECHARTING_RECEIPT_DIR ?? join(process.cwd(), ".data", "provider-receipts", "pricecharting"),
  applicationVersion: process.env.npm_package_version ?? "0.1.0",
});
console.log(JSON.stringify(report, null, 2));
