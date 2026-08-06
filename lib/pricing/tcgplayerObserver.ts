import { createHash } from "node:crypto";
import {
  closeSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  readSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
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

export type CaptureReceiptStatus =
  | "CAPTURED"
  | "IMPORTING"
  | "IMPORTED"
  | "FAILED";

export type CaptureReceipt = {
  version: "pricing-catalogue-capture-v1";
  categoryId: TcgplayerCategoryId;
  checkpointAt: string;
  sourceHash: string;
  archiveFile: string;
  capturedAt: string;
  status: CaptureReceiptStatus;
  importStartedAt?: string;
  importCompletedAt?: string;
  lastError?: string;
  result?: ImportResult;
};

export type CaptureAttempt = {
  categoryId: TcgplayerCategoryId;
  checkpointAt: string;
  outcome: "CAPTURED" | "ALREADY_CAPTURED" | "FAILED";
  receiptPath?: string;
  error?: string;
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

function atomicWriteReceipt(receiptPath: string, receipt: CaptureReceipt): void {
  const temporary = `${receiptPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(receipt, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    renameSync(temporary, receiptPath);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
}

function isTcgplayerCategoryId(value: unknown): value is TcgplayerCategoryId {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(tcgplayerCatalogSources, value)
  );
}

function readCaptureReceipt(
  archiveRoot: string,
  receiptPath: string,
): CaptureReceipt {
  const file = lstatSync(receiptPath);
  if (!file.isFile() || file.isSymbolicLink()) {
    throw new Error("Pricing catalogue capture receipt is not a regular file.");
  }
  const receipt = JSON.parse(readFileSync(receiptPath, "utf8")) as Partial<CaptureReceipt>;
  if (
    receipt.version !== "pricing-catalogue-capture-v1" ||
    !isTcgplayerCategoryId(receipt.categoryId) ||
    typeof receipt.checkpointAt !== "string" ||
    !Number.isFinite(Date.parse(receipt.checkpointAt)) ||
    typeof receipt.sourceHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(receipt.sourceHash) ||
    typeof receipt.archiveFile !== "string" ||
    !receipt.archiveFile ||
    typeof receipt.capturedAt !== "string" ||
    !Number.isFinite(Date.parse(receipt.capturedAt)) ||
    !["CAPTURED", "IMPORTING", "IMPORTED", "FAILED"].includes(
      String(receipt.status),
    )
  ) {
    throw new Error("Pricing catalogue capture receipt is invalid.");
  }
  const archivePath = resolve(archiveRoot, receipt.archiveFile);
  if (!isInside(archiveRoot, archivePath)) {
    throw new Error("Pricing catalogue capture receipt escapes its archive root.");
  }
  return receipt as CaptureReceipt;
}

function receiptDirectory(archiveRoot: string): string {
  const directory = join(archiveRoot, ".capture-receipts");
  mkdirSync(directory, { recursive: true });
  if (lstatSync(directory).isSymbolicLink()) {
    throw new Error("Pricing catalogue receipt directory must not be a symlink.");
  }
  return directory;
}

function receiptPathFor(archiveRoot: string, archivePath: string): string {
  const checkpoint = basename(dirname(archivePath));
  return join(
    receiptDirectory(archiveRoot),
    `${checkpoint}-${basename(archivePath, ".csv")}.receipt.json`,
  );
}

function captureReceiptPaths(archiveRoot: string): string[] {
  if (!existsSync(archiveRoot)) return [];
  if (lstatSync(archiveRoot).isSymbolicLink()) {
    throw new Error("Pricing catalogue archive root must not be a symlink.");
  }
  const root = realpathSync(archiveRoot);
  const directory = join(root, ".capture-receipts");
  if (!existsSync(directory)) return [];
  if (lstatSync(directory).isSymbolicLink()) {
    throw new Error("Pricing catalogue receipt directory must not be a symlink.");
  }
  return readdirSync(directory, { withFileTypes: true })
    .filter(
      (file) =>
        file.isFile() &&
        !file.isSymbolicLink() &&
        file.name.endsWith(".receipt.json"),
    )
    .map((file) => join(directory, file.name))
    .sort();
}

function existingReceiptFor(
  archiveRoot: string,
  catalogue: CompletedCatalogue,
): { receiptPath: string; receipt: CaptureReceipt } | null {
  if (!existsSync(archiveRoot)) return null;
  const root = realpathSync(archiveRoot);
  const source = tcgplayerCatalogSources[catalogue.categoryId];
  const prefix = `${checkpointSlug(catalogue.checkpointAt)}-catalog_${source.game}-`;
  const matches = captureReceiptPaths(root).filter((receiptPath) =>
    basename(receiptPath).startsWith(prefix),
  );
  if (matches.length > 1) {
    throw new Error(
      `Multiple capture receipts exist for ${source.game} at one checkpoint.`,
    );
  }
  if (!matches[0]) return null;
  return {
    receiptPath: matches[0],
    receipt: readCaptureReceipt(root, matches[0]),
  };
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
  options?: { includeMissingCompleted?: boolean },
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
      if (options?.includeMissingCompleted) {
        completed.push({
          categoryId,
          checkpointAt: new Date(step.at * 1000).toISOString(),
          filePath,
        });
        continue;
      }
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

export function captureCompletedCatalogues(input: {
  archiveRoot: string;
  toolRoot: string;
}): CaptureAttempt[] {
  const attempts: CaptureAttempt[] = [];
  const catalogues = readCompletedCatalogues(input.toolRoot, {
    includeMissingCompleted: true,
  });
  for (const catalogue of catalogues) {
    try {
      const existing = existingReceiptFor(input.archiveRoot, catalogue);
      if (existing) {
        const root = realpathSync(input.archiveRoot);
        const archivePath = resolve(root, existing.receipt.archiveFile);
        if (!existsSync(archivePath)) {
          throw new Error("Captured pricing catalogue archive is missing.");
        }
        attempts.push({
          categoryId: catalogue.categoryId,
          checkpointAt: catalogue.checkpointAt,
          outcome: "ALREADY_CAPTURED",
          receiptPath: existing.receiptPath,
        });
        continue;
      }
      const sourceHash = hashFile(catalogue.filePath);
      const archivePath = archiveCompletedCatalogue({
        archiveRoot: input.archiveRoot,
        catalogue,
        sourceHash,
      });
      const root = realpathSync(input.archiveRoot);
      const receiptPath = receiptPathFor(root, archivePath);
      if (existsSync(receiptPath)) {
        const receipt = readCaptureReceipt(root, receiptPath);
        if (
          receipt.categoryId !== catalogue.categoryId ||
          receipt.checkpointAt !== catalogue.checkpointAt ||
          receipt.sourceHash !== sourceHash ||
          resolve(root, receipt.archiveFile) !== archivePath
        ) {
          throw new Error(
            "Existing pricing catalogue capture receipt does not match the completed source.",
          );
        }
        attempts.push({
          categoryId: catalogue.categoryId,
          checkpointAt: catalogue.checkpointAt,
          outcome: "ALREADY_CAPTURED",
          receiptPath,
        });
        continue;
      }
      atomicWriteReceipt(receiptPath, {
        version: "pricing-catalogue-capture-v1",
        categoryId: catalogue.categoryId,
        checkpointAt: catalogue.checkpointAt,
        sourceHash,
        archiveFile: relative(root, archivePath),
        capturedAt: new Date().toISOString(),
        status: "CAPTURED",
      });
      attempts.push({
        categoryId: catalogue.categoryId,
        checkpointAt: catalogue.checkpointAt,
        outcome: "CAPTURED",
        receiptPath,
      });
    } catch (error) {
      attempts.push({
        categoryId: catalogue.categoryId,
        checkpointAt: catalogue.checkpointAt,
        outcome: "FAILED",
        error: safeError(error),
      });
    }
  }
  return attempts;
}

export function pendingCapturedCatalogueCount(archiveRoot: string): number {
  if (!existsSync(archiveRoot)) return 0;
  if (lstatSync(archiveRoot).isSymbolicLink()) {
    throw new Error("Pricing catalogue archive root must not be a symlink.");
  }
  const root = realpathSync(archiveRoot);
  return captureReceiptPaths(archiveRoot)
    .map((receiptPath) => readCaptureReceipt(root, receiptPath))
    .filter(
      (receipt) =>
        receipt.status === "CAPTURED" || receipt.status === "IMPORTING",
    ).length;
}

export function drainCapturedCatalogues(input: {
  archiveRoot: string;
  databasePath: string;
  onVerifiedCheckpoint?: (checkpoint: VerifiedCheckpoint) => void;
}): SyncAttempt[] {
  if (!existsSync(input.archiveRoot)) return [];
  if (lstatSync(input.archiveRoot).isSymbolicLink()) {
    throw new Error("Pricing catalogue archive root must not be a symlink.");
  }
  const root = realpathSync(input.archiveRoot);
  const pending = captureReceiptPaths(input.archiveRoot)
    .map((receiptPath) => ({
      receiptPath,
      receipt: readCaptureReceipt(root, receiptPath),
    }))
    .filter(
      ({ receipt }) =>
        receipt.status === "CAPTURED" || receipt.status === "IMPORTING",
    )
    .sort(
      (left, right) =>
        left.receipt.checkpointAt.localeCompare(right.receipt.checkpointAt) ||
        left.receipt.categoryId.localeCompare(right.receipt.categoryId),
    );
  if (!pending.length) return [];

  const repository = new PricingRepository(input.databasePath);
  const attempts: SyncAttempt[] = [];
  try {
    for (const entry of pending) {
      const { receiptPath } = entry;
      const receipt = readCaptureReceipt(root, receiptPath);
      const startedAt = new Date().toISOString();
      const archivePath = resolve(root, receipt.archiveFile);
      atomicWriteReceipt(receiptPath, {
        ...receipt,
        status: "IMPORTING",
        importStartedAt: startedAt,
        lastError: undefined,
      });
      try {
        if (!existsSync(archivePath)) {
          throw new Error("Captured pricing catalogue archive is missing.");
        }
        const archive = lstatSync(archivePath);
        if (!archive.isFile() || archive.isSymbolicLink() || archive.size <= 256) {
          throw new Error(
            "Captured pricing catalogue archive is not a stable regular file.",
          );
        }
        if (hashFile(archivePath) !== receipt.sourceHash) {
          throw new Error(
            "Captured pricing catalogue archive hash does not match its receipt.",
          );
        }
        const metadata = {
          categoryId: receipt.categoryId,
          sourceHash: receipt.sourceHash,
          contractVersion: TCGPLAYER_CATALOG_CONTRACT_VERSION,
          sourceSchemaVersion: TCGPLAYER_CATALOG_SCHEMA_VERSION,
          checkpointAt: receipt.checkpointAt,
        };
        if (repository.hasImport(metadata)) {
          const result: ImportResult = {
            status: "ALREADY_IMPORTED",
            sourceHash: receipt.sourceHash,
            rowsRead: 0,
            productsUpserted: 0,
            snapshotsInserted: 0,
          };
          atomicWriteReceipt(receiptPath, {
            ...receipt,
            status: "IMPORTED",
            importStartedAt: startedAt,
            importCompletedAt: new Date().toISOString(),
            result,
            lastError: undefined,
          });
          attempts.push({
            categoryId: receipt.categoryId,
            outcome: "ALREADY_IMPORTED",
            result,
          });
          continue;
        }
        repository.recordSyncState({
          categoryId: receipt.categoryId,
          status: "IMPORTING",
          checkpointAt: receipt.checkpointAt,
          startedAt,
          sourceHash: receipt.sourceHash,
          sourcePath: archivePath,
        });
        const result = repository.importNormalizedRows(
          readTcgplayerCatalog(
            archivePath,
            receipt.categoryId,
            receipt.checkpointAt,
          ),
          metadata,
        );
        const completedAt = new Date().toISOString();
        repository.recordSyncState({
          categoryId: receipt.categoryId,
          status: "CURRENT",
          checkpointAt: receipt.checkpointAt,
          startedAt,
          completedAt,
          sourceHash: receipt.sourceHash,
          sourcePath: archivePath,
          result,
        });
        let watchlistRefreshError: string | undefined;
        try {
          input.onVerifiedCheckpoint?.({
            categoryId: receipt.categoryId,
            checkpointAt: receipt.checkpointAt,
            pricingRepository: repository,
          });
        } catch (error) {
          watchlistRefreshError = safeError(error);
        }
        atomicWriteReceipt(receiptPath, {
          ...receipt,
          status: "IMPORTED",
          importStartedAt: startedAt,
          importCompletedAt: completedAt,
          result,
          lastError: undefined,
        });
        attempts.push({
          categoryId: receipt.categoryId,
          outcome: result.status,
          result,
          watchlistRefreshError,
        });
      } catch (error) {
        const message = safeError(error);
        const completedAt = new Date().toISOString();
        repository.recordSyncState({
          categoryId: receipt.categoryId,
          status: "FAILED",
          checkpointAt: receipt.checkpointAt,
          startedAt,
          completedAt,
          sourceHash: receipt.sourceHash,
          sourcePath: archivePath,
          lastError: message,
        });
        atomicWriteReceipt(receiptPath, {
          ...receipt,
          status: "FAILED",
          importStartedAt: startedAt,
          importCompletedAt: completedAt,
          lastError: message,
        });
        attempts.push({
          categoryId: receipt.categoryId,
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
            durableSourcePath,
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
