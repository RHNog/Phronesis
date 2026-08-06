import { JustTCGProvider } from "@/lib/providers/justtcg/JustTCGProvider";
import type { JustTCGKnownCardContext, JustTCGNormalizedResponse } from "@/lib/providers/justtcg/JustTCGNormalizer";
import type { MarketEvidenceRepository } from "@/lib/market/MarketEvidenceRepository";
import type { WatchlistRepository } from "@/lib/watchlist/WatchlistRepository";

type Environment = Readonly<Record<string, string | undefined>>;

export type WatchEnrichmentResult = {
  status: "DISABLED" | "COMPLETE" | "PARTIAL";
  attempted: number;
  enriched: number;
  skipped: number;
  reason?: string;
};

export function getJustTCGWatchEnrichmentConfig(environment: Environment = process.env) {
  const requested = Number(environment.PHRONESIS_JUSTTCG_WATCH_REQUEST_BUDGET ?? 10);
  return {
    enabled: environment.PHRONESIS_JUSTTCG_WATCH_ENRICHMENT?.trim().toUpperCase() === "ENABLED" && Boolean(environment.JUSTTCG_API_KEY?.trim()),
    requestBudget: Number.isInteger(requested) ? Math.min(25, Math.max(1, requested)) : 10,
    reason: !environment.JUSTTCG_API_KEY?.trim()
      ? "JUSTTCG_API_KEY is absent."
      : environment.PHRONESIS_JUSTTCG_WATCH_ENRICHMENT?.trim().toUpperCase() !== "ENABLED"
        ? "PHRONESIS_JUSTTCG_WATCH_ENRICHMENT is not ENABLED."
        : undefined,
  };
}

function normalized(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function selectVariant(response: JustTCGNormalizedResponse, context: JustTCGKnownCardContext) {
  const card = response.cards.find((candidate) =>
    normalized(candidate.name) === normalized(context.cardName) &&
    (!context.collectorNumber || context.collectorNumber === "unknown" || normalized(candidate.number) === normalized(context.collectorNumber)),
  );
  if (!card) return null;
  return card.variants.find((variant) =>
    (context.providerVariantIdentifier && variant.tcgplayerSkuId === context.providerVariantIdentifier) ||
    (normalized(variant.condition) === normalized(context.condition) &&
      normalized(variant.printing) === normalized(context.finish) &&
      (!variant.language || normalized(variant.language) === normalized(context.language))),
  ) ?? null;
}

export async function enrichWatchedCategoryWithJustTCG(input: {
  categoryId: string;
  evidenceRepository: MarketEvidenceRepository;
  watchlistRepository: WatchlistRepository;
  environment?: Environment;
  execute?: (context: JustTCGKnownCardContext) => Promise<JustTCGNormalizedResponse>;
}): Promise<WatchEnrichmentResult> {
  const configuration = getJustTCGWatchEnrichmentConfig(input.environment);
  if (!configuration.enabled) {
    return { status: "DISABLED", attempted: 0, enriched: 0, skipped: 0, reason: configuration.reason };
  }
  const provider = input.execute ? null : new JustTCGProvider();
  const execute = input.execute ?? (async (context: JustTCGKnownCardContext) => {
    const result = await provider!.executeKnownCard(context);
    if (!result.data) throw new Error("JustTCG returned no normalized watch enrichment.");
    return result.data;
  });
  const candidates = input.watchlistRepository
    .listEnrichmentCandidates(input.categoryId)
    .slice(0, configuration.requestBudget);
  let attempted = 0;
  let enriched = 0;
  let skipped = 0;
  for (const candidate of candidates) {
    attempted += 1;
    const entry = candidate.entry;
    const context: JustTCGKnownCardContext = {
      cardName: entry.assetIdentity.name,
      collectorNumber: entry.assetIdentity.collectorNumber,
      condition: entry.condition,
      finish: entry.finish,
      game: entry.assetIdentity.game,
      includePriceHistory: true,
      language: entry.language,
      limit: 5,
      printing: entry.assetIdentity.printing,
      printingId: entry.assetIdentity.printingId,
      providerProductIdentifier: entry.assetIdentity.providerProductIdentifier,
      providerVariantIdentifier: entry.assetIdentity.providerVariantIdentifier,
      variantId: entry.assetIdentity.variantId,
    };
    try {
      const response = await execute(context);
      const variant = selectVariant(response, context);
      if (!variant || variant.currentPriceUsd === null) {
        skipped += 1;
        continue;
      }
      const observedAt = variant.lastUpdatedAt ?? response.synchronizedAt;
      input.evidenceRepository.recordMarketEstimate(candidate.principal, {
        entryId: entry.id,
        externalKey: `${variant.variantUuid}:${observedAt}`,
        providerId: "justtcg",
        priceCents: Math.round(variant.currentPriceUsd * 100),
        condition: variant.condition,
        observedAt,
        provenance: "Official JustTCG SDK variant valuation; not an active listing or completed sale.",
      });
      enriched += 1;
      const remaining = response.usage.apiDailyRequestsRemaining;
      if (typeof remaining === "number" && remaining <= 1) break;
    } catch {
      skipped += 1;
    }
  }
  return {
    status: skipped > 0 ? "PARTIAL" : "COMPLETE",
    attempted,
    enriched,
    skipped,
  };
}
