import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { InventoryRepository } from "../lib/inventory/InventoryRepository.ts";
import { PurchaseLedgerRepository } from "../lib/purchases/PurchaseLedgerRepository.ts";
import { validatePurchaseLineDraft } from "../lib/purchases/domain.ts";
import type { SearchMatch } from "../lib/pricing/types.ts";

const exactMatch: SearchMatch = {
  categoryId: "magic-en",
  sku: "tcg:inventory-card",
  productType: "SINGLE",
  name: "Inventory Card",
  setName: "Test Set",
  collectorNumber: "42",
  variant: "Foil",
  language: "English",
  imageUrl: null,
  score: 100,
  prices: {},
  sealedPrice: null,
  previousMarketPriceCents: null,
  previousSnapshotDate: null,
};

test("checkout atomically creates exact and truthful Bulk inventory lots", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const principal = { workspaceId: "workspace-a", operatorUserId: "buyer" };
  const event = ledger.createEvent(principal, { name: "Show", eventDate: "2026-08-01" });

  ledger.addLine(principal, event.id, validatePurchaseLineDraft({
    kind: "EXACT",
    categoryId: exactMatch.categoryId,
    sku: exactMatch.sku,
    condition: "LP",
    quantity: 2,
    actualPaidCents: 1200,
    recommendedOfferCents: 1500,
    marketReferenceCents: 2200,
    snapshotDate: "2026-07-30T12:00:00.000Z",
    notes: "Matched pair",
  }), exactMatch);
  ledger.addLine(principal, event.id, validatePurchaseLineDraft({
    kind: "BULK",
    productLines: ["MAGIC", "POKEMON"],
    actualPaidCents: 5000,
    notes: "Mixed box",
    approximateQuantity: 800,
    approximateWeight: "12 lb",
  }));

  const receipt = ledger.checkout(principal, event.id, "inventory:checkout-1");
  const snapshot = inventory.listWorkspace(principal.workspaceId);
  assert.equal(snapshot.summary.activeLotCount, 2);
  assert.equal(snapshot.summary.exactUnitCount, 2);
  assert.equal(snapshot.summary.bulkLotCount, 1);
  assert.equal(snapshot.summary.totalCostBasisCents, 7400);

  const exact = snapshot.lots.find((lot) => lot.kind === "EXACT");
  assert.equal(exact?.sourceReceiptId, receipt.id);
  assert.equal(exact?.condition, "LP");
  assert.equal(exact?.unitCostCents, 1200);
  assert.equal(exact?.totalCostCents, 2400);

  const bulk = snapshot.lots.find((lot) => lot.kind === "BULK");
  assert.deepEqual(bulk?.productLines, ["MAGIC", "POKEMON"]);
  assert.equal(bulk?.sku, null);
  assert.equal(bulk?.approximateQuantity, 800);
  assert.equal(bulk?.totalCostCents, 5000);

  assert.equal(ledger.checkout(principal, event.id, "inventory:checkout-1").id, receipt.id);
  assert.equal(inventory.listWorkspace(principal.workspaceId).lots.length, 2);
  assert.equal(inventory.listWorkspace("workspace-b").lots.length, 0);
  database.close();
});

test("receipt void preserves and deactivates linked inventory lots", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const principal = { workspaceId: "workspace", operatorUserId: "buyer" };
  const event = ledger.createEvent(principal, { name: "Show", eventDate: "2026-08-01" });
  ledger.addLine(principal, event.id, validatePurchaseLineDraft({
    kind: "EXACT",
    categoryId: exactMatch.categoryId,
    sku: exactMatch.sku,
    condition: "NM",
    quantity: 1,
    actualPaidCents: 1000,
    recommendedOfferCents: null,
    marketReferenceCents: null,
    snapshotDate: null,
  }), exactMatch);
  const receipt = ledger.checkout(principal, event.id, "inventory:checkout-2");
  ledger.voidReceipt(principal, receipt.id, "Duplicate vendor receipt");

  const snapshot = inventory.listWorkspace(principal.workspaceId);
  assert.equal(snapshot.summary.activeLotCount, 0);
  assert.equal(snapshot.summary.totalCostBasisCents, 0);
  assert.equal(snapshot.summary.voidedLotCount, 1);
  assert.equal(snapshot.lots[0]?.voidReason, "Duplicate vendor receipt");
  assert.ok(snapshot.lots[0]?.voidedAt);
  database.close();
});

test("inventory surface requires its assigned module at both page and API boundaries", () => {
  const route = readFileSync(new URL("../app/api/inventory/route.ts", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/inventory/page.tsx", import.meta.url), "utf8");
  assert.match(route, /authorizeRequest\(request, "INVENTORY", "VIEW"\)/);
  assert.match(page, /requiredModule="INVENTORY"/);
});
