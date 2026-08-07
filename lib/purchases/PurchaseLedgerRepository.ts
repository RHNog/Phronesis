import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { InventoryRepository } from "@/lib/inventory/InventoryRepository";
import { DisplayCaseRepository } from "@/lib/events/DisplayCaseRepository";
import {
  EventStockRepository,
  type ResolvedEventSaleItem,
} from "@/lib/events/EventStockRepository";
import type { SearchMatch } from "@/lib/pricing/types";
import {
  validateEventCashAdjustmentDraft,
  validateEventManualPurchaseDraft,
  validateEventPaymentMethod,
  validateEventProductOwnerDrafts,
  validatePurchaseCartLineUpdate,
  validateEventSaleDraft,
  type EventCashAdjustmentDraft,
  type EventCurrency,
  type EventLedgerEntry,
  type EventLedgerReportIndex,
  type EventLedgerEntryType,
  type EventLedgerSnapshot,
  type EventLedgerSummary,
  type EventManualPurchaseDraft,
  type EventPaymentMethod,
  type EventProductOwner,
  type EventProductOwnerDraft,
  type EventSaleDraft,
  type EventSaleItem,
  type PurchaseEvent,
  type PurchaseCasePlacementDraft,
  type PurchaseLine,
  type PurchaseLineDraft,
  type PurchasePrincipal,
  type PurchaseReceipt,
} from "@/lib/purchases/domain";

type SqlRow = Record<string, string | number | null>;

function parseLine(value: string): PurchaseLine {
  return JSON.parse(value) as PurchaseLine;
}

export class PurchaseLedgerRepository {
  private readonly inventory: InventoryRepository;
  readonly eventStock: EventStockRepository;
  readonly displayCase: DisplayCaseRepository;

  constructor(private readonly database: DatabaseSync) {
    this.migrate();
    this.eventStock = new EventStockRepository(database);
    this.inventory = new InventoryRepository(database);
    this.displayCase = new DisplayCaseRepository(database);
  }

  migrate() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_purchase_event (
        id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, created_by_user_id TEXT NOT NULL,
        name TEXT NOT NULL, event_date TEXT NOT NULL, location TEXT, budget_cents INTEGER,
        currency TEXT, opening_cash_cents INTEGER,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','CLOSED')),
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        closed_at TEXT, closing_cash_cents INTEGER,
        closing_expected_cash_cents INTEGER, closing_variance_cents INTEGER,
        closed_by_user_id TEXT
      );
      CREATE INDEX IF NOT EXISTS phronesis_purchase_event_workspace
        ON phronesis_purchase_event(workspace_id, status, event_date DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_purchase_event_one_active
        ON phronesis_purchase_event(workspace_id) WHERE status='ACTIVE';
      CREATE TABLE IF NOT EXISTS phronesis_purchase_cart_line (
        id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, operator_user_id TEXT NOT NULL,
        event_id TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_purchase_cart_owner
        ON phronesis_purchase_cart_line(workspace_id, operator_user_id, event_id, created_at);
      CREATE TABLE IF NOT EXISTS phronesis_purchase_receipt (
        id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, operator_user_id TEXT NOT NULL,
        event_id TEXT NOT NULL, idempotency_key TEXT NOT NULL, total_cents INTEGER NOT NULL,
        created_at TEXT NOT NULL, voided_at TEXT,
        UNIQUE(workspace_id, operator_user_id, idempotency_key),
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id)
      );
      CREATE TABLE IF NOT EXISTS phronesis_purchase_receipt_line (
        receipt_id TEXT NOT NULL, position INTEGER NOT NULL, payload_json TEXT NOT NULL,
        PRIMARY KEY(receipt_id, position),
        FOREIGN KEY(receipt_id) REFERENCES phronesis_purchase_receipt(id)
      );
      CREATE TABLE IF NOT EXISTS phronesis_purchase_audit (
        id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, actor_user_id TEXT NOT NULL,
        action TEXT NOT NULL, receipt_id TEXT, details_json TEXT NOT NULL, created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS phronesis_event_ledger_entry (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        operator_user_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        entry_type TEXT NOT NULL CHECK(entry_type IN ('SALE','PURCHASE','CASH_ADJUSTMENT','REVERSAL')),
        payment_method TEXT NOT NULL CHECK(payment_method IN ('CASH','CARD','TRANSFER','OTHER')),
        amount_cents INTEGER NOT NULL CHECK(amount_cents >= 0),
        cash_effect_cents INTEGER NOT NULL,
        description TEXT,
        linked_receipt_id TEXT,
        reversal_of_entry_id TEXT,
        created_at TEXT NOT NULL,
        UNIQUE(workspace_id, operator_user_id, idempotency_key),
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id),
        FOREIGN KEY(linked_receipt_id) REFERENCES phronesis_purchase_receipt(id),
        FOREIGN KEY(reversal_of_entry_id) REFERENCES phronesis_event_ledger_entry(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_ledger_event
        ON phronesis_event_ledger_entry(workspace_id, event_id, created_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_event_ledger_receipt
        ON phronesis_event_ledger_entry(linked_receipt_id)
        WHERE linked_receipt_id IS NOT NULL AND entry_type='PURCHASE';
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_event_ledger_reversal
        ON phronesis_event_ledger_entry(reversal_of_entry_id)
        WHERE reversal_of_entry_id IS NOT NULL;
      CREATE TABLE IF NOT EXISTS phronesis_event_sale_item (
        entry_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        description TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        PRIMARY KEY(entry_id, position),
        FOREIGN KEY(entry_id) REFERENCES phronesis_event_ledger_entry(id)
      );
      CREATE TABLE IF NOT EXISTS phronesis_event_product_owner (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        reference TEXT,
        position INTEGER NOT NULL CHECK(position >= 0),
        created_at TEXT NOT NULL,
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_event_product_owner_name
        ON phronesis_event_product_owner(event_id, name COLLATE NOCASE);
      CREATE INDEX IF NOT EXISTS phronesis_event_product_owner_event
        ON phronesis_event_product_owner(workspace_id, event_id, position);
    `);
    this.ensureColumn("phronesis_purchase_event", "currency", "TEXT");
    this.ensureColumn(
      "phronesis_purchase_event",
      "opening_cash_cents",
      "INTEGER",
    );
    this.ensureColumn("phronesis_purchase_event", "closed_at", "TEXT");
    this.ensureColumn(
      "phronesis_purchase_event",
      "closing_cash_cents",
      "INTEGER",
    );
    this.ensureColumn(
      "phronesis_purchase_event",
      "closing_expected_cash_cents",
      "INTEGER",
    );
    this.ensureColumn(
      "phronesis_purchase_event",
      "closing_variance_cents",
      "INTEGER",
    );
    this.ensureColumn("phronesis_purchase_event", "closed_by_user_id", "TEXT");
    this.ensureColumn(
      "phronesis_event_sale_item",
      "product_owner_id",
      "TEXT",
    );
    this.database.exec(`
      CREATE INDEX IF NOT EXISTS phronesis_event_sale_item_owner
        ON phronesis_event_sale_item(product_owner_id)
        WHERE product_owner_id IS NOT NULL;
    `);
  }

  createEvent(
    principal: PurchasePrincipal,
    input: {
      name: string;
      eventDate: string;
      location?: string;
      budgetCents?: number | null;
      currency?: EventCurrency;
      openingCashCents?: number;
      productOwners?: EventProductOwnerDraft[];
    },
  ): PurchaseEvent {
    const name = input.name.trim();
    if (!name || name.length > 120) {
      throw new Error("Event name must be between 1 and 120 characters.");
    }
    const parsedEventDate = new Date(`${input.eventDate}T00:00:00.000Z`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate) ||
      Number.isNaN(parsedEventDate.valueOf()) ||
      parsedEventDate.toISOString().slice(0, 10) !== input.eventDate
    ) {
      throw new Error("Event date is invalid.");
    }
    const location = input.location?.trim() || null;
    if (location && location.length > 160) {
      throw new Error("Event location cannot exceed 160 characters.");
    }
    const budget = input.budgetCents ?? null;
    if (budget !== null && (!Number.isSafeInteger(budget) || budget < 0)) {
      throw new Error("Event budget is invalid.");
    }
    const currency = input.currency ?? "USD";
    if (currency !== "USD" && currency !== "BRL") {
      throw new Error("Event currency must be USD or BRL.");
    }
    const openingCashCents = input.openingCashCents ?? 0;
    if (!Number.isSafeInteger(openingCashCents) || openingCashCents < 0) {
      throw new Error("Opening cash must be a non-negative cent value.");
    }
    const productOwners = validateEventProductOwnerDrafts(input.productOwners);
    const activeEvent = this.getActiveEvent(principal);
    if (activeEvent) {
      if (
        activeEvent.name === name &&
        activeEvent.eventDate === input.eventDate &&
        activeEvent.location === location &&
        activeEvent.currency === currency &&
        activeEvent.openingCashCents === openingCashCents &&
        activeEvent.budgetCents === budget &&
        this.sameProductOwnerRoster(
          this.listEventProductOwners(principal.workspaceId, activeEvent.id),
          productOwners,
        )
      ) {
        return activeEvent;
      }
      throw new Error("Close the active event before starting another one.");
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    this.withTransaction(() => {
      this.database
        .prepare(
          `
          INSERT INTO phronesis_purchase_event(
            id, workspace_id, created_by_user_id, name, event_date, location,
            budget_cents, currency, opening_cash_cents, status, created_at, updated_at
          ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        `,
        )
        .run(
          id,
          principal.workspaceId,
          principal.operatorUserId,
          name,
          input.eventDate,
          location,
          budget,
          currency,
          openingCashCents,
          now,
          now,
        );
      const insertOwner = this.database.prepare(
        `INSERT INTO phronesis_event_product_owner(
           id, workspace_id, event_id, name, reference, position, created_at
         ) VALUES(?, ?, ?, ?, ?, ?, ?)`,
      );
      productOwners.forEach((owner, position) => {
        insertOwner.run(
          randomUUID(),
          principal.workspaceId,
          id,
          owner.name,
          owner.reference ?? null,
          position,
          now,
        );
      });
    });
    return {
      id,
      name,
      eventDate: input.eventDate,
      location,
      budgetCents: budget,
      currency,
      openingCashCents,
      status: "ACTIVE",
      createdAt: now,
      closedAt: null,
      closingCashCents: null,
      closingExpectedCashCents: null,
      closingVarianceCents: null,
      closedByUserId: null,
    };
  }

  getActiveEvent(principal: PurchasePrincipal): PurchaseEvent | null {
    const row = this.database
      .prepare(
        `
        SELECT * FROM phronesis_purchase_event
        WHERE workspace_id=? AND status='ACTIVE'
        ORDER BY event_date DESC, created_at DESC LIMIT 1
      `,
      )
      .get(principal.workspaceId) as SqlRow | undefined;
    return row ? this.eventFromRow(row) : null;
  }

  getEventLedgerSnapshot(principal: PurchasePrincipal): EventLedgerSnapshot {
    const event =
      this.getActiveEvent(principal) ?? this.getLatestClosedEvent(principal);
    if (!event) {
      return {
        event: null,
        productOwners: [],
        summary: null,
        entries: [],
        canStartNewEvent: true,
      };
    }
    return this.snapshotForEvent(principal, event);
  }

  getClosedEventLedgerSnapshot(
    principal: PurchasePrincipal,
    eventId: string,
  ): EventLedgerSnapshot {
    const normalizedEventId = eventId.trim();
    if (!normalizedEventId || normalizedEventId.length > 120) {
      throw new Error("Event report was not found.");
    }
    const event = this.getEventById(principal.workspaceId, normalizedEventId);
    if (!event || event.status !== "CLOSED") {
      throw new Error("Event report was not found.");
    }
    return this.snapshotForEvent(principal, event);
  }

  listClosedEventReports(
    principal: PurchasePrincipal,
    limit = 100,
  ): EventLedgerReportIndex {
    const boundedLimit = Math.min(Math.max(Math.trunc(limit), 1), 100);
    const rows = this.database
      .prepare(
        `
        SELECT * FROM phronesis_purchase_event
        WHERE workspace_id=? AND status='CLOSED'
        ORDER BY event_date DESC, created_at DESC, id DESC
        LIMIT ?
      `,
      )
      .all(principal.workspaceId, boundedLimit + 1) as SqlRow[];
    const truncated = rows.length > boundedLimit;
    return {
      reports: rows.slice(0, boundedLimit).map((row) => {
        const event = this.eventFromRow(row);
        return {
          event,
          summary: this.summarizeEvent(principal.workspaceId, event),
        };
      }),
      truncated,
    };
  }

  recordSale(
    principal: PurchasePrincipal,
    eventId: string,
    draft: EventSaleDraft,
    idempotencyKey: string,
  ): EventLedgerEntry {
    this.assertIdempotencyKey(idempotencyKey);
    const existing = this.findLedgerEntryByKey(principal, idempotencyKey);
    if (existing) return this.assertIdempotentEntry(existing, eventId, "SALE");
    const sale = validateEventSaleDraft(draft);
    this.assertActiveEvent(principal.workspaceId, eventId);
    const id = randomUUID();
    const now = new Date().toISOString();

    this.withTransaction(() => {
      this.assertSaleProductOwners(
        principal.workspaceId,
        eventId,
        sale.items,
      );
      const resolvedItems = this.displayCase.resolveSaleItems(
        principal,
        eventId,
        this.eventStock.resolveSaleItems(principal, eventId, sale.items),
      );
      this.insertLedgerEntry({
        id,
        principal,
        eventId,
        idempotencyKey,
        type: "SALE",
        paymentMethod: sale.paymentMethod,
        amountCents: sale.amountCents,
        cashEffectCents: sale.paymentMethod === "CASH" ? sale.amountCents : 0,
        description: sale.notes ?? null,
        linkedReceiptId: null,
        reversalOfEntryId: null,
        createdAt: now,
      });
      const insertItem = this.database.prepare(
        `INSERT INTO phronesis_event_sale_item(
           entry_id, position, description, quantity, event_stock_item_id,
           event_case_item_id, unit_list_price_cents, color, variation,
           product_owner_id
         ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      );
      resolvedItems.forEach((item, position) => {
        insertItem.run(
          id,
          position,
          item.description,
          item.quantity,
          item.inventoryItemId ?? null,
          item.caseItemId ?? null,
          item.unitListPriceCents ?? null,
          item.color ?? null,
          item.variation ?? null,
          item.productOwnerId ?? null,
        );
      });
      this.eventStock.recordSaleMovements(
        principal,
        eventId,
        id,
        resolvedItems as ResolvedEventSaleItem[],
        now,
      );
      this.displayCase.recordSaleMovements(
        principal,
        eventId,
        id,
        resolvedItems,
        now,
      );
      this.insertAudit(principal, "EVENT_SALE_RECORDED", null, {
        entryId: id,
        eventId,
        amountCents: sale.amountCents,
        paymentMethod: sale.paymentMethod,
        itemCount: resolvedItems.length,
        trackedItemCount: resolvedItems.filter(
          (item) => item.inventoryItemId || item.caseItemId,
        ).length,
        consignedItemCount: resolvedItems.filter(
          (item) => Boolean(item.productOwnerId),
        ).length,
      });
    });

    return this.requireLedgerEntry(principal.workspaceId, id);
  }

  recordManualPurchase(
    principal: PurchasePrincipal,
    eventId: string,
    draft: EventManualPurchaseDraft,
    idempotencyKey: string,
  ): EventLedgerEntry {
    this.assertIdempotencyKey(idempotencyKey);
    const existing = this.findLedgerEntryByKey(principal, idempotencyKey);
    if (existing)
      return this.assertIdempotentEntry(existing, eventId, "PURCHASE");
    const purchase = validateEventManualPurchaseDraft(draft);
    this.assertActiveEvent(principal.workspaceId, eventId);
    const id = randomUUID();
    const now = new Date().toISOString();

    this.withTransaction(() => {
      this.insertLedgerEntry({
        id,
        principal,
        eventId,
        idempotencyKey,
        type: "PURCHASE",
        paymentMethod: purchase.paymentMethod,
        amountCents: purchase.amountCents,
        cashEffectCents:
          purchase.paymentMethod === "CASH" ? -purchase.amountCents : 0,
        description: purchase.description ?? null,
        linkedReceiptId: null,
        reversalOfEntryId: null,
        createdAt: now,
      });
      this.insertAudit(principal, "EVENT_PURCHASE_RECORDED", null, {
        entryId: id,
        eventId,
        amountCents: purchase.amountCents,
        paymentMethod: purchase.paymentMethod,
      });
    });

    return this.requireLedgerEntry(principal.workspaceId, id);
  }

  recordCashAdjustment(
    principal: PurchasePrincipal,
    eventId: string,
    draft: EventCashAdjustmentDraft,
    idempotencyKey: string,
  ): EventLedgerEntry {
    this.assertIdempotencyKey(idempotencyKey);
    const existing = this.findLedgerEntryByKey(principal, idempotencyKey);
    if (existing) {
      return this.assertIdempotentEntry(existing, eventId, "CASH_ADJUSTMENT");
    }
    const adjustment = validateEventCashAdjustmentDraft(draft);
    this.assertActiveEvent(principal.workspaceId, eventId);
    const id = randomUUID();
    const now = new Date().toISOString();
    const cashEffectCents =
      adjustment.direction === "IN"
        ? adjustment.amountCents
        : -adjustment.amountCents;

    this.withTransaction(() => {
      this.insertLedgerEntry({
        id,
        principal,
        eventId,
        idempotencyKey,
        type: "CASH_ADJUSTMENT",
        paymentMethod: "CASH",
        amountCents: adjustment.amountCents,
        cashEffectCents,
        description: adjustment.reason,
        linkedReceiptId: null,
        reversalOfEntryId: null,
        createdAt: now,
      });
      this.insertAudit(principal, "EVENT_CASH_ADJUSTED", null, {
        entryId: id,
        eventId,
        amountCents: adjustment.amountCents,
        direction: adjustment.direction,
        reason: adjustment.reason,
      });
    });

    return this.requireLedgerEntry(principal.workspaceId, id);
  }

  reverseLedgerEntry(
    principal: PurchasePrincipal,
    eventId: string,
    entryId: string,
    rawReason: string,
    idempotencyKey: string,
  ): EventLedgerEntry {
    this.assertIdempotencyKey(idempotencyKey);
    const existing = this.findLedgerEntryByKey(principal, idempotencyKey);
    if (existing) {
      const retry = this.assertIdempotentEntry(existing, eventId, "REVERSAL");
      if (retry.reversalOfEntryId !== entryId) {
        throw new Error(
          "Idempotency key was already used for another ledger reversal.",
        );
      }
      return retry;
    }
    const reason = rawReason.trim();
    if (!reason || reason.length > 240) {
      throw new Error(
        "A reversal reason between 1 and 240 characters is required.",
      );
    }
    this.assertActiveEvent(principal.workspaceId, eventId);
    const original = this.requireLedgerEntry(principal.workspaceId, entryId);
    if (original.eventId !== eventId) {
      throw new Error("Ledger entry does not belong to this event.");
    }
    if (original.type === "REVERSAL") {
      throw new Error("A reversal entry cannot be reversed.");
    }
    if (original.linkedReceiptId) {
      throw new Error(
        "Receipt-backed purchases must be corrected by voiding the receipt.",
      );
    }
    if (original.reversedByEntryId) {
      throw new Error("Ledger entry has already been reversed.");
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    this.withTransaction(() => {
      this.insertLedgerEntry({
        id,
        principal,
        eventId,
        idempotencyKey,
        type: "REVERSAL",
        paymentMethod: original.paymentMethod,
        amountCents: original.amountCents,
        cashEffectCents: -original.cashEffectCents,
        description: reason,
        linkedReceiptId: null,
        reversalOfEntryId: original.id,
        createdAt: now,
      });
      if (original.type === "SALE") {
        this.eventStock.reverseSaleMovements(
          principal,
          eventId,
          original.id,
          id,
          now,
        );
        this.displayCase.reverseSaleMovements(
          principal,
          eventId,
          original.id,
          id,
          now,
        );
      }
      this.insertAudit(principal, "EVENT_ENTRY_REVERSED", null, {
        entryId: id,
        originalEntryId: original.id,
        eventId,
        reason,
      });
    });

    return this.requireLedgerEntry(principal.workspaceId, id);
  }

  closeEvent(
    principal: PurchasePrincipal,
    eventId: string,
    closingCashCents: number,
  ): EventLedgerSnapshot {
    if (!Number.isSafeInteger(closingCashCents) || closingCashCents < 0) {
      throw new Error("Closing cash must be a non-negative cent value.");
    }
    const current = this.getEventById(principal.workspaceId, eventId);
    if (!current) throw new Error("Event was not found.");
    if (current.status === "CLOSED") {
      if (current.closingCashCents !== closingCashCents) {
        throw new Error(
          "Event has already been closed with a different cash count.",
        );
      }
      return this.snapshotForEvent(principal, current);
    }

    let closedEvent: PurchaseEvent | null = null;
    this.withTransaction(() => {
      this.assertActiveEvent(principal.workspaceId, eventId);
      const openCartCount = Number(
        (
          this.database
            .prepare(
              `SELECT COUNT(*) AS count FROM phronesis_purchase_cart_line
               WHERE workspace_id=? AND event_id=?`,
            )
            .get(principal.workspaceId, eventId) as SqlRow
        ).count,
      );
      if (openCartCount > 0) {
        throw new Error(
          "Finalize or remove the open purchase cart before closing the event.",
        );
      }
      const freshEvent = this.getEventById(principal.workspaceId, eventId);
      if (!freshEvent) throw new Error("Event was not found.");
      const summary = this.summarizeEvent(principal.workspaceId, freshEvent);
      const expected = summary.expectedCashCents;
      const variance = expected === null ? null : closingCashCents - expected;
      const now = new Date().toISOString();
      const result = this.database
        .prepare(
          `
          UPDATE phronesis_purchase_event
          SET status='CLOSED', closed_at=?, closing_cash_cents=?,
              closing_expected_cash_cents=?, closing_variance_cents=?,
              closed_by_user_id=?, updated_at=?
          WHERE id=? AND workspace_id=? AND status='ACTIVE'
        `,
        )
        .run(
          now,
          closingCashCents,
          expected,
          variance,
          principal.operatorUserId,
          now,
          eventId,
          principal.workspaceId,
        );
      if (Number(result.changes) !== 1) {
        throw new Error("Active event could not be closed.");
      }
      this.insertAudit(principal, "EVENT_CLOSED", null, {
        eventId,
        closingCashCents,
        expectedCashCents: expected,
        varianceCents: variance,
      });
      closedEvent = this.getEventById(principal.workspaceId, eventId);
    });

    if (!closedEvent) throw new Error("Closed event could not be loaded.");
    return this.snapshotForEvent(principal, closedEvent);
  }

  addLine(
    principal: PurchasePrincipal,
    eventId: string,
    draft: PurchaseLineDraft,
    exactMatch?: SearchMatch,
  ): PurchaseLine {
    this.assertActiveEvent(principal.workspaceId, eventId);
    const line = this.hydrateLine(draft, exactMatch);
    const now = new Date().toISOString();
    this.database
      .prepare(
        `
        INSERT INTO phronesis_purchase_cart_line(
          id, workspace_id, operator_user_id, event_id, payload_json, created_at, updated_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        line.id,
        principal.workspaceId,
        principal.operatorUserId,
        eventId,
        JSON.stringify(line),
        now,
        now,
      );
    return line;
  }

  listCart(principal: PurchasePrincipal, eventId: string): PurchaseLine[] {
    return (
      this.database
        .prepare(
          `
          SELECT payload_json FROM phronesis_purchase_cart_line
          WHERE workspace_id=? AND operator_user_id=? AND event_id=?
          ORDER BY created_at, id
        `,
        )
        .all(
          principal.workspaceId,
          principal.operatorUserId,
          eventId,
        ) as SqlRow[]
    ).map((row) => parseLine(String(row.payload_json)));
  }

  removeLine(principal: PurchasePrincipal, lineId: string): boolean {
    const result = this.database
      .prepare(
        `DELETE FROM phronesis_purchase_cart_line
         WHERE id=? AND workspace_id=? AND operator_user_id=?`,
      )
      .run(lineId, principal.workspaceId, principal.operatorUserId);
    return Number(result.changes) === 1;
  }

  updateLine(
    principal: PurchasePrincipal,
    lineId: string,
    rawChanges: unknown,
  ): PurchaseLine {
    const row = this.database
      .prepare(
        `SELECT event_id, payload_json FROM phronesis_purchase_cart_line
         WHERE id=? AND workspace_id=? AND operator_user_id=?`,
      )
      .get(lineId, principal.workspaceId, principal.operatorUserId) as
      SqlRow | undefined;
    if (!row) throw new Error("Cart line was not found.");
    const eventId = String(row.event_id);
    this.assertActiveEvent(principal.workspaceId, eventId);
    const line = parseLine(String(row.payload_json));
    const changes = validatePurchaseCartLineUpdate(rawChanges, line.kind);
    const updated: PurchaseLine =
      line.kind === "EXACT"
        ? {
            ...line,
            actualPaidCents: changes.actualPaidCents,
            quantity: changes.quantity!,
          }
        : {
            ...line,
            actualPaidCents: changes.actualPaidCents,
            approximateQuantity: changes.quantity,
          };
    const result = this.database
      .prepare(
        `UPDATE phronesis_purchase_cart_line
         SET payload_json=?, updated_at=?
         WHERE id=? AND workspace_id=? AND operator_user_id=? AND event_id=?`,
      )
      .run(
        JSON.stringify(updated),
        new Date().toISOString(),
        lineId,
        principal.workspaceId,
        principal.operatorUserId,
        eventId,
      );
    if (Number(result.changes) !== 1) {
      throw new Error("Cart line could not be updated.");
    }
    return updated;
  }

  checkout(
    principal: PurchasePrincipal,
    eventId: string,
    idempotencyKey: string,
    paymentMethod: EventPaymentMethod = "CASH",
    casePlacements: readonly PurchaseCasePlacementDraft[] = [],
  ): PurchaseReceipt {
    this.assertIdempotencyKey(idempotencyKey);
    const method = validateEventPaymentMethod(paymentMethod);
    const existing = this.findReceiptByKey(principal, idempotencyKey);
    if (existing) {
      if (existing.eventId !== eventId) {
        throw new Error(
          "Idempotency key was already used for another purchase event.",
        );
      }
      return existing;
    }
    this.assertActiveEvent(principal.workspaceId, eventId);
    const lines = this.listCart(principal, eventId);
    if (!lines.length) throw new Error("The event cart is empty.");
    return this.finalizeReceipt(
      principal,
      eventId,
      idempotencyKey,
      method,
      lines,
      true,
      casePlacements,
    );
  }

  checkoutImmediate(
    principal: PurchasePrincipal,
    eventId: string,
    draft: PurchaseLineDraft,
    exactMatch: SearchMatch | undefined,
    idempotencyKey: string,
    paymentMethod: EventPaymentMethod = "CASH",
  ): PurchaseReceipt {
    this.assertIdempotencyKey(idempotencyKey);
    const method = validateEventPaymentMethod(paymentMethod);
    const existing = this.findReceiptByKey(principal, idempotencyKey);
    if (existing) {
      if (existing.eventId !== eventId) {
        throw new Error(
          "Idempotency key was already used for another purchase event.",
        );
      }
      return existing;
    }
    this.assertActiveEvent(principal.workspaceId, eventId);
    return this.finalizeReceipt(
      principal,
      eventId,
      idempotencyKey,
      method,
      [this.hydrateLine(draft, exactMatch)],
      false,
      [],
    );
  }

  listReceipts(
    principal: PurchasePrincipal,
    workspaceWide = false,
  ): PurchaseReceipt[] {
    const rows = workspaceWide
      ? this.database
          .prepare(
            `SELECT * FROM phronesis_purchase_receipt
             WHERE workspace_id=? ORDER BY created_at DESC`,
          )
          .all(principal.workspaceId)
      : this.database
          .prepare(
            `SELECT * FROM phronesis_purchase_receipt
             WHERE workspace_id=? AND operator_user_id=? ORDER BY created_at DESC`,
          )
          .all(principal.workspaceId, principal.operatorUserId);
    return (rows as SqlRow[]).map((row) => this.receiptFromRow(row));
  }

  voidReceipt(
    principal: PurchasePrincipal,
    receiptId: string,
    reason: string,
  ): PurchaseReceipt {
    const note = reason.trim();
    if (!note || note.length > 240) {
      throw new Error(
        "A void reason between 1 and 240 characters is required.",
      );
    }
    const now = new Date().toISOString();
    this.withTransaction(() => {
      this.displayCase.assertReceiptCanVoid(principal.workspaceId, receiptId);
      const result = this.database
        .prepare(
          `UPDATE phronesis_purchase_receipt SET voided_at=?
           WHERE id=? AND workspace_id=? AND voided_at IS NULL`,
        )
        .run(now, receiptId, principal.workspaceId);
      if (Number(result.changes) !== 1) {
        throw new Error("Receipt was not found or was already voided.");
      }
      this.inventory.voidReceipt(principal.workspaceId, receiptId, now, note);
      const linked = this.database
        .prepare(
          `SELECT * FROM phronesis_event_ledger_entry
           WHERE workspace_id=? AND linked_receipt_id=? AND entry_type='PURCHASE'`,
        )
        .get(principal.workspaceId, receiptId) as SqlRow | undefined;
      if (linked) {
        this.insertLedgerEntry({
          id: randomUUID(),
          principal,
          eventId: String(linked.event_id),
          idempotencyKey: `receipt-void:${receiptId}`,
          type: "REVERSAL",
          paymentMethod: String(linked.payment_method) as EventPaymentMethod,
          amountCents: Number(linked.amount_cents),
          cashEffectCents: -Number(linked.cash_effect_cents),
          description: `Receipt void: ${note}`,
          linkedReceiptId: null,
          reversalOfEntryId: String(linked.id),
          createdAt: now,
        });
      }
      this.insertAudit(principal, "RECEIPT_VOIDED", receiptId, {
        reason: note,
      });
    });
    const row = this.database
      .prepare(
        "SELECT * FROM phronesis_purchase_receipt WHERE id=? AND workspace_id=?",
      )
      .get(receiptId, principal.workspaceId) as SqlRow;
    return this.receiptFromRow(row);
  }

  private finalizeReceipt(
    principal: PurchasePrincipal,
    eventId: string,
    idempotencyKey: string,
    paymentMethod: EventPaymentMethod,
    lines: readonly PurchaseLine[],
    clearCart: boolean,
    casePlacements: readonly PurchaseCasePlacementDraft[],
  ): PurchaseReceipt {
    const totalCents = lines.reduce(
      (sum, line) =>
        sum +
        line.actualPaidCents * (line.kind === "EXACT" ? line.quantity : 1),
      0,
    );
    if (!Number.isSafeInteger(totalCents) || totalCents <= 0) {
      throw new Error("Purchase total must be greater than zero.");
    }
    const id = randomUUID();
    const now = new Date().toISOString();
    const placements = this.validateCheckoutCasePlacements(
      lines,
      casePlacements,
    );

    this.withTransaction(() => {
      this.assertActiveEvent(principal.workspaceId, eventId);
      this.database
        .prepare(
          `
          INSERT INTO phronesis_purchase_receipt(
            id, workspace_id, operator_user_id, event_id,
            idempotency_key, total_cents, created_at
          ) VALUES(?, ?, ?, ?, ?, ?, ?)
        `,
        )
        .run(
          id,
          principal.workspaceId,
          principal.operatorUserId,
          eventId,
          idempotencyKey,
          totalCents,
          now,
        );
      const insertLine = this.database.prepare(
        `INSERT INTO phronesis_purchase_receipt_line(receipt_id, position, payload_json)
         VALUES(?, ?, ?)`,
      );
      lines.forEach((line, index) => {
        insertLine.run(id, index, JSON.stringify(line));
      });
      this.inventory.recordReceipt(
        {
          workspaceId: principal.workspaceId,
          receiptId: id,
          eventId,
          operatorUserId: principal.operatorUserId,
          createdAt: now,
        },
        lines,
      );
      if (placements.length) {
        const selections = placements.map((placement) => {
          const sourceLinePosition = lines.findIndex(
            (line) => line.id === placement.lineId,
          );
          const lot = this.database
            .prepare(
              `SELECT id FROM phronesis_inventory_lot
               WHERE workspace_id=? AND source_receipt_id=?
                 AND source_line_position=? AND voided_at IS NULL`,
            )
            .get(principal.workspaceId, id, sourceLinePosition) as
            SqlRow | undefined;
          if (!lot) {
            throw new Error(
              "Receipt-backed Inventory was not available for Case placement.",
            );
          }
          const line = lines[sourceLinePosition];
          if (!line || line.kind !== "EXACT") {
            throw new Error("Only exact single cards can be sent to the Case.");
          }
          return {
            inventoryLotId: String(lot.id),
            quantity: placement.quantity,
            salePriceCents: placement.salePriceCents,
          };
        });
        this.displayCase.addToCase(
          principal,
          eventId,
          selections,
          `receipt-case:${id}`,
          "VENDOR_CHECKOUT",
        );
      }
      this.insertLedgerEntry({
        id: randomUUID(),
        principal,
        eventId,
        idempotencyKey: `receipt:${id}`,
        type: "PURCHASE",
        paymentMethod,
        amountCents: totalCents,
        cashEffectCents: paymentMethod === "CASH" ? -totalCents : 0,
        description: this.describePurchase(lines),
        linkedReceiptId: id,
        reversalOfEntryId: null,
        createdAt: now,
      });
      if (clearCart) {
        this.database
          .prepare(
            `DELETE FROM phronesis_purchase_cart_line
             WHERE workspace_id=? AND operator_user_id=? AND event_id=?`,
          )
          .run(principal.workspaceId, principal.operatorUserId, eventId);
      }
      this.insertAudit(principal, "RECEIPT_FINALIZED", id, {
        totalCents,
        lineCount: lines.length,
        paymentMethod,
        displayCaseLineCount: placements.length,
      });
    });

    return {
      id,
      eventId,
      operatorUserId: principal.operatorUserId,
      totalCents,
      createdAt: now,
      voidedAt: null,
      lines: [...lines],
    };
  }

  private validateCheckoutCasePlacements(
    lines: readonly PurchaseLine[],
    rawPlacements: readonly PurchaseCasePlacementDraft[],
  ): PurchaseCasePlacementDraft[] {
    if (rawPlacements.length > 50) {
      throw new Error(
        "No more than 50 purchase lines can be sent to the Case.",
      );
    }
    const placements = rawPlacements.map((placement) => ({
      lineId:
        typeof placement.lineId === "string" ? placement.lineId.trim() : "",
      quantity: Number(placement.quantity),
      salePriceCents: Number(placement.salePriceCents),
    }));
    if (
      new Set(placements.map((placement) => placement.lineId)).size !==
      placements.length
    ) {
      throw new Error("Each purchase line can be sent to the Case only once.");
    }
    for (const placement of placements) {
      if (!placement.lineId || placement.lineId.length > 120) {
        throw new Error(
          "Purchase line identity is invalid for Case placement.",
        );
      }
      if (
        !Number.isSafeInteger(placement.salePriceCents) ||
        placement.salePriceCents <= 0
      ) {
        throw new Error("Case Sale price must be a positive cent value.");
      }
      const line = lines.find((candidate) => candidate.id === placement.lineId);
      if (!line || line.kind !== "EXACT" || line.productType !== "SINGLE") {
        throw new Error(
          "Only exact single-card purchase lines can be sent to the Case.",
        );
      }
      if (
        !Number.isInteger(placement.quantity) ||
        placement.quantity <= 0 ||
        placement.quantity > line.quantity
      ) {
        throw new Error(
          `Case quantity must be between 1 and the ${line.quantity} purchased units.`,
        );
      }
    }
    return placements;
  }

  private hydrateLine(
    draft: PurchaseLineDraft,
    exactMatch?: SearchMatch,
  ): PurchaseLine {
    const id = randomUUID();
    if (draft.kind === "BULK") return { ...draft, id };
    if (
      !exactMatch ||
      exactMatch.categoryId !== draft.categoryId ||
      exactMatch.sku !== draft.sku
    ) {
      throw new Error("Exact catalogue product was not found.");
    }
    return {
      ...draft,
      id,
      name: exactMatch.name,
      setName: exactMatch.setName,
      collectorNumber: exactMatch.collectorNumber,
      variant: exactMatch.variant,
      language: exactMatch.language,
      productType: exactMatch.productType,
    };
  }

  private snapshotForEvent(
    principal: PurchasePrincipal,
    event: PurchaseEvent,
  ): EventLedgerSnapshot {
    return {
      event,
      productOwners: this.listEventProductOwners(
        principal.workspaceId,
        event.id,
      ),
      summary: this.summarizeEvent(principal.workspaceId, event),
      entries: this.listLedgerEntries(principal.workspaceId, event.id),
      canStartNewEvent: event.status === "CLOSED",
    };
  }

  private summarizeEvent(
    workspaceId: string,
    event: PurchaseEvent,
  ): EventLedgerSummary {
    const row = this.database
      .prepare(
        `
        SELECT
          COALESCE(SUM(CASE WHEN original.entry_type='SALE' THEN original.amount_cents ELSE 0 END), 0) AS gross_sales_cents,
          COALESCE(SUM(CASE WHEN original.entry_type='SALE' AND original.payment_method='CASH' THEN original.amount_cents ELSE 0 END), 0) AS cash_sales_cents,
          COALESCE(SUM(CASE WHEN original.entry_type='SALE' AND original.payment_method<>'CASH' THEN original.amount_cents ELSE 0 END), 0) AS non_cash_sales_cents,
          COALESCE(SUM(CASE WHEN original.entry_type='PURCHASE' THEN original.amount_cents ELSE 0 END), 0) AS purchase_spend_cents,
          COALESCE(SUM(CASE WHEN original.entry_type='PURCHASE' AND original.payment_method='CASH' THEN original.amount_cents ELSE 0 END), 0) AS cash_purchase_cents,
          COALESCE(SUM(CASE WHEN original.entry_type='CASH_ADJUSTMENT' THEN original.cash_effect_cents ELSE 0 END), 0) AS cash_adjustment_cents,
          COALESCE(SUM(original.cash_effect_cents), 0) AS total_cash_effect_cents,
          COUNT(*) AS active_transaction_count
        FROM phronesis_event_ledger_entry AS original
        LEFT JOIN phronesis_event_ledger_entry AS reversal
          ON reversal.reversal_of_entry_id=original.id
        WHERE original.workspace_id=? AND original.event_id=?
          AND original.entry_type<>'REVERSAL' AND reversal.id IS NULL
      `,
      )
      .get(workspaceId, event.id) as SqlRow;
    const grossSalesCents = Number(row.gross_sales_cents);
    const purchaseSpendCents = Number(row.purchase_spend_cents);
    const expectedCashCents =
      event.openingCashCents === null
        ? null
        : event.openingCashCents + Number(row.total_cash_effect_cents);

    return {
      openingCashCents: event.openingCashCents,
      grossSalesCents,
      cashSalesCents: Number(row.cash_sales_cents),
      nonCashSalesCents: Number(row.non_cash_sales_cents),
      purchaseSpendCents,
      cashPurchaseCents: Number(row.cash_purchase_cents),
      cashAdjustmentCents: Number(row.cash_adjustment_cents),
      expectedCashCents,
      netEventCashMovementCents: grossSalesCents - purchaseSpendCents,
      activeTransactionCount: Number(row.active_transaction_count),
      closingCashCents: event.closingCashCents,
      closingExpectedCashCents: event.closingExpectedCashCents,
      closingVarianceCents: event.closingVarianceCents,
    };
  }

  private listLedgerEntries(
    workspaceId: string,
    eventId: string,
    limit = 200,
  ): EventLedgerEntry[] {
    const rows = this.database
      .prepare(
        `
        SELECT entry.*, reversal.id AS reversed_by_entry_id
        FROM phronesis_event_ledger_entry AS entry
        LEFT JOIN phronesis_event_ledger_entry AS reversal
          ON reversal.reversal_of_entry_id=entry.id
        WHERE entry.workspace_id=? AND entry.event_id=?
        ORDER BY entry.created_at DESC, entry.id DESC LIMIT ?
      `,
      )
      .all(workspaceId, eventId, limit) as SqlRow[];
    if (!rows.length) return [];
    const itemsByEntry = this.saleItemsForEvent(workspaceId, eventId);
    return rows.map((row) => this.entryFromRow(row, itemsByEntry));
  }

  private saleItemsForEvent(
    workspaceId: string,
    eventId: string,
  ): Map<string, EventSaleItem[]> {
    const rows = this.database
      .prepare(
        `
        SELECT item.entry_id, item.position, item.description, item.quantity,
          item.event_stock_item_id, item.event_case_item_id,
          item.unit_list_price_cents,
          item.color, item.variation, item.product_owner_id,
          owner.name AS product_owner_name
        FROM phronesis_event_sale_item AS item
        JOIN phronesis_event_ledger_entry AS entry ON entry.id=item.entry_id
        LEFT JOIN phronesis_event_product_owner AS owner
          ON owner.id=item.product_owner_id
          AND owner.workspace_id=entry.workspace_id
          AND owner.event_id=entry.event_id
        WHERE entry.workspace_id=? AND entry.event_id=?
        ORDER BY item.entry_id, item.position
      `,
      )
      .all(workspaceId, eventId) as SqlRow[];
    const result = new Map<string, EventSaleItem[]>();
    rows.forEach((row) => {
      const entryId = String(row.entry_id);
      const items = result.get(entryId) ?? [];
      items.push({
        position: Number(row.position),
        description: String(row.description),
        quantity: Number(row.quantity),
        inventoryItemId: row.event_stock_item_id
          ? String(row.event_stock_item_id)
          : null,
        caseItemId: row.event_case_item_id
          ? String(row.event_case_item_id)
          : null,
        unitListPriceCents:
          row.unit_list_price_cents === null
            ? null
            : Number(row.unit_list_price_cents),
        color: row.color ? String(row.color) : null,
        variation: row.variation ? String(row.variation) : null,
        productOwnerId: row.product_owner_id
          ? String(row.product_owner_id)
          : null,
        productOwnerName: row.product_owner_name
          ? String(row.product_owner_name)
          : null,
      });
      result.set(entryId, items);
    });
    return result;
  }

  private requireLedgerEntry(
    workspaceId: string,
    entryId: string,
  ): EventLedgerEntry {
    const row = this.database
      .prepare(
        `
        SELECT entry.*, reversal.id AS reversed_by_entry_id
        FROM phronesis_event_ledger_entry AS entry
        LEFT JOIN phronesis_event_ledger_entry AS reversal
          ON reversal.reversal_of_entry_id=entry.id
        WHERE entry.id=? AND entry.workspace_id=?
      `,
      )
      .get(entryId, workspaceId) as SqlRow | undefined;
    if (!row) throw new Error("Ledger entry was not found.");
    const itemRows = this.database
      .prepare(
        `SELECT item.position, item.description, item.quantity,
           item.event_stock_item_id, item.event_case_item_id,
           item.unit_list_price_cents, item.color, item.variation,
           item.product_owner_id, owner.name AS product_owner_name
         FROM phronesis_event_sale_item AS item
         LEFT JOIN phronesis_event_product_owner AS owner
           ON owner.id=item.product_owner_id
         WHERE item.entry_id=? ORDER BY item.position`,
      )
      .all(entryId) as SqlRow[];
    const items = new Map<string, EventSaleItem[]>();
    items.set(
      entryId,
      itemRows.map((item) => ({
        position: Number(item.position),
        description: String(item.description),
        quantity: Number(item.quantity),
        inventoryItemId: item.event_stock_item_id
          ? String(item.event_stock_item_id)
          : null,
        caseItemId: item.event_case_item_id
          ? String(item.event_case_item_id)
          : null,
        unitListPriceCents:
          item.unit_list_price_cents === null
            ? null
            : Number(item.unit_list_price_cents),
        color: item.color ? String(item.color) : null,
        variation: item.variation ? String(item.variation) : null,
        productOwnerId: item.product_owner_id
          ? String(item.product_owner_id)
          : null,
        productOwnerName: item.product_owner_name
          ? String(item.product_owner_name)
          : null,
      })),
    );
    return this.entryFromRow(row, items);
  }

  private findLedgerEntryByKey(
    principal: PurchasePrincipal,
    key: string,
  ): EventLedgerEntry | null {
    const row = this.database
      .prepare(
        `SELECT id FROM phronesis_event_ledger_entry
         WHERE workspace_id=? AND operator_user_id=? AND idempotency_key=?`,
      )
      .get(principal.workspaceId, principal.operatorUserId, key) as
      SqlRow | undefined;
    return row
      ? this.requireLedgerEntry(principal.workspaceId, String(row.id))
      : null;
  }

  private assertIdempotentEntry(
    entry: EventLedgerEntry,
    eventId: string,
    type: EventLedgerEntryType,
  ): EventLedgerEntry {
    if (entry.eventId !== eventId || entry.type !== type) {
      throw new Error(
        "Idempotency key was already used for another ledger action.",
      );
    }
    return entry;
  }

  private insertLedgerEntry(input: {
    id: string;
    principal: PurchasePrincipal;
    eventId: string;
    idempotencyKey: string;
    type: EventLedgerEntryType;
    paymentMethod: EventPaymentMethod;
    amountCents: number;
    cashEffectCents: number;
    description: string | null;
    linkedReceiptId: string | null;
    reversalOfEntryId: string | null;
    createdAt: string;
  }) {
    this.database
      .prepare(
        `
        INSERT INTO phronesis_event_ledger_entry(
          id, workspace_id, event_id, operator_user_id, idempotency_key,
          entry_type, payment_method, amount_cents, cash_effect_cents,
          description, linked_receipt_id, reversal_of_entry_id, created_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        input.id,
        input.principal.workspaceId,
        input.eventId,
        input.principal.operatorUserId,
        input.idempotencyKey,
        input.type,
        input.paymentMethod,
        input.amountCents,
        input.cashEffectCents,
        input.description,
        input.linkedReceiptId,
        input.reversalOfEntryId,
        input.createdAt,
      );
  }

  private entryFromRow(
    row: SqlRow,
    itemsByEntry: Map<string, EventSaleItem[]>,
  ): EventLedgerEntry {
    const id = String(row.id);
    return {
      id,
      eventId: String(row.event_id),
      operatorUserId: String(row.operator_user_id),
      type: String(row.entry_type) as EventLedgerEntryType,
      paymentMethod: String(row.payment_method) as EventPaymentMethod,
      amountCents: Number(row.amount_cents),
      cashEffectCents: Number(row.cash_effect_cents),
      description: row.description ? String(row.description) : null,
      items: itemsByEntry.get(id) ?? [],
      linkedReceiptId: row.linked_receipt_id
        ? String(row.linked_receipt_id)
        : null,
      reversalOfEntryId: row.reversal_of_entry_id
        ? String(row.reversal_of_entry_id)
        : null,
      reversedByEntryId: row.reversed_by_entry_id
        ? String(row.reversed_by_entry_id)
        : null,
      createdAt: String(row.created_at),
    };
  }

  private assertActiveEvent(workspaceId: string, eventId: string) {
    const row = this.database
      .prepare(
        `SELECT status FROM phronesis_purchase_event
         WHERE id=? AND workspace_id=?`,
      )
      .get(eventId, workspaceId) as SqlRow | undefined;
    if (!row || row.status !== "ACTIVE") {
      throw new Error("Active event was not found.");
    }
  }

  private assertSaleProductOwners(
    workspaceId: string,
    eventId: string,
    items: EventSaleDraft["items"],
  ) {
    const ownerIds = [
      ...new Set(
        items.flatMap((item) =>
          item.productOwnerId ? [item.productOwnerId] : [],
        ),
      ),
    ];
    if (!ownerIds.length) return;
    const placeholders = ownerIds.map(() => "?").join(",");
    const rows = this.database
      .prepare(
        `SELECT id FROM phronesis_event_product_owner
         WHERE workspace_id=? AND event_id=? AND id IN (${placeholders})`,
      )
      .all(workspaceId, eventId, ...ownerIds) as SqlRow[];
    if (rows.length !== ownerIds.length) {
      throw new Error(
        "Every consigned sale item must use a product owner registered before this event opened.",
      );
    }
  }

  private listEventProductOwners(
    workspaceId: string,
    eventId: string,
  ): EventProductOwner[] {
    const rows = this.database
      .prepare(
        `SELECT id, event_id, name, reference, position, created_at
         FROM phronesis_event_product_owner
         WHERE workspace_id=? AND event_id=?
         ORDER BY position, id`,
      )
      .all(workspaceId, eventId) as SqlRow[];
    return rows.map((row) => ({
      id: String(row.id),
      eventId: String(row.event_id),
      name: String(row.name),
      reference: row.reference ? String(row.reference) : undefined,
      position: Number(row.position),
      createdAt: String(row.created_at),
    }));
  }

  private sameProductOwnerRoster(
    existing: readonly EventProductOwner[],
    requested: readonly EventProductOwnerDraft[],
  ): boolean {
    return (
      existing.length === requested.length &&
      existing.every(
        (owner, index) =>
          owner.name === requested[index]?.name &&
          (owner.reference ?? undefined) === requested[index]?.reference,
      )
    );
  }

  private getEventById(
    workspaceId: string,
    eventId: string,
  ): PurchaseEvent | null {
    const row = this.database
      .prepare(
        "SELECT * FROM phronesis_purchase_event WHERE id=? AND workspace_id=?",
      )
      .get(eventId, workspaceId) as SqlRow | undefined;
    return row ? this.eventFromRow(row) : null;
  }

  private getLatestClosedEvent(
    principal: PurchasePrincipal,
  ): PurchaseEvent | null {
    const row = this.database
      .prepare(
        `
        SELECT * FROM phronesis_purchase_event
        WHERE workspace_id=? AND status='CLOSED'
        ORDER BY closed_at DESC, event_date DESC, created_at DESC LIMIT 1
      `,
      )
      .get(principal.workspaceId) as SqlRow | undefined;
    return row ? this.eventFromRow(row) : null;
  }

  private eventFromRow(row: SqlRow): PurchaseEvent {
    return {
      id: String(row.id),
      name: String(row.name),
      eventDate: String(row.event_date),
      location: row.location ? String(row.location) : null,
      budgetCents: row.budget_cents === null ? null : Number(row.budget_cents),
      currency: row.currency ? (String(row.currency) as EventCurrency) : null,
      openingCashCents:
        row.opening_cash_cents === null ? null : Number(row.opening_cash_cents),
      status: String(row.status) as PurchaseEvent["status"],
      createdAt: String(row.created_at),
      closedAt: row.closed_at ? String(row.closed_at) : null,
      closingCashCents:
        row.closing_cash_cents === null ? null : Number(row.closing_cash_cents),
      closingExpectedCashCents:
        row.closing_expected_cash_cents === null
          ? null
          : Number(row.closing_expected_cash_cents),
      closingVarianceCents:
        row.closing_variance_cents === null
          ? null
          : Number(row.closing_variance_cents),
      closedByUserId: row.closed_by_user_id
        ? String(row.closed_by_user_id)
        : null,
    };
  }

  private findReceiptByKey(
    principal: PurchasePrincipal,
    key: string,
  ): PurchaseReceipt | null {
    const row = this.database
      .prepare(
        `SELECT * FROM phronesis_purchase_receipt
         WHERE workspace_id=? AND operator_user_id=? AND idempotency_key=?`,
      )
      .get(principal.workspaceId, principal.operatorUserId, key) as
      SqlRow | undefined;
    return row ? this.receiptFromRow(row) : null;
  }

  private receiptFromRow(row: SqlRow): PurchaseReceipt {
    const lines = (
      this.database
        .prepare(
          `SELECT payload_json FROM phronesis_purchase_receipt_line
           WHERE receipt_id=? ORDER BY position`,
        )
        .all(String(row.id)) as SqlRow[]
    ).map((line) => parseLine(String(line.payload_json)));
    return {
      id: String(row.id),
      eventId: String(row.event_id),
      operatorUserId: String(row.operator_user_id),
      totalCents: Number(row.total_cents),
      createdAt: String(row.created_at),
      voidedAt: row.voided_at ? String(row.voided_at) : null,
      lines,
    };
  }

  private describePurchase(lines: readonly PurchaseLine[]): string {
    const labels = lines.slice(0, 3).map((line) => {
      if (line.kind === "BULK") return `Bulk: ${line.notes}`;
      return `${line.name} × ${line.quantity}`;
    });
    if (lines.length > 3) labels.push(`+${lines.length - 3} more`);
    return labels.join(" · ").slice(0, 240);
  }

  private assertIdempotencyKey(key: string) {
    if (!/^[A-Za-z0-9:_-]{8,128}$/.test(key)) {
      throw new Error("Idempotency key is invalid.");
    }
  }

  private ensureColumn(table: string, column: string, definition: string) {
    if (!/^[a-z0-9_]+$/i.test(table) || !/^[a-z0-9_]+$/i.test(column)) {
      throw new Error("Unsafe migration identifier.");
    }
    const columns = this.database
      .prepare(`PRAGMA table_info(${table})`)
      .all() as SqlRow[];
    if (columns.some((candidate) => candidate.name === column)) return;
    this.database.exec(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
    );
  }

  private insertAudit(
    principal: PurchasePrincipal,
    action: string,
    receiptId: string | null,
    details: Record<string, unknown>,
  ) {
    this.database
      .prepare(
        `INSERT INTO phronesis_purchase_audit(
          id, workspace_id, actor_user_id, action, receipt_id, details_json, created_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        randomUUID(),
        principal.workspaceId,
        principal.operatorUserId,
        action,
        receiptId,
        JSON.stringify(details),
        new Date().toISOString(),
      );
  }

  private withTransaction<T>(operation: () => T): T {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = operation();
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }
}
