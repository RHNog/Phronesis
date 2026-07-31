import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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
  const reportPath = resolve(
    process.env.PHRONESIS_REGIONAL_REPORT_PATH ??
      ".data/regional/crosswalk-validation.json",
  );
  mkdirSync(dirname(reportPath), { recursive: true });
  const temporaryPath = `${reportPath}.tmp`;
  writeFileSync(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  renameSync(temporaryPath, reportPath);
  const {
    editionAliases,
    worldChampionshipPlayerAliases,
    topUnmatchedEditions,
    ...summary
  } = report;
  process.stdout.write(`${JSON.stringify({
    ...summary,
    reportPath,
    editionAliasPreview: editionAliases.slice(0, 20),
    worldChampionshipPlayerAliasPreview:
      worldChampionshipPlayerAliases.slice(0, 20),
    topUnmatchedEditions,
  }, null, 2)}\n`);
} finally {
  pricing.close();
}
