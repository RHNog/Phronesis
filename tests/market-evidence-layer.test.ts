import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createConditionMarketSnapshot } from "@/lib/engines/market/createConditionMarketSnapshot";
import { marketEvidenceLayer } from "@/lib/market/MarketEvidenceLayer";
import { MarketIntelligenceRepository } from "@/lib/market/MarketIntelligenceRepository";
import { marketSnapshotFields } from "@/lib/market/MarketRefreshPolicy";
import type { MarketProviderEvidence } from "@/lib/market/MarketSnapshot";
import type { MarketSnapshotField } from "@/lib/market/MarketSnapshotMetadata";
import type { MarketPrice } from "@/types/marketPrice";

const knownCards = [
  "Mox Opal",
  "Chrome Mox",
  "Black Lotus",
  "Urza's Saga",
  "Collected Company",
  "Lightning Bolt",
];

function createStoragePath() {
  return path.join(
    os.tmpdir(),
    `market-evidence-layer-${Date.now()}-${Math.random()}.json`,
  );
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createContext(cardName: string) {
  const slug = slugify(cardName);

  return {
    cardIdentity: cardName,
    condition: "NM",
    finish: "Nonfoil",
    game: "Magic",
    printingId: `${slug}-printing`,
    variantId: `${slug}-printing:nonfoil`,
  };
}

function createEvidence(input: {
  condition?: string;
  conditionSpecific?: boolean;
  field: MarketSnapshotField;
  providerName: string;
  providerCondition?: string;
  retrievedAt?: string;
  source?: string;
  value: number;
}): MarketProviderEvidence {
  return {
    classification:
      input.field === "lowestListing"
        ? "Lowest Listing"
        : input.field === "recentSales"
          ? "Recent Sale"
          : "Market Price",
    confidence: {
      confidence: input.providerName === "TCGplayer" ? 92 : 70,
      coverage: input.providerName === "TCGplayer" ? 90 : 60,
      freshness: "Fresh",
    },
    field: input.field,
    node: {
      assetId: "Mox Opal",
      condition: input.condition ?? "NM",
      conditionSpecific:
        input.conditionSpecific ?? input.providerName === "TCGplayer",
      finish: "Nonfoil",
      nodeId: [
        "Mox Opal",
        "mox-opal-printing",
        "mox-opal-printing:nonfoil",
        "Nonfoil",
        input.condition ?? "NM",
        input.providerName,
        input.field,
      ].join("::"),
      printingId: "mox-opal-printing",
      productIdentifier: input.providerName,
      providerCondition:
        input.providerCondition ??
        (input.providerName === "TCGplayer" ? "Near Mint" : undefined),
      variantId: "mox-opal-printing:nonfoil",
    },
    providerName: input.providerName,
    retrievedAt: input.retrievedAt ?? "2026-07-09T00:00:00.000Z",
    source: input.source ?? input.providerName,
    value: input.value,
  };
}

test("Market Evidence Layer stacks provider evidence for known cards", () => {
  knownCards.forEach((cardName) => {
    const existingEvidence = [
      createEvidence({
        field: "marketPrice",
        providerName: "scryfall-market",
        value: 236.49,
      }),
    ];
    const incomingEvidence = [
      createEvidence({
        field: "lowestListing",
        providerName: "TCGplayer",
        value: 241.89,
      }),
      createEvidence({
        field: "recentSales",
        providerName: "TCGplayer",
        value: 3,
      }),
    ];
    const result = marketEvidenceLayer.apply({
      existingEvidence,
      incomingEvidence,
    });

    assert.equal(result.selectedValues.marketPrice, 236.49, cardName);
    assert.equal(result.selectedValues.lowestListing, 241.89, cardName);
    assert.equal(result.selectedValues.recentSales, 3, cardName);
    assert.equal(
      result.selections.marketPrice?.selectedProvider,
      "scryfall-market",
      cardName,
    );
    assert.equal(
      result.selections.lowestListing?.selectedProvider,
      "TCGplayer",
      cardName,
    );
  });
});

test("Market Evidence Layer selects condition-specific evidence over generic fallback", () => {
  const result = marketEvidenceLayer.apply({
    existingEvidence: [
      createEvidence({
        condition: "LP",
        conditionSpecific: false,
        field: "marketPrice",
        providerName: "scryfall-market",
        providerCondition: undefined,
        value: 100,
      }),
    ],
    incomingEvidence: [
      createEvidence({
        condition: "LP",
        conditionSpecific: true,
        field: "marketPrice",
        providerName: "TCGplayer",
        providerCondition: "Lightly Played",
        value: 84,
      }),
    ],
  });

  assert.equal(result.selectedValues.marketPrice, 84);
  assert.equal(result.selections.marketPrice?.provenance?.node.condition, "LP");
  assert.equal(
    result.selections.marketPrice?.provenance?.node.conditionSpecific,
    true,
  );
});

test("Condition-specific market prices are not condition-adjusted twice", () => {
  const lpPrice: MarketPrice = {
    id: "justtcg:mox-opal:lp",
    cardId: "mox-opal-printing",
    printingId: "mox-opal-printing",
    variantId: "mox-opal-printing:nonfoil",
    providerId: "justtcg",
    source: "JustTCG",
    currency: "USD",
    finish: "Nonfoil",
    price: 84,
    priceType: "market_estimate",
    updatedAt: "2026-07-09T00:00:00.000Z",
    confidence: 92,
    condition: "LP",
    conditionSpecific: true,
  };
  const snapshot = createConditionMarketSnapshot(lpPrice, "LP");

  assert.equal(snapshot.selectedPrice.price, 84);
  assert.equal(snapshot.selectedPrice.conditionSpecific, true);
});

test("Market Evidence Layer does not reduce knowledge when provider lacks a field", () => {
  const existingEvidence = [
    createEvidence({
      field: "marketPrice",
      providerName: "scryfall-market",
      value: 120,
    }),
  ];
  const result = marketEvidenceLayer.apply({
    existingEvidence,
    incomingEvidence: [],
  });

  assert.equal(result.selectedValues.marketPrice, 120);
  assert.equal(result.selectedValues.lowestListing, null);
  assert.equal(result.evidenceStack.length, 1);
});

test("Market Evidence Layer selects higher priority provider when both provide a field", () => {
  const result = marketEvidenceLayer.apply({
    existingEvidence: [
      createEvidence({
        field: "marketPrice",
        providerName: "scryfall-market",
        value: 100,
      }),
    ],
    incomingEvidence: [
      createEvidence({
        field: "marketPrice",
        providerName: "TCGplayer",
        value: 105,
      }),
    ],
  });

  assert.equal(result.selectedValues.marketPrice, 105);
  assert.equal(result.selections.marketPrice?.selectedProvider, "TCGplayer");
  assert.equal(result.selections.marketPrice?.provenance?.providerPriority, 40);
  assert.equal(result.coverage["scryfall-market"].marketPrice, true);
  assert.equal(result.coverage.TCGplayer.marketPrice, true);
});

test("Current Market Estimate projects JustTCG Variant Valuation when no consensus exists", () => {
  knownCards.forEach((cardName) => {
    const result = marketEvidenceLayer.apply({
      existingEvidence: [],
      incomingEvidence: [
        createEvidence({
          field: "marketPrice",
          providerName: "justtcg",
          source: "Variant Valuation",
          value: 111,
        }),
      ],
    });

    assert.equal(result.selectedValues.marketPrice, 111, cardName);
    assert.equal(result.selections.marketPrice?.selectedProvider, "justtcg", cardName);
    assert.equal(
      result.selections.marketPrice?.projection?.projectionUsed,
      true,
      cardName,
    );
    assert.equal(
      result.selections.marketPrice?.projection?.requestedUiField,
      "Current Market Estimate",
      cardName,
    );
    assert.equal(
      result.selections.marketPrice?.projection?.resolvedEvidenceDomain,
      "Variant Valuation",
      cardName,
    );
  });
});

test("Current Market Estimate prioritizes JustTCG Variant Valuation over non-consensus estimates", () => {
  const result = marketEvidenceLayer.apply({
    existingEvidence: [
      createEvidence({
        field: "marketPrice",
        providerName: "TCGplayer",
        value: 98,
      }),
    ],
    incomingEvidence: [
      createEvidence({
        conditionSpecific: true,
        field: "marketPrice",
        providerName: "justtcg",
        providerCondition: "Near Mint",
        source: "Variant Valuation",
        value: 104,
      }),
    ],
  });

  assert.equal(result.selectedValues.marketPrice, 104);
  assert.equal(result.selections.marketPrice?.selectedProvider, "justtcg");
  assert.equal(result.selections.marketPrice?.projection?.projectionUsed, true);
});

test("Variant Valuation does not project into Listing or Transaction fields", () => {
  const result = marketEvidenceLayer.apply({
    existingEvidence: [],
    incomingEvidence: [
      createEvidence({
        field: "marketPrice",
        providerName: "justtcg",
        source: "Variant Valuation",
        value: 111,
      }),
    ],
  });

  assert.equal(result.selectedValues.marketPrice, 111);
  assert.equal(result.selectedValues.lowestListing, null);
  assert.equal(result.selectedValues.recentSales, null);
  assert.equal(
    result.selections.lowestListing?.fallbackReason,
    "Listing Intelligence provider not connected.",
  );
  assert.equal(
    result.selections.recentSales?.fallbackReason,
    "No Transaction Intelligence provider connected.",
  );
});

test("Market Intelligence Repository preserves populated fields during layered refresh", () => {
  const storagePath = createStoragePath();
  const repository = new MarketIntelligenceRepository(storagePath);
  const context = createContext("Mox Opal");
  const refreshedAt = "2026-07-09T00:00:00.000Z";

  repository.upsertSnapshot({
    context,
    refresh: {
      evidence: [
        createEvidence({
          field: "marketPrice",
          providerName: "scryfall-market",
          retrievedAt: refreshedAt,
          value: 236.49,
        }),
      ],
      fields: marketSnapshotFields,
      providerId: "scryfall-market",
      refreshedAt,
      refreshTimeMs: 10,
      values: {},
    },
  });

  const layered = repository.upsertSnapshot({
    context,
    refresh: {
      evidence: [
        createEvidence({
          field: "lowestListing",
          providerName: "TCGplayer",
          retrievedAt: "2026-07-09T00:01:00.000Z",
          value: 241.89,
        }),
      ],
      fields: marketSnapshotFields,
      providerId: "tcgplayer",
      refreshedAt: "2026-07-09T00:01:00.000Z",
      refreshTimeMs: 8,
      values: {},
    },
  });

  assert.equal(layered.marketPrice, 236.49);
  assert.equal(layered.lowestListing, 241.89);
  assert.equal(layered.evidence.length, 2);
  assert.equal(layered.evidenceSelections.marketPrice?.selectedProvider, "scryfall-market");
  assert.equal(layered.evidenceSelections.lowestListing?.selectedProvider, "TCGplayer");

  fs.rmSync(storagePath, { force: true });
});
