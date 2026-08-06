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
type EbayTokenResponse = { access_token?: unknown; expires_in?: unknown };

let cachedApplicationToken: { clientId: string; token: string; expiresAt: number } | null = null;

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
      clientId?: string;
      clientSecret?: string;
      marketplaceId?: string;
      baseUrl?: string;
      identityBaseUrl?: string;
    } = {
      accessToken: process.env.EBAY_BROWSE_ACCESS_TOKEN,
      clientId: process.env.EBAY_CLIENT_ID,
      clientSecret: process.env.EBAY_CLIENT_SECRET,
      marketplaceId: process.env.EBAY_MARKETPLACE_ID,
      baseUrl: process.env.EBAY_BROWSE_BASE_URL,
      identityBaseUrl: process.env.EBAY_IDENTITY_BASE_URL,
    },
    private readonly request: typeof fetch = fetch,
  ) {}

  getStatus() {
    const staticToken = Boolean(this.configuration.accessToken?.trim());
    const applicationCredentials = Boolean(this.configuration.clientId?.trim() && this.configuration.clientSecret?.trim());
    return {
      configured: staticToken || applicationCredentials,
      providerId: this.id,
      reason: staticToken
        ? "Official eBay Browse access token is configured."
        : applicationCredentials
          ? "Official eBay application credentials are configured for automatic token rotation."
          : "EBAY_CLIENT_ID and EBAY_CLIENT_SECRET are absent; eBay Browse remains disabled.",
    };
  }

  private async accessToken(): Promise<string> {
    const staticToken = this.configuration.accessToken?.trim();
    if (staticToken) return staticToken;
    const clientId = this.configuration.clientId?.trim();
    const clientSecret = this.configuration.clientSecret?.trim();
    if (!clientId || !clientSecret) throw new Error(this.getStatus().reason);
    if (cachedApplicationToken?.clientId === clientId && cachedApplicationToken.expiresAt > Date.now() + 60_000) {
      return cachedApplicationToken.token;
    }
    const tokenUrl = new URL("/identity/v1/oauth2/token", this.configuration.identityBaseUrl ?? "https://api.ebay.com");
    const response = await this.request(tokenUrl, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "https://api.ebay.com/oauth/api_scope",
      }),
    });
    if (!response.ok) throw new Error(`eBay OAuth returned ${response.status}.`);
    const body = await response.json() as EbayTokenResponse;
    const token = typeof body.access_token === "string" ? body.access_token : "";
    const expiresIn = Number(body.expires_in);
    if (!token || !Number.isFinite(expiresIn) || expiresIn <= 0) throw new Error("eBay OAuth returned an invalid application token.");
    cachedApplicationToken = { clientId, token, expiresAt: Date.now() + expiresIn * 1000 };
    return token;
  }

  async fetchActiveListings(query: EbayListingQuery): Promise<ActiveListingEvidence[]> {
    if (!this.getStatus().configured) throw new Error(this.getStatus().reason);
    const keywords = query.query.trim();
    if (keywords.length < 2 || keywords.length > 300) throw new Error("A bounded eBay listing query is required.");
    const limit = assertBoundedLimit(query.limit, 25);
    const accessToken = await this.accessToken();
    const url = new URL("/buy/browse/v1/item_summary/search", this.configuration.baseUrl ?? "https://api.ebay.com");
    url.searchParams.set("q", keywords);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set(
      "filter",
      `buyingOptions:{FIXED_PRICE},deliveryCountry:${query.deliveryCountry ?? "US"}`,
    );
    const response = await this.request(url, {
      headers: {
        authorization: `Bearer ${accessToken}`,
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
