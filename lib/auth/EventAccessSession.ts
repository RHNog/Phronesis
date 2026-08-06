import type { ModuleEntitlement } from "@/lib/auth/domain";
import { EVENT_ACCESS_COOKIE } from "@/lib/auth/constants";

const moduleDestinations = {
  VENDOR_WORKSPACE: "/vendor",
  EVENT_LEDGER: "/event-ledger",
  EVENT_FLIP: "/event-flip",
  INVENTORY: "/inventory",
  ARTWORK_REVIEW: "/artwork-review",
} as const;

export function eventAccessDestination(
  entitlements: readonly ModuleEntitlement[],
): string {
  return entitlements
    .map(
      (entry) =>
        moduleDestinations[entry.module as keyof typeof moduleDestinations],
    )
    .find(Boolean) ?? "/event-access";
}

export function eventAccessToken(headers: Headers): string | null {
  const encoded = headers
    .get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${EVENT_ACCESS_COOKIE}=`))
    ?.slice(EVENT_ACCESS_COOKIE.length + 1);
  if (!encoded) return null;
  try {
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

export function eventAccessCookieLifetime(
  expiresAt: string,
  at = new Date(),
): { expires: Date; maxAge: number } {
  const expires = new Date(expiresAt);
  return {
    expires,
    maxAge: Math.max(
      0,
      Math.floor((expires.getTime() - at.getTime()) / 1_000),
    ),
  };
}
