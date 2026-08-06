import {
  buildLigaNetworkSnapshot,
  type LigaMagicSourceReceipt,
  type LigaSnapshotManifest,
  sha256File,
} from "../ligamagic/Snapshot.ts";
import {
  LIGAPOKEMON_CSV_CONTRACT_VERSION,
  readLigaPokemonCsv,
} from "./Csv.ts";

export type LigaPokemonSourceReceipt = LigaMagicSourceReceipt;
export type LigaPokemonSnapshotManifest = LigaSnapshotManifest & {
  featureId: "PHR-API-013";
};

export { sha256File };

export function buildLigaPokemonSnapshot(input: {
  runId: string;
  outputDirectory: string;
  startedAt: string;
  completedAt: string;
  sources: readonly LigaPokemonSourceReceipt[];
}): LigaPokemonSnapshotManifest {
  return buildLigaNetworkSnapshot(input, {
    providerId: "ligapokemon",
    providerLabel: "LigaPokemon",
    featureId: "PHR-API-013",
    contractVersion: LIGAPOKEMON_CSV_CONTRACT_VERSION,
    databaseFile: "ligapokemon-dry-run.sqlite",
    readCsv: readLigaPokemonCsv,
  }) as LigaPokemonSnapshotManifest;
}
