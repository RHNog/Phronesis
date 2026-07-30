import { createHash } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  closeSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  LIGAMAGIC_CSV_CONTRACT_VERSION,
  readLigaMagicCsv,
  type LigaMagicRow,
} from "./Csv.ts";

export type SanitizedNetworkEvent = {
  phase: "request" | "response";
  method: string;
  origin: string;
  pathname: string;
  queryKeys: string[];
  resourceType: string;
  status?: number;
  contentType?: string | null;
  contentDisposition?: string | null;
};

export type LigaMagicSourceReceipt = {
  collectionLabel: string;
  advertisedCards: number;
  actualRows: number;
  actualQuantity: number;
  exportedAt: string;
  filePath: string;
  bytes: number;
  sha256: string;
  suggestedFilename: string;
  networkEvents: SanitizedNetworkEvent[];
};

export type LigaMagicSnapshotManifest = {
  featureId: "PHR-API-005";
  contractVersion: string;
  runId: string;
  status: "DRY_RUN_COMPLETE" | "DRY_RUN_REVIEW_REQUIRED";
  startedAt: string;
  completedAt: string;
  checkpointWindowMilliseconds: number;
  collectionCount: number;
  advertisedCards: number;
  rawRows: number;
  rawQuantity: number;
  uniqueIdentities: number;
  identicalDuplicates: number;
  conflictingDuplicates: number;
  priceCoverage: Record<string, number>;
  sources: Array<{
    collectionLabel: string;
    advertisedCards: number;
    actualRows: number;
    actualQuantity: number;
    exportedAt: string;
    file: string;
    bytes: number;
    sha256: string;
    suggestedFilename: string;
  }>;
  databaseFile: string;
};

export function sha256File(filePath: string): string {
  const descriptor = openSync(filePath, "r");
  const hash = createHash("sha256");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    while ((bytesRead = readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
      hash.update(buffer.subarray(0, bytesRead));
    }
  } finally {
    closeSync(descriptor);
  }
  return hash.digest("hex");
}

function priceFingerprint(row: LigaMagicRow): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        row.consumerLowCentavos,
        row.consumerAverageCentavos,
        row.consumerHighCentavos,
        row.storeBuyLowCentavos,
        row.storeBuyAverageCentavos,
        row.storeBuyHighCentavos,
      ]),
    )
    .digest("hex");
}

function assertIso(value: string, label: string): number {
  const milliseconds = new Date(value).getTime();
  if (Number.isNaN(milliseconds)) throw new Error(`${label} must be an ISO timestamp.`);
  return milliseconds;
}

export function buildLigaMagicSnapshot(input: {
  runId: string;
  outputDirectory: string;
  startedAt: string;
  completedAt: string;
  sources: readonly LigaMagicSourceReceipt[];
}): LigaMagicSnapshotManifest {
  if (!/^[a-zA-Z0-9._-]+$/.test(input.runId)) {
    throw new Error("LigaMagic run ID contains unsafe characters.");
  }
  const started = assertIso(input.startedAt, "LigaMagic run start");
  const completed = assertIso(input.completedAt, "LigaMagic run completion");
  if (completed < started) throw new Error("LigaMagic run completion precedes its start.");
  if (input.sources.length === 0) throw new Error("LigaMagic snapshot requires at least one source.");

  mkdirSync(input.outputDirectory, { recursive: true, mode: 0o700 });
  if (lstatSync(input.outputDirectory).isSymbolicLink()) {
    throw new Error("LigaMagic output directory must not be a symlink.");
  }
  chmodSync(input.outputDirectory, 0o700);
  const outputRoot = realpathSync(input.outputDirectory);
  const destination = join(outputRoot, "ligamagic-dry-run.sqlite");
  const temporary = join(outputRoot, `.ligamagic-dry-run.${process.pid}.${Date.now()}.tmp`);
  if (existsSync(destination)) throw new Error("LigaMagic dry-run database already exists for this run.");

  const database = new DatabaseSync(temporary);
  let rawRows = 0;
  let rawQuantity = 0;
  let uniqueIdentities = 0;
  let identicalDuplicates = 0;
  let conflictingDuplicates = 0;
  const coverage = {
    consumerLow: 0,
    consumerAverage: 0,
    consumerHigh: 0,
    storeBuyLow: 0,
    storeBuyAverage: 0,
    storeBuyHigh: 0,
  };
  try {
    database.exec(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = DELETE;
      CREATE TABLE ligamagic_snapshot_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE ligamagic_source (
        id INTEGER PRIMARY KEY,
        collection_label TEXT NOT NULL UNIQUE,
        advertised_cards INTEGER NOT NULL,
        actual_rows INTEGER NOT NULL,
        actual_quantity INTEGER NOT NULL,
        exported_at TEXT NOT NULL,
        file_name TEXT NOT NULL,
        bytes INTEGER NOT NULL,
        sha256 TEXT NOT NULL
      );
      CREATE TABLE ligamagic_price (
        identity_key TEXT PRIMARY KEY,
        edition_ptbr TEXT NOT NULL,
        edition_en TEXT NOT NULL,
        edition_code TEXT NOT NULL,
        card_pt TEXT NOT NULL,
        card_en TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        condition TEXT NOT NULL,
        language TEXT NOT NULL,
        rarity TEXT NOT NULL,
        color TEXT NOT NULL,
        extras TEXT NOT NULL,
        collector_number TEXT NOT NULL,
        comment TEXT NOT NULL,
        consumer_low_centavos INTEGER NOT NULL,
        consumer_average_centavos INTEGER NOT NULL,
        consumer_high_centavos INTEGER NOT NULL,
        store_buy_low_centavos INTEGER NOT NULL,
        store_buy_average_centavos INTEGER NOT NULL,
        store_buy_high_centavos INTEGER NOT NULL,
        price_fingerprint TEXT NOT NULL,
        first_source_id INTEGER NOT NULL REFERENCES ligamagic_source(id),
        source_row_hash TEXT NOT NULL
      );
      CREATE TABLE ligamagic_source_membership (
        source_id INTEGER NOT NULL REFERENCES ligamagic_source(id),
        identity_key TEXT NOT NULL,
        source_row_hash TEXT NOT NULL,
        duplicate_kind TEXT NOT NULL CHECK(duplicate_kind IN ('UNIQUE','IDENTICAL','CONFLICT')),
        PRIMARY KEY(source_id, identity_key)
      );
      CREATE TABLE ligamagic_conflict (
        source_id INTEGER NOT NULL REFERENCES ligamagic_source(id),
        identity_key TEXT NOT NULL,
        existing_price_fingerprint TEXT NOT NULL,
        incoming_price_fingerprint TEXT NOT NULL,
        PRIMARY KEY(source_id, identity_key)
      );
      CREATE INDEX ligamagic_price_lookup ON ligamagic_price(card_en, edition_code, collector_number);
    `);
    const insertSource = database.prepare(`
      INSERT INTO ligamagic_source(collection_label, advertised_cards, actual_rows, actual_quantity, exported_at, file_name, bytes, sha256)
      VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertPrice = database.prepare(`
      INSERT INTO ligamagic_price(
        identity_key, edition_ptbr, edition_en, edition_code, card_pt, card_en,
        quantity, condition, language, rarity, color, extras, collector_number,
        comment, consumer_low_centavos, consumer_average_centavos,
        consumer_high_centavos, store_buy_low_centavos, store_buy_average_centavos,
        store_buy_high_centavos, price_fingerprint, first_source_id, source_row_hash
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(identity_key) DO NOTHING
    `);
    const findPrice = database.prepare(
      "SELECT price_fingerprint FROM ligamagic_price WHERE identity_key = ?",
    );
    const insertMembership = database.prepare(`
      INSERT INTO ligamagic_source_membership(source_id, identity_key, source_row_hash, duplicate_kind)
      VALUES(?, ?, ?, ?)
    `);
    const insertConflict = database.prepare(`
      INSERT INTO ligamagic_conflict(source_id, identity_key, existing_price_fingerprint, incoming_price_fingerprint)
      VALUES(?, ?, ?, ?)
    `);
    database.exec("BEGIN IMMEDIATE");
    try {
      for (const source of input.sources) {
        if (!existsSync(source.filePath) || lstatSync(source.filePath).isSymbolicLink()) {
          throw new Error(`LigaMagic source ${source.collectionLabel} is missing or unsafe.`);
        }
        const actualHash = sha256File(source.filePath);
        if (actualHash !== source.sha256) {
          throw new Error(`LigaMagic source ${source.collectionLabel} hash changed after acquisition.`);
        }
        const rows = readLigaMagicCsv(readFileSync(source.filePath));
        const quantity = rows.reduce((sum, row) => sum + row.quantity, 0);
        if (
          rows.length !== source.actualRows ||
          quantity !== source.actualQuantity ||
          quantity !== source.advertisedCards
        ) {
          throw new Error(
            `LigaMagic source ${source.collectionLabel} expected ${source.advertisedCards} cards across ${source.actualRows} rows but contains quantity ${quantity} across ${rows.length} rows.`,
          );
        }
        const sourceResult = insertSource.run(
          source.collectionLabel,
          source.advertisedCards,
          rows.length,
          quantity,
          source.exportedAt,
          basename(source.filePath),
          source.bytes,
          source.sha256,
        );
        const sourceId = Number(sourceResult.lastInsertRowid);
        rawRows += rows.length;
        rawQuantity += quantity;
        for (const row of rows) {
          const fingerprint = priceFingerprint(row);
          const inserted = insertPrice.run(
            row.identityKey,
            row.editionPtBr,
            row.editionEn,
            row.editionCode,
            row.cardPt,
            row.cardEn,
            row.quantity,
            row.condition,
            row.language,
            row.rarity,
            row.color,
            row.extras,
            row.collectorNumber,
            row.comment,
            row.consumerLowCentavos,
            row.consumerAverageCentavos,
            row.consumerHighCentavos,
            row.storeBuyLowCentavos,
            row.storeBuyAverageCentavos,
            row.storeBuyHighCentavos,
            fingerprint,
            sourceId,
            row.sourceRowHash,
          );
          let duplicateKind: "UNIQUE" | "IDENTICAL" | "CONFLICT" = "UNIQUE";
          if (Number(inserted.changes) === 1) {
            uniqueIdentities += 1;
            if (row.consumerLowCentavos > 0) coverage.consumerLow += 1;
            if (row.consumerAverageCentavos > 0) coverage.consumerAverage += 1;
            if (row.consumerHighCentavos > 0) coverage.consumerHigh += 1;
            if (row.storeBuyLowCentavos > 0) coverage.storeBuyLow += 1;
            if (row.storeBuyAverageCentavos > 0) coverage.storeBuyAverage += 1;
            if (row.storeBuyHighCentavos > 0) coverage.storeBuyHigh += 1;
          } else {
            const existing = findPrice.get(row.identityKey) as
              | { price_fingerprint: string }
              | undefined;
            if (!existing) throw new Error("LigaMagic duplicate lookup lost its canonical row.");
            if (existing.price_fingerprint === fingerprint) {
              duplicateKind = "IDENTICAL";
              identicalDuplicates += 1;
            } else {
              duplicateKind = "CONFLICT";
              conflictingDuplicates += 1;
              insertConflict.run(
                sourceId,
                row.identityKey,
                existing.price_fingerprint,
                fingerprint,
              );
            }
          }
          insertMembership.run(sourceId, row.identityKey, row.sourceRowHash, duplicateKind);
        }
      }
      const metadata = database.prepare(
        "INSERT INTO ligamagic_snapshot_metadata(key, value) VALUES(?, ?)",
      );
      metadata.run("feature_id", "PHR-API-005");
      metadata.run("contract_version", LIGAMAGIC_CSV_CONTRACT_VERSION);
      metadata.run("run_id", input.runId);
      metadata.run("started_at", input.startedAt);
      metadata.run("completed_at", input.completedAt);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
    database.exec("PRAGMA optimize;");
    database.close();
    chmodSync(temporary, 0o600);
    renameSync(temporary, destination);
  } catch (error) {
    try {
      database.close();
    } catch {
      // The database may already be closed after successful assembly.
    }
    rmSync(temporary, { force: true });
    throw error;
  }

  const manifest: LigaMagicSnapshotManifest = {
    featureId: "PHR-API-005",
    contractVersion: LIGAMAGIC_CSV_CONTRACT_VERSION,
    runId: input.runId,
    status:
      conflictingDuplicates === 0
        ? "DRY_RUN_COMPLETE"
        : "DRY_RUN_REVIEW_REQUIRED",
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    checkpointWindowMilliseconds: completed - started,
    collectionCount: input.sources.length,
    advertisedCards: input.sources.reduce((sum, source) => sum + source.advertisedCards, 0),
    rawRows,
    rawQuantity,
    uniqueIdentities,
    identicalDuplicates,
    conflictingDuplicates,
    priceCoverage: coverage,
    sources: input.sources.map((source) => ({
      collectionLabel: source.collectionLabel,
      advertisedCards: source.advertisedCards,
      actualRows: source.actualRows,
      actualQuantity: source.actualQuantity,
      exportedAt: source.exportedAt,
      file: basename(source.filePath),
      bytes: source.bytes,
      sha256: source.sha256,
      suggestedFilename: source.suggestedFilename,
    })),
    databaseFile: basename(destination),
  };
  const manifestPath = join(outputRoot, "manifest.json");
  const temporaryManifest = `${manifestPath}.${process.pid}.tmp`;
  writeFileSync(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporaryManifest, manifestPath);
  return manifest;
}
