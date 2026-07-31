import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
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
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "VIEW",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");
  if (!eventId) {
    return Response.json({ error: "Event is required." }, { status: 400 });
  }
  try {
    const stock = getPurchaseLedgerRepository().eventStock;
    const report = url.searchParams.get("report");
    if (report === "sold" || report === "leftover") {
      const csv = stock.reportCsv(principalFor(authorization), eventId, report);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="event-${report}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }
    const query = (url.searchParams.get("q") ?? "").slice(0, 200);
    return Response.json({
      snapshot: stock.getSnapshot(principalFor(authorization), eventId, query),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Event Inventory could not load.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body.action !== "string") {
    return Response.json(
      { error: "Event Inventory action is required." },
      { status: 400 },
    );
  }
  try {
    const principal = principalFor(authorization);
    const stock = getPurchaseLedgerRepository().eventStock;
    const eventId = requiredString(body.eventId, "Event is required.");
    if (body.action === "import-csv") {
      return Response.json(
        {
          snapshot: stock.importCsv(
            principal,
            eventId,
            requiredString(body.sourceName, "Inventory source filename is required."),
            requiredString(body.csv, "Inventory CSV content is required."),
          ),
        },
        { status: 201 },
      );
    }
    if (body.action === "count-item") {
      return Response.json(
        {
          snapshot: stock.countItem(
            principal,
            eventId,
            requiredString(body.itemId, "Inventory item is required."),
            Number(body.countedQuantity),
            requiredString(body.reason, "Count reason is required."),
          ),
        },
        { status: 201 },
      );
    }
    return Response.json(
      { error: "Unsupported Event Inventory action." },
      { status: 400 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Event Inventory operation failed.",
      },
      { status: 400 },
    );
  }
}
