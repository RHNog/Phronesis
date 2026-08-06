import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  validateEventCashAdjustmentDraft,
  validateEventCurrency,
  validateEventManualPurchaseDraft,
  validateEventSaleDraft,
  type PurchasePrincipal,
} from "@/lib/purchases/domain";
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

function requiredNonNegativeCents(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be an explicit non-negative cent value.`);
  }
  return value;
}

export async function GET(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "EVENT_LEDGER",
    "VIEW",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const eventId = new URL(request.url).searchParams.get("eventId");
  const principal = principalFor(authorization);
  const ledger = getPurchaseLedgerRepository();
  try {
    const reportIndex = ledger.listClosedEventReports(principal);
    return Response.json({
      snapshot: eventId
        ? ledger.getClosedEventLedgerSnapshot(principal, eventId)
        : ledger.getEventLedgerSnapshot(principal),
      reports: reportIndex.reports,
      reportsTruncated: reportIndex.truncated,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Event Ledger report could not load.",
      },
      { status: 404 },
    );
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  if (!body || typeof body.action !== "string") {
    return Response.json(
      { error: "Event ledger action is required." },
      { status: 400 },
    );
  }

  const authorization = await authorizeRequest(
    request,
    "EVENT_LEDGER",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = principalFor(authorization);
  const ledger = getPurchaseLedgerRepository();

  try {
    if (body.action === "create-event") {
      ledger.createEvent(principal, {
        name: requiredString(body.name, "Event name is required."),
        eventDate: requiredString(body.eventDate, "Event date is required."),
        location: typeof body.location === "string" ? body.location : undefined,
        currency: validateEventCurrency(body.currency),
        openingCashCents: requiredNonNegativeCents(
          body.openingCashCents,
          "Opening cash",
        ),
      });
      return Response.json(
        { snapshot: ledger.getEventLedgerSnapshot(principal) },
        { status: 201 },
      );
    }

    const eventId = requiredString(body.eventId, "Active event is required.");
    if (body.action === "record-sale") {
      ledger.recordSale(
        principal,
        eventId,
        validateEventSaleDraft(body.sale),
        requiredString(body.idempotencyKey, "Sale identity is required."),
      );
    } else if (body.action === "record-purchase") {
      ledger.recordManualPurchase(
        principal,
        eventId,
        validateEventManualPurchaseDraft(body.purchase),
        requiredString(body.idempotencyKey, "Purchase identity is required."),
      );
    } else if (body.action === "record-adjustment") {
      ledger.recordCashAdjustment(
        principal,
        eventId,
        validateEventCashAdjustmentDraft(body.adjustment),
        requiredString(body.idempotencyKey, "Adjustment identity is required."),
      );
    } else if (body.action === "reverse-entry") {
      ledger.reverseLedgerEntry(
        principal,
        eventId,
        requiredString(body.entryId, "Ledger entry is required."),
        requiredString(body.reason, "Reversal reason is required."),
        requiredString(body.idempotencyKey, "Reversal identity is required."),
      );
    } else if (body.action === "close-event") {
      const snapshot = ledger.closeEvent(
        principal,
        eventId,
        requiredNonNegativeCents(body.closingCashCents, "Closing cash"),
      );
      const reportIndex = ledger.listClosedEventReports(principal);
      return Response.json({
        snapshot,
        reports: reportIndex.reports,
        reportsTruncated: reportIndex.truncated,
      });
    } else {
      return Response.json(
        { error: "Unsupported event ledger action." },
        { status: 400 },
      );
    }

    return Response.json(
      { snapshot: ledger.getEventLedgerSnapshot(principal) },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Event ledger operation failed.",
      },
      { status: 400 },
    );
  }
}
