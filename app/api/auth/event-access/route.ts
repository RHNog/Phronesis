import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { EVENT_ACCESS_COOKIE } from "@/lib/auth/EventAccessRepository";
import { getEventAccessRepository } from "@/lib/auth/server";

function bucket(request: Request): string {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return createHash("sha256").update(address).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  if (typeof body?.code !== "string") return NextResponse.json({ error: "Enter an event access code." }, { status: 400 });
  try {
    const redeemed = getEventAccessRepository().redeem(body.code, bucket(request));
    const response = NextResponse.json({ workerLabel: redeemed.grant.workerLabel, eventName: redeemed.grant.eventName, expiresAt: redeemed.expiresAt });
    response.cookies.set(EVENT_ACCESS_COOKIE, redeemed.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(redeemed.expiresAt), priority: "high" });
    return response;
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Event access code is invalid or expired." }, { status: 401 }); }
}

export async function DELETE(request: Request) {
  const token = request.headers.get("cookie")?.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${EVENT_ACCESS_COOKIE}=`))?.slice(EVENT_ACCESS_COOKIE.length + 1);
  if (token) getEventAccessRepository().revokeSession(decodeURIComponent(token));
  const response = NextResponse.json({ signedOut: true });
  response.cookies.set(EVENT_ACCESS_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return response;
}
