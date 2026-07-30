import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  accessSatisfies,
  defaultEntitlementsForRole,
  MEMBERSHIP_ROLES,
  MODULE_ACCESS_LEVELS,
  PHRONESIS_MODULES,
  type AuthorizationDecision,
  type MembershipRole,
  type ModuleAccessLevel,
  type ModuleEntitlement,
  type PhronesisModule,
} from "@/lib/auth/domain";

type SqlRow = Record<string, string | number | null>;

export type InvitationRecord = {
  id: string;
  workspaceId: string;
  email: string;
  role: MembershipRole;
  entitlements: readonly ModuleEntitlement[];
  expiresAt: string;
};

export type MembershipProfile = {
  id: string;
  workspaceId: string;
  role: MembershipRole;
  status: "ACTIVE" | "DISABLED";
  entitlements: readonly ModuleEntitlement[];
};

export type MemberDirectoryEntry = MembershipProfile & {
  userId: string;
  name: string | null;
  email: string | null;
};

function normalizeEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("A valid invitation email is required.");
  }
  return normalized;
}

function assertRole(role: string): asserts role is MembershipRole {
  if (!MEMBERSHIP_ROLES.includes(role as MembershipRole)) throw new Error(`Unknown role: ${role}`);
}

function assertEntitlements(entitlements: readonly ModuleEntitlement[]): void {
  const seen = new Set<PhronesisModule>();
  for (const entitlement of entitlements) {
    if (!PHRONESIS_MODULES.includes(entitlement.module)) throw new Error(`Unknown module: ${entitlement.module}`);
    if (!MODULE_ACCESS_LEVELS.includes(entitlement.access)) throw new Error(`Unknown access: ${entitlement.access}`);
    if (seen.has(entitlement.module)) throw new Error(`Duplicate module entitlement: ${entitlement.module}`);
    seen.add(entitlement.module);
  }
}

export class AuthorizationRepository {
  readonly database: DatabaseSync;
  private readonly ownsDatabase: boolean;

  constructor(database: DatabaseSync | string = ":memory:") {
    if (typeof database === "string") {
      if (database !== ":memory:") mkdirSync(dirname(database), { recursive: true });
      this.database = new DatabaseSync(database);
      this.ownsDatabase = true;
    } else {
      this.database = database;
      this.ownsDatabase = false;
    }
    this.database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
    this.migrate();
  }

  close(): void {
    if (this.ownsDatabase) this.database.close();
  }

  migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_workspace (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS phronesis_membership (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('OWNER','ADMIN','OPERATOR','VIEWER')),
        status TEXT NOT NULL CHECK(status IN ('ACTIVE','DISABLED')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(workspace_id, user_id),
        FOREIGN KEY(workspace_id) REFERENCES phronesis_workspace(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS phronesis_membership_user
        ON phronesis_membership(user_id, status);
      CREATE TABLE IF NOT EXISTS phronesis_entitlement (
        membership_id TEXT NOT NULL,
        module TEXT NOT NULL CHECK(module IN ('VENDOR_WORKSPACE','MARKET_WATCH','INVENTORY','PRICING_OPERATIONS','INTELLIGENCE','ADMINISTRATION')),
        access TEXT NOT NULL CHECK(access IN ('VIEW','OPERATE','ADMIN')),
        updated_at TEXT NOT NULL,
        PRIMARY KEY(membership_id, module),
        FOREIGN KEY(membership_id) REFERENCES phronesis_membership(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS phronesis_invitation (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('OWNER','ADMIN','OPERATOR','VIEWER')),
        entitlements_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING','ACCEPTED','REVOKED','EXPIRED')),
        invited_by_user_id TEXT,
        accepted_by_user_id TEXT,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        accepted_at TEXT,
        FOREIGN KEY(workspace_id) REFERENCES phronesis_workspace(id) ON DELETE CASCADE
      );
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_pending_invitation_email
        ON phronesis_invitation(workspace_id, email) WHERE status = 'PENDING';
      CREATE TABLE IF NOT EXISTS phronesis_authorization_audit (
        id TEXT PRIMARY KEY,
        workspace_id TEXT,
        actor_user_id TEXT,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS phronesis_authorization_audit_time
        ON phronesis_authorization_audit(created_at DESC);
    `);
  }

  ensureWorkspace(name = "Phronesis", slug = "phronesis"): string {
    const current = this.database.prepare("SELECT id FROM phronesis_workspace WHERE slug = ?").get(slug) as SqlRow | undefined;
    if (current) return String(current.id);
    const id = randomUUID();
    const now = new Date().toISOString();
    this.database.prepare(
      "INSERT INTO phronesis_workspace(id, slug, name, created_at, updated_at) VALUES(?, ?, ?, ?, ?)",
    ).run(id, slug, name, now, now);
    return id;
  }

  createInvitation(input: {
    email: string;
    role: MembershipRole;
    entitlements?: readonly ModuleEntitlement[];
    actorUserId?: string | null;
    expiresAt?: Date;
    workspaceId?: string;
  }): InvitationRecord {
    assertRole(input.role);
    const email = normalizeEmail(input.email);
    const workspaceId = input.workspaceId ?? this.ensureWorkspace();
    if (input.actorUserId) {
      const actor = this.authorize(input.actorUserId, "ADMINISTRATION", "ADMIN");
      if (!actor.allowed || actor.workspaceId !== workspaceId) {
        throw new Error("Administration permission is required in the invitation workspace.");
      }
    }
    const entitlements = input.entitlements ?? defaultEntitlementsForRole(input.role);
    assertEntitlements(entitlements);
    const expiresAt = input.expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (expiresAt.getTime() <= Date.now()) throw new Error("Invitation expiry must be in the future.");
    const id = randomUUID();
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(
        "UPDATE phronesis_invitation SET status = 'REVOKED' WHERE workspace_id = ? AND email = ? AND status = 'PENDING'",
      ).run(workspaceId, email);
      this.database.prepare(`
        INSERT INTO phronesis_invitation(
          id, workspace_id, email, role, entitlements_json, status,
          invited_by_user_id, expires_at, created_at
        ) VALUES(?, ?, ?, ?, ?, 'PENDING', ?, ?, ?)
      `).run(
        id,
        workspaceId,
        email,
        input.role,
        JSON.stringify(entitlements),
        input.actorUserId ?? null,
        expiresAt.toISOString(),
        now,
      );
      this.insertAudit({
        workspaceId,
        actorUserId: input.actorUserId ?? null,
        action: "INVITATION_CREATED",
        resourceType: "INVITATION",
        resourceId: id,
        details: { email, role: input.role, entitlements },
      });
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return { id, workspaceId, email, role: input.role, entitlements, expiresAt: expiresAt.toISOString() };
  }

  findPendingInvitation(email: string, at = new Date()): InvitationRecord | null {
    const normalized = normalizeEmail(email);
    this.database.prepare(
      "UPDATE phronesis_invitation SET status = 'EXPIRED' WHERE status = 'PENDING' AND expires_at <= ?",
    ).run(at.toISOString());
    const row = this.database.prepare(`
      SELECT id, workspace_id, email, role, entitlements_json, expires_at
      FROM phronesis_invitation
      WHERE email = ? AND status = 'PENDING' AND expires_at > ?
      ORDER BY created_at DESC LIMIT 1
    `).get(normalized, at.toISOString()) as SqlRow | undefined;
    if (!row) return null;
    const role = String(row.role);
    assertRole(role);
    const entitlements = JSON.parse(String(row.entitlements_json)) as ModuleEntitlement[];
    assertEntitlements(entitlements);
    return {
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      email: String(row.email),
      role,
      entitlements,
      expiresAt: String(row.expires_at),
    };
  }

  provisionInvitedUser(email: string, userId: string): MembershipProfile {
    const invitation = this.findPendingInvitation(email);
    if (!invitation) throw new Error("This identity has no active Phronesis invitation.");
    const now = new Date().toISOString();
    const membershipId = randomUUID();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        INSERT INTO phronesis_membership(id, workspace_id, user_id, role, status, created_at, updated_at)
        VALUES(?, ?, ?, ?, 'ACTIVE', ?, ?)
        ON CONFLICT(workspace_id, user_id) DO UPDATE SET
          role = excluded.role, status = 'ACTIVE', updated_at = excluded.updated_at
      `).run(membershipId, invitation.workspaceId, userId, invitation.role, now, now);
      const membership = this.database.prepare(
        "SELECT id FROM phronesis_membership WHERE workspace_id = ? AND user_id = ?",
      ).get(invitation.workspaceId, userId) as SqlRow;
      const actualMembershipId = String(membership.id);
      this.database.prepare("DELETE FROM phronesis_entitlement WHERE membership_id = ?").run(actualMembershipId);
      const insertEntitlement = this.database.prepare(
        "INSERT INTO phronesis_entitlement(membership_id, module, access, updated_at) VALUES(?, ?, ?, ?)",
      );
      for (const entitlement of invitation.entitlements) {
        insertEntitlement.run(actualMembershipId, entitlement.module, entitlement.access, now);
      }
      const accepted = this.database.prepare(`
        UPDATE phronesis_invitation
        SET status = 'ACCEPTED', accepted_by_user_id = ?, accepted_at = ?
        WHERE id = ? AND status = 'PENDING'
      `).run(userId, now, invitation.id);
      if (Number(accepted.changes) !== 1) throw new Error("Invitation was already consumed.");
      this.insertAudit({
        workspaceId: invitation.workspaceId,
        actorUserId: userId,
        action: "INVITATION_ACCEPTED",
        resourceType: "MEMBERSHIP",
        resourceId: actualMembershipId,
        details: { invitationId: invitation.id, role: invitation.role },
      });
      this.database.exec("COMMIT");
      return {
        id: actualMembershipId,
        workspaceId: invitation.workspaceId,
        role: invitation.role,
        status: "ACTIVE",
        entitlements: invitation.entitlements,
      };
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  getMembershipProfile(userId: string): MembershipProfile | null {
    const row = this.database.prepare(`
      SELECT id, workspace_id, role, status
      FROM phronesis_membership
      WHERE user_id = ? ORDER BY created_at LIMIT 1
    `).get(userId) as SqlRow | undefined;
    if (!row) return null;
    const role = String(row.role);
    assertRole(role);
    const status = String(row.status);
    if (status !== "ACTIVE" && status !== "DISABLED") throw new Error(`Unknown membership status: ${status}`);
    const entitlements = this.database.prepare(`
      SELECT module, access FROM phronesis_entitlement
      WHERE membership_id = ? ORDER BY module
    `).all(String(row.id)) as SqlRow[];
    return {
      id: String(row.id),
      workspaceId: String(row.workspace_id),
      role,
      status,
      entitlements: entitlements.map((entry) => ({
        module: String(entry.module) as PhronesisModule,
        access: String(entry.access) as ModuleAccessLevel,
      })),
    };
  }

  listMemberships(actorUserId: string): readonly MemberDirectoryEntry[] {
    const actor = this.authorize(actorUserId, "ADMINISTRATION", "VIEW");
    if (!actor.allowed || !actor.workspaceId) throw new Error("Administration permission is required.");
    const rows = this.database.prepare(`
      SELECT id, user_id FROM phronesis_membership
      WHERE workspace_id = ? ORDER BY created_at
    `).all(actor.workspaceId) as SqlRow[];
    const hasAuthUsers = Boolean(this.database.prepare(
      "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user'",
    ).get());
    return rows.map((row) => {
      const profile = this.getMembershipProfile(String(row.user_id));
      if (!profile) throw new Error("Membership disappeared during listing.");
      const identity = hasAuthUsers
        ? this.database.prepare("SELECT name, email FROM user WHERE id = ?").get(String(row.user_id)) as SqlRow | undefined
        : undefined;
      return {
        ...profile,
        userId: String(row.user_id),
        name: identity?.name ? String(identity.name) : null,
        email: identity?.email ? String(identity.email) : null,
      };
    });
  }

  authorize(userId: string, module: PhronesisModule, requiredAccess: ModuleAccessLevel): AuthorizationDecision {
    const profile = this.getMembershipProfile(userId);
    const base = { userId, module, requiredAccess };
    if (!profile || profile.status !== "ACTIVE") {
      return {
        ...base,
        allowed: false,
        reason: "NO_ACTIVE_MEMBERSHIP",
        workspaceId: profile?.workspaceId ?? null,
        membershipId: profile?.id ?? null,
        role: profile?.role ?? null,
        assignedAccess: null,
      };
    }
    const entitlement = profile.entitlements.find((candidate) => candidate.module === module);
    if (!entitlement) {
      return {
        ...base,
        allowed: false,
        reason: "MODULE_NOT_ASSIGNED",
        workspaceId: profile.workspaceId,
        membershipId: profile.id,
        role: profile.role,
        assignedAccess: null,
      };
    }
    const allowed = accessSatisfies(entitlement.access, requiredAccess);
    return {
      ...base,
      allowed,
      reason: allowed ? "AUTHORIZED" : "INSUFFICIENT_ACCESS",
      workspaceId: profile.workspaceId,
      membershipId: profile.id,
      role: profile.role,
      assignedAccess: entitlement.access,
    };
  }

  setEntitlements(input: {
    actorUserId: string;
    membershipId: string;
    entitlements: readonly ModuleEntitlement[];
  }): void {
    assertEntitlements(input.entitlements);
    const actor = this.authorize(input.actorUserId, "ADMINISTRATION", "ADMIN");
    if (!actor.allowed) throw new Error("Administration permission is required.");
    const target = this.database.prepare(
      "SELECT workspace_id FROM phronesis_membership WHERE id = ?",
    ).get(input.membershipId) as SqlRow | undefined;
    if (!target || String(target.workspace_id) !== actor.workspaceId) throw new Error("Membership is outside the actor workspace.");
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare("DELETE FROM phronesis_entitlement WHERE membership_id = ?").run(input.membershipId);
      const insert = this.database.prepare(
        "INSERT INTO phronesis_entitlement(membership_id, module, access, updated_at) VALUES(?, ?, ?, ?)",
      );
      for (const entitlement of input.entitlements) {
        insert.run(input.membershipId, entitlement.module, entitlement.access, now);
      }
      this.insertAudit({
        workspaceId: actor.workspaceId,
        actorUserId: input.actorUserId,
        action: "ENTITLEMENTS_REPLACED",
        resourceType: "MEMBERSHIP",
        resourceId: input.membershipId,
        details: { entitlements: input.entitlements },
      });
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  disableMembership(actorUserId: string, membershipId: string): void {
    const actor = this.authorize(actorUserId, "ADMINISTRATION", "ADMIN");
    if (!actor.allowed) throw new Error("Administration permission is required.");
    const target = this.database.prepare(
      "SELECT workspace_id, role FROM phronesis_membership WHERE id = ?",
    ).get(membershipId) as SqlRow | undefined;
    if (!target || String(target.workspace_id) !== actor.workspaceId) throw new Error("Membership is outside the actor workspace.");
    if (String(target.role) === "OWNER") throw new Error("The owner membership cannot be disabled through this operation.");
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(
        "UPDATE phronesis_membership SET status = 'DISABLED', updated_at = ? WHERE id = ?",
      ).run(now, membershipId);
      this.insertAudit({
        workspaceId: actor.workspaceId,
        actorUserId,
        action: "MEMBERSHIP_DISABLED",
        resourceType: "MEMBERSHIP",
        resourceId: membershipId,
        details: {},
      });
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  auditCount(): number {
    const row = this.database.prepare("SELECT COUNT(*) AS count FROM phronesis_authorization_audit").get() as SqlRow;
    return Number(row.count);
  }

  private insertAudit(input: {
    workspaceId: string | null;
    actorUserId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    details: Record<string, unknown>;
  }): void {
    this.database.prepare(`
      INSERT INTO phronesis_authorization_audit(
        id, workspace_id, actor_user_id, action, resource_type, resource_id, details_json, created_at
      ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      randomUUID(),
      input.workspaceId,
      input.actorUserId,
      input.action,
      input.resourceType,
      input.resourceId,
      JSON.stringify(input.details),
      new Date().toISOString(),
    );
  }
}
