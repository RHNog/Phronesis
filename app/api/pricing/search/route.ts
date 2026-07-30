import { NextResponse } from "next/server";
import { getPricingRepository } from "@/lib/pricing/server";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const categoryId = url.searchParams.get("category");
  try {
    const repository = getPricingRepository();
    return NextResponse.json(categoryId ? repository.search(categoryId, query) : repository.searchAll(query));
  } catch {
    return NextResponse.json(
      { error: "Pricing lookup is temporarily unavailable. Your search was preserved; try again." },
      { status: 500 },
    );
  }
}
