import "server-only";
import type { AuthorizationDecision } from "@/lib/auth/domain";
import { getAuthDatabase } from "@/lib/auth/server";
import {
  LEGACY_WATCHLIST_OWNER_ID,
  LEGACY_WATCHLIST_WORKSPACE_ID,
  WatchlistRepository,
  type WatchlistPrincipal,
} from "@/lib/watchlist/WatchlistRepository";
import { MarketEvidenceRepository } from "@/lib/market/MarketEvidenceRepository";

let repository: WatchlistRepository | undefined;
let evidenceRepository: MarketEvidenceRepository | undefined;

export function getWatchlistRepository(): WatchlistRepository {
  repository ??= new WatchlistRepository(getAuthDatabase());
  return repository;
}

export function getMarketEvidenceRepository(): MarketEvidenceRepository {
  evidenceRepository ??= new MarketEvidenceRepository(getAuthDatabase());
  return evidenceRepository;
}

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
