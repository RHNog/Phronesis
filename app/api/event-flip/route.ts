import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import type { EventFlipSelection } from "@/lib/events/displayCase";
import type { PurchasePrincipal } from "@/lib/purchases/domain";
import { getPurchaseLedgerRepository } from "@/lib/purchases/server";
import { watchlistPrincipalFromAuthorization } from "@/lib/watchlist/server";

export const runtime = "nodejs";

function principalFor(
  authorization: Parameters<typeof watchlistPrincipalFromAuthorization>[0],
): PurchasePrincipal {
  const principal = watchlistPrincipalFromAuthorization(authorization);
  return {
    workspaceId: principal.workspaceId,
    operatorUserId: principal.ownerUserId,
  };
}

function requiredString(value: unknown, message: string): string {
  if (typeof value !== "string") throw new Error(message);
  return value;
}

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "INVENTORY", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const eventId = new URL(request.url).searchParams.get("eventId") ?? undefined;
  try {
    return Response.json({
      snapshot: getPurchaseLedgerRepository().displayCase.getEventFlipSnapshot(
        principalFor(authorization),
        eventId,
      ),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Event Flip could not load.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "INVENTORY",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || body.action !== "add-to-case") {
    return Response.json(
      { error: "Supported Event Flip action is required." },
      { status: 400 },
    );
  }
  try {
    if (!Array.isArray(body.selections)) {
      throw new Error("At least one Case selection is required.");
    }
    const selections = body.selections.map((value) => {
      if (!value || typeof value !== "object") {
        throw new Error("Case selection is invalid.");
      }
      const selection = value as Record<string, unknown>;
      return {
        inventoryLotId: requiredString(
          selection.inventoryLotId,
          "Inventory lot is required.",
        ),
        quantity: Number(selection.quantity),
        salePriceCents: Number(selection.salePriceCents),
      } satisfies EventFlipSelection;
    });
    return Response.json(
      {
        snapshot:
          getPurchaseLedgerRepository().displayCase.addToCase(
            principalFor(authorization),
            requiredString(body.eventId, "Active event is required."),
            selections,
            requiredString(body.idempotencyKey, "Case operation key is required."),
          ),
      },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Event Flip operation failed.",
      },
      { status: 400 },
    );
  }
}
