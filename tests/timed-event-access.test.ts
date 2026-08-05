import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { AuthorizationRepository } from "../lib/auth/AuthorizationRepository.ts";
import { EventAccessRepository } from "../lib/auth/EventAccessRepository.ts";
import {
  eventAccessCookieLifetime,
  eventAccessDestination,
  eventAccessToken,
} from "../lib/auth/EventAccessSession.ts";
import { readFileSync } from "node:fs";

function fixture() {
  const database = new DatabaseSync(":memory:");
  const authorization = new AuthorizationRepository(database);
  const workspaceId = authorization.ensureWorkspace();
  database.exec(`CREATE TABLE phronesis_purchase_event(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,name TEXT NOT NULL,status TEXT NOT NULL,event_date TEXT,created_at TEXT);`);
  database.prepare("INSERT INTO phronesis_purchase_event VALUES(?,?,?,?,?,?)").run("event-1",workspaceId,"Miami Regional","ACTIVE","2026-07-31",new Date().toISOString());
  return { database, workspaceId, repository: new EventAccessRepository(database) };
}

test("event code is single use and creates scoped authorization", () => {
  const { repository, workspaceId } = fixture();
  const now = new Date("2026-08-04T12:00:00Z");
  const grant = repository.createGrant({ workspaceId,eventId:"event-1",workerLabel:"Front case",durationHours:12,actorUserId:"owner",entitlements:[{module:"VENDOR_WORKSPACE",access:"OPERATE"}] }, now);
  assert.match(grant.code!, /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/);
  const session = repository.redeem(grant.code!, "client", now);
  assert.equal(repository.authorize(session.token,"VENDOR_WORKSPACE","OPERATE",now)?.allowed,true);
  assert.equal(repository.authorize(session.token,"INVENTORY","VIEW",now)?.reason,"MODULE_NOT_ASSIGNED");
  assert.equal(repository.authorize(session.token,"ADMINISTRATION","VIEW",now)?.allowed,false);
  const resumed = repository.resumeSession(session.token, new Date("2026-08-04T18:00:00Z"));
  assert.equal(resumed?.grant.id, grant.id);
  assert.equal(resumed?.expiresAt, grant.expiresAt);
  assert.throws(()=>repository.redeem(grant.code!,"other",now),/invalid or expired/i);
  assert.equal(repository.resumeSession(session.token, new Date("2026-08-05T00:00:01Z")), null);
});

test("worker cookie persistence and resume destination are bounded by grant expiry", () => {
  const now = new Date("2026-08-04T12:00:00Z");
  const lifetime = eventAccessCookieLifetime("2026-08-04T17:30:00Z", now);
  assert.equal(lifetime.expires.toISOString(), "2026-08-04T17:30:00.000Z");
  assert.equal(lifetime.maxAge, 19_800);
  assert.equal(
    eventAccessDestination([{ module: "ARTWORK_REVIEW", access: "OPERATE" }]),
    "/artwork-review",
  );
  assert.equal(
    eventAccessToken(new Headers({ cookie: "other=1; phronesis-event-access=abc%2F123" })),
    "abc/123",
  );
});

test("an owner can replace only an unused code and the previous code stops working", () => {
  const { repository, workspaceId, database } = fixture();
  const now = new Date("2026-08-03T14:00:00Z");
  const grant = repository.createGrant({ workspaceId,workerLabel:"Artwork desk",durationHours:8,actorUserId:"owner",entitlements:[{module:"ARTWORK_REVIEW",access:"OPERATE"}] }, now);
  const replacement = repository.rotateGrantCode(workspaceId, grant.id, "owner", now);
  assert.match(replacement.code!, /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/);
  assert.notEqual(replacement.code, grant.code);
  assert.throws(() => repository.redeem(grant.code!, "old-code", now), /invalid or expired/i);
  const session = repository.redeem(replacement.code!, "new-code", now);
  assert.equal(repository.authorize(session.token, "ARTWORK_REVIEW", "OPERATE", now)?.allowed, true);
  assert.throws(() => repository.rotateGrantCode(workspaceId, grant.id, "owner", now), /unused, unexpired/i);
  assert.equal(database.prepare("SELECT COUNT(*) count FROM phronesis_authorization_audit WHERE action='EVENT_ACCESS_CODE_ROTATED' AND resource_id=?").get(grant.id)?.count, 1);
});

test("Artwork Review can be a timed task without an event or system administration", () => {
  const { repository, workspaceId, database } = fixture();
  database.prepare("DELETE FROM phronesis_purchase_event").run();
  const grant = repository.createGrant({ workspaceId,workerLabel:"Artwork desk",durationHours:8,actorUserId:"owner",entitlements:[{module:"ARTWORK_REVIEW",access:"OPERATE"}] });
  assert.equal(grant.scopeType, "TASK");
  assert.equal(grant.eventId, null);
  assert.equal(grant.eventName, null);
  const session = repository.redeem(grant.code!, "artwork-client");
  assert.equal(repository.authorize(session.token,"ARTWORK_REVIEW","VIEW")?.allowed,true);
  assert.equal(repository.authorize(session.token,"ARTWORK_REVIEW","OPERATE")?.allowed,true);
  assert.equal(repository.authorize(session.token,"ARTWORK_REVIEW","ADMIN")?.reason,"INSUFFICIENT_ACCESS");
  assert.equal(repository.authorize(session.token,"VENDOR_WORKSPACE","VIEW")?.reason,"MODULE_NOT_ASSIGNED");
  assert.equal(repository.authorize(session.token,"ADMINISTRATION","VIEW")?.reason,"MODULE_NOT_ASSIGNED");
  database.prepare("INSERT INTO phronesis_purchase_event VALUES(?,?,?,?,?,?)").run("unrelated-event",workspaceId,"Unrelated event","CLOSED","2026-08-03",new Date().toISOString());
  assert.equal(repository.authorize(session.token,"ARTWORK_REVIEW","OPERATE")?.allowed,true);
  assert.equal(repository.revoke(workspaceId, grant.id, "owner"), true);
  assert.equal(repository.authorize(session.token,"ARTWORK_REVIEW","VIEW"), null);
});

test("revocation, expiry, and event closure invalidate sessions immediately", () => {
  const { repository, workspaceId, database } = fixture();
  const now=new Date("2026-07-31T12:00:00Z");
  const one=repository.createGrant({workspaceId,eventId:"event-1",workerLabel:"Buyer",durationHours:1,actorUserId:"owner",entitlements:[{module:"INVENTORY",access:"OPERATE"}]},now);
  const session=repository.redeem(one.code!,"client",now);
  assert.equal(repository.authorize(session.token,"INVENTORY","VIEW",new Date("2026-07-31T13:00:01Z"))?.allowed,false);
  const two=repository.createGrant({workspaceId,eventId:"event-1",workerLabel:"Seller",durationHours:4,actorUserId:"owner",entitlements:[{module:"VENDOR_WORKSPACE",access:"OPERATE"}]},now);
  const second=repository.redeem(two.code!,"client-2",now);
  assert.equal(repository.revoke(workspaceId,two.id,"owner",now),true);
  assert.equal(repository.authorize(second.token,"VENDOR_WORKSPACE","VIEW",now),null);
  assert.equal(repository.resumeSession(second.token,now),null);
  const three=repository.createGrant({workspaceId,eventId:"event-1",workerLabel:"Runner",durationHours:4,actorUserId:"owner",entitlements:[{module:"VENDOR_WORKSPACE",access:"VIEW"}]},now);
  const third=repository.redeem(three.code!,"client-3",now);
  database.prepare("UPDATE phronesis_purchase_event SET status='CLOSED' WHERE id='event-1'").run();
  assert.equal(repository.authorize(third.token,"VENDOR_WORKSPACE","VIEW",now)?.allowed,false);
  assert.equal(repository.resumeSession(third.token,now),null);
});

test("grant validation prevents administrative or unbounded access", () => {
  const { repository, workspaceId } = fixture();
  const base={workspaceId,eventId:"event-1",workerLabel:"Worker",durationHours:12,actorUserId:"owner"};
  assert.throws(()=>repository.createGrant({...base,entitlements:[{module:"ADMINISTRATION",access:"VIEW"}]}),/limited/i);
  assert.throws(()=>repository.createGrant({...base,entitlements:[{module:"ARTWORK_REVIEW",access:"ADMIN"}]}),/administration/i);
  assert.throws(()=>repository.createGrant({...base,entitlements:[{module:"INVENTORY",access:"ADMIN"}]}),/administration/i);
  assert.throws(()=>repository.createGrant({...base,durationHours:25,entitlements:[{module:"INVENTORY",access:"VIEW"}]}),/between 1 and 24/i);
});

test("transactional or mixed access remains event-bound", () => {
  const { repository, workspaceId, database } = fixture();
  database.prepare("DELETE FROM phronesis_purchase_event").run();
  const base={workspaceId,workerLabel:"Worker",durationHours:12,actorUserId:"owner"};
  assert.throws(()=>repository.createGrant({...base,entitlements:[{module:"VENDOR_WORKSPACE",access:"OPERATE"}]}),/active Event Ledger event/i);
  assert.throws(()=>repository.createGrant({...base,entitlements:[{module:"ARTWORK_REVIEW",access:"OPERATE"},{module:"INVENTORY",access:"VIEW"}]}),/active Event Ledger event/i);
});

test("legacy grants migrate additively to event scope", () => {
  const database = new DatabaseSync(":memory:");
  const authorization = new AuthorizationRepository(database);
  const workspaceId = authorization.ensureWorkspace();
  database.exec(`
    CREATE TABLE phronesis_purchase_event(id TEXT PRIMARY KEY,workspace_id TEXT NOT NULL,name TEXT NOT NULL,status TEXT NOT NULL,event_date TEXT,created_at TEXT);
    CREATE TABLE phronesis_event_access_grant (
      id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, event_id TEXT NOT NULL,
      worker_label TEXT NOT NULL, entitlements_json TEXT NOT NULL,
      code_hash TEXT NOT NULL, code_salt TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('ACTIVE','REDEEMED','REVOKED')),
      expires_at TEXT NOT NULL, created_by_user_id TEXT NOT NULL, created_at TEXT NOT NULL,
      redeemed_at TEXT, revoked_at TEXT, revoked_by_user_id TEXT
    );
  `);
  const now = new Date("2026-08-03T12:00:00Z");
  database.prepare("INSERT INTO phronesis_purchase_event VALUES(?,?,?,?,?,?)").run("legacy-event",workspaceId,"Legacy event","ACTIVE","2026-08-03",now.toISOString());
  database.prepare("INSERT INTO phronesis_event_access_grant VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run("legacy-grant",workspaceId,"legacy-event","Legacy worker",JSON.stringify([{module:"EVENT_LEDGER",access:"VIEW"}]),"00","00","ACTIVE",new Date(now.getTime()+3_600_000).toISOString(),"owner",now.toISOString(),null,null,null);
  const repository = new EventAccessRepository(database);
  const migrated = repository.listGrants(workspaceId, now);
  assert.equal(migrated[0]?.scopeType, "EVENT");
  assert.equal(migrated[0]?.eventId, "legacy-event");
  assert.equal(database.prepare("SELECT scope_type FROM phronesis_event_access_grant WHERE id='legacy-grant'").get()?.scope_type, "EVENT");
});

test("failed code attempts are throttled", () => {
  const { repository } = fixture();
  for(let index=0;index<10;index++) assert.throws(()=>repository.redeem("AAAA-BBBB-CCCC-DDDD","same-client"),/invalid/i);
  assert.throws(()=>repository.redeem("AAAA-BBBB-CCCC-DDDD","same-client"),/too many/i);
});

test("employee and timed-worker Settings expose an Artwork Review only preset", () => {
  const permanent = readFileSync(new URL("../components/auth/AccessManagement.tsx", import.meta.url), "utf8");
  const temporary = readFileSync(new URL("../components/auth/EventAccessManagement.tsx", import.meta.url), "utf8");
  assert.match(permanent, /Artwork Review only/);
  assert.match(permanent, /module === "ARTWORK_REVIEW" \? "OPERATE" : "NONE"/);
  assert.match(temporary, /Artwork Review only/);
  assert.match(temporary, /setVendor\(false\)[\s\S]*setArtworkReview\(true\)/);
  assert.match(temporary, /Artwork Review task access is available now/);
  assert.match(temporary, /Generate timed task code/);
  assert.match(temporary, /saved in this browser session/);
  assert.match(temporary, /Replace lost code/);
  assert.match(temporary, /method: "PATCH"/);
  assert.doesNotMatch(temporary, /if\(!event\)return/);
  const loginPage = readFileSync(new URL("../app/event-access/page.tsx", import.meta.url), "utf8");
  assert.match(loginPage, /resumeSession/);
  assert.match(loginPage, /eventAccessDestination/);
});
