import { createHash, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { accessSatisfies, type AuthorizationDecision, type ModuleAccessLevel, type ModuleEntitlement, type PhronesisModule } from "@/lib/auth/domain";
import { EVENT_ACCESS_COOKIE } from "@/lib/auth/constants";

type SqlRow = Record<string, string | number | null>;
const ALLOWED_MODULES = ["VENDOR_WORKSPACE", "EVENT_LEDGER", "EVENT_FLIP", "INVENTORY", "ARTWORK_REVIEW"] as const;
const EVENT_BOUND_MODULES = ["VENDOR_WORKSPACE", "EVENT_LEDGER", "EVENT_FLIP", "INVENTORY"] as const;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export { EVENT_ACCESS_COOKIE };

export type EventAccessGrant = {
  id: string; scopeType: "EVENT" | "TASK"; eventId: string | null; eventName: string | null; workerLabel: string;
  entitlements: readonly ModuleEntitlement[]; status: "ACTIVE" | "REDEEMED" | "REVOKED" | "EXPIRED" | "EVENT_CLOSED";
  expiresAt: string; createdAt: string; redeemedAt: string | null; revokedAt: string | null;
  code?: string;
};

function hashSession(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function code(): string {
  const bytes = randomBytes(16);
  const value = Array.from(bytes, (byte) => CODE_ALPHABET[byte & 31]).join("");
  return value.match(/.{1,4}/g)?.join("-") ?? value;
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase().replaceAll(/[^A-Z2-9]/g, "");
}

function assertEntitlements(values: readonly ModuleEntitlement[]): void {
  if (!values.length) throw new Error("Assign at least one temporary-access module.");
  const seen = new Set<string>();
  for (const value of values) {
    if (!ALLOWED_MODULES.includes(value.module as (typeof ALLOWED_MODULES)[number])) throw new Error("Temporary access is limited to Vendor Workspace, Event Ledger, Event Flip, Inventory, and Artwork Review.");
    if (value.access !== "VIEW" && value.access !== "OPERATE") throw new Error("Temporary access cannot grant administration permission.");
    if (seen.has(value.module)) throw new Error("Duplicate temporary-access module assignment.");
    seen.add(value.module);
  }
}

export class EventAccessRepository {
  constructor(private readonly database: DatabaseSync) { this.migrate(); }

  migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_event_access_grant (
        id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, event_id TEXT NOT NULL,
        scope_type TEXT NOT NULL DEFAULT 'EVENT' CHECK(scope_type IN ('EVENT','TASK')),
        worker_label TEXT NOT NULL, entitlements_json TEXT NOT NULL,
        code_hash TEXT NOT NULL, code_salt TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','REDEEMED','REVOKED')),
        expires_at TEXT NOT NULL, created_by_user_id TEXT NOT NULL, created_at TEXT NOT NULL,
        redeemed_at TEXT, revoked_at TEXT, revoked_by_user_id TEXT
      );
      CREATE INDEX IF NOT EXISTS phronesis_event_access_grant_event
        ON phronesis_event_access_grant(workspace_id, event_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS phronesis_event_access_session (
        id TEXT PRIMARY KEY, grant_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT,
        FOREIGN KEY(grant_id) REFERENCES phronesis_event_access_grant(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS phronesis_event_access_attempt (
        bucket_hash TEXT PRIMARY KEY, attempts INTEGER NOT NULL, window_started_at TEXT NOT NULL
      );
    `);
    const columns = this.database.prepare("PRAGMA table_info(phronesis_event_access_grant)").all() as SqlRow[];
    if (!columns.some((column) => column.name === "scope_type")) {
      this.database.exec("ALTER TABLE phronesis_event_access_grant ADD COLUMN scope_type TEXT NOT NULL DEFAULT 'EVENT' CHECK(scope_type IN ('EVENT','TASK'))");
    }
    this.database.exec("CREATE INDEX IF NOT EXISTS phronesis_event_access_grant_scope ON phronesis_event_access_grant(workspace_id, scope_type, created_at DESC)");
  }

  createGrant(input: { workspaceId: string; eventId?: string | null; workerLabel: string; entitlements: readonly ModuleEntitlement[]; durationHours: number; actorUserId: string }, at = new Date()): EventAccessGrant {
    const workerLabel = input.workerLabel.trim();
    if (workerLabel.length < 2 || workerLabel.length > 80) throw new Error("Worker name must contain 2 to 80 characters.");
    if (!Number.isInteger(input.durationHours) || input.durationHours < 1 || input.durationHours > 24) throw new Error("Access duration must be between 1 and 24 hours.");
    assertEntitlements(input.entitlements);
    const eventBound = input.entitlements.some((entitlement) => EVENT_BOUND_MODULES.includes(entitlement.module as (typeof EVENT_BOUND_MODULES)[number]));
    const scopeType = eventBound ? "EVENT" : "TASK";
    const eventId = eventBound ? input.eventId?.trim() ?? "" : "";
    const event = eventBound
      ? this.database.prepare("SELECT id, name, status FROM phronesis_purchase_event WHERE id=? AND workspace_id=?").get(eventId, input.workspaceId) as SqlRow | undefined
      : undefined;
    if (eventBound && (!event || event.status !== "ACTIVE")) throw new Error("An active Event Ledger event is required for transactional access.");
    const plaintext = code();
    const normalized = normalizeCode(plaintext);
    const salt = randomBytes(16).toString("hex");
    const id = randomUUID();
    const expiresAt = new Date(at.getTime() + input.durationHours * 60 * 60 * 1000).toISOString();
    this.database.prepare(`INSERT INTO phronesis_event_access_grant(
      id,workspace_id,event_id,scope_type,worker_label,entitlements_json,code_hash,code_salt,status,expires_at,created_by_user_id,created_at
    ) VALUES(?,?,?,?,?,?,?,?,'ACTIVE',?,?,?)`).run(id, input.workspaceId, eventId, scopeType, workerLabel, JSON.stringify(input.entitlements), scryptSync(normalized, salt, 32).toString("hex"), salt, expiresAt, input.actorUserId, at.toISOString());
    this.audit(input.workspaceId, input.actorUserId, "EVENT_ACCESS_CREATED", id, { scopeType, eventId: eventBound ? eventId : null, workerLabel, entitlements: input.entitlements, expiresAt });
    return { id, scopeType, eventId: eventBound ? eventId : null, eventName: event ? String(event.name) : null, workerLabel, entitlements: input.entitlements, status: "ACTIVE", expiresAt, createdAt: at.toISOString(), redeemedAt: null, revokedAt: null, code: plaintext };
  }

  listGrants(workspaceId: string, at = new Date()): EventAccessGrant[] {
    const rows = this.database.prepare(`SELECT g.*, e.name event_name, e.status event_status FROM phronesis_event_access_grant g LEFT JOIN phronesis_purchase_event e ON e.id=g.event_id WHERE g.workspace_id=? ORDER BY g.created_at DESC`).all(workspaceId) as SqlRow[];
    return rows.map((row) => this.mapGrant(row, at));
  }

  redeem(value: string, bucketHash: string, at = new Date()): { token: string; expiresAt: string; grant: EventAccessGrant } {
    this.assertRateLimit(bucketHash, at);
    const candidate = normalizeCode(value);
    if (candidate.length !== 16) { this.recordAttempt(bucketHash, false, at); throw new Error("Worker access code is invalid or expired."); }
    const rows = this.database.prepare(`SELECT g.*, e.name event_name, e.status event_status FROM phronesis_event_access_grant g LEFT JOIN phronesis_purchase_event e ON e.id=g.event_id WHERE g.status='ACTIVE' AND g.expires_at>? AND (g.scope_type='TASK' OR (g.scope_type='EVENT' AND e.status='ACTIVE'))`).all(at.toISOString()) as SqlRow[];
    const row = rows.find((entry) => {
      const expected = Buffer.from(String(entry.code_hash), "hex");
      const actual = scryptSync(candidate, String(entry.code_salt), 32);
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    });
    if (!row) { this.recordAttempt(bucketHash, false, at); throw new Error("Worker access code is invalid or expired."); }
    const token = randomBytes(32).toString("base64url");
    const sessionId = randomUUID();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const updated = this.database.prepare("UPDATE phronesis_event_access_grant SET status='REDEEMED', redeemed_at=? WHERE id=? AND status='ACTIVE'").run(at.toISOString(), String(row.id));
      if (Number(updated.changes) !== 1) throw new Error("Worker access code is invalid or expired.");
      this.database.prepare("INSERT INTO phronesis_event_access_session(id,grant_id,token_hash,created_at,expires_at) VALUES(?,?,?,?,?)").run(sessionId, String(row.id), hashSession(token), at.toISOString(), String(row.expires_at));
      this.database.exec("COMMIT");
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
    this.recordAttempt(bucketHash, true, at);
    this.audit(String(row.workspace_id), `event-worker:${row.id}`, "EVENT_ACCESS_REDEEMED", String(row.id), { sessionId });
    return { token, expiresAt: String(row.expires_at), grant: { ...this.mapGrant({ ...row, status: "REDEEMED", redeemed_at: at.toISOString() }, at), status: "REDEEMED" } };
  }

  authorize(token: string, module: PhronesisModule, requiredAccess: ModuleAccessLevel, at = new Date()): AuthorizationDecision | null {
    if (!token || token.length > 128) return null;
    const row = this.database.prepare(`SELECT g.*, s.id session_id, s.expires_at session_expires_at, e.status event_status FROM phronesis_event_access_session s JOIN phronesis_event_access_grant g ON g.id=s.grant_id LEFT JOIN phronesis_purchase_event e ON e.id=g.event_id WHERE s.token_hash=? AND s.revoked_at IS NULL`).get(hashSession(token)) as SqlRow | undefined;
    if (!row) return null;
    const assigned = (JSON.parse(String(row.entitlements_json)) as ModuleEntitlement[]).find((entry) => entry.module === module)?.access ?? null;
    const scopeActive = row.scope_type === "TASK" || (row.scope_type === "EVENT" && row.event_status === "ACTIVE");
    const active = row.status === "REDEEMED" && scopeActive && new Date(String(row.expires_at)).getTime() > at.getTime() && new Date(String(row.session_expires_at)).getTime() > at.getTime();
    const allowed = active && assigned !== null && accessSatisfies(assigned, requiredAccess);
    return { allowed, reason: !active ? "UNAUTHENTICATED" : !assigned ? "MODULE_NOT_ASSIGNED" : allowed ? "AUTHORIZED" : "INSUFFICIENT_ACCESS", userId: `event-worker:${row.id}`, workspaceId: String(row.workspace_id), membershipId: null, role: "OPERATOR", module, requiredAccess, assignedAccess: assigned };
  }

  revoke(workspaceId: string, grantId: string, actorUserId: string, at = new Date()): boolean {
    const result = this.database.prepare("UPDATE phronesis_event_access_grant SET status='REVOKED',revoked_at=?,revoked_by_user_id=? WHERE id=? AND workspace_id=? AND status IN ('ACTIVE','REDEEMED')").run(at.toISOString(), actorUserId, grantId, workspaceId);
    if (Number(result.changes)) { this.database.prepare("UPDATE phronesis_event_access_session SET revoked_at=? WHERE grant_id=? AND revoked_at IS NULL").run(at.toISOString(), grantId); this.audit(workspaceId, actorUserId, "EVENT_ACCESS_REVOKED", grantId, {}); }
    return Number(result.changes) === 1;
  }

  revokeSession(token: string, at = new Date()): void { this.database.prepare("UPDATE phronesis_event_access_session SET revoked_at=? WHERE token_hash=? AND revoked_at IS NULL").run(at.toISOString(), hashSession(token)); }

  private mapGrant(row: SqlRow, at: Date): EventAccessGrant {
    const scopeType = row.scope_type === "TASK" ? "TASK" : "EVENT";
    const status = row.status === "REVOKED" ? "REVOKED" : scopeType === "EVENT" && row.event_status !== "ACTIVE" ? "EVENT_CLOSED" : new Date(String(row.expires_at)).getTime() <= at.getTime() ? "EXPIRED" : String(row.status) as "ACTIVE" | "REDEEMED";
    return { id: String(row.id), scopeType, eventId: scopeType === "EVENT" ? String(row.event_id) : null, eventName: scopeType === "EVENT" && row.event_name ? String(row.event_name) : null, workerLabel: String(row.worker_label), entitlements: JSON.parse(String(row.entitlements_json)) as ModuleEntitlement[], status, expiresAt: String(row.expires_at), createdAt: String(row.created_at), redeemedAt: row.redeemed_at ? String(row.redeemed_at) : null, revokedAt: row.revoked_at ? String(row.revoked_at) : null };
  }
  private assertRateLimit(bucket: string, at: Date): void { const row=this.database.prepare("SELECT attempts,window_started_at FROM phronesis_event_access_attempt WHERE bucket_hash=?").get(bucket) as SqlRow|undefined; if(row && at.getTime()-new Date(String(row.window_started_at)).getTime()<15*60_000 && Number(row.attempts)>=10) throw new Error("Too many attempts. Try again later."); }
  private recordAttempt(bucket: string, success: boolean, at: Date): void { if(success){this.database.prepare("DELETE FROM phronesis_event_access_attempt WHERE bucket_hash=?").run(bucket);return;} const row=this.database.prepare("SELECT attempts,window_started_at FROM phronesis_event_access_attempt WHERE bucket_hash=?").get(bucket) as SqlRow|undefined; const within=!!row&&at.getTime()-new Date(String(row.window_started_at)).getTime()<15*60_000; this.database.prepare("INSERT INTO phronesis_event_access_attempt(bucket_hash,attempts,window_started_at) VALUES(?,?,?) ON CONFLICT(bucket_hash) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at").run(bucket,within?Number(row?.attempts)+1:1,within?String(row?.window_started_at):at.toISOString()); }
  private audit(workspaceId:string, actor:string, action:string, id:string, details:unknown):void { this.database.prepare("INSERT INTO phronesis_authorization_audit(id,workspace_id,actor_user_id,action,resource_type,resource_id,details_json,created_at) VALUES(?,?,?,?,?,?,?,?)").run(randomUUID(),workspaceId,actor,action,"EVENT_ACCESS_GRANT",id,JSON.stringify(details),new Date().toISOString()); }
}
