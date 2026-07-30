import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { PricingRepository } from "../lib/pricing/repository.ts";
import {
  discoverLatestLigaSnapshot,
  RegionalIntelligenceRepository,
} from "../lib/regional/RegionalIntelligenceRepository.ts";

const operationalDatabase = resolve(".data/mobile-review.sqlite");
const pricing = new PricingRepository(
  process.env.PHRONESIS_PRICING_DB_PATH ??
    (existsSync(operationalDatabase)
      ? operationalDatabase
      : resolve(".data/pricing-lookup.sqlite")),
);
try {
  const regional = new RegionalIntelligenceRepository(pricing.database);
  const source = discoverLatestLigaSnapshot();
  const report = regional.buildCrosswalk(
    source.databasePath,
    source.manifestPath,
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  pricing.close();
}
