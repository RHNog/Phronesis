import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  ligaPokemonEnglishSetScope,
  ligaPokemonExactVariant,
  pokemonCardNameIdentity,
  pokemonCollectorIdentity,
  pokemonCrossMarketIdentityKey,
  pokemonSetIdentity,
} from "../lib/pricing/pokemonIdentity.ts";
import { PokemonRegionalReconciliationRepository } from "../lib/regional/PokemonRegionalReconciliationRepository.ts";

test("Pokémon regional identity remains exact across bounded catalogue conventions", () => {
  assert.equal(
    pokemonSetIdentity("SWSH03: Darkness Ablaze"),
    "darkness ablaze",
  );
  assert.equal(pokemonSetIdentity("SV: Scarlet & Violet 151"), "151");
  assert.equal(
    pokemonSetIdentity("SV01: Scarlet & Violet Base Set"),
    pokemonSetIdentity("Scarlet & Violet"),
  );
  assert.equal(
    pokemonSetIdentity("SWSH: Crown Zenith: Galarian Gallery"),
    pokemonSetIdentity("Galarian Gallery"),
  );
  assert.equal(
    pokemonSetIdentity("Shining Fates: Shiny Vault"),
    pokemonSetIdentity("Shining Fates: Shiny"),
  );
  assert.equal(pokemonSetIdentity("XY Base Set"), pokemonSetIdentity("XY"));
  assert.notEqual(
    pokemonSetIdentity("Base Set"),
    pokemonSetIdentity("Base Set 2"),
  );
  assert.equal(pokemonCollectorIdentity("025/185"), "25");
  assert.equal(pokemonCollectorIdentity("TG01/TG30"), "TG1");
  assert.equal(pokemonCollectorIdentity("SWSH001"), "SWSH1");
  assert.equal(
    pokemonCardNameIdentity({
      name: "Ortega - 219/197",
      collectorNumber: "219/197",
    }),
    "ortega",
  );
  assert.equal(
    pokemonCardNameIdentity({
      name: "Ortega - 218/197",
      collectorNumber: "219/197",
    }),
    "ortega 218 197",
  );
  assert.equal(ligaPokemonExactVariant(""), "Normal");
  assert.equal(ligaPokemonExactVariant("Foil"), "Holofoil");
  assert.equal(ligaPokemonExactVariant("Reverse Foil"), "Reverse Holofoil");
  assert.equal(ligaPokemonExactVariant("Master Ball"), null);
  assert.equal(ligaPokemonExactVariant("Pokeball Foil"), null);
  assert.equal(ligaPokemonEnglishSetScope("Pokemon GO"), true);
  assert.equal(ligaPokemonEnglishSetScope("Pokemon GO (JP)"), false);
  assert.equal(ligaPokemonEnglishSetScope("Eevee Heroes (Coreano)"), false);
  assert.equal(
    ligaPokemonEnglishSetScope("McDonald's Collection 2018 (French)"),
    false,
  );
  assert.equal(
    ligaPokemonEnglishSetScope("McDonald's Collection 2018 (English)"),
    true,
  );
  assert.equal(
    pokemonCrossMarketIdentityKey({
      name: "Charizard V",
      setName: "Darkness Ablaze",
      collectorNumber: "019",
      variant: "Holofoil",
    }),
    pokemonCrossMarketIdentityKey({
      name: "Charizard V - 019/189",
      setName: "SWSH03: Darkness Ablaze",
      collectorNumber: "019/189",
      variant: "Holofoil",
    }),
  );
});

test("Pokémon reconciliation is isolated, collision-safe, and idempotent", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-pokemon-crosswalk-"));
  const pricingPath = join(root, "pricing.sqlite");
  const sourcePath = join(root, "ligapokemon.sqlite");
  const manifestPath = join(root, "manifest.json");
  try {
    const pricing = new DatabaseSync(pricingPath);
    pricing.exec(`
      CREATE TABLE pricing_products(
        category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,
        collector_number TEXT,variant TEXT,language TEXT,
        PRIMARY KEY(category_id,sku)
      );
      CREATE TABLE pricing_latest(
        category_id TEXT,sku TEXT,condition_key TEXT,delivered_price_cents INTEGER,
        listing_price_cents INTEGER,market_price_cents INTEGER
      );
      CREATE TABLE pricing_category_state(
        category_id TEXT,snapshot_date TEXT,source_hash TEXT
      );
      CREATE TABLE regional_crosswalk(liga_identity_key TEXT PRIMARY KEY,status TEXT);
      INSERT INTO regional_crosswalk VALUES('magic-preserved','MATCHED');
      INSERT INTO pricing_category_state VALUES('pokemon-en','2026-08-04','catalogue-hash');
      INSERT INTO pricing_products VALUES
        ('pokemon-en','charizard','SINGLE','Charizard V - 019/189','SWSH03: Darkness Ablaze','019/189','Holofoil','English'),
        ('pokemon-en','pikachu','SINGLE','Pikachu','XY Base Set','042/146','Normal','English'),
        ('pokemon-en','mew-a','SINGLE','Mew','Celebrations','025/025','Holofoil','English'),
        ('pokemon-en','mew-b','SINGLE','Mew','Celebrations','025/025','Holofoil','English'),
        ('pokemon-en','pokemon-go','SINGLE','Bulbasaur','Pokemon GO','001/078','Normal','English'),
        ('magic-en','magic','SINGLE','Charizard V','Darkness Ablaze','019','Holofoil','English');
      INSERT INTO pricing_latest VALUES
        ('pokemon-en','charizard','NEAR_MINT',1200,1100,1150),
        ('pokemon-en','pikachu','NEAR_MINT',500,450,475);
    `);
    const source = new DatabaseSync(sourcePath);
    source.exec(`
      CREATE TABLE ligapokemon_price(
        identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,
        card_en TEXT,collector_number TEXT,extras TEXT,condition TEXT,language TEXT,
        consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,
        consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,
        store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER
      );
      INSERT INTO ligapokemon_price VALUES
        ('charizard','Darkness Ablaze','DAA','Charizard V','019','Foil','NM','EN',1000,NULL,NULL,NULL,NULL,NULL),
        ('pikachu-a','XY','XY','Pikachu','042','','NM','EN',400,NULL,NULL,NULL,NULL,NULL),
        ('pikachu-b','XY Base Set','XY','Pikachu','42','','NM','EN',410,NULL,NULL,NULL,NULL,NULL),
        ('mew','Celebrations','CEL','Mew','025','Foil','NM','EN',900,NULL,NULL,NULL,NULL,NULL),
        ('pattern','Prismatic Evolutions','PRE','Eevee','001','Master Ball','NM','EN',800,NULL,NULL,NULL,NULL,NULL),
        ('foreign','Pokémon Card 151','SV2A','Bulbasaur','001','','NM','EN',700,NULL,NULL,NULL,NULL,NULL),
        ('explicit-jp','Pokemon GO (JP)','PGOJP','Bulbasaur','001','','NM','EN',600,NULL,NULL,NULL,NULL,NULL);
    `);
    source.close();
    writeFileSync(
      manifestPath,
      JSON.stringify({
        runId: "pokemon-run",
        status: "DRY_RUN_COMPLETE",
        completedAt: "2026-08-04T12:00:00.000Z",
        contractVersion: "test-20-column",
        uniqueIdentities: 7,
        conflictingDuplicates: 0,
        databaseFile: "ligapokemon.sqlite",
      }),
    );
    const repository = new PokemonRegionalReconciliationRepository(pricing);
    const first = repository.buildCrosswalk(sourcePath, manifestPath);
    const second = repository.buildCrosswalk(sourcePath, manifestPath);
    const substitutedSourcePath = join(root, "substituted.sqlite");
    copyFileSync(sourcePath, substitutedSourcePath);
    assert.throws(
      () => repository.buildCrosswalk(substitutedSourcePath, manifestPath),
      /does not match the complete manifest receipt/,
    );
    assert.deepEqual(
      {
        total: first.total,
        matched: first.matched,
        unmatched: first.unmatched,
        ambiguous: first.ambiguous,
        unsupportedVariant: first.unsupportedVariant,
        unsupportedMarketScope: first.unsupportedMarketScope,
        targetCollisionQuarantined: first.targetCollisionQuarantined,
        comparableBoth: first.comparableBoth,
      },
      {
        total: 7,
        matched: 1,
        unmatched: 1,
        ambiguous: 3,
        unsupportedVariant: 1,
        unsupportedMarketScope: 1,
        targetCollisionQuarantined: 2,
        comparableBoth: 1,
      },
    );
    assert.equal(second.crosswalkFingerprint, first.crosswalkFingerprint);
    assert.equal(
      pricing
        .prepare(
          "SELECT status FROM regional_crosswalk WHERE liga_identity_key='magic-preserved'",
        )
        .get()?.status,
      "MATCHED",
    );
    assert.equal(
      pricing
        .prepare(
          "SELECT status FROM regional_pokemon_crosswalk WHERE liga_identity_key='pattern'",
        )
        .get()?.status,
      "UNSUPPORTED_VARIANT",
    );
    assert.equal(
      pricing
        .prepare("SELECT COUNT(*) count FROM regional_pokemon_evidence")
        .get()?.count,
      7,
    );
    writeFileSync(
      manifestPath,
      JSON.stringify({
        runId: "pokemon-run",
        status: "DRY_RUN_COMPLETE",
        completedAt: "2026-08-04T12:00:00.000Z",
        contractVersion: "test-20-column",
        uniqueIdentities: 8,
        conflictingDuplicates: 0,
        databaseFile: "ligapokemon.sqlite",
      }),
    );
    assert.throws(
      () => repository.buildCrosswalk(sourcePath, manifestPath),
      /row count does not match the complete manifest receipt/,
    );
    pricing.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("recurring and catalogue observers own Pokémon crosswalk continuity", () => {
  const acquisition = readFileSync(
    new URL("../scripts/sync-regional-marketplaces.ts", import.meta.url),
    "utf8",
  );
  const observer = readFileSync(
    new URL("../scripts/watch-pricing-catalogues.ts", import.meta.url),
    "utf8",
  );
  const importer = readFileSync(
    new URL("../scripts/import-pricing-catalogues.ts", import.meta.url),
    "utf8",
  );
  const packageJson = readFileSync(
    new URL("../package.json", import.meta.url),
    "utf8",
  );
  assert.match(acquisition, /build-pokemon-regional-crosswalk\.ts/);
  assert.match(observer, /captureCompletedCatalogues/);
  assert.match(importer, /rebuildPokemonRegionalCrosswalk/);
  assert.match(packageJson, /regional:pokemon-crosswalk/);
});
