import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  createPkmnPricesSealedSync,
  getPkmnPricesSealedSummary,
} from "@/lib/providers/pkmnprices/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "ADMINISTRATION", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  return Response.json(getPkmnPricesSealedSummary(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "ADMINISTRATION", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  return Response.json(await createPkmnPricesSealedSync().run(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
