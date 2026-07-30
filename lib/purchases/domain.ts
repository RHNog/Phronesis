export const PURCHASE_PRODUCT_LINES = ["MAGIC", "POKEMON", "ONE_PIECE", "LORCANA"] as const;
export type PurchaseProductLine = (typeof PURCHASE_PRODUCT_LINES)[number];

export type ExactPurchaseLineDraft = {
  kind: "EXACT";
  categoryId: string;
  sku: string;
  condition: string;
  quantity: number;
  actualPaidCents: number;
  recommendedOfferCents: number | null;
  marketReferenceCents: number | null;
  snapshotDate: string | null;
  notes?: string;
};

export type BulkPurchaseLineDraft = {
  kind: "BULK";
  productLines: PurchaseProductLine[];
  actualPaidCents: number;
  notes: string;
  approximateQuantity?: number | null;
  approximateWeight?: string | null;
};

export type PurchaseLineDraft = ExactPurchaseLineDraft | BulkPurchaseLineDraft;

export type ExactPurchaseLine = ExactPurchaseLineDraft & {
  id: string;
  name: string;
  setName: string;
  collectorNumber: string | null;
  variant: string;
  language: string;
  productType: "SINGLE" | "SEALED";
};

export type BulkPurchaseLine = BulkPurchaseLineDraft & { id: string };
export type PurchaseLine = ExactPurchaseLine | BulkPurchaseLine;

export type PurchaseEvent = {
  id: string;
  name: string;
  eventDate: string;
  location: string | null;
  budgetCents: number | null;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
};

export type PurchaseReceipt = {
  id: string;
  eventId: string;
  operatorUserId: string;
  totalCents: number;
  createdAt: string;
  voidedAt: string | null;
  lines: PurchaseLine[];
};

export type PurchasePrincipal = { workspaceId: string; operatorUserId: string };

export function validatePurchaseLineDraft(value: unknown): PurchaseLineDraft {
  if (!value || typeof value !== "object") throw new Error("Purchase line is required.");
  const item = value as Record<string, unknown>;
  const paid = Number(item.actualPaidCents);
  if (!Number.isInteger(paid) || paid < 0) throw new Error("Actual paid amount must be a non-negative cent value.");
  if (item.kind === "BULK") {
    if (!Array.isArray(item.productLines)) throw new Error("Bulk requires at least one product line.");
    const productLines = [...new Set(item.productLines)] as PurchaseProductLine[];
    if (!productLines.length || productLines.some((line) => !PURCHASE_PRODUCT_LINES.includes(line))) {
      throw new Error("Bulk contains an unsupported product line.");
    }
    const notes = typeof item.notes === "string" ? item.notes.trim() : "";
    if (!notes) throw new Error("Bulk notes are required.");
    const approximateQuantity = item.approximateQuantity === undefined || item.approximateQuantity === null || item.approximateQuantity === ""
      ? null
      : Number(item.approximateQuantity);
    if (approximateQuantity !== null && (!Number.isInteger(approximateQuantity) || approximateQuantity <= 0)) {
      throw new Error("Approximate quantity must be a positive whole number.");
    }
    return {
      kind: "BULK",
      actualPaidCents: paid,
      productLines,
      notes,
      approximateQuantity,
      approximateWeight: typeof item.approximateWeight === "string" ? item.approximateWeight.trim() || null : null,
    };
  }
  if (item.kind !== "EXACT" || typeof item.categoryId !== "string" || typeof item.sku !== "string") {
    throw new Error("Exact purchase identity is invalid.");
  }
  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) throw new Error("Quantity must be between 1 and 1000.");
  const nullableCents = (candidate: unknown) => {
    if (candidate === null || candidate === undefined) return null;
    const parsed = Number(candidate);
    if (!Number.isInteger(parsed) || parsed < 0) throw new Error("Evidence amount is invalid.");
    return parsed;
  };
  return {
    kind: "EXACT",
    categoryId: item.categoryId,
    sku: item.sku,
    condition: typeof item.condition === "string" ? item.condition.trim() : "Unopened",
    quantity,
    actualPaidCents: paid,
    recommendedOfferCents: nullableCents(item.recommendedOfferCents),
    marketReferenceCents: nullableCents(item.marketReferenceCents),
    snapshotDate: typeof item.snapshotDate === "string" ? item.snapshotDate : null,
    notes: typeof item.notes === "string" ? item.notes.trim() || undefined : undefined,
  };
}
