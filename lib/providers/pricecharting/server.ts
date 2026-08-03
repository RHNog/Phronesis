import { join } from "node:path";
import { operationalPricingDatabasePath } from "@/lib/pricing/databasePath";
import { openPriceChartingBulkRepository } from "@/lib/providers/pricecharting/PriceChartingBulkImport";
import { PriceChartingDailySync, type PriceChartingDailySource } from "@/lib/providers/pricecharting/PriceChartingDailySync";
import { getProviderCredential } from "@/lib/providers/credentials";

let opened: ReturnType<typeof openPriceChartingBulkRepository> | undefined;

export function getPriceChartingBulkRepository() {
  opened ??= openPriceChartingBulkRepository(operationalPricingDatabasePath());
  return opened.repository;
}

export function getPriceChartingDailySources(): PriceChartingDailySource[] {
  const candidates: Array<[PriceChartingDailySource["gameProfile"], string]> = [
    ["magic-en", "PRICECHARTING_MAGIC_CSV_URL"],
    ["onepiece-en", "PRICECHARTING_ONEPIECE_CSV_URL"],
  ];
  return candidates.flatMap(([gameProfile, field]) => {
    const url = getProviderCredential("pricecharting", field);
    return url ? [{ gameProfile, url }] : [];
  });
}

export function createPriceChartingDailySync() {
  return new PriceChartingDailySync({
    applicationVersion: process.env.npm_package_version ?? "0.1.0",
    databasePath: operationalPricingDatabasePath(),
    receiptDirectory: process.env.PHRONESIS_PRICECHARTING_RECEIPT_DIR ?? join(process.cwd(), ".data", "provider-receipts", "pricecharting"),
  });
}
