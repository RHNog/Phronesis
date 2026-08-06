import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthMode, getAuthRuntimeStatus } from "@/lib/auth/config";
import { EVENT_ACCESS_COOKIE } from "@/lib/auth/constants";

export function proxy(request: NextRequest) {
  const eventSession = request.cookies.get(EVENT_ACCESS_COOKIE)?.value;
  if (request.headers.get("x-phronesis-public-event") === "1") {
    if (request.nextUrl.pathname === "/event-access") return NextResponse.next();
    if (!eventSession) return NextResponse.redirect(new URL("/event-access", request.url));
    return NextResponse.next();
  }
  if (getAuthMode() !== "REQUIRED") return NextResponse.next();
  const status = getAuthRuntimeStatus();
  if (!status.readyForRequiredMode || (!getSessionCookie(request) && !eventSession)) {
    const url = new URL("/sign-in", request.url);
    url.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/opportunities/:path*",
    "/vendor/:path*",
    "/event-ledger/:path*",
    "/event-flip/:path*",
    "/display-case/:path*",
    "/inventory/:path*",
    "/artwork-review/:path*",
    "/evaluate/:path*",
    "/price-lookup/:path*",
    "/watchlists/:path*",
    "/settings/:path*",
    "/dev/:path*",
  ],
};
