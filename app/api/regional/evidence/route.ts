import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import { getRegionalIntelligenceRepository } from "@/lib/regional/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "VIEW",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId") ?? "";
  const sku = url.searchParams.get("sku") ?? "";
  if (!categoryId || !sku)
    return Response.json(
      { error: "categoryId and sku are required." },
      { status: 400 },
    );
  const repository = getRegionalIntelligenceRepository();
  return Response.json({
    evidence: repository.evidenceFor(categoryId, sku),
    disposition: repository.equivalenceFor(categoryId, sku),
  });
}
