import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { InventoryRepository } from "@/lib/inventory/InventoryRepository";
import type { SearchMatch } from "@/lib/pricing/types";
import type {
  PurchaseEvent,
  PurchaseLine,
  PurchaseLineDraft,
  PurchasePrincipal,
  PurchaseReceipt,
} from "@/lib/purchases/domain";

type SqlRow = Record<string, string | number | null>;

function parseLine(value: string): PurchaseLine {
  return JSON.parse(value) as PurchaseLine;
}

export class PurchaseLedgerRepository {
  private readonly inventory: InventoryRepository;

  constructor(private readonly database: DatabaseSync) {
    this.migrate();
    this.inventory = new InventoryRepository(database);
  }

  migrate() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_purchase_event (
        id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, created_by_user_id TEXT NOT NULL,
        name TEXT NOT NULL, event_date TEXT NOT NULL, location TEXT, budget_cents INTEGER,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','CLOSED')),
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS phronesis_purchase_event_workspace ON phronesis_purchase_event(workspace_id, status, event_date DESC);
      CREATE TABLE IF NOT EXISTS phronesis_purchase_cart_line (
        id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, operator_user_id TEXT NOT NULL,
        event_id TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
        FOREIGN KEY(event_id) REFERENCES phronesis_purchase_event(id)
      );
      CREATE INDEX IF NOT EXISTS phronesis_purchase_cart_owner ON phronesis_purchase_cart_line(workspace_id, operator_user_id, event_id, created_at);
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
    `);
  }

  createEvent(principal: PurchasePrincipal, input: { name: string; eventDate: string; location?: string; budgetCents?: number | null }): PurchaseEvent {
    const name = input.name.trim();
    if (!name) throw new Error("Event name is required.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)) throw new Error("Event date is invalid.");
    const budget = input.budgetCents ?? null;
    if (budget !== null && (!Number.isInteger(budget) || budget < 0)) throw new Error("Event budget is invalid.");
    const id = randomUUID();
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO phronesis_purchase_event(id, workspace_id, created_by_user_id, name, event_date, location, budget_cents, status, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(id, principal.workspaceId, principal.operatorUserId, name, input.eventDate, input.location?.trim() || null, budget, now, now);
    return { id, name, eventDate: input.eventDate, location: input.location?.trim() || null, budgetCents: budget, status: "ACTIVE", createdAt: now };
  }

  getActiveEvent(principal: PurchasePrincipal): PurchaseEvent | null {
    const row = this.database.prepare(`
      SELECT * FROM phronesis_purchase_event WHERE workspace_id=? AND status='ACTIVE'
      ORDER BY event_date DESC, created_at DESC LIMIT 1
    `).get(principal.workspaceId) as SqlRow | undefined;
    return row ? this.eventFromRow(row) : null;
  }

  addLine(principal: PurchasePrincipal, eventId: string, draft: PurchaseLineDraft, exactMatch?: SearchMatch): PurchaseLine {
    this.assertActiveEvent(principal.workspaceId, eventId);
    const id = randomUUID();
    const line: PurchaseLine = draft.kind === "BULK"
      ? { ...draft, id }
      : (() => {
          if (!exactMatch || exactMatch.categoryId !== draft.categoryId || exactMatch.sku !== draft.sku) throw new Error("Exact catalogue product was not found.");
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
        })();
    const now = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO phronesis_purchase_cart_line(id, workspace_id, operator_user_id, event_id, payload_json, created_at, updated_at)
      VALUES(?, ?, ?, ?, ?, ?, ?)
    `).run(id, principal.workspaceId, principal.operatorUserId, eventId, JSON.stringify(line), now, now);
    return line;
  }

  listCart(principal: PurchasePrincipal, eventId: string): PurchaseLine[] {
    return (this.database.prepare(`
      SELECT payload_json FROM phronesis_purchase_cart_line
      WHERE workspace_id=? AND operator_user_id=? AND event_id=? ORDER BY created_at, id
    `).all(principal.workspaceId, principal.operatorUserId, eventId) as SqlRow[])
      .map((row) => parseLine(String(row.payload_json)));
  }

  removeLine(principal: PurchasePrincipal, lineId: string): boolean {
    const result = this.database.prepare(`
      DELETE FROM phronesis_purchase_cart_line WHERE id=? AND workspace_id=? AND operator_user_id=?
    `).run(lineId, principal.workspaceId, principal.operatorUserId);
    return Number(result.changes) === 1;
  }

  checkout(principal: PurchasePrincipal, eventId: string, idempotencyKey: string): PurchaseReceipt {
    if (!/^[A-Za-z0-9:_-]{8,128}$/.test(idempotencyKey)) throw new Error("Checkout idempotency key is invalid.");
    const existing = this.findReceiptByKey(principal, idempotencyKey);
    if (existing) return existing;
    this.assertActiveEvent(principal.workspaceId, eventId);
    const lines = this.listCart(principal, eventId);
    if (!lines.length) throw new Error("The event cart is empty.");
    const totalCents = lines.reduce((sum, line) => sum + line.actualPaidCents * (line.kind === "EXACT" ? line.quantity : 1), 0);
    const id = randomUUID();
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        INSERT INTO phronesis_purchase_receipt(id, workspace_id, operator_user_id, event_id, idempotency_key, total_cents, created_at)
        VALUES(?, ?, ?, ?, ?, ?, ?)
      `).run(id, principal.workspaceId, principal.operatorUserId, eventId, idempotencyKey, totalCents, now);
      const insertLine = this.database.prepare("INSERT INTO phronesis_purchase_receipt_line(receipt_id, position, payload_json) VALUES(?, ?, ?)");
      lines.forEach((line, index) => insertLine.run(id, index, JSON.stringify(line)));
      this.inventory.recordReceipt({
        workspaceId: principal.workspaceId,
        receiptId: id,
        eventId,
        operatorUserId: principal.operatorUserId,
        createdAt: now,
      }, lines);
      this.database.prepare("DELETE FROM phronesis_purchase_cart_line WHERE workspace_id=? AND operator_user_id=? AND event_id=?")
        .run(principal.workspaceId, principal.operatorUserId, eventId);
      this.insertAudit(principal, "RECEIPT_FINALIZED", id, { totalCents, lineCount: lines.length });
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return { id, eventId, operatorUserId: principal.operatorUserId, totalCents, createdAt: now, voidedAt: null, lines };
  }

  listReceipts(principal: PurchasePrincipal, workspaceWide = false): PurchaseReceipt[] {
    const rows = workspaceWide
      ? this.database.prepare("SELECT * FROM phronesis_purchase_receipt WHERE workspace_id=? ORDER BY created_at DESC").all(principal.workspaceId)
      : this.database.prepare("SELECT * FROM phronesis_purchase_receipt WHERE workspace_id=? AND operator_user_id=? ORDER BY created_at DESC").all(principal.workspaceId, principal.operatorUserId);
    return (rows as SqlRow[]).map((row) => this.receiptFromRow(row));
  }

  voidReceipt(principal: PurchasePrincipal, receiptId: string, reason: string): PurchaseReceipt {
    const note = reason.trim();
    if (!note) throw new Error("A void reason is required.");
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = this.database.prepare("UPDATE phronesis_purchase_receipt SET voided_at=? WHERE id=? AND workspace_id=? AND voided_at IS NULL")
        .run(now, receiptId, principal.workspaceId);
      if (Number(result.changes) !== 1) throw new Error("Receipt was not found or was already voided.");
      this.inventory.voidReceipt(principal.workspaceId, receiptId, now, note);
      this.insertAudit(principal, "RECEIPT_VOIDED", receiptId, { reason: note });
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    const row = this.database.prepare("SELECT * FROM phronesis_purchase_receipt WHERE id=?").get(receiptId) as SqlRow;
    return this.receiptFromRow(row);
  }

  private assertActiveEvent(workspaceId: string, eventId: string) {
    const row = this.database.prepare("SELECT status FROM phronesis_purchase_event WHERE id=? AND workspace_id=?").get(eventId, workspaceId) as SqlRow | undefined;
    if (!row || row.status !== "ACTIVE") throw new Error("Active purchase event was not found.");
  }

  private eventFromRow(row: SqlRow): PurchaseEvent {
    return { id: String(row.id), name: String(row.name), eventDate: String(row.event_date), location: row.location ? String(row.location) : null, budgetCents: row.budget_cents === null ? null : Number(row.budget_cents), status: String(row.status) as PurchaseEvent["status"], createdAt: String(row.created_at) };
  }

  private findReceiptByKey(principal: PurchasePrincipal, key: string): PurchaseReceipt | null {
    const row = this.database.prepare("SELECT * FROM phronesis_purchase_receipt WHERE workspace_id=? AND operator_user_id=? AND idempotency_key=?")
      .get(principal.workspaceId, principal.operatorUserId, key) as SqlRow | undefined;
    return row ? this.receiptFromRow(row) : null;
  }

  private receiptFromRow(row: SqlRow): PurchaseReceipt {
    const lines = (this.database.prepare("SELECT payload_json FROM phronesis_purchase_receipt_line WHERE receipt_id=? ORDER BY position")
      .all(String(row.id)) as SqlRow[]).map((line) => parseLine(String(line.payload_json)));
    return { id: String(row.id), eventId: String(row.event_id), operatorUserId: String(row.operator_user_id), totalCents: Number(row.total_cents), createdAt: String(row.created_at), voidedAt: row.voided_at ? String(row.voided_at) : null, lines };
  }

  private insertAudit(principal: PurchasePrincipal, action: string, receiptId: string, details: Record<string, unknown>) {
    this.database.prepare("INSERT INTO phronesis_purchase_audit(id, workspace_id, actor_user_id, action, receipt_id, details_json, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)")
      .run(randomUUID(), principal.workspaceId, principal.operatorUserId, action, receiptId, JSON.stringify(details), new Date().toISOString());
  }
}
