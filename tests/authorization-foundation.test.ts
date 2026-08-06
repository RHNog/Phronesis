import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { AuthorizationRepository } from "../lib/auth/AuthorizationRepository.ts";
import { getAuthMode, getAuthRuntimeStatus } from "../lib/auth/config.ts";
import { navigationForModules } from "../lib/navigation/ProductNavigation.ts";

test("owner bootstrap invitation provisions one active fully entitled membership", () => {
  const repository = new AuthorizationRepository();
  const invitation = repository.createInvitation({
    email: "Owner@Example.com",
    role: "OWNER",
  });
  assert.equal(invitation.email, "owner@example.com");

  const membership = repository.provisionInvitedUser(
    "owner@example.com",
    "user-owner",
  );
  assert.equal(membership.role, "OWNER");
  assert.equal(membership.status, "ACTIVE");
  assert.equal(membership.entitlements.length, 9);
  assert.equal(
    repository.authorize("user-owner", "ADMINISTRATION", "ADMIN").allowed,
    true,
  );
  assert.equal(repository.auditCount(), 2);
  repository.close();
});

test("an uninvited identity cannot be provisioned", () => {
  const repository = new AuthorizationRepository();
  assert.throws(
    () =>
      repository.provisionInvitedUser("unknown@example.com", "user-unknown"),
    /no active Phronesis invitation/i,
  );
  assert.equal(repository.getMembershipProfile("user-unknown"), null);
  repository.close();
});

test("role defaults remain coarse while explicit module entitlements are authoritative", () => {
  const repository = new AuthorizationRepository();
  repository.createInvitation({
    email: "operator@example.com",
    role: "OPERATOR",
  });
  repository.provisionInvitedUser("operator@example.com", "user-operator");

  assert.equal(
    repository.authorize("user-operator", "VENDOR_WORKSPACE", "OPERATE")
      .allowed,
    true,
  );
  assert.equal(
    repository.authorize("user-operator", "PRICING_OPERATIONS", "OPERATE")
      .reason,
    "INSUFFICIENT_ACCESS",
  );
  assert.equal(
    repository.authorize("user-operator", "ADMINISTRATION", "VIEW").reason,
    "MODULE_NOT_ASSIGNED",
  );
  assert.equal(
    repository.authorize("user-operator", "ARTWORK_REVIEW", "VIEW").reason,
    "MODULE_NOT_ASSIGNED",
  );
  repository.close();
});

test("an owner can replace another membership entitlements and the next decision changes", () => {
  const repository = new AuthorizationRepository();
  repository.createInvitation({ email: "owner@example.com", role: "OWNER" });
  repository.provisionInvitedUser("owner@example.com", "user-owner");
  const viewerInvitation = repository.createInvitation({
    email: "viewer@example.com",
    role: "VIEWER",
    actorUserId: "user-owner",
  });
  const viewer = repository.provisionInvitedUser(
    viewerInvitation.email,
    "user-viewer",
  );

  assert.equal(
    repository.authorize("user-viewer", "MARKET_WATCH", "VIEW").allowed,
    true,
  );
  repository.setEntitlements({
    actorUserId: "user-owner",
    membershipId: viewer.id,
    entitlements: [{ module: "INTELLIGENCE", access: "VIEW" }],
  });
  assert.equal(
    repository.authorize("user-viewer", "MARKET_WATCH", "VIEW").reason,
    "MODULE_NOT_ASSIGNED",
  );
  assert.equal(
    repository.authorize("user-viewer", "INTELLIGENCE", "VIEW").allowed,
    true,
  );
  assert.equal(repository.auditCount(), 5);
  repository.close();
});

test("module assignments filter navigation with independent event surfaces", () => {
  const items = navigationForModules(["VENDOR_WORKSPACE", "EVENT_FLIP", "MARKET_WATCH"]);
  assert.deepEqual(
    items.map((item) => item.id),
    ["dashboard", "vendor-workspace", "event-flip", "market-watch"],
  );
  assert.deepEqual(
    items.map((item) => item.href),
    ["/", "/vendor", "/event-flip", "/watchlists"],
  );
});

test("legacy employee access migrates to independent event permissions", () => {
  const database = new DatabaseSync(":memory:");
  const initial = new AuthorizationRepository(database);
  initial.createInvitation({
    email: "legacy@example.com",
    role: "OPERATOR",
    entitlements: [
      { module: "VENDOR_WORKSPACE", access: "OPERATE" },
      { module: "INVENTORY", access: "VIEW" },
    ],
  });
  const membership = initial.provisionInvitedUser("legacy@example.com", "legacy-user");
  database.exec(`
    ALTER TABLE phronesis_entitlement RENAME TO phronesis_entitlement_current;
    CREATE TABLE phronesis_entitlement (
      membership_id TEXT NOT NULL,
      module TEXT NOT NULL CHECK(module IN ('VENDOR_WORKSPACE','MARKET_WATCH','INVENTORY','PRICING_OPERATIONS','INTELLIGENCE','ADMINISTRATION')),
      access TEXT NOT NULL CHECK(access IN ('VIEW','OPERATE','ADMIN')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY(membership_id,module),
      FOREIGN KEY(membership_id) REFERENCES phronesis_membership(id) ON DELETE CASCADE
    );
    INSERT INTO phronesis_entitlement SELECT membership_id,module,access,updated_at
      FROM phronesis_entitlement_current WHERE module NOT IN ('EVENT_LEDGER','EVENT_FLIP');
    DROP TABLE phronesis_entitlement_current;
  `);
  const migrated = new AuthorizationRepository(database);
  assert.equal(migrated.authorize("legacy-user", "EVENT_LEDGER", "OPERATE").allowed, true);
  assert.equal(migrated.authorize("legacy-user", "EVENT_FLIP", "VIEW").allowed, true);
  assert.equal(migrated.authorize("legacy-user", "ARTWORK_REVIEW", "VIEW").reason, "MODULE_NOT_ASSIGNED");
  assert.equal(migrated.getMembershipProfile("legacy-user")?.id, membership.id);
  database.close();
});

test("existing owners and admins receive Artwork Review admin during module migration", () => {
  const database = new DatabaseSync(":memory:");
  const initial = new AuthorizationRepository(database);
  initial.createInvitation({ email: "owner@example.com", role: "OWNER" });
  initial.provisionInvitedUser("owner@example.com", "owner-user");
  database.exec(`
    ALTER TABLE phronesis_entitlement RENAME TO phronesis_entitlement_current;
    CREATE TABLE phronesis_entitlement (
      membership_id TEXT NOT NULL,
      module TEXT NOT NULL CHECK(module IN ('VENDOR_WORKSPACE','EVENT_LEDGER','EVENT_FLIP','MARKET_WATCH','INVENTORY','PRICING_OPERATIONS','INTELLIGENCE','ADMINISTRATION')),
      access TEXT NOT NULL CHECK(access IN ('VIEW','OPERATE','ADMIN')),
      updated_at TEXT NOT NULL,
      PRIMARY KEY(membership_id,module),
      FOREIGN KEY(membership_id) REFERENCES phronesis_membership(id) ON DELETE CASCADE
    );
    INSERT INTO phronesis_entitlement SELECT membership_id,module,access,updated_at
      FROM phronesis_entitlement_current WHERE module != 'ARTWORK_REVIEW';
    DROP TABLE phronesis_entitlement_current;
  `);
  const migrated = new AuthorizationRepository(database);
  assert.equal(migrated.authorize("owner-user", "ARTWORK_REVIEW", "ADMIN").allowed, true);
  database.close();
});

test("auth rollout defaults to disabled and email/password readiness does not require GitHub", () => {
  assert.equal(getAuthMode({}), "DISABLED");
  assert.equal(getAuthMode({ PHRONESIS_AUTH_MODE: "required" }), "REQUIRED");
  assert.equal(
    getAuthRuntimeStatus({ PHRONESIS_AUTH_MODE: "REQUIRED" })
      .readyForRequiredMode,
    false,
  );
  assert.equal(
    getAuthRuntimeStatus({
      PHRONESIS_AUTH_MODE: "REQUIRED",
      BETTER_AUTH_URL: "https://private.example",
      BETTER_AUTH_SECRET: "not-logged-test-secret",
    }).readyForRequiredMode,
    true,
  );
  assert.equal(getAuthRuntimeStatus({}).emailPasswordEnabled, true);
  assert.equal(getAuthRuntimeStatus({}).githubConfigured, false);
});

test("self-registration stays pending and owner approval grants only selected modules", () => {
  const repository = new AuthorizationRepository();
  repository.createInvitation({ email: "owner@example.com", role: "OWNER" });
  repository.provisionInvitedUser("owner@example.com", "owner-user");

  const request = repository.requestAccess({
    userId: "trusted-user",
    email: "Trusted@Example.com",
    name: "Trusted Person",
    now: new Date("2026-08-06T12:00:00.000Z"),
  });
  assert.equal(request?.status, "PENDING");
  assert.equal(request?.email, "trusted@example.com");
  assert.equal(repository.getMembershipProfile("trusted-user"), null);
  assert.equal(repository.authorize("trusted-user", "VENDOR_WORKSPACE", "VIEW").reason, "NO_ACTIVE_MEMBERSHIP");
  assert.deepEqual(repository.listAccessRequests("owner-user").map((entry) => entry.id), [request?.id]);

  const membership = repository.approveAccessRequest({
    actorUserId: "owner-user",
    requestId: request?.id as string,
    role: "VIEWER",
    entitlements: [{ module: "ARTWORK_REVIEW", access: "VIEW" }],
  });
  assert.deepEqual(membership.entitlements, [{ module: "ARTWORK_REVIEW", access: "VIEW" }]);
  assert.equal(repository.authorize("trusted-user", "ARTWORK_REVIEW", "VIEW").allowed, true);
  assert.equal(repository.authorize("trusted-user", "VENDOR_WORKSPACE", "VIEW").reason, "MODULE_NOT_ASSIGNED");
  assert.equal(repository.getAccessRequest("trusted-user")?.status, "APPROVED");
  repository.close();
});

test("access requests reject unsafe approval and rejection creates no membership", () => {
  const repository = new AuthorizationRepository();
  repository.createInvitation({ email: "owner@example.com", role: "OWNER" });
  repository.provisionInvitedUser("owner@example.com", "owner-user");
  const request = repository.requestAccess({ userId: "pending-user", email: "pending@example.com" });
  assert.ok(request);
  assert.throws(() => repository.approveAccessRequest({ actorUserId: "owner-user", requestId: request.id, role: "OWNER", entitlements: [{ module: "INTELLIGENCE", access: "VIEW" }] }), /cannot create another owner/i);
  assert.throws(() => repository.approveAccessRequest({ actorUserId: "owner-user", requestId: request.id, role: "VIEWER", entitlements: [] }), /at least one module/i);
  repository.rejectAccessRequest({ actorUserId: "owner-user", requestId: request.id });
  assert.equal(repository.getAccessRequest("pending-user")?.status, "REJECTED");
  assert.equal(repository.getMembershipProfile("pending-user"), null);
  assert.throws(() => repository.rejectAccessRequest({ actorUserId: "owner-user", requestId: request.id }), /no longer pending/i);
  repository.close();
});

test("repeat access request refreshes identity details without duplicate audit", () => {
  const repository = new AuthorizationRepository();
  const first = repository.requestAccess({ userId: "pending-user", email: "first@example.com", name: "First" });
  const count = repository.auditCount();
  const second = repository.requestAccess({ userId: "pending-user", email: "second@example.com", name: "Second" });
  assert.equal(second?.id, first?.id);
  assert.equal(second?.email, "second@example.com");
  assert.equal(repository.auditCount(), count);
  repository.close();
});
