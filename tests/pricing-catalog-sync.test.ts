import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { PricingRepository } from "../lib/pricing/repository";
import {
  readTcgplayerCatalog,
  TCGPLAYER_CATALOG_HEADERS,
  tcgplayerCatalogSources,
} from "../lib/pricing/tcgplayerCatalog";
import {
  readCompletedCatalogues,
  syncCompletedCatalogues,
} from "../lib/pricing/tcgplayerObserver";

function csvRow(
  values: Partial<Record<(typeof TCGPLAYER_CATALOG_HEADERS)[number], string>>,
): string {
  return TCGPLAYER_CATALOG_HEADERS.map((header) => values[header] ?? "").join(
    ",",
  );
}

function magicCsv(): string {
  return [
    TCGPLAYER_CATALOG_HEADERS.join(","),
    csvRow({
      "TCGplayer Id": "1001",
      "Product Line": "Magic",
      "Set Name": "Test Set",
      "Product Name": "Test Card",
      Number: "42",
      Condition: "Near Mint",
      "TCG Market Price": "12.3456",
      "TCG Direct Low": "15.5000",
      "TCG Low Price With Shipping": "11.2500",
      "TCG Low Price": "10.0000",
    }),
    csvRow({
      "TCGplayer Id": "1002",
      "Product Line": "Magic",
      "Set Name": "Test Set",
      "Product Name": "Test Card",
      Number: "42",
      Condition: "Lightly Played",
      "TCG Market Price": "10.00",
      "TCG Low Price With Shipping": "9.50",
      "TCG Low Price": "9.00",
    }),
    csvRow({
      "TCGplayer Id": "1003",
      "Product Line": "Magic",
      "Set Name": "Test Set",
      "Product Name": "Test Card",
      Number: "42",
      Condition: "Near Mint Foil - Portuguese",
      "TCG Market Price": "20.00",
      "TCG Low Price With Shipping": "19.00",
      "TCG Low Price": "18.00",
    }),
    csvRow({
      "TCGplayer Id": "2001",
      "Product Line": "Magic",
      "Set Name": "Test Set",
      "Product Name": "Test Booster Box",
      Condition: "Unopened",
      "TCG Market Price": "100.00",
      "TCG Low Price With Shipping": "99.00",
      "TCG Low Price": "90.00",
    }),
  ].join("\r\n");
}

function compositeMagicCsv(): string {
  return [
    magicCsv(),
    csvRow({
      "TCGplayer Id": "3001",
      "Product Line": "Pokemon",
      "Set Name": "Other Game",
      "Product Name": "Not A Magic Card",
      Number: "1",
      Condition: "Near Mint",
      "TCG Market Price": "1.00",
    }),
  ].join("\r\n");
}

function fixtureRoot(): { root: string; run: string; database: string } {
  const root = mkdtempSync(join(tmpdir(), "phronesis-pricing-tool-"));
  const run = join(root, "data", "20260729_180000");
  mkdirSync(join(root, "state"), { recursive: true });
  mkdirSync(run, { recursive: true });
  return { root, run, database: join(root, "phronesis.sqlite") };
}

test("TCGplayer catalogue adapter groups condition SKUs and preserves finish and language", () => {
  assert.equal(tcgplayerCatalogSources["lorcana-en"].game, "lorcana");
  assert.equal(tcgplayerCatalogSources["riftbound-en"].game, "riftbound");
  const fixture = fixtureRoot();
  try {
    const catalog = join(fixture.run, "catalog_magic.csv");
    writeFileSync(catalog, magicCsv());
    const rows = [
      ...readTcgplayerCatalog(catalog, "magic-en", "2026-07-29T18:00:00.000Z"),
    ];
    assert.equal(rows.length, 4);
    assert.equal(rows[0].marketPriceCents, 1_235);
    assert.equal(rows[0].directLowCents, 1_550);
    assert.equal(rows[0].shippingCents, 125);
    assert.equal(rows[0].sku, rows[1].sku);
    assert.notEqual(rows[0].sourceSku, rows[1].sourceSku);
    assert.notEqual(rows[0].sku, rows[2].sku);
    assert.equal(rows[2].variant, "Foil");
    assert.equal(rows[2].language, "Portuguese");
    assert.equal(rows[3].productType, "SEALED");
    assert.equal(rows[3].condition, null);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("composite catalogue filters configured sibling games and rejects unknown product lines", () => {
  const fixture = fixtureRoot();
  try {
    const catalog = join(fixture.run, "catalog_magic.csv");
    writeFileSync(catalog, compositeMagicCsv());
    assert.equal(
      [...readTcgplayerCatalog(catalog, "magic-en", "2026-07-29T18:00:00.000Z")]
        .length,
      4,
    );
    writeFileSync(
      catalog,
      compositeMagicCsv().replace(
        "Pokemon,Other Game",
        "Unknown Game,Other Game",
      ),
    );
    assert.throws(
      () => [
        ...readTcgplayerCatalog(
          catalog,
          "magic-en",
          "2026-07-29T18:00:00.000Z",
        ),
      ],
      /expected a configured product line/,
    );
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("observer imports only completed catalogues and repeated checkpoints are idempotent", () => {
  const fixture = fixtureRoot();
  try {
    const catalog = join(fixture.run, "catalog_magic.csv");
    writeFileSync(catalog, magicCsv());
    writeFileSync(
      join(fixture.root, "state", "run_state.json"),
      JSON.stringify({
        run_dir: fixture.run,
        steps: { "export_catalog::magic": { done: true, at: 1_775_000_000 } },
      }),
    );
    const completed = readCompletedCatalogues(fixture.root);
    assert.equal(completed.length, 1);
    assert.equal(completed[0].categoryId, "magic-en");

    const archiveRoot = join(fixture.root, "archive");
    let verifiedCheckpoints = 0;
    const onVerifiedCheckpoint = () => {
      verifiedCheckpoints += 1;
    };
    const first = syncCompletedCatalogues({
      archiveRoot,
      databasePath: fixture.database,
      onVerifiedCheckpoint,
      toolRoot: fixture.root,
    });
    assert.equal(first[0].outcome, "IMPORTED");
    assert.equal(verifiedCheckpoints, 1);
    assert.equal(first[0].result?.productsUpserted, 3);
    const archivedDirectories = readdirSync(archiveRoot);
    assert.equal(archivedDirectories.length, 1);
    const archivedFiles = readdirSync(
      join(archiveRoot, archivedDirectories[0]),
    );
    assert.match(archivedFiles[0], /^catalog_magic-[a-f0-9]{16}\.csv$/);
    assert.equal(
      readFileSync(
        join(archiveRoot, archivedDirectories[0], archivedFiles[0]),
        "utf8",
      ),
      magicCsv(),
    );
    const repeated = syncCompletedCatalogues({
      archiveRoot,
      databasePath: fixture.database,
      onVerifiedCheckpoint,
      toolRoot: fixture.root,
    });
    assert.equal(repeated[0].outcome, "ALREADY_IMPORTED");
    assert.equal(verifiedCheckpoints, 1);

    const repository = new PricingRepository(fixture.database);
    const result = repository.search(
      "magic-en",
      "Test Card 42",
      new Date("2026-07-29T19:00:00.000Z"),
    );
    assert.equal(result.singles.length, 2);
    const normal = result.singles.find((match) => match.variant === "Normal");
    assert.ok(normal);
    assert.equal(normal.prices.NEAR_MINT?.sourceSku, "1001");
    assert.equal(normal.prices.LIGHTLY_PLAYED?.sourceSku, "1002");
    assert.equal(normal.prices.NEAR_MINT?.deliveredPriceCents, 1_125);
    assert.equal(normal.prices.NEAR_MINT?.directLowCents, 1_550);
    assert.equal(result.category.syncStatus, "CURRENT");
    const unified = repository.searchAll(
      "Test Card 42",
      new Date("2026-07-29T19:00:00.000Z"),
    );
    assert.equal(unified.categories.length, 5);
    assert.equal(
      unified.categories.filter((category) => category.loaded).length,
      1,
    );
    assert.equal(unified.singles.length, 2);
    assert.ok(
      unified.singles.every((match) => match.categoryId === "magic-en"),
    );
    repository.close();
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("unchanged catalogues at a new checkpoint refresh currency without duplicating history", () => {
  const fixture = fixtureRoot();
  try {
    const catalog = join(fixture.run, "catalog_magic.csv");
    const statePath = join(fixture.root, "state", "run_state.json");
    writeFileSync(catalog, magicCsv());
    writeFileSync(
      statePath,
      JSON.stringify({
        run_dir: fixture.run,
        steps: { "export_catalog::magic": { done: true, at: 1_775_000_000 } },
      }),
    );
    assert.equal(
      syncCompletedCatalogues({
        databasePath: fixture.database,
        toolRoot: fixture.root,
      })[0].outcome,
      "IMPORTED",
    );

    writeFileSync(
      statePath,
      JSON.stringify({
        run_dir: fixture.run,
        steps: { "export_catalog::magic": { done: true, at: 1_775_021_600 } },
      }),
    );
    const refreshed = syncCompletedCatalogues({
      databasePath: fixture.database,
      toolRoot: fixture.root,
    });
    assert.equal(refreshed[0].outcome, "IMPORTED");
    assert.equal(refreshed[0].result?.snapshotsInserted, 0);

    const repository = new PricingRepository(fixture.database);
    const result = repository.search(
      "magic-en",
      "Test Card",
      new Date("2026-07-29T23:00:00.000Z"),
    );
    assert.equal(
      result.category.checkpointAt,
      new Date(1_775_021_600_000).toISOString(),
    );
    assert.equal(
      result.category.snapshotDate,
      new Date(1_775_021_600_000).toISOString(),
    );
    assert.equal(result.category.syncStatus, "CURRENT");
    const historyCount = repository.database
      .prepare("SELECT count(*) AS count FROM pricing_history")
      .get() as { count: number };
    assert.equal(historyCount.count, 4);
    repository.close();
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("incomplete state and schema drift cannot replace last-good data", () => {
  const fixture = fixtureRoot();
  try {
    const catalog = join(fixture.run, "catalog_magic.csv");
    writeFileSync(catalog, magicCsv());
    const statePath = join(fixture.root, "state", "run_state.json");
    writeFileSync(statePath, "{");
    assert.deepEqual(readCompletedCatalogues(fixture.root), []);

    writeFileSync(
      statePath,
      JSON.stringify({
        run_dir: fixture.run,
        steps: { "export_catalog::magic": { done: true, at: 1_775_000_000 } },
      }),
    );
    syncCompletedCatalogues({
      databasePath: fixture.database,
      toolRoot: fixture.root,
    });
    writeFileSync(
      catalog,
      readFileSync(catalog, "utf8").replace("TCG Market Price", "Market Price"),
    );
    const failed = syncCompletedCatalogues({
      databasePath: fixture.database,
      toolRoot: fixture.root,
    });
    assert.equal(failed[0].outcome, "FAILED");

    const repository = new PricingRepository(fixture.database);
    assert.equal(repository.search("magic-en", "Test Card").singles.length, 2);
    assert.equal(repository.getSyncStates()[0].status, "FAILED");
    repository.close();
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});
