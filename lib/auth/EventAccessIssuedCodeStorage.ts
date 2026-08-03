import type { ModuleEntitlement } from "@/lib/auth/domain";

export const EVENT_ACCESS_ISSUED_CODE_KEY = "phronesis.event-access.issued-code.v1";

export type StoredEventAccessCode = {
  id: string;
  scopeType: "EVENT" | "TASK";
  eventName: string | null;
  workerLabel: string;
  entitlements: ModuleEntitlement[];
  status: "ACTIVE";
  expiresAt: string;
  code: string;
};

type SessionStore = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isStoredCode(value: unknown, at: Date): value is StoredEventAccessCode {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredEventAccessCode>;
  return typeof candidate.id === "string"
    && (candidate.scopeType === "EVENT" || candidate.scopeType === "TASK")
    && (candidate.eventName === null || typeof candidate.eventName === "string")
    && typeof candidate.workerLabel === "string"
    && Array.isArray(candidate.entitlements)
    && candidate.status === "ACTIVE"
    && typeof candidate.expiresAt === "string"
    && new Date(candidate.expiresAt).getTime() > at.getTime()
    && typeof candidate.code === "string"
    && /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/.test(candidate.code);
}

export function rememberIssuedCode(store: SessionStore, value: StoredEventAccessCode): void {
  store.setItem(EVENT_ACCESS_ISSUED_CODE_KEY, JSON.stringify(value));
}

export function restoreIssuedCode(store: SessionStore, activeGrantIds: ReadonlySet<string>, at = new Date()): StoredEventAccessCode | null {
  const raw = store.getItem(EVENT_ACCESS_ISSUED_CODE_KEY);
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (isStoredCode(value, at) && activeGrantIds.has(value.id)) return value;
  } catch {
    // Invalid or stale browser-session data is removed below.
  }
  store.removeItem(EVENT_ACCESS_ISSUED_CODE_KEY);
  return null;
}

export function forgetIssuedCode(store: SessionStore, grantId?: string): void {
  if (!grantId) {
    store.removeItem(EVENT_ACCESS_ISSUED_CODE_KEY);
    return;
  }
  const raw = store.getItem(EVENT_ACCESS_ISSUED_CODE_KEY);
  if (!raw) return;
  try {
    const value = JSON.parse(raw) as { id?: unknown };
    if (value.id !== grantId) return;
  } catch {
    // Invalid browser-session data should not survive a cleanup request.
  }
  store.removeItem(EVENT_ACCESS_ISSUED_CODE_KEY);
}
