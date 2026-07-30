import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getJustTCGWatchEnrichmentConfig } from "@/lib/watchlist/JustTCGWatchEnrichment";
import { EbayBrowseListingProvider } from "@/lib/providers/eBayProvider";
import { CardTraderListingProvider } from "@/lib/providers/CardTraderProvider";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "MARKET_WATCH", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const justTcg = getJustTCGWatchEnrichmentConfig();
  const ebay = new EbayBrowseListingProvider().getStatus();
  const cardTrader = new CardTraderListingProvider().getStatus();
  return Response.json({
    providers: [
      {
        configured: Boolean(process.env.JUSTTCG_API_KEY?.trim()),
        enabled: justTcg.enabled,
        providerId: "justtcg",
        status: justTcg.enabled ? "READY" : process.env.JUSTTCG_API_KEY?.trim() ? "DISABLED" : "NOT_CONFIGURED",
      },
      { configured: ebay.configured, enabled: ebay.configured, providerId: ebay.providerId, status: ebay.configured ? "READY" : "NOT_CONFIGURED" },
      { configured: cardTrader.configured, enabled: cardTrader.configured, providerId: cardTrader.providerId, status: cardTrader.configured ? "READY" : "NOT_CONFIGURED" },
    ],
    note: "Configuration health only. Upstream quota is not inferred.",
  });
}
