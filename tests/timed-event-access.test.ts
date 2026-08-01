import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { AuthorizationRepository } from "../lib/auth/AuthorizationRepository.ts";
import { EventAccessRepository } from "../lib/auth/EventAccessRepository.ts";

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
  const grant = repository.createGrant({ workspaceId,eventId:"event-1",workerLabel:"Front case",durationHours:12,actorUserId:"owner",entitlements:[{module:"VENDOR_WORKSPACE",access:"OPERATE"}] });
  assert.match(grant.code!, /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/);
  const session = repository.redeem(grant.code!, "client");
  assert.equal(repository.authorize(session.token,"VENDOR_WORKSPACE","OPERATE")?.allowed,true);
  assert.equal(repository.authorize(session.token,"INVENTORY","VIEW")?.reason,"MODULE_NOT_ASSIGNED");
  assert.equal(repository.authorize(session.token,"ADMINISTRATION","VIEW")?.allowed,false);
  assert.throws(()=>repository.redeem(grant.code!,"other"),/invalid or expired/i);
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
  const three=repository.createGrant({workspaceId,eventId:"event-1",workerLabel:"Runner",durationHours:4,actorUserId:"owner",entitlements:[{module:"VENDOR_WORKSPACE",access:"VIEW"}]},now);
  const third=repository.redeem(three.code!,"client-3",now);
  database.prepare("UPDATE phronesis_purchase_event SET status='CLOSED' WHERE id='event-1'").run();
  assert.equal(repository.authorize(third.token,"VENDOR_WORKSPACE","VIEW",now)?.allowed,false);
});

test("grant validation prevents administrative or unbounded access", () => {
  const { repository, workspaceId } = fixture();
  const base={workspaceId,eventId:"event-1",workerLabel:"Worker",durationHours:12,actorUserId:"owner"};
  assert.throws(()=>repository.createGrant({...base,entitlements:[{module:"ADMINISTRATION",access:"VIEW"}]}),/limited/i);
  assert.throws(()=>repository.createGrant({...base,entitlements:[{module:"INVENTORY",access:"ADMIN"}]}),/administration/i);
  assert.throws(()=>repository.createGrant({...base,durationHours:25,entitlements:[{module:"INVENTORY",access:"VIEW"}]}),/between 1 and 24/i);
});

test("failed code attempts are throttled", () => {
  const { repository } = fixture();
  for(let index=0;index<10;index++) assert.throws(()=>repository.redeem("AAAA-BBBB-CCCC-DDDD","same-client"),/invalid/i);
  assert.throws(()=>repository.redeem("AAAA-BBBB-CCCC-DDDD","same-client"),/too many/i);
});
