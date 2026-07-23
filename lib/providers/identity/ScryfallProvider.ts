import {
  adaptScryfallCard,
  type ScryfallCardResponse,
} from "@/lib/providers/identity/adapters/ScryfallAdapter";
import type { Card } from "@/types/card";
import type { IdentityProvider } from "@/types/identityProvider";

type ScryfallSearchResponse = {
  data?: ScryfallCardResponse[];
};

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_HEADERS = {
  "User-Agent": "Phronesis/0.1 (development identity diagnostics)",
};

type ScryfallSearchCacheRecord = {
  cards: Card[];
  rawResponses: ScryfallCardResponse[];
};

const cardCache = new Map<string, Card | null>();
const searchCache = new Map<string, ScryfallSearchCacheRecord>();

export class ScryfallProvider implements IdentityProvider {
  readonly id = "scryfall";
  readonly name = "Scryfall";

  async searchCards(query: string) {
    // TODO: Offline identity cache and Redis-backed cache.
    const diagnostics = await this.searchCardsWithDiagnostics(query);

    return diagnostics.cards;
  }

  async searchCardsWithDiagnostics(query: string) {
    const startedAt = Date.now();
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        cacheStatus: "MISS" as const,
        cards: [],
        durationMs: 0,
        rawResponses: [],
      };
    }

    const cached = searchCache.get(normalizedQuery);

    if (cached) {
      return {
        cacheStatus: "HIT" as const,
        cards: cached.cards,
        durationMs: Date.now() - startedAt,
        rawResponses: cached.rawResponses,
      };
    }

    try {
      const response = await fetch(
        `${SCRYFALL_BASE_URL}/cards/search?q=${encodeURIComponent(
          normalizedQuery,
        )}&unique=prints`,
        {
          headers: SCRYFALL_HEADERS,
        },
      );

      if (!response.ok) {
        return {
          cacheStatus: "MISS" as const,
          cards: [],
          durationMs: Date.now() - startedAt,
          errorMessage: `Scryfall returned ${response.status}.`,
          rawResponses: [],
        };
      }

      const payload = (await response.json()) as ScryfallSearchResponse;
      const rawResponses = payload.data ?? [];
      const cards =
        rawResponses
          .map(adaptScryfallCard)
          .filter((card): card is Card => Boolean(card)) ?? [];

      searchCache.set(normalizedQuery, { cards, rawResponses });
      return {
        cacheStatus: "MISS" as const,
        cards,
        durationMs: Date.now() - startedAt,
        rawResponses,
      };
    } catch (error) {
      return {
        cacheStatus: "MISS" as const,
        cards: [],
        durationMs: Date.now() - startedAt,
        errorMessage:
          error instanceof Error ? error.message : "Unknown Scryfall error.",
        rawResponses: [],
      };
    }
  }

  async getCard(id: string) {
    const cached = cardCache.get(id);

    if (cached !== undefined) {
      return cached;
    }

    try {
      const response = await fetch(`${SCRYFALL_BASE_URL}/cards/${id}`, {
        headers: SCRYFALL_HEADERS,
      });

      if (!response.ok) {
        cardCache.set(id, null);
        return null;
      }

      const payload = (await response.json()) as ScryfallCardResponse;
      const card = adaptScryfallCard(payload);

      cardCache.set(id, card);
      return card;
    } catch {
      return null;
    }
  }
}
