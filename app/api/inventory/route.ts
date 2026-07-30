import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getInventoryRepository } from "@/lib/inventory/server";
import { watchlistPrincipalFromAuthorization } from "@/lib/watchlist/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "INVENTORY", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  return Response.json(getInventoryRepository().listWorkspace(principal.workspaceId));
}
