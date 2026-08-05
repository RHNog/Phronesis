import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type LigaPokemonSnapshotLocation = {
  databasePath: string;
  manifestPath: string;
};

export function discoverLatestLigaPokemonSnapshot(
  root = resolve(".data/ligapokemon/runs"),
): LigaPokemonSnapshotLocation {
  const candidates = readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("dry-run-"))
    .map((entry) => join(root, entry.name))
    .sort()
    .reverse();
  for (const directory of candidates) {
    const manifestPath = join(directory, "manifest.json");
    if (!existsSync(manifestPath)) continue;
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      status?: unknown;
      databaseFile?: unknown;
      contractVersion?: unknown;
    };
    if (
      manifest.status !== "DRY_RUN_COMPLETE" ||
      typeof manifest.databaseFile !== "string" ||
      typeof manifest.contractVersion !== "string"
    ) {
      continue;
    }
    const databasePath = join(directory, manifest.databaseFile);
    if (existsSync(databasePath)) return { databasePath, manifestPath };
  }
  throw new Error("No complete LigaPokemon dry-run snapshot was found.");
}
