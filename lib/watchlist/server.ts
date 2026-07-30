import "server-only";
import type { AuthorizationDecision } from "@/lib/auth/domain";
import {
  LEGACY_WATCHLIST_OWNER_ID,
  LEGACY_WATCHLIST_WORKSPACE_ID,
  type WatchlistPrincipal,
} from "@/lib/watchlist/WatchlistRepository";
export {
  getMarketEvidenceRepository,
  getWatchlistRepository,
} from "@/lib/watchlist/repositories";

export function watchlistPrincipalFromAuthorization(
  decision: AuthorizationDecision,
): WatchlistPrincipal {
  if (!decision.allowed)
    throw new Error("An allowed authorization decision is required.");
  if (decision.userId && decision.workspaceId) {
    return { ownerUserId: decision.userId, workspaceId: decision.workspaceId };
  }
  return {
    ownerUserId: LEGACY_WATCHLIST_OWNER_ID,
    workspaceId: LEGACY_WATCHLIST_WORKSPACE_ID,
  };
}
