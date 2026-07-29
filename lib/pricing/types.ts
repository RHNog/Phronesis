export const conditionLadder = [
  "NEAR_MINT",
  "LIGHTLY_PLAYED",
  "MODERATELY_PLAYED",
  "HEAVILY_PLAYED",
  "DAMAGED",
] as const;

export type PricingCondition = (typeof conditionLadder)[number];
export type ProductType = "SINGLE" | "SEALED";
export type ShippingSource = "EXPORTED" | "ASSUMED" | "UNKNOWN";

export type NormalizedPricingRow = {
  categoryId: string;
  sku: string;
  productType: ProductType;
  name: string;
  setName: string;
  collectorNumber: string | null;
  variant: string;
  language: string;
  condition: PricingCondition | null;
  marketPriceCents: number | null;
  listingPriceCents: number | null;
  shippingCents: number | null;
  shippingSource: ShippingSource;
  snapshotDate: string;
  imageUrl: string | null;
};

export type PriceState = Pick<
  NormalizedPricingRow,
  | "marketPriceCents"
  | "listingPriceCents"
  | "shippingCents"
  | "shippingSource"
  | "snapshotDate"
> & { deliveredPriceCents: number | null };

export type SearchMatch = {
  categoryId: string;
  sku: string;
  productType: ProductType;
  name: string;
  setName: string;
  collectorNumber: string | null;
  variant: string;
  language: string;
  imageUrl: string | null;
  score: number;
  prices: Partial<Record<PricingCondition, PriceState>>;
  sealedPrice: PriceState | null;
  previousMarketPriceCents: number | null;
  previousSnapshotDate: string | null;
};

export type CategoryFreshness = {
  categoryId: string;
  label: string;
  snapshotDate: string | null;
  stale: boolean;
  loaded: boolean;
};

export type PricingSearchResponse = {
  query: string;
  category: CategoryFreshness;
  sealed: SearchMatch[];
  singles: SearchMatch[];
  sealedSuppressed: boolean;
};
