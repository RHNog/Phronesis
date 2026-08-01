import { CanonicalCardIdentityAdapter } from "@/lib/engines/identity/IdentityProviderAdapter";
import type { IdentityProvider } from "@/lib/engines/identity/IdentityProvider";
import { normalizeTcgdexCard } from "@/lib/providers/tcgdex/TcgdexNormalizer";
import type { TcgdexCardBrief, TcgdexErrorKind, TcgdexSetBrief } from "@/lib/providers/tcgdex/TcgdexTypes";
import type { Card } from "@/types/card";

const baseUrl = "https://api.tcgdex.net/v2/en";
const defaultCacheTtlMs = 6 * 60 * 60 * 1000;
const setCacheTtlMs = 24 * 60 * 60 * 1000;

export type TcgdexSearchResult = {
  cards: Card[];
  durationMs: number;
  errorKind?: TcgdexErrorKind;
  errorMessage?: string;
  rawResponses: TcgdexCardBrief[];
};

type CacheRecord = SearchResult & { cachedAt: number };

type SearchResult = TcgdexSearchResult;

export type TcgdexProviderOptions = {
  cacheTtlMs?: number;
  fetcher?: typeof fetch;
  now?: () => number;
};

export class TcgdexProvider implements IdentityProvider {
  readonly adapter = new CanonicalCardIdentityAdapter("TcgdexNormalizer", "tcgdex");
  readonly capability = {
    artwork: true,
    conditions: false,
    finishes: false,
    games: ["Pokemon" as const],
    languages: true,
    lifecycle: "OPERATIONAL" as const,
    printings: true,
  };
  readonly id = "tcgdex";
  readonly name = "TCGdex";

  private readonly cache = new Map<string, CacheRecord>();
  private readonly cardsById = new Map<string, Card>();
  private readonly inFlight = new Map<string, Promise<SearchResult>>();
  private readonly cacheTtlMs: number;
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private setCache: { cachedAt: number; sets: TcgdexSetBrief[] } | null = null;

  constructor(options: TcgdexProviderOptions = {}) {
    this.cacheTtlMs = options.cacheTtlMs ?? defaultCacheTtlMs;
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async searchCards(query: string): Promise<Card[]> {
    return (await this.searchCardsWithDiagnostics(query)).cards;
  }

  async searchCardsWithDiagnostics(query: string): Promise<SearchResult> {
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    const startedAt = this.now();
    if (!normalizedQuery || normalizedQuery.length > 200 || /[\u0000-\u001f]/.test(normalizedQuery)) {
      return this.failure(startedAt, "MALFORMED_QUERY", "TCGdex query is malformed.");
    }
    const cacheKey = normalizedQuery.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached && startedAt - cached.cachedAt < this.cacheTtlMs) {
      return { cards: cached.cards, durationMs: this.now() - startedAt, rawResponses: cached.rawResponses };
    }
    const pending = this.inFlight.get(cacheKey);
    if (pending) return pending;
    const request = this.request(normalizedQuery, startedAt).finally(() => this.inFlight.delete(cacheKey));
    this.inFlight.set(cacheKey, request);
    return request;
  }

  async getCard(id: string): Promise<Card | null> {
    return this.cardsById.get(id) ?? null;
  }

  async listAllCardsWithDiagnostics(): Promise<TcgdexSearchResult> {
    const startedAt = this.now();
    const pageSize = 20_000;
    const maximumPages = 10;
    try {
      const sets = await this.getSets();
      const rawResponses: TcgdexCardBrief[] = [];
      for (let page = 1; page <= maximumPages; page += 1) {
        const url = new URL(`${baseUrl}/cards`);
        url.searchParams.set("pagination:itemsPerPage", String(pageSize));
        url.searchParams.set("pagination:page", String(page));
        const response = await this.fetcher(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) {
          if (response.status === 429) return this.failure(startedAt, "RATE_LIMITED", "TCGdex rate limit reached.");
          return this.failure(startedAt, "PROVIDER_OFFLINE", `TCGdex cards returned ${response.status}.`);
        }
        const payload = await response.json() as unknown;
        const pageRecords = Array.isArray(payload) ? payload as TcgdexCardBrief[] : [];
        rawResponses.push(...pageRecords);
        if (pageRecords.length < pageSize) break;
        if (page === maximumPages) {
          return this.failure(startedAt, "PROVIDER_OFFLINE", "TCGdex pagination exceeded the safety limit.");
        }
      }
      const cards = this.normalizeCards(rawResponses, sets);
      return {
        cards,
        durationMs: this.now() - startedAt,
        errorKind: cards.length ? undefined : "NO_MATCH",
        rawResponses,
      };
    } catch (error) {
      return this.failure(startedAt, "NETWORK_FAILURE", error instanceof Error ? error.message : "TCGdex catalogue request failed.");
    }
  }

  private async getSets(): Promise<TcgdexSetBrief[]> {
    if (this.setCache && this.now() - this.setCache.cachedAt < setCacheTtlMs) return this.setCache.sets;
    const url = new URL(`${baseUrl}/sets`);
    url.searchParams.set("pagination:itemsPerPage", "1000");
    const response = await this.fetcher(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`TCGdex sets returned ${response.status}.`);
    const payload = await response.json() as unknown;
    const sets = Array.isArray(payload) ? payload as TcgdexSetBrief[] : [];
    this.setCache = { cachedAt: this.now(), sets };
    return sets;
  }

  private async request(query: string, startedAt: number): Promise<SearchResult> {
    const url = new URL(`${baseUrl}/cards`);
    url.searchParams.set("name", query);
    url.searchParams.set("pagination:itemsPerPage", "250");
    try {
      const [sets, response] = await Promise.all([
        this.getSets(),
        this.fetcher(url, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(15_000),
        }),
      ]);
      if (!response.ok) {
        if (response.status === 429) return this.failure(startedAt, "RATE_LIMITED", "TCGdex rate limit reached.");
        if (response.status === 400 || response.status === 422) return this.failure(startedAt, "MALFORMED_QUERY", "TCGdex rejected the search query.");
        return this.failure(startedAt, "PROVIDER_OFFLINE", `TCGdex returned ${response.status}.`);
      }
      const payload = await response.json() as unknown;
      const rawResponses = Array.isArray(payload) ? payload as TcgdexCardBrief[] : [];
      const cards = this.normalizeCards(rawResponses, sets);
      const result: SearchResult = {
        cards,
        durationMs: this.now() - startedAt,
        errorKind: cards.length ? undefined : "NO_MATCH",
        rawResponses,
      };
      this.cache.set(query.toLowerCase(), { ...result, cachedAt: this.now() });
      return result;
    } catch (error) {
      return this.failure(startedAt, "NETWORK_FAILURE", error instanceof Error ? error.message : "TCGdex request failed.");
    }
  }

  private normalizeCards(rawResponses: TcgdexCardBrief[], sets: TcgdexSetBrief[]): Card[] {
    const setNames = new Map(sets
      .filter((set): set is Required<Pick<TcgdexSetBrief, "id" | "name">> => Boolean(set.id && set.name))
      .map((set) => [set.id, set.name]));
    const cards = rawResponses.map((raw) => {
      const separator = raw.id?.lastIndexOf("-") ?? -1;
      const setName = separator > 0 ? setNames.get(raw.id!.slice(0, separator)) : undefined;
      return setName ? normalizeTcgdexCard(raw, setName) : null;
    }).filter((card): card is Card => Boolean(card));
    cards.forEach((card) => this.cardsById.set(card.id, card));
    return cards;
  }

  private failure(startedAt: number, errorKind: TcgdexErrorKind, errorMessage: string): SearchResult {
    return { cards: [], durationMs: this.now() - startedAt, errorKind, errorMessage, rawResponses: [] };
  }
}
