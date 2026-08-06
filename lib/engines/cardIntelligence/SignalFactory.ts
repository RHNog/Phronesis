import {
  signalRegistry,
  type SignalDefinition,
} from "@/lib/engines/cardIntelligence/SignalRegistry";
import type {
  Signal,
  SignalName,
} from "@/lib/engines/cardIntelligence/models/Signal";
import type { CertificationProfile } from "@/lib/intelligence/certification/CertificationProfile";
import type { PlayabilityProfile } from "@/lib/intelligence/playability/PlayabilityProfile";
import type { Card } from "@/types/card";
import type { ConditionProfile } from "@/types/conditionProfile";
import type { ConditionMarketSnapshot } from "@/types/conditionMarketSnapshot";
import type { MarketContext } from "@/types/MarketContext";
import type { PrintingVariant } from "@/types/printingVariant";

type SignalFactoryInput = {
  printing: Card;
  variant: PrintingVariant;
  condition: ConditionProfile;
  marketContext: MarketContext;
  marketContextSnapshot: ConditionMarketSnapshot;
  certificationProfile?: CertificationProfile;
  playabilityProfile?: PlayabilityProfile;
};

function clampScore(score: number) {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function includesAny(values: (string | undefined)[], terms: string[]) {
  const normalizedValues = values
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  return terms.some((term) =>
    normalizedValues.some((value) => {
      if (term === "foil") {
        return !/\bnon[- ]?foil\b/.test(value) && /\bfoil\b/.test(value);
      }

      return value.includes(term);
    }),
  );
}

function getRarityScore(printing: Card) {
  const rarity = printing.rarity.toLowerCase();

  if (rarity.includes("mythic")) {
    return 88;
  }

  if (rarity.includes("rare")) {
    return 74;
  }

  if (rarity.includes("uncommon")) {
    return 58;
  }

  return 44;
}

function getCollectorScore(printing: Card, variant: PrintingVariant) {
  const isPremium = includesAny(
    [
      printing.set,
      printing.productFamily,
      printing.treatment,
      ...(printing.promoTypes ?? []),
      ...(printing.frameEffects ?? []),
      variant.finish,
    ],
    [
      "judge",
      "secret",
      "special",
      "masterpiece",
      "invention",
      "invocation",
      "textless",
      "foil",
      "borderless",
      "retro",
      "showcase",
    ],
  );

  return isPremium ? 92 : getRarityScore(printing);
}

function getConditionScore(condition: ConditionProfile) {
  return {
    DMG: 20,
    HP: 35,
    LP: 78,
    MP: 55,
    NM: 95,
  }[condition.code];
}

function scoreSignal(
  name: SignalName,
  input: SignalFactoryInput,
) {
  const collectorScore = getCollectorScore(input.printing, input.variant);
  const certificationScore =
    input.certificationProfile?.overallGrade ?? collectorScore;
  const collectorIntelligenceScore = clampScore(
    collectorScore * 0.7 + certificationScore * 0.3,
  );
  const rarityScore = getRarityScore(input.printing);
  const conditionScore = getConditionScore(input.condition);
  const marketConfidence = input.marketContextSnapshot.selectedPrice.confidence;
  const marketPrice = input.marketContextSnapshot.selectedPrice.price;
  const marketIntelligence = input.marketContextSnapshot.marketIntelligence;

  const scores: Record<SignalName, number> = {
    InvestmentPotential:
      collectorIntelligenceScore * 0.45 +
      rarityScore * 0.25 +
      marketConfidence * 0.3,
    FlipPotential: 70 * 0.45 + marketConfidence * 0.35 + conditionScore * 0.2,
    GradingPotential: conditionScore * 0.65 + collectorScore * 0.35,
    CollectorAppeal: collectorIntelligenceScore,
    Liquidity:
      marketIntelligence?.liquidity ?? (marketPrice >= 25 ? 72 : 56),
    Volatility: marketIntelligence?.volatility ?? 50,
    Scarcity: rarityScore * 0.5 + collectorIntelligenceScore * 0.5,
    Demand: marketIntelligence?.demandMomentum ?? 68,
    Playability:
      input.playabilityProfile?.overall.score ??
      (input.printing.game === "Magic" ? 45 : 0),
    ReprintRisk: collectorScore >= 90 ? 25 : 55,
    MarketConfidence: marketIntelligence?.marketConfidence ?? marketConfidence,
    HistoricalStability: 50,
  };

  return clampScore(scores[name]);
}

function explainSignal(definition: SignalDefinition, score: number) {
  if (definition.status === "future") {
    return "Reserved for future historical analytics.";
  }

  if (definition.status === "placeholder") {
    return "Estimated until live marketplace depth is available.";
  }

  return score >= 75
    ? "Strong signal from current card, printing, condition, and market context."
    : "Moderate signal from current card, printing, condition, and market context.";
}

function explainProviderBackedSignal(
  definition: SignalDefinition,
  input: SignalFactoryInput,
  score: number,
) {
  const marketIntelligence = input.marketContextSnapshot.marketIntelligence;

  if (
    marketIntelligence &&
    ["Demand", "Liquidity", "MarketConfidence", "Volatility"].includes(
      definition.name,
    )
  ) {
    return `${definition.label} is provider-backed by ${marketIntelligence.providerName} normalized market intelligence.`;
  }

  return explainSignal(definition, score);
}

function getContributingFactors(
  definition: SignalDefinition,
  input: SignalFactoryInput,
) {
  const sharedFactors = [
    input.printing.name,
    input.printing.set,
    input.variant.finish,
    input.condition.label,
    input.marketContext.marketplace,
  ];

  const signalFactors: Partial<Record<SignalName, string[]>> = {
    CollectorAppeal: [
      input.printing.treatment ?? "Standard treatment",
      input.printing.productFamily ?? "Main set",
      input.certificationProfile
        ? `${input.certificationProfile.modelName} ${input.certificationProfile.tier}`
        : "Certification Intelligence unavailable",
    ],
    Demand: input.marketContextSnapshot.marketIntelligence
      ? [
          `${input.marketContextSnapshot.marketIntelligence.trend} market trend`,
          `${input.marketContextSnapshot.marketIntelligence.recentSalesCount} recent sales`,
        ]
      : [],
    Liquidity: input.marketContextSnapshot.marketIntelligence
      ? [
          `${input.marketContextSnapshot.marketIntelligence.listingCount} active listings`,
          `${input.marketContextSnapshot.marketIntelligence.salesVelocity}% sales velocity`,
        ]
      : [input.marketContext.country, input.marketContext.currency],
    MarketConfidence: [
      `${input.marketContextSnapshot.marketIntelligence?.marketConfidence ?? input.marketContextSnapshot.selectedPrice.confidence}% market confidence`,
      input.marketContextSnapshot.marketIntelligence
        ? `${input.marketContextSnapshot.marketIntelligence.evidenceCoverage}% evidence coverage`
        : "",
    ],
    Playability: [
      input.playabilityProfile?.tier ?? "Unknown playability tier",
      input.playabilityProfile?.overall.explanation ??
        "Playability provider data unavailable",
    ],
    ReprintRisk: [
      input.printing.productFamily ?? "No special product family",
    ],
    Scarcity: [input.printing.rarity],
  };

  return [...sharedFactors, ...(signalFactors[definition.name] ?? [])].filter(
    Boolean,
  );
}

export function createSignal(
  definition: SignalDefinition,
  input: SignalFactoryInput,
): Signal {
  const score = scoreSignal(definition.name, input);
  const isPlayability = definition.name === "Playability";
  const playabilityProfile = input.playabilityProfile;
  const marketIntelligence = input.marketContextSnapshot.marketIntelligence;
  const isProviderBackedMarketSignal =
    Boolean(marketIntelligence) &&
    ["Demand", "Liquidity", "MarketConfidence", "Volatility"].includes(
      definition.name,
    );

  return {
    name: definition.name,
    label: definition.label,
    score,
    confidence:
      isPlayability && playabilityProfile
        ? playabilityProfile.overall.confidence
        : isProviderBackedMarketSignal
          ? marketIntelligence?.marketConfidence ?? input.marketContextSnapshot.selectedPrice.confidence
        : definition.status === "future"
        ? 10
        : definition.status === "placeholder"
          ? 40
          : input.marketContextSnapshot.selectedPrice.confidence,
    version: definition.version,
    contributingFactors: getContributingFactors(definition, input),
    supportingDataSources:
      isPlayability && playabilityProfile
        ? [playabilityProfile.overall.dataSource]
        : isProviderBackedMarketSignal && marketIntelligence
          ? [marketIntelligence.providerName]
        : definition.supportingDataSources,
    generatedAt: new Date().toISOString(),
    source: definition.source,
    explanation:
      isPlayability && playabilityProfile
        ? playabilityProfile.explanation
        : explainProviderBackedSignal(definition, input, score),
    status:
      isPlayability && playabilityProfile?.overall.availability === "LIVE"
        ? "live"
        : isProviderBackedMarketSignal
          ? "live"
        : definition.status,
  };
}

export function createSignals(input: SignalFactoryInput) {
  return signalRegistry.map((definition) => createSignal(definition, input));
}
