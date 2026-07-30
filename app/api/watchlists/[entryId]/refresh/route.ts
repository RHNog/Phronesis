import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getPricingRepository } from "@/lib/pricing/server";
import {
  reconcileWatchIdentity,
  refreshWatchlistEntryFromCatalogue,
  resolveCatalogueWatch,
} from "@/lib/watchlist/CatalogueWatchRefresh";
import {
  getWatchlistRepository,
  watchlistPrincipalFromAuthorization,
} from "@/lib/watchlist/server";

export const runtime = "nodejs";
type RefreshContext = { params: Promise<{ entryId: string }> };

export async function POST(request: Request, context: RefreshContext) {
  const authorization = await authorizeRequest(request, "MARKET_WATCH", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  const { entryId } = await context.params;
  const watchlists = getWatchlistRepository();
  const entry = watchlists.findEntry(principal, entryId);
  if (!entry) return Response.json({ error: "Watchlist entry not found." }, { status: 404 });

  try {
    const resolution = resolveCatalogueWatch(entry, getPricingRepository());
    if (!resolution.match) {
      return Response.json(
        { error: `${resolution.reason} Last-known-good evidence was preserved.` },
        { status: 422 },
      );
    }
    const reconciled = resolution.reconciled
      ? reconcileWatchIdentity(entry, resolution.match)
      : entry;
    const refreshed = refreshWatchlistEntryFromCatalogue(
      reconciled,
      resolution.match,
      new Date().toISOString(),
    );
    if (!refreshed) {
      return Response.json(
        { error: "The exact catalogue product has no usable price for this condition. Last-known-good evidence was preserved." },
        { status: 422 },
      );
    }
    const persisted = watchlists.update(principal, entryId, refreshed);
    return persisted
      ? Response.json({ entry: persisted })
      : Response.json({ error: "Watchlist entry disappeared during refresh." }, { status: 409 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Catalogue refresh failed. Last-known-good evidence was preserved." },
      { status: 500 },
    );
  }
}
