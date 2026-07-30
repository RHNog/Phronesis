import {
  assertBoundedLimit,
  cents,
  type OfficialListingProvider,
} from "@/lib/providers/OfficialListingProvider";
import type { ActiveListingEvidence } from "@/types/marketEvidence";

type EbayItemSummary = {
  itemId?: unknown;
  title?: unknown;
  itemWebUrl?: unknown;
  condition?: unknown;
  itemEndDate?: unknown;
  price?: { value?: unknown; currency?: unknown };
  shippingOptions?: Array<{ shippingCost?: { value?: unknown; currency?: unknown } }>;
};

type EbaySearchResponse = { itemSummaries?: EbayItemSummary[] };

export type EbayListingQuery = {
  query: string;
  limit?: number;
  deliveryCountry?: string;
};

export class EbayBrowseListingProvider implements OfficialListingProvider<EbayListingQuery> {
  readonly id = "ebay-browse";

  constructor(
    private readonly configuration: {
      accessToken?: string;
      marketplaceId?: string;
      baseUrl?: string;
    } = {
      accessToken: process.env.EBAY_BROWSE_ACCESS_TOKEN,
      marketplaceId: process.env.EBAY_MARKETPLACE_ID,
      baseUrl: process.env.EBAY_BROWSE_BASE_URL,
    },
    private readonly request: typeof fetch = fetch,
  ) {}

  getStatus() {
    return {
      configured: Boolean(this.configuration.accessToken?.trim()),
      providerId: this.id,
      reason: this.configuration.accessToken?.trim()
        ? "Official eBay Browse access token is configured."
        : "EBAY_BROWSE_ACCESS_TOKEN is absent; eBay Browse remains disabled.",
    };
  }

  async fetchActiveListings(query: EbayListingQuery): Promise<ActiveListingEvidence[]> {
    if (!this.getStatus().configured) throw new Error(this.getStatus().reason);
    const keywords = query.query.trim();
    if (keywords.length < 2 || keywords.length > 300) throw new Error("A bounded eBay listing query is required.");
    const limit = assertBoundedLimit(query.limit, 25);
    const url = new URL("/buy/browse/v1/item_summary/search", this.configuration.baseUrl ?? "https://api.ebay.com");
    url.searchParams.set("q", keywords);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set(
      "filter",
      `buyingOptions:{FIXED_PRICE},deliveryCountry:${query.deliveryCountry ?? "US"}`,
    );
    const response = await this.request(url, {
      headers: {
        authorization: `Bearer ${this.configuration.accessToken}`,
        "x-ebay-c-marketplace-id": this.configuration.marketplaceId ?? "EBAY_US",
      },
    });
    if (!response.ok) throw new Error(`eBay Browse returned ${response.status}.`);
    const body = await response.json() as EbaySearchResponse;
    const observedAt = new Date().toISOString();
    return (body.itemSummaries ?? []).flatMap((item) => {
      const priceCents = cents(item.price?.value);
      const itemId = typeof item.itemId === "string" ? item.itemId : null;
      const sourceUrl = typeof item.itemWebUrl === "string" ? item.itemWebUrl : null;
      const end = typeof item.itemEndDate === "string" ? new Date(item.itemEndDate).getTime() : null;
      if (priceCents === null || !itemId || !sourceUrl || (end !== null && end <= Date.now())) return [];
      return [{
        externalId: itemId,
        providerId: this.id,
        title: typeof item.title === "string" ? item.title : null,
        priceCents,
        shippingCents: cents(item.shippingOptions?.[0]?.shippingCost?.value),
        currency: typeof item.price?.currency === "string" ? item.price.currency : "USD",
        condition: typeof item.condition === "string" ? item.condition : null,
        quantity: 1,
        observedAt,
        sourceUrl,
      }];
    });
  }
}
