import assert from "node:assert/strict";
import test from "node:test";
import { defaultBusinessProfiles } from "@/lib/business/BusinessDefaults";
import type { BusinessProfile } from "@/lib/business/BusinessProfileEngine";
import { createCardProfile } from "@/lib/engines/cardIntelligence/CardIntelligenceEngine";
import { evaluatePurchase } from "@/lib/engines/evaluation/evaluatePurchase";
import { createConditionMarketSnapshot } from "@/lib/engines/market/createConditionMarketSnapshot";
import { createSystemReadinessReport } from "@/lib/validation/SystemReadinessEngine";
import { seedStrategyProfiles } from "@/data/seedStrategies";
import type { Card } from "@/types/card";
import { findConditionProfile } from "@/types/conditionProfile";
import { defaultMarketContext } from "@/types/MarketContext";
import type { MarketPrice } from "@/types/marketPrice";
import type { PrintingVariant } from "@/types/printingVariant";
import type { StrategyProfile } from "@/types/strategyProfile";

const testCard: Card = {
  id: "readiness-test-card",
  name: "Lightning Bolt",
  game: "Magic",
  set: "Magic Player Rewards",
  number: "1",
  rarity: "Common",
  finish: "Nonfoil",
  imageUrl: "https://example.com/bolt.jpg",
};

const testVariant: PrintingVariant = {
  id: "readiness-test-card:nonfoil",
  printingId: testCard.id,
  finish: "Nonfoil",
  isAvailable: true,
  source: "Test",
};

const marketPrice: MarketPrice = {
  id: "readiness-market",
  cardId: testCard.id,
  printingId: testCard.id,
  variantId: testVariant.id,
  providerId: "scryfall-market",
  source: "Test market estimate",
  currency: "USD",
  finish: "Nonfoil",
  price: 88.85,
  priceType: "market_estimate",
  updatedAt: "2026-07-08T00:00:00.000Z",
  confidence: 80,
};

const businessProfile = defaultBusinessProfiles.find(
  (profile) => profile.id === "online-marketplace",
) as BusinessProfile;
const strategyProfile = seedStrategyProfiles.find(
  (profile) => profile.id === "custom-profile",
) as StrategyProfile;

function createProfile(card: Card = testCard) {
  return createCardProfile({
    condition: findConditionProfile("NM"),
    marketContext: defaultMarketContext,
    marketContextSnapshot: createConditionMarketSnapshot(marketPrice, "NM"),
    printing: card,
    variant: testVariant,
  });
}

test("missing Business Profile reports waiting for configuration", () => {
  const report = createSystemReadinessReport({
    cardProfile: createProfile(),
    marketPrice,
    strategyProfile,
  });

  assert.equal(report.status, "WAITING_FOR_CONFIGURATION");
  assert.ok(
    report.blockingIssues.some((issue) =>
      issue.message.includes("Select a Business Profile"),
    ),
  );
});

test("missing ROI blocks evaluation before strategy execution", () => {
  const incompleteBusinessProfile: BusinessProfile = {
    ...businessProfile,
    targetROI: Number.NaN,
  };
  const evaluation = evaluatePurchase({
    businessProfile: incompleteBusinessProfile,
    card: testCard,
    condition: "NM",
    marketContext: defaultMarketContext,
    marketPrice,
    purchasePrice: 40,
    selectedVariant: testVariant,
    strategyProfile,
  });

  assert.equal(evaluation.status, "WAITING_FOR_DATA");
  assert.equal(evaluation.readinessReport.status, "WAITING_FOR_CONFIGURATION");
  assert.ok(
    evaluation.readinessReport.blockingIssues.some((issue) =>
      issue.message.includes("Configure Target ROI"),
    ),
  );
});

test("missing market snapshot prevents Offer Ladder execution", () => {
  const report = createSystemReadinessReport({
    businessProfile,
    cardProfile: createProfile(),
    strategyProfile,
  });

  assert.equal(report.status, "WAITING_FOR_MARKET_DATA");
  assert.ok(report.missingComponents.includes("Market Snapshot"));
  assert.ok(!report.readyComponents.includes("Offer Ladder"));
});

test("missing Playability remains optional readiness warning", () => {
  const profile = createProfile({ ...testCard, legalities: undefined });
  const report = createSystemReadinessReport({
    businessProfile,
    cardProfile: profile,
    marketPrice,
    strategyProfile,
  });

  assert.equal(report.status, "READY");
  assert.ok(
    report.warnings.some((warning) =>
      warning.message.includes("Playability data pending"),
    ),
  );
});

test("complete configuration is ready and executes Offer Ladder", () => {
  const evaluation = evaluatePurchase({
    businessProfile,
    card: {
      ...testCard,
      legalities: {
        commander: "legal",
        legacy: "legal",
        modern: "legal",
        pauper: "legal",
        vintage: "legal",
      },
    },
    condition: "NM",
    marketContext: defaultMarketContext,
    marketPrice,
    purchasePrice: 40,
    selectedVariant: testVariant,
    strategyProfile,
  });

  assert.equal(evaluation.status, "READY");
  assert.equal(evaluation.readinessReport.status, "READY");
  assert.ok(evaluation.negotiationLadder.maximumBuyPrice > 0);
});

test("negative negotiation margin does not surface internal implementation errors", () => {
  const evaluation = evaluatePurchase({
    businessProfile,
    card: testCard,
    condition: "NM",
    marketContext: defaultMarketContext,
    marketPrice,
    purchasePrice: 140,
    selectedVariant: testVariant,
    strategyProfile,
  });

  assert.equal(evaluation.status, "READY");
  assert.notEqual(evaluation.decision.action, "BUY");
  assert.ok(
    !evaluation.decision.explanation.some((line) =>
      line.includes("Negotiation Margin cannot be negative"),
    ),
  );
});
