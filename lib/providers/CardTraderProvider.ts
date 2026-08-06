import {
  assertBoundedLimit,
  type OfficialListingProvider,
} from "@/lib/providers/OfficialListingProvider";
import type { ActiveListingEvidence } from "@/types/marketEvidence";

type CardTraderProduct = {
  id?: unknown;
  name_en?: unknown;
  quantity?: unknown;
  price?: { cents?: unknown; currency?: unknown };
  properties_hash?: Record<string, unknown>;
};

export type CardTraderListingQuery = {
  blueprintId: number;
  foil?: boolean;
  language?: string;
  limit?: number;
};

export class CardTraderListingProvider implements OfficialListingProvider<CardTraderListingQuery> {
  readonly id = "cardtrader";

  constructor(
    private readonly configuration: { token?: string; baseUrl?: string } = {
      token: process.env.CARDTRADER_API_TOKEN,
      baseUrl: process.env.CARDTRADER_BASE_URL,
    },
    private readonly request: typeof fetch = fetch,
  ) {}

  getStatus() {
    return {
      configured: Boolean(this.configuration.token?.trim()),
      providerId: this.id,
      reason: this.configuration.token?.trim()
        ? "Official CardTrader API token is configured."
        : "CARDTRADER_API_TOKEN is absent; CardTrader remains disabled.",
    };
  }

  async fetchActiveListings(query: CardTraderListingQuery): Promise<ActiveListingEvidence[]> {
    if (!this.getStatus().configured) throw new Error(this.getStatus().reason);
    if (!Number.isInteger(query.blueprintId) || query.blueprintId <= 0) {
      throw new Error("An exact CardTrader blueprint ID is required.");
    }
    const limit = assertBoundedLimit(query.limit, 25);
    const url = new URL("/api/v2/marketplace/products", this.configuration.baseUrl ?? "https://api.cardtrader.com");
    url.searchParams.set("blueprint_id", String(query.blueprintId));
    if (query.foil !== undefined) url.searchParams.set("foil", String(query.foil));
    if (query.language) url.searchParams.set("language", query.language);
    const response = await this.request(url, {
      headers: { authorization: `Bearer ${this.configuration.token}` },
    });
    if (!response.ok) throw new Error(`CardTrader returned ${response.status}.`);
    const raw = await response.json() as CardTraderProduct[] | Record<string, CardTraderProduct[]>;
    const products = Array.isArray(raw) ? raw : Object.values(raw).flat();
    const observedAt = new Date().toISOString();
    return products.slice(0, limit).flatMap((product) => {
      const id = typeof product.id === "number" || typeof product.id === "string" ? String(product.id) : null;
      const priceCents = typeof product.price?.cents === "number" ? product.price.cents : Number(product.price?.cents);
      if (!id || !Number.isInteger(priceCents) || priceCents < 0) return [];
      return [{
        externalId: id,
        providerId: this.id,
        title: typeof product.name_en === "string" ? product.name_en : null,
        priceCents,
        shippingCents: null,
        currency: typeof product.price?.currency === "string" ? product.price.currency : "EUR",
        condition: typeof product.properties_hash?.condition === "string" ? product.properties_hash.condition : null,
        quantity: typeof product.quantity === "number" && product.quantity > 0 ? product.quantity : 1,
        observedAt,
        sourceUrl: null,
      }];
    });
  }
}
