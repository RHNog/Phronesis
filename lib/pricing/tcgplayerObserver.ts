import { createHash } from "node:crypto";
import {
  closeSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  rmSync,
} from "node:fs";
import { basename, isAbsolute, join, relative, resolve, sep } from "node:path";
import { PricingRepository, type ImportResult } from "@/lib/pricing/repository";
import {
  readTcgplayerCatalog,
  TCGPLAYER_CATALOG_CONTRACT_VERSION,
  TCGPLAYER_CATALOG_SCHEMA_VERSION,
  tcgplayerCatalogSources,
  type TcgplayerCategoryId,
} from "@/lib/pricing/tcgplayerCatalog";

type RunState = {
  run_dir?: unknown;
  steps?: Record<string, { done?: unknown; at?: unknown }>;
};

export type CompletedCatalogue = {
  categoryId: TcgplayerCategoryId;
  checkpointAt: string;
  filePath: string;
};

export type SyncAttempt = {
  categoryId: TcgplayerCategoryId;
  outcome: "IMPORTED" | "ALREADY_IMPORTED" | "FAILED";
  result?: ImportResult;
  error?: string;
  watchlistRefreshError?: string;
};

export type VerifiedCheckpoint = {
  categoryId: TcgplayerCategoryId;
  checkpointAt: string;
  pricingRepository: PricingRepository;
};

export function defaultPricingToolRoot(phronesisRoot = process.cwd()): string {
  return resolve(phronesisRoot, "..", "TCGPlayer Tools", "Price Updating");
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n]+/g, " ").slice(0, 800);
}

function isInside(parent: string, candidate: string): boolean {
  const pathFromParent = relative(parent, candidate);
  return (
    pathFromParent !== "" &&
    !pathFromParent.startsWith(`..${sep}`) &&
    pathFromParent !== ".." &&
    !isAbsolute(pathFromParent)
  );
}

function hashFile(filePath: string): string {
  const hash = createHash("sha256");
  const descriptor = openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    while (
      (bytesRead = readSync(descriptor, buffer, 0, buffer.length, null)) > 0
    ) {
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
}

function checkpointSlug(checkpointAt: string): string {
  return checkpointAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function archiveCompletedCatalogue(input: {
  archiveRoot: string;
  catalogue: CompletedCatalogue;
  sourceHash: string;
}): string {
  mkdirSync(input.archiveRoot, { recursive: true });
  if (lstatSync(input.archiveRoot).isSymbolicLink()) {
    throw new Error("Pricing catalogue archive root must not be a symlink.");
  }
  const root = realpathSync(input.archiveRoot);
  const source = tcgplayerCatalogSources[input.catalogue.categoryId];
  const directory = join(root, checkpointSlug(input.catalogue.checkpointAt));
  mkdirSync(directory, { recursive: true });
  const destination = join(
    directory,
    `catalog_${source.game}-${input.sourceHash.slice(0, 16)}.csv`,
  );
  if (existsSync(destination)) {
    if (hashFile(destination) !== input.sourceHash) {
      throw new Error(
        `Archived ${source.game} catalogue hash does not match its verified source.`,
      );
    }
    return destination;
  }
  const temporary = join(
    directory,
    `.catalog_${source.game}.${process.pid}.${Date.now()}.tmp`,
  );
  try {
    copyFileSync(input.catalogue.filePath, temporary);
    if (hashFile(temporary) !== input.sourceHash) {
      throw new Error(
        `Copied ${source.game} catalogue hash does not match its verified source.`,
      );
    }
    renameSync(temporary, destination);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
  return destination;
}

export function readCompletedCatalogues(
  toolRoot: string,
): CompletedCatalogue[] {
  const root = realpathSync(toolRoot);
  const statePath = join(root, "state", "run_state.json");
  if (!existsSync(statePath)) return [];
  let state: RunState;
  try {
    state = JSON.parse(readFileSync(statePath, "utf8")) as RunState;
  } catch {
    return [];
  }
  if (
    typeof state.run_dir !== "string" ||
    !state.steps ||
    typeof state.steps !== "object"
  )
    return [];
  const configuredRunDirectory = resolve(state.run_dir);
  const dataRoot = realpathSync(join(root, "data"));
  if (
    !existsSync(configuredRunDirectory) ||
    lstatSync(configuredRunDirectory).isSymbolicLink()
  ) {
    throw new Error(
      "Pricing Update Tool run directory is missing or is a symlink.",
    );
  }
  const runDirectory = realpathSync(configuredRunDirectory);
  if (!isInside(dataRoot, runDirectory)) {
    throw new Error(
      "Pricing Update Tool run directory is outside its configured data root or is a symlink.",
    );
  }

  const completed: CompletedCatalogue[] = [];
  for (const [categoryId, source] of Object.entries(
    tcgplayerCatalogSources,
  ) as Array<
    [TcgplayerCategoryId, (typeof tcgplayerCatalogSources)[TcgplayerCategoryId]]
  >) {
    const step = state.steps[`export_catalog::${source.game}`];
    if (
      step?.done !== true ||
      typeof step.at !== "number" ||
      !Number.isFinite(step.at)
    )
      continue;
    const filePath = join(runDirectory, `catalog_${source.game}.csv`);
    if (
      basename(filePath) !== `catalog_${source.game}.csv` ||
      !existsSync(filePath)
    ) {
      throw new Error(
        `Completed ${source.game} checkpoint has no readable catalogue file.`,
      );
    }
    const file = lstatSync(filePath);
    if (!file.isFile() || file.isSymbolicLink() || file.size <= 256) {
      throw new Error(
        `Completed ${source.game} catalogue is not a stable regular file.`,
      );
    }
    completed.push({
      categoryId,
      checkpointAt: new Date(step.at * 1000).toISOString(),
      filePath,
    });
  }
  return completed;
}

export function syncCompletedCatalogues(input: {
  archiveRoot?: string;
  databasePath: string;
  onVerifiedCheckpoint?: (checkpoint: VerifiedCheckpoint) => void;
  toolRoot: string;
}): SyncAttempt[] {
  const repository = new PricingRepository(input.databasePath);
  const attempts: SyncAttempt[] = [];
  try {
    const catalogues = readCompletedCatalogues(input.toolRoot);
    for (const catalogue of catalogues) {
      const startedAt = new Date().toISOString();
      let sourceHash: string | null = null;
      let durableSourcePath = catalogue.filePath;
      try {
        sourceHash = hashFile(catalogue.filePath);
        if (input.archiveRoot) {
          durableSourcePath = archiveCompletedCatalogue({
            archiveRoot: input.archiveRoot,
            catalogue,
            sourceHash,
          });
        }
        const metadata = {
          categoryId: catalogue.categoryId,
          sourceHash,
          contractVersion: TCGPLAYER_CATALOG_CONTRACT_VERSION,
          sourceSchemaVersion: TCGPLAYER_CATALOG_SCHEMA_VERSION,
          checkpointAt: catalogue.checkpointAt,
        };
        if (repository.hasImport(metadata)) {
          const result: ImportResult = {
            status: "ALREADY_IMPORTED",
            sourceHash,
            rowsRead: 0,
            productsUpserted: 0,
            snapshotsInserted: 0,
          };
          repository.recordSyncState({
            categoryId: catalogue.categoryId,
            status: "CURRENT",
            checkpointAt: catalogue.checkpointAt,
            startedAt,
            completedAt: new Date().toISOString(),
            sourceHash,
            sourcePath: durableSourcePath,
            result,
          });
          attempts.push({
            categoryId: catalogue.categoryId,
            outcome: "ALREADY_IMPORTED",
            result,
          });
          continue;
        }
        repository.recordSyncState({
          categoryId: catalogue.categoryId,
          status: "IMPORTING",
          checkpointAt: catalogue.checkpointAt,
          startedAt,
          sourceHash,
          sourcePath: durableSourcePath,
        });
        const result = repository.importNormalizedRows(
          readTcgplayerCatalog(
            catalogue.filePath,
            catalogue.categoryId,
            catalogue.checkpointAt,
          ),
          metadata,
        );
        repository.recordSyncState({
          categoryId: catalogue.categoryId,
          status: "CURRENT",
          checkpointAt: catalogue.checkpointAt,
          startedAt,
          completedAt: new Date().toISOString(),
          sourceHash,
          sourcePath: durableSourcePath,
          result,
        });
        let watchlistRefreshError: string | undefined;
        try {
          input.onVerifiedCheckpoint?.({
            categoryId: catalogue.categoryId,
            checkpointAt: catalogue.checkpointAt,
            pricingRepository: repository,
          });
        } catch (error) {
          watchlistRefreshError = safeError(error);
        }
        attempts.push({
          categoryId: catalogue.categoryId,
          outcome: result.status,
          result,
          watchlistRefreshError,
        });
      } catch (error) {
        const message = safeError(error);
        repository.recordSyncState({
          categoryId: catalogue.categoryId,
          status: "FAILED",
          checkpointAt: catalogue.checkpointAt,
          startedAt,
          completedAt: new Date().toISOString(),
          sourceHash,
          sourcePath: durableSourcePath,
          lastError: message,
        });
        attempts.push({
          categoryId: catalogue.categoryId,
          outcome: "FAILED",
          error: message,
        });
      }
    }
  } finally {
    repository.close();
  }
  return attempts;
}
