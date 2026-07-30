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

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "INVENTORY", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") {
    return Response.json({ error: "Inventory action is required." }, { status: 400 });
  }

  try {
    const inventory = getInventoryRepository();
    if (body.action === "create-location") {
      const location = inventory.createLocation(
        principal.workspaceId,
        principal.ownerUserId,
        typeof body.name === "string" ? body.name : "",
      );
      return Response.json({ location, snapshot: inventory.listWorkspace(principal.workspaceId) }, { status: 201 });
    }
    if (body.action === "reconcile-lot") {
      if (typeof body.lotId !== "string" || typeof body.reason !== "string") {
        throw new Error("Lot and reconciliation reason are required.");
      }
      const input: {
        lotId: string;
        locationId?: string | null;
        countedQuantity?: number;
        reason: string;
      } = { lotId: body.lotId, reason: body.reason };
      if (Object.prototype.hasOwnProperty.call(body, "locationId")) {
        if (body.locationId !== null && typeof body.locationId !== "string") {
          throw new Error("Inventory location is invalid.");
        }
        input.locationId = body.locationId as string | null;
      }
      if (Object.prototype.hasOwnProperty.call(body, "countedQuantity")) {
        input.countedQuantity = Number(body.countedQuantity);
      }
      return Response.json({ snapshot: inventory.reconcileLot(
        principal.workspaceId,
        principal.ownerUserId,
        input,
      ) });
    }
    return Response.json({ error: "Unsupported inventory action." }, { status: 400 });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Inventory operation failed.",
    }, { status: 400 });
  }
}
