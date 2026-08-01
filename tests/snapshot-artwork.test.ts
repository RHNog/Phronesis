import assert from "node:assert/strict";
import test from "node:test";
import { providerArtworkQueries, providerArtworkQuery, resolveOnePieceSnapshotArtwork, resolveSnapshotArtwork } from "../lib/pricing/artwork";
import { artworkIdentityName } from "../lib/pricing/domain";
import type { SearchMatch } from "../lib/pricing/types";
import type { Card } from "../types/card";

function match(overrides: Partial<SearchMatch> = {}): SearchMatch {
  return {
    categoryId: "magic-en",
    sku: "snapshot:bolt",
    productType: "SINGLE",
    name: "Lightning Bolt",
    setName: "Magic 2010 (M10)",
    collectorNumber: "146",
    variant: "Normal",
    language: "English",
    imageUrl: null,
    score: 100,
    prices: {},
    sealedPrice: null,
    previousMarketPriceCents: null,
    previousSnapshotDate: null,
    ...overrides,
  };
}

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "scryfall:bolt",
    name: "Lightning Bolt",
    game: "Magic",
    set: "Magic 2010",
    number: "146",
    rarity: "Common",
    finish: "Normal",
    imageUrl: "https://cards.scryfall.io/normal/front/a/b/bolt.jpg",
    imageUrls: { small: "https://cards.scryfall.io/small/front/a/b/bolt.jpg" },
    ...overrides,
  };
}

test("snapshot artwork resolves a verified set and collector-number match", () => {
  const artwork = resolveSnapshotArtwork([match()], [card()]);
  assert.equal(artwork["snapshot:bolt"].small, "https://cards.scryfall.io/small/front/a/b/bolt.jpg");
});

test("provider discovery removes bounded commerce collector suffixes without erasing card subtitles", () => {
  assert.equal(artworkIdentityName("Mega Dragonite ex - 152/217"), "Mega Dragonite ex");
  assert.equal(artworkIdentityName("Monkey.D.Luffy (Alternate Art) - OP01-003"), "Monkey.D.Luffy (Alternate Art)");
  assert.equal(artworkIdentityName("Mulan - Resourceful Recruit"), "Mulan - Resourceful Recruit");
  const dragonite = match({
    categoryId: "pokemon-en",
    name: "Mega Dragonite ex - 152/217",
    setName: "ME: Ascended Heroes",
    collectorNumber: "152/217",
  });
  assert.deepEqual(providerArtworkQueries("pokemon-en", "Mega Dragonite", [dragonite]), ["Mega Dragonite ex"]);
});

test("Magic artwork queries exact visible names and tolerates unique provider set-label drift", () => {
  const storePromo = match({
    name: "Urza's Saga",
    setName: "Game Day & Store Championship Promos",
    collectorNumber: "29",
    sku: "tcg:store-promo",
    variant: "Foil",
  });
  assert.deepEqual(
    providerArtworkQueries("magic-en", "urza's saga store", [storePromo]),
    ["Urza's Saga"],
  );
  const artwork = resolveSnapshotArtwork(
    [storePromo],
    [card({
      id: "scryfall:store-promo",
      name: "Urza's Saga",
      set: "Store Championships 2024",
      number: "29",
      imageUrls: { small: "https://cards.scryfall.io/small/front/store-promo.jpg" },
    })],
  );
  assert.equal(artwork[storePromo.sku].small, "https://cards.scryfall.io/small/front/store-promo.jpg");
  assert.deepEqual(
    resolveSnapshotArtwork([storePromo], [
      card({ id: "first", name: "Urza's Saga", set: "Store Championships 2024", number: "29" }),
      card({ id: "second", name: "Urza's Saga", set: "Other Promo", number: "29" }),
    ]),
    {},
  );
});

test("provider artwork query expands the first exact Lorcana result without punctuation that Lorcast treats as syntax", () => {
  const matches = [match({
    categoryId: "lorcana-en",
    name: "Mulan - Resourceful Recruit",
    setName: "Winterspell",
    collectorNumber: "69/204",
  })];
  assert.equal(providerArtworkQuery("lorcana-en", "Mulan - res", matches), "Mulan Resourceful Recruit");
  assert.equal(providerArtworkQuery("magic-en", "Mox Opal", matches), "Mox Opal");
});

test("snapshot artwork tolerates presentation-only name differences when printing identity is unique", () => {
  const artwork = resolveSnapshotArtwork(
    [match({ name: "Lightning Bolt (Showcase)", setName: "Commander Set (CMD)", collectorNumber: "401" })],
    [card({ name: "Lightning Bolt", set: "Commander Set", number: "401" })],
  );
  assert.ok(artwork["snapshot:bolt"]);
});

test("snapshot artwork normalizes catalogue set prefixes and printed collector totals", () => {
  const artwork = resolveSnapshotArtwork(
    [match({ name: "Charizard", setName: "SWSH04: Vivid Voltage", collectorNumber: "025/185", categoryId: "pokemon-en" })],
    [card({ name: "Charizard", game: "Pokemon", set: "Vivid Voltage", number: "25" })],
  );
  assert.ok(artwork["snapshot:bolt"]);
});

test("Pokémon artwork uses explicit TCGplayer to TCGdex set aliases", () => {
  const cases = [
    ["SWSH01: Sword & Shield Base Set", "Sword & Shield"],
    ["XY Base Set", "XY"],
    ["XY Promos", "XY Black Star Promos"],
    ["EX Emerald", "Emerald"],
    ["EX FireRed & LeafGreen", "FireRed & LeafGreen"],
    ["EX Team Magma vs Team Aqua", "Team Magma vs Team Aqua"],
    ["SM - Cosmic Eclipse", "Cosmic Eclipse"],
    ["SM - Unbroken Bonds", "Unbroken Bonds"],
    ["Legendary Treasures: Radiant Collection", "Legendary Treasures"],
    ["SV: Scarlet & Violet 151", "151"],
    ["SV: Scarlet & Violet Promo Cards", "SVP Black Star Promos"],
    ["Diamond and Pearl Promos", "DP Black Star Promos"],
    ["SWSH: Sword & Shield Promo Cards", "SWSH Black Star Promos"],
    ["Black and White Promos", "BW Black Star Promos"],
    ["HGSS Promos", "HGSS Black Star Promos"],
    ["Nintendo Promos", "Nintendo Black Star Promos"],
    ["WoTC Promo", "Wizards Black Star Promos"],
    ["ME: Mega Evolution Promo", "MEP Black Star Promos"],
    ["EX Dragon Frontiers", "Dragon Frontiers"],
    ["XY - Primal Clash", "Primal Clash"],
    ["SM - Team Up", "Team Up"],
  ] as const;

  for (const [catalogueSet, providerSet] of cases) {
    const artwork = resolveSnapshotArtwork(
      [match({
        categoryId: "pokemon-en",
        name: "Pikachu",
        setName: catalogueSet,
        collectorNumber: "025/100",
      })],
      [card({
        game: "Pokemon",
        name: "Pikachu",
        set: providerSet,
        number: "25",
        imageUrls: { small: `https://assets.tcgdex.net/en/test/${encodeURIComponent(providerSet)}/high.webp` },
      })],
    );
    assert.ok(artwork["snapshot:bolt"], `${catalogueSet} should match ${providerSet}`);
  }
});

test("Pokémon set aliases do not weaken collector-number or ambiguity checks", () => {
  const pokemonMatch = match({
    categoryId: "pokemon-en",
    name: "Pikachu",
    setName: "XY Base Set",
    collectorNumber: "42/146",
  });
  assert.deepEqual(
    resolveSnapshotArtwork([pokemonMatch], [card({
      game: "Pokemon",
      name: "Pikachu",
      set: "XY",
      number: "43",
    })]),
    {},
  );
  assert.deepEqual(
    resolveSnapshotArtwork([pokemonMatch], [
      card({ game: "Pokemon", name: "Pikachu", set: "XY", number: "42", id: "first" }),
      card({ game: "Pokemon", name: "Pikachu", set: "XY", number: "42", id: "second" }),
    ]),
    {},
  );
});

test("Pokémon artwork accepts normalized set conventions but not unrelated special-product sets", () => {
  const dragonite = match({
    categoryId: "pokemon-en",
    name: "Mega Dragonite ex - 152/217",
    setName: "ME: Ascended Heroes",
    collectorNumber: "152/217",
  });
  const unique = card({
    id: "me02.5-152",
    game: "Pokemon",
    name: "Mega Dragonite ex",
    set: "Ascended Heroes",
    number: "152",
    imageUrls: { small: "https://assets.tcgdex.net/en/me/me02.5/152/low.webp" },
  });
  assert.equal(resolveSnapshotArtwork([dragonite], [unique])[dragonite.sku].small, unique.imageUrls?.small);
  assert.deepEqual(resolveSnapshotArtwork([{ ...dragonite, setName: "Prize Pack Series Cards" }], [unique]), {});
});

test("snapshot artwork does not guess across ambiguous or mismatched printings", () => {
  assert.deepEqual(resolveSnapshotArtwork([match()], [card({ number: "147" })]), {});
  assert.deepEqual(
    resolveSnapshotArtwork(
      [match({ collectorNumber: null })],
      [card(), card({ id: "other", number: "147" })],
    ),
    {},
  );
  assert.deepEqual(resolveSnapshotArtwork([match({ productType: "SEALED" })], [card()]), {});
  assert.deepEqual(
    resolveSnapshotArtwork(
      [match({ name: "Charizard", setName: "Base Set (Shadowless)", collectorNumber: "004/102", categoryId: "pokemon-en" })],
      [card({ name: "Charizard", game: "Pokemon", set: "Base Set", number: "4" })],
    ),
    {},
  );
});

test("One Piece artwork selects base, unique parallel, and explicit SP without guessing qualifiers", () => {
  const cards = [
    card({ id: "base", game: "One Piece", name: "Monkey.D.Luffy", set: "-ROMANCE DAWN- [OP01]", number: "OP01-003", rarity: "L", providerIdentity: { providerId: "bandai-onepiece", providerRecordId: "OP01-003" } }),
    card({ id: "parallel", game: "One Piece", name: "Monkey.D.Luffy", set: "-ROMANCE DAWN- [OP01]", number: "OP01-003", rarity: "L", providerIdentity: { providerId: "bandai-onepiece", providerRecordId: "OP01-003_p1" }, imageUrls: { small: "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003_p1.png" } }),
    card({ id: "sp", game: "One Piece", name: "Uta", set: "-ONE PIECE HEROINES EDITION- [EB-03]", number: "EB03-003", rarity: "SP CARD", providerIdentity: { providerId: "bandai-onepiece", providerRecordId: "EB03-003_p2" }, imageUrls: { small: "https://en.onepiece-cardgame.com/images/cardlist/card/EB03-003_p2.png" } }),
  ];
  const base = resolveOnePieceSnapshotArtwork([match({ categoryId: "onepiece-en", sku: "base", name: "Monkey.D.Luffy (003)", setName: "Romance Dawn", collectorNumber: "OP01-003" })], cards);
  const parallel = resolveOnePieceSnapshotArtwork([match({ categoryId: "onepiece-en", sku: "parallel", name: "Monkey.D.Luffy (Alternate Art)", setName: "Romance Dawn", collectorNumber: "OP01-003" })], cards);
  const sp = resolveOnePieceSnapshotArtwork([match({ categoryId: "onepiece-en", sku: "sp", name: "Uta (SP)", setName: "Extra Booster: One Piece Heroines Edition", collectorNumber: "EB03-003" })], cards);
  const numberedSp = resolveOnePieceSnapshotArtwork([match({ categoryId: "onepiece-en", sku: "numbered-sp", name: "Uta (003) (SP)", setName: "Extra Booster: One Piece Heroines Edition", collectorNumber: "EB03-003" })], cards);
  const unknown = resolveOnePieceSnapshotArtwork([match({ categoryId: "onepiece-en", sku: "unknown", name: "Monkey.D.Luffy (Winner Pack)", setName: "Romance Dawn", collectorNumber: "OP01-003" })], cards);
  assert.ok(base.base);
  assert.equal(parallel.parallel.small, "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003_p1.png");
  assert.equal(sp.sp.small, "https://en.onepiece-cardgame.com/images/cardlist/card/EB03-003_p2.png");
  assert.equal(numberedSp["numbered-sp"].small, "https://en.onepiece-cardgame.com/images/cardlist/card/EB03-003_p2.png");
  assert.deepEqual(unknown, {});
});

test("One Piece discovery uses visible collector identities and rejects special-product fallback", () => {
  const baseMatch = match({
    categoryId: "onepiece-en",
    sku: "base",
    name: "Monkey.D.Luffy (003) - OP01-003",
    setName: "Romance Dawn",
    collectorNumber: "OP01-003",
  });
  assert.deepEqual(providerArtworkQueries("onepiece-en", "Luffy", [baseMatch]), ["OP01-003"]);
  const baseCard = card({
    id: "base",
    game: "One Piece",
    name: "Monkey.D.Luffy",
    set: "-ROMANCE DAWN- [OP01]",
    number: "OP01-003",
    rarity: "L",
    providerIdentity: { providerId: "bandai-onepiece", providerRecordId: "OP01-003" },
  });
  assert.ok(resolveOnePieceSnapshotArtwork([baseMatch], [baseCard]).base);
  assert.deepEqual(resolveOnePieceSnapshotArtwork([baseMatch], [
    baseCard,
    { ...baseCard, id: "duplicate", imageUrl: "https://example.test/duplicate.png" },
  ]), {});
  assert.deepEqual(resolveOnePieceSnapshotArtwork([{ ...baseMatch, name: "Monkey.D.Luffy - OP01-003 [Serial Number]", setName: "One Piece Promotion Cards" }], [baseCard]), {});
  assert.deepEqual(resolveOnePieceSnapshotArtwork([{ ...baseMatch, setName: "Romance Dawn Pre-Release Cards" }], [baseCard]), {});
});
