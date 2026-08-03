import { operationalPricingDatabasePath } from "../lib/pricing/databasePath.ts";
import { rebuildRegionalCrosswalk } from "../lib/regional/reconciliation.ts";

const report = rebuildRegionalCrosswalk({
  databasePath: operationalPricingDatabasePath(),
});
const reportPath =
  process.env.PHRONESIS_REGIONAL_REPORT_PATH ??
  ".data/regional/crosswalk-validation.json";
{
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
}
