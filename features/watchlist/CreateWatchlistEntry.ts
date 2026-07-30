import type { CardImageUrls } from "@/components/cards/CardImageCache";
import {
  calculateWatchlistMetrics,
  type WatchlistEntry,
} from "@/features/watchlist/WatchlistRefreshEngine";
import { treatmentFromFinish } from "@/lib/engines/identity/IdentityTreatmentResolver";
import { explicitEvidence } from "@/lib/engines/identity/IdentityOntology";
import type {
  PriceState,
  PricingCondition,
  SearchMatch,
} from "@/lib/pricing/types";

const conditionCodes: Record<PricingCondition, string> = {
  NEAR_MINT: "NM",
  LIGHTLY_PLAYED: "LP",
  MODERATELY_PLAYED: "MP",
  HEAVILY_PLAYED: "HP",
  DAMAGED: "DMG",
};

const gameNames: Record<string, string> = {
  "magic-en": "Magic",
  "pokemon-en": "Pokemon",
  "onepiece-en": "One Piece",
  "lorcana-en": "Lorcana",
  "riftbound-en": "Riftbound",
};

function normalizedFinish(value: string): string {
  return value.trim().toLowerCase() === "nonfoil" ? "Normal" : value.trim();
}

export function watchlistEntryKey(
  match: SearchMatch,
  condition: PricingCondition,
): string {
  const conditionKey = match.productType === "SEALED" ? "UNOPENED" : condition;
  return `${match.categoryId}:${match.sku}:${conditionKey}:${match.language}`;
}

export function createSnapshotWatchlistEntry(input: {
  artwork?: CardImageUrls;
  condition: PricingCondition;
  match: SearchMatch;
  price: PriceState | null;
}): WatchlistEntry {
  const { match, price } = input;
  const finish =
    match.productType === "SEALED" ? "Sealed" : normalizedFinish(match.variant);
  const condition =
    match.productType === "SEALED"
      ? "Unopened"
      : conditionCodes[input.condition];
  const valuationCents =
    price?.marketPriceCents ?? price?.deliveredPriceCents ?? null;
  const observedAt = price?.snapshotDate ?? null;
  const imageUrl =
    input.artwork?.normal ??
    input.artwork?.large ??
    input.artwork?.small ??
    match.imageUrl ??
    undefined;
  return calculateWatchlistMetrics({
    assetIdentity: {
      assetId: `${match.categoryId}:${match.sku}`,
      collectorNumber: match.collectorNumber ?? undefined,
      game: gameNames[match.categoryId] ?? match.categoryId,
      image: imageUrl
        ? {
            source: input.artwork ? "Provider" : "Repository",
            urls: { ...input.artwork, normal: imageUrl },
          }
        : undefined,
      name: match.name,
      printing: [
        match.setName,
        match.collectorNumber ? `#${match.collectorNumber}` : null,
      ]
        .filter(Boolean)
        .join(" "),
      printingId: match.sku,
      providerProductIdentifier: match.sku,
      providerVariantIdentifier: price?.sourceSku ?? match.sku,
      variantId: `${match.sku}:${finish}`,
    },
    condition,
    currentValuation: valuationCents === null ? null : valuationCents / 100,
    developerDiagnostics: {
      apiSaved: true,
      cacheAgeMs: observedAt
        ? Math.max(0, Date.now() - new Date(observedAt).getTime())
        : null,
      observationAgeMs: observedAt
        ? Math.max(0, Date.now() - new Date(observedAt).getTime())
        : null,
      providerHit: false,
      replay: false,
      repositoryHit: true,
      repositorySource: "Verified pricing catalogue snapshot",
    },
    finish,
    id: watchlistEntryKey(match, input.condition),
    language: match.language,
    lastObservation: observedAt,
    lastRefresh: observedAt,
    marketTrend: "Unknown",
    observationSource: observedAt ? "Repository" : "Unavailable",
    physicalFinish: {
      evidence: explicitEvidence(
        "tcgplayer-catalogue",
        "variant",
        "The verified catalogue variant identifies the tracked physical finish.",
        95,
      ),
      value: finish,
    },
    refreshStatus: observedAt ? "Repository Reused" : "Idle",
    targetPrice: 0,
    treatment: treatmentFromFinish(finish),
    watchlistId: "default",
  });
}
