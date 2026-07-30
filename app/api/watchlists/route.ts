import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  getWatchlistRepository,
  watchlistPrincipalFromAuthorization,
} from "@/lib/watchlist/server";
import {
  parseWatchlistEntries,
  parseWatchlistEntry,
} from "@/lib/watchlist/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "MARKET_WATCH", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  return Response.json({
    entries: getWatchlistRepository().listEntries(principal),
  });
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "MARKET_WATCH",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  try {
    const body = (await request.json()) as {
      action?: string;
      entry?: unknown;
      entries?: unknown;
    };
    if (body.action === "import") {
      return Response.json({
        entries: getWatchlistRepository().importEntries(
          principal,
          parseWatchlistEntries(body.entries),
        ),
      });
    }
    if (body.action === "track") {
      return Response.json(
        getWatchlistRepository().track(
          principal,
          parseWatchlistEntry(body.entry),
        ),
      );
    }
    return Response.json(
      { error: "Unsupported watchlist action." },
      { status: 400 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Watchlist mutation failed.",
      },
      { status: 400 },
    );
  }
}
