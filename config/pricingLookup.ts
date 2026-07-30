export type PricingCategory = {
  id: string;
  label: string;
  language: string;
  active: boolean;
};

export const pricingLookupConfig = {
  categories: [
    {
      id: "magic-en",
      label: "Magic: The Gathering",
      language: "English",
      active: true,
    },
    {
      id: "pokemon-en",
      label: "English Pokémon",
      language: "English",
      active: true,
    },
    {
      id: "onepiece-en",
      label: "One Piece Card Game",
      language: "English",
      active: true,
    },
    {
      id: "lorcana-en",
      label: "Disney Lorcana",
      language: "English",
      active: true,
    },
    {
      id: "riftbound-en",
      label: "Riftbound",
      language: "English",
      active: true,
    },
  ] satisfies readonly PricingCategory[],
  defaultCondition: "LIGHTLY_PLAYED",
  staleAfterDays: 7,
  askingPricePercentageThresholdCents: 2_000,
  assumedSingleShippingCents: 127,
  minimumQueryLength: 2,
  resultLimit: 40,
  unifiedCandidateLimit: 160,
  sealedRelevanceThreshold: 36,
  // Designer direction requires two relevant sealed matches before the compact
  // expander; additional matches remain one explicit tap away.
  mobileSealedPreviewCount: 2,
  observerPollMilliseconds: 10_000,
} as const;

export function getActivePricingCategory(id: string): PricingCategory | undefined {
  return pricingLookupConfig.categories.find(
    (category) => category.id === id && category.active,
  );
}
