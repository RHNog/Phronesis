import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { PurchaseLedgerRepository } from "../lib/purchases/PurchaseLedgerRepository.ts";
import {
  validateEventCashAdjustmentDraft,
  validateEventManualPurchaseDraft,
  validateEventSaleDraft,
  validatePurchaseLineDraft,
} from "../lib/purchases/domain.ts";

const principal = { workspaceId: "workspace-a", operatorUserId: "operator-a" };

test("manual sales require and preserve one to 25 explicitly described items", () => {
  const sale = validateEventSaleDraft({
    amountCents: 12_500,
    paymentMethod: "CASH",
    items: [
      { description: "Black Lotus", quantity: 1 },
      { description: "Modern staples binder", quantity: 2 },
    ],
    notes: "One customer transaction",
  });
  assert.equal(sale.items.length, 2);
  assert.equal(sale.items[1]?.description, "Modern staples binder");
  assert.throws(
    () =>
      validateEventSaleDraft({
        amountCents: 100,
        paymentMethod: "CASH",
        items: [],
      }),
    /between one and 25/i,
  );
  assert.throws(
    () =>
      validateEventSaleDraft({
        amountCents: 100,
        paymentMethod: "CASH",
        items: [{ description: " ", quantity: 1 }],
      }),
    /description is required/i,
  );
  assert.throws(
    () =>
      validateEventSaleDraft({
        amountCents: 0,
        paymentMethod: "CASH",
        items: [{ description: "Card", quantity: 1 }],
      }),
    /positive cent value/i,
  );
});

test("event cash summary separates drawer movement from all-channel totals", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Summer Showcase",
    eventDate: "2026-08-01",
    currency: "USD",
    openingCashCents: 10_000,
  });

  const cashSale = ledger.recordSale(
    principal,
    event.id,
    validateEventSaleDraft({
      amountCents: 5_000,
      paymentMethod: "CASH",
      items: [
        { description: "Vintage single", quantity: 1 },
        { description: "Commander deck", quantity: 2 },
      ],
    }),
    "sale:cash-0001",
  );
  assert.equal(cashSale.items.length, 2);
  assert.equal(
    ledger.recordSale(
      principal,
      event.id,
      validateEventSaleDraft({
        amountCents: 5_000,
        paymentMethod: "CASH",
        items: [{ description: "Ignored retry body", quantity: 1 }],
      }),
      "sale:cash-0001",
    ).id,
    cashSale.id,
  );
  ledger.recordSale(
    principal,
    event.id,
    validateEventSaleDraft({
      amountCents: 2_500,
      paymentMethod: "CARD",
      items: [{ description: "Sealed booster box", quantity: 1 }],
    }),
    "sale:card-0001",
  );
  const cashPurchase = ledger.recordManualPurchase(
    principal,
    event.id,
    validateEventManualPurchaseDraft({
      amountCents: 1_200,
      paymentMethod: "CASH",
      description: "Walk-up collection",
    }),
    "purchase:cash-0001",
  );
  ledger.recordManualPurchase(
    principal,
    event.id,
    validateEventManualPurchaseDraft({
      amountCents: 300,
      paymentMethod: "TRANSFER",
      description: "Local seller transfer",
    }),
    "purchase:transfer-0001",
  );
  ledger.recordCashAdjustment(
    principal,
    event.id,
    validateEventCashAdjustmentDraft({
      amountCents: 500,
      direction: "OUT",
      reason: "Change moved to second drawer",
    }),
    "adjustment:out-0001",
  );

  let snapshot = ledger.getEventLedgerSnapshot(principal);
  assert.equal(snapshot.entries.length, 5);
  assert.equal(snapshot.summary?.openingCashCents, 10_000);
  assert.equal(snapshot.summary?.grossSalesCents, 7_500);
  assert.equal(snapshot.summary?.cashSalesCents, 5_000);
  assert.equal(snapshot.summary?.nonCashSalesCents, 2_500);
  assert.equal(snapshot.summary?.purchaseSpendCents, 1_500);
  assert.equal(snapshot.summary?.cashPurchaseCents, 1_200);
  assert.equal(snapshot.summary?.cashAdjustmentCents, -500);
  assert.equal(snapshot.summary?.expectedCashCents, 13_300);
  assert.equal(snapshot.summary?.netEventCashMovementCents, 6_000);
  assert.equal(snapshot.summary?.activeTransactionCount, 5);
  assert.equal(
    Number(
      (
        database
          .prepare("SELECT COUNT(*) AS count FROM phronesis_inventory_lot")
          .get() as { count: number }
      ).count,
    ),
    0,
    "manual sales and purchases do not fabricate Inventory",
  );

  const reversal = ledger.reverseLedgerEntry(
    principal,
    event.id,
    cashPurchase.id,
    "Purchase was entered twice",
    "reverse:purchase-0001",
  );
  assert.equal(reversal.reversalOfEntryId, cashPurchase.id);
  assert.equal(reversal.cashEffectCents, 1_200);
  snapshot = ledger.getEventLedgerSnapshot(principal);
  assert.equal(snapshot.summary?.purchaseSpendCents, 300);
  assert.equal(snapshot.summary?.expectedCashCents, 14_500);
  assert.equal(snapshot.summary?.activeTransactionCount, 4);
  assert.equal(
    snapshot.entries.find((entry) => entry.id === cashPurchase.id)
      ?.reversedByEntryId,
    reversal.id,
  );
  assert.throws(
    () =>
      ledger.reverseLedgerEntry(
        principal,
        event.id,
        cashPurchase.id,
        "Second reversal",
        "reverse:purchase-0002",
      ),
    /already been reversed/i,
  );
  assert.throws(
    () =>
      ledger.reverseLedgerEntry(
        principal,
        event.id,
        cashSale.id,
        "Wrong retry target",
        "reverse:purchase-0001",
      ),
    /another ledger reversal/i,
  );
  assert.throws(
    () =>
      ledger.recordSale(
        { workspaceId: "workspace-b", operatorUserId: "operator-b" },
        event.id,
        validateEventSaleDraft({
          amountCents: 100,
          paymentMethod: "CASH",
          items: [{ description: "Cross-tenant attempt", quantity: 1 }],
        }),
        "sale:cross-workspace",
      ),
    /active event was not found/i,
  );

  const closed = ledger.closeEvent(principal, event.id, 14_550);
  assert.equal(closed.event?.status, "CLOSED");
  assert.equal(closed.summary?.closingExpectedCashCents, 14_500);
  assert.equal(closed.summary?.closingCashCents, 14_550);
  assert.equal(closed.summary?.closingVarianceCents, 50);
  assert.equal(closed.canStartNewEvent, true);
  assert.equal(
    ledger.closeEvent(principal, event.id, 14_550).event?.id,
    event.id,
  );
  assert.throws(
    () =>
      ledger.recordManualPurchase(
        principal,
        event.id,
        validateEventManualPurchaseDraft({
          amountCents: 100,
          paymentMethod: "CASH",
        }),
        "purchase:after-close",
      ),
    /active event was not found/i,
  );

  database.close();
});

test("receipt checkout links Inventory and cash, while void appends one reversal", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Buying Day",
    eventDate: "2026-08-02",
    currency: "USD",
    openingCashCents: 20_000,
  });
  ledger.addLine(
    principal,
    event.id,
    validatePurchaseLineDraft({
      kind: "BULK",
      productLines: ["MAGIC", "POKEMON"],
      actualPaidCents: 5_000,
      notes: "Two mixed binders",
      approximateQuantity: 400,
    }),
  );
  const receipt = ledger.checkout(
    principal,
    event.id,
    "checkout:linked-0001",
    "CASH",
  );
  assert.equal(
    ledger.checkout(principal, event.id, "checkout:linked-0001", "CASH").id,
    receipt.id,
  );

  let snapshot = ledger.getEventLedgerSnapshot(principal);
  const purchase = snapshot.entries.find(
    (entry) => entry.linkedReceiptId === receipt.id,
  );
  assert.ok(purchase);
  assert.equal(snapshot.summary?.purchaseSpendCents, 5_000);
  assert.equal(snapshot.summary?.expectedCashCents, 15_000);
  assert.equal(
    Number(
      (
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM phronesis_inventory_lot WHERE source_receipt_id=? AND voided_at IS NULL",
          )
          .get(receipt.id) as { count: number }
      ).count,
    ),
    1,
  );

  const closed = ledger.closeEvent(principal, event.id, 15_000);
  assert.equal(closed.summary?.closingVarianceCents, 0);
  ledger.voidReceipt(principal, receipt.id, "Seller cancelled the transaction");
  snapshot = ledger.getEventLedgerSnapshot(principal);
  assert.equal(snapshot.summary?.purchaseSpendCents, 0);
  assert.equal(snapshot.summary?.expectedCashCents, 20_000);
  assert.equal(
    snapshot.summary?.closingExpectedCashCents,
    15_000,
    "post-close receipt correction does not rewrite the close snapshot",
  );
  assert.equal(snapshot.summary?.closingVarianceCents, 0);
  assert.ok(
    snapshot.entries.some(
      (entry) =>
        entry.type === "REVERSAL" && entry.reversalOfEntryId === purchase.id,
    ),
  );
  assert.equal(
    Number(
      (
        database
          .prepare(
            "SELECT COUNT(*) AS count FROM phronesis_inventory_lot WHERE source_receipt_id=? AND voided_at IS NOT NULL",
          )
          .get(receipt.id) as { count: number }
      ).count,
    ),
    1,
  );

  database.close();
});

test("legacy event rows remain readable without invented opening cash", () => {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE phronesis_purchase_event (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, created_by_user_id TEXT NOT NULL,
      name TEXT NOT NULL, event_date TEXT NOT NULL, location TEXT, budget_cents INTEGER,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE','CLOSED')),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    INSERT INTO phronesis_purchase_event(
      id, workspace_id, created_by_user_id, name, event_date, location,
      budget_cents, status, created_at, updated_at
    ) VALUES(
      'legacy-event', 'workspace-a', 'operator-a', 'Legacy Show', '2026-07-01', NULL,
      NULL, 'ACTIVE', '2026-07-01T10:00:00.000Z', '2026-07-01T10:00:00.000Z'
    );
  `);
  const ledger = new PurchaseLedgerRepository(database);
  const snapshot = ledger.getEventLedgerSnapshot(principal);
  assert.equal(snapshot.event?.id, "legacy-event");
  assert.equal(snapshot.event?.currency, null);
  assert.equal(snapshot.summary?.openingCashCents, null);
  assert.equal(snapshot.summary?.expectedCashCents, null);
  database.close();
});

test("the production surface exposes authorized multi-item entry and canonical event setup", () => {
  const route = readFileSync(
    new URL("../app/api/event-ledger/route.ts", import.meta.url),
    "utf8",
  );
  const page = readFileSync(
    new URL("../app/event-ledger/page.tsx", import.meta.url),
    "utf8",
  );
  const workspace = readFileSync(
    new URL("../features/events/EventLedgerWorkspace.tsx", import.meta.url),
    "utf8",
  );
  const vendorCheckout = readFileSync(
    new URL(
      "../features/vendor/components/VendorCheckout.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const saleEditor = readFileSync(
    new URL("../features/events/EventSaleItemsEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(route, /"VENDOR_WORKSPACE",\s*"VIEW"/);
  assert.match(route, /"VENDOR_WORKSPACE",\s*"OPERATE"/);
  assert.match(route, /validateEventSaleDraft/);
  assert.match(page, /EventLedgerWorkspace/);
  assert.match(workspace, /EventSaleItemsEditor/);
  assert.match(saleEditor, /What was actually sold\?/);
  assert.match(saleEditor, /Add untracked item/);
  assert.match(workspace, /Record sale/);
  assert.doesNotMatch(workspace, /\/api\/inventory/);
  assert.match(vendorCheckout, /href="\/event-ledger"/);
  assert.match(vendorCheckout, /paymentMethod/);
});

test("Vendor Quick Sale writes the canonical active Event Ledger", () => {
  const vendorPage = readFileSync(
    new URL("../app/vendor/page.tsx", import.meta.url),
    "utf8",
  );
  const vendorWorkspace = readFileSync(
    new URL(
      "../features/vendor/components/SnapshotVendorWorkspace.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const vendorCheckout = readFileSync(
    new URL(
      "../features/vendor/components/VendorCheckout.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const quickSale = readFileSync(
    new URL(
      "../features/events/VendorEventSalePanel.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const saleEditor = readFileSync(
    new URL("../features/events/EventSaleItemsEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(vendorPage, /requirePageModule\("VENDOR_WORKSPACE", "VIEW"\)/);
  assert.match(vendorPage, /accessSatisfies[\s\S]*"OPERATE"/);
  assert.match(vendorWorkspace, /<VendorCheckout[\s\S]*canOperate=\{canOperate\}/);
  assert.match(vendorCheckout, /Purchase intake/);
  assert.match(vendorCheckout, /Quick sale/);
  assert.match(vendorCheckout, /<VendorEventSalePanel/);
  assert.match(quickSale, /fetch\("\/api\/event-ledger"/);
  assert.match(quickSale, /action: "record-sale"/);
  assert.match(quickSale, /eventId: event\.id/);
  assert.match(quickSale, /idempotencyKey\.current/);
  assert.match(quickSale, /EventSaleItemsEditor/);
  assert.match(saleEditor, /What was actually sold\?/);
  assert.match(quickSale, /Open full Event Ledger/);
  assert.match(quickSale, /setSnapshot\(body\.snapshot\)/);
  assert.match(quickSale, /\}, \[active, event\.id\]\);/);
  assert.doesNotMatch(quickSale, /!active \|\| snapshot/);
  assert.doesNotMatch(quickSale, /\/api\/inventory|\/api\/purchases/);
});
