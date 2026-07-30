import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { getAuthMode, getAuthRuntimeStatus } from "@/lib/auth/config";

export function proxy(request: NextRequest) {
  if (getAuthMode() !== "REQUIRED") return NextResponse.next();
  const status = getAuthRuntimeStatus();
  if (!status.readyForRequiredMode || !getSessionCookie(request)) {
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
    "/evaluate/:path*",
    "/price-lookup/:path*",
    "/watchlists/:path*",
    "/settings/:path*",
    "/dev/:path*",
  ],
};
