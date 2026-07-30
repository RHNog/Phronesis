import assert from "node:assert/strict";
import test from "node:test";
import { providerArtworkQuery, resolveOnePieceSnapshotArtwork, resolveSnapshotArtwork } from "../lib/pricing/artwork";
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
  const unknown = resolveOnePieceSnapshotArtwork([match({ categoryId: "onepiece-en", sku: "unknown", name: "Monkey.D.Luffy (Winner Pack)", setName: "Romance Dawn", collectorNumber: "OP01-003" })], cards);
  assert.ok(base.base);
  assert.equal(parallel.parallel.small, "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003_p1.png");
  assert.equal(sp.sp.small, "https://en.onepiece-cardgame.com/images/cardlist/card/EB03-003_p2.png");
  assert.deepEqual(unknown, {});
});
