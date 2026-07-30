import { CanonicalCardIdentityAdapter } from "@/lib/engines/identity/IdentityProviderAdapter";
import type { IdentityProvider } from "@/lib/engines/identity/IdentityProvider";
import { normalizeBandaiOnePieceCard } from "@/lib/providers/bandai/BandaiOnePieceNormalizer";
import type { BandaiOnePieceCardRecord, BandaiOnePieceErrorKind } from "@/lib/providers/bandai/BandaiOnePieceTypes";
import type { Card } from "@/types/card";

const endpoint = "https://en.onepiece-cardgame.com/cardlist/";
const cacheTtlMs = 6 * 60 * 60 * 1000;
const maximumHtmlLength = 16 * 1024 * 1024;

type SearchResult = {
  cards: Card[];
  durationMs: number;
  errorKind?: BandaiOnePieceErrorKind;
  errorMessage?: string;
  rawResponses: BandaiOnePieceCardRecord[];
};

type CacheRecord = SearchResult & { cachedAt: number };

export type BandaiOnePieceProviderOptions = {
  fetcher?: typeof fetch;
  now?: () => number;
};

function decodeHtml(value: string): string {
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, encoded: string) => String.fromCodePoint(encoded.toLowerCase().startsWith("x") ? Number.parseInt(encoded.slice(1), 16) : Number.parseInt(encoded, 10)))
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseBandaiOnePieceCards(html: string): BandaiOnePieceCardRecord[] {
  const records: BandaiOnePieceCardRecord[] = [];
  const blockPattern = /<dl class="modalCol" id="([^"]+)">([\s\S]*?)<\/dl>/gi;
  for (const match of html.matchAll(blockPattern)) {
    const assetId = match[1];
    const block = match[2];
    const imagePath = block.match(/data-src="(\.\.\/images\/cardlist\/card\/[^"]+)"/i)?.[1];
    const info = block.match(/<div class="infoCol">\s*<span>([^<]+)<\/span>\s*\|\s*<span>([^<]+)<\/span>\s*\|\s*<span>([^<]+)<\/span>/i);
    const name = block.match(/<div class="cardName">([\s\S]*?)<\/div>/i)?.[1];
    const setName = block.match(/<div class="getInfo"><h3>Card Set\(s\)<\/h3>([\s\S]*?)<\/div>/i)?.[1];
    if (!imagePath || !info || !name || !setName || !/^[A-Za-z0-9_-]+$/.test(assetId)) continue;
    records.push({
      assetId,
      cardNumber: decodeHtml(info[1]),
      rarity: decodeHtml(info[2]),
      cardType: decodeHtml(info[3]),
      imageUrl: new URL(imagePath, endpoint).toString(),
      name: decodeHtml(name),
      setName: decodeHtml(setName),
    });
  }
  return records;
}

export class BandaiOnePieceProvider implements IdentityProvider {
  readonly adapter = new CanonicalCardIdentityAdapter("BandaiOnePieceNormalizer", "bandai-onepiece");
  readonly capability = {
    artwork: true,
    conditions: false,
    finishes: false,
    games: ["One Piece" as const],
    languages: true,
    lifecycle: "OPERATIONAL" as const,
    printings: true,
  };
  readonly id = "bandai-onepiece";
  readonly name = "Bandai One Piece Card List";

  private readonly cache = new Map<string, CacheRecord>();
  private readonly cardsById = new Map<string, Card>();
  private readonly inFlight = new Map<string, Promise<SearchResult>>();
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;

  constructor(options: BandaiOnePieceProviderOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? Date.now;
  }

  async searchCards(query: string): Promise<Card[]> {
    return (await this.searchCardsWithDiagnostics(query)).cards;
  }

  async searchCardsWithDiagnostics(query: string): Promise<SearchResult> {
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    const startedAt = this.now();
    if (normalizedQuery.length < 2 || normalizedQuery.length > 200 || /[\u0000-\u001f]/.test(normalizedQuery)) {
      return this.failure(startedAt, "MALFORMED_QUERY", "Bandai One Piece query is malformed.");
    }
    const key = normalizedQuery.toLowerCase();
    const cached = this.cache.get(key);
    if (cached && startedAt - cached.cachedAt < cacheTtlMs) {
      return { cards: cached.cards, durationMs: this.now() - startedAt, rawResponses: cached.rawResponses };
    }
    const pending = this.inFlight.get(key);
    if (pending) return pending;
    const request = this.request(normalizedQuery, startedAt).finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, request);
    return request;
  }

  async getCard(id: string): Promise<Card | null> {
    return this.cardsById.get(id) ?? null;
  }

  private async request(query: string, startedAt: number): Promise<SearchResult> {
    try {
      const body = new URLSearchParams({ freewords: query });
      const response = await this.fetcher(endpoint, {
        body,
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": "Phronesis/0.1 personal artwork client",
        },
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        if (response.status === 429) return this.failure(startedAt, "RATE_LIMITED", "Bandai One Piece card list rate limit reached.");
        return this.failure(startedAt, "PROVIDER_OFFLINE", `Bandai One Piece card list returned ${response.status}.`);
      }
      const declaredLength = Number(response.headers.get("content-length") ?? "0");
      if (declaredLength > maximumHtmlLength) return this.failure(startedAt, "PROVIDER_OFFLINE", "Bandai One Piece response exceeded the safety limit.");
      const html = await response.text();
      if (html.length > maximumHtmlLength) return this.failure(startedAt, "PROVIDER_OFFLINE", "Bandai One Piece response exceeded the safety limit.");
      const rawResponses = parseBandaiOnePieceCards(html);
      const cards = rawResponses.map(normalizeBandaiOnePieceCard).filter((card): card is Card => Boolean(card));
      cards.forEach((card) => this.cardsById.set(card.id, card));
      const result: SearchResult = {
        cards,
        durationMs: this.now() - startedAt,
        errorKind: cards.length ? undefined : "NO_MATCH",
        rawResponses,
      };
      this.cache.set(query.toLowerCase(), { ...result, cachedAt: this.now() });
      return result;
    } catch (error) {
      return this.failure(startedAt, "NETWORK_FAILURE", error instanceof Error ? error.message : "Bandai One Piece request failed.");
    }
  }

  private failure(startedAt: number, errorKind: BandaiOnePieceErrorKind, errorMessage: string): SearchResult {
    return { cards: [], durationMs: this.now() - startedAt, errorKind, errorMessage, rawResponses: [] };
  }
}
