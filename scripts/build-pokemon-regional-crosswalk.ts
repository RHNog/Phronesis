import { operationalPricingDatabasePath } from "../lib/pricing/databasePath.ts";
import { rebuildPokemonRegionalCrosswalk } from "../lib/regional/pokemonReconciliation.ts";

const reportPath =
  process.env.PHRONESIS_POKEMON_REGIONAL_REPORT_PATH ??
  ".data/regional/pokemon-crosswalk-validation.json";
const report = rebuildPokemonRegionalCrosswalk({
  databasePath: operationalPricingDatabasePath(),
  reportPath,
});
const { topUnmatchedSets, ...summary } = report;
process.stdout.write(
  `${JSON.stringify({ ...summary, reportPath, topUnmatchedSets }, null, 2)}\n`,
);
