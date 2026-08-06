import assert from "node:assert/strict";
import test from "node:test";
import { createCardProfile } from "@/lib/engines/cardIntelligence/CardIntelligenceEngine";
import { createConditionMarketSnapshot } from "@/lib/engines/market/createConditionMarketSnapshot";
import { createNegotiationLadder } from "@/lib/engines/negotiation/NegotiationLadderEngine";
import { TCGplayerIntelligenceProvider } from "@/lib/providers/market/TCGplayerIntelligenceProvider";
import { seedStrategyProfiles } from "@/data/seedStrategies";
import { findConditionProfile } from "@/types/conditionProfile";
import { defaultMarketContext } from "@/types/MarketContext";
import type { Card } from "@/types/card";
import type { MarketPrice } from "@/types/marketPrice";
import type { PrintingVariant } from "@/types/printingVariant";

function createMagicCard(name: string): Card {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    game: "Magic",
    set: "Test Set",
    number: "1",
    rarity: "Rare",
    finish: "Nonfoil",
    imageUrl: "https://example.com/card.jpg",
  };
}

function createVariant(card: Card): PrintingVariant {
  return {
    id: `${card.id}:nonfoil`,
    printingId: card.id,
    finish: "Nonfoil",
    isAvailable: true,
    source: "Test",
  };
}

function createBaselinePrice(
  card: Card,
  variant: PrintingVariant,
  price: number,
): MarketPrice {
  return {
    id: `${card.id}:baseline-market`,
    cardId: card.id,
    printingId: card.id,
    variantId: variant.id,
    providerId: "baseline-market",
    source: "Baseline market estimate",
    currency: "USD",
    finish: variant.finish,
    price,
    priceType: "market_estimate",
    updatedAt: "2026-07-08T00:00:00.000Z",
    confidence: 70,
  };
}

const requestedCards = [
  createMagicCard("Chrome Mox"),
  createMagicCard("Mox Opal"),
  createMagicCard("Lightning Bolt"),
  createMagicCard("Collected Company"),
  createMagicCard("Urza's Saga"),
];

test("TCGplayer provider generates normalized market intelligence for requested assets", async () => {
  const provider = new TCGplayerIntelligenceProvider();

  for (const card of requestedCards) {
    const variant = createVariant(card);
    const snapshot = await provider.getMarketSnapshot(card.id, variant.id);

    assert.equal(snapshot.providerId, "tcgplayer");
    assert.equal(snapshot.sourceLabel, "TCGplayer Market Intelligence");
    assert.ok(snapshot.prices.some((price) => price.priceType === "market_estimate"));
    assert.ok(snapshot.prices.some((price) => price.priceType === "lowest_known"));
    assert.ok(snapshot.marketIntelligence);
    assert.equal(snapshot.marketIntelligence?.apiStatus, "LIVE");
    assert.equal(snapshot.marketIntelligence?.healthStatus, "HEALTHY");
    assert.ok((snapshot.marketIntelligence?.listingCount ?? 0) > 0);
    assert.ok((snapshot.marketIntelligence?.recentSalesCount ?? 0) > 0);
    assert.ok((snapshot.marketIntelligence?.priceHistory.length ?? 0) > 0);
  }
});

test("TCGplayer evidence improves Market Intelligence signals and Asset Assessment", async () => {
  const provider = new TCGplayerIntelligenceProvider();
  const card = createMagicCard("Mox Opal");
  const variant = createVariant(card);
  const snapshot = await provider.getMarketSnapshot(card.id, variant.id);
  const marketPrice = snapshot.prices[0];
  const providerBackedProfile = createCardProfile({
    condition: findConditionProfile("NM"),
    marketContext: defaultMarketContext,
    marketContextSnapshot: createConditionMarketSnapshot(
      marketPrice,
      "NM",
      snapshot.marketIntelligence,
    ),
    printing: card,
    variant,
  });
  const baselineProfile = createCardProfile({
    condition: findConditionProfile("NM"),
    marketContext: defaultMarketContext,
    marketContextSnapshot: createConditionMarketSnapshot(
      createBaselinePrice(card, variant, marketPrice.price),
      "NM",
    ),
    printing: card,
    variant,
  });
  const liquidity = providerBackedProfile.signals.find(
    (signal) => signal.name === "Liquidity",
  );
  const marketConfidence = providerBackedProfile.signals.find(
    (signal) => signal.name === "MarketConfidence",
  );
  const baselineLiquidity = baselineProfile.signals.find(
    (signal) => signal.name === "Liquidity",
  );

  assert.ok(liquidity);
  assert.ok(marketConfidence);
  assert.equal(liquidity.status, "live");
  assert.equal(marketConfidence.supportingDataSources[0], "TCGplayer");
  assert.notEqual(liquidity.score, baselineLiquidity?.score);
  assert.equal(liquidity.score, snapshot.marketIntelligence?.liquidity);
  assert.ok(
    providerBackedProfile.assetAssessment.evidence.some(
      (evidence) =>
        evidence.kind === "Market" &&
        evidence.source === "Market Intelligence",
    ),
  );
  assert.ok(
    providerBackedProfile.assetAssessment.businessSummary.includes(card.name),
  );
});

test("TCGplayer liquidity, spread, and confidence change negotiation", async () => {
  const provider = new TCGplayerIntelligenceProvider();
  const card = createMagicCard("Mox Opal");
  const variant = createVariant(card);
  const snapshot = await provider.getMarketSnapshot(card.id, variant.id);
  const marketPrice = snapshot.prices[0];
  const strategyProfile = {
    ...seedStrategyProfiles[0],
    constraints: {
      ...seedStrategyProfiles[0].constraints,
      minimumProfit: 1,
      minimumROI: 1,
    },
  };
  const providerBackedProfile = createCardProfile({
    condition: findConditionProfile("NM"),
    marketContext: defaultMarketContext,
    marketContextSnapshot: createConditionMarketSnapshot(
      marketPrice,
      "NM",
      snapshot.marketIntelligence,
    ),
    printing: card,
    variant,
  });
  const baselineProfile = createCardProfile({
    condition: findConditionProfile("NM"),
    marketContext: defaultMarketContext,
    marketContextSnapshot: createConditionMarketSnapshot(
      createBaselinePrice(card, variant, marketPrice.price),
      "NM",
    ),
    printing: card,
    variant,
  });
  const providerLadder = createNegotiationLadder({
    cardProfile: providerBackedProfile,
    minimumProfit: strategyProfile.constraints.minimumProfit,
    strategyProfile,
  });
  const baselineLadder = createNegotiationLadder({
    cardProfile: baselineProfile,
    minimumProfit: strategyProfile.constraints.minimumProfit,
    strategyProfile,
  });

  assert.notDeepEqual(providerLadder, baselineLadder);
  assert.ok(
    providerLadder.targetOffer !== baselineLadder.targetOffer ||
      providerLadder.maximumBuyPrice !== baselineLadder.maximumBuyPrice,
  );
});
