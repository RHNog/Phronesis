import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  normalizeEventStockText,
} from "@/lib/events/eventStock";
import type {
  DisplayCaseItem,
  DisplayCaseSourceSnapshot,
  EventFlipBlockedItem,
  EventFlipCandidate,
  EventFlipSelection,
  EventFlipSnapshot,
} from "@/lib/events/displayCase";
import type {
  EventCurrency,
  EventSaleItemDraft,
  PurchaseEvent,
  PurchaseLine,
  PurchasePrincipal,
} from "@/lib/purchases/domain";

type SqlRow = Record<string, string | number | null>;

export type ResolvedDisplayCaseSaleItem = EventSaleItemDraft & {
  inventoryItemId?: string;
  caseItemId?: string;
  unitListPriceCents?: number;
  color?: string;
  variation?: string;
};

export class DisplayCaseRepository {
  constructor(private readonly database: DatabaseSync) {
    this.migrate();
  }

  migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_event_case_batch (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL,
        request_fingerprint TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(workspace_id, actor_user_id, idempotency_key),
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_case_batch_event
        ON phronesis_event_case_batch(workspace_id, event_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS phronesis_event_case_item (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        inventory_lot_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        set_name TEXT,
        collector_number TEXT,
        variant TEXT,
        language TEXT,
        condition TEXT,
        current_sale_price_cents INTEGER NOT NULL CHECK(current_sale_price_cents > 0),
        normalized_search TEXT NOT NULL,
        created_by_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(workspace_id, event_id, inventory_lot_id),
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id),
        FOREIGN KEY(inventory_lot_id) REFERENCES phronesis_inventory_lot(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_case_item_event
        ON phronesis_event_case_item(workspace_id, event_id, name);
      CREATE INDEX IF NOT EXISTS phronesis_event_case_item_lot
        ON phronesis_event_case_item(inventory_lot_id);
      CREATE TABLE IF NOT EXISTS phronesis_event_case_movement (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        case_item_id TEXT NOT NULL,
        inventory_lot_id TEXT NOT NULL,
        batch_id TEXT,
        batch_position INTEGER,
        ledger_entry_id TEXT,
        sale_item_position INTEGER,
        movement_type TEXT NOT NULL CHECK(movement_type IN ('ADD','REMOVE','SALE','REVERSAL')),
        quantity_delta INTEGER NOT NULL CHECK(quantity_delta <> 0),
        inventory_count_revision INTEGER,
        unit_list_price_cents INTEGER,
        reason TEXT,
        idempotency_key TEXT,
        actor_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        CHECK(
          (movement_type IN ('ADD','REVERSAL') AND quantity_delta > 0)
          OR (movement_type IN ('REMOVE','SALE') AND quantity_delta < 0)
        ),
        UNIQUE(batch_id, case_item_id, batch_position),
        UNIQUE(ledger_entry_id, case_item_id, sale_item_position),
        FOREIGN KEY(case_item_id) REFERENCES phronesis_event_case_item(id),
        FOREIGN KEY(inventory_lot_id) REFERENCES phronesis_inventory_lot(id),
        FOREIGN KEY(batch_id) REFERENCES phronesis_event_case_batch(id),
        FOREIGN KEY(ledger_entry_id) REFERENCES phronesis_event_ledger_entry(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_case_movement_item
        ON phronesis_event_case_movement(workspace_id, event_id, case_item_id, created_at);
      CREATE INDEX IF NOT EXISTS phronesis_event_case_movement_lot
        ON phronesis_event_case_movement(inventory_lot_id);
      CREATE TABLE IF NOT EXISTS phronesis_event_case_price (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        case_item_id TEXT NOT NULL,
        sale_price_cents INTEGER NOT NULL CHECK(sale_price_cents > 0),
        source TEXT NOT NULL,
        reason TEXT,
        actor_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(case_item_id) REFERENCES phronesis_event_case_item(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_case_price_item
        ON phronesis_event_case_price(case_item_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS phronesis_event_case_count (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        case_item_id TEXT NOT NULL,
        counted_quantity INTEGER NOT NULL CHECK(counted_quantity >= 0),
        reason TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(case_item_id) REFERENCES phronesis_event_case_item(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_case_count_item
        ON phronesis_event_case_count(workspace_id, event_id, case_item_id, created_at DESC);
    `);
    this.ensureColumn("phronesis_event_sale_item", "event_case_item_id", "TEXT");
    this.ensureColumn(
      "phronesis_event_case_movement",
      "idempotency_key",
      "TEXT",
    );
    this.database.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_event_case_movement_operation
        ON phronesis_event_case_movement(workspace_id, actor_user_id, idempotency_key)
        WHERE idempotency_key IS NOT NULL;
    `);
  }

  getEventFlipSnapshot(
    principal: PurchasePrincipal,
    requestedEventId?: string,
  ): EventFlipSnapshot {
    const event = this.resolveEvent(principal.workspaceId, requestedEventId);
    if (!event) return this.emptyFlipSnapshot();
    const rows = this.database
      .prepare(
        `SELECT lot.*, receipt_line.payload_json
         FROM phronesis_inventory_lot AS lot
         JOIN phronesis_purchase_receipt AS receipt
           ON receipt.id=lot.source_receipt_id
         LEFT JOIN phronesis_purchase_receipt_line AS receipt_line
           ON receipt_line.receipt_id=lot.source_receipt_id
          AND receipt_line.position=lot.source_line_position
         WHERE lot.workspace_id=? AND lot.source_event_id=?
           AND lot.voided_at IS NULL AND receipt.voided_at IS NULL
         ORDER BY lot.acquired_at DESC, lot.source_receipt_id, lot.source_line_position`,
      )
      .all(principal.workspaceId, event.id) as SqlRow[];
    const candidates: EventFlipCandidate[] = [];
    const blocked: EventFlipBlockedItem[] = [];
    for (const row of rows) {
      const productType = String(row.product_type);
      if (String(row.kind) === "EXACT" && productType === "SINGLE") {
        const onHandQuantity = this.onHandQuantity(row);
        if (onHandQuantity === null) continue;
        const displayCaseQuantity = this.caseQuantityForLot(String(row.id));
        let suggestedSalePriceCents: number | null = null;
        if (row.payload_json) {
          const line = JSON.parse(String(row.payload_json)) as PurchaseLine;
          if (line.kind === "EXACT") {
            suggestedSalePriceCents = line.marketReferenceCents;
          }
        }
        candidates.push({
          id: String(row.id),
          inventoryLotId: String(row.id),
          receiptId: String(row.source_receipt_id),
          name: String(row.name),
          setName: row.set_name ? String(row.set_name) : null,
          collectorNumber: row.collector_number
            ? String(row.collector_number)
            : null,
          variant: row.variant ? String(row.variant) : null,
          language: row.language ? String(row.language) : null,
          condition: row.condition ? String(row.condition) : null,
          categoryId: String(row.category_id),
          sku: String(row.sku),
          acquiredQuantity: Number(row.quantity),
          onHandQuantity,
          displayCaseQuantity,
          availableToFlipQuantity: Math.max(
            0,
            onHandQuantity - displayCaseQuantity,
          ),
          unitCostCents: Number(row.unit_cost_cents),
          suggestedSalePriceCents,
          acquiredAt: String(row.acquired_at),
        });
        continue;
      }
      const bulk = String(row.kind) === "BULK";
      blocked.push({
        id: String(row.id),
        source: bulk ? "BULK" : "SEALED",
        description: bulk
          ? String(row.notes ?? "Bulk purchase")
          : String(row.name),
        quantity: bulk
          ? row.approximate_quantity === null
            ? null
            : Number(row.approximate_quantity)
          : Number(row.quantity),
        reason: bulk
          ? "Bulk remains in General Inventory until exact cards are itemized."
          : "Sealed product remains in General Inventory and is not a specific Case card.",
        createdAt: String(row.acquired_at),
      });
    }
    const manualRows = this.database
      .prepare(
        `SELECT entry.id, entry.description, entry.created_at
         FROM phronesis_event_ledger_entry AS entry
         LEFT JOIN phronesis_event_ledger_entry AS reversal
           ON reversal.reversal_of_entry_id=entry.id
         WHERE entry.workspace_id=? AND entry.event_id=?
           AND entry.entry_type='PURCHASE' AND entry.linked_receipt_id IS NULL
           AND reversal.id IS NULL
         ORDER BY entry.created_at DESC`,
      )
      .all(principal.workspaceId, event.id) as SqlRow[];
    blocked.push(
      ...manualRows.map((row) => ({
        id: String(row.id),
        source: "MANUAL_PURCHASE" as const,
        description: String(row.description ?? "Manual Purchase"),
        quantity: null,
        reason:
          "This Purchase records cash truth only. Itemize exact cards before adding them to the Case.",
        createdAt: String(row.created_at),
      })),
    );
    return {
      event,
      summary: {
        exactCardOptions: candidates.length,
        readyToFlipUnits: candidates.reduce(
          (sum, item) => sum + item.availableToFlipQuantity,
          0,
        ),
        alreadyInCaseUnits: candidates.reduce(
          (sum, item) => sum + item.displayCaseQuantity,
          0,
        ),
        blockedOutcomes: blocked.length,
      },
      candidates,
      blocked,
    };
  }

  addToCase(
    principal: PurchasePrincipal,
    eventId: string,
    rawSelections: readonly EventFlipSelection[],
    idempotencyKey: string,
    source: "EVENT_FLIP" | "VENDOR_CHECKOUT" = "EVENT_FLIP",
  ): EventFlipSnapshot {
    this.assertIdempotencyKey(idempotencyKey);
    if (rawSelections.length < 1 || rawSelections.length > 50) {
      throw new Error("Select between one and 50 exact-card lots.");
    }
    const selections = rawSelections.map((selection) => ({
      inventoryLotId: this.requiredId(
        selection.inventoryLotId,
        "Inventory lot is required.",
      ),
      quantity: this.positiveQuantity(selection.quantity, "Case quantity"),
      salePriceCents: this.positiveCents(
        selection.salePriceCents,
        "Case Sale price",
      ),
    }));
    if (
      new Set(selections.map((selection) => selection.inventoryLotId)).size !==
      selections.length
    ) {
      throw new Error("Add each inventory lot only once per Case batch.");
    }
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(selections))
      .digest("hex");
    const existing = this.database
      .prepare(
        `SELECT event_id, request_fingerprint FROM phronesis_event_case_batch
         WHERE workspace_id=? AND actor_user_id=? AND idempotency_key=?`,
      )
      .get(
        principal.workspaceId,
        principal.operatorUserId,
        idempotencyKey,
      ) as SqlRow | undefined;
    if (existing) {
      if (
        String(existing.event_id) !== eventId ||
        String(existing.request_fingerprint) !== fingerprint
      ) {
        throw new Error("Case operation key was already used for another batch.");
      }
      return this.getEventFlipSnapshot(principal, eventId);
    }
    this.assertEvent(principal.workspaceId, eventId, true);
    const batchId = randomUUID();
    const now = new Date().toISOString();
    this.withTransaction(() => {
      this.database
        .prepare(
          `INSERT INTO phronesis_event_case_batch(
            id, workspace_id, event_id, actor_user_id, idempotency_key,
            request_fingerprint, created_at
          ) VALUES(?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          batchId,
          principal.workspaceId,
          eventId,
          principal.operatorUserId,
          idempotencyKey,
          fingerprint,
          now,
        );
      selections.forEach((selection, position) => {
        const lot = this.activeSingleLot(
          principal.workspaceId,
          eventId,
          selection.inventoryLotId,
        );
        if (!lot) {
          throw new Error("An eligible exact-card purchase lot was not found.");
        }
        const onHandQuantity = this.onHandQuantity(lot);
        if (onHandQuantity === null) {
          throw new Error(`${String(lot.name)} has no known on-hand quantity.`);
        }
        const alreadyInCase = this.caseQuantityForLot(
          selection.inventoryLotId,
        );
        const available = onHandQuantity - alreadyInCase;
        if (selection.quantity > available) {
          throw new Error(
            `${String(lot.name)} has only ${Math.max(0, available)} units available outside the Case.`,
          );
        }
        const existingItem = this.caseItemForLot(
          principal.workspaceId,
          eventId,
          selection.inventoryLotId,
        );
        const caseItemId = existingItem ? String(existingItem.id) : randomUUID();
        const normalizedSearch = normalizeEventStockText(
          [
            lot.name,
            lot.set_name,
            lot.collector_number,
            lot.variant,
            lot.language,
            lot.condition,
            lot.sku,
          ]
            .filter(Boolean)
            .join(" "),
        );
        if (existingItem) {
          this.database
            .prepare(
              `UPDATE phronesis_event_case_item
               SET current_sale_price_cents=?, updated_at=?
               WHERE id=? AND workspace_id=? AND event_id=?`,
            )
            .run(
              selection.salePriceCents,
              now,
              caseItemId,
              principal.workspaceId,
              eventId,
            );
        } else {
          this.database
            .prepare(
              `INSERT INTO phronesis_event_case_item(
                id, workspace_id, event_id, inventory_lot_id, category_id, sku,
                name, set_name, collector_number, variant, language, condition,
                current_sale_price_cents, normalized_search, created_by_user_id,
                created_at, updated_at
              ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(
              caseItemId,
              principal.workspaceId,
              eventId,
              selection.inventoryLotId,
              String(lot.category_id),
              String(lot.sku),
              String(lot.name),
              lot.set_name,
              lot.collector_number,
              lot.variant,
              lot.language,
              lot.condition,
              selection.salePriceCents,
              normalizedSearch,
              principal.operatorUserId,
              now,
              now,
            );
        }
        this.insertPrice(
          principal,
          eventId,
          caseItemId,
          selection.salePriceCents,
          source,
          existingItem
            ? source === "VENDOR_CHECKOUT"
              ? "Price confirmed during direct Vendor purchase placement"
              : "Price confirmed during additional Case placement"
            : null,
          now,
        );
        this.database
          .prepare(
            `INSERT INTO phronesis_event_case_movement(
              id, workspace_id, event_id, case_item_id, inventory_lot_id,
              batch_id, batch_position, movement_type, quantity_delta,
              unit_list_price_cents, actor_user_id, created_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?, 'ADD', ?, ?, ?, ?)`,
          )
          .run(
            randomUUID(),
            principal.workspaceId,
            eventId,
            caseItemId,
            selection.inventoryLotId,
            batchId,
            position,
            selection.quantity,
            selection.salePriceCents,
            principal.operatorUserId,
            now,
          );
      });
      this.insertAudit(principal, "EVENT_CASE_BATCH_ADDED", {
        eventId,
        batchId,
        source,
        selectionCount: selections.length,
        quantity: selections.reduce((sum, item) => sum + item.quantity, 0),
      });
    });
    return this.getEventFlipSnapshot(principal, eventId);
  }

  getSourceSnapshot(
    principal: PurchasePrincipal,
    eventId: string,
    query = "",
    maximumResults = 40,
  ): DisplayCaseSourceSnapshot {
    this.assertEvent(principal.workspaceId, eventId, false);
    const rows = this.database
      .prepare(
        `SELECT case_item.*, lot.source_receipt_id, lot.unit_cost_cents
         FROM phronesis_event_case_item AS case_item
         JOIN phronesis_inventory_lot AS lot
           ON lot.id=case_item.inventory_lot_id
         WHERE case_item.workspace_id=? AND case_item.event_id=?
         ORDER BY case_item.name, case_item.variant, case_item.condition, case_item.id`,
      )
      .all(principal.workspaceId, eventId) as SqlRow[];
    const movementRows = this.database
      .prepare(
        `SELECT case_item_id,
           COALESCE(SUM(CASE WHEN movement_type='ADD' THEN quantity_delta ELSE 0 END), 0) AS added,
           COALESCE(-SUM(CASE WHEN movement_type='REMOVE' THEN quantity_delta ELSE 0 END), 0) AS returned,
           COALESCE(-SUM(CASE WHEN movement_type IN ('SALE','REVERSAL') THEN quantity_delta ELSE 0 END), 0) AS sold,
           COALESCE(SUM(quantity_delta), 0) AS expected
         FROM phronesis_event_case_movement
         WHERE workspace_id=? AND event_id=? GROUP BY case_item_id`,
      )
      .all(principal.workspaceId, eventId) as SqlRow[];
    const movementByItem = new Map(
      movementRows.map((row) => [String(row.case_item_id), row]),
    );
    const countRows = this.database
      .prepare(
        `SELECT case_item_id, counted_quantity, created_at FROM (
           SELECT case_item_id, counted_quantity, created_at, id,
             ROW_NUMBER() OVER (
               PARTITION BY case_item_id ORDER BY created_at DESC, id DESC
             ) AS row_number
           FROM phronesis_event_case_count
           WHERE workspace_id=? AND event_id=?
         ) WHERE row_number=1`,
      )
      .all(principal.workspaceId, eventId) as SqlRow[];
    const countByItem = new Map(
      countRows.map((row) => [String(row.case_item_id), row]),
    );
    const allItems = rows.map((row) => {
      const id = String(row.id);
      const movement = movementByItem.get(id);
      const count = countByItem.get(id);
      const expectedQuantity = Number(movement?.expected ?? 0);
      const countedQuantity = count ? Number(count.counted_quantity) : null;
      return {
        id,
        eventId,
        inventoryLotId: String(row.inventory_lot_id),
        receiptId: String(row.source_receipt_id),
        name: String(row.name),
        setName: row.set_name ? String(row.set_name) : null,
        collectorNumber: row.collector_number
          ? String(row.collector_number)
          : null,
        variant: row.variant ? String(row.variant) : null,
        language: row.language ? String(row.language) : null,
        condition: row.condition ? String(row.condition) : null,
        categoryId: String(row.category_id),
        sku: String(row.sku),
        currentSalePriceCents: Number(row.current_sale_price_cents),
        unitCostCents: Number(row.unit_cost_cents),
        totalAddedQuantity: Number(movement?.added ?? 0),
        returnedQuantity: Number(movement?.returned ?? 0),
        soldQuantity: Number(movement?.sold ?? 0),
        expectedQuantity,
        countedQuantity,
        countVariance:
          countedQuantity === null ? null : countedQuantity - expectedQuantity,
        lastCountedAt: count ? String(count.created_at) : null,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      } satisfies DisplayCaseItem;
    });
    const normalizedQuery = normalizeEventStockText(query);
    const tokens = normalizedQuery.split(" ").filter(Boolean);
    const scored = allItems
      .map((item) => ({
        item,
        score: this.searchScore(item, tokens, normalizedQuery),
      }))
      .filter((candidate) => candidate.score > 0)
      .sort(
        (first, second) =>
          second.score - first.score ||
          first.item.name.localeCompare(second.item.name) ||
          first.item.id.localeCompare(second.item.id),
      );
    return {
      eventId,
      items: scored.slice(0, maximumResults).map(({ item }) => item),
      query,
      resultCount: scored.length,
      truncated: scored.length > maximumResults,
      summary: {
        optionCount: allItems.length,
        totalAddedQuantity: allItems.reduce(
          (sum, item) => sum + item.totalAddedQuantity,
          0,
        ),
        returnedQuantity: allItems.reduce(
          (sum, item) => sum + item.returnedQuantity,
          0,
        ),
        soldQuantity: allItems.reduce(
          (sum, item) => sum + item.soldQuantity,
          0,
        ),
        expectedQuantity: allItems.reduce(
          (sum, item) => sum + item.expectedQuantity,
          0,
        ),
        countedOptionCount: allItems.filter(
          (item) => item.countedQuantity !== null,
        ).length,
        countedQuantity: allItems.reduce(
          (sum, item) => sum + (item.countedQuantity ?? 0),
          0,
        ),
        varianceQuantity: allItems.reduce(
          (sum, item) => sum + (item.countVariance ?? 0),
          0,
        ),
      },
    };
  }

  updatePrice(
    principal: PurchasePrincipal,
    eventId: string,
    caseItemId: string,
    salePriceCents: number,
    rawReason: string,
  ): DisplayCaseSourceSnapshot {
    this.assertEvent(principal.workspaceId, eventId, true);
    const price = this.positiveCents(salePriceCents, "Case Sale price");
    const reason = this.requiredText(rawReason, "Price reason", 240);
    const item = this.activeCaseItem(principal.workspaceId, eventId, caseItemId);
    if (!item) throw new Error("Display Case item was not found.");
    const now = new Date().toISOString();
    this.withTransaction(() => {
      this.database
        .prepare(
          `UPDATE phronesis_event_case_item
           SET current_sale_price_cents=?, updated_at=?
           WHERE id=? AND workspace_id=? AND event_id=?`,
        )
        .run(price, now, caseItemId, principal.workspaceId, eventId);
      this.insertPrice(
        principal,
        eventId,
        caseItemId,
        price,
        "MANUAL",
        reason,
        now,
      );
      this.insertAudit(principal, "EVENT_CASE_PRICE_UPDATED", {
        eventId,
        caseItemId,
        salePriceCents: price,
        reason,
      });
    });
    return this.getSourceSnapshot(principal, eventId);
  }

  returnToGeneral(
    principal: PurchasePrincipal,
    eventId: string,
    caseItemId: string,
    quantity: number,
    rawReason: string,
    idempotencyKey: string,
  ): DisplayCaseSourceSnapshot {
    const returnQuantity = this.positiveQuantity(quantity, "Return quantity");
    const reason = this.requiredText(rawReason, "Return reason", 240);
    this.assertIdempotencyKey(idempotencyKey);
    const existing = this.database
      .prepare(
        `SELECT event_id, case_item_id, quantity_delta, reason
         FROM phronesis_event_case_movement
         WHERE workspace_id=? AND actor_user_id=? AND idempotency_key=?`,
      )
      .get(
        principal.workspaceId,
        principal.operatorUserId,
        idempotencyKey,
      ) as SqlRow | undefined;
    if (existing) {
      if (
        String(existing.event_id) !== eventId ||
        String(existing.case_item_id) !== caseItemId ||
        Number(existing.quantity_delta) !== -returnQuantity ||
        String(existing.reason) !== reason
      ) {
        throw new Error(
          "Case operation key was already used for another return.",
        );
      }
      return this.getSourceSnapshot(principal, eventId);
    }
    this.assertEvent(principal.workspaceId, eventId, true);
    const item = this.activeCaseItem(principal.workspaceId, eventId, caseItemId);
    if (!item) throw new Error("Display Case item was not found.");
    const expected = this.expectedCaseQuantity(caseItemId);
    if (returnQuantity > expected) {
      throw new Error(
        `${String(item.name)} has only ${expected} expected units in the Case.`,
      );
    }
    const now = new Date().toISOString();
    this.withTransaction(() => {
      this.database
        .prepare(
          `INSERT INTO phronesis_event_case_movement(
            id, workspace_id, event_id, case_item_id, inventory_lot_id,
            movement_type, quantity_delta, unit_list_price_cents, reason,
            idempotency_key, actor_user_id, created_at
          ) VALUES(?, ?, ?, ?, ?, 'REMOVE', ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          randomUUID(),
          principal.workspaceId,
          eventId,
          caseItemId,
          String(item.inventory_lot_id),
          -returnQuantity,
          Number(item.current_sale_price_cents),
          reason,
          idempotencyKey,
          principal.operatorUserId,
          now,
        );
      this.insertAudit(principal, "EVENT_CASE_RETURNED", {
        eventId,
        caseItemId,
        quantity: returnQuantity,
        reason,
      });
    });
    return this.getSourceSnapshot(principal, eventId);
  }

  countItem(
    principal: PurchasePrincipal,
    eventId: string,
    caseItemId: string,
    countedQuantity: number,
    rawReason: string,
  ): DisplayCaseSourceSnapshot {
    this.assertEvent(principal.workspaceId, eventId, false);
    if (!Number.isInteger(countedQuantity) || countedQuantity < 0) {
      throw new Error("Physical count must be a non-negative whole number.");
    }
    const reason = this.requiredText(rawReason, "Count reason", 240);
    if (!this.activeCaseItem(principal.workspaceId, eventId, caseItemId, false)) {
      throw new Error("Display Case item was not found.");
    }
    const now = new Date().toISOString();
    this.withTransaction(() => {
      this.database
        .prepare(
          `INSERT INTO phronesis_event_case_count(
            id, workspace_id, event_id, case_item_id, counted_quantity,
            reason, actor_user_id, created_at
          ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          randomUUID(),
          principal.workspaceId,
          eventId,
          caseItemId,
          countedQuantity,
          reason,
          principal.operatorUserId,
          now,
        );
      this.insertAudit(principal, "EVENT_CASE_COUNTED", {
        eventId,
        caseItemId,
        countedQuantity,
        reason,
      });
    });
    return this.getSourceSnapshot(principal, eventId);
  }

  resolveSaleItems(
    principal: PurchasePrincipal,
    eventId: string,
    items: ResolvedDisplayCaseSaleItem[],
  ): ResolvedDisplayCaseSaleItem[] {
    const linkedIds = items
      .map((item) => item.caseItemId)
      .filter((itemId): itemId is string => Boolean(itemId));
    if (new Set(linkedIds).size !== linkedIds.length) {
      throw new Error("Add each Display Case option only once per Sale.");
    }
    return items.map((item) => {
      if (item.inventoryItemId && item.caseItemId) {
        throw new Error("A Sale item cannot link to two inventory sources.");
      }
      if (!item.caseItemId) return item;
      const caseItem = this.activeCaseItem(
        principal.workspaceId,
        eventId,
        item.caseItemId,
      );
      if (!caseItem) throw new Error("Selected Display Case item was not found.");
      const expected = this.expectedCaseQuantity(item.caseItemId);
      if (item.quantity > expected) {
        throw new Error(
          `${String(caseItem.name)} has only ${expected} expected in the Case.`,
        );
      }
      const variation = [
        caseItem.set_name,
        caseItem.collector_number
          ? `#${String(caseItem.collector_number)}`
          : null,
        caseItem.variant,
        caseItem.language,
      ]
        .filter(Boolean)
        .join(" · ");
      const color = caseItem.condition ? String(caseItem.condition) : undefined;
      return {
        description: [String(caseItem.name), variation, color]
          .filter(Boolean)
          .join(" · "),
        quantity: item.quantity,
        caseItemId: item.caseItemId,
        productOwnerId: item.productOwnerId,
        unitListPriceCents: Number(caseItem.current_sale_price_cents),
        color,
        variation: variation || undefined,
      };
    });
  }

  recordSaleMovements(
    principal: PurchasePrincipal,
    eventId: string,
    ledgerEntryId: string,
    items: ResolvedDisplayCaseSaleItem[],
    createdAt: string,
  ): void {
    const insert = this.database.prepare(
      `INSERT INTO phronesis_event_case_movement(
        id, workspace_id, event_id, case_item_id, inventory_lot_id,
        ledger_entry_id, sale_item_position, movement_type, quantity_delta,
        inventory_count_revision, unit_list_price_cents, actor_user_id, created_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, 'SALE', ?, ?, ?, ?, ?)`,
    );
    items.forEach((item, position) => {
      if (!item.caseItemId) return;
      const row = this.database
        .prepare(
          `SELECT case_item.inventory_lot_id, case_item.current_sale_price_cents,
             lot.name, lot.current_quantity, lot.reconciled_quantity, lot.quantity,
             lot.approximate_quantity, lot.count_revision, lot.voided_at
           FROM phronesis_event_case_item AS case_item
           JOIN phronesis_inventory_lot AS lot ON lot.id=case_item.inventory_lot_id
           WHERE case_item.id=? AND case_item.workspace_id=? AND case_item.event_id=?
             AND lot.workspace_id=?`,
        )
        .get(
          item.caseItemId,
          principal.workspaceId,
          eventId,
          principal.workspaceId,
        ) as SqlRow | undefined;
      if (!row || row.voided_at) {
        throw new Error("Active Display Case inventory was not found.");
      }
      const expected = this.expectedCaseQuantity(item.caseItemId);
      const onHand = this.onHandQuantity(row);
      if (item.quantity > expected || onHand === null || item.quantity > onHand) {
        throw new Error(
          `${String(row.name)} no longer has enough Case-backed inventory.`,
        );
      }
      insert.run(
        randomUUID(),
        principal.workspaceId,
        eventId,
        item.caseItemId,
        String(row.inventory_lot_id),
        ledgerEntryId,
        position,
        -item.quantity,
        Number(row.count_revision),
        Number(row.current_sale_price_cents),
        principal.operatorUserId,
        createdAt,
      );
      this.database
        .prepare(
          `UPDATE phronesis_inventory_lot SET current_quantity=?
           WHERE id=? AND workspace_id=? AND voided_at IS NULL`,
        )
        .run(
          onHand - item.quantity,
          String(row.inventory_lot_id),
          principal.workspaceId,
        );
    });
  }

  reverseSaleMovements(
    principal: PurchasePrincipal,
    eventId: string,
    originalEntryId: string,
    reversalEntryId: string,
    createdAt: string,
  ): void {
    const rows = this.database
      .prepare(
        `SELECT sale_item.event_case_item_id, sale_item.position,
           sale_item.quantity, sale_item.unit_list_price_cents,
           case_item.inventory_lot_id, lot.name, lot.current_quantity,
           lot.reconciled_quantity, lot.quantity AS lot_quantity,
           lot.approximate_quantity, lot.count_revision,
           lot.voided_at, movement.inventory_count_revision
         FROM phronesis_event_sale_item AS sale_item
         JOIN phronesis_event_case_item AS case_item
           ON case_item.id=sale_item.event_case_item_id
         JOIN phronesis_inventory_lot AS lot
           ON lot.id=case_item.inventory_lot_id
         JOIN phronesis_event_case_movement AS movement
           ON movement.ledger_entry_id=sale_item.entry_id
          AND movement.case_item_id=sale_item.event_case_item_id
          AND movement.sale_item_position=sale_item.position
          AND movement.movement_type='SALE'
         WHERE sale_item.entry_id=? AND sale_item.event_case_item_id IS NOT NULL
           AND case_item.workspace_id=? AND case_item.event_id=?`,
      )
      .all(originalEntryId, principal.workspaceId, eventId) as SqlRow[];
    const insert = this.database.prepare(
      `INSERT INTO phronesis_event_case_movement(
        id, workspace_id, event_id, case_item_id, inventory_lot_id,
        ledger_entry_id, sale_item_position, movement_type, quantity_delta,
        inventory_count_revision, unit_list_price_cents, actor_user_id, created_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, 'REVERSAL', ?, ?, ?, ?, ?)`,
    );
    for (const row of rows) {
      if (row.voided_at) {
        throw new Error("A voided inventory lot cannot be restored automatically.");
      }
      if (Number(row.inventory_count_revision) !== Number(row.count_revision)) {
        throw new Error(
          "This Case Sale cannot be reversed after a later General Inventory count. Reconcile both inventories instead.",
        );
      }
      const onHand = this.onHandQuantity({
        ...row,
        quantity: row.lot_quantity,
      });
      if (onHand === null) throw new Error("Current inventory quantity is unknown.");
      insert.run(
        randomUUID(),
        principal.workspaceId,
        eventId,
        String(row.event_case_item_id),
        String(row.inventory_lot_id),
        reversalEntryId,
        Number(row.position),
        Number(row.quantity),
        Number(row.count_revision),
        row.unit_list_price_cents,
        principal.operatorUserId,
        createdAt,
      );
      this.database
        .prepare(
          `UPDATE phronesis_inventory_lot SET current_quantity=?
           WHERE id=? AND workspace_id=? AND voided_at IS NULL`,
        )
        .run(
          onHand + Number(row.quantity),
          String(row.inventory_lot_id),
          principal.workspaceId,
        );
    }
  }

  assertReceiptCanVoid(workspaceId: string, receiptId: string): void {
    const lotRows = this.database
      .prepare(
        `SELECT id FROM phronesis_inventory_lot
         WHERE workspace_id=? AND source_receipt_id=?`,
      )
      .all(workspaceId, receiptId) as SqlRow[];
    for (const lot of lotRows) {
      const lotId = String(lot.id);
      const expected = this.caseQuantityForLot(lotId);
      const saleRow = this.database
        .prepare(
          `SELECT COALESCE(-SUM(CASE
             WHEN movement_type IN ('SALE','REVERSAL') THEN quantity_delta
             ELSE 0 END), 0) AS net_sold
           FROM phronesis_event_case_movement
           WHERE workspace_id=? AND inventory_lot_id=?`,
        )
        .get(workspaceId, lotId) as SqlRow;
      if (expected > 0 || Number(saleRow.net_sold) > 0) {
        throw new Error(
          "Return or reconcile every Display Case unit before voiding this receipt.",
        );
      }
    }
  }

  private activeSingleLot(
    workspaceId: string,
    eventId: string,
    lotId: string,
  ): SqlRow | undefined {
    return this.database
      .prepare(
        `SELECT lot.* FROM phronesis_inventory_lot AS lot
         JOIN phronesis_purchase_receipt AS receipt
           ON receipt.id=lot.source_receipt_id
         WHERE lot.id=? AND lot.workspace_id=? AND lot.source_event_id=?
           AND lot.kind='EXACT' AND lot.product_type='SINGLE'
           AND lot.voided_at IS NULL AND receipt.voided_at IS NULL`,
      )
      .get(lotId, workspaceId, eventId) as SqlRow | undefined;
  }

  private activeCaseItem(
    workspaceId: string,
    eventId: string,
    caseItemId: string,
    requireActiveEvent = true,
  ): SqlRow | undefined {
    return this.database
      .prepare(
        `SELECT case_item.* FROM phronesis_event_case_item AS case_item
         JOIN phronesis_inventory_lot AS lot
           ON lot.id=case_item.inventory_lot_id
         JOIN phronesis_purchase_event AS event ON event.id=case_item.event_id
         WHERE case_item.id=? AND case_item.workspace_id=? AND case_item.event_id=?
           AND lot.workspace_id=? AND lot.voided_at IS NULL
           ${requireActiveEvent ? "AND event.status='ACTIVE'" : ""}`,
      )
      .get(caseItemId, workspaceId, eventId, workspaceId) as SqlRow | undefined;
  }

  private caseItemForLot(
    workspaceId: string,
    eventId: string,
    inventoryLotId: string,
  ): SqlRow | undefined {
    return this.database
      .prepare(
        `SELECT * FROM phronesis_event_case_item
         WHERE workspace_id=? AND event_id=? AND inventory_lot_id=?`,
      )
      .get(workspaceId, eventId, inventoryLotId) as SqlRow | undefined;
  }

  private caseQuantityForLot(inventoryLotId: string): number {
    const row = this.database
      .prepare(
        `SELECT COALESCE(SUM(quantity_delta), 0) AS quantity
         FROM phronesis_event_case_movement WHERE inventory_lot_id=?`,
      )
      .get(inventoryLotId) as SqlRow;
    return Number(row.quantity);
  }

  private expectedCaseQuantity(caseItemId: string): number {
    const row = this.database
      .prepare(
        `SELECT COALESCE(SUM(quantity_delta), 0) AS quantity
         FROM phronesis_event_case_movement WHERE case_item_id=?`,
      )
      .get(caseItemId) as SqlRow;
    return Number(row.quantity);
  }

  private searchScore(
    item: DisplayCaseItem,
    tokens: string[],
    normalizedQuery: string,
  ): number {
    if (!tokens.length) return 1;
    const name = normalizeEventStockText(item.name);
    const searchable = normalizeEventStockText(
      [
        item.name,
        item.setName,
        item.collectorNumber,
        item.variant,
        item.language,
        item.condition,
        item.sku,
        (item.currentSalePriceCents / 100).toFixed(2),
      ]
        .filter(Boolean)
        .join(" "),
    );
    if (!tokens.every((token) => searchable.includes(token))) return 0;
    let score = tokens.length * 10;
    if (name === normalizedQuery) score += 100;
    else if (name.startsWith(normalizedQuery)) score += 70;
    else if (name.includes(normalizedQuery)) score += 50;
    if (item.expectedQuantity > 0) score += 5;
    return score;
  }

  private resolveEvent(
    workspaceId: string,
    requestedEventId?: string,
  ): PurchaseEvent | null {
    const row = requestedEventId
      ? (this.database
          .prepare(
            `SELECT * FROM phronesis_purchase_event
             WHERE id=? AND workspace_id=?`,
          )
          .get(requestedEventId, workspaceId) as SqlRow | undefined)
      : (this.database
          .prepare(
            `SELECT * FROM phronesis_purchase_event
             WHERE workspace_id=?
             ORDER BY CASE status WHEN 'ACTIVE' THEN 0 ELSE 1 END,
               closed_at DESC, event_date DESC, created_at DESC LIMIT 1`,
          )
          .get(workspaceId) as SqlRow | undefined);
    return row ? this.eventFromRow(row) : null;
  }

  private assertEvent(
    workspaceId: string,
    eventId: string,
    requireActive: boolean,
  ): void {
    const row = this.database
      .prepare(
        `SELECT status FROM phronesis_purchase_event WHERE id=? AND workspace_id=?`,
      )
      .get(eventId, workspaceId) as SqlRow | undefined;
    if (!row || (requireActive && row.status !== "ACTIVE")) {
      throw new Error(
        requireActive ? "Active event was not found." : "Event was not found.",
      );
    }
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

  private emptyFlipSnapshot(): EventFlipSnapshot {
    return {
      event: null,
      summary: {
        exactCardOptions: 0,
        readyToFlipUnits: 0,
        alreadyInCaseUnits: 0,
        blockedOutcomes: 0,
      },
      candidates: [],
      blocked: [],
    };
  }

  private insertPrice(
    principal: PurchasePrincipal,
    eventId: string,
    caseItemId: string,
    salePriceCents: number,
    source: string,
    reason: string | null,
    createdAt: string,
  ): void {
    this.database
      .prepare(
        `INSERT INTO phronesis_event_case_price(
          id, workspace_id, event_id, case_item_id, sale_price_cents,
          source, reason, actor_user_id, created_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        randomUUID(),
        principal.workspaceId,
        eventId,
        caseItemId,
        salePriceCents,
        source,
        reason,
        principal.operatorUserId,
        createdAt,
      );
  }

  private insertAudit(
    principal: PurchasePrincipal,
    action: string,
    details: Record<string, unknown>,
  ): void {
    this.database
      .prepare(
        `INSERT INTO phronesis_purchase_audit(
          id, workspace_id, actor_user_id, action, receipt_id, details_json, created_at
        ) VALUES(?, ?, ?, ?, NULL, ?, ?)`,
      )
      .run(
        randomUUID(),
        principal.workspaceId,
        principal.operatorUserId,
        action,
        JSON.stringify(details),
        new Date().toISOString(),
      );
  }

  private onHandQuantity(row: SqlRow): number | null {
    if (row.current_quantity !== null) return Number(row.current_quantity);
    if (row.reconciled_quantity !== null) return Number(row.reconciled_quantity);
    if (row.quantity !== null) return Number(row.quantity);
    if (row.approximate_quantity !== null) return Number(row.approximate_quantity);
    return null;
  }

  private positiveQuantity(value: unknown, label: string): number {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000) {
      throw new Error(`${label} must be between 1 and 1,000.`);
    }
    return quantity;
  }

  private positiveCents(value: unknown, label: string): number {
    const cents = Number(value);
    if (!Number.isSafeInteger(cents) || cents <= 0) {
      throw new Error(`${label} must be a positive cent value.`);
    }
    return cents;
  }

  private requiredText(
    value: unknown,
    label: string,
    maximumLength: number,
  ): string {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text || text.length > maximumLength) {
      throw new Error(
        `${label} must be between 1 and ${maximumLength} characters.`,
      );
    }
    return text;
  }

  private requiredId(value: unknown, message: string): string {
    if (typeof value !== "string" || !/^[A-Za-z0-9:_-]{8,128}$/.test(value)) {
      throw new Error(message);
    }
    return value;
  }

  private assertIdempotencyKey(key: string): void {
    if (!/^[A-Za-z0-9:_-]{8,128}$/.test(key)) {
      throw new Error("Case operation key is invalid.");
    }
  }

  private ensureColumn(table: string, column: string, definition: string): void {
    const columns = this.database
      .prepare(`PRAGMA table_info(${table})`)
      .all() as SqlRow[];
    if (!columns.some((candidate) => candidate.name === column)) {
      this.database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  private withTransaction<T>(operation: () => T): T {
    this.database.exec("SAVEPOINT phronesis_display_case_operation");
    try {
      const result = operation();
      this.database.exec("RELEASE phronesis_display_case_operation");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK TO phronesis_display_case_operation");
      this.database.exec("RELEASE phronesis_display_case_operation");
      throw error;
    }
  }
}
