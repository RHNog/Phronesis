import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  EVENT_STOCK_CONTRACT_VERSION,
  eventStockReportCsv,
  normalizeEventStockText,
  parseEventStockCsv,
  type EventStockImport,
  type EventStockItem,
  type EventStockLeftoverReportRow,
  type EventStockSnapshot,
  type EventStockSoldReportRow,
} from "@/lib/events/eventStock";
import type {
  EventSaleItemDraft,
  PurchasePrincipal,
} from "@/lib/purchases/domain";

type SqlRow = Record<string, string | number | null>;

export type ResolvedEventSaleItem = EventSaleItemDraft & {
  inventoryItemId?: string;
  unitListPriceCents?: number;
  color?: string;
  variation?: string;
};

export class EventStockRepository {
  constructor(private readonly database: DatabaseSync) {
    this.migrate();
  }

  migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_event_stock_import (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        source_name TEXT NOT NULL,
        source_hash TEXT NOT NULL,
        contract_version TEXT NOT NULL,
        row_count INTEGER NOT NULL CHECK(row_count > 0),
        total_quantity INTEGER NOT NULL CHECK(total_quantity > 0),
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','SUPERSEDED')),
        imported_by_user_id TEXT NOT NULL,
        imported_at TEXT NOT NULL,
        UNIQUE(workspace_id, event_id, source_hash),
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_event_stock_one_active
        ON phronesis_event_stock_import(workspace_id, event_id)
        WHERE status='ACTIVE';
      CREATE INDEX IF NOT EXISTS phronesis_event_stock_import_event
        ON phronesis_event_stock_import(workspace_id, event_id, imported_at DESC);
      CREATE TABLE IF NOT EXISTS phronesis_event_stock_item (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        import_id TEXT NOT NULL,
        source_row INTEGER NOT NULL,
        name TEXT NOT NULL,
        unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents >= 0),
        opening_quantity INTEGER NOT NULL CHECK(opening_quantity > 0),
        color TEXT,
        variation TEXT,
        normalized_search TEXT NOT NULL,
        normalized_identity TEXT NOT NULL,
        UNIQUE(import_id, source_row),
        UNIQUE(import_id, normalized_identity),
        FOREIGN KEY(import_id) REFERENCES phronesis_event_stock_import(id),
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_stock_item_event
        ON phronesis_event_stock_item(workspace_id, event_id, import_id, name);
      CREATE TABLE IF NOT EXISTS phronesis_event_stock_movement (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        stock_item_id TEXT NOT NULL,
        ledger_entry_id TEXT NOT NULL,
        sale_item_position INTEGER NOT NULL,
        movement_type TEXT NOT NULL CHECK(movement_type IN ('SALE','REVERSAL')),
        quantity_delta INTEGER NOT NULL CHECK(quantity_delta <> 0),
        actor_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(ledger_entry_id, stock_item_id, sale_item_position),
        FOREIGN KEY(stock_item_id) REFERENCES phronesis_event_stock_item(id),
        FOREIGN KEY(ledger_entry_id) REFERENCES phronesis_event_ledger_entry(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_stock_movement_item
        ON phronesis_event_stock_movement(workspace_id, event_id, stock_item_id, created_at);
      CREATE TABLE IF NOT EXISTS phronesis_event_stock_count (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        event_id TEXT NOT NULL,
        stock_item_id TEXT NOT NULL,
        counted_quantity INTEGER NOT NULL CHECK(counted_quantity >= 0),
        reason TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(stock_item_id) REFERENCES phronesis_event_stock_item(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_stock_count_item
        ON phronesis_event_stock_count(workspace_id, event_id, stock_item_id, created_at DESC);
    `);
    this.ensureColumn("phronesis_event_sale_item", "event_stock_item_id", "TEXT");
    this.ensureColumn(
      "phronesis_event_sale_item",
      "unit_list_price_cents",
      "INTEGER",
    );
    this.ensureColumn("phronesis_event_sale_item", "color", "TEXT");
    this.ensureColumn("phronesis_event_sale_item", "variation", "TEXT");
  }

  importCsv(
    principal: PurchasePrincipal,
    eventId: string,
    sourceNameInput: string,
    csv: string,
  ): EventStockSnapshot {
    this.assertEvent(principal.workspaceId, eventId, true);
    const sourceName = sourceNameInput.trim();
    if (!sourceName || sourceName.length > 240) {
      throw new Error("Inventory source filename must be between 1 and 240 characters.");
    }
    const parsed = parseEventStockCsv(csv);
    const sameImport = this.database
      .prepare(
        `SELECT * FROM phronesis_event_stock_import
         WHERE workspace_id=? AND event_id=? AND source_hash=?`,
      )
      .get(principal.workspaceId, eventId, parsed.sourceHash) as
      | SqlRow
      | undefined;
    const activeImport = this.activeImportRow(principal.workspaceId, eventId);
    if (activeImport && this.importHasMovements(String(activeImport.id))) {
      if (sameImport?.status === "ACTIVE") {
        return this.getSnapshot(principal, eventId);
      }
      throw new Error(
        "Event Inventory is locked after its first tracked Sale. Start a new event or use explicit count/disposition evidence.",
      );
    }
    if (sameImport?.status === "ACTIVE") {
      return this.getSnapshot(principal, eventId);
    }

    const importId = sameImport ? String(sameImport.id) : randomUUID();
    const importedAt = new Date().toISOString();
    this.withTransaction(() => {
      this.database
        .prepare(
          `UPDATE phronesis_event_stock_import SET status='SUPERSEDED'
           WHERE workspace_id=? AND event_id=? AND status='ACTIVE'`,
        )
        .run(principal.workspaceId, eventId);
      if (sameImport) {
        this.database
          .prepare(
            `UPDATE phronesis_event_stock_import SET status='ACTIVE'
             WHERE id=? AND workspace_id=? AND event_id=?`,
          )
          .run(importId, principal.workspaceId, eventId);
      } else {
        this.database
          .prepare(
            `INSERT INTO phronesis_event_stock_import(
              id, workspace_id, event_id, source_name, source_hash,
              contract_version, row_count, total_quantity, status,
              imported_by_user_id, imported_at
            ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
          )
          .run(
            importId,
            principal.workspaceId,
            eventId,
            sourceName,
            parsed.sourceHash,
            EVENT_STOCK_CONTRACT_VERSION,
            parsed.rows.length,
            parsed.totalQuantity,
            principal.operatorUserId,
            importedAt,
          );
        const insert = this.database.prepare(
          `INSERT INTO phronesis_event_stock_item(
            id, workspace_id, event_id, import_id, source_row, name,
            unit_price_cents, opening_quantity, color, variation,
            normalized_search, normalized_identity
          ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        );
        for (const row of parsed.rows) {
          insert.run(
            randomUUID(),
            principal.workspaceId,
            eventId,
            importId,
            row.sourceRow,
            row.name,
            row.unitPriceCents,
            row.openingQuantity,
            row.color,
            row.variation,
            row.normalizedSearch,
            row.normalizedIdentity,
          );
        }
      }
      this.insertAudit(principal, "EVENT_STOCK_IMPORTED", {
        eventId,
        importId,
        sourceName,
        sourceHash: parsed.sourceHash,
        rowCount: parsed.rows.length,
        totalQuantity: parsed.totalQuantity,
      });
    });
    return this.getSnapshot(principal, eventId);
  }

  getSnapshot(
    principal: PurchasePrincipal,
    eventId: string,
    query = "",
    maximumResults = 40,
  ): EventStockSnapshot {
    this.assertEvent(principal.workspaceId, eventId, false);
    const manifestRow = this.activeImportRow(principal.workspaceId, eventId);
    const manifest = manifestRow ? this.importFromRow(manifestRow) : null;
    const allItems = manifest
      ? this.itemsForImport(principal.workspaceId, eventId, manifest.id)
      : [];
    const normalizedQuery = normalizeEventStockText(query);
    const tokens = normalizedQuery.split(" ").filter(Boolean);
    const scored = allItems
      .map((item) => ({ item, score: this.searchScore(item, tokens, normalizedQuery) }))
      .filter((candidate) => candidate.score > 0)
      .sort(
        (first, second) =>
          second.score - first.score ||
          first.item.name.localeCompare(second.item.name) ||
          first.item.id.localeCompare(second.item.id),
      );
    const untrackedSaleUnits = this.untrackedSaleUnits(
      principal.workspaceId,
      eventId,
    );
    const summary = {
      optionCount: allItems.length,
      openingQuantity: allItems.reduce(
        (total, item) => total + item.openingQuantity,
        0,
      ),
      soldQuantity: allItems.reduce(
        (total, item) => total + item.soldQuantity,
        0,
      ),
      expectedQuantity: allItems.reduce(
        (total, item) => total + item.expectedQuantity,
        0,
      ),
      countedOptionCount: allItems.filter(
        (item) => item.countedQuantity !== null,
      ).length,
      countedQuantity: allItems.reduce(
        (total, item) => total + (item.countedQuantity ?? 0),
        0,
      ),
      varianceQuantity: allItems.reduce(
        (total, item) => total + (item.countVariance ?? 0),
        0,
      ),
      untrackedSaleUnits,
    };
    return {
      eventId,
      manifest,
      summary,
      items: scored.slice(0, maximumResults).map((candidate) => candidate.item),
      query,
      resultCount: scored.length,
      truncated: scored.length > maximumResults,
    };
  }

  countItem(
    principal: PurchasePrincipal,
    eventId: string,
    itemId: string,
    countedQuantity: number,
    rawReason: string,
  ): EventStockSnapshot {
    this.assertEvent(principal.workspaceId, eventId, false);
    if (!Number.isInteger(countedQuantity) || countedQuantity < 0) {
      throw new Error("Physical count must be a non-negative whole number.");
    }
    const reason = rawReason.trim();
    if (!reason || reason.length > 240) {
      throw new Error("A count reason between 1 and 240 characters is required.");
    }
    const item = this.activeItem(principal.workspaceId, eventId, itemId);
    if (!item) throw new Error("Active Event Inventory item was not found.");
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.withTransaction(() => {
      this.database
        .prepare(
          `INSERT INTO phronesis_event_stock_count(
            id, workspace_id, event_id, stock_item_id, counted_quantity,
            reason, actor_user_id, created_at
          ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          id,
          principal.workspaceId,
          eventId,
          itemId,
          countedQuantity,
          reason,
          principal.operatorUserId,
          createdAt,
        );
      this.insertAudit(principal, "EVENT_STOCK_COUNTED", {
        eventId,
        itemId,
        countedQuantity,
        reason,
      });
    });
    return this.getSnapshot(principal, eventId);
  }

  resolveSaleItems(
    principal: PurchasePrincipal,
    eventId: string,
    items: EventSaleItemDraft[],
  ): ResolvedEventSaleItem[] {
    const linkedIds = items
      .map((item) => item.inventoryItemId)
      .filter((itemId): itemId is string => Boolean(itemId));
    if (new Set(linkedIds).size !== linkedIds.length) {
      throw new Error("Add each Event Inventory option only once per Sale.");
    }
    return items.map((item) => {
      if (!item.inventoryItemId) return item;
      const stock = this.activeItem(
        principal.workspaceId,
        eventId,
        item.inventoryItemId,
      );
      if (!stock) throw new Error("Selected Event Inventory item was not found.");
      const expectedQuantity = this.expectedQuantity(String(stock.id));
      if (item.quantity > expectedQuantity) {
        throw new Error(
          `${String(stock.name)} has only ${expectedQuantity} expected remaining.`,
        );
      }
      const color = stock.color ? String(stock.color) : undefined;
      const variation = stock.variation ? String(stock.variation) : undefined;
      const description = [String(stock.name), variation, color]
        .filter(Boolean)
        .join(" · ");
      return {
        description,
        quantity: item.quantity,
        inventoryItemId: item.inventoryItemId,
        unitListPriceCents: Number(stock.unit_price_cents),
        color,
        variation,
      };
    });
  }

  recordSaleMovements(
    principal: PurchasePrincipal,
    eventId: string,
    ledgerEntryId: string,
    items: ResolvedEventSaleItem[],
    createdAt: string,
  ): void {
    const insert = this.database.prepare(
      `INSERT INTO phronesis_event_stock_movement(
        id, workspace_id, event_id, stock_item_id, ledger_entry_id,
        sale_item_position, movement_type, quantity_delta, actor_user_id, created_at
      ) VALUES(?, ?, ?, ?, ?, ?, 'SALE', ?, ?, ?)`,
    );
    items.forEach((item, position) => {
      if (!item.inventoryItemId) return;
      insert.run(
        randomUUID(),
        principal.workspaceId,
        eventId,
        item.inventoryItemId,
        ledgerEntryId,
        position,
        -item.quantity,
        principal.operatorUserId,
        createdAt,
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
        `SELECT event_stock_item_id, position, quantity
         FROM phronesis_event_sale_item
         WHERE entry_id=? AND event_stock_item_id IS NOT NULL
         ORDER BY position`,
      )
      .all(originalEntryId) as SqlRow[];
    const insert = this.database.prepare(
      `INSERT INTO phronesis_event_stock_movement(
        id, workspace_id, event_id, stock_item_id, ledger_entry_id,
        sale_item_position, movement_type, quantity_delta, actor_user_id, created_at
      ) VALUES(?, ?, ?, ?, ?, ?, 'REVERSAL', ?, ?, ?)`,
    );
    for (const row of rows) {
      insert.run(
        randomUUID(),
        principal.workspaceId,
        eventId,
        String(row.event_stock_item_id),
        reversalEntryId,
        Number(row.position),
        Number(row.quantity),
        principal.operatorUserId,
        createdAt,
      );
    }
  }

  reportCsv(
    principal: PurchasePrincipal,
    eventId: string,
    report: "sold" | "leftover",
  ): string {
    this.assertEvent(principal.workspaceId, eventId, false);
    return report === "sold"
      ? eventStockReportCsv("sold", this.soldReport(principal.workspaceId, eventId))
      : eventStockReportCsv(
          "leftover",
          this.leftoverReport(principal.workspaceId, eventId),
        );
  }

  private soldReport(
    workspaceId: string,
    eventId: string,
  ): EventStockSoldReportRow[] {
    return (
      this.database
        .prepare(
          `SELECT entry.created_at, entry.id AS ledger_entry_id,
             entry.payment_method, entry.amount_cents, item.description,
             item.quantity, item.unit_list_price_cents, item.color,
             item.variation, reversal.id AS reversal_id
           FROM phronesis_event_sale_item AS item
           JOIN phronesis_event_ledger_entry AS entry ON entry.id=item.entry_id
           LEFT JOIN phronesis_event_ledger_entry AS reversal
             ON reversal.reversal_of_entry_id=entry.id
           WHERE entry.workspace_id=? AND entry.event_id=? AND entry.entry_type='SALE'
           ORDER BY entry.created_at, entry.id, item.position`,
        )
        .all(workspaceId, eventId) as SqlRow[]
    ).map((row) => ({
      soldAt: String(row.created_at),
      ledgerEntryId: String(row.ledger_entry_id),
      paymentMethod: String(row.payment_method),
      saleTotalCents: Number(row.amount_cents),
      itemName: String(row.description),
      quantity: Number(row.quantity),
      unitListPriceCents:
        row.unit_list_price_cents === null
          ? null
          : Number(row.unit_list_price_cents),
      color: row.color ? String(row.color) : null,
      variation: row.variation ? String(row.variation) : null,
      reversed: Boolean(row.reversal_id),
    }));
  }

  private leftoverReport(
    workspaceId: string,
    eventId: string,
  ): EventStockLeftoverReportRow[] {
    const manifest = this.activeImportRow(workspaceId, eventId);
    if (!manifest) return [];
    return this.itemsForImport(workspaceId, eventId, String(manifest.id)).map(
      (item) => ({
        name: item.name,
        unitPriceCents: item.unitPriceCents,
        openingQuantity: item.openingQuantity,
        color: item.color,
        variation: item.variation,
        soldQuantity: item.soldQuantity,
        expectedQuantity: item.expectedQuantity,
        countedQuantity: item.countedQuantity,
        countVariance: item.countVariance,
      }),
    );
  }

  private itemsForImport(
    workspaceId: string,
    eventId: string,
    importId: string,
  ): EventStockItem[] {
    const rows = this.database
      .prepare(
        `SELECT * FROM phronesis_event_stock_item
         WHERE workspace_id=? AND event_id=? AND import_id=?
         ORDER BY name, variation, color, source_row`,
      )
      .all(workspaceId, eventId, importId) as SqlRow[];
    const movementRows = this.database
      .prepare(
        `SELECT stock_item_id, COALESCE(SUM(quantity_delta), 0) AS delta
         FROM phronesis_event_stock_movement
         WHERE workspace_id=? AND event_id=? GROUP BY stock_item_id`,
      )
      .all(workspaceId, eventId) as SqlRow[];
    const deltas = new Map(
      movementRows.map((row) => [String(row.stock_item_id), Number(row.delta)]),
    );
    const countRows = this.database
      .prepare(
        `SELECT stock_item_id, counted_quantity, created_at FROM (
           SELECT stock_item_id, counted_quantity, created_at, id,
             ROW_NUMBER() OVER (
               PARTITION BY stock_item_id ORDER BY created_at DESC, id DESC
             ) AS row_number
           FROM phronesis_event_stock_count
           WHERE workspace_id=? AND event_id=?
         ) WHERE row_number=1`,
      )
      .all(workspaceId, eventId) as SqlRow[];
    const counts = new Map(
      countRows.map((row) => [
        String(row.stock_item_id),
        {
          quantity: Number(row.counted_quantity),
          createdAt: String(row.created_at),
        },
      ]),
    );
    return rows.map((row) => {
      const id = String(row.id);
      const openingQuantity = Number(row.opening_quantity);
      const delta = deltas.get(id) ?? 0;
      const expectedQuantity = openingQuantity + delta;
      const count = counts.get(id) ?? null;
      return {
        id,
        eventId,
        sourceRow: Number(row.source_row),
        name: String(row.name),
        unitPriceCents: Number(row.unit_price_cents),
        openingQuantity,
        color: row.color ? String(row.color) : null,
        variation: row.variation ? String(row.variation) : null,
        soldQuantity: Math.max(0, -delta),
        expectedQuantity,
        countedQuantity: count?.quantity ?? null,
        countVariance: count ? count.quantity - expectedQuantity : null,
        lastCountedAt: count?.createdAt ?? null,
      };
    });
  }

  private searchScore(
    item: EventStockItem,
    tokens: string[],
    normalizedQuery: string,
  ): number {
    if (!tokens.length) return 1;
    const name = normalizeEventStockText(item.name);
    const searchable = normalizeEventStockText(
      `${item.name} ${item.color ?? ""} ${item.variation ?? ""} ${(item.unitPriceCents / 100).toFixed(2)}`,
    );
    if (!tokens.every((token) => searchable.includes(token))) return 0;
    let score = tokens.length * 10;
    if (name === normalizedQuery) score += 100;
    else if (name.startsWith(normalizedQuery)) score += 70;
    else if (name.includes(normalizedQuery)) score += 50;
    if (item.expectedQuantity > 0) score += 5;
    return score;
  }

  private untrackedSaleUnits(workspaceId: string, eventId: string): number {
    const row = this.database
      .prepare(
        `SELECT COALESCE(SUM(item.quantity), 0) AS quantity
         FROM phronesis_event_sale_item AS item
         JOIN phronesis_event_ledger_entry AS entry ON entry.id=item.entry_id
         LEFT JOIN phronesis_event_ledger_entry AS reversal
           ON reversal.reversal_of_entry_id=entry.id
         WHERE entry.workspace_id=? AND entry.event_id=?
           AND entry.entry_type='SALE' AND reversal.id IS NULL
           AND item.event_stock_item_id IS NULL
           AND item.event_case_item_id IS NULL`,
      )
      .get(workspaceId, eventId) as SqlRow;
    return Number(row.quantity);
  }

  private activeImportRow(
    workspaceId: string,
    eventId: string,
  ): SqlRow | undefined {
    return this.database
      .prepare(
        `SELECT * FROM phronesis_event_stock_import
         WHERE workspace_id=? AND event_id=? AND status='ACTIVE' LIMIT 1`,
      )
      .get(workspaceId, eventId) as SqlRow | undefined;
  }

  private activeItem(
    workspaceId: string,
    eventId: string,
    itemId: string,
  ): SqlRow | undefined {
    return this.database
      .prepare(
        `SELECT item.* FROM phronesis_event_stock_item AS item
         JOIN phronesis_event_stock_import AS manifest ON manifest.id=item.import_id
         WHERE item.id=? AND item.workspace_id=? AND item.event_id=?
           AND manifest.status='ACTIVE'`,
      )
      .get(itemId, workspaceId, eventId) as SqlRow | undefined;
  }

  private expectedQuantity(itemId: string): number {
    const row = this.database
      .prepare(
        `SELECT item.opening_quantity + COALESCE(SUM(movement.quantity_delta), 0) AS quantity
         FROM phronesis_event_stock_item AS item
         LEFT JOIN phronesis_event_stock_movement AS movement
           ON movement.stock_item_id=item.id
         WHERE item.id=? GROUP BY item.id`,
      )
      .get(itemId) as SqlRow | undefined;
    if (!row) throw new Error("Event Inventory item was not found.");
    return Number(row.quantity);
  }

  private importHasMovements(importId: string): boolean {
    return Boolean(
      this.database
        .prepare(
          `SELECT 1 FROM phronesis_event_stock_movement AS movement
           JOIN phronesis_event_stock_item AS item
             ON item.id=movement.stock_item_id
           WHERE item.import_id=? LIMIT 1`,
        )
        .get(importId),
    );
  }

  private importFromRow(row: SqlRow): EventStockImport {
    return {
      id: String(row.id),
      eventId: String(row.event_id),
      sourceName: String(row.source_name),
      sourceHash: String(row.source_hash),
      contractVersion: String(row.contract_version),
      rowCount: Number(row.row_count),
      totalQuantity: Number(row.total_quantity),
      importedByUserId: String(row.imported_by_user_id),
      importedAt: String(row.imported_at),
    };
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
      throw new Error(requireActive ? "Active event was not found." : "Event was not found.");
    }
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

  private ensureColumn(table: string, column: string, definition: string): void {
    const columns = this.database
      .prepare(`PRAGMA table_info(${table})`)
      .all() as SqlRow[];
    if (!columns.some((candidate) => candidate.name === column)) {
      this.database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
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
