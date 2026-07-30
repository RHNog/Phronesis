import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { InventoryRepository } from "../lib/inventory/InventoryRepository.ts";
import { PurchaseLedgerRepository } from "../lib/purchases/PurchaseLedgerRepository.ts";
import { validatePurchaseLineDraft } from "../lib/purchases/domain.ts";
import type { SearchMatch } from "../lib/pricing/types.ts";

const match: SearchMatch = {
  categoryId: "magic-en",
  sku: "tcg:reconciliation-card",
  productType: "SINGLE",
  name: "Reconciliation Card",
  setName: "Audit Set",
  collectorNumber: "7",
  variant: "Normal",
  language: "English",
  imageUrl: null,
  score: 100,
  prices: {},
  sealedPrice: null,
  previousMarketPriceCents: null,
  previousSnapshotDate: null,
};

function setupInventory() {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const principal = { workspaceId: "workspace-a", operatorUserId: "operator-a" };
  const event = ledger.createEvent(principal, { name: "Counted Show", eventDate: "2026-08-01" });
  ledger.addLine(principal, event.id, validatePurchaseLineDraft({
    kind: "EXACT",
    categoryId: match.categoryId,
    sku: match.sku,
    condition: "NM",
    quantity: 2,
    actualPaidCents: 1200,
    recommendedOfferCents: null,
    marketReferenceCents: null,
    snapshotDate: null,
  }), match);
  ledger.addLine(principal, event.id, validatePurchaseLineDraft({
    kind: "BULK",
    productLines: ["MAGIC"],
    actualPaidCents: 5000,
    notes: "Countable box",
    approximateQuantity: 100,
  }));
  const receipt = ledger.checkout(principal, event.id, "reconcile:checkout-1");
  const snapshot = inventory.listWorkspace(principal.workspaceId);
  return { database, inventory, ledger, principal, receipt, exactLot: snapshot.lots.find((lot) => lot.kind === "EXACT")!, bulkLot: snapshot.lots.find((lot) => lot.kind === "BULK")! };
}

test("location and physical count reconcile atomically without rewriting receipt evidence", () => {
  const context = setupInventory();
  const location = context.inventory.createLocation(context.principal.workspaceId, context.principal.operatorUserId, "Display Case");
  assert.throws(() => context.inventory.createLocation(context.principal.workspaceId, context.principal.operatorUserId, "  display   case "), /already exists/i);

  const snapshot = context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    locationId: location.id,
    countedQuantity: 1,
    reason: "Verified after show intake",
  });
  const lot = snapshot.lots.find((candidate) => candidate.id === context.exactLot.id)!;
  assert.equal(lot.locationName, "Display Case");
  assert.equal(lot.quantity, 2, "receipt quantity remains immutable");
  assert.equal(lot.onHandQuantity, 1);
  assert.equal(lot.quantityBasis, "COUNTED");
  assert.equal(lot.totalCostCents, 2400, "acquisition cost basis is not rewritten by a count");
  assert.equal(snapshot.summary.exactUnitCount, 1);
  assert.deepEqual(snapshot.recentEvents.map((event) => event.type).sort(), ["COUNT", "MOVE"]);
  assert.ok(snapshot.recentEvents.every((event) => event.reason === "Verified after show intake"));
  context.database.close();
});

test("zero counts, Unassigned moves, no-ops, and workspace ownership fail or persist truthfully", () => {
  const context = setupInventory();
  const location = context.inventory.createLocation(context.principal.workspaceId, context.principal.operatorUserId, "Shelf A");
  context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    locationId: location.id,
    reason: "Initial shelving",
  });
  let snapshot = context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    locationId: null,
    countedQuantity: 0,
    reason: "Cycle count discrepancy",
  });
  assert.equal(snapshot.lots.find((lot) => lot.id === context.exactLot.id)?.locationName, "Unassigned");
  assert.equal(snapshot.lots.find((lot) => lot.id === context.exactLot.id)?.onHandQuantity, 0);
  assert.equal(snapshot.summary.exactUnitCount, 0);

  const eventCount = snapshot.recentEvents.length;
  assert.throws(() => context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    locationId: null,
    reason: "No actual change",
  }), /did not change/i);
  assert.throws(() => context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    countedQuantity: -1,
    reason: "Invalid",
  }), /non-negative/i);
  const foreignLocation = context.inventory.createLocation("workspace-b", "operator-b", "Foreign shelf");
  assert.throws(() => context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.exactLot.id,
    locationId: foreignLocation.id,
    reason: "Cross workspace attempt",
  }), /this workspace/i);
  snapshot = context.inventory.listWorkspace(context.principal.workspaceId);
  assert.equal(snapshot.recentEvents.length, eventCount);
  context.database.close();
});

test("first Bulk count can confirm its approximate intake and voided lots reject reconciliation", () => {
  const context = setupInventory();
  const counted = context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.bulkLot.id,
    countedQuantity: 100,
    reason: "Physical box count",
  });
  const bulk = counted.lots.find((lot) => lot.id === context.bulkLot.id)!;
  assert.equal(bulk.approximateQuantity, 100);
  assert.equal(bulk.onHandQuantity, 100);
  assert.equal(bulk.quantityBasis, "COUNTED");
  assert.equal(counted.recentEvents[0]?.type, "COUNT");

  context.ledger.voidReceipt(context.principal, context.receipt.id, "Receipt correction");
  assert.throws(() => context.inventory.reconcileLot(context.principal.workspaceId, context.principal.operatorUserId, {
    lotId: context.bulkLot.id,
    countedQuantity: 90,
    reason: "Should be blocked",
  }), /active inventory lot/i);
  context.database.close();
});

test("inventory mutations require OPERATE authorization and the client exposes a reasoned reconciliation form", () => {
  const route = readFileSync(new URL("../app/api/inventory/route.ts", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("../features/inventory/InventoryWorkspace.tsx", import.meta.url), "utf8");
  assert.match(route, /authorizeRequest\(request, "INVENTORY", "OPERATE"\)/);
  assert.match(workspace, /Manage lot/);
  assert.match(workspace, /Physical count/);
  assert.match(workspace, /Reason/);
});
