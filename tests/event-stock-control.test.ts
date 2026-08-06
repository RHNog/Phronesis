import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  EVENT_STOCK_HEADERS,
  parseEventStockCsv,
  parseEventStockPrice,
} from "../lib/events/eventStock.ts";
import { PurchaseLedgerRepository } from "../lib/purchases/PurchaseLedgerRepository.ts";
import { validateEventSaleDraft } from "../lib/purchases/domain.ts";

const principal = {
  workspaceId: "event-stock-workspace",
  operatorUserId: "event-stock-operator",
};

function stockCsv(...rows: string[]): string {
  return [EVENT_STOCK_HEADERS.join(","), ...rows].join("\n");
}

test("Event Inventory CSV enforces the Google Sheet contract and exact cents", () => {
  const parsed = parseEventStockCsv(
    stockCsv(
      '"Dragon Shield Sleeves","R$ 49,90",4,Black,"Matte, Standard"',
      "Deck Box,12.50,2,Blue,Sidewinder",
    ),
  );
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0]?.unitPriceCents, 4_990);
  assert.equal(parsed.rows[0]?.variation, "Matte, Standard");
  assert.equal(parsed.totalQuantity, 6);
  assert.equal(parseEventStockPrice("1.234,56"), 123_456);
  assert.equal(parseEventStockPrice("1,234.56"), 123_456);
  assert.throws(
    () => parseEventStockCsv("Name,Price,Quantity,Color,Variation\nBox,1,1,,"),
    /headers must be exactly/i,
  );
  assert.throws(
    () =>
      parseEventStockCsv(
        stockCsv(
          "Deck Box,12.50,2,Blue,Sidewinder",
          "Deck Box,12.50,1,Blue,Sidewinder",
        ),
      ),
    /Consolidate their Quantity/i,
  );
  assert.throws(() => parseEventStockPrice("-1.00"), /non-negative/i);
});

test("stock-linked Sales, retries, reversal, counts, and reports share one event", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Stocked Show",
    eventDate: "2026-08-01",
    currency: "USD",
    openingCashCents: 10_000,
  });
  const csv = stockCsv(
    "Dragon Shield Sleeves,12.50,4,Black,Matte",
    "Dragon Shield Sleeves,13.00,2,Blue,Dual Matte",
    "Collector Binder,30.00,1,Black,12-pocket",
  );
  let stock = ledger.eventStock.importCsv(
    principal,
    event.id,
    "event-stock.csv",
    csv,
  );
  assert.equal(stock.summary.optionCount, 3);
  assert.equal(stock.summary.openingQuantity, 7);
  assert.equal(stock.items.length, 3);
  assert.equal(
    ledger.eventStock.importCsv(principal, event.id, "renamed.csv", csv)
      .manifest?.id,
    stock.manifest?.id,
  );

  const blackSleeves = ledger.eventStock
    .getSnapshot(principal, event.id, "black matte")
    .items.find((item) => item.unitPriceCents === 1_250);
  const binder = ledger.eventStock.getSnapshot(
    principal,
    event.id,
    "collector binder",
  ).items[0];
  assert.ok(blackSleeves);
  assert.ok(binder);
  const sale = ledger.recordSale(
    principal,
    event.id,
    validateEventSaleDraft({
      amountCents: 5_500,
      paymentMethod: "CASH",
      items: [
        {
          description: "client text is replaced",
          quantity: 2,
          inventoryItemId: blackSleeves.id,
        },
        {
          description: "binder",
          quantity: 1,
          inventoryItemId: binder.id,
        },
      ],
    }),
    "stock-sale-1",
  );
  assert.equal(
    sale.items[0]?.description,
    "Dragon Shield Sleeves · Matte · Black",
  );
  assert.equal(sale.items[0]?.unitListPriceCents, 1_250);
  assert.equal(sale.items[0]?.inventoryItemId, blackSleeves.id);
  stock = ledger.eventStock.getSnapshot(principal, event.id);
  assert.equal(stock.summary.soldQuantity, 3);
  assert.equal(stock.summary.expectedQuantity, 4);
  assert.equal(
    ledger.recordSale(
      principal,
      event.id,
      validateEventSaleDraft({
        amountCents: 5_500,
        paymentMethod: "CASH",
        items: [{ description: "retry", quantity: 1 }],
      }),
      "stock-sale-1",
    ).id,
    sale.id,
  );
  assert.equal(
    ledger.eventStock.getSnapshot(principal, event.id).summary.soldQuantity,
    3,
  );
  assert.throws(
    () =>
      ledger.recordSale(
        principal,
        event.id,
        validateEventSaleDraft({
          amountCents: 10_000,
          paymentMethod: "CARD",
          items: [
            {
              description: "oversell",
              quantity: 3,
              inventoryItemId: blackSleeves.id,
            },
          ],
        }),
        "stock-sale-oversell",
      ),
    /only 2 expected remaining/i,
  );
  assert.equal(ledger.getEventLedgerSnapshot(principal).entries.length, 1);

  ledger.recordSale(
    principal,
    event.id,
    validateEventSaleDraft({
      amountCents: 500,
      paymentMethod: "CARD",
      items: [{ description: "Unlisted promo", quantity: 1 }],
    }),
    "manual-sale-1",
  );
  assert.equal(
    ledger.eventStock.getSnapshot(principal, event.id).summary
      .untrackedSaleUnits,
    1,
  );

  ledger.reverseLedgerEntry(
    principal,
    event.id,
    sale.id,
    "Customer returned the items",
    "stock-sale-reverse-1",
  );
  stock = ledger.eventStock.getSnapshot(principal, event.id);
  assert.equal(stock.summary.soldQuantity, 0);
  assert.equal(stock.summary.expectedQuantity, 7);
  assert.throws(
    () =>
      ledger.eventStock.importCsv(
        principal,
        event.id,
        "changed.csv",
        stockCsv("Replacement,1.00,1,,"),
      ),
    /locked after its first tracked Sale/i,
  );

  stock = ledger.eventStock.countItem(
    principal,
    event.id,
    blackSleeves.id,
    3,
    "End-of-show count",
  );
  const counted = stock.items.find((item) => item.id === blackSleeves.id);
  assert.equal(counted?.countVariance, -1);
  assert.match(
    ledger.eventStock.reportCsv(principal, event.id, "sold"),
    /Whole Sale Total[\s\S]*Dragon Shield Sleeves/,
  );
  assert.match(
    ledger.eventStock.reportCsv(principal, event.id, "leftover"),
    /Expected Leftover[\s\S]*End|Expected Leftover/,
  );
  assert.throws(
    () =>
      ledger.eventStock.getSnapshot(
        { workspaceId: "foreign", operatorUserId: "foreign" },
        event.id,
      ),
    /Event was not found/i,
  );
  database.close();
});

test("a manifest may be superseded before its first tracked Sale", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const event = ledger.createEvent(principal, {
    name: "Import Review",
    eventDate: "2026-08-02",
    openingCashCents: 0,
  });
  const first = ledger.eventStock.importCsv(
    principal,
    event.id,
    "first.csv",
    stockCsv("Deck Box,10.00,2,Black,Standard"),
  );
  const second = ledger.eventStock.importCsv(
    principal,
    event.id,
    "second.csv",
    stockCsv("Deck Box,10.00,3,Black,Standard"),
  );
  assert.notEqual(first.manifest?.id, second.manifest?.id);
  assert.equal(second.summary.openingQuantity, 3);
  assert.equal(
    database
      .prepare(
        "SELECT COUNT(*) AS count FROM phronesis_event_stock_import WHERE status='SUPERSEDED'",
      )
      .get()?.count,
    1,
  );
  database.close();
});

test("Event Inventory API remains authorized and local", () => {
  const route = readFileSync(
    new URL("../app/api/event-inventory/route.ts", import.meta.url),
    "utf8",
  );
  const ledger = readFileSync(
    new URL("../lib/purchases/PurchaseLedgerRepository.ts", import.meta.url),
    "utf8",
  );
  const fullLedger = readFileSync(
    new URL("../features/events/EventLedgerWorkspace.tsx", import.meta.url),
    "utf8",
  );
  const liteLedger = readFileSync(
    new URL("../features/events/VendorEventSalePanel.tsx", import.meta.url),
    "utf8",
  );
  const saleEditor = readFileSync(
    new URL("../features/events/EventSaleItemsEditor.tsx", import.meta.url),
    "utf8",
  );
  const inventoryControl = readFileSync(
    new URL("../features/events/EventInventoryControl.tsx", import.meta.url),
    "utf8",
  );
  assert.match(route, /"VENDOR_WORKSPACE",\s*"VIEW"/);
  assert.match(route, /"VENDOR_WORKSPACE",\s*"OPERATE"/);
  assert.match(route, /import-csv/);
  assert.match(route, /count-item/);
  assert.match(route, /report === "sold" \|\| report === "leftover"/);
  assert.match(ledger, /resolveSaleItems/);
  assert.match(ledger, /recordSaleMovements/);
  assert.match(ledger, /reverseSaleMovements/);
  assert.match(fullLedger, /EventInventoryControl/);
  assert.match(fullLedger, /EventSaleItemsEditor/);
  assert.match(liteLedger, /EventSaleItemsEditor/);
  assert.match(fullLedger, /inventoryItemId: item\.inventoryItemId/);
  assert.match(liteLedger, /inventoryItemId: item\.inventoryItemId/);
  assert.match(saleEditor, /\/api\/event-sale-options/);
  assert.doesNotMatch(saleEditor, /\/api\/event-ledger/);
  assert.match(inventoryControl, /aria-expanded=\{verificationOpen\}/);
  assert.match(inventoryControl, /Physical verification/);
});
