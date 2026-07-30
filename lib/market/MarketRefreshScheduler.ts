import { JustTCGProvider } from "@/lib/providers/justtcg/JustTCGProvider";
import { TCGplayerIntelligenceProvider } from "@/lib/providers/market/TCGplayerIntelligenceProvider";
import { ScryfallMarketProvider } from "@/lib/providers/market/ScryfallMarketProvider";
import {
  marketIntelligenceRepository,
  type MarketSnapshotRequestContext,
  type MarketIntelligenceRepository,
} from "@/lib/market/MarketIntelligenceRepository";
import { marketTruthEngine } from "@/lib/market/MarketTruthEngine";
import type {
  MarketIntelligenceRepositorySnapshot,
  MarketSnapshotFieldValues,
} from "@/lib/market/MarketSnapshot";
import type { MarketSnapshotField } from "@/lib/market/MarketSnapshotMetadata";
import { marketSnapshotFields } from "@/lib/market/MarketRefreshPolicy";
import {
  createEvidenceCoverageMap,
  createEvidenceRefreshDiagnostics,
  getEvidenceDomainsForFields,
  getFieldsForEvidenceDomains,
  getPreferredProvidersForEvidenceDomains,
  type EvidenceRefreshDiagnostics,
} from "@/lib/market/EvidenceCoverageMap";
import { capabilityRegistry } from "@/lib/market/ontology/CapabilityRegistry";
import type { EvidenceDomainId } from "@/lib/market/ontology/EvidenceDomain";
import { getProviderCapabilityForDomain } from "@/lib/market/ontology/ProviderCapability";
import type { MarketSnapshot } from "@/types/marketSnapshot";

export interface MarketSnapshotProviderClient {
  getMarketSnapshot(input: {
    cardName: string;
    condition?: string;
    game?: string;
    printingId: string;
    variantId: string;
  }): Promise<MarketSnapshot>;
}

export interface PrintingMarketSnapshotProviderClient {
  getMarketSnapshot(
    printingId: string,
    variantId: string,
  ): Promise<MarketSnapshot>;
}

export interface MarketRepositoryReadResult {
  diagnostics: EvidenceRefreshDiagnostics;
  fieldsRefreshed: MarketSnapshotField[];
  freshness: ReturnType<MarketIntelligenceRepository["getFreshness"]>;
  repositorySnapshot: MarketIntelligenceRepositorySnapshot;
  source: "Repository" | "Provider" | "RepositoryStale";
}

function mapProviderSnapshotToValues(
  snapshot: MarketSnapshot,
): MarketSnapshotFieldValues {
  const evidence = snapshot.marketIntelligence;

  return {
    listingCount: evidence?.listingCount ?? null,
    liquidity: evidence?.liquidity ?? null,
    lowestListing:
      evidence?.lowestListing ??
      snapshot.prices.find((price) => price.priceType === "lowest_known")?.price ??
      null,
    marketConfidence:
      evidence?.marketConfidence ??
      snapshot.prices.find((price) => price.priceType === "market_estimate")
        ?.confidence ??
      snapshot.prices.find((price) => price.priceType === "variant_valuation")
        ?.confidence ??
      null,
    marketPrice:
      evidence?.marketPrice ??
      snapshot.prices.find((price) => price.priceType === "market_estimate")?.price ??
      snapshot.prices.find((price) => price.priceType === "variant_valuation")?.price ??
      null,
    providerId: snapshot.providerId,
    recentSales: evidence?.recentSalesCount ?? null,
    salesVelocity: evidence?.salesVelocity ?? null,
    spread: evidence?.spread ?? null,
    volatility: evidence?.volatility ?? null,
  };
}

function getProviderBackedFields(fields: MarketSnapshotField[]) {
  return fields.filter((field) =>
    [
      "cardMetadata",
      "printingMetadata",
      "marketPrice",
      "lowestListing",
      "listingCount",
      "recentSales",
      "spread",
      "liquidity",
      "salesVelocity",
      "volatility",
      "marketConfidence",
      "providerHealth",
      "providerCapabilities",
    ].includes(field),
  );
}

function canProviderAnswerAnyEvidenceDomain(input: {
  domainIds: EvidenceDomainId[];
  providerIdOrName: string;
}) {
  const provider = capabilityRegistry.getProvider(input.providerIdOrName);

  if (!provider || provider.connectionStatus !== "CONNECTED") {
    return false;
  }

  return input.domainIds.some((domainId) => {
    const capability = getProviderCapabilityForDomain(provider, domainId);

    return capability.status === "SUPPORTED" || capability.status === "PARTIAL";
  });
}

export class MarketRefreshScheduler {
  constructor(
    private readonly repository = marketIntelligenceRepository,
    private readonly justTcgProvider: MarketSnapshotProviderClient =
      new JustTCGProvider(),
    private readonly tcgplayerProvider: PrintingMarketSnapshotProviderClient =
      new TCGplayerIntelligenceProvider(),
    private readonly scryfallProvider: PrintingMarketSnapshotProviderClient =
      new ScryfallMarketProvider(),
  ) {}

  async getSnapshot(
    context: MarketSnapshotRequestContext,
  ): Promise<MarketRepositoryReadResult> {
    const snapshot = this.repository.getSnapshot(context);
    const freshness = this.repository.getFreshness(context, marketSnapshotFields);
    const coverageMap = createEvidenceCoverageMap({
      context,
      snapshot,
    });

    if (
      snapshot &&
      freshness.state === "Fresh" &&
      coverageMap.refreshableDomains.length === 0
    ) {
      this.repository.recordHit();
      return {
        diagnostics: createEvidenceRefreshDiagnostics({
          coverageMap,
          mergeResult: "Skipped provider refresh because freshness and coverage are satisfied.",
          providersQueried: [],
          providersSkipped: this.createProviderSkipDiagnostics(
            coverageMap.refreshableDomains,
          ),
        }),
        fieldsRefreshed: [],
        freshness,
        repositorySnapshot: snapshot,
        source: "Repository",
      };
    }

    if (snapshot && freshness.state === "Stale") {
      this.repository.recordHit();
      const fieldsToRefresh = [
        ...new Set([
          ...freshness.staleFields,
          ...getFieldsForEvidenceDomains(coverageMap.refreshableDomains),
        ]),
      ];

      this.refreshFields(context, fieldsToRefresh).catch(() => undefined);

      return {
        diagnostics: createEvidenceRefreshDiagnostics({
          coverageMap,
          mergeResult:
            "Returned stale repository snapshot while missing or stale evidence refreshes asynchronously.",
          providersQueried: [],
          providersSkipped: this.createProviderSkipDiagnostics(
            coverageMap.refreshableDomains,
          ),
        }),
        fieldsRefreshed: [],
        freshness,
        repositorySnapshot: snapshot,
        source: "RepositoryStale",
      };
    }

    this.repository.recordMiss();
    const fieldsToRefresh = snapshot
      ? [
          ...new Set([
            ...freshness.missingFields,
            ...freshness.expiredFields,
            ...getFieldsForEvidenceDomains(coverageMap.refreshableDomains),
          ]),
        ]
      : marketSnapshotFields;
    const refresh = await this.refreshFields(context, fieldsToRefresh, coverageMap);

    return {
      diagnostics: refresh.diagnostics,
      fieldsRefreshed: getProviderBackedFields(fieldsToRefresh),
      freshness: this.repository.getFreshness(context, marketSnapshotFields),
      repositorySnapshot: refresh.snapshot,
      source: "Provider",
    };
  }

  async refreshFields(
    context: MarketSnapshotRequestContext,
    fields: MarketSnapshotField[],
    coverageMap = createEvidenceCoverageMap({
      context,
      snapshot: this.repository.getSnapshot(context),
    }),
  ) {
    const fieldsToRefresh = getProviderBackedFields(fields);
    const startedAt = Date.now();
    const existingSnapshot = this.repository.getSnapshot(context);
    const domainsToRefresh = getEvidenceDomainsForFields(fieldsToRefresh);
    const providerFetch = await this.fetchProviderSnapshots(
      context,
      domainsToRefresh,
    );
    const providerSnapshots = providerFetch.snapshots;
    const validatedSnapshots = providerSnapshots
      .map((snapshot) => ({
        snapshot,
        validation: marketTruthEngine.evaluate({
          context,
          snapshot,
        }),
      }))
      .filter((result) => result.validation.report.valid);

    if (validatedSnapshots.length === 0) {
      if (existingSnapshot) {
        return {
          diagnostics: createEvidenceRefreshDiagnostics({
            coverageMap,
            mergeResult:
              providerSnapshots.length === 0
                ? "No provider request was available for missing evidence domains; existing snapshot returned."
                : "Provider responses produced no valid evidence; existing snapshot returned.",
            providersQueried: providerFetch.providersQueried,
            providersSkipped: providerFetch.providersSkipped,
          }),
          snapshot: existingSnapshot,
        };
      }

      throw new Error("Provider response rejected: no valid market evidence was available.");
    }

    const primarySnapshot = validatedSnapshots[0].snapshot;
    const refreshed = this.repository.upsertSnapshot({
      context,
      refresh: {
        evidence: validatedSnapshots.flatMap((result) => result.validation.evidence),
        fields: fieldsToRefresh,
        providerId: primarySnapshot.providerId,
        refreshedAt: new Date().toISOString(),
        refreshTimeMs: Date.now() - startedAt,
        values: mapProviderSnapshotToValues(primarySnapshot),
      },
    });

    return {
      diagnostics: createEvidenceRefreshDiagnostics({
        coverageMap: createEvidenceCoverageMap({
          context,
          snapshot: refreshed,
        }),
        mergeResult: `Merged ${validatedSnapshots.length} provider response(s) into repository evidence.`,
        providersQueried: providerFetch.providersQueried,
        providersSkipped: providerFetch.providersSkipped,
      }),
      snapshot: refreshed,
    };
  }

  private async fetchProviderSnapshots(
    context: MarketSnapshotRequestContext,
    domainIds: EvidenceDomainId[],
  ) {
    const snapshots: MarketSnapshot[] = [];
    const providersQueried: string[] = [];
    const providersSkipped: EvidenceRefreshDiagnostics["providersSkipped"] = [];
    const visitedProviders = new Set<object>();
    const preferredProviders = getPreferredProvidersForEvidenceDomains(domainIds);

    if (
      context.cardIdentity &&
      !visitedProviders.has(this.justTcgProvider) &&
      preferredProviders.includes("justtcg") &&
      canProviderAnswerAnyEvidenceDomain({
        domainIds,
        providerIdOrName: "justtcg",
      })
    ) {
      visitedProviders.add(this.justTcgProvider);
      providersQueried.push("JustTCG");
      const justTcgSnapshot = await this.justTcgProvider.getMarketSnapshot({
        cardName: context.cardIdentity,
        condition: context.condition,
        game: context.game,
        printingId: context.printingId,
        variantId: context.variantId,
      });

      if (justTcgSnapshot.prices.length > 0 && !justTcgSnapshot.priceMissing) {
        snapshots.push(justTcgSnapshot);
      }
    } else {
      providersSkipped.push({
        providerName: "JustTCG",
        reason: context.cardIdentity
          ? "No missing evidence domain requires JustTCG."
          : "Card identity is required before JustTCG can be queried.",
      });
    }

    if (
      !visitedProviders.has(this.tcgplayerProvider) &&
      preferredProviders.includes("tcgplayer") &&
      canProviderAnswerAnyEvidenceDomain({
        domainIds,
        providerIdOrName: "tcgplayer",
      })
    ) {
      visitedProviders.add(this.tcgplayerProvider);
      providersQueried.push("TCGplayer");
      const tcgplayerSnapshot = await this.tcgplayerProvider.getMarketSnapshot(
        context.printingId,
        context.variantId,
      );

      if (tcgplayerSnapshot.prices.length > 0 && !tcgplayerSnapshot.priceMissing) {
        snapshots.push(tcgplayerSnapshot);
      }
    } else {
      providersSkipped.push({
        providerName: "TCGplayer",
        reason: "No missing evidence domain requires TCGplayer.",
      });
    }

    if (
      !visitedProviders.has(this.scryfallProvider) &&
      preferredProviders.includes("scryfall-market") &&
      canProviderAnswerAnyEvidenceDomain({
        domainIds,
        providerIdOrName: "scryfall-market",
      })
    ) {
      visitedProviders.add(this.scryfallProvider);
      providersQueried.push("Scryfall Market Provider");
      const scryfallSnapshot = await this.scryfallProvider.getMarketSnapshot(
        context.printingId,
        context.variantId,
      );

      if (scryfallSnapshot.prices.length > 0 && !scryfallSnapshot.priceMissing) {
        snapshots.push(scryfallSnapshot);
      }
    } else {
      providersSkipped.push({
        providerName: "Scryfall Market Provider",
        reason: "No missing evidence domain requires Scryfall market data.",
      });
    }

    return {
      providersQueried,
      providersSkipped,
      snapshots,
    };
  }

  private createProviderSkipDiagnostics(domainIds: EvidenceDomainId[]) {
    const preferredProviders = getPreferredProvidersForEvidenceDomains(domainIds);

    return ["JustTCG", "TCGplayer", "Scryfall Market Provider"].map((providerName) => ({
      providerName,
      reason: preferredProviders.length
        ? "Provider refresh was not needed for this satisfied repository snapshot."
        : "No missing evidence domains were refreshable.",
    }));
  }
}

export const marketRefreshScheduler = new MarketRefreshScheduler();
