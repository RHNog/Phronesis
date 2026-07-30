export type MarketEvidenceType = "MARKET_ESTIMATE" | "ACTIVE_LISTING" | "OBSERVED_SALE";

export type MarketEvidenceRecord = {
  id: string;
  entryId: string;
  evidenceType: MarketEvidenceType;
  providerId: string;
  title: string | null;
  priceCents: number;
  shippingCents: number | null;
  currency: string;
  condition: string | null;
  quantity: number;
  observedAt: string;
  sourceUrl: string | null;
  provenance: string;
  createdAt: string;
};

export type ActiveListingEvidence = Omit<
  MarketEvidenceRecord,
  "createdAt" | "entryId" | "evidenceType" | "id" | "provenance"
> & {
  externalId: string;
};
