import type { PurchaseProductLine } from "@/lib/purchases/domain";

export type InventoryLotKind = "EXACT" | "BULK";
export type InventoryQuantityBasis = "RECEIPT" | "APPROXIMATE" | "COUNTED" | "LEDGER" | "UNKNOWN";
export type InventoryDispositionType = "SALE" | "LOSS" | "DAMAGE" | "TRANSFER_OUT" | "CORRECTION";

export type InventoryLocation = {
  id: string;
  name: string;
  createdAt: string;
};

export type InventoryEvent = {
  id: string;
  lotId: string;
  lotName: string;
  type: "MOVE" | "COUNT";
  previousLocationName: string | null;
  nextLocationName: string | null;
  previousQuantity: number | null;
  nextQuantity: number | null;
  reason: string;
  actorUserId: string;
  createdAt: string;
};

export type InventoryDisposition = {
  id: string;
  lotId: string;
  lotName: string;
  type: InventoryDispositionType;
  quantity: number;
  grossProceedsCents: number | null;
  channel: string | null;
  counterparty: string | null;
  destination: string | null;
  reason: string;
  actorUserId: string;
  createdAt: string;
  reversedAt: string | null;
  reversedByUserId: string | null;
  reversalReason: string | null;
};

export type InventoryLot = {
  id: string;
  workspaceId: string;
  sourceReceiptId: string;
  sourceLinePosition: number;
  sourceEventId: string;
  acquiredByUserId: string;
  kind: InventoryLotKind;
  categoryId: string | null;
  sku: string | null;
  name: string;
  setName: string | null;
  collectorNumber: string | null;
  variant: string | null;
  language: string | null;
  productType: "SINGLE" | "SEALED" | "BULK";
  condition: string | null;
  quantity: number | null;
  unitCostCents: number | null;
  totalCostCents: number;
  productLines: PurchaseProductLine[];
  notes: string | null;
  approximateQuantity: number | null;
  approximateWeight: string | null;
  locationId: string | null;
  locationName: string;
  onHandQuantity: number | null;
  displayCaseQuantity: number;
  generalAvailableQuantity: number | null;
  quantityBasis: InventoryQuantityBasis;
  netDisposedQuantity: number;
  lastCountedAt: string | null;
  acquiredAt: string;
  voidedAt: string | null;
  voidReason: string | null;
};

export type InventorySummary = {
  activeLotCount: number;
  exactUnitCount: number;
  bulkLotCount: number;
  totalCostBasisCents: number;
  voidedLotCount: number;
  netDisposedUnitCount: number;
  activeDispositionCount: number;
  soldUnitCount: number;
  grossSalesCents: number;
  displayCaseUnitCount: number;
  generalAvailableUnitCount: number;
};

export type InventorySnapshot = {
  summary: InventorySummary;
  lots: InventoryLot[];
  locations: InventoryLocation[];
  recentEvents: InventoryEvent[];
  recentDispositions: InventoryDisposition[];
};
