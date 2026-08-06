import type { MarketSnapshotRequestContext } from "@/lib/market/MarketIntelligenceRepository";
import type {
  MarketIntelligenceRepositorySnapshot,
  MarketProviderEvidence,
} from "@/lib/market/MarketSnapshot";
import type {
  MarketSnapshotField,
  MarketSnapshotFreshness,
} from "@/lib/market/MarketSnapshotMetadata";
import { getFieldFreshness } from "@/lib/market/MarketFreshness";
import { getMarketRefreshPolicy } from "@/lib/market/MarketRefreshPolicy";
import {
  capabilityRegistry,
  type CapabilityRegistry,
} from "@/lib/market/ontology/CapabilityRegistry";
import type { EvidenceCapabilityStatus } from "@/lib/market/ontology/EvidenceCapability";
import type { EvidenceDomainId } from "@/lib/market/ontology/EvidenceDomain";
import { getProviderCapabilityForDomain } from "@/lib/market/ontology/ProviderCapability";

export type EvidenceCoverageStatus =
  | "Complete"
  | "Expired"
  | "Missing"
  | "Partial"
  | "Stale"
  | "Unsupported";

export interface EvidenceDomainCoverageEntry {
  domainId: EvidenceDomainId;
  domainName: string;
  evidenceFields: MarketSnapshotField[];
  freshness: MarketSnapshotFreshness;
  providerNames: string[];
  status: EvidenceCoverageStatus;
}

export interface EvidenceCoverageMap {
  asset: {
    assetIdentity: string;
    condition: string;
    finish: string;
    printingId: string;
  };
  coverage: EvidenceDomainCoverageEntry[];
  missingDomains: EvidenceDomainId[];
  refreshableDomains: EvidenceDomainId[];
  unsupportedDomains: EvidenceDomainId[];
}

export interface EvidenceRefreshDiagnostics {
  asset: EvidenceCoverageMap["asset"];
  coverage: EvidenceDomainCoverageEntry[];
  freshness: Record<string, MarketSnapshotFreshness>;
  mergeResult: string;
  missingEvidence: EvidenceDomainId[];
  providersQueried: string[];
  providersSkipped: {
    providerName: string;
    reason: string;
  }[];
}

const domainFields: Record<EvidenceDomainId, MarketSnapshotField[]> = {
  "historical-pricing": ["marketPrice"],
  "inventory-intelligence": ["listingCount"],
  "listing-intelligence": ["lowestListing", "listingCount", "spread"],
  "market-confidence": ["marketConfidence"],
  "market-liquidity": ["liquidity"],
  "price-trend": ["volatility"],
  "provider-metadata": [
    "cardMetadata",
    "printingMetadata",
    "providerCapabilities",
    "providerHealth",
  ],
  "transaction-intelligence": ["recentSales", "salesVelocity"],
  "variant-valuation": ["marketPrice"],
  volatility: ["volatility"],
};

const providerPreferenceByDomain: Record<EvidenceDomainId, string[]> = {
  "historical-pricing": ["justtcg", "tcgplayer", "scryfall-market"],
  "inventory-intelligence": ["tcgplayer"],
  "listing-intelligence": ["tcgplayer"],
  "market-confidence": ["justtcg", "tcgplayer", "scryfall-market"],
  "market-liquidity": ["tcgplayer", "justtcg"],
  "price-trend": ["justtcg", "tcgplayer"],
  "provider-metadata": ["justtcg", "tcgplayer", "scryfall-market"],
  "transaction-intelligence": ["tcgplayer"],
  "variant-valuation": ["justtcg", "tcgplayer", "scryfall-market"],
  volatility: ["justtcg", "tcgplayer"],
};

function isConnectedCapability(status: EvidenceCapabilityStatus) {
  return status === "SUPPORTED" || status === "PARTIAL";
}

function getEvidenceFreshness(
  evidence: MarketProviderEvidence,
  field: MarketSnapshotField,
  now = new Date(),
): MarketSnapshotFreshness {
  const policy = getMarketRefreshPolicy(field);
  const retrievedAtMs = new Date(evidence.retrievedAt).getTime();

  if (Number.isNaN(retrievedAtMs)) {
    return "Missing";
  }

  return getFieldFreshness({
    expiresAt: new Date(retrievedAtMs + policy.ttlMs).toISOString(),
    lastRefresh: evidence.retrievedAt,
    now,
  });
}

function getDomainFreshness(
  evidence: MarketProviderEvidence[],
  domainId: EvidenceDomainId,
  now = new Date(),
): MarketSnapshotFreshness {
  const fields = domainFields[domainId];
  const freshnessValues = evidence.map((item) =>
    getEvidenceFreshness(item, fields.includes(item.field) ? item.field : fields[0], now),
  );

  if (freshnessValues.includes("Fresh")) {
    return "Fresh";
  }

  if (freshnessValues.includes("Stale")) {
    return "Stale";
  }

  if (freshnessValues.includes("Expired")) {
    return "Expired";
  }

  return "Missing";
}

function evidenceHasHistoricalPricing(evidence: MarketProviderEvidence) {
  return evidence.rawObservations?.some((observation) =>
    observation.providerField.startsWith("variant.priceHistory") ||
    observation.providerField.startsWith("priceHistory"),
  ) ?? false;
}

function evidenceHasProviderMetadata(evidence: MarketProviderEvidence) {
  return evidence.rawObservations?.some((observation) =>
    observation.providerField.startsWith("provider."),
  ) ?? false;
}

function evidenceMatchesDomain(
  evidence: MarketProviderEvidence,
  domainId: EvidenceDomainId,
) {
  if (domainId === "historical-pricing") {
    return evidenceHasHistoricalPricing(evidence);
  }

  if (domainId === "price-trend") {
    return evidence.field === "volatility" || evidenceHasHistoricalPricing(evidence);
  }

  if (domainId === "provider-metadata") {
    return evidenceHasProviderMetadata(evidence) || domainFields[domainId].includes(evidence.field);
  }

  return domainFields[domainId].includes(evidence.field);
}

function providerCapabilityStatus(input: {
  domainId: EvidenceDomainId;
  providerName: string;
  registry: CapabilityRegistry;
}) {
  const provider = input.registry.getProvider(input.providerName);

  if (!provider || provider.connectionStatus !== "CONNECTED") {
    return "UNKNOWN" as const;
  }

  return getProviderCapabilityForDomain(provider, input.domainId).status;
}

function getConnectedProviderCapabilityStatuses(
  domainId: EvidenceDomainId,
  registry: CapabilityRegistry,
) {
  return registry
    .getProviders()
    .filter((provider) => provider.connectionStatus === "CONNECTED")
    .map((provider) =>
      getProviderCapabilityForDomain(provider, domainId).status,
    )
    .filter(isConnectedCapability);
}

function calculateDomainStatus(input: {
  domainEvidence: MarketProviderEvidence[];
  domainId: EvidenceDomainId;
  freshness: MarketSnapshotFreshness;
  registry: CapabilityRegistry;
}): EvidenceCoverageStatus {
  const connectedCapabilityStatuses = getConnectedProviderCapabilityStatuses(
    input.domainId,
    input.registry,
  );

  if (connectedCapabilityStatuses.length === 0) {
    return "Unsupported";
  }

  if (input.domainEvidence.length === 0) {
    return "Missing";
  }

  const hasSupportedEvidence = input.domainEvidence.some(
    (evidence) =>
      providerCapabilityStatus({
        domainId: input.domainId,
        providerName: evidence.providerName,
        registry: input.registry,
      }) === "SUPPORTED",
  );

  if (!hasSupportedEvidence) {
    return "Partial";
  }

  if (input.freshness === "Expired") {
    return "Expired";
  }

  if (input.freshness === "Stale") {
    return "Stale";
  }

  if (input.freshness === "Fresh") {
    return "Complete";
  }

  return "Missing";
}

export function createEvidenceCoverageMap(input: {
  context: MarketSnapshotRequestContext;
  now?: Date;
  registry?: CapabilityRegistry;
  snapshot: MarketIntelligenceRepositorySnapshot | null;
}): EvidenceCoverageMap {
  const registry = input.registry ?? capabilityRegistry;
  const allDomains = registry.getDomains();
  const evidenceStack = input.snapshot?.evidence ?? [];
  const coverage = allDomains.map((domain) => {
    const domainEvidence = evidenceStack.filter((evidence) =>
      evidenceMatchesDomain(evidence, domain.id),
    );
    const freshness = getDomainFreshness(domainEvidence, domain.id, input.now);
    const status = calculateDomainStatus({
      domainEvidence,
      domainId: domain.id,
      freshness,
      registry,
    });

    return {
      domainId: domain.id,
      domainName: domain.name,
      evidenceFields: [...new Set(domainEvidence.map((evidence) => evidence.field))],
      freshness,
      providerNames: [
        ...new Set(domainEvidence.map((evidence) => evidence.providerName)),
      ],
      status,
    };
  });
  const missingDomains = coverage
    .filter((entry) =>
      ["Expired", "Missing", "Partial", "Stale"].includes(entry.status),
    )
    .map((entry) => entry.domainId);
  const unsupportedDomains = coverage
    .filter((entry) => entry.status === "Unsupported")
    .map((entry) => entry.domainId);

  return {
    asset: {
      assetIdentity: input.context.cardIdentity,
      condition: input.context.condition ?? "NM",
      finish: input.context.finish ?? "Unknown",
      printingId: input.context.printingId,
    },
    coverage,
    missingDomains,
    refreshableDomains: missingDomains.filter(
      (domainId) => !unsupportedDomains.includes(domainId),
    ),
    unsupportedDomains,
  };
}

export function getFieldsForEvidenceDomains(domainIds: EvidenceDomainId[]) {
  return [
    ...new Set(domainIds.flatMap((domainId) => domainFields[domainId] ?? [])),
  ];
}

export function getEvidenceDomainsForFields(fields: MarketSnapshotField[]) {
  return (Object.keys(domainFields) as EvidenceDomainId[]).filter((domainId) =>
    domainFields[domainId].some((field) => fields.includes(field)),
  );
}

export function getPreferredProvidersForEvidenceDomains(
  domainIds: EvidenceDomainId[],
) {
  return [
    ...new Set(
      domainIds
        .map((domainId) =>
          (providerPreferenceByDomain[domainId] ?? []).find((providerId) => {
            const provider = capabilityRegistry.getProvider(providerId);

            if (!provider || provider.connectionStatus !== "CONNECTED") {
              return false;
            }

            const capability = getProviderCapabilityForDomain(provider, domainId);

            return capability.status === "SUPPORTED" || capability.status === "PARTIAL";
          }),
        )
        .filter((providerId): providerId is string => Boolean(providerId)),
    ),
  ];
}

export function createEvidenceRefreshDiagnostics(input: {
  coverageMap: EvidenceCoverageMap;
  mergeResult: string;
  providersQueried: string[];
  providersSkipped: EvidenceRefreshDiagnostics["providersSkipped"];
}): EvidenceRefreshDiagnostics {
  return {
    asset: input.coverageMap.asset,
    coverage: input.coverageMap.coverage,
    freshness: Object.fromEntries(
      input.coverageMap.coverage.map((entry) => [
        entry.domainName,
        entry.freshness,
      ]),
    ),
    mergeResult: input.mergeResult,
    missingEvidence: input.coverageMap.missingDomains,
    providersQueried: input.providersQueried,
    providersSkipped: input.providersSkipped,
  };
}
