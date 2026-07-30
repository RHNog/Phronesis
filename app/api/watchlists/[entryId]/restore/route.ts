import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  getWatchlistRepository,
  watchlistPrincipalFromAuthorization,
} from "@/lib/watchlist/server";

export const runtime = "nodejs";

type WatchlistRestoreRouteContext = { params: Promise<{ entryId: string }> };

export async function POST(request: Request, context: WatchlistRestoreRouteContext) {
  const authorization = await authorizeRequest(
    request,
    "MARKET_WATCH",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const { entryId } = await context.params;
  const entry = getWatchlistRepository().restore(
    watchlistPrincipalFromAuthorization(authorization),
    entryId,
  );
  return entry
    ? Response.json({ entry })
    : Response.json(
        { error: "Removed watchlist entry not found." },
        { status: 404 },
      );
}
