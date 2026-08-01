import type { EventStockSnapshot } from "@/lib/events/eventStock";
import type { PurchaseEvent } from "@/lib/purchases/domain";

export type EventFlipCandidate = {
  id: string;
  inventoryLotId: string;
  receiptId: string;
  name: string;
  setName: string | null;
  collectorNumber: string | null;
  variant: string | null;
  language: string | null;
  condition: string | null;
  categoryId: string;
  sku: string;
  acquiredQuantity: number;
  onHandQuantity: number;
  displayCaseQuantity: number;
  availableToFlipQuantity: number;
  unitCostCents: number;
  suggestedSalePriceCents: number | null;
  acquiredAt: string;
};

export type EventFlipBlockedItem = {
  id: string;
  source: "SEALED" | "BULK" | "MANUAL_PURCHASE";
  description: string;
  quantity: number | null;
  reason: string;
  createdAt: string;
};

export type EventFlipSnapshot = {
  event: PurchaseEvent | null;
  summary: {
    exactCardOptions: number;
    readyToFlipUnits: number;
    alreadyInCaseUnits: number;
    blockedOutcomes: number;
  };
  candidates: EventFlipCandidate[];
  blocked: EventFlipBlockedItem[];
};

export type EventFlipSelection = {
  inventoryLotId: string;
  quantity: number;
  salePriceCents: number;
};

export type DisplayCaseItem = {
  id: string;
  eventId: string;
  inventoryLotId: string;
  receiptId: string;
  name: string;
  setName: string | null;
  collectorNumber: string | null;
  variant: string | null;
  language: string | null;
  condition: string | null;
  categoryId: string;
  sku: string;
  currentSalePriceCents: number;
  unitCostCents: number;
  totalAddedQuantity: number;
  returnedQuantity: number;
  soldQuantity: number;
  expectedQuantity: number;
  countedQuantity: number | null;
  countVariance: number | null;
  lastCountedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DisplayCaseSourceSnapshot = {
  eventId: string;
  items: DisplayCaseItem[];
  query: string;
  resultCount: number;
  truncated: boolean;
  summary: {
    optionCount: number;
    totalAddedQuantity: number;
    returnedQuantity: number;
    soldQuantity: number;
    expectedQuantity: number;
    countedOptionCount: number;
    countedQuantity: number;
    varianceQuantity: number;
  };
};

export type DisplayCaseSnapshot = {
  event: PurchaseEvent | null;
  preparedStock: EventStockSnapshot | null;
  eventFlips: DisplayCaseSourceSnapshot | null;
  summary: {
    preparedExpectedQuantity: number;
    eventFlipExpectedQuantity: number;
    totalExpectedQuantity: number;
    soldQuantity: number;
    countedQuantity: number;
    varianceQuantity: number;
    untrackedSaleUnits: number;
  } | null;
};

export type EventSaleOption = {
  id: string;
  source: "PREPARED_STOCK" | "DISPLAY_CASE";
  inventoryItemId?: string;
  caseItemId?: string;
  name: string;
  description: string;
  details: string;
  unitListPriceCents: number;
  expectedQuantity: number;
  color: string | null;
  variation: string | null;
};

export type EventSaleOptionsSnapshot = {
  eventId: string;
  query: string;
  options: EventSaleOption[];
  resultCount: number;
  truncated: boolean;
  summary: {
    preparedExpectedQuantity: number;
    displayCaseExpectedQuantity: number;
    totalExpectedQuantity: number;
  };
};

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function displayCaseVerificationCsv(snapshot: DisplayCaseSnapshot): string {
  if (!snapshot.event || !snapshot.preparedStock || !snapshot.eventFlips) {
    throw new Error("Display Case report requires an event snapshot.");
  }
  const rows: Array<Array<string | number | null>> = [
    [
      "Source",
      "Item Name",
      "Set",
      "Collector Number",
      "Variation",
      "Condition / Color",
      "Unit List Price",
      "Opening / Added",
      "Returned",
      "Sold",
      "Expected In Case",
      "Physical Count",
      "Variance",
      "Source Receipt",
    ],
  ];
  for (const item of snapshot.preparedStock.items) {
    rows.push([
      "Opening display stock",
      item.name,
      null,
      null,
      item.variation,
      item.color,
      (item.unitPriceCents / 100).toFixed(2),
      item.openingQuantity,
      0,
      item.soldQuantity,
      item.expectedQuantity,
      item.countedQuantity,
      item.countVariance,
      null,
    ]);
  }
  for (const item of snapshot.eventFlips.items) {
    rows.push([
      "Event flip",
      item.name,
      item.setName,
      item.collectorNumber,
      item.variant,
      item.condition,
      (item.currentSalePriceCents / 100).toFixed(2),
      item.totalAddedQuantity,
      item.returnedQuantity,
      item.soldQuantity,
      item.expectedQuantity,
      item.countedQuantity,
      item.countVariance,
      item.receiptId,
    ]);
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}
