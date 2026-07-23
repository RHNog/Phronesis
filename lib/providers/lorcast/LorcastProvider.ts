import type { Card } from "@/types/card";
import type { IdentityProvider } from "@/lib/engines/identity/IdentityProvider";
import { LorcastAdapter } from "@/lib/providers/lorcast/LorcastAdapter";
import type { LorcastDiagnostics } from "@/lib/providers/lorcast/LorcastDiagnostics";
import { normalizeLorcastCards } from "@/lib/providers/lorcast/LorcastNormalizer";
import type {
  LorcastCard,
  LorcastErrorKind,
  LorcastSearchResponse,
} from "@/lib/providers/lorcast/LorcastTypes";

const baseUrl = "https://api.lorcast.com/v0";
const defaultCacheTtlMs = 24 * 60 * 60 * 1000;
const requestSpacingMs = 75;

type CacheRecord = {
  cards: Card[];
  cachedAt: number;
  rawResponses: LorcastCard[];
};

type SearchDiagnosticsResult = {
  cacheStatus: "HIT" | "MISS";
  cards: Card[];
  diagnostics: LorcastDiagnostics;
  durationMs: number;
  errorKind?: LorcastErrorKind;
  errorMessage?: string;
  rawResponses: LorcastCard[];
};

export type LorcastProviderOptions = {
  cacheTtlMs?: number;
  fetcher?: typeof fetch;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
};

export class LorcastProvider implements IdentityProvider {
  readonly adapter = new LorcastAdapter();
  readonly capability = {
    artwork: true,
    conditions: false,
    finishes: false,
    games: ["Lorcana" as const],
    languages: true,
    lifecycle: "OPERATIONAL" as const,
    printings: true,
  };
  readonly id = "lorcast";
  readonly name = "Lorcast";

  private readonly cache = new Map<string, CacheRecord>();
  private readonly cardsById = new Map<string, Card>();
  private readonly inFlight = new Map<string, Promise<SearchDiagnosticsResult>>();
  private readonly cacheTtlMs: number;
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private lastRequestAt = 0;

  constructor(options: LorcastProviderOptions = {}) {
    this.cacheTtlMs = options.cacheTtlMs ?? defaultCacheTtlMs;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? ((milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
  }

  async searchCards(query: string) {
    return (await this.searchCardsWithDiagnostics(query)).cards;
  }

  async searchCardsWithDiagnostics(query: string): Promise<SearchDiagnosticsResult> {
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    const startedAt = this.now();

    if (!normalizedQuery || normalizedQuery.length > 500 || /[\u0000-\u001f]/.test(normalizedQuery)) {
      return this.failure(normalizedQuery, startedAt, "MALFORMED_QUERY", "Lorcast query is malformed.");
    }

    const cacheKey = normalizedQuery.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && startedAt - cached.cachedAt < this.cacheTtlMs) {
      return {
        cacheStatus: "HIT",
        cards: cached.cards,
        diagnostics: {
          cacheAgeMs: startedAt - cached.cachedAt,
          cacheStatus: "HIT",
          durationMs: this.now() - startedAt,
          normalizedCount: cached.cards.length,
          providerId: "lorcast",
          query: normalizedQuery,
          unique: "prints",
        },
        durationMs: this.now() - startedAt,
        rawResponses: cached.rawResponses,
      };
    }

    const pending = this.inFlight.get(cacheKey);
    if (pending) return pending;

    const request = this.requestSearch(normalizedQuery, cacheKey, startedAt).finally(() => {
      this.inFlight.delete(cacheKey);
    });
    this.inFlight.set(cacheKey, request);
    return request;
  }

  async getCard(id: string) {
    return this.cardsById.get(id) ?? null;
  }

  private async requestSearch(query: string, cacheKey: string, startedAt: number) {
    const waitMs = Math.max(0, requestSpacingMs - (this.now() - this.lastRequestAt));
    if (waitMs > 0) await this.sleep(waitMs);

    const url = new URL(`${baseUrl}/cards/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("unique", "prints");
    this.lastRequestAt = this.now();

    try {
      const response = await this.fetcher(url, {
        headers: { "User-Agent": "Phronesis/0.1 (identity provider)" },
      });
      if (!response.ok) {
        if (response.status === 429) return this.failure(query, startedAt, "RATE_LIMITED", "Lorcast rate limit reached.", response.status, url.toString());
        if (response.status === 400 || response.status === 422) return this.failure(query, startedAt, "MALFORMED_QUERY", "Lorcast rejected the search query.", response.status, url.toString());
        return this.failure(query, startedAt, "PROVIDER_OFFLINE", `Lorcast returned ${response.status}.`, response.status, url.toString());
      }

      const payload = (await response.json()) as LorcastSearchResponse;
      const rawResponses = Array.isArray(payload.results) ? payload.results : [];
      const cards = normalizeLorcastCards(rawResponses);
      const cachedAt = this.now();
      this.cache.set(cacheKey, { cachedAt, cards, rawResponses });
      cards.forEach((card) => this.cardsById.set(card.id, card));
      const errorKind = cards.length === 0 ? "NO_MATCH" as const : undefined;
      const durationMs = this.now() - startedAt;

      return {
        cacheStatus: "MISS" as const,
        cards,
        diagnostics: {
          cacheAgeMs: 0,
          cacheStatus: "MISS" as const,
          durationMs,
          errorKind,
          normalizedCount: cards.length,
          providerId: "lorcast" as const,
          query,
          requestUrl: url.toString(),
          unique: "prints" as const,
        },
        durationMs,
        errorKind,
        rawResponses,
      };
    } catch (error) {
      return this.failure(
        query,
        startedAt,
        "NETWORK_FAILURE",
        error instanceof Error ? error.message : "Lorcast network request failed.",
        undefined,
        url.toString(),
      );
    }
  }

  private failure(
    query: string,
    startedAt: number,
    errorKind: LorcastErrorKind,
    errorMessage: string,
    httpStatus?: number,
    requestUrl?: string,
  ): SearchDiagnosticsResult {
    const durationMs = this.now() - startedAt;
    return {
      cacheStatus: "MISS",
      cards: [],
      diagnostics: {
        cacheAgeMs: null,
        cacheStatus: "MISS",
        durationMs,
        errorKind,
        errorMessage,
        httpStatus,
        normalizedCount: 0,
        providerId: "lorcast",
        query,
        requestUrl,
        unique: "prints",
      },
      durationMs,
      errorKind,
      errorMessage,
      rawResponses: [],
    };
  }
}
