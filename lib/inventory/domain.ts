import type { PurchaseProductLine } from "@/lib/purchases/domain";

export type InventoryLotKind = "EXACT" | "BULK";

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
};

export type InventorySnapshot = {
  summary: InventorySummary;
  lots: InventoryLot[];
};
