import { createHash } from "node:crypto";
import { closeSync, openSync, readSync } from "node:fs";
import { resolve } from "node:path";
import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import { PricingRepository } from "../lib/pricing/repository";
import {
  readTcgplayerCatalog,
  TCGPLAYER_CATALOG_CONTRACT_VERSION,
  TCGPLAYER_CATALOG_SCHEMA_VERSION,
  tcgplayerCatalogSources,
  type TcgplayerCategoryId,
} from "../lib/pricing/tcgplayerCatalog";

const [cataloguePath, category = "magic-en", checkpointAt = new Date().toISOString()] = process.argv.slice(2);
if (!cataloguePath || !(category in tcgplayerCatalogSources) || Number.isNaN(Date.parse(checkpointAt))) {
  throw new Error(
    `Usage: npm run pricing:catalog-import -- <catalog.csv> <${Object.keys(tcgplayerCatalogSources).join("|")}> [checkpoint-iso-time]`,
  );
}

const filePath = resolve(cataloguePath);
const hash = createHash("sha256");
const descriptor = openSync(filePath, "r");
const buffer = Buffer.allocUnsafe(1024 * 1024);
try {
  let bytesRead = 0;
  while ((bytesRead = readSync(descriptor, buffer, 0, buffer.length, null)) > 0) hash.update(buffer.subarray(0, bytesRead));
} finally {
  closeSync(descriptor);
}

const databasePath = operationalPricingDatabasePath();
const repository = new PricingRepository(databasePath);
try {
  const startedAt = new Date().toISOString();
  const sourceHash = hash.digest("hex");
  const result = repository.importNormalizedRows(
    readTcgplayerCatalog(filePath, category as TcgplayerCategoryId, checkpointAt),
    {
      categoryId: category,
      sourceHash,
      contractVersion: TCGPLAYER_CATALOG_CONTRACT_VERSION,
      sourceSchemaVersion: TCGPLAYER_CATALOG_SCHEMA_VERSION,
      checkpointAt,
    },
  );
  repository.recordSyncState({
    categoryId: category,
    status: "CURRENT",
    checkpointAt,
    startedAt,
    completedAt: new Date().toISOString(),
    sourceHash,
    sourcePath: filePath,
    result,
  });
  process.stdout.write(`${JSON.stringify({ ...result, categoryId: category, checkpointAt })}\n`);
} finally {
  repository.close();
}
