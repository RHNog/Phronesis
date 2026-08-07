import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { AuthorizationRepository } from "../lib/auth/AuthorizationRepository.ts";
import { EventAccessRepository } from "../lib/auth/EventAccessRepository.ts";

function addActiveEvent(database: DatabaseSync, workspaceId: string): void {
  database.exec(`
    CREATE TABLE phronesis_purchase_event(
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      event_date TEXT,
      created_at TEXT
    );
  `);
  database.prepare(
    "INSERT INTO phronesis_purchase_event VALUES(?, ?, ?, 'ACTIVE', ?, ?)",
  ).run(
    "event-live",
    workspaceId,
    "Ongoing Card Show",
    "2026-08-06",
    "2026-08-06T13:00:00.000Z",
  );
}

test("an approved account can gain Event Ledger access during an active event on its next request", () => {
  const database = new DatabaseSync(":memory:");
  const authorization = new AuthorizationRepository(database);
  const ownerInvitation = authorization.createInvitation({
    email: "owner@example.com",
    role: "OWNER",
  });
  const owner = authorization.provisionInvitedUser(
    ownerInvitation.email,
    "owner-user",
  );
  addActiveEvent(database, owner.workspaceId);

  const workerInvitation = authorization.createInvitation({
    email: "trusted@example.com",
    role: "OPERATOR",
    actorUserId: "owner-user",
    workspaceId: owner.workspaceId,
    entitlements: [{ module: "ARTWORK_REVIEW", access: "OPERATE" }],
  });
  const worker = authorization.provisionInvitedUser(
    workerInvitation.email,
    "trusted-user",
  );

  assert.equal(
    authorization.authorize("trusted-user", "EVENT_LEDGER", "VIEW").reason,
    "MODULE_NOT_ASSIGNED",
  );
  authorization.setEntitlements({
    actorUserId: "owner-user",
    membershipId: worker.id,
    entitlements: [
      { module: "ARTWORK_REVIEW", access: "OPERATE" },
      { module: "EVENT_LEDGER", access: "OPERATE" },
    ],
  });
  assert.equal(
    authorization.authorize("trusted-user", "EVENT_LEDGER", "OPERATE").allowed,
    true,
  );
  assert.equal(
    authorization.authorize("trusted-user", "ARTWORK_REVIEW", "OPERATE").allowed,
    true,
  );
  authorization.close();
});

test("a post-opening temporary worker is limited to the active Event Ledger and loses access at close", () => {
  const database = new DatabaseSync(":memory:");
  const authorization = new AuthorizationRepository(database);
  const workspaceId = authorization.ensureWorkspace();
  addActiveEvent(database, workspaceId);
  const eventAccess = new EventAccessRepository(database);
  const now = new Date("2026-08-06T16:00:00.000Z");
  const grant = eventAccess.createGrant({
    workspaceId,
    eventId: "event-live",
    workerLabel: "Front counter — Ana",
    durationHours: 8,
    actorUserId: "owner-user",
    entitlements: [{ module: "EVENT_LEDGER", access: "OPERATE" }],
  }, now);
  const session = eventAccess.redeem(grant.code!, "front-counter", now);

  assert.equal(
    eventAccess.authorize(session.token, "EVENT_LEDGER", "OPERATE", now)?.allowed,
    true,
  );
  assert.equal(
    eventAccess.authorize(session.token, "INVENTORY", "VIEW", now)?.reason,
    "MODULE_NOT_ASSIGNED",
  );
  database.prepare(
    "UPDATE phronesis_purchase_event SET status='CLOSED' WHERE id='event-live'",
  ).run();
  assert.equal(
    eventAccess.authorize(session.token, "EVENT_LEDGER", "VIEW", now)?.allowed,
    false,
  );
  authorization.close();
});

test("the active ledger exposes truthful account and event-worker controls", () => {
  const page = readFileSync(
    new URL("../app/event-ledger/page.tsx", import.meta.url),
    "utf8",
  );
  const workspace = readFileSync(
    new URL("../features/events/EventLedgerWorkspace.tsx", import.meta.url),
    "utf8",
  );
  const team = readFileSync(
    new URL("../features/events/OngoingEventTeamAccess.tsx", import.meta.url),
    "utf8",
  );
  const temporary = readFileSync(
    new URL("../components/auth/EventAccessManagement.tsx", import.meta.url),
    "utf8",
  );
  const permanent = readFileSync(
    new URL("../components/auth/AccessManagement.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /"ADMINISTRATION",\s*"ADMIN"/);
  assert.match(page, /eventTeamAuthorization\.membershipId/);
  assert.match(workspace, /event\.status === "ACTIVE" && !viewingPastReport/);
  assert.match(team, /href="\/settings\?panel=people"/);
  assert.match(team, /href="\/sign-in\?callbackURL=%2Fevent-ledger"/);
  assert.match(team, /variant="EVENT_LEDGER"/);
  assert.match(team, /aria-expanded=\{temporaryOpen\}/);
  assert.match(temporary, /module: "EVENT_LEDGER", access: "OPERATE"/);
  assert.match(temporary, /grant\.eventId === event\.id/);
  assert.match(temporary, /grant\.entitlements\.length === 1/);
  assert.match(permanent, /Event Ledger only/);
  assert.match(permanent, /Add Event Ledger/);
  assert.match(permanent, /entitlementSelection\(member\.entitlements\)/);
  assert.match(permanent, /savedValues\.EVENT_LEDGER === "ADMIN"/);
  assert.match(permanent, /await save\(nextValues\)/);
  assert.match(permanent, /next request/);
});
