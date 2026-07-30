import {
  appendSuccessfulWatchObservation,
  ensureWatchHistory,
} from "@/features/watchlist/WatchHistory";
import {
  calculateWatchlistMetrics,
  type WatchlistEntry,
} from "@/features/watchlist/WatchlistRefreshEngine";
import type { PricingRepository } from "@/lib/pricing/repository";
import type {
  PriceState,
  PricingCondition,
  SearchMatch,
} from "@/lib/pricing/types";
import type {
  CatalogueWatchRefreshResult,
  WatchlistRepository,
} from "@/lib/watchlist/WatchlistRepository";

const pricingConditionByWatchCondition: Record<string, PricingCondition> = {
  NM: "NEAR_MINT",
  LP: "LIGHTLY_PLAYED",
  MP: "MODERATELY_PLAYED",
  HP: "HEAVILY_PLAYED",
  DMG: "DAMAGED",
};

function selectedPrice(
  match: SearchMatch,
  entry: WatchlistEntry,
): PriceState | null {
  if (match.productType === "SEALED") return match.sealedPrice;
  const condition =
    pricingConditionByWatchCondition[entry.condition.trim().toUpperCase()];
  return condition ? (match.prices[condition] ?? null) : null;
}

export function refreshWatchlistEntryFromCatalogue(
  entry: WatchlistEntry,
  match: SearchMatch,
  checkpointAt: string,
): WatchlistEntry | null {
  const price = selectedPrice(match, entry);
  if (!price) return null;
  const valuationCents = price.marketPriceCents ?? price.deliveredPriceCents;
  if (valuationCents === null) return null;
  const valuation = valuationCents / 100;
  const observedAt = price.snapshotDate;
  const previous = entry.currentValuation;
  const marketTrend =
    previous === null || previous === valuation
      ? "Stable"
      : valuation > previous
        ? "Increasing"
        : "Declining";
  const watchHistory = appendSuccessfulWatchObservation(
    ensureWatchHistory(entry.watchHistory, {
      addedAt: entry.lastObservation ?? entry.lastRefresh,
      currentValuation: entry.currentValuation,
      lastRefresh: entry.lastRefresh,
      observationSource: entry.observationSource,
    }),
    { observedAt, source: "Repository", valuation },
  );
  return calculateWatchlistMetrics({
    ...entry,
    currentValuation: valuation,
    developerDiagnostics: {
      apiSaved: true,
      cacheAgeMs: Math.max(0, Date.now() - new Date(observedAt).getTime()),
      observationAgeMs: Math.max(
        0,
        Date.now() - new Date(observedAt).getTime(),
      ),
      providerHit: false,
      providerRequestJustification:
        "Verified catalogue checkpoint refreshed the existing watch without a provider request.",
      replay: false,
      repositoryHit: true,
      repositorySource: "Verified pricing catalogue snapshot",
    },
    lastObservation: observedAt,
    lastRefresh: checkpointAt,
    marketTrend,
    observationSource: "Repository",
    refreshStatus: "Repository Reused",
    watchHistory,
  });
}

export function refreshWatchedCategory(input: {
  categoryId: string;
  checkpointAt: string;
  pricingRepository: PricingRepository;
  watchlistRepository: WatchlistRepository;
}): CatalogueWatchRefreshResult {
  return input.watchlistRepository.refreshCatalogueEntries(
    input.categoryId,
    (entry) => {
      const match = input.pricingRepository.findBySku(
        input.categoryId,
        entry.assetIdentity.printingId,
      );
      return match
        ? refreshWatchlistEntryFromCatalogue(entry, match, input.checkpointAt)
        : null;
    },
  );
}
