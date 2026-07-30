import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getPricingRepository } from "@/lib/pricing/server";
import { validatePurchaseLineDraft, type PurchasePrincipal } from "@/lib/purchases/domain";
import { getPurchaseLedgerRepository } from "@/lib/purchases/server";
import { watchlistPrincipalFromAuthorization } from "@/lib/watchlist/server";

export const runtime = "nodejs";

function principalFor(authorization: Parameters<typeof watchlistPrincipalFromAuthorization>[0]): PurchasePrincipal {
  const principal = watchlistPrincipalFromAuthorization(authorization);
  return { workspaceId: principal.workspaceId, operatorUserId: principal.ownerUserId };
}

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = principalFor(authorization);
  const ledger = getPurchaseLedgerRepository();
  const event = ledger.getActiveEvent(principal);
  return Response.json({
    event,
    cart: event ? ledger.listCart(principal, event.id) : [],
    receipts: ledger.listReceipts(principal).slice(0, 10),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== "string") return Response.json({ error: "Purchase action is required." }, { status: 400 });

  const requiredModule = body.action === "void-receipt" ? "ADMINISTRATION" : "VENDOR_WORKSPACE";
  const requiredAccess = body.action === "void-receipt" ? "ADMIN" : "OPERATE";
  const authorization = await authorizeRequest(request, requiredModule, requiredAccess);
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = principalFor(authorization);
  const ledger = getPurchaseLedgerRepository();

  try {
    if (body.action === "create-event") {
      return Response.json({ event: ledger.createEvent(principal, {
        name: typeof body.name === "string" ? body.name : "",
        eventDate: typeof body.eventDate === "string" ? body.eventDate : "",
        location: typeof body.location === "string" ? body.location : undefined,
        budgetCents: body.budgetCents === null || body.budgetCents === undefined ? null : Number(body.budgetCents),
      }) }, { status: 201 });
    }
    if (body.action === "add-line") {
      if (typeof body.eventId !== "string") throw new Error("Purchase event is required.");
      const draft = validatePurchaseLineDraft(body.line);
      const exactMatch = draft.kind === "EXACT"
        ? getPricingRepository().findBySku(draft.categoryId, draft.sku) ?? undefined
        : undefined;
      return Response.json({ line: ledger.addLine(principal, body.eventId, draft, exactMatch) }, { status: 201 });
    }
    if (body.action === "remove-line") {
      if (typeof body.lineId !== "string") throw new Error("Cart line is required.");
      return Response.json({ removed: ledger.removeLine(principal, body.lineId) });
    }
    if (body.action === "checkout") {
      if (typeof body.eventId !== "string" || typeof body.idempotencyKey !== "string") throw new Error("Checkout identity is invalid.");
      return Response.json({ receipt: ledger.checkout(principal, body.eventId, body.idempotencyKey) }, { status: 201 });
    }
    if (body.action === "void-receipt") {
      if (typeof body.receiptId !== "string" || typeof body.reason !== "string") throw new Error("Receipt and void reason are required.");
      return Response.json({ receipt: ledger.voidReceipt(principal, body.receiptId, body.reason) });
    }
    return Response.json({ error: "Unsupported purchase action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Purchase operation failed." }, { status: 400 });
  }
}
