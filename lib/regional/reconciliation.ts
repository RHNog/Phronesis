import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PricingRepository } from "@/lib/pricing/repository";
import {
  discoverLatestLigaSnapshot,
  RegionalIntelligenceRepository,
  type CrosswalkReport,
} from "@/lib/regional/RegionalIntelligenceRepository";

export function rebuildRegionalCrosswalk(input: {
  databasePath: string;
  reportPath?: string;
}): CrosswalkReport {
  const pricing = new PricingRepository(input.databasePath);
  try {
    const regional = new RegionalIntelligenceRepository(pricing.database);
    const source = discoverLatestLigaSnapshot();
    const report = regional.buildCrosswalk(
      source.databasePath,
      source.manifestPath,
    );
    const reportPath = resolve(
      input.reportPath ??
        process.env.PHRONESIS_REGIONAL_REPORT_PATH ??
        ".data/regional/crosswalk-validation.json",
    );
    mkdirSync(dirname(reportPath), { recursive: true });
    const temporaryPath = `${reportPath}.${process.pid}.tmp`;
    writeFileSync(temporaryPath, `${JSON.stringify(report, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    renameSync(temporaryPath, reportPath);
    return report;
  } finally {
    pricing.close();
  }
}
