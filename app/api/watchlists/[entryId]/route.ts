import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  getWatchlistRepository,
  watchlistPrincipalFromAuthorization,
} from "@/lib/watchlist/server";
import { parseWatchlistEntry } from "@/lib/watchlist/validation";

export const runtime = "nodejs";

type WatchlistEntryRouteContext = { params: Promise<{ entryId: string }> };

export async function PATCH(request: Request, context: WatchlistEntryRouteContext) {
  const authorization = await authorizeRequest(
    request,
    "MARKET_WATCH",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const { entryId } = await context.params;
    const body = (await request.json()) as { entry?: unknown };
    const entry = getWatchlistRepository().update(
      watchlistPrincipalFromAuthorization(authorization),
      entryId,
      parseWatchlistEntry(body.entry),
    );
    return entry
      ? Response.json({ entry })
      : Response.json({ error: "Watchlist entry not found." }, { status: 404 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Watchlist update failed.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: WatchlistEntryRouteContext) {
  const authorization = await authorizeRequest(
    request,
    "MARKET_WATCH",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const { entryId } = await context.params;
  const entry = getWatchlistRepository().remove(
    watchlistPrincipalFromAuthorization(authorization),
    entryId,
  );
  return entry
    ? Response.json({ entry })
    : Response.json({ error: "Watchlist entry not found." }, { status: 404 });
}
