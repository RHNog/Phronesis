export type PricingCategory = {
  id: string;
  label: string;
  language: string;
  active: boolean;
};

export const pricingLookupConfig = {
  categories: [
    {
      id: "pokemon-en",
      label: "English Pokémon",
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
  sealedRelevanceThreshold: 36,
  // Designer direction requires two relevant sealed matches before the compact
  // expander; additional matches remain one explicit tap away.
  mobileSealedPreviewCount: 2,
} as const;

export function getActivePricingCategory(id: string): PricingCategory | undefined {
  return pricingLookupConfig.categories.find(
    (category) => category.id === id && category.active,
  );
}
