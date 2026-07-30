import type { ActiveListingEvidence } from "@/types/marketEvidence";

export type ListingProviderStatus = {
  configured: boolean;
  providerId: string;
  reason: string;
};

export interface OfficialListingProvider<TQuery> {
  readonly id: string;
  getStatus(): ListingProviderStatus;
  fetchActiveListings(query: TQuery): Promise<ActiveListingEvidence[]>;
}

export function assertBoundedLimit(limit: number | undefined, maximum: number): number {
  const resolved = limit ?? Math.min(10, maximum);
  if (!Number.isInteger(resolved) || resolved < 1 || resolved > maximum) {
    throw new Error(`Listing limit must be between 1 and ${maximum}.`);
  }
  return resolved;
}

export function cents(value: unknown): number | null {
  const numeric = typeof value === "string" || typeof value === "number" ? Number(value) : NaN;
  return Number.isFinite(numeric) && numeric >= 0 ? Math.round(numeric * 100) : null;
}
