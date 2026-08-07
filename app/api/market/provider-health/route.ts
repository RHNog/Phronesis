import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getJustTCGWatchEnrichmentConfig } from "@/lib/watchlist/JustTCGWatchEnrichment";
import { EbayBrowseListingProvider } from "@/lib/providers/eBayProvider";
import { CardTraderListingProvider } from "@/lib/providers/CardTraderProvider";
import { getPkmnPricesSealedSummary } from "@/lib/providers/pkmnprices/server";
import { getProviderCredential } from "@/lib/providers/credentials";
import { getLigaProviderHealth } from "@/lib/providers/liga/RegionalProviderHealth";
import { getPriceChartingBulkRepository } from "@/lib/providers/pricecharting/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "ADMINISTRATION", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const justTcgKey = getProviderCredential("justtcg", "JUSTTCG_API_KEY");
  const justTcg = getJustTCGWatchEnrichmentConfig({ ...process.env, JUSTTCG_API_KEY: justTcgKey });
  const ebay = new EbayBrowseListingProvider({ clientId: getProviderCredential("ebay-browse", "EBAY_CLIENT_ID"), clientSecret: getProviderCredential("ebay-browse", "EBAY_CLIENT_SECRET") }).getStatus();
  const cardTrader = new CardTraderListingProvider({ token: getProviderCredential("cardtrader", "CARDTRADER_API_TOKEN") }).getStatus();
  const sealed = getPkmnPricesSealedSummary();
  const priceChartingBulk = getPriceChartingBulkRepository().getSummaries();
  const priceChartingConfigured = ["PRICECHARTING_API_TOKEN", "PRICECHARTING_MAGIC_CSV_URL", "PRICECHARTING_ONEPIECE_CSV_URL"].some((field) => Boolean(getProviderCredential("pricecharting", field)));
  const priceChartingCurrent = priceChartingBulk.some((summary) => summary.status === "CURRENT");
  const priceChartingImported = priceChartingBulk.some((summary) => summary.status !== "NOT_IMPORTED");
  const regionalProviders = getLigaProviderHealth();
  return Response.json({
    providers: [
      ...regionalProviders,
      {
        configured: Boolean(justTcgKey),
        enabled: justTcg.enabled,
        providerId: "justtcg",
        status: justTcg.enabled ? "READY" : justTcgKey ? "DISABLED" : "NOT_CONFIGURED",
      },
      { configured: priceChartingConfigured || priceChartingImported, enabled: priceChartingConfigured || priceChartingCurrent, providerId: "pricecharting", status: priceChartingCurrent ? "CURRENT" : priceChartingImported ? "STAGED" : priceChartingConfigured ? "READY" : "NOT_CONFIGURED", bulkImports: priceChartingBulk },
      { configured: ebay.configured, enabled: ebay.configured, providerId: ebay.providerId, status: ebay.configured ? "READY" : "NOT_CONFIGURED" },
      { configured: cardTrader.configured, enabled: cardTrader.configured, providerId: cardTrader.providerId, status: cardTrader.configured ? "READY" : "NOT_CONFIGURED" },
      {
        configured: sealed.status !== "NOT_CONFIGURED",
        creditsUsed: sealed.creditsUsed,
        dailyBudget: sealed.dailyBudget,
        enabled: sealed.status !== "NOT_CONFIGURED" && sealed.status !== "ACCESS_REQUIRED",
        nextRelease: sealed.nextRelease,
        productsResolved: sealed.productsResolved,
        productsStored: sealed.productsStored,
        providerId: "pkmnprices-sealed",
        status: sealed.status,
      },
      {
        configured: Boolean(getProviderCredential("psa-certificates", "PSA_API_TOKEN")),
        enabled: Boolean(getProviderCredential("psa-certificates", "PSA_API_TOKEN")),
        providerId: "psa-certificates",
        status: getProviderCredential("psa-certificates", "PSA_API_TOKEN") ? "READY" : "NOT_CONFIGURED",
      },
    ],
    note: "Configuration health only. Upstream quota is not inferred.",
  });
}
