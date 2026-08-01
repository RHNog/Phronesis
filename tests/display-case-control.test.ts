import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { InventoryRepository } from "../lib/inventory/InventoryRepository.ts";
import { PurchaseLedgerRepository } from "../lib/purchases/PurchaseLedgerRepository.ts";
import {
  validateEventManualPurchaseDraft,
  validateEventSaleDraft,
  validatePurchaseLineDraft,
} from "../lib/purchases/domain.ts";
import type { SearchMatch } from "../lib/pricing/types.ts";

const principal = {
  workspaceId: "display-case-workspace",
  operatorUserId: "display-case-operator",
};

function cardMatch(
  name: string,
  sku: string,
  productType: "SINGLE" | "SEALED" = "SINGLE",
): SearchMatch {
  return {
    categoryId: "pokemon-en",
    sku,
    productType,
    name,
    setName: productType === "SINGLE" ? "Test Set" : "Test Sealed",
    collectorNumber: productType === "SINGLE" ? "42" : null,
    variant: productType === "SINGLE" ? "Holofoil" : "Unopened",
    language: "English",
    imageUrl: null,
    score: 100,
    prices: {},
    sealedPrice: null,
    previousMarketPriceCents: null,
    previousSnapshotDate: null,
  };
}

function buyExact(
  ledger: PurchaseLedgerRepository,
  eventId: string,
  input: {
    name: string;
    sku: string;
    quantity: number;
    marketReferenceCents?: number | null;
    productType?: "SINGLE" | "SEALED";
    key: string;
  },
) {
  const match = cardMatch(
    input.name,
    input.sku,
    input.productType ?? "SINGLE",
  );
  return ledger.checkoutImmediate(
    principal,
    eventId,
    validatePurchaseLineDraft({
      kind: "EXACT",
      categoryId: match.categoryId,
      sku: match.sku,
      condition: input.productType === "SEALED" ? "Unopened" : "NM",
      quantity: input.quantity,
      actualPaidCents: 1_000,
      recommendedOfferCents: 1_500,
      marketReferenceCents: input.marketReferenceCents ?? null,
      snapshotDate: "2026-07-31T12:00:00.000Z",
    }),
    match,
    input.key,
  );
}

test("every Purchase feeds Event Flip without fabricating actionable Bulk, sealed, or manual cards", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Sorting Show",
    eventDate: "2026-08-01",
    currency: "USD",
    openingCashCents: 10_000,
  });
  buyExact(ledger, event.id, {
    name: "Charizard V",
    sku: "swsh03-019",
    quantity: 3,
    marketReferenceCents: 3_500,
    key: "flip-purchase-single",
  });
  buyExact(ledger, event.id, {
    name: "Booster Box",
    sku: "sealed-box",
    quantity: 1,
    productType: "SEALED",
    key: "flip-purchase-sealed",
  });
  ledger.checkoutImmediate(
    principal,
    event.id,
    validatePurchaseLineDraft({
      kind: "BULK",
      productLines: ["POKEMON"],
      actualPaidCents: 5_000,
      notes: "Unsorted modern Pokémon",
      approximateQuantity: 400,
    }),
    undefined,
    "flip-purchase-bulk",
  );
  ledger.recordManualPurchase(
    principal,
    event.id,
    validateEventManualPurchaseDraft({
      amountCents: 2_000,
      paymentMethod: "CASH",
      description: "Walk-up binder pending itemization",
    }),
    "flip-manual-purchase",
  );

  const queue = ledger.displayCase.getEventFlipSnapshot(principal);
  assert.equal(queue.event?.id, event.id);
  assert.equal(queue.candidates.length, 1);
  assert.equal(queue.candidates[0]?.name, "Charizard V");
  assert.equal(queue.candidates[0]?.availableToFlipQuantity, 3);
  assert.equal(queue.candidates[0]?.suggestedSalePriceCents, 3_500);
  assert.deepEqual(
    new Set(queue.blocked.map((item) => item.source)),
    new Set(["SEALED", "BULK", "MANUAL_PURCHASE"]),
  );
  assert.equal(queue.summary.blockedOutcomes, 3);
  database.close();
});

test("Vendor checkout requires a Case price and atomically places eligible purchased cards", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Direct Case Show",
    eventDate: "2026-08-01",
    currency: "USD",
    openingCashCents: 10_000,
  });
  const match = cardMatch("Charizard V", "swsh03-019");
  const line = ledger.addLine(
    principal,
    event.id,
    validatePurchaseLineDraft({
      kind: "EXACT",
      categoryId: match.categoryId,
      sku: match.sku,
      condition: "NM",
      quantity: 3,
      actualPaidCents: 2_500,
      recommendedOfferCents: 2_500,
      marketReferenceCents: 3_500,
      snapshotDate: "2026-07-31T12:00:00.000Z",
    }),
    match,
  );

  assert.throws(
    () =>
      ledger.checkout(
        principal,
        event.id,
        "vendor-case-invalid-price",
        "CASH",
        [{ lineId: line.id, quantity: 1, salePriceCents: 0 }],
      ),
    /Case Sale price/i,
  );
  assert.throws(
    () =>
      ledger.checkout(
        principal,
        event.id,
        "vendor-case-invalid-quantity",
        "CASH",
        [{ lineId: line.id, quantity: 4, salePriceCents: 4_999 }],
      ),
    /between 1 and the 3 purchased units/i,
  );
  assert.equal(ledger.listReceipts(principal).length, 0);
  assert.equal(ledger.listCart(principal, event.id).length, 1);

  const receipt = ledger.checkout(
    principal,
    event.id,
    "vendor-case-checkout",
    "CASH",
    [{ lineId: line.id, quantity: 1, salePriceCents: 4_999 }],
  );
  assert.equal(receipt.lines.length, 1);
  assert.equal(ledger.listCart(principal, event.id).length, 0);
  const caseSnapshot = ledger.displayCase.getSourceSnapshot(principal, event.id);
  assert.equal(caseSnapshot.summary.expectedQuantity, 1);
  assert.equal(caseSnapshot.items[0]?.name, "Charizard V");
  assert.equal(caseSnapshot.items[0]?.currentSalePriceCents, 4_999);
  const general = inventory.listWorkspace(principal.workspaceId);
  assert.equal(general.summary.exactUnitCount, 3);
  assert.equal(general.summary.displayCaseUnitCount, 1);
  assert.equal(general.summary.generalAvailableUnitCount, 2);
  const flip = ledger.displayCase.getEventFlipSnapshot(principal, event.id);
  assert.equal(flip.candidates[0]?.availableToFlipQuantity, 2);
  database.close();
});

test("multi-card placement is idempotent and reserves rather than duplicates General Inventory", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Reservation Show",
    eventDate: "2026-08-02",
    currency: "USD",
    openingCashCents: 0,
  });
  buyExact(ledger, event.id, {
    name: "Charizard V",
    sku: "swsh03-019",
    quantity: 3,
    marketReferenceCents: 3_500,
    key: "reserve-purchase-charizard",
  });
  buyExact(ledger, event.id, {
    name: "Pikachu V",
    sku: "swsh04-043",
    quantity: 2,
    marketReferenceCents: 2_000,
    key: "reserve-purchase-pikachu",
  });
  const queue = ledger.displayCase.getEventFlipSnapshot(principal, event.id);
  const charizard = queue.candidates.find((item) => item.name === "Charizard V");
  const pikachu = queue.candidates.find((item) => item.name === "Pikachu V");
  assert.ok(charizard);
  assert.ok(pikachu);

  ledger.displayCase.addToCase(
    principal,
    event.id,
    [
      {
        inventoryLotId: charizard.inventoryLotId,
        quantity: 2,
        salePriceCents: 4_999,
      },
      {
        inventoryLotId: pikachu.inventoryLotId,
        quantity: 1,
        salePriceCents: 2_500,
      },
    ],
    "case-batch-reservation-1",
  );
  ledger.displayCase.addToCase(
    principal,
    event.id,
    [
      {
        inventoryLotId: charizard.inventoryLotId,
        quantity: 2,
        salePriceCents: 4_999,
      },
      {
        inventoryLotId: pikachu.inventoryLotId,
        quantity: 1,
        salePriceCents: 2_500,
      },
    ],
    "case-batch-reservation-1",
  );
  assert.throws(
    () =>
      ledger.displayCase.addToCase(
        principal,
        event.id,
        [
          {
            inventoryLotId: charizard.inventoryLotId,
            quantity: 1,
            salePriceCents: 9_999,
          },
        ],
        "case-batch-reservation-1",
      ),
    /already used for another batch/i,
  );

  const caseSnapshot = ledger.displayCase.getSourceSnapshot(
    principal,
    event.id,
  );
  assert.equal(caseSnapshot.summary.expectedQuantity, 3);
  assert.equal(caseSnapshot.items.length, 2);
  const general = inventory.listWorkspace(principal.workspaceId);
  assert.equal(general.summary.exactUnitCount, 5, "owned quantity is not copied");
  assert.equal(general.summary.displayCaseUnitCount, 3);
  assert.equal(general.summary.generalAvailableUnitCount, 2);
  const charizardLot = general.lots.find((lot) => lot.name === "Charizard V");
  assert.equal(charizardLot?.onHandQuantity, 3);
  assert.equal(charizardLot?.displayCaseQuantity, 2);
  assert.equal(charizardLot?.generalAvailableQuantity, 1);
  assert.throws(
    () =>
      inventory.disposeLot(principal.workspaceId, principal.operatorUserId, {
        lotId: charizard.inventoryLotId,
        type: "LOSS",
        quantity: 2,
        reason: "Should not consume Case cards",
        idempotencyKey: "case-reserved-loss",
      }),
    /available outside the Display Case/i,
  );
  assert.throws(
    () =>
      inventory.reconcileLot(principal.workspaceId, principal.operatorUserId, {
        lotId: charizard.inventoryLotId,
        countedQuantity: 1,
        reason: "Invalid General count",
      }),
    /reserved in the Display Case/i,
  );
  assert.throws(
    () =>
      ledger.voidReceipt(
        principal,
        charizard.receiptId,
        "Cannot void displayed cards",
      ),
    /Display Case unit/i,
  );
  database.close();
});

test("prepared stock and Event Flip cards sell and reverse atomically through one ledger", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Mixed Case Show",
    eventDate: "2026-08-03",
    currency: "USD",
    openingCashCents: 5_000,
  });
  ledger.eventStock.importCsv(
    principal,
    event.id,
    "opening-case.csv",
    [
      "Item Name,Price,Quantity,Color,Variation",
      "Dragon Shield Sleeves,12.50,2,Black,Matte",
    ].join("\n"),
  );
  const receipt = buyExact(ledger, event.id, {
    name: "Charizard V",
    sku: "swsh03-019",
    quantity: 2,
    marketReferenceCents: 3_500,
    key: "mixed-purchase-charizard",
  });
  const candidate = ledger.displayCase.getEventFlipSnapshot(
    principal,
    event.id,
  ).candidates[0];
  assert.ok(candidate);
  ledger.displayCase.addToCase(
    principal,
    event.id,
    [
      {
        inventoryLotId: candidate.inventoryLotId,
        quantity: 1,
        salePriceCents: 4_999,
      },
    ],
    "mixed-case-batch",
  );
  const preparedItem = ledger.eventStock.getSnapshot(principal, event.id).items[0];
  const caseItem = ledger.displayCase.getSourceSnapshot(
    principal,
    event.id,
  ).items[0];
  assert.ok(preparedItem);
  assert.ok(caseItem);

  const sale = ledger.recordSale(
    principal,
    event.id,
    validateEventSaleDraft({
      amountCents: 6_249,
      paymentMethod: "CASH",
      items: [
        {
          description: "client text is replaced",
          quantity: 1,
          inventoryItemId: preparedItem.id,
        },
        {
          description: "wrong card text",
          quantity: 1,
          caseItemId: caseItem.id,
        },
      ],
    }),
    "mixed-case-sale",
  );
  assert.equal(sale.items[0]?.inventoryItemId, preparedItem.id);
  assert.equal(sale.items[1]?.caseItemId, caseItem.id);
  assert.equal(sale.items[1]?.unitListPriceCents, 4_999);
  assert.match(sale.items[1]?.description ?? "", /Charizard V/);
  assert.equal(
    ledger.eventStock.getSnapshot(principal, event.id).summary.expectedQuantity,
    1,
  );
  assert.equal(
    ledger.displayCase.getSourceSnapshot(principal, event.id).summary
      .expectedQuantity,
    0,
  );
  let lot = inventory
    .listWorkspace(principal.workspaceId)
    .lots.find((item) => item.id === candidate.inventoryLotId);
  assert.equal(lot?.onHandQuantity, 1);
  assert.equal(lot?.displayCaseQuantity, 0);
  assert.equal(lot?.generalAvailableQuantity, 1);
  assert.equal(
    ledger.eventStock.getSnapshot(principal, event.id).summary.untrackedSaleUnits,
    0,
  );

  ledger.reverseLedgerEntry(
    principal,
    event.id,
    sale.id,
    "Customer returned both products",
    "mixed-case-reversal",
  );
  assert.equal(
    ledger.eventStock.getSnapshot(principal, event.id).summary.expectedQuantity,
    2,
  );
  assert.equal(
    ledger.displayCase.getSourceSnapshot(principal, event.id).summary
      .expectedQuantity,
    1,
  );
  lot = inventory
    .listWorkspace(principal.workspaceId)
    .lots.find((item) => item.id === candidate.inventoryLotId);
  assert.equal(lot?.onHandQuantity, 2);
  assert.equal(lot?.displayCaseQuantity, 1);
  assert.equal(lot?.generalAvailableQuantity, 1);

  ledger.displayCase.returnToGeneral(
    principal,
    event.id,
    caseItem.id,
    1,
    "Card was removed from the physical Case",
    "mixed-case-return",
  );
  ledger.displayCase.returnToGeneral(
    principal,
    event.id,
    caseItem.id,
    1,
    "Card was removed from the physical Case",
    "mixed-case-return",
  );
  assert.equal(
    ledger.displayCase.getSourceSnapshot(principal, event.id).summary
      .expectedQuantity,
    0,
  );
  ledger.voidReceipt(principal, receipt.id, "Purchase was cancelled after return");
  assert.equal(
    inventory
      .listWorkspace(principal.workspaceId)
      .lots.find((item) => item.id === candidate.inventoryLotId)?.voidedAt !== null,
    true,
  );
  database.close();
});

test("a later General Inventory count blocks automatic Case Sale reversal", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const inventory = new InventoryRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Count Guard Show",
    eventDate: "2026-08-04",
    currency: "USD",
    openingCashCents: 0,
  });
  buyExact(ledger, event.id, {
    name: "Pikachu V",
    sku: "swsh04-043",
    quantity: 1,
    marketReferenceCents: 2_000,
    key: "count-guard-purchase",
  });
  const candidate = ledger.displayCase.getEventFlipSnapshot(
    principal,
    event.id,
  ).candidates[0];
  assert.ok(candidate);
  ledger.displayCase.addToCase(
    principal,
    event.id,
    [
      {
        inventoryLotId: candidate.inventoryLotId,
        quantity: 1,
        salePriceCents: 2_500,
      },
    ],
    "count-guard-case-batch",
  );
  const caseItem = ledger.displayCase.getSourceSnapshot(
    principal,
    event.id,
  ).items[0];
  assert.ok(caseItem);
  const sale = ledger.recordSale(
    principal,
    event.id,
    validateEventSaleDraft({
      amountCents: 2_500,
      paymentMethod: "CARD",
      items: [{ description: "Pikachu", quantity: 1, caseItemId: caseItem.id }],
    }),
    "count-guard-sale",
  );
  inventory.reconcileLot(principal.workspaceId, principal.operatorUserId, {
    lotId: candidate.inventoryLotId,
    countedQuantity: 0,
    reason: "Post-sale General Inventory count",
  });
  assert.throws(
    () =>
      ledger.reverseLedgerEntry(
        principal,
        event.id,
        sale.id,
        "Attempt after later count",
        "count-guard-reversal",
      ),
    /cannot be reversed after a later General Inventory count/i,
  );
  assert.equal(
    ledger.getEventLedgerSnapshot(principal).entries.find(
      (entry) => entry.id === sale.id,
    )?.reversedByEntryId,
    null,
  );
  database.close();
});

test("Case routes remain authorized and Vendor checkout exposes direct placement with price", () => {
  const flipRoute = readFileSync(
    new URL("../app/api/event-flip/route.ts", import.meta.url),
    "utf8",
  );
  const caseRoute = readFileSync(
    new URL("../app/api/display-case/route.ts", import.meta.url),
    "utf8",
  );
  const saleOptions = readFileSync(
    new URL("../app/api/event-sale-options/route.ts", import.meta.url),
    "utf8",
  );
  const vendorCheckout = readFileSync(
    new URL(
      "../features/vendor/components/VendorCheckout.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const purchaseRoute = readFileSync(
    new URL("../app/api/purchases/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(flipRoute, /authorizeRequest\(request, "INVENTORY", "VIEW"\)/);
  assert.match(caseRoute, /authorizeRequest\(request, "INVENTORY", "VIEW"\)/);
  assert.match(saleOptions, /"VENDOR_WORKSPACE",\s*"VIEW"/);
  assert.match(vendorCheckout, /Send directly to Display Case/);
  assert.match(vendorCheckout, /Purchase quantity/);
  assert.match(vendorCheckout, /Case quantity/);
  assert.match(vendorCheckout, /quantity: "1"/);
  assert.match(vendorCheckout, /Case Sale price · required/);
  assert.match(purchaseRoute, /body\.casePlacements/);
});
