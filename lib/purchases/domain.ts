export const PURCHASE_PRODUCT_LINES = [
  "MAGIC",
  "POKEMON",
  "ONE_PIECE",
  "LORCANA",
] as const;
export type PurchaseProductLine = (typeof PURCHASE_PRODUCT_LINES)[number];

export const EVENT_CURRENCIES = ["USD", "BRL"] as const;
export type EventCurrency = (typeof EVENT_CURRENCIES)[number];

export const EVENT_PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "TRANSFER",
  "OTHER",
] as const;
export type EventPaymentMethod = (typeof EVENT_PAYMENT_METHODS)[number];

export type EventLedgerEntryType =
  "SALE" | "PURCHASE" | "CASH_ADJUSTMENT" | "REVERSAL";

export type EventSaleItemDraft = {
  description: string;
  quantity: number;
  inventoryItemId?: string;
  caseItemId?: string;
  productOwnerId?: string;
};

export type EventProductOwnerDraft = {
  name: string;
  reference?: string;
};

export type EventProductOwner = EventProductOwnerDraft & {
  id: string;
  eventId: string;
  position: number;
  createdAt: string;
};

export type EventSaleDraft = {
  amountCents: number;
  paymentMethod: EventPaymentMethod;
  items: EventSaleItemDraft[];
  notes?: string;
};

export type EventManualPurchaseDraft = {
  amountCents: number;
  paymentMethod: EventPaymentMethod;
  description?: string;
};

export type EventCashAdjustmentDraft = {
  amountCents: number;
  direction: "IN" | "OUT";
  reason: string;
};

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

export type PurchaseCartLineUpdate = {
  actualPaidCents: number;
  quantity: number | null;
};

export type PurchaseCasePlacementDraft = {
  lineId: string;
  quantity: number;
  salePriceCents: number;
};

export type PurchaseEvent = {
  id: string;
  name: string;
  eventDate: string;
  location: string | null;
  budgetCents: number | null;
  currency: EventCurrency | null;
  openingCashCents: number | null;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
  closedAt: string | null;
  closingCashCents: number | null;
  closingExpectedCashCents: number | null;
  closingVarianceCents: number | null;
  closedByUserId: string | null;
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

export type EventSaleItem = Omit<
  EventSaleItemDraft,
  "inventoryItemId" | "caseItemId" | "productOwnerId"
> & {
  position: number;
  inventoryItemId: string | null;
  caseItemId: string | null;
  unitListPriceCents: number | null;
  color: string | null;
  variation: string | null;
  productOwnerId: string | null;
  productOwnerName: string | null;
};

export type EventLedgerEntry = {
  id: string;
  eventId: string;
  operatorUserId: string;
  type: EventLedgerEntryType;
  paymentMethod: EventPaymentMethod;
  amountCents: number;
  cashEffectCents: number;
  description: string | null;
  items: EventSaleItem[];
  linkedReceiptId: string | null;
  reversalOfEntryId: string | null;
  reversedByEntryId: string | null;
  createdAt: string;
};

export type EventLedgerSummary = {
  openingCashCents: number | null;
  grossSalesCents: number;
  cashSalesCents: number;
  nonCashSalesCents: number;
  purchaseSpendCents: number;
  cashPurchaseCents: number;
  cashAdjustmentCents: number;
  expectedCashCents: number | null;
  netEventCashMovementCents: number;
  activeTransactionCount: number;
  closingCashCents: number | null;
  closingExpectedCashCents: number | null;
  closingVarianceCents: number | null;
};

export type EventLedgerSnapshot = {
  event: PurchaseEvent | null;
  productOwners: EventProductOwner[];
  summary: EventLedgerSummary | null;
  entries: EventLedgerEntry[];
  canStartNewEvent: boolean;
};

export type EventLedgerReportSummary = {
  event: PurchaseEvent;
  summary: EventLedgerSummary;
};

export type EventLedgerReportIndex = {
  reports: EventLedgerReportSummary[];
  truncated: boolean;
};

export function validateEventCurrency(value: unknown): EventCurrency {
  if (
    typeof value !== "string" ||
    !EVENT_CURRENCIES.includes(value as EventCurrency)
  ) {
    throw new Error("Event currency must be USD or BRL.");
  }
  return value as EventCurrency;
}

export function validateEventPaymentMethod(value: unknown): EventPaymentMethod {
  if (
    typeof value !== "string" ||
    !EVENT_PAYMENT_METHODS.includes(value as EventPaymentMethod)
  ) {
    throw new Error("A supported payment method is required.");
  }
  return value as EventPaymentMethod;
}

export function validateEventSaleDraft(value: unknown): EventSaleDraft {
  if (!value || typeof value !== "object")
    throw new Error("Sale details are required.");
  const input = value as Record<string, unknown>;
  const items = Array.isArray(input.items) ? input.items : [];
  if (items.length < 1 || items.length > 25) {
    throw new Error("A Sale requires between one and 25 sold items.");
  }
  return {
    amountCents: positiveCents(input.amountCents, "Sale amount"),
    paymentMethod: validateEventPaymentMethod(input.paymentMethod),
    items: items.map((item, index) => validateSaleItem(item, index)),
    notes: optionalText(input.notes, 500),
  };
}

export function validateEventProductOwnerDrafts(
  value: unknown,
): EventProductOwnerDraft[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 50) {
    throw new Error("An event can have at most 50 product owners.");
  }
  const seen = new Set<string>();
  return value.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object") {
      throw new Error(`Product owner ${index + 1} is invalid.`);
    }
    const input = candidate as Record<string, unknown>;
    const name = requiredText(
      input.name,
      `Product owner ${index + 1} name`,
      100,
    );
    const identity = name.toLocaleLowerCase("en-US");
    if (seen.has(identity)) {
      throw new Error(`Product owner names must be unique within the event.`);
    }
    seen.add(identity);
    return {
      name,
      reference: optionalText(input.reference, 120),
    };
  });
}

export function validateEventManualPurchaseDraft(
  value: unknown,
): EventManualPurchaseDraft {
  if (!value || typeof value !== "object") {
    throw new Error("Purchase details are required.");
  }
  const input = value as Record<string, unknown>;
  return {
    amountCents: positiveCents(input.amountCents, "Purchase amount"),
    paymentMethod: validateEventPaymentMethod(input.paymentMethod),
    description: optionalText(input.description, 240),
  };
}

export function validateEventCashAdjustmentDraft(
  value: unknown,
): EventCashAdjustmentDraft {
  if (!value || typeof value !== "object") {
    throw new Error("Cash adjustment details are required.");
  }
  const input = value as Record<string, unknown>;
  if (input.direction !== "IN" && input.direction !== "OUT") {
    throw new Error("Cash adjustment direction must be Cash in or Cash out.");
  }
  const reason = requiredText(input.reason, "Cash adjustment reason", 240);
  return {
    amountCents: positiveCents(input.amountCents, "Cash adjustment amount"),
    direction: input.direction,
    reason,
  };
}

export function validatePurchaseLineDraft(value: unknown): PurchaseLineDraft {
  if (!value || typeof value !== "object")
    throw new Error("Purchase line is required.");
  const item = value as Record<string, unknown>;
  const paid = Number(item.actualPaidCents);
  if (!Number.isSafeInteger(paid) || paid < 0)
    throw new Error("Actual paid amount must be a non-negative cent value.");
  if (item.kind === "BULK") {
    if (!Array.isArray(item.productLines))
      throw new Error("Bulk requires at least one product line.");
    const productLines = [
      ...new Set(item.productLines),
    ] as PurchaseProductLine[];
    if (
      !productLines.length ||
      productLines.some((line) => !PURCHASE_PRODUCT_LINES.includes(line))
    ) {
      throw new Error("Bulk contains an unsupported product line.");
    }
    const notes = typeof item.notes === "string" ? item.notes.trim() : "";
    if (!notes) throw new Error("Bulk notes are required.");
    const approximateQuantity =
      item.approximateQuantity === undefined ||
      item.approximateQuantity === null ||
      item.approximateQuantity === ""
        ? null
        : Number(item.approximateQuantity);
    if (
      approximateQuantity !== null &&
      (!Number.isInteger(approximateQuantity) || approximateQuantity <= 0)
    ) {
      throw new Error("Approximate quantity must be a positive whole number.");
    }
    return {
      kind: "BULK",
      actualPaidCents: paid,
      productLines,
      notes,
      approximateQuantity,
      approximateWeight:
        typeof item.approximateWeight === "string"
          ? item.approximateWeight.trim() || null
          : null,
    };
  }
  if (
    item.kind !== "EXACT" ||
    typeof item.categoryId !== "string" ||
    typeof item.sku !== "string"
  ) {
    throw new Error("Exact purchase identity is invalid.");
  }
  const quantity = Number(item.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 1000)
    throw new Error("Quantity must be between 1 and 1000.");
  const nullableCents = (candidate: unknown) => {
    if (candidate === null || candidate === undefined) return null;
    const parsed = Number(candidate);
    if (!Number.isSafeInteger(parsed) || parsed < 0)
      throw new Error("Evidence amount is invalid.");
    return parsed;
  };
  return {
    kind: "EXACT",
    categoryId: item.categoryId,
    sku: item.sku,
    condition:
      typeof item.condition === "string" ? item.condition.trim() : "Unopened",
    quantity,
    actualPaidCents: paid,
    recommendedOfferCents: nullableCents(item.recommendedOfferCents),
    marketReferenceCents: nullableCents(item.marketReferenceCents),
    snapshotDate:
      typeof item.snapshotDate === "string" ? item.snapshotDate : null,
    notes:
      typeof item.notes === "string"
        ? item.notes.trim() || undefined
        : undefined,
  };
}

export function validatePurchaseCartLineUpdate(
  value: unknown,
  kind: PurchaseLine["kind"],
): PurchaseCartLineUpdate {
  if (!value || typeof value !== "object") {
    throw new Error("Cart line changes are required.");
  }
  const input = value as Record<string, unknown>;
  const actualPaidCents = positiveCents(
    input.actualPaidCents,
    kind === "EXACT" ? "Unit purchase price" : "Bulk total paid",
  );
  if (kind === "EXACT") {
    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) {
      throw new Error("Quantity must be between 1 and 1000.");
    }
    return { actualPaidCents, quantity };
  }
  const quantity =
    input.quantity === undefined ||
    input.quantity === null ||
    input.quantity === ""
      ? null
      : Number(input.quantity);
  if (quantity !== null && (!Number.isSafeInteger(quantity) || quantity <= 0)) {
    throw new Error("Approximate quantity must be a positive whole number.");
  }
  return { actualPaidCents, quantity };
}

function positiveCents(value: unknown, label: string): number {
  const amount = Number(value);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error(`${label} must be a positive cent value.`);
  }
  return amount;
}

function requiredText(
  value: unknown,
  label: string,
  maximumLength: number,
): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`${label} is required.`);
  if (text.length > maximumLength) {
    throw new Error(`${label} cannot exceed ${maximumLength} characters.`);
  }
  return text;
}

function optionalText(
  value: unknown,
  maximumLength: number,
): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return undefined;
  if (text.length > maximumLength) {
    throw new Error(`Text cannot exceed ${maximumLength} characters.`);
  }
  return text;
}

function validateSaleItem(value: unknown, index: number): EventSaleItemDraft {
  if (!value || typeof value !== "object") {
    throw new Error(`Sold item ${index + 1} is invalid.`);
  }
  const input = value as Record<string, unknown>;
  const quantity = Number(input.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000) {
    throw new Error(
      `Sold item ${index + 1} quantity must be between 1 and 1,000.`,
    );
  }
  return {
    description: requiredText(
      input.description,
      `Sold item ${index + 1} description`,
      160,
    ),
    quantity,
    inventoryItemId: optionalText(input.inventoryItemId, 120),
    caseItemId: optionalText(input.caseItemId, 120),
    productOwnerId: optionalText(input.productOwnerId, 120),
  };
}
