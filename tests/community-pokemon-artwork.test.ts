import assert from "node:assert/strict";
import test from "node:test";
import { PricingRepository } from "../lib/pricing/repository";
import type { SearchMatch } from "../lib/pricing/types";
import {
  parsePokefilesPublicConfiguration,
  resolvePokefilesArtwork,
} from "../lib/providers/community/PokefilesArtworkSource";
import {
  classifySealedProduct,
  resolvePtcgAssetsArtwork,
  type PtcgAssetCandidate,
} from "../lib/providers/community/PtcgAssetsArtworkSource";
import type { Card } from "../types/card";

function jwt(ref: string) {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ iss: "supabase", ref, role: "anon" })}.signature`;
}

function match(overrides: Partial<SearchMatch> = {}): SearchMatch {
  return {
    categoryId: "pokemon-en",
    sku: "sku-1",
    productType: "SINGLE",
    name: "Dhelmise",
    setName: "Mega Evolution Promo",
    collectorNumber: "084",
    variant: "Holofoil",
    language: "English",
    imageUrl: null,
    score: 0,
    prices: {},
    sealedPrice: null,
    previousMarketPriceCents: null,
    previousSnapshotDate: null,
    ...overrides,
  };
}

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "pokefiles:me-p-084",
    name: "Dhelmise",
    game: "Pokemon",
    set: "Mega Evolution Promo",
    setCode: "mep",
    number: "084",
    rarity: "Promo",
    finish: "Holofoil",
    imageUrl: "https://images.pokemontcg.io/mep/084_hires.png",
    imageUrls: {
      small: "https://images.pokemontcg.io/mep/084.png",
      large: "https://images.pokemontcg.io/mep/084_hires.png",
    },
    ...overrides,
  };
}

test("PokéFiles public configuration accepts only a matching anonymous project client", () => {
  const key = jwt("projectref");
  assert.deepEqual(
    parsePokefilesPublicConfiguration(`const u="https://projectref.supabase.co",k="${key}"`),
    { supabaseUrl: "https://projectref.supabase.co", anonKey: key },
  );
  assert.throws(() => parsePokefilesPublicConfiguration(
    `const u="https://projectref.supabase.co",k="${jwt("different")}"`,
  ));
});

test("PokéFiles resolves exact ordinary singles but not unproven stamped or staff artwork", () => {
  const ordinary = match();
  const staff = match({ sku: "staff", name: "Dhelmise - 084 [Staff]" });
  const stamped = match({ sku: "stamped", name: "Dhelmise - 084 (Pitch Black Stamped)" });
  const artwork = resolvePokefilesArtwork([ordinary, staff, stamped], [card()]);
  assert.ok(artwork[ordinary.sku]);
  assert.equal(artwork[staff.sku], undefined);
  assert.equal(artwork[stamped.sku], undefined);
});

test("PokéFiles accepts a material promo only when the source record names that material artwork", () => {
  const staff = match({ sku: "staff", name: "Dhelmise - 084 [Staff]" });
  const artwork = resolvePokefilesArtwork([staff], [card({ name: "Dhelmise - 084 [Staff]" })]);
  assert.ok(artwork.staff);
});

test("sealed product classes reject cases and distinguish high-value package forms", () => {
  assert.equal(classifySealedProduct("Celebrations Elite Trainer Box"), "ELITE_TRAINER_BOX");
  assert.equal(classifySealedProduct("Surging Sparks Booster Bundle"), "BOOSTER_BUNDLE");
  assert.equal(classifySealedProduct("sv3pt5/mini-tins/dragonite.png"), "MINI_TIN");
  assert.equal(classifySealedProduct("dp1/tins/dpp-DP09.webp"), "TIN");
  assert.equal(classifySealedProduct("dp1/decks/DP1_Inferno_Zone_Deck.jpg"), "THEME_DECK");
  assert.equal(classifySealedProduct("sv7/sleeved_booster.png"), "BOOSTER_PACK");
  assert.equal(classifySealedProduct("me2/display-18.png"), "HALF_BOOSTER_BOX");
  assert.equal(classifySealedProduct("Phantasmal Flames Booster Box"), "BOOSTER_BOX");
  assert.equal(classifySealedProduct("Celebrations Collection Case"), "UNKNOWN");
});

test("ptcg-assets resolves a unique set and class but quarantines multiple booster wrappers", () => {
  const source = (path: string) => `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${"a".repeat(40)}/${path}`;
  const assets: PtcgAssetCandidate[] = [
    { bytes: 10, descriptors: [], path: "base1/display.png", productClass: "BOOSTER_BOX", setId: "base1", sourceUrl: source("base1/display.png") },
    { bytes: 10, descriptors: ["charizard"], path: "base1/packshots/charizard.png", productClass: "BOOSTER_PACK", setId: "base1", sourceUrl: source("base1/packshots/charizard.png") },
    { bytes: 10, descriptors: ["venusaur"], path: "base1/packshots/venusaur.png", productClass: "BOOSTER_PACK", setId: "base1", sourceUrl: source("base1/packshots/venusaur.png") },
  ];
  const box = match({ sku: "box", productType: "SEALED", name: "Base Set Booster Box", setName: "Base Set", collectorNumber: null, variant: "Sealed" });
  const pack = match({ sku: "pack", productType: "SEALED", name: "Base Set Booster Pack", setName: "Base Set", collectorNumber: null, variant: "Sealed" });
  const result = resolvePtcgAssetsArtwork([box, pack], {
    assets,
    sets: [{ id: "base1", name: "Base Set", ptcgoCode: "BS", series: "Base" }],
  });
  assert.ok(result.artwork.box);
  assert.equal(result.artwork.pack, undefined);
  assert.equal(result.ambiguous.some((item) => item.sku === "pack"), true);
});

test("ptcg-assets maps generation-coded Celebrations mini tins to distinct regional catalogue identities", () => {
  const sha = "a".repeat(40);
  const regions = ["Kanto", "Johto", "Hoenn", "Sinnoh", "Unova", "Kalos", "Alola", "Galar"];
  const products = regions.map((region) => match({
    sku: region.toLowerCase(),
    productType: "SEALED",
    name: `Celebrations Mini Tin [${region}]`,
    setName: "Celebrations",
    collectorNumber: null,
  }));
  const display = match({
    sku: "display",
    productType: "SEALED",
    name: "Celebrations Mini Tin Display",
    setName: "Celebrations",
    collectorNumber: null,
  });
  const assets: PtcgAssetCandidate[] = regions.map((_, index) => ({
    bytes: 10,
    descriptors: [`gen${index + 1}`],
    path: `cel25/mini-tins/gen${index + 1}.png`,
    productClass: "MINI_TIN",
    setId: "cel25",
    sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/cel25/mini-tins/gen${index + 1}.png`,
  }));
  const result = resolvePtcgAssetsArtwork([...products, display], {
    assets,
    sets: [{ id: "cel25", name: "Celebrations", ptcgoCode: "CEL", series: "Sword & Shield" }],
  });
  regions.forEach((region, index) => {
    assert.match(result.artwork[region.toLowerCase()].small ?? "", new RegExp(`/gen${index + 1}\\.png$`));
  });
  assert.equal(result.artwork.display, undefined);
  assert.equal(result.ambiguous.some((item) => item.sku === "display"), true);
});

test("ptcg-assets keeps era-specific base sets separate from the original Base Set", () => {
  const sha = "a".repeat(40);
  const result = resolvePtcgAssetsArtwork([
    match({ sku: "sun-moon", productType: "SEALED", name: "Sun & Moon Booster Box", setName: "SM Base Set", collectorNumber: null }),
  ], {
    assets: [
      { bytes: 10, descriptors: [], path: "base1/display.png", productClass: "BOOSTER_BOX", setId: "base1", sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/base1/display.png` },
      { bytes: 10, descriptors: [], path: "sm1/display.png", productClass: "BOOSTER_BOX", setId: "sm1", sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/sm1/display.png` },
    ],
    sets: [
      { id: "base1", name: "Base", ptcgoCode: "BS", series: "Base" },
      { id: "sm1", name: "Sun & Moon", ptcgoCode: "SUM", series: "Sun & Moon" },
    ],
  });
  assert.match(result.artwork["sun-moon"].small ?? "", /\/sm1\/display\.png$/);
});

test("ptcg-assets normalizes exact modern base and 151 catalogue labels", () => {
  const sha = "a".repeat(40);
  const result = resolvePtcgAssetsArtwork([
    match({ sku: "sv-base", productType: "SEALED", name: "Scarlet & Violet Booster Box", setName: "SV01: Scarlet & Violet Base Set", collectorNumber: null }),
    match({ sku: "151", productType: "SEALED", name: "151 Booster Bundle", setName: "SV: Scarlet & Violet 151", collectorNumber: null }),
  ], {
    assets: [
      { bytes: 10, descriptors: [], path: "sv1/display.png", productClass: "BOOSTER_BOX", setId: "sv1", sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/sv1/display.png` },
      { bytes: 10, descriptors: [], path: "sv3pt5/booster-bundle.png", productClass: "BOOSTER_BUNDLE", setId: "sv3pt5", sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/sv3pt5/booster-bundle.png` },
    ],
    sets: [
      { id: "sv1", name: "Scarlet & Violet", ptcgoCode: "SVI", series: "Scarlet & Violet" },
      { id: "sv3pt5", name: "151", ptcgoCode: "MEW", series: "Scarlet & Violet" },
    ],
  });
  assert.match(result.artwork["sv-base"].small ?? "", /\/sv1\/display\.png$/);
  assert.match(result.artwork["151"].small ?? "", /\/sv3pt5\/booster-bundle\.png$/);
});

test("ptcg-assets uses exact embedded promo identity to resolve a named blister", () => {
  const sha = "a".repeat(40);
  const blister = match({
    sku: "pecharunt",
    productType: "SEALED",
    name: "Shrouded Fable 3 Pack Blister [Pecharunt]",
    setName: "SV: Shrouded Fable",
    collectorNumber: null,
  });
  const snapshot = {
    assets: [{
      bytes: 10,
      descriptors: [],
      path: "sv6pt5/triple-blister-svp-149.png",
      productClass: "BLISTER" as const,
      setId: "sv6pt5",
      sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/sv6pt5/triple-blister-svp-149.png`,
    }],
    sets: [{ id: "sv6pt5", name: "Shrouded Fable", ptcgoCode: "SFA", series: "Scarlet & Violet" }],
  };
  assert.equal(resolvePtcgAssetsArtwork([blister], snapshot).artwork.pecharunt, undefined);
  const result = resolvePtcgAssetsArtwork([blister], snapshot, [card({
    id: "pokefiles:svp-149",
    name: "Pecharunt",
    set: "Scarlet & Violet Black Star Promos",
    setCode: "svp",
    number: "149",
  })]);
  assert.match(result.artwork.pecharunt.small ?? "", /triple-blister-svp-149\.png$/);
});

test("ptcg-assets may resolve a uniquely named mixed product without inventing a release set", () => {
  const sha = "a".repeat(40);
  const result = resolvePtcgAssetsArtwork([
    match({
      sku: "garchomp-box",
      productType: "SEALED",
      name: "Garchomp ex Box",
      setName: "Miscellaneous Cards & Products",
      collectorNumber: null,
    }),
  ], {
    assets: [{
      bytes: 10,
      descriptors: ["ex", "garchomp"],
      path: "mixed/collections/garchomp-ex-box.png",
      productClass: "COLLECTION",
      setId: "mixed",
      sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/mixed/collections/garchomp-ex-box.png`,
    }],
    sets: [{ id: "mixed", name: "Miscellaneous Cards & Products", ptcgoCode: null, series: "Mixed Products" }],
  });
  assert.match(result.artwork["garchomp-box"].small ?? "", /garchomp-ex-box\.png$/);
});

test("ptcg-assets may use one exact mixed filename for a set-labelled product", () => {
  const sha = "a".repeat(40);
  const result = resolvePtcgAssetsArtwork([
    match({
      sku: "151-binder",
      productType: "SEALED",
      name: "151 Binder Collection",
      setName: "SV: Scarlet & Violet 151",
      collectorNumber: null,
    }),
  ], {
    assets: [{
      bytes: 10,
      descriptors: ["151", "binder"],
      path: "mixed/sv/collections/151_Binder_Collection.webp",
      productClass: "COLLECTION",
      setId: "mixed",
      sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/mixed/sv/collections/151_Binder_Collection.webp`,
    }],
    sets: [
      { id: "mixed", name: "Miscellaneous Cards & Products", ptcgoCode: null, series: "Mixed Products" },
      { id: "sv3pt5", name: "151", ptcgoCode: "MEW", series: "Scarlet & Violet" },
    ],
  });
  assert.match(result.artwork["151-binder"].small ?? "", /151_Binder_Collection\.webp$/);
});

test("ptcg-assets mixed filenames preserve year, set, and package-form distinctions", () => {
  const sha = "a".repeat(40);
  const result = resolvePtcgAssetsArtwork([
    match({ sku: "wrong-year", productType: "SEALED", name: "Fall 2018 Collector Chest", setName: "SM - Lost Thunder", collectorNumber: null }),
    match({ sku: "wrong-set", productType: "SEALED", name: "30th Celebration Binder Collection", setName: "ME: 30th Celebration", collectorNumber: null }),
    match({ sku: "wrong-package", productType: "SEALED", name: "Tyranitar ex Box", setName: "Miscellaneous Cards & Products", collectorNumber: null }),
  ], {
    assets: [
      { bytes: 10, descriptors: ["2024", "fall"], path: "mixed/sv/collections/Fall_2024_Collector_Chest.webp", productClass: "CHEST", setId: "mixed", sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/mixed/sv/collections/Fall_2024_Collector_Chest.webp` },
      { bytes: 10, descriptors: ["151", "binder"], path: "mixed/sv/collections/151_Binder_Collection.webp", productClass: "COLLECTION", setId: "mixed", sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/mixed/sv/collections/151_Binder_Collection.webp` },
      { bytes: 10, descriptors: ["ex", "premium", "tyranitar"], path: "mixed/sv/collections/Tyranitar_ex_Premium_Collection.webp", productClass: "COLLECTION", setId: "mixed", sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/mixed/sv/collections/Tyranitar_ex_Premium_Collection.webp` },
    ],
    sets: [
      { id: "mixed", name: "Miscellaneous Cards & Products", ptcgoCode: null, series: "Mixed Products" },
      { id: "sm8", name: "Lost Thunder", ptcgoCode: "LOT", series: "Sun & Moon" },
      { id: "me6pt5", name: "30th Celebration", ptcgoCode: null, series: "Mega Evolution" },
    ],
  });
  assert.equal(result.artwork["wrong-year"], undefined);
  assert.equal(result.artwork["wrong-set"], undefined);
  assert.equal(result.artwork["wrong-package"], undefined);
});

test("ptcg-assets exact same-set filenames may ignore explicit component suffixes", () => {
  const sha = "a".repeat(40);
  const result = resolvePtcgAssetsArtwork([
    match({ sku: "morpeko", productType: "SEALED", name: "Morpeko V-UNION Playmat Premium Collection", setName: "SWSH: Crown Zenith", collectorNumber: null }),
  ], {
    assets: [{
      bytes: 10,
      descriptors: ["morpeko", "playmat", "union"],
      path: "swsh12pt5/collections/morpeko-v-union-premium-playmat-collection+swshp-SWSH287+5.png",
      productClass: "COLLECTION",
      setId: "swsh12pt5",
      sourceUrl: `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/swsh12pt5/collections/morpeko-v-union-premium-playmat-collection+swshp-SWSH287+5.png`,
    }],
    sets: [{ id: "swsh12pt5", name: "Crown Zenith", ptcgoCode: "CRZ", series: "Sword & Shield" }],
  });
  assert.match(result.artwork.morpeko.small ?? "", /morpeko-v-union-premium-playmat-collection/);
});

test("community persistence preserves valid same-identity provider evidence and repairs stale identity", () => {
  const repository = new PricingRepository();
  repository.database.prepare(`
    INSERT INTO pricing_products(category_id, sku, product_type, name, set_name, collector_number, variant, language, image_url)
    VALUES('pokemon-en', 'sku', 'SINGLE', 'Pikachu', 'Base Set', '58', 'Normal', 'English', NULL)
  `).run();
  let candidate = repository.findBySku("pokemon-en", "sku");
  assert.ok(candidate);
  repository.saveArtworkResolutions([candidate], { sku: { small: "https://assets.tcgdex.net/a.png" } }, "tcgdex");
  assert.equal(repository.saveMissingArtworkResolutions(
    [candidate],
    { sku: { small: "https://images.pokemontcg.io/base1/58.png" } },
    "pokefiles",
  ), 0);
  assert.equal((repository.database.prepare("SELECT provider_id FROM pricing_artwork_resolutions WHERE sku='sku'").get() as { provider_id: string }).provider_id, "tcgdex");

  repository.database.prepare("UPDATE pricing_products SET collector_number='59' WHERE sku='sku'").run();
  candidate = repository.findBySku("pokemon-en", "sku");
  assert.ok(candidate);
  assert.equal(repository.saveMissingArtworkResolutions(
    [candidate],
    { sku: { small: "https://images.pokemontcg.io/base1/59.png" } },
    "pokefiles",
  ), 1);
  assert.equal((repository.database.prepare("SELECT provider_id FROM pricing_artwork_resolutions WHERE sku='sku'").get() as { provider_id: string }).provider_id, "pokefiles");
  repository.close();
});
