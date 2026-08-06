import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { InventoryRepository } from "../lib/inventory/InventoryRepository.ts";
import { PurchaseLedgerRepository } from "../lib/purchases/PurchaseLedgerRepository.ts";
import { validatePurchaseLineDraft } from "../lib/purchases/domain.ts";
import type { InventoryDispositionType } from "../lib/inventory/domain.ts";
import type { SearchMatch } from "../lib/pricing/types.ts";

const match: SearchMatch = {
  categoryId: "magic-en",
  sku: "tcg:disposition-card",
  productType: "SINGLE",
  name: "Disposition Card",
  setName: "Ledger Set",
  collectorNumber: "10",
  variant: "Normal",
  language: "English",
  imageUrl: null,
  score: 100,
  prices: {},
  sealedPrice: null,
  previousMarketPriceCents: null,
  previousSnapshotDate: null,
};

function setupInventory(options: { exactQuantity?: number; bulkQuantity?: number | null } = {}) {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const principal = { workspaceId: "workspace-a", operatorUserId: "operator-a" };
  const event = ledger.createEvent(principal, { name: "Disposition Show", eventDate: "2026-08-01" });
  const exactQuantity = options.exactQuantity ?? 10;
  ledger.addLine(principal, event.id, validatePurchaseLineDraft({
    kind: "EXACT",
    categoryId: match.categoryId,
    sku: match.sku,
    condition: "NM",
    quantity: exactQuantity,
    actualPaidCents: 1200,
    recommendedOfferCents: null,
    marketReferenceCents: null,
    snapshotDate: null,
  }), match);
  ledger.addLine(principal, event.id, validatePurchaseLineDraft({
    kind: "BULK",
    productLines: ["MAGIC"],
    actualPaidCents: 5000,
    notes: "Disposition box",
    approximateQuantity: options.bulkQuantity === undefined ? 100 : options.bulkQuantity ?? undefined,
  }));
  const receipt = ledger.checkout(principal, event.id, "disposition:checkout-1");
  const snapshot = inventory.listWorkspace(principal.workspaceId);
  return {
    database,
    inventory,
    ledger,
    principal,
    receipt,
    exactLot: snapshot.lots.find((lot) => lot.kind === "EXACT")!,
    bulkLot: snapshot.lots.find((lot) => lot.kind === "BULK")!,
  };
}

test("sale disposition atomically decrements on-hand quantity and preserves acquisition evidence", () => {
  const context = setupInventory();
  const snapshot = context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    type: "SALE",
    quantity: 3,
    grossProceedsCents: 6000,
    channel: "Card show",
    counterparty: "Customer reference 12",
    reason: "Sold at Saturday event",
    idempotencyKey: "sale-1",
  });
  const lot = snapshot.lots.find((candidate) => candidate.id === context.exactLot.id)!;
  assert.equal(lot.onHandQuantity, 7);
  assert.equal(lot.quantityBasis, "LEDGER");
  assert.equal(lot.quantity, 10, "receipt quantity remains immutable");
  assert.equal(lot.totalCostCents, 12000, "acquisition cost remains immutable");
  assert.equal(lot.netDisposedQuantity, 3);
  assert.equal(snapshot.summary.netDisposedUnitCount, 3);
  assert.equal(snapshot.summary.soldUnitCount, 3);
  assert.equal(snapshot.summary.grossSalesCents, 6000);
  assert.equal(snapshot.recentDispositions[0]?.grossProceedsCents, 6000);
  assert.equal(snapshot.recentDispositions[0]?.channel, "Card show");
  context.database.close();
});

test("disposition creation is idempotent and rejects oversell or invalid classification evidence", () => {
  const context = setupInventory({ exactQuantity: 2 });
  const input = {
    lotId: context.exactLot.id,
    type: "SALE" as const,
    quantity: 1,
    grossProceedsCents: 1500,
    reason: "First request",
    idempotencyKey: "stable-operation",
  };
  context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, input);
  const duplicate = context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    ...input,
    quantity: 2,
    reason: "Retried request with a changed body",
  });
  assert.equal(duplicate.recentDispositions.length, 1);
  assert.equal(duplicate.lots.find((lot) => lot.id === context.exactLot.id)?.onHandQuantity, 1);

  assert.throws(() => context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    ...input,
    quantity: 2,
    idempotencyKey: "oversell",
  }), /exceeds known/i);
  assert.throws(() => context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    ...input,
    type: "LOSS",
    grossProceedsCents: 1,
    idempotencyKey: "loss-with-proceeds",
  }), /only valid for a sale/i);
  assert.throws(() => context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    ...input,
    type: "TRANSFER_OUT",
    grossProceedsCents: null,
    idempotencyKey: "missing-destination",
  }), /destination is required/i);
  assert.throws(() => context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    ...input,
    type: "DAMAGE",
    grossProceedsCents: null,
    channel: "Not applicable",
    idempotencyKey: "damage-with-channel",
  }), /only valid for a sale/i);
  assert.throws(() => context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    ...input,
    type: "UNKNOWN" as InventoryDispositionType,
    idempotencyKey: "invalid-type",
  }), /type is invalid/i);
  context.database.close();
});

test("zero-dollar sale remains explicit gross evidence", () => {
  const context = setupInventory({ exactQuantity: 1 });
  const snapshot = context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    type: "SALE",
    quantity: 1,
    grossProceedsCents: 0,
    reason: "Promotional zero-dollar sale",
    idempotencyKey: "zero-dollar-sale",
  });
  assert.equal(snapshot.summary.grossSalesCents, 0);
  assert.equal(snapshot.summary.soldUnitCount, 1);
  assert.equal(snapshot.lots.find((lot) => lot.id === context.exactLot.id)?.onHandQuantity, 0);
  context.database.close();
});

test("all non-sale classifications remain explicit and a reasoned reversal restores quantity", () => {
  const context = setupInventory();
  const records: Array<{ type: InventoryDispositionType; destination?: string }> = [
    { type: "LOSS" },
    { type: "DAMAGE" },
    { type: "TRANSFER_OUT", destination: "Consignment partner" },
    { type: "CORRECTION" },
  ];
  records.forEach((record, index) => {
    context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
      lotId: context.exactLot.id,
      type: record.type,
      quantity: 1,
      destination: record.destination,
      reason: `${record.type} evidence`,
      idempotencyKey: `non-sale-${index}`,
    });
  });
  let snapshot = context.inventory.listWorkspace(context.principal.workspaceId);
  assert.equal(snapshot.lots.find((lot) => lot.id === context.exactLot.id)?.onHandQuantity, 6);
  assert.deepEqual(new Set(snapshot.recentDispositions.map((record) => record.type)), new Set(records.map((record) => record.type)));

  const reversedId = snapshot.recentDispositions.find((record) => record.type === "DAMAGE")!.id;
  snapshot = context.inventory.reverseDisposition(context.principal.workspaceId, context.principal.operatorUserId, reversedId, "Damage entry was incorrect");
  assert.equal(snapshot.lots.find((lot) => lot.id === context.exactLot.id)?.onHandQuantity, 7);
  assert.equal(snapshot.summary.netDisposedUnitCount, 3);
  assert.equal(snapshot.recentDispositions.find((record) => record.id === reversedId)?.reversalReason, "Damage entry was incorrect");
  const repeated = context.inventory.reverseDisposition(context.principal.workspaceId, context.principal.operatorUserId, reversedId, "Duplicate reversal request");
  assert.equal(repeated.lots.find((lot) => lot.id === context.exactLot.id)?.onHandQuantity, 7);
  context.database.close();
});

test("a later physical count prevents ambiguous reversal", () => {
  const context = setupInventory();
  let snapshot = context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    type: "SALE",
    quantity: 2,
    grossProceedsCents: 3000,
    reason: "Show sale",
    idempotencyKey: "sale-before-count",
  });
  const dispositionId = snapshot.recentDispositions[0]!.id;
  context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    countedQuantity: 8,
    reason: "Closing physical count",
  });
  assert.throws(() => context.inventory.reverseDisposition(
    context.principal.workspaceId,
    context.principal.operatorUserId,
    dispositionId,
    "Sale cancelled after count",
  ), /cannot be reversed after a later physical count/i);
  snapshot = context.inventory.listWorkspace(context.principal.workspaceId);
  assert.equal(snapshot.lots.find((lot) => lot.id === context.exactLot.id)?.onHandQuantity, 8);
  context.database.close();
});

test("unknown, voided, and foreign-workspace inventory fails closed", () => {
  const context = setupInventory({ bulkQuantity: null });
  assert.equal(context.bulkLot.onHandQuantity, null);
  assert.throws(() => context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.bulkLot.id,
    type: "LOSS",
    quantity: 1,
    reason: "Unknown bulk removal",
    idempotencyKey: "unknown-bulk",
  }), /physical count is required/i);
  assert.throws(() => context.inventory.disposeLot("workspace-b", "operator-b", {
    lotId: context.exactLot.id,
    type: "LOSS",
    quantity: 1,
    reason: "Foreign attempt",
    idempotencyKey: "foreign",
  }), /active inventory lot was not found/i);
  context.ledger.voidReceipt(context.principal, context.receipt.id, "Receipt invalidated");
  assert.throws(() => context.inventory.disposeLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    type: "LOSS",
    quantity: 1,
    reason: "Voided attempt",
    idempotencyKey: "voided",
  }), /active inventory lot was not found/i);
  context.database.close();
});

test("inventory disposition mutations require OPERATE and expose explicit gross-sale semantics", () => {
  const route = readFileSync(new URL("../app/api/inventory/route.ts", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("../features/inventory/InventoryWorkspace.tsx", import.meta.url), "utf8");
  assert.match(route, /authorizeRequest\(request, "INVENTORY", "OPERATE"\)/);
  assert.match(route, /record-disposition/);
  assert.match(route, /reverse-disposition/);
  assert.match(workspace, /Record disposition/);
  assert.match(workspace, /Gross sale proceeds/);
  assert.match(workspace, /not settled revenue or profit/);
  assert.match(workspace, /Reversal reason/);
});
