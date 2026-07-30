import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import type { InventoryLot, InventorySnapshot } from "@/lib/inventory/domain";
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
    `);
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

  listWorkspace(workspaceId: string): InventorySnapshot {
    const lots = (this.database.prepare(`
      SELECT * FROM phronesis_inventory_lot
      WHERE workspace_id=? ORDER BY acquired_at DESC, source_receipt_id, source_line_position
    `).all(workspaceId) as SqlRow[]).map((row) => this.lotFromRow(row));
    const active = lots.filter((lot) => !lot.voidedAt);
    return {
      summary: {
        activeLotCount: active.length,
        exactUnitCount: active.reduce((sum, lot) => sum + (lot.kind === "EXACT" ? lot.quantity ?? 0 : 0), 0),
        bulkLotCount: active.filter((lot) => lot.kind === "BULK").length,
        totalCostBasisCents: active.reduce((sum, lot) => sum + lot.totalCostCents, 0),
        voidedLotCount: lots.length - active.length,
      },
      lots,
    };
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
      acquiredAt: String(row.acquired_at),
      voidedAt: row.voided_at ? String(row.voided_at) : null,
      voidReason: row.void_reason ? String(row.void_reason) : null,
    };
  }
}
