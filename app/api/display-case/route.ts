import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  displayCaseVerificationCsv,
  type DisplayCaseSnapshot,
} from "@/lib/events/displayCase";
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

function snapshotFor(
  principal: PurchasePrincipal,
  eventIdInput?: string,
  query = "",
  report = false,
): DisplayCaseSnapshot {
  const ledger = getPurchaseLedgerRepository();
  const event = eventIdInput
    ? ledger.displayCase.getEventFlipSnapshot(principal, eventIdInput).event
    : ledger.getEventLedgerSnapshot(principal).event;
  if (!event) {
    return { event: null, preparedStock: null, eventFlips: null, summary: null };
  }
  const maximumResults = report ? 10_000 : 40;
  const preparedStock = ledger.eventStock.getSnapshot(
    principal,
    event.id,
    query,
    maximumResults,
  );
  const eventFlips = ledger.displayCase.getSourceSnapshot(
    principal,
    event.id,
    query,
    maximumResults,
  );
  return {
    event,
    preparedStock,
    eventFlips,
    summary: {
      preparedExpectedQuantity: preparedStock.summary.expectedQuantity,
      eventFlipExpectedQuantity: eventFlips.summary.expectedQuantity,
      totalExpectedQuantity:
        preparedStock.summary.expectedQuantity +
        eventFlips.summary.expectedQuantity,
      soldQuantity:
        preparedStock.summary.soldQuantity + eventFlips.summary.soldQuantity,
      countedQuantity:
        preparedStock.summary.countedQuantity +
        eventFlips.summary.countedQuantity,
      varianceQuantity:
        preparedStock.summary.varianceQuantity +
        eventFlips.summary.varianceQuantity,
      untrackedSaleUnits: preparedStock.summary.untrackedSaleUnits,
    },
  };
}

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "INVENTORY", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId") ?? undefined;
  const query = (url.searchParams.get("q") ?? "").slice(0, 200);
  try {
    const principal = principalFor(authorization);
    if (url.searchParams.get("report") === "verification") {
      const csv = displayCaseVerificationCsv(
        snapshotFor(principal, eventId, "", true),
      );
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="display-case-verification.csv"',
          "Cache-Control": "no-store",
        },
      });
    }
    return Response.json({ snapshot: snapshotFor(principal, eventId, query) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Display Case could not load.",
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
  if (!body || typeof body.action !== "string") {
    return Response.json(
      { error: "Display Case action is required." },
      { status: 400 },
    );
  }
  try {
    const principal = principalFor(authorization);
    const eventId = requiredString(body.eventId, "Event is required.");
    const displayCase = getPurchaseLedgerRepository().displayCase;
    if (body.action === "update-price") {
      displayCase.updatePrice(
        principal,
        eventId,
        requiredString(body.caseItemId, "Display Case item is required."),
        Number(body.salePriceCents),
        requiredString(body.reason, "Price reason is required."),
      );
    } else if (body.action === "return-to-general") {
      displayCase.returnToGeneral(
        principal,
        eventId,
        requiredString(body.caseItemId, "Display Case item is required."),
        Number(body.quantity),
        requiredString(body.reason, "Return reason is required."),
        requiredString(body.idempotencyKey, "Case operation key is required."),
      );
    } else if (body.action === "count-item") {
      displayCase.countItem(
        principal,
        eventId,
        requiredString(body.caseItemId, "Display Case item is required."),
        Number(body.countedQuantity),
        requiredString(body.reason, "Count reason is required."),
      );
    } else if (body.action === "count-prepared-item") {
      getPurchaseLedgerRepository().eventStock.countItem(
        principal,
        eventId,
        requiredString(body.itemId, "Opening stock item is required."),
        Number(body.countedQuantity),
        requiredString(body.reason, "Count reason is required."),
      );
    } else {
      return Response.json(
        { error: "Unsupported Display Case action." },
        { status: 400 },
      );
    }
    return Response.json(
      { snapshot: snapshotFor(principal, eventId) },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Display Case operation failed.",
      },
      { status: 400 },
    );
  }
}
