import assert from "node:assert/strict";
import { lstatSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  LIGAMAGIC_CSV_HEADERS,
  decodeLigaMagicCsv,
  parseBrlCentavos,
  readLigaMagicCsv,
} from "../lib/providers/ligamagic/Csv.ts";
import {
  buildLigaMagicSnapshot,
  sha256File,
  type LigaMagicSourceReceipt,
} from "../lib/providers/ligamagic/Snapshot.ts";
import {
  LIGAPOKEMON_CSV_HEADERS,
  readLigaPokemonCsv,
} from "../lib/providers/ligapokemon/Csv.ts";
import { buildLigaPokemonSnapshot } from "../lib/providers/ligapokemon/Snapshot.ts";

function quote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function csv(input: {
  card?: string;
  consumerLow?: string;
  storeBuyLow?: string;
} = {}): string {
  const values = [
    "Edição Teste",
    "Test Edition",
    "tst",
    "Jötun de Teste",
    input.card ?? "Test Card",
    "1",
    "NM",
    "EN",
    "R",
    "U",
    "Foil",
    "42",
    "",
    input.consumerLow ?? "12.34",
    "13.00",
    "14.00",
    input.storeBuyLow ?? "7.00",
    "8.00",
    "9.00",
  ];
  return `${LIGAMAGIC_CSV_HEADERS.map(quote).join(",")}\r\n${values.map(quote).join(",")}\r\n`;
}

function hybridBytes(): Buffer {
  const source = Buffer.from(`\uFEFF${csv()}`, "utf8");
  const needle = Buffer.from("Jötun", "utf8");
  const index = source.indexOf(needle);
  assert.ok(index >= 0);
  return Buffer.concat([
    source.subarray(0, index),
    Buffer.from([0x4a, 0xf6, 0x74, 0x75, 0x6e]),
    source.subarray(index + needle.length),
  ]);
}

function pokemonCsv(input: { card?: string } = {}): string {
  const values = [
    "Edição Teste",
    "Test Edition",
    "tst",
    "Pikachu de Teste",
    input.card ?? "Test Pikachu",
    "1",
    "NM",
    "EN",
    "R",
    "Y",
    "Foil",
    "1",
    "",
    "102",
    "12.34",
    "13.00",
    "14.00",
    "7.00",
    "8.00",
    "9.00",
  ];
  return `${LIGAPOKEMON_CSV_HEADERS.map(quote).join(",")}\r\n${values.map(quote).join(",")}\r\n`;
}

function receipt(path: string, collectionLabel: string): LigaMagicSourceReceipt {
  return {
    collectionLabel,
    sourceAdvertisedCards: 1,
    advertisedCards: 1,
    quantityAuthority: "SOURCE_LABEL",
    actualRows: 1,
    actualQuantity: 1,
    exportedAt: "2026-07-30T20:00:00.000Z",
    filePath: path,
    bytes: lstatSync(path).size,
    sha256: sha256File(path),
    suggestedFilename: "export.csv",
    networkEvents: [],
  };
}

test("LigaMagic parser preserves valid UTF-8 and isolated Windows-1252 bytes", () => {
  const bytes = hybridBytes();
  assert.match(decodeLigaMagicCsv(bytes), /Jötun/);
  const rows = readLigaMagicCsv(bytes);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].editionPtBr, "Edição Teste");
  assert.equal(rows[0].cardPt, "Jötun de Teste");
  assert.equal(rows[0].consumerLowCentavos, 1_234);
  assert.equal(rows[0].storeBuyLowCentavos, 700);
});

test("LigaMagic price semantics normalize consumer and store-buy BRL values", () => {
  assert.equal(parseBrlCentavos("R$ 1.234,56", "consumer price"), 123_456);
  assert.equal(parseBrlCentavos("1234.56", "store buy"), 123_456);
  assert.equal(parseBrlCentavos("0.00", "missing evidence"), 0);
  assert.throws(() => parseBrlCentavos("12.3", "consumer price"), /two decimal/i);
});

test("LigaMagic parser rejects schema drift and advertised quantity mismatch", () => {
  const drifted = Buffer.from(csv().replace("Card (EN)", "Card English"));
  assert.throws(() => readLigaMagicCsv(drifted), /schema drift/i);

  const directory = mkdtempSync(join(tmpdir(), "phronesis-ligamagic-mismatch-"));
  try {
    const path = join(directory, "lote.csv");
    writeFileSync(path, csv());
    const source = { ...receipt(path, "Lote 1 (2 cards)"), advertisedCards: 2 };
    assert.throws(
      () =>
        buildLigaMagicSnapshot({
          runId: "mismatch",
          outputDirectory: join(directory, "out"),
          startedAt: "2026-07-30T20:00:00.000Z",
          completedAt: "2026-07-30T20:01:00.000Z",
          sources: [source],
        }),
      /expected 2 cards/i,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("LigaMagic snapshot retains provenance and classifies duplicate price evidence", () => {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-ligamagic-snapshot-"));
  try {
    const first = join(directory, "first.csv");
    const second = join(directory, "second.csv");
    writeFileSync(first, csv());
    writeFileSync(second, csv());
    const output = join(directory, "complete");
    const manifest = buildLigaMagicSnapshot({
      runId: "complete",
      outputDirectory: output,
      startedAt: "2026-07-30T20:00:00.000Z",
      completedAt: "2026-07-30T20:02:00.000Z",
      sources: [receipt(first, "Lote 1 (1 cards)"), receipt(second, "Lote 2 (1 cards)")],
    });
    assert.equal(manifest.status, "DRY_RUN_COMPLETE");
    assert.equal(manifest.rawRows, 2);
    assert.equal(manifest.uniqueIdentities, 1);
    assert.equal(manifest.identicalDuplicates, 1);
    assert.equal(manifest.conflictingDuplicates, 0);
    const database = new DatabaseSync(join(output, manifest.databaseFile));
    assert.equal(
      Number(
        (
          database.prepare("SELECT COUNT(*) AS count FROM ligamagic_source_membership").get() as {
            count: number;
          }
        ).count,
      ),
      2,
    );
    assert.deepEqual(
      {
        ...database
          .prepare(
            "SELECT source_advertised_cards, advertised_cards, quantity_authority FROM ligamagic_source ORDER BY id LIMIT 1",
          )
          .get(),
      },
      {
        source_advertised_cards: 1,
        advertised_cards: 1,
        quantity_authority: "SOURCE_LABEL",
      },
    );
    database.close();

    const conflicting = join(directory, "conflicting.csv");
    writeFileSync(conflicting, csv({ consumerLow: "99.00" }));
    const review = buildLigaMagicSnapshot({
      runId: "review",
      outputDirectory: join(directory, "review"),
      startedAt: "2026-07-30T20:00:00.000Z",
      completedAt: "2026-07-30T20:02:00.000Z",
      sources: [receipt(first, "Lote 1 (1 cards)"), receipt(conflicting, "Lote 3 (1 cards)")],
    });
    assert.equal(review.status, "DRY_RUN_REVIEW_REQUIRED");
    assert.equal(review.conflictingDuplicates, 1);
    assert.match(readFileSync(join(directory, "review", "manifest.json"), "utf8"), /DRY_RUN_REVIEW_REQUIRED/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("LigaPokemon uses an isolated fail-closed parser and snapshot namespace", () => {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-ligapokemon-snapshot-"));
  try {
    const sourcePath = join(directory, "pokemon.csv");
    writeFileSync(sourcePath, pokemonCsv({ card: "Pikachu" }));
    assert.equal(readLigaPokemonCsv(readFileSync(sourcePath)).length, 1);
    assert.throws(
      () =>
        readLigaPokemonCsv(
          Buffer.from(pokemonCsv().replace("Card (EN)", "Card English")),
        ),
      /LigaPokemon CSV schema drift/i,
    );
    const output = join(directory, "complete");
    const manifest = buildLigaPokemonSnapshot({
      runId: "pokemon-pilot",
      outputDirectory: output,
      startedAt: "2026-08-03T12:00:00.000Z",
      completedAt: "2026-08-03T12:01:00.000Z",
      sources: [receipt(sourcePath, "Pokemon Test (1 cards)")],
    });
    assert.equal(manifest.featureId, "PHR-API-013");
    assert.equal(manifest.databaseFile, "ligapokemon-dry-run.sqlite");
    const database = new DatabaseSync(join(output, manifest.databaseFile));
    assert.equal(
      Number(
        (
          database.prepare("SELECT COUNT(*) AS count FROM ligapokemon_price").get() as {
            count: number;
          }
        ).count,
      ),
      1,
    );
    assert.throws(() => database.prepare("SELECT * FROM ligamagic_price").all());
    database.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
