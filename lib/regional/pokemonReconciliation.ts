import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  discoverLatestLigaPokemonSnapshot,
  type LigaPokemonSnapshotLocation,
} from "@/lib/regional/pokemonSnapshotDiscovery";
import {
  PokemonRegionalReconciliationRepository,
  type PokemonCrosswalkReport,
} from "@/lib/regional/PokemonRegionalReconciliationRepository";

export function rebuildPokemonRegionalCrosswalk(input: {
  databasePath: string;
  reportPath?: string;
  snapshot?: LigaPokemonSnapshotLocation;
}): PokemonCrosswalkReport {
  const database = new DatabaseSync(input.databasePath);
  database.exec("PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;");
  try {
    const regional = new PokemonRegionalReconciliationRepository(database);
    const source = input.snapshot ?? discoverLatestLigaPokemonSnapshot();
    const report = regional.buildCrosswalk(
      source.databasePath,
      source.manifestPath,
    );
    const reportPath = resolve(
      input.reportPath ??
        process.env.PHRONESIS_POKEMON_REGIONAL_REPORT_PATH ??
        ".data/regional/pokemon-crosswalk-validation.json",
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
    database.close();
  }
}
