import { join } from "node:path";
import { openPriceChartingBulkRepository } from "@/lib/providers/pricecharting/PriceChartingBulkImport";

let opened: ReturnType<typeof openPriceChartingBulkRepository> | undefined;

export function getPriceChartingBulkRepository() {
  opened ??= openPriceChartingBulkRepository(process.env.PHRONESIS_PRICING_DB_PATH ?? join(process.cwd(), ".data", "pricing-lookup.sqlite"));
  return opened.repository;
}
