import { NextResponse } from "next/server";
import {
  marketRefreshScheduler,
  type MarketRepositoryReadResult,
} from "@/lib/market/MarketRefreshScheduler";
import type { MarketIntelligenceRepositorySnapshot } from "@/lib/market/MarketSnapshot";
import type { MarketPrice } from "@/types/marketPrice";
import type { MarketSnapshot } from "@/types/marketSnapshot";
import type { MarketSnapshotField } from "@/lib/market/MarketSnapshotMetadata";
import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";

function getSelectedValue(
  snapshot: MarketIntelligenceRepositorySnapshot,
  field: MarketSnapshotField,
) {
  const selection = snapshot.evidenceSelections?.[field];

  return selection?.provenance ? selection.value : null;
}

function createPrices(
  snapshot: MarketIntelligenceRepositorySnapshot,
): MarketPrice[] {
  const base = {
    cardId: snapshot.identity.printingId,
    currency: "USD",
    finish: snapshot.identity.finish,
    printingId: snapshot.identity.printingId,
    updatedAt: snapshot.metadata.updatedAt,
    variantId: snapshot.identity.variantId,
  };
  const prices: MarketPrice[] = [];

  const selectedMarketPrice = getSelectedValue(snapshot, "marketPrice");
  const selectedLowestListing = getSelectedValue(snapshot, "lowestListing");

  if (selectedMarketPrice !== null) {
    prices.push({
      ...base,
      id: `repository:${snapshot.identity.printingId}:${snapshot.identity.variantId}:market`,
      confidence: snapshot.marketConfidence ?? 60,
      price: selectedMarketPrice,
      priceType: "market_estimate",
      condition:
        snapshot.evidenceSelections?.marketPrice?.provenance?.node.condition,
      conditionSpecific:
        snapshot.evidenceSelections?.marketPrice?.provenance?.node
          .conditionSpecific,
      providerId:
        snapshot.evidenceSelections?.marketPrice?.selectedProvider ??
        snapshot.providerId,
      source:
        snapshot.evidenceSelections?.marketPrice?.provenance?.source ??
        "Market Intelligence Repository",
    });
  }

  if (selectedLowestListing !== null) {
    prices.push({
      ...base,
      id: `repository:${snapshot.identity.printingId}:${snapshot.identity.variantId}:lowest`,
      confidence: snapshot.marketConfidence ?? 60,
      price: selectedLowestListing,
      priceType: "lowest_known",
      condition:
        snapshot.evidenceSelections?.lowestListing?.provenance?.node.condition,
      conditionSpecific:
        snapshot.evidenceSelections?.lowestListing?.provenance?.node
          .conditionSpecific,
      providerId:
        snapshot.evidenceSelections?.lowestListing?.selectedProvider ??
        snapshot.providerId,
      source:
        snapshot.evidenceSelections?.lowestListing?.provenance?.source ??
        "Market Intelligence Repository",
    });
  }

  return prices;
}

function toApiMarketSnapshot(
  snapshot: MarketIntelligenceRepositorySnapshot,
  source?: MarketRepositoryReadResult["source"],
  diagnostics?: MarketRepositoryReadResult["diagnostics"],
): MarketSnapshot {
  const prices = createPrices(snapshot);
  const selectedListingCount = getSelectedValue(snapshot, "listingCount");
  const selectedLiquidity = getSelectedValue(snapshot, "liquidity");
  const selectedLowestListing = getSelectedValue(snapshot, "lowestListing");
  const selectedMarketConfidence = getSelectedValue(
    snapshot,
    "marketConfidence",
  );
  const selectedMarketPrice = getSelectedValue(snapshot, "marketPrice");
  const selectedRecentSales = getSelectedValue(snapshot, "recentSales");
  const selectedSalesVelocity = getSelectedValue(snapshot, "salesVelocity");
  const selectedSpread = getSelectedValue(snapshot, "spread");
  const selectedVolatility = getSelectedValue(snapshot, "volatility");
  const selectedEvidence =
    snapshot.evidenceSelections?.marketPrice ??
    snapshot.evidenceSelections?.lowestListing ??
    null;
  const selectedNode = selectedEvidence?.provenance?.node ?? null;

  return {
    printingId: snapshot.identity.printingId,
    variantId: snapshot.identity.variantId,
    prices,
    providerId: snapshot.providerId,
    updatedAt: snapshot.metadata.updatedAt,
    sourceLabel: "Market Intelligence Repository",
    marketIntelligence: {
      apiStatus: "LIVE",
      demandMomentum: selectedSalesVelocity ?? 0,
      directLow: null,
      evidenceCoverage: selectedMarketConfidence ?? 0,
      healthStatus: "HEALTHY",
      inventoryHealth: selectedListingCount ?? 0,
      lastSynchronizedAt: snapshot.metadata.lastRefresh,
      latencyMs: null,
      liquidity: selectedLiquidity ?? 0,
      listingCount: selectedListingCount ?? 0,
      lowestListing: selectedLowestListing,
      marketConfidence: selectedMarketConfidence ?? 0,
      marketPrice: selectedMarketPrice,
      marketStability: Math.max(0, 100 - (selectedVolatility ?? 0)),
      priceHistory: [],
      providerId: snapshot.providerId,
      providerName:
        snapshot.evidenceSelections?.marketPrice?.selectedProvider ??
        snapshot.providerId,
      recentSalesCount: selectedRecentSales ?? 0,
      salesVelocity: selectedSalesVelocity ?? 0,
      spread: selectedSpread ?? 0,
      trend: "Unknown",
      volatility: selectedVolatility ?? 0,
    },
    marketEvidenceDiagnostics: {
      conditionSpecific: selectedNode?.conditionSpecific ?? false,
      coverage: diagnostics?.coverage.map((entry) => ({
        domainName: entry.domainName,
        freshness: entry.freshness,
        status: entry.status,
      })),
      evidenceSource:
        selectedEvidence?.projection?.evidenceSource ??
        selectedEvidence?.provenance?.source ??
        null,
      evidenceNodeId: selectedNode?.nodeId ?? null,
      fallbackReason:
        selectedEvidence?.fallbackReason ??
        "No selected market evidence was available.",
      fallbackUsed: !(selectedNode?.conditionSpecific ?? false),
      finish: selectedNode?.finish ?? snapshot.identity.finish,
      mergeResult: diagnostics?.mergeResult,
      missingEvidence: diagnostics?.missingEvidence,
      providerCondition: selectedNode?.providerCondition ?? null,
      providersQueried: diagnostics?.providersQueried,
      providersSkipped: diagnostics?.providersSkipped,
      projectionUsed: selectedEvidence?.projection?.projectionUsed ?? false,
      requestedCondition: snapshot.identity.condition,
      requestedUiField:
        selectedEvidence?.projection?.requestedUiField ??
        selectedEvidence?.field ??
        null,
      repositorySource: source,
      resolvedEvidenceDomain:
        selectedEvidence?.projection?.resolvedEvidenceDomain ?? null,
      selectedProvider: selectedEvidence?.selectedProvider ?? null,
    },
    priceMissing: prices.length === 0,
  };
}

export async function GET(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "MARKET_WATCH",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const { searchParams } = new URL(request.url);
  const cardName = searchParams.get("cardName") ?? "";
  const condition = searchParams.get("condition") ?? "NM";
  const finish = searchParams.get("finish") ?? "Unknown";
  const game = searchParams.get("game") ?? "";
  const printingId = searchParams.get("printingId") ?? "";
  const variantId = searchParams.get("variantId") ?? "";

  if (!printingId || !variantId) {
    return NextResponse.json({
      printingId,
      variantId,
      prices: [],
      providerId: "scryfall-market",
      updatedAt: new Date().toISOString(),
      sourceLabel: "Scryfall Daily Market Estimate",
      errorMessage: "Missing printingId or variantId.",
      priceMissing: true,
    });
  }

  const result = await marketRefreshScheduler.getSnapshot({
    cardIdentity: cardName || printingId,
    condition,
    finish,
    game,
    printingId,
    variantId,
  });

  return NextResponse.json(
    toApiMarketSnapshot(
      result.repositorySnapshot,
      result.source,
      result.diagnostics,
    ),
  );
}
