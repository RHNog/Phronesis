import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { EVENT_ACCESS_COOKIE } from "@/lib/auth/constants";
import { getEventAccessRepository } from "@/lib/auth/server";

const moduleDestinations = {
  VENDOR_WORKSPACE: "/vendor",
  EVENT_LEDGER: "/event-ledger",
  EVENT_FLIP: "/event-flip",
  INVENTORY: "/inventory",
  ARTWORK_REVIEW: "/artwork-review",
} as const;

function bucket(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return createHash("sha256").update(address).digest("hex");
}

function secureRequest(request: Request): boolean {
  return request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() === "https" ||
    request.headers.get("x-phronesis-public-event") === "1" ||
    new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  if (typeof body?.code !== "string") return NextResponse.json({ error: "Enter an event access code." }, { status: 400 });
  try {
    const redeemed = getEventAccessRepository().redeem(body.code, bucket(request));
    const destination = redeemed.grant.entitlements.map((entry) => moduleDestinations[entry.module as keyof typeof moduleDestinations]).find(Boolean) ?? "/event-access";
    const response = NextResponse.json({ workerLabel: redeemed.grant.workerLabel, eventName: redeemed.grant.eventName, expiresAt: redeemed.expiresAt, destination });
    response.cookies.set(EVENT_ACCESS_COOKIE, redeemed.token, { httpOnly: true, sameSite: "lax", secure: secureRequest(request), path: "/", expires: new Date(redeemed.expiresAt), priority: "high" });
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Event access code is invalid or expired." }, { status: 401 }); }
}

export async function DELETE(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${EVENT_ACCESS_COOKIE}=`))?.slice(EVENT_ACCESS_COOKIE.length + 1);
  if (token) getEventAccessRepository().revokeSession(decodeURIComponent(token));
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(EVENT_ACCESS_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: secureRequest(request), path: "/", maxAge: 0 });
  return response;
}
