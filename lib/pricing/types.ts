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
  sourceSku?: string;
  productType: ProductType;
  name: string;
  setName: string;
  collectorNumber: string | null;
  variant: string;
  language: string;
  condition: PricingCondition | null;
  marketPriceCents: number | null;
  directLowCents?: number | null;
  listingPriceCents: number | null;
  shippingCents: number | null;
  shippingSource: ShippingSource;
  exportedDeliveredPriceCents?: number | null;
  snapshotDate: string;
  imageUrl: string | null;
};

export type PriceState = Pick<
  NormalizedPricingRow,
  | "marketPriceCents"
  | "directLowCents"
  | "listingPriceCents"
  | "shippingCents"
  | "shippingSource"
  | "snapshotDate"
> & {
  deliveredPriceCents: number | null;
  sourceSku?: string | null;
  previousMarketPriceCents?: number | null;
  previousSnapshotDate?: string | null;
};

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

export type PricingSearchInterpretation = {
  input: string;
  canonical: string;
  message: string;
};

export type CategoryFreshness = {
  categoryId: string;
  label: string;
  snapshotDate: string | null;
  stale: boolean;
  loaded: boolean;
  importedAt?: string | null;
  checkpointAt?: string | null;
  sourceSchemaVersion?: string | null;
  syncStatus?: PricingSyncStatus | null;
  lastError?: string | null;
};

export type PricingSyncStatus =
  | "IDLE"
  | "IMPORTING"
  | "CURRENT"
  | "DUPLICATE"
  | "FAILED";

export type PricingSyncState = {
  categoryId: string;
  status: PricingSyncStatus;
  checkpointAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  sourceHash: string | null;
  sourcePath: string | null;
  rowsRead: number | null;
  productsUpserted: number | null;
  snapshotsInserted: number | null;
  lastError: string | null;
};

export type PricingSearchResponse = {
  query: string;
  interpretations?: PricingSearchInterpretation[];
  category: CategoryFreshness;
  sealed: SearchMatch[];
  singles: SearchMatch[];
  sealedSuppressed: boolean;
};

export type UnifiedPricingSearchResponse = {
  query: string;
  interpretations?: PricingSearchInterpretation[];
  categories: CategoryFreshness[];
  sealed: SearchMatch[];
  singles: SearchMatch[];
  sealedSuppressed: boolean;
};

export type ArtworkSearchGroup = {
  id: string;
  categoryId: string;
  productType: ProductType;
  name: string;
  setName: string;
  collectorNumber: string | null;
  language: string;
  imageUrl: string | null;
  score: number;
  variants: SearchMatch[];
};
