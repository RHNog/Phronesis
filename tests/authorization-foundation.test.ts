import assert from "node:assert/strict";
import test from "node:test";
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
  assert.equal(membership.entitlements.length, 6);
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

test("module assignments filter navigation without changing route ownership", () => {
  const items = navigationForModules(["VENDOR_WORKSPACE", "MARKET_WATCH"]);
  assert.deepEqual(
    items.map((item) => item.id),
    ["vendor-workspace", "event-ledger", "market-watch"],
  );
  assert.deepEqual(
    items.map((item) => item.href),
    ["/vendor", "/event-ledger", "/watchlists"],
  );
});

test("auth rollout defaults to disabled and required readiness needs every server secret", () => {
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
      GITHUB_CLIENT_ID: "client",
      GITHUB_CLIENT_SECRET: "secret",
    }).readyForRequiredMode,
    true,
  );
});
