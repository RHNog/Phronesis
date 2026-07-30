import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type {
  InventoryEvent,
  InventoryLocation,
  InventoryLot,
  InventorySnapshot,
} from "@/lib/inventory/domain";
import type { PurchaseLine } from "@/lib/purchases/domain";

type SqlRow = Record<string, string | number | null>;

export class InventoryRepository {
  constructor(private readonly database: DatabaseSync) {
    this.migrate();
    this.reconcileReceipts();
  }

  migrate() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_inventory_lot (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        source_receipt_id TEXT NOT NULL,
        source_line_position INTEGER NOT NULL,
        source_event_id TEXT NOT NULL,
        acquired_by_user_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('EXACT','BULK')),
        category_id TEXT,
        sku TEXT,
        name TEXT NOT NULL,
        set_name TEXT,
        collector_number TEXT,
        variant TEXT,
        language TEXT,
        product_type TEXT NOT NULL CHECK(product_type IN ('SINGLE','SEALED','BULK')),
        condition TEXT,
        quantity INTEGER,
        unit_cost_cents INTEGER,
        total_cost_cents INTEGER NOT NULL,
        product_lines_json TEXT NOT NULL DEFAULT '[]',
        notes TEXT,
        approximate_quantity INTEGER,
        approximate_weight TEXT,
        acquired_at TEXT NOT NULL,
        voided_at TEXT,
        void_reason TEXT,
        UNIQUE(workspace_id, source_receipt_id, source_line_position),
        FOREIGN KEY(source_receipt_id) REFERENCES phronesis_purchase_receipt(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_inventory_workspace_status
        ON phronesis_inventory_lot(workspace_id, voided_at, acquired_at DESC);
      CREATE INDEX IF NOT EXISTS phronesis_inventory_source_receipt
        ON phronesis_inventory_lot(source_receipt_id);
      CREATE TABLE IF NOT EXISTS phronesis_inventory_location (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        created_by_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(workspace_id, normalized_name)
      );
      CREATE INDEX IF NOT EXISTS phronesis_inventory_location_workspace
        ON phronesis_inventory_location(workspace_id, name);
      CREATE TABLE IF NOT EXISTS phronesis_inventory_event (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        lot_id TEXT NOT NULL,
        actor_user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('MOVE','COUNT')),
        previous_location_id TEXT,
        next_location_id TEXT,
        previous_quantity INTEGER,
        next_quantity INTEGER,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY(lot_id) REFERENCES phronesis_inventory_lot(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_inventory_event_workspace
        ON phronesis_inventory_event(workspace_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS phronesis_inventory_event_lot
        ON phronesis_inventory_event(lot_id, created_at DESC);
    `);
    this.addLotColumn("location_id", "TEXT");
    this.addLotColumn("reconciled_quantity", "INTEGER");
    this.addLotColumn("last_counted_at", "TEXT");
  }

  recordReceipt(
    input: {
      workspaceId: string;
      receiptId: string;
      eventId: string;
      operatorUserId: string;
      createdAt: string;
      voidedAt?: string | null;
    },
    lines: readonly PurchaseLine[],
  ) {
    const insert = this.database.prepare(`
      INSERT OR IGNORE INTO phronesis_inventory_lot(
        id, workspace_id, source_receipt_id, source_line_position, source_event_id,
        acquired_by_user_id, kind, category_id, sku, name, set_name,
        collector_number, variant, language, product_type, condition, quantity,
        unit_cost_cents, total_cost_cents, product_lines_json, notes,
        approximate_quantity, approximate_weight, acquired_at, voided_at, void_reason
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    lines.forEach((line, position) => {
      const exact = line.kind === "EXACT";
      insert.run(
        randomUUID(), input.workspaceId, input.receiptId, position, input.eventId,
        input.operatorUserId, line.kind,
        exact ? line.categoryId : null,
        exact ? line.sku : null,
        exact ? line.name : "Bulk",
        exact ? line.setName : null,
        exact ? line.collectorNumber : null,
        exact ? line.variant : null,
        exact ? line.language : null,
        exact ? line.productType : "BULK",
        exact ? line.condition : null,
        exact ? line.quantity : null,
        exact ? line.actualPaidCents : null,
        exact ? line.actualPaidCents * line.quantity : line.actualPaidCents,
        JSON.stringify(exact ? [] : line.productLines),
        line.notes?.trim() || null,
        exact ? null : (line.approximateQuantity ?? null),
        exact ? null : (line.approximateWeight ?? null),
        input.createdAt,
        input.voidedAt ?? null,
        input.voidedAt ? "Source receipt voided" : null,
      );
    });
  }

  voidReceipt(workspaceId: string, receiptId: string, voidedAt: string, reason: string) {
    this.database.prepare(`
      UPDATE phronesis_inventory_lot SET voided_at=?, void_reason=?
      WHERE workspace_id=? AND source_receipt_id=? AND voided_at IS NULL
    `).run(voidedAt, reason, workspaceId, receiptId);
  }

  createLocation(workspaceId: string, actorUserId: string, rawName: string): InventoryLocation {
    const name = rawName.trim().replace(/\s+/g, " ");
    if (!name || name.length > 80) throw new Error("Location name must be between 1 and 80 characters.");
    const normalizedName = name.toLocaleLowerCase("en-US");
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    try {
      this.database.prepare(`
        INSERT INTO phronesis_inventory_location(
          id, workspace_id, name, normalized_name, created_by_user_id, created_at
        ) VALUES(?, ?, ?, ?, ?, ?)
      `).run(id, workspaceId, name, normalizedName, actorUserId, createdAt);
    } catch (error) {
      if (error instanceof Error && /unique/i.test(error.message)) {
        throw new Error("A location with this name already exists.");
      }
      throw error;
    }
    return { id, name, createdAt };
  }

  reconcileLot(
    workspaceId: string,
    actorUserId: string,
    input: {
      lotId: string;
      locationId?: string | null;
      countedQuantity?: number;
      reason: string;
    },
  ): InventorySnapshot {
    const reason = input.reason.trim();
    if (!reason || reason.length > 240) throw new Error("A reconciliation reason between 1 and 240 characters is required.");
    const locationSpecified = Object.prototype.hasOwnProperty.call(input, "locationId");
    const countSpecified = Object.prototype.hasOwnProperty.call(input, "countedQuantity");
    if (!locationSpecified && !countSpecified) throw new Error("A location or physical count change is required.");
    if (countSpecified && (!Number.isInteger(input.countedQuantity) || Number(input.countedQuantity) < 0)) {
      throw new Error("Physical count must be a non-negative whole number.");
    }

    const lot = this.database.prepare(`
      SELECT id, location_id, quantity, approximate_quantity, reconciled_quantity, last_counted_at, voided_at
      FROM phronesis_inventory_lot WHERE id=? AND workspace_id=?
    `).get(input.lotId, workspaceId) as SqlRow | undefined;
    if (!lot || lot.voided_at) throw new Error("An active inventory lot was not found.");

    const previousLocationId = lot.location_id ? String(lot.location_id) : null;
    const nextLocationId = locationSpecified ? input.locationId ?? null : previousLocationId;
    if (nextLocationId) {
      const location = this.database.prepare(`
        SELECT id FROM phronesis_inventory_location WHERE id=? AND workspace_id=?
      `).get(nextLocationId, workspaceId);
      if (!location) throw new Error("Inventory location was not found in this workspace.");
    }

    const receiptOrApproximateQuantity = lot.quantity === null
      ? (lot.approximate_quantity === null ? null : Number(lot.approximate_quantity))
      : Number(lot.quantity);
    const previousReconciledQuantity = lot.reconciled_quantity === null ? null : Number(lot.reconciled_quantity);
    const previousOnHandQuantity = previousReconciledQuantity ?? receiptOrApproximateQuantity;
    const nextReconciledQuantity = countSpecified ? Number(input.countedQuantity) : previousReconciledQuantity;
    const locationChanged = previousLocationId !== nextLocationId;
    const countChanged = countSpecified && (
      previousReconciledQuantity === null || previousOnHandQuantity !== nextReconciledQuantity
    );
    if (!locationChanged && !countChanged) throw new Error("Reconciliation did not change the lot.");

    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        UPDATE phronesis_inventory_lot
        SET location_id=?, reconciled_quantity=?, last_counted_at=?
        WHERE id=? AND workspace_id=? AND voided_at IS NULL
      `).run(
        nextLocationId,
        nextReconciledQuantity,
        countChanged ? now : (lot.last_counted_at ?? null),
        input.lotId,
        workspaceId,
      );
      if (locationChanged) {
        this.insertEvent({
          workspaceId, lotId: input.lotId, actorUserId, type: "MOVE",
          previousLocationId, nextLocationId, previousQuantity: null,
          nextQuantity: null, reason, createdAt: now,
        });
      }
      if (countChanged) {
        this.insertEvent({
          workspaceId, lotId: input.lotId, actorUserId, type: "COUNT",
          previousLocationId: null, nextLocationId: null,
          previousQuantity: previousOnHandQuantity,
          nextQuantity: nextReconciledQuantity,
          reason, createdAt: now,
        });
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.listWorkspace(workspaceId);
  }

  listWorkspace(workspaceId: string): InventorySnapshot {
    const lots = (this.database.prepare(`
      SELECT lot.*, location.name AS location_name
      FROM phronesis_inventory_lot lot
      LEFT JOIN phronesis_inventory_location location ON location.id=lot.location_id
      WHERE lot.workspace_id=?
      ORDER BY lot.acquired_at DESC, lot.source_receipt_id, lot.source_line_position
    `).all(workspaceId) as SqlRow[]).map((row) => this.lotFromRow(row));
    const active = lots.filter((lot) => !lot.voidedAt);
    return {
      summary: {
        activeLotCount: active.length,
        exactUnitCount: active.reduce((sum, lot) => sum + (lot.kind === "EXACT" ? lot.onHandQuantity ?? 0 : 0), 0),
        bulkLotCount: active.filter((lot) => lot.kind === "BULK").length,
        totalCostBasisCents: active.reduce((sum, lot) => sum + lot.totalCostCents, 0),
        voidedLotCount: lots.length - active.length,
      },
      lots,
      locations: this.listLocations(workspaceId),
      recentEvents: this.listRecentEvents(workspaceId),
    };
  }

  private addLotColumn(name: string, type: string) {
    const columns = this.database.prepare("PRAGMA table_info(phronesis_inventory_lot)").all() as SqlRow[];
    if (!columns.some((column) => column.name === name)) {
      this.database.exec(`ALTER TABLE phronesis_inventory_lot ADD COLUMN ${name} ${type}`);
    }
  }

  private listLocations(workspaceId: string): InventoryLocation[] {
    return (this.database.prepare(`
      SELECT id, name, created_at FROM phronesis_inventory_location
      WHERE workspace_id=? ORDER BY name COLLATE NOCASE
    `).all(workspaceId) as SqlRow[]).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      createdAt: String(row.created_at),
    }));
  }

  private listRecentEvents(workspaceId: string): InventoryEvent[] {
    return (this.database.prepare(`
      SELECT event.*, lot.name AS lot_name,
        previous_location.name AS previous_location_name,
        next_location.name AS next_location_name
      FROM phronesis_inventory_event event
      JOIN phronesis_inventory_lot lot ON lot.id=event.lot_id
      LEFT JOIN phronesis_inventory_location previous_location ON previous_location.id=event.previous_location_id
      LEFT JOIN phronesis_inventory_location next_location ON next_location.id=event.next_location_id
      WHERE event.workspace_id=? ORDER BY event.created_at DESC, event.id DESC LIMIT 50
    `).all(workspaceId) as SqlRow[]).map((row) => ({
      id: String(row.id),
      lotId: String(row.lot_id),
      lotName: String(row.lot_name),
      type: String(row.type) as InventoryEvent["type"],
      previousLocationName: row.previous_location_id ? String(row.previous_location_name ?? "Unknown") : null,
      nextLocationName: row.next_location_id ? String(row.next_location_name ?? "Unknown") : null,
      previousQuantity: row.previous_quantity === null ? null : Number(row.previous_quantity),
      nextQuantity: row.next_quantity === null ? null : Number(row.next_quantity),
      reason: String(row.reason),
      actorUserId: String(row.actor_user_id),
      createdAt: String(row.created_at),
    }));
  }

  private insertEvent(input: {
    workspaceId: string;
    lotId: string;
    actorUserId: string;
    type: InventoryEvent["type"];
    previousLocationId: string | null;
    nextLocationId: string | null;
    previousQuantity: number | null;
    nextQuantity: number | null;
    reason: string;
    createdAt: string;
  }) {
    this.database.prepare(`
      INSERT INTO phronesis_inventory_event(
        id, workspace_id, lot_id, actor_user_id, type, previous_location_id,
        next_location_id, previous_quantity, next_quantity, reason, created_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(), input.workspaceId, input.lotId, input.actorUserId, input.type,
      input.previousLocationId, input.nextLocationId, input.previousQuantity,
      input.nextQuantity, input.reason, input.createdAt,
    );
  }

  private reconcileReceipts() {
    const table = this.database.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='phronesis_purchase_receipt'
    `).get();
    if (!table) return;
    const receipts = this.database.prepare(`
      SELECT id, workspace_id, operator_user_id, event_id, created_at, voided_at
      FROM phronesis_purchase_receipt ORDER BY created_at
    `).all() as SqlRow[];
    for (const receipt of receipts) {
      const lines = (this.database.prepare(`
        SELECT payload_json FROM phronesis_purchase_receipt_line
        WHERE receipt_id=? ORDER BY position
      `).all(String(receipt.id)) as SqlRow[]).map((row) => JSON.parse(String(row.payload_json)) as PurchaseLine);
      this.recordReceipt({
        workspaceId: String(receipt.workspace_id),
        receiptId: String(receipt.id),
        eventId: String(receipt.event_id),
        operatorUserId: String(receipt.operator_user_id),
        createdAt: String(receipt.created_at),
        voidedAt: receipt.voided_at ? String(receipt.voided_at) : null,
      }, lines);
    }
  }

  private lotFromRow(row: SqlRow): InventoryLot {
    return {
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      sourceReceiptId: String(row.source_receipt_id),
      sourceLinePosition: Number(row.source_line_position),
      sourceEventId: String(row.source_event_id),
      acquiredByUserId: String(row.acquired_by_user_id),
      kind: String(row.kind) as InventoryLot["kind"],
      categoryId: row.category_id ? String(row.category_id) : null,
      sku: row.sku ? String(row.sku) : null,
      name: String(row.name),
      setName: row.set_name ? String(row.set_name) : null,
      collectorNumber: row.collector_number ? String(row.collector_number) : null,
      variant: row.variant ? String(row.variant) : null,
      language: row.language ? String(row.language) : null,
      productType: String(row.product_type) as InventoryLot["productType"],
      condition: row.condition ? String(row.condition) : null,
      quantity: row.quantity === null ? null : Number(row.quantity),
      unitCostCents: row.unit_cost_cents === null ? null : Number(row.unit_cost_cents),
      totalCostCents: Number(row.total_cost_cents),
      productLines: JSON.parse(String(row.product_lines_json)) as InventoryLot["productLines"],
      notes: row.notes ? String(row.notes) : null,
      approximateQuantity: row.approximate_quantity === null ? null : Number(row.approximate_quantity),
      approximateWeight: row.approximate_weight ? String(row.approximate_weight) : null,
      locationId: row.location_id ? String(row.location_id) : null,
      locationName: row.location_name ? String(row.location_name) : "Unassigned",
      onHandQuantity: row.reconciled_quantity === null
        ? (row.quantity === null
            ? (row.approximate_quantity === null ? null : Number(row.approximate_quantity))
            : Number(row.quantity))
        : Number(row.reconciled_quantity),
      quantityBasis: row.reconciled_quantity !== null
        ? "COUNTED"
        : String(row.kind) === "EXACT"
          ? "RECEIPT"
          : row.approximate_quantity !== null
            ? "APPROXIMATE"
            : "UNKNOWN",
      lastCountedAt: row.last_counted_at ? String(row.last_counted_at) : null,
      acquiredAt: String(row.acquired_at),
      voidedAt: row.voided_at ? String(row.voided_at) : null,
      voidReason: row.void_reason ? String(row.void_reason) : null,
    };
  }
}
