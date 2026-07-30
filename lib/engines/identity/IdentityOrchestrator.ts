import { resolveCanonicalTerms } from "@/lib/engines/canonical/resolveCanonicalTerms";
import { parseQuery } from "@/lib/engines/query/parseQuery";
import { createSearchQuery } from "@/lib/engines/search/searchCards";
import {
  searchIdentityCardsWithDiagnostics,
  type IdentitySearchResponse,
} from "@/lib/engines/search/searchIdentityCards";
import { resolveIntent } from "@/lib/engines/intent/resolveIntent";
import type { CanonicalIdentityModel } from "@/lib/engines/identity/IdentityProviderAdapter";
import type {
  IdentityOrchestrationStatus,
  IdentityProviderDiagnostics,
} from "@/lib/engines/identity/IdentityProviderDiagnostics";
import { IdentityProviderRegistry } from "@/lib/engines/identity/IdentityProviderRegistry";
import {
  selectIdentityProvider,
  type IdentitySearchContext,
} from "@/lib/engines/identity/IdentityProviderSelection";
import { FleshAndBloodIdentityProviderAdapter } from "@/lib/providers/identity/FleshAndBloodIdentityProviderAdapter";
import { LorcastProvider } from "@/lib/providers/lorcast/LorcastProvider";
import { TcgdexProvider } from "@/lib/providers/tcgdex/TcgdexProvider";
import { ScryfallIdentityProviderAdapter } from "@/lib/providers/identity/ScryfallIdentityProviderAdapter";
import type { SearchResult } from "@/types/searchResult";
import { identityMappingRepository } from "@/lib/engines/identity/IdentityMappingRepository";
import { BandaiOnePieceProvider } from "@/lib/providers/bandai/BandaiOnePieceProvider";

export type IdentityOrchestrationResponse = Omit<IdentitySearchResponse, "results"> & {
  message?: string;
  orchestrationDiagnostics: IdentityProviderDiagnostics;
  results: SearchResult<CanonicalIdentityModel>[];
  status: IdentityOrchestrationStatus;
};

export function createIdentityProviderRegistry() {
  return new IdentityProviderRegistry()
    .register(new ScryfallIdentityProviderAdapter())
    .register(new LorcastProvider())
    .register(new TcgdexProvider())
    .register(new BandaiOnePieceProvider())
    .register(new FleshAndBloodIdentityProviderAdapter());
}

export const identityProviderRegistry = createIdentityProviderRegistry();

function createEmptyIdentityResponse(raw: string, providerName: string): IdentitySearchResponse {
  const parsedQuery = parseQuery(raw);
  const canonicalResolution = resolveCanonicalTerms(parsedQuery);

  return {
    intent: resolveIntent(parsedQuery, []),
    parsedQuery,
    query: createSearchQuery(raw),
    results: [],
    diagnostics: {
      cacheStatus: "MISS",
      canonicalResolution,
      durationMs: 0,
      identityResolutionTimeMs: 0,
      providerName,
      printingResolutionTimeMs: 0,
      rawResponses: [],
      resolutionTimeMs: 0,
    },
  };
}

function providerMessage(status: IdentityOrchestrationStatus, game: string) {
  if (status === "RATE_LIMITED") return `${game} identity provider is rate limited. Please try again shortly.`;
  if (status === "MALFORMED_QUERY") return "The identity search query is malformed.";
  if (status === "NETWORK_FAILURE") return `${game} identity provider could not be reached.`;
  if (status === "PROVIDER_PENDING") return `${game} provider not yet connected.`;
  if (status === "PROVIDER_NOT_CONFIGURED") return `${game} provider is not configured.`;
  if (status === "PROVIDER_OFFLINE") return `${game} identity provider is temporarily offline.`;
  if (status === "NO_MATCH") return "No matching collectible found.";
  return undefined;
}

export class IdentityOrchestrator {
  constructor(private readonly registry: IdentityProviderRegistry = identityProviderRegistry) {}

  async search(input: string | IdentitySearchContext): Promise<IdentityOrchestrationResponse> {
    const context = typeof input === "string" ? { query: input } : input;
    const parsed = parseQuery(context.query);
    const selection = selectIdentityProvider(this.registry, {
      ...context,
      game: context.game ?? parsed.game,
    });
    const startedAt = Date.now();
    const provider = selection.provider;

    if (!provider) {
      const response = createEmptyIdentityResponse(context.query, "Not configured");
      const status = "PROVIDER_NOT_CONFIGURED" as const;
      return {
        ...response,
        message: providerMessage(status, selection.game),
        orchestrationDiagnostics: {
          canonicalIdentities: [],
          fallbackProvider: selection.fallbackProvider,
          game: selection.game,
          lifecycle: "NOT_CONFIGURED",
          normalizationSource: "None",
          providerConfidence: 0,
          searchLatencyMs: Date.now() - startedAt,
          selectionReason: selection.reason,
          status,
        },
        results: [],
        status,
      };
    }

    if (provider.capability.lifecycle !== "OPERATIONAL") {
      const response = createEmptyIdentityResponse(context.query, provider.name);
      const status = provider.capability.lifecycle === "PENDING_CONNECTION"
        ? "PROVIDER_PENDING" as const
        : "PROVIDER_OFFLINE" as const;
      return {
        ...response,
        message: providerMessage(status, selection.game),
        orchestrationDiagnostics: {
          canonicalIdentities: [],
          fallbackProvider: selection.fallbackProvider,
          game: selection.game,
          lifecycle: provider.capability.lifecycle,
          normalizationSource: provider.adapter.normalizationSource,
          providerConfidence: 0,
          providerId: provider.id,
          providerSelected: provider.name,
          searchLatencyMs: Date.now() - startedAt,
          selectionReason: selection.reason,
          status,
        },
        results: [],
        status,
      };
    }

    let response: IdentitySearchResponse;
    try {
      response = await searchIdentityCardsWithDiagnostics(context.query, provider);
    } catch {
      const offlineResponse = createEmptyIdentityResponse(context.query, provider.name);
      const status = "PROVIDER_OFFLINE" as const;
      return {
        ...offlineResponse,
        message: providerMessage(status, selection.game),
        orchestrationDiagnostics: {
          canonicalIdentities: [],
          fallbackProvider: selection.fallbackProvider,
          game: selection.game,
          lifecycle: "TEMPORARILY_OFFLINE",
          normalizationSource: provider.adapter.normalizationSource,
          providerConfidence: 0,
          providerId: provider.id,
          providerSelected: provider.name,
          searchLatencyMs: Date.now() - startedAt,
          selectionReason: selection.reason,
          status,
        },
        results: [],
        status,
      };
    }
    const providerErrorKind = response.diagnostics.providerErrorKind;
    const status: IdentityOrchestrationStatus = providerErrorKind === "RATE_LIMITED"
      ? "RATE_LIMITED"
      : providerErrorKind === "MALFORMED_QUERY"
        ? "MALFORMED_QUERY"
        : providerErrorKind === "NETWORK_FAILURE"
          ? "NETWORK_FAILURE"
          : providerErrorKind === "PROVIDER_OFFLINE"
            ? "PROVIDER_OFFLINE"
            : response.results.length
              ? "OPERATIONAL"
              : "NO_MATCH";
    const results = response.results.map((result) => ({
      ...result,
      item: provider.adapter.normalizeIdentity(result.item, result.score),
    }));
    results.forEach((result) => identityMappingRepository.registerCollectible(result.item));

    return {
      ...response,
      message: providerMessage(status, selection.game),
      orchestrationDiagnostics: {
        cacheStatus: response.diagnostics.cacheStatus,
        canonicalIdentities: results.map((result) => result.item.canonicalIdentity),
        fallbackProvider: selection.fallbackProvider,
        game: selection.game,
        lifecycle:
          status === "PROVIDER_OFFLINE" ||
          status === "NETWORK_FAILURE" ||
          status === "RATE_LIMITED"
            ? "TEMPORARILY_OFFLINE"
            : provider.capability.lifecycle,
        normalizationSource: provider.adapter.normalizationSource,
        providerConfidence: results[0]?.item.providerConfidence ?? 0,
        providerId: provider.id,
        providerSelected: provider.name,
        searchLatencyMs: Date.now() - startedAt,
        selectionReason: selection.reason,
        status,
      },
      results,
      status,
    };
  }
}
