import {
  type ScryfallCardResponse,
} from "@/lib/providers/identity/adapters/ScryfallAdapter";
import { adaptScryfallMarketSnapshot } from "@/lib/providers/market/adapters/ScryfallMarketAdapter";
import type { MarketProvider } from "@/types/marketProvider";
import type { MarketSnapshot } from "@/types/marketSnapshot";
import type { PrintingVariant } from "@/types/printingVariant";

const SCRYFALL_BASE_URL = "https://api.scryfall.com";
const SCRYFALL_HEADERS = {
  "User-Agent": "Phronesis/0.1 (development market estimates)",
};

const cardCache = new Map<string, ScryfallCardResponse | null>();

function getFinishFromVariantId(variantId: string) {
  const rawFinish = variantId.split(":").at(-1) ?? "";

  if (rawFinish === "nonfoil") {
    return "Nonfoil";
  }

  if (rawFinish === "foil") {
    return "Foil";
  }

  if (rawFinish === "etched") {
    return "Etched";
  }

  return rawFinish.replace(/\b\w/g, (character) => character.toUpperCase());
}

function createVariant(printingId: string, variantId: string): PrintingVariant {
  return {
    id: variantId,
    printingId,
    finish: getFinishFromVariantId(variantId),
    isAvailable: true,
    source: "Scryfall",
  };
}

export class ScryfallMarketProvider implements MarketProvider {
  readonly id = "scryfall-market";
  readonly name = "Scryfall Market Provider";

  async getListings() {
    return [];
  }

  async getRecentSales() {
    return [];
  }

  async getMarketSnapshot(
    printingId: string,
    variantId: string,
  ): Promise<MarketSnapshot> {
    const startedAt = Date.now();

    try {
      const cached = cardCache.get(printingId);
      const card =
        cached === undefined
          ? await this.fetchCard(printingId)
          : cached;

      if (!card) {
        return this.createFailureSnapshot(
          printingId,
          variantId,
          "Scryfall card response was unavailable.",
          Date.now() - startedAt,
        );
      }

      return adaptScryfallMarketSnapshot(
        card,
        createVariant(printingId, variantId),
        Date.now() - startedAt,
      );
    } catch (error) {
      return this.createFailureSnapshot(
        printingId,
        variantId,
        error instanceof Error ? error.message : "Unknown market provider error.",
        Date.now() - startedAt,
      );
    }
  }

  private async fetchCard(printingId: string) {
    const response = await fetch(`${SCRYFALL_BASE_URL}/cards/${printingId}`, {
      headers: SCRYFALL_HEADERS,
    });

    if (!response.ok) {
      cardCache.set(printingId, null);
      return null;
    }

    const card = (await response.json()) as ScryfallCardResponse;

    cardCache.set(printingId, card);
    return card;
  }

  private createFailureSnapshot(
    printingId: string,
    variantId: string,
    errorMessage: string,
    durationMs: number,
  ): MarketSnapshot {
    return {
      printingId,
      variantId,
      prices: [],
      providerId: this.id,
      updatedAt: new Date().toISOString(),
      sourceLabel: "Scryfall Daily Market Estimate",
      durationMs,
      errorMessage,
      priceMissing: true,
    };
  }
}
