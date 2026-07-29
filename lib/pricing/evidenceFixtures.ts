import type { PriceState, PricingSearchResponse, SearchMatch } from "@/lib/pricing/types";

const exportedPrice = (listingPriceCents: number, shippingCents: number): PriceState => ({
  marketPriceCents: listingPriceCents + 500,
  listingPriceCents,
  shippingCents,
  shippingSource: "EXPORTED",
  deliveredPriceCents: listingPriceCents + shippingCents,
  snapshotDate: "2026-07-27",
});

const single = (sku: string, variant: string, listingPriceCents: number): SearchMatch => ({
  categoryId: "pokemon-en",
  sku,
  productType: "SINGLE",
  name: "Charizard ex",
  setName: "Scarlet & Violet—151",
  collectorNumber: "199/165",
  variant,
  language: "English",
  imageUrl: null,
  score: 100,
  prices: {
    NEAR_MINT: exportedPrice(listingPriceCents + 2_000, 127),
    LIGHTLY_PLAYED: {
      ...exportedPrice(listingPriceCents, 127),
      shippingSource: "ASSUMED",
    },
  },
  sealedPrice: null,
  previousMarketPriceCents: listingPriceCents - 500,
  previousSnapshotDate: "2026-07-20",
});

const sealed = (sku: string, name: string, price: PriceState): SearchMatch => ({
  categoryId: "pokemon-en",
  sku,
  productType: "SEALED",
  name,
  setName: "Scarlet & Violet—151",
  collectorNumber: null,
  variant: "Sealed",
  language: "English",
  imageUrl: null,
  score: 90,
  prices: {},
  sealedPrice: price,
  previousMarketPriceCents: null,
  previousSnapshotDate: null,
});

const category = {
  categoryId: "pokemon-en",
  label: "English Pokémon",
  snapshotDate: "2026-07-27",
  stale: false,
  loaded: true,
};

function withSnapshotDate(matches: SearchMatch[], snapshotDate: string): SearchMatch[] {
  return matches.map((match) => ({
    ...match,
    prices: Object.fromEntries(
      Object.entries(match.prices).map(([condition, price]) => [
        condition,
        { ...price, snapshotDate },
      ]),
    ),
    sealedPrice: match.sealedPrice
      ? { ...match.sealedPrice, snapshotDate }
      : null,
    previousSnapshotDate: null,
  }));
}

export function pricingEvidenceResponse(scenario: string): PricingSearchResponse {
  const unknownShipping: PriceState = {
    marketPriceCents: 4_500,
    listingPriceCents: 4_200,
    shippingCents: null,
    shippingSource: "UNKNOWN",
    deliveredPriceCents: null,
    snapshotDate: "2026-07-27",
  };
  const singles = [
    single("sv151-199-sir", "Special Illustration Rare", 9_500),
    single("sv151-199-reverse", "Reverse Holo", 3_800),
    single("sv151-199-holo", "Holo", 4_300),
  ];
  if (scenario === "single") {
    return { query: "Charizard 199/165", category, sealed: [], singles, sealedSuppressed: true };
  }
  if (scenario === "stale") {
    const snapshotDate = "2026-07-01";
    return {
      query: "Scarlet Violet 151",
      category: { ...category, stale: true, snapshotDate },
      sealed: [],
      singles: withSnapshotDate(singles, snapshotDate),
      sealedSuppressed: false,
    };
  }
  if (scenario === "missing") {
    const missing = { ...singles[0], prices: { ...singles[0].prices } };
    delete missing.prices.LIGHTLY_PLAYED;
    return { query: "Charizard", category, sealed: [], singles: [missing], sealedSuppressed: true };
  }
  if (scenario === "category-not-loaded") {
    return { query: "Charizard", category: { ...category, loaded: false, snapshotDate: null }, sealed: [], singles: [], sealedSuppressed: false };
  }
  if (scenario === "no-match" || scenario === "loading" || scenario === "error") {
    return { query: "Unknown product", category, sealed: [], singles: [], sealedSuppressed: false };
  }
  return {
    query: "Scarlet Violet 151",
    category,
    sealed: [
      sealed("sv151-bundle", "151 Booster Bundle", unknownShipping),
      sealed("sv151-etb", "151 Elite Trainer Box", exportedPrice(8_500, 800)),
      sealed("sv151-upc", "151 Ultra-Premium Collection", exportedPrice(12_000, 1_200)),
    ],
    singles,
    sealedSuppressed: false,
  };
}
