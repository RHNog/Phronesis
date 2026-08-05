import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  artSeriesCollectorIdentity,
  artSeriesProductNameCompatible,
  calculateArbitrage,
  collectorSuffixBase,
  collectorSuffixProductNameCompatible,
  crossMarketAnchorKey,
  crossMarketIdentityKey,
  crossMarketNameEditionVariantKey,
  doubleSidedTokenCollectorPair,
  documentedEditionTreatmentBase,
  documentedTreatmentProductNameCompatible,
  editionTreatmentIdentity,
  editionAliasCompatible,
  explicitCatalogueTarget,
  explicitHistoricalEditionTarget,
  genericVariantBaseEdition,
  isArtSeriesFoilShell,
  isFoilOnlyTreatmentNormalShell,
  isHistoricallyImpossibleFoilEdition,
  normalizeCrossMarketCardName,
  normalizeCollectorNumber,
  normalizeRegionalVariant,
  permitsPreExodusCollectorFallback,
  tokenBaseEdition,
  tokenCollectorIdentity,
  tokenNameIdentity,
  variantProductNameCompatible,
  type RegionalCostProfile,
} from "../lib/regional/domain.ts";
import { RegionalIntelligenceRepository } from "../lib/regional/RegionalIntelligenceRepository.ts";

const completeProfile: RegionalCostProfile = {
  brlPerUsd: 5,
  brlPerUsdBuy: 5,
  brlPerUsdSell: 5,
  fxObservedAt: new Date().toISOString(),
  fxFetchedAt: new Date().toISOString(),
  fxLastAttemptAt: new Date().toISOString(),
  fxSource: "Owner observation",
  fxLastError: null,
  usToBrazilFixedBrl: 10,
  usToBrazilPercent: 10,
  usToBrazilMinAcquisitionUsd: null,
  usToBrazilMaxAcquisitionUsd: null,
  usToBrazilMinGrossProceedsBrl: null,
  usToBrazilMinGrossSpreadBrl: null,
  usToBrazilMinNetProfitBrl: null,
  usToBrazilMinProfitMarginPercent: null,
  usToBrazilMinRoiPercent: null,
  brazilToUsFixedUsd: 2,
  brazilToUsPercent: 5,
  brazilToUsMinAcquisitionBrl: null,
  brazilToUsMaxAcquisitionBrl: null,
  brazilToUsMinGrossProceedsUsd: null,
  brazilToUsMinGrossSpreadUsd: null,
  brazilToUsMinNetProfitUsd: null,
  brazilToUsMinProfitMarginPercent: null,
  brazilToUsMinRoiPercent: null,
  maxEvidenceAgeHours: null,
  updatedAt: null,
};

test("cross-market identity normalization preserves exact printing dimensions", () => {
  assert.equal(normalizeCollectorNumber("0275/332"), "275");
  assert.equal(normalizeRegionalVariant(""), "Normal");
  assert.equal(normalizeRegionalVariant("Foil"), "Foil");
  assert.equal(normalizeRegionalVariant("Textless"), null);
  assert.equal(doubleSidedTokenCollectorPair("T20T40"), "20|40");
  assert.equal(doubleSidedTokenCollectorPair("40 // 20"), "20|40");
  assert.equal(doubleSidedTokenCollectorPair("T20"), null);
  assert.equal(tokenCollectorIdentity("T06"), "6");
  assert.equal(tokenBaseEdition("Bloomburrow (Tokens)"), "Bloomburrow");
  assert.equal(
    tokenNameIdentity("Squirrel 1/1 // Food (#27)"),
    "food|squirrel",
  );
  assert.equal(
    tokenNameIdentity("Food // Squirrel Double-Sided Token"),
    "food|squirrel",
  );
  assert.equal(
    genericVariantBaseEdition("Kamigawa: Neon Dynasty (Variants)"),
    "Kamigawa: Neon Dynasty",
  );
  assert.equal(
    variantProductNameCompatible({
      sourceName: "Jin-Gitaxias, Progress Tyrant",
      sourceCollectorNumber: "427",
      sourceEdition: "Kamigawa: Neon Dynasty (Variants)",
      targetName:
        "Jin-Gitaxias, Progress Tyrant (Phyrexian) (Foil Etched)",
      targetCollectorNumber: "427",
      targetEdition: "Kamigawa: Neon Dynasty",
    }),
    true,
  );
  assert.equal(permitsPreExodusCollectorFallback("Tempest"), true);
  assert.equal(permitsPreExodusCollectorFallback("Unstable"), false);
  assert.equal(isHistoricallyImpossibleFoilEdition("Tempest"), true);
  assert.equal(isHistoricallyImpossibleFoilEdition("Fourth Edition (BB)"), true);
  assert.equal(isHistoricallyImpossibleFoilEdition("Urza's Legacy"), false);
  assert.equal(isArtSeriesFoilShell("Bloomburrow (Art Series)", "Foil"), true);
  assert.equal(isArtSeriesFoilShell("Bloomburrow (Art Series)", ""), false);
  assert.equal(
    isFoilOnlyTreatmentNormalShell(
      "Commander Legends (Foil Etched)",
      "",
    ),
    true,
  );
  assert.equal(
    isFoilOnlyTreatmentNormalShell(
      "Commander Legends (Foil Etched)",
      "Foil",
    ),
    false,
  );
  assert.equal(
    documentedEditionTreatmentBase(
      "Streets of New Capenna (Foil Etched / Gilded Foil)",
    ),
    "Streets of New Capenna",
  );
  assert.equal(collectorSuffixBase("003a"), "3");
  assert.equal(collectorSuffixBase("T03a"), null);
  assert.equal(artSeriesCollectorIdentity("058a"), "58");
  assert.equal(
    artSeriesProductNameCompatible({
      sourceName: "Adult Gold Dragon (Art Card with Signature)",
      targetName: "Adult Gold Dragon Art Card (Gold-Stamped Signature)",
    }),
    true,
  );
  assert.equal(
    artSeriesProductNameCompatible({
      sourceName: "Basilisk (Stat Card with Signature)",
      targetName: "Basilisk Art Card (Gold-Stamped Signature)",
    }),
    false,
  );
  assert.equal(
    documentedTreatmentProductNameCompatible({
      sourceName: "Arcane Signet (#332)",
      sourceCollectorNumber: "332",
      sourceEdition: "FINAL FANTASY Commander",
      targetName: "Arcane Signet (0332) (Surge Foil)",
      targetCollectorNumber: "332",
      targetEdition: "Commander: FINAL FANTASY",
    }),
    true,
  );
  assert.equal(
    collectorSuffixProductNameCompatible({
      sourceName: "Amateur Auteur (A)",
      sourceCollectorNumber: "3a",
      sourceEdition: "Unstable",
      targetName: "Amateur Auteur (A)",
      targetCollectorNumber: "3",
      targetEdition: "Unstable",
    }),
    true,
  );
  assert.equal(
    explicitHistoricalEditionTarget("Limited Edition Alpha"),
    "Alpha Edition",
  );
  assert.deepEqual(explicitCatalogueTarget("Mystery Booster 2 (Future Sight)"), {
    edition: "Mystery Booster 2",
    nameSuffix: "Future Sight",
  });
  assert.equal(explicitCatalogueTarget("Mystery Booster 2"), null);
  assert.deepEqual(explicitCatalogueTarget("Friday Night Magic"), {
    edition: "FNM Promos",
    nameSuffix: null,
  });
  assert.deepEqual(
    explicitCatalogueTarget("FINAL FANTASY Commander (Through the Ages)"),
    {
      edition: "FINAL FANTASY: Through the Ages",
      nameSuffix: "Showcase",
    },
  );
  assert.deepEqual(
    editionTreatmentIdentity(
      "Doctor Who (Extended Art Surge Foil)",
      "Davros, Dalek Creator",
    ),
    {
      baseEdition: "Doctor Who",
      targetCardName:
        "Davros, Dalek Creator (Extended Art) (Surge Foil)",
      treatment: "Extended Art + Surge Foil",
    },
  );
  assert.equal(
    editionTreatmentIdentity("Kamigawa: Neon Dynasty (Variants)", "Boseiju"),
    null,
  );
  assert.deepEqual(
    editionTreatmentIdentity("The Brothers' War (Schematic)", "Ichor Wellspring"),
    {
      baseEdition: "The Brothers' War",
      targetCardName: "Ichor Wellspring (Schematic)",
      treatment: "Schematic",
    },
  );
  assert.deepEqual(
    editionTreatmentIdentity("Foundations (Bordeless Mana Foil)", "Omniscience"),
    {
      baseEdition: "Foundations",
      targetCardName: "Omniscience (Borderless) (Mana Foil)",
      treatment: "Borderless + Mana Foil",
    },
  );
  assert.deepEqual(
    editionTreatmentIdentity(
      "FINAL FANTASY (Borderless Pose Surge Foil)",
      "Aerith Gainsborough",
    ),
    {
      baseEdition: "FINAL FANTASY",
      targetCardName:
        "Aerith Gainsborough (Borderless) (Surge Foil)",
      treatment: "Borderless + Surge Foil",
    },
  );
  assert.equal(normalizeCrossMarketCardName("Plains (#279)", "279"), "plains");
  assert.equal(normalizeCrossMarketCardName("Plains (0279)", "279"), "plains");
  assert.equal(
    normalizeCrossMarketCardName("Plains (0279) (Borderless)", "279"),
    "plains borderless",
  );
  assert.equal(
    normalizeCrossMarketCardName("Black Lotus (CE)", "", "Collector's Edition"),
    "black lotus",
  );
  assert.equal(
    normalizeCrossMarketCardName("Jin-Gitaxias (Phyrexian)", "427"),
    "jin gitaxias phyrexian",
  );
  assert.equal(
    crossMarketIdentityKey({
      name: "Mox Opal",
      edition: "Double Masters",
      collectorNumber: "275",
      variant: "Normal",
    }),
    "mox opal|double masters|275|normal",
  );
  assert.equal(
    crossMarketAnchorKey({
      name: "Mox Opal",
      collectorNumber: "0275/332",
      variant: "Nonfoil",
    }),
    "mox opal|275|normal",
  );
  assert.equal(
    crossMarketNameEditionVariantKey({
      name: "Elven Riders",
      edition: "Fifth Edition",
      variant: "Normal",
    }),
    "elven riders|fifth edition|normal",
  );
  assert.equal(editionAliasCompatible("Magic 2014", "Magic 2014 (M14)"), true);
  assert.equal(editionAliasCompatible("Fallout", "Universes Beyond: Fallout"), true);
  assert.equal(editionAliasCompatible("Amonkhet Remastered", "Amonkhet"), false);
  assert.equal(editionAliasCompatible("Shadows over Innistrad: Remastered", "Innistrad Remastered"), false);
  assert.equal(editionAliasCompatible("Adventures in the Forgotten Realms (Ampersand)", "Adventures in the Forgotten Realms"), false);
  assert.equal(editionAliasCompatible("Commander Anthology 2018", "Commander Anthology"), false);
  assert.equal(editionAliasCompatible("Commander Anthology 2018", "Commander Anthology Volume II"), true);
  assert.equal(editionAliasCompatible("Avatar: The Last Airbender Eternal", "Avatar: The Last Airbender"), false);
  assert.equal(editionAliasCompatible("Avatar: The Last Airbender Eternal", "Avatar: The Last Airbender: Eternal-Legal"), true);
  assert.equal(editionAliasCompatible("Duskmourn: House of Horror", "Promo Pack: Duskmourn: House of Horror"), false);
  assert.equal(editionAliasCompatible("Duel Decks: Merfolk vs. Goblins", "Duel Decks: Elves vs. Goblins"), false);
  assert.equal(editionAliasCompatible("Bloomburrow", "Adventures in the Forgotten Realms"), false);
  assert.equal(editionAliasCompatible("Mirage", "Magic 2012 (M12)"), false);
  assert.equal(editionAliasCompatible("War of the Spark (Japanese)", "War of the Spark"), false);
  assert.equal(editionAliasCompatible("War of the Spark (Japanese)", "War of the Spark Japanese"), true);
  assert.equal(editionAliasCompatible("History Promos (Retro Frame)", "History Promos"), false);
  assert.equal(editionAliasCompatible("Showcase: Bloomburrow", "Showcase Bloomburrow"), true);
});

test("repository derives only a conflict-free edition alias with two independent anchors", () => {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-regional-alias-"));
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','m14-a','SINGLE','Kalonian Tusker','Magic 2014 (M14)','182','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','m14-b','SINGLE','Elvish Mystic','Magic 2014 (M14)','169','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','unrelated','SINGLE','Unrelated Anchor','Unrelated Promo','999','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
    INSERT INTO pricing_latest VALUES('magic-en','m14-a','NEAR_MINT',100,100,100,'2026-07-30T12:00:00.000Z');
    INSERT INTO pricing_latest VALUES('magic-en','m14-b','NEAR_MINT',200,200,200,'2026-07-30T12:00:00.000Z');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('a','Magic 2014','M14','Kalonian Tusker','182','',1000,1100,1200,500,600,700);
    INSERT INTO ligamagic_price VALUES('b','Magic 2014','M14','Elvish Mystic','169','',2000,2100,2200,1000,1100,1200);
    INSERT INTO ligamagic_price VALUES('unrelated','Magic 2014','M14','Unrelated Anchor','999','',2000,2100,2200,1000,1100,1200);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify({ runId: "alias", completedAt: "2026-07-30T12:00:00.000Z", databaseFile: "liga.sqlite" }));
  const repository = new RegionalIntelligenceRepository(pricing);
  const first = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(first.exactMatched, 0);
  assert.equal(first.aliasMatched, 2);
  assert.equal(first.unmatched, 1);
  assert.equal(first.derivedEditionAliasCount, 1);
  assert.equal(first.comparableBoth, 2);
  assert.equal(first.editionAliases[0]?.anchorCount, 2);
  assert.equal(first.editionAliases[0]?.tcgplayerEdition, "Magic 2014 (M14)");
  const method = pricing.prepare("SELECT DISTINCT method FROM regional_crosswalk").get() as { method: string };
  assert.equal(method.method, "EVIDENCE_DERIVED_EDITION_ALIAS_V4");
  const second = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(second.crosswalkFingerprint, first.crosswalkFingerprint);
  pricing.close();
});

test("edition aliases fail closed with insufficient or conflicting anchors", () => {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-regional-conflict-"));
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','a','SINGLE','Anchor A','Target One','1','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','b','SINGLE','Anchor B','Target Two','2','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('a','Conflicted Source','X','Anchor A','1','',100,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('b','Conflicted Source','X','Anchor B','2','',100,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify({ runId: "conflict", completedAt: "2026-07-30T12:00:00.000Z", databaseFile: "liga.sqlite" }));
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.derivedEditionAliasCount, 0);
  assert.equal(report.matched, 0);
  assert.equal(report.unmatched, 2);
  pricing.close();
});

test("repository recovers only one unique target whose TCGplayer collector is absent", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-missing-collector-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','unique','SINGLE','Elven Riders','Fifth Edition','','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','duplicate-a','SINGLE','Historical Duplicate','Fifth Edition','','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','duplicate-b','SINGLE','Historical Duplicate','Fifth Edition','','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','conflict','SINGLE','Populated Conflict','Modern Set','999','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
    INSERT INTO pricing_latest VALUES('magic-en','unique','NEAR_MINT',100,100,100,'2026-07-30T12:00:00.000Z');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('unique','Fifth Edition','5ED','Elven Riders','121','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('duplicate','Fifth Edition','5ED','Historical Duplicate','122','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('conflict','Modern Set','MOD','Populated Conflict','123','',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "missing-collector",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.matched, 1);
  assert.equal(report.missingTcgCollectorMatched, 1);
  assert.equal(report.missingTcgCollectorExactEditionMatched, 1);
  assert.equal(report.missingTcgCollectorAliasEditionMatched, 0);
  assert.equal(report.ambiguous, 1);
  assert.equal(report.unmatched, 1);
  assert.equal(report.historicalFoilShellQuarantined, 0);
  const methods = pricing
    .prepare(
      "SELECT liga_identity_key, status, method FROM regional_crosswalk ORDER BY liga_identity_key",
    )
    .all() as Array<{ liga_identity_key: string; status: string; method: string }>;
  assert.equal(methods[0]?.status, "UNMATCHED");
  assert.equal(methods[1]?.status, "AMBIGUOUS");
  assert.equal(
    methods[2]?.method,
    "UNIQUE_NAME_EDITION_VARIANT_MISSING_TCG_COLLECTOR_V5",
  );
  pricing.close();
});

test("repository ignores catalogue-order collector conflicts only for one exact pre-Exodus identity", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-pre-exodus-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','ruby','SINGLE','Ruby Medallion','Tempest','305','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
    INSERT INTO pricing_latest VALUES('magic-en','ruby','NEAR_MINT',100,100,100,'2026-07-30T12:00:00.000Z');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('normal','Tempest','TMP','Ruby Medallion','239','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('foil-shell','Tempest','TMP','Ruby Medallion','239','Foil',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "pre-exodus",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.preExodusNonprintedCollectorMatched, 1);
  assert.equal(report.matched, 1);
  assert.equal(report.unmatched, 0);
  assert.equal(report.historicalFoilShellQuarantined, 1);
  const method = pricing
    .prepare("SELECT method FROM regional_crosswalk WHERE liga_identity_key='normal'")
    .get() as { method: string };
  assert.equal(
    method.method,
    "UNIQUE_NAME_EDITION_VARIANT_PRE_EXODUS_NONPRINTED_COLLECTOR_V1",
  );
  pricing.close();
});

test("repository maps only explicit historical edition labels to one collector-less target", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-historical-edition-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','lotus','SINGLE','Black Lotus','Alpha Edition','','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('normal','Limited Edition Alpha','AL','Black Lotus','233','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('foil-shell','Limited Edition Alpha','AL','Black Lotus','233','Foil',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "historical-edition",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.explicitHistoricalEditionMatched, 1);
  assert.equal(report.matched, 1);
  assert.equal(report.unmatched, 0);
  assert.equal(report.historicalFoilShellQuarantined, 1);
  pricing.close();
});

test("repository preserves Mystery Booster treatment context in explicit catalogue mappings", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-mystery-treatment-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','vial','SINGLE','Aether Vial (Future Sight)','Mystery Booster 2','216','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('future','Mystery Booster 2 (Future Sight)','FSMB2','Aether Vial','999','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('generic','Mystery Booster 2','MB2','Aether Vial','999','',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "mystery-treatment",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.explicitCatalogueSchemeMatched, 1);
  assert.equal(report.matched, 1);
  assert.equal(report.unmatched, 1);
  assert.equal(
    pricing
      .prepare("SELECT status FROM regional_crosswalk WHERE liga_identity_key='generic'")
      .get()?.status,
    "UNMATCHED",
  );
  pricing.close();
});

test("repository derives World Championship player codes and preserves sideboard and finish", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-world-championship-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','a','SINGLE','Anchor A - 2001 Alex Borteh (INV)','World Championship Decks','','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','b','SINGLE','Anchor B - 2001 Alex Borteh (INV)','World Championship Decks','','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','c','SINGLE','Anchor C - 2001 Alex Borteh (INV)','World Championship Decks','','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','sb','SINGLE','Sideboard Card - 2001 Alex Borteh (INV) (SB)','World Championship Decks','','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('a','World Championship Decks','WCD','Anchor A (AB-01)','1','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('b','World Championship Decks','WCD','Anchor B (AB-01)','2','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('c','World Championship Decks','WCD','Anchor C (AB-01)','3','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('sb','World Championship Decks','WCD','Sideboard Card-SB (AB-01)','4','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('foil-shell','World Championship Decks','WCD','Anchor A (AB-01)','1','Foil',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "world-championship",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.worldChampionshipPlayerAliasCount, 1);
  assert.equal(report.worldChampionshipMetadataMatched, 4);
  assert.equal(report.matched, 4);
  assert.equal(report.unmatched, 1);
  assert.equal(
    report.worldChampionshipPlayerAliases[0]?.tcgplayerPlayer,
    "Alex Borteh",
  );
  pricing.close();
});

test("repository moves only a documented edition treatment into a full product identity", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-edition-treatment-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','davros','SINGLE','Davros, Dalek Creator (Surge Foil)','Universes Beyond: Doctor Who','606','Foil','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('foil','Doctor Who (Surge Foil)','WHO','Davros, Dalek Creator','606','Foil',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('normal-shell','Doctor Who (Surge Foil)','WHO','Davros, Dalek Creator','606','',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "edition-treatment",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.editionTreatmentNameMatched, 1);
  assert.equal(report.matched, 1);
  assert.equal(report.unmatched, 0);
  assert.equal(report.unsupportedVariant, 1);
  assert.equal(report.foilOnlyTreatmentNormalShellQuarantined, 1);
  pricing.close();
});

test("repository reconciles Liga product treatments, Art Series signatures, and collector suffixes", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-catalogue-conventions-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','surge','SINGLE','Arcane Signet (0332) (Surge Foil)','Commander: FINAL FANTASY','332','Foil','English');
    INSERT INTO pricing_products VALUES('magic-en','signature','SINGLE','Adult Gold Dragon Art Card (Gold-Stamped Signature)','Art Series: Adventures in the Forgotten Realms','58','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','unstable-a','SINGLE','Amateur Auteur (A)','Unstable','3','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','forest','SINGLE','Forest (280)','Core Set 2019','280','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('surge','FINAL FANTASY Commander','FIC','Arcane Signet (#332)','332','Foil',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('signature','Adventures in the Forgotten Realms (Art Series)','AAFR','Adult Gold Dragon (Art Card with Signature)','58a','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('art-foil-shell','Adventures in the Forgotten Realms (Art Series)','AAFR','Adult Gold Dragon (Art Card)','58','Foil',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('art-stat-side','Adventures in the Forgotten Realms (Art Series)','AAFR','Adult Gold Dragon (Stat Card with Signature)','58b','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('unstable-a','Unstable','UST','Amateur Auteur (A)','3a','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('unstable-base','Unstable','UST','Amateur Auteur','3','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('forest-a','Core Set 2019','M19','Forest','280','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('forest-b','Core Set 2019','M19','Forest (#280)','280','',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "catalogue-conventions",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.documentedProductTreatmentNameMatched, 1);
  assert.equal(report.artSeriesIdentityMatched, 1);
  assert.equal(report.collectorSuffixIdentityMatched, 1);
  assert.equal(report.artSeriesFoilShellQuarantined, 1);
  assert.equal(report.targetCollisionQuarantined, 2);
  assert.equal(report.matched, 3);
  assert.equal(report.ambiguous, 2);
  assert.equal(report.unmatched, 2);
  assert.equal(report.unsupportedVariant, 1);
  pricing.close();
});

test("repository matches unique one-face and complete double-sided token identities", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-token-pair-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','token','SINGLE','Clue // Dragon (0020) Double-Sided Token','Commander Masters','40 // 20','Normal','English');
    INSERT INTO pricing_products VALUES('magic-en','food-token','SINGLE','Food Token','Bloomburrow','6','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('pair','Commander Masters (Tokens)','TCMM','Dragon 2/2 // Clue (#40)','T20T40','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('single-side-shell','Commander Masters (Tokens)','TCMM','Dragon 2/2','T20','',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('one-face-token','Bloomburrow (Tokens)','TBLB','Food (#6)','T06','',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "token-pair",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.doubleSidedTokenPairMatched, 1);
  assert.equal(report.tokenIdentityMatched, 2);
  assert.equal(report.matched, 2);
  assert.equal(report.unmatched, 1);
  pricing.close();
});

test("repository resolves a generic variant only from exact collector, finish, and reduced name", () => {
  const directory = mkdtempSync(
    join(tmpdir(), "phronesis-regional-generic-variant-"),
  );
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','jin','SINGLE','Jin-Gitaxias, Progress Tyrant (Phyrexian) (Foil Etched)','Kamigawa: Neon Dynasty','427','Foil','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('match','Kamigawa: Neon Dynasty (Variants)','NEO','Jin-Gitaxias, Progress Tyrant','427','Foil',1000,NULL,NULL,NULL,NULL,NULL);
    INSERT INTO ligamagic_price VALUES('wrong-collector','Kamigawa: Neon Dynasty (Variants)','NEO','Jin-Gitaxias, Progress Tyrant','428','Foil',1000,NULL,NULL,NULL,NULL,NULL);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "generic-variant",
      completedAt: "2026-07-30T12:00:00.000Z",
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.genericVariantIdentityMatched, 1);
  assert.equal(report.matched, 1);
  assert.equal(report.unmatched, 1);
  pricing.close();
});

test("arbitrage remains gated until explicit costs and availability exist", () => {
  const missing = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile: { ...completeProfile, usToBrazilPercent: null },
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(missing.state, "IDENTITY_VERIFIED");
  assert.match(missing.blocker ?? "", /costs are incomplete/);
  const costed = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile: completeProfile,
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(costed.state, "COSTED");
  assert.equal(costed.netProfit, 35);
  assert.equal(costed.grossSpread, 50);
  assert.equal(costed.profitMarginPercent, 35);
  assert.equal(costed.meetsTargets, true);
  const actionable = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile: completeProfile,
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: true,
  });
  assert.equal(actionable.state, "ACTIONABLE");
  const rejectedByTarget = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile: { ...completeProfile, usToBrazilMinNetProfitBrl: 40 },
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: true,
  });
  assert.equal(rejectedByTarget.state, "REJECTED");
  assert.equal(rejectedByTarget.meetsTargets, false);
  assert.match(rejectedByTarget.targetBlockers[0] ?? "", /net profit BRL/);
});

test("arbitrage uses the conservative direction-specific official PTAX side", () => {
  const profile = {
    ...completeProfile,
    brlPerUsdBuy: 4,
    brlPerUsdSell: 5,
    fxSource: "Banco Central do Brasil PTAX — closing bulletin",
  };
  const inbound = calculateArbitrage({
    direction: "US_TO_BRAZIL",
    profile,
    usPriceUsd: 10,
    brazilPriceBrl: 100,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(inbound.totalCost, 65);
  const outbound = calculateArbitrage({
    direction: "BRAZIL_TO_US",
    profile,
    usPriceUsd: 100,
    brazilPriceBrl: 40,
    identityVerified: true,
    sourcesFresh: true,
    availabilityVerified: false,
  });
  assert.equal(outbound.totalCost, 12.5);
});

test("official FX failure retains the last-good PTAX quote", () => {
  const database = new DatabaseSync(":memory:");
  const repository = new RegionalIntelligenceRepository(database);
  repository.recordOfficialFx({
    buyBrlPerUsd: 5.0733,
    sellBrlPerUsd: 5.0739,
    observedAt: "2026-07-30T16:07:32.344Z",
    fetchedAt: "2026-07-30T18:00:00.000Z",
    source: "Banco Central do Brasil PTAX — closing bulletin",
  });
  const failed = repository.recordOfficialFxFailure("2026-07-30T19:00:00.000Z");
  assert.equal(failed.brlPerUsdBuy, 5.0733);
  assert.equal(failed.brlPerUsdSell, 5.0739);
  assert.equal(failed.fxFetchedAt, "2026-07-30T18:00:00.000Z");
  assert.equal(failed.fxLastAttemptAt, "2026-07-30T19:00:00.000Z");
  assert.match(failed.fxLastError ?? "", /temporarily unavailable/);
  database.close();
});

test("repository persists nullable route targets and rejects inverted ranges", () => {
  const database = new DatabaseSync(":memory:");
  const repository = new RegionalIntelligenceRepository(database);
  const saved = repository.updateDecisionSettings({
    ...completeProfile,
    usToBrazilMinNetProfitBrl: 250,
    brazilToUsMinProfitMarginPercent: 18,
    maxEvidenceAgeHours: 36,
  });
  assert.equal(saved.usToBrazilMinNetProfitBrl, 250);
  assert.equal(saved.brazilToUsMinProfitMarginPercent, 18);
  assert.equal(saved.maxEvidenceAgeHours, 36);
  assert.equal(saved.usToBrazilMinGrossSpreadBrl, null);
  assert.throws(
    () =>
      repository.updateDecisionSettings({
        ...completeProfile,
        usToBrazilMinAcquisitionUsd: 100,
        usToBrazilMaxAcquisitionUsd: 50,
      }),
    /minimum cannot exceed its maximum/,
  );
  database.close();
});

test("repository adopts one exact identity and quarantines Textless", () => {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-regional-"));
  const pricing = new DatabaseSync(join(directory, "pricing.sqlite"));
  pricing.exec(`
    CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT,PRIMARY KEY(category_id,sku));
    CREATE TABLE pricing_category_state(category_id TEXT PRIMARY KEY,snapshot_date TEXT,source_hash TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,market_price_cents INTEGER,listing_price_cents INTEGER,delivered_price_cents INTEGER,snapshot_date TEXT,PRIMARY KEY(category_id,sku,condition_key));
    INSERT INTO pricing_products VALUES('magic-en','mox-normal','SINGLE','Mox Opal','Double Masters','275','Normal','English');
    INSERT INTO pricing_category_state VALUES('magic-en','2026-07-30','source');
    INSERT INTO pricing_latest VALUES('magic-en','mox-normal','NEAR_MINT',2000,2100,2500,'${new Date().toISOString()}');
  `);
  const ligaPath = join(directory, "liga.sqlite");
  const liga = new DatabaseSync(ligaPath);
  liga.exec(`CREATE TABLE ligamagic_price(identity_key TEXT PRIMARY KEY,edition_en TEXT,edition_code TEXT,card_en TEXT,collector_number TEXT,extras TEXT,consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER);
    INSERT INTO ligamagic_price VALUES('normal','Double Masters','2XM','Mox Opal','275','',10000,11000,12000,5000,6000,7000);
    INSERT INTO ligamagic_price VALUES('textless','Double Masters','2XM','Mox Opal','275','Textless',10000,11000,12000,5000,6000,7000);`);
  liga.close();
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      runId: "test",
      completedAt: new Date().toISOString(),
      databaseFile: "liga.sqlite",
    }),
  );
  const repository = new RegionalIntelligenceRepository(pricing);
  const report = repository.buildCrosswalk(ligaPath, manifestPath);
  assert.equal(report.matched, 1);
  assert.equal(report.unsupportedVariant, 1);
  assert.equal(
    repository.evidenceFor("magic-en", "mox-normal")?.consumerAverageCentavos,
    11000,
  );
  assert.equal(
    repository.evidenceFor("magic-en", "mox-normal")?.sourceProvider,
    "LigaMagic",
  );
  pricing.exec(`
    CREATE TABLE regional_pokemon_crosswalk(
      liga_identity_key TEXT PRIMARY KEY,category_id TEXT,sku TEXT,status TEXT
    );
    CREATE TABLE regional_pokemon_evidence(
      liga_identity_key TEXT PRIMARY KEY,card_name TEXT,set_name TEXT,set_code TEXT,
      collector_number TEXT,variant TEXT,observed_at TEXT,
      consumer_low_centavos INTEGER,consumer_average_centavos INTEGER,
      consumer_high_centavos INTEGER,store_buy_low_centavos INTEGER,
      store_buy_average_centavos INTEGER,store_buy_high_centavos INTEGER
    );
    INSERT INTO regional_pokemon_crosswalk VALUES(
      'pikachu-v','pokemon-en','pikachu-v','MATCHED'
    );
    INSERT INTO regional_pokemon_evidence VALUES(
      'pikachu-v','Pikachu V','Vivid Voltage','VIV','43','Holofoil',
      '2026-08-05T07:03:05.790Z',3899,4207,NULL,NULL,NULL,NULL
    );
  `);
  const pokemonEvidence = repository.evidenceFor(
    "pokemon-en",
    "pikachu-v",
  );
  assert.equal(pokemonEvidence?.sourceProvider, "LigaPokemon");
  assert.equal(pokemonEvidence?.editionName, "Vivid Voltage");
  assert.equal(pokemonEvidence?.consumerLowCentavos, 3899);
  assert.equal(repository.evidenceFor("onepiece-en", "pikachu-v"), null);
  repository.updateProfile(completeProfile);
  const before = repository
    .listCandidates()
    .find((candidate) => candidate.direction === "US_TO_BRAZIL");
  assert.equal(before?.state, "COSTED");
  assert.equal(before?.usPriceUsd, 25);
  assert.equal(before?.netProfit, -47.5);
  assert.equal(before?.acquisitionMarket, "TCGplayer");
  assert.equal(before?.acquisitionValue, 25);
  assert.equal(before?.acquisitionCurrency, "USD");
  assert.equal(before?.exitMarket, "LigaMagic");
  assert.equal(before?.grossProceeds, 100);
  assert.equal(before?.grossCurrency, "BRL");
  assert.equal(before?.profitMarginPercent, -47.5);
  const outbound = repository
    .listCandidates()
    .find((candidate) => candidate.direction === "BRAZIL_TO_US");
  assert.equal(outbound?.usPriceUsd, 20);
  assert.equal(outbound?.netProfit, -3);
  assert.equal(outbound?.acquisitionMarket, "LigaMagic");
  assert.equal(outbound?.acquisitionValue, 100);
  assert.equal(outbound?.acquisitionCurrency, "BRL");
  assert.equal(outbound?.exitMarket, "TCGplayer");
  assert.equal(outbound?.grossProceeds, 20);
  assert.equal(outbound?.grossCurrency, "USD");
  assert.equal(outbound?.profitMarginPercent, -15);
  repository.verifyAvailability({
    categoryId: "magic-en",
    sku: "mox-normal",
    direction: "US_TO_BRAZIL",
    executablePrice: 5,
    quantity: 1,
    counterpartyLabel: "Verified seller",
    observedAt: new Date().toISOString(),
    notes: "Test observation",
  });
  const after = repository
    .listCandidates()
    .find((candidate) => candidate.direction === "US_TO_BRAZIL");
  assert.equal(after?.state, "ACTIONABLE");
  assert.equal(after?.usPriceUsd, 5);
  assert.equal(after?.netProfit, 62.5);
  pricing.close();
});
