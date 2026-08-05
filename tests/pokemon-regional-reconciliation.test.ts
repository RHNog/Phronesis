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
  decodePokemonIdentityText,
  ligaPokemonEnglishSetScope,
  ligaPokemonExactVariant,
  pokemonCardNameIdentity,
  pokemonCollectorIdentity,
  pokemonCrossMarketIdentityKey,
  pokemonMaterialTreatmentIdentity,
  pokemonSetIdentity,
  pokemonSetLabelsStructurallyCompatible,
} from "../lib/pricing/pokemonIdentity.ts";
import { PokemonRegionalReconciliationRepository } from "../lib/regional/PokemonRegionalReconciliationRepository.ts";
import { RegionalIntelligenceRepository } from "../lib/regional/RegionalIntelligenceRepository.ts";

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
  assert.equal(decodePokemonIdentityText("Champion&rsquo;s Path"), "Champion's Path");
  assert.equal(decodePokemonIdentityText("Pok&#233;mon"), "Pokémon");
  assert.equal(decodePokemonIdentityText("Set&unknown;Name"), "Set&unknown;Name");
  assert.equal(
    pokemonMaterialTreatmentIdentity("Thwackey (Prerelease) [Staff]"),
    "prerelease|staff",
  );
  assert.equal(pokemonMaterialTreatmentIdentity("Pikachu (Secret)"), "");
  assert.equal(
    pokemonSetIdentity("Champion&rsquo;s Path"),
    pokemonSetIdentity("Champion's Path"),
  );
  assert.equal(
    pokemonSetIdentity("Scarlet & Violet"),
    pokemonSetIdentity("Scarlet and Violet"),
  );
  assert.equal(
    pokemonSetLabelsStructurallyCompatible(
      "Example Expansion",
      "Example Expansion Set",
    ),
    true,
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

test("Pokémon target ledger maximizes bounded evidence and fixes encoded Lucario pricing", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-pokemon-equivalence-"));
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
      INSERT INTO pricing_category_state VALUES(
        'pokemon-en','2026-08-05','catalogue-hash'
      );
      INSERT INTO pricing_products VALUES
        ('pokemon-en','lucario','SINGLE','Lucario V','Champion''s Path','27/73','Holofoil','English'),
        ('pokemon-en','title-drift','SINGLE','Pikachu V (43)','Vivid Voltage','43/185','Holofoil','English'),
        ('pokemon-en','material-proxy','SINGLE','Pikachu V [Jumbo]','Vivid Voltage','43/185','Holofoil','English'),
        ('pokemon-en','compatible','SINGLE','Charizard','Base Set','4/102','1st Edition Holofoil','English'),
        ('pokemon-en','ambiguous','SINGLE','Eevee Special','Example Set','1/10','Normal','English'),
        ('pokemon-en','missing','SINGLE','Code Card','Promo Codes','SWSH999','Normal','English'),
        ('pokemon-en','sealed','SEALED','Champion''s Path Elite Trainer Box','Champion''s Path','','Sealed','English');
      INSERT INTO pricing_latest VALUES
        ('pokemon-en','lucario','NEAR_MINT',516,516,516),
        ('pokemon-en','title-drift','NEAR_MINT',200,200,200),
        ('pokemon-en','material-proxy','NEAR_MINT',200,200,200),
        ('pokemon-en','compatible','NEAR_MINT',10000,10000,10000);
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
        ('lucario-source','Champion&rsquo;s Path','CPA','Lucario V','27','Foil','NM','EN',2999,2999,2999,NULL,NULL,NULL),
        ('pikachu-source','Vivid Voltage','VIV','Pikachu V','43','Foil','NM','EN',2500,2600,2700,NULL,NULL,NULL),
        ('charizard-source','Base Set','BS','Charizard','4','Foil','NM','EN',500000,510000,520000,NULL,NULL,NULL),
        ('ambiguous-a','Example Set','EX','Eevee','1','','NM','EN',1000,1100,1200,NULL,NULL,NULL),
        ('ambiguous-b','Example Set','EX','Eevee Prime','1','','NM','EN',2000,2100,2200,NULL,NULL,NULL);
    `);
    source.close();
    writeFileSync(
      manifestPath,
      JSON.stringify({
        runId: "pokemon-equivalence-run",
        status: "DRY_RUN_COMPLETE",
        completedAt: "2026-08-05T16:21:32.529Z",
        contractVersion: "test-20-column",
        uniqueIdentities: 5,
        conflictingDuplicates: 0,
        databaseFile: "ligapokemon.sqlite",
      }),
    );
    const reconciliation = new PokemonRegionalReconciliationRepository(pricing);
    const first = reconciliation.buildCrosswalk(sourcePath, manifestPath);
    const second = reconciliation.buildCrosswalk(sourcePath, manifestPath);
    assert.deepEqual(
      {
        total: first.targetTotal,
        exact: first.targetExact,
        compatible: first.targetCompatible,
        ambiguous: first.targetAmbiguous,
        unavailable: first.targetUnavailable,
        priced: first.targetWithLigaConsumerPrice,
      },
      {
        total: 7,
        exact: 2,
        compatible: 2,
        ambiguous: 1,
        unavailable: 2,
        priced: 4,
      },
    );
    assert.equal(first.targetLedgerFingerprint, second.targetLedgerFingerprint);
    assert.equal(
      pricing
        .prepare(
          `SELECT COUNT(*) count FROM regional_product_equivalence
          WHERE provider_id='ligapokemon' AND category_id='pokemon-en'`,
        )
        .get()?.count,
      7,
    );
    assert.equal(
      pricing
        .prepare(
          `SELECT COUNT(*) count FROM regional_product_equivalence
          WHERE provider_id='ligamagic'`,
        )
        .get()?.count,
      0,
    );
    assert.equal(
      pricing
        .prepare(
          `SELECT status FROM regional_product_equivalence
          WHERE provider_id='ligapokemon' AND sku='sealed'`,
        )
        .get()?.status,
      "UNAVAILABLE",
    );
    assert.equal(
      pricing
        .prepare(
          `SELECT status FROM regional_pokemon_crosswalk
          WHERE liga_identity_key='charizard-source'`,
        )
        .get()?.status,
      "UNMATCHED",
    );
    const regional = new RegionalIntelligenceRepository(pricing);
    const lucario = regional.evidenceFor("pokemon-en", "lucario");
    assert.equal(lucario?.consumerAverageCentavos, 2999);
    assert.equal(lucario?.matchQuality, "EXACT");
    assert.equal(lucario?.editionName, "Champion&rsquo;s Path");
    const compatible = regional.evidenceFor("pokemon-en", "compatible");
    assert.equal(compatible?.matchQuality, "COMPATIBLE");
    assert.equal(compatible?.consumerAverageCentavos, 510000);
    const materialProxy = regional.evidenceFor(
      "pokemon-en",
      "material-proxy",
    );
    assert.equal(materialProxy?.matchQuality, "COMPATIBLE");
    assert.equal(
      materialProxy?.matchMethod,
      "COMPATIBLE_POKEMON_UNSPECIFIED_MATERIAL_TREATMENT_V1",
    );
    assert.equal(
      regional.equivalenceFor("pokemon-en", "ambiguous")?.status,
      "AMBIGUOUS",
    );
    assert.equal(
      regional.equivalenceFor("pokemon-en", "sealed")?.status,
      "UNAVAILABLE",
    );
    pricing.close();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
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
