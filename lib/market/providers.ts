export const MARKET_PROVIDERS = [
  {
    id: "tcgplayer",
    label: "TCGplayer",
    description: "US raw-card market, listing, delivered, and Direct Low evidence.",
    categoryIds: ["magic-en", "pokemon-en", "onepiece-en", "lorcana-en"] as const,
  },
  {
    id: "ligamagic",
    label: "LigaMagic",
    description: "Brazilian Magic retail and dealer-buy benchmarks.",
    categoryIds: ["magic-en"] as const,
  },
  {
    id: "ligapokemon",
    label: "LigaPokémon",
    description: "Brazilian Pokémon retail and dealer-buy benchmarks.",
    categoryIds: ["pokemon-en"] as const,
  },
  {
    id: "pricecharting",
    label: "PriceCharting",
    description: "Optional imported graded and ungraded price-guide evidence.",
    categoryIds: ["magic-en", "pokemon-en", "onepiece-en"] as const,
  },
] as const;

export type MarketProviderId = (typeof MARKET_PROVIDERS)[number]["id"];

export const MARKET_PROVIDER_IDS = MARKET_PROVIDERS.map(
  (provider) => provider.id,
) as readonly MarketProviderId[];

export function isMarketProviderId(value: unknown): value is MarketProviderId {
  return MARKET_PROVIDER_IDS.includes(value as MarketProviderId);
}

export function marketProviderAppliesToCategory(
  providerId: MarketProviderId,
  categoryId: string,
): boolean {
  const provider = MARKET_PROVIDERS.find(
    (candidate) => candidate.id === providerId,
  );
  return Boolean(
    (provider?.categoryIds as readonly string[] | undefined)?.includes(
      categoryId,
    ),
  );
}
