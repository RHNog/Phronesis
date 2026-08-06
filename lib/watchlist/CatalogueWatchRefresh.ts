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

const categoryByGame: Record<string, string> = {
  lorcana: "lorcana-en",
  magic: "magic-en",
  "magic the gathering": "magic-en",
  "magic: the gathering": "magic-en",
  "one piece": "onepiece-en",
  onepiece: "onepiece-en",
  pokemon: "pokemon-en",
  pokémon: "pokemon-en",
  riftbound: "riftbound-en",
};

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedFinish(value: string): string {
  const finish = normalized(value);
  return finish === "nonfoil" || finish === "regular" ? "normal" : finish;
}

function expectedSet(entry: WatchlistEntry): string {
  const collector = entry.assetIdentity.collectorNumber?.trim();
  if (!collector) return entry.assetIdentity.printing;
  return entry.assetIdentity.printing.replace(
    new RegExp(`\\s*#${collector.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s*$`, "i"),
    "",
  );
}

export type CatalogueWatchResolution =
  | { categoryId: string; match: SearchMatch; reconciled: boolean }
  | { categoryId: string | null; match: null; reason: string };

export function resolveCatalogueWatch(
  entry: WatchlistEntry,
  pricingRepository: PricingRepository,
): CatalogueWatchResolution {
  const categoryId = entry.assetIdentity.assetId.split(":")[0].includes("-en")
    ? entry.assetIdentity.assetId.split(":")[0]
    : categoryByGame[normalized(entry.assetIdentity.game)] ?? null;
  if (!categoryId) {
    return { categoryId: null, match: null, reason: "The watch game has no registered pricing catalogue." };
  }
  const exact = pricingRepository.findBySku(categoryId, entry.assetIdentity.printingId);
  if (exact) return { categoryId, match: exact, reconciled: false };

  const candidatesByName =
    typeof pricingRepository.findByName === "function"
      ? pricingRepository.findByName(categoryId, entry.assetIdentity.name)
      : (() => {
          const response = pricingRepository.search(categoryId, entry.assetIdentity.name);
          return [...response.singles, ...response.sealed];
        })();
  const identityCandidates = candidatesByName.filter((candidate) => {
    const expectedProductType = normalized(entry.finish) === "sealed" ? "SEALED" : "SINGLE";
    return (
      candidate.productType === expectedProductType &&
      normalized(candidate.name) === normalized(entry.assetIdentity.name) &&
      (!entry.assetIdentity.collectorNumber ||
        normalized(candidate.collectorNumber) === normalized(entry.assetIdentity.collectorNumber)) &&
      normalized(candidate.language) === normalized(entry.language) &&
      (candidate.productType === "SEALED" ||
        normalizedFinish(candidate.variant) === normalizedFinish(entry.finish))
    );
  });
  const exactSetCandidates = identityCandidates.filter(
    (candidate) => normalized(candidate.setName) === normalized(expectedSet(entry)),
  );
  const candidates = exactSetCandidates.length > 0 ? exactSetCandidates : identityCandidates;
  if (candidates.length !== 1) {
    return {
      categoryId,
      match: null,
      reason:
        candidates.length > 1
          ? "More than one catalogue product matches this legacy watch; identity was not guessed."
          : "No exact catalogue product matches this watch identity.",
    };
  }
  return { categoryId, match: candidates[0], reconciled: true };
}

export function reconcileWatchIdentity(
  entry: WatchlistEntry,
  match: SearchMatch,
): WatchlistEntry {
  return {
    ...entry,
    assetIdentity: {
      ...entry.assetIdentity,
      assetId: `${match.categoryId}:${match.sku}`,
      collectorNumber: match.collectorNumber ?? undefined,
      printing: [match.setName, match.collectorNumber ? `#${match.collectorNumber}` : null]
        .filter(Boolean)
        .join(" "),
      printingId: match.sku,
      providerProductIdentifier: match.sku,
      variantId: `${match.sku}:${match.productType === "SEALED" ? "Sealed" : match.variant}`,
    },
    finish: match.productType === "SEALED" ? "Sealed" : match.variant,
  };
}

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
