import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import {
  getMarketEvidenceRepository,
  getWatchlistRepository,
  watchlistPrincipalFromAuthorization,
} from "@/lib/watchlist/server";

export const runtime = "nodejs";
type EvidenceRouteContext = { params: Promise<{ entryId: string }> };

export async function GET(request: Request, context: EvidenceRouteContext) {
  const authorization = await authorizeRequest(request, "MARKET_WATCH", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  const { entryId } = await context.params;
  if (!getWatchlistRepository().findEntry(principal, entryId)) {
    return Response.json({ error: "Watchlist entry not found." }, { status: 404 });
  }
  return Response.json({ records: getMarketEvidenceRepository().list(principal, entryId) });
}

export async function POST(request: Request, context: EvidenceRouteContext) {
  const authorization = await authorizeRequest(request, "MARKET_WATCH", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  const { entryId } = await context.params;
  if (!getWatchlistRepository().findEntry(principal, entryId)) {
    return Response.json({ error: "Watchlist entry not found." }, { status: 404 });
  }
  try {
    const body = await request.json() as {
      condition?: unknown;
      currency?: unknown;
      observedAt?: unknown;
      priceCents?: unknown;
      provenance?: unknown;
      quantity?: unknown;
      sourceUrl?: unknown;
    };
    const record = getMarketEvidenceRepository().recordObservedSale(principal, {
      entryId,
      priceCents: Number(body.priceCents),
      currency: typeof body.currency === "string" ? body.currency : undefined,
      condition: typeof body.condition === "string" ? body.condition : undefined,
      quantity: body.quantity === undefined ? undefined : Number(body.quantity),
      observedAt: typeof body.observedAt === "string" ? body.observedAt : new Date().toISOString(),
      sourceUrl: typeof body.sourceUrl === "string" ? body.sourceUrl : undefined,
      provenance: typeof body.provenance === "string" ? body.provenance : undefined,
    });
    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Observed sale could not be recorded." }, { status: 400 });
  }
}
