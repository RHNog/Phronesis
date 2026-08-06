import assert from "node:assert/strict";
import test from "node:test";
import {
  EVENT_ACCESS_ISSUED_CODE_KEY,
  forgetIssuedCode,
  rememberIssuedCode,
  restoreIssuedCode,
  type StoredEventAccessCode,
} from "@/lib/auth/EventAccessIssuedCodeStorage";

class MemorySessionStore {
  private readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
  removeItem(key: string): void { this.values.delete(key); }
}

function issued(expiresAt = "2026-08-04T12:00:00Z"): StoredEventAccessCode {
  return {
    id: "grant-1",
    scopeType: "TASK",
    eventName: null,
    workerLabel: "Artwork desk",
    entitlements: [{ module: "ARTWORK_REVIEW", access: "OPERATE" }],
    status: "ACTIVE",
    expiresAt,
    code: "ABCD-EFGH-JKLM-NPQR",
  };
}

test("unused code survives navigation in the same browser session", () => {
  const store = new MemorySessionStore();
  rememberIssuedCode(store, issued());
  assert.deepEqual(restoreIssuedCode(store, new Set(["grant-1"]), new Date("2026-08-03T12:00:00Z")), issued());
});

test("redeemed, revoked, expired, or malformed browser-session codes are forgotten", () => {
  const store = new MemorySessionStore();
  rememberIssuedCode(store, issued("2026-08-03T11:00:00Z"));
  assert.equal(restoreIssuedCode(store, new Set(["grant-1"]), new Date("2026-08-03T12:00:00Z")), null);
  assert.equal(store.getItem(EVENT_ACCESS_ISSUED_CODE_KEY), null);

  rememberIssuedCode(store, issued());
  assert.equal(restoreIssuedCode(store, new Set(), new Date("2026-08-03T12:00:00Z")), null);
  store.setItem(EVENT_ACCESS_ISSUED_CODE_KEY, "not-json");
  assert.equal(restoreIssuedCode(store, new Set(["grant-1"]), new Date("2026-08-03T12:00:00Z")), null);
});

test("targeted cleanup does not remove a different active code", () => {
  const store = new MemorySessionStore();
  rememberIssuedCode(store, issued());
  forgetIssuedCode(store, "grant-2");
  assert.notEqual(store.getItem(EVENT_ACCESS_ISSUED_CODE_KEY), null);
  forgetIssuedCode(store, "grant-1");
  assert.equal(store.getItem(EVENT_ACCESS_ISSUED_CODE_KEY), null);
});
