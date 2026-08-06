import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { PricingExportContract } from "../lib/pricing/contract";
import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import { PricingRepository } from "../lib/pricing/repository";

const [csvPath, contractPath, categoryId = "pokemon-en"] = process.argv.slice(2);
if (!csvPath || !contractPath) {
  throw new Error("Usage: npm run pricing:import -- <export.csv> <authoritative-contract.json> [category-id]");
}

const resolvedCsvPath = resolve(csvPath);
const resolvedContractPath = resolve(contractPath);
const csv = readFileSync(resolvedCsvPath, "utf8");
const contract = JSON.parse(readFileSync(resolvedContractPath, "utf8")) as PricingExportContract;
const repository = new PricingRepository(operationalPricingDatabasePath());

try {
  const result = repository.importCsv(categoryId, csv, contract);
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally {
  repository.close();
}
