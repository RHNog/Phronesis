import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { CardTraderListingProvider } from "@/lib/providers/CardTraderProvider";
import { EbayBrowseListingProvider } from "@/lib/providers/eBayProvider";
import {
  getMarketEvidenceRepository,
  getWatchlistRepository,
  watchlistPrincipalFromAuthorization,
} from "@/lib/watchlist/server";

export const runtime = "nodejs";
type EvidenceRefreshContext = { params: Promise<{ entryId: string }> };

export async function POST(request: Request, context: EvidenceRefreshContext) {
  const authorization = await authorizeRequest(request, "MARKET_WATCH", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = watchlistPrincipalFromAuthorization(authorization);
  const { entryId } = await context.params;
  const entry = getWatchlistRepository().findEntry(principal, entryId);
  if (!entry) return Response.json({ error: "Watchlist entry not found." }, { status: 404 });
  const body = await request.json().catch(() => ({})) as { cardTraderBlueprintId?: unknown };
  const ebay = new EbayBrowseListingProvider();
  const cardTrader = new CardTraderListingProvider();
  const outcomes: Array<{ providerId: string; status: "DISABLED" | "SKIPPED" | "UPDATED" | "FAILED"; count?: number; reason?: string }> = [];
  if (ebay.getStatus().configured) {
    try {
      const query = [
        entry.assetIdentity.name,
        entry.assetIdentity.printing,
        entry.finish,
        entry.condition,
        entry.language,
      ].filter(Boolean).join(" ");
      const listings = await ebay.fetchActiveListings({ query, limit: 10 });
      getMarketEvidenceRepository().replaceActiveListings(principal, entryId, ebay.id, listings);
      outcomes.push({ providerId: ebay.id, status: "UPDATED", count: listings.length });
    } catch (error) {
      outcomes.push({ providerId: ebay.id, status: "FAILED", reason: error instanceof Error ? error.message : "eBay refresh failed." });
    }
  } else {
    outcomes.push({ providerId: ebay.id, status: "DISABLED", reason: ebay.getStatus().reason });
  }
  const blueprintId = Number(body.cardTraderBlueprintId);
  if (!cardTrader.getStatus().configured) {
    outcomes.push({ providerId: cardTrader.id, status: "DISABLED", reason: cardTrader.getStatus().reason });
  } else if (!Number.isInteger(blueprintId) || blueprintId <= 0) {
    outcomes.push({ providerId: cardTrader.id, status: "SKIPPED", reason: "Exact CardTrader blueprint mapping is unavailable; no identity guess was made." });
  } else {
    try {
      const listings = await cardTrader.fetchActiveListings({ blueprintId, limit: 10 });
      getMarketEvidenceRepository().replaceActiveListings(principal, entryId, cardTrader.id, listings);
      outcomes.push({ providerId: cardTrader.id, status: "UPDATED", count: listings.length });
    } catch (error) {
      outcomes.push({ providerId: cardTrader.id, status: "FAILED", reason: error instanceof Error ? error.message : "CardTrader refresh failed." });
    }
  }
  return Response.json({
    outcomes,
    records: getMarketEvidenceRepository().list(principal, entryId),
    soldEvidence: "First-party records only; official listing adapters do not claim completed sales.",
  });
}
