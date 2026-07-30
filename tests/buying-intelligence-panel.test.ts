import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createBuyingIntelligenceSummary } from "../features/vendor/components/BuyingIntelligencePanel";
import { createSnapshotPurchaseEvaluation } from "../features/vendor/components/SnapshotVendorWorkspace";
import type { SearchMatch } from "../lib/pricing/types";

const match: SearchMatch = {
  categoryId: "pokemon-en",
  sku: "tcg:intelligence-test",
  productType: "SINGLE",
  name: "Intelligence Test Card",
  setName: "Test Set",
  collectorNumber: "42",
  variant: "Normal",
  language: "English",
  imageUrl: null,
  score: 100,
  prices: {
    NEAR_MINT: {
      marketPriceCents: 10_000,
      listingPriceCents: 9_500,
      shippingCents: 100,
      shippingSource: "EXPORTED",
      deliveredPriceCents: 9_600,
      snapshotDate: "2026-07-30T04:34:16.000Z",
      sourceSku: "12345",
      previousMarketPriceCents: 9_000,
      previousSnapshotDate: "2026-07-29T18:00:00.000Z",
    },
  },
  sealedPrice: null,
  previousMarketPriceCents: 9_000,
  previousSnapshotDate: "2026-07-29T18:00:00.000Z",
};

function readyEvaluation() {
  const evaluation = createSnapshotPurchaseEvaluation({
    match,
    condition: "NEAR_MINT",
    price: match.prices.NEAR_MINT!,
    askingPrice: 50,
    businessProfileId: "convention-buying",
    strategyId: "custom",
  });

  assert.ok(evaluation);
  assert.equal(evaluation.status, "READY");

  if (evaluation.status !== "READY") {
    throw new Error("Expected a ready evaluation fixture.");
  }

  return evaluation;
}

test("buying intelligence summary projects the canonical assessment and decision", () => {
  const evaluation = readyEvaluation();
  const summary = createBuyingIntelligenceSummary(evaluation);

  assert.equal(
    summary.assessment,
    evaluation.cardProfile.assetAssessment.overallAssessment,
  );
  assert.equal(
    summary.businessConclusion,
    evaluation.cardProfile.assetAssessment.businessSummary,
  );
  assert.equal(
    summary.evidenceCoverage,
    evaluation.cardProfile.assetAssessment.evidenceCoverage,
  );
  assert.equal(summary.decisionAction, evaluation.decision.action);
  assert.ok(summary.grade.length > 0);
  assert.ok(summary.confidenceLabel.length > 0);
  assert.ok(summary.primaryDrivers.length <= 3);
  assert.ok(summary.opportunities.length <= 3);
  assert.ok(summary.risks.length <= 3);
});

test("buying intelligence summary preserves empty evidence without inventing claims", () => {
  const evaluation = readyEvaluation();
  const withoutOptionalEvidence = {
    ...evaluation,
    cardProfile: {
      ...evaluation.cardProfile,
      assetAssessment: {
        ...evaluation.cardProfile.assetAssessment,
        opportunityFactors: [],
        primaryDrivers: [],
        riskFactors: [],
      },
    },
  };
  const summary = createBuyingIntelligenceSummary(withoutOptionalEvidence);

  assert.deepEqual(summary.primaryDrivers, []);
  assert.deepEqual(summary.opportunities, []);
  assert.deepEqual(summary.risks, []);
});

test("Vendor Workspace reuses the established Intelligence Console through accessible disclosure", () => {
  const panel = readFileSync(
    new URL(
      "../features/vendor/components/BuyingIntelligencePanel.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const evaluationSummary = readFileSync(
    new URL(
      "../features/vendor/components/EvaluationSummary.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(panel, /Phronesis Intelligence/);
  assert.match(panel, /createBuyingIntelligenceSummary/);
  assert.match(panel, /IntelligenceConsole cardProfile=\{evaluation\.cardProfile\}/);
  assert.match(panel, /<details/);
  assert.match(panel, /min-h-11/);
  assert.match(panel, /aria-labelledby="phronesis-intelligence-heading"/);
  assert.doesNotMatch(panel, /evaluatePurchase\(/);
  assert.match(evaluationSummary, /BuyingIntelligencePanel evaluation=\{evaluation\}/);
});
