import { normalizeSearchText } from "@/lib/pricing/domain";

export type CrossMarketMatchStatus =
  "MATCHED" | "UNMATCHED" | "AMBIGUOUS" | "UNSUPPORTED_VARIANT";

export type ArbitrageDirection = "US_TO_BRAZIL" | "BRAZIL_TO_US";
export type ArbitrageState =
  | "INDICATIVE"
  | "IDENTITY_VERIFIED"
  | "COSTED"
  | "AVAILABILITY_VERIFIED"
  | "ACTIONABLE"
  | "STALE"
  | "REJECTED";

export type RegionalMarketEvidence = {
  ligaIdentityKey: string;
  categoryId: string;
  sku: string;
  cardName: string;
  editionName: string;
  editionCode: string;
  collectorNumber: string;
  variant: string;
  observedAt: string;
  consumerLowCentavos: number | null;
  consumerAverageCentavos: number | null;
  consumerHighCentavos: number | null;
  storeBuyLowCentavos: number | null;
  storeBuyAverageCentavos: number | null;
  storeBuyHighCentavos: number | null;
};

export type RegionalCostProfile = {
  brlPerUsd: number | null;
  brlPerUsdBuy: number | null;
  brlPerUsdSell: number | null;
  fxObservedAt: string | null;
  fxFetchedAt: string | null;
  fxLastAttemptAt: string | null;
  fxSource: string | null;
  fxLastError: string | null;
  usToBrazilFixedBrl: number | null;
  usToBrazilPercent: number | null;
  brazilToUsFixedUsd: number | null;
  brazilToUsPercent: number | null;
  updatedAt: string | null;
};

export type ArbitrageCalculation = {
  state: ArbitrageState;
  blocker: string | null;
  grossProceeds: number | null;
  totalCost: number | null;
  netProfit: number | null;
  roiPercent: number | null;
};

export function normalizeCollectorNumber(value: string): string {
  const normalized = value.normalize("NFKC").trim().toLowerCase();
  if (!normalized) return "";
  const numerator = normalized.split("/")[0].trim();
  return numerator.replace(/^0+(?=\d)/, "").replace(/[^a-z0-9]+/g, "");
}

export function normalizeRegionalVariant(
  value: string,
): "Normal" | "Foil" | null {
  const normalized = normalizeSearchText(value);
  if (
    !normalized ||
    normalized === "regular" ||
    normalized === "normal" ||
    normalized === "nonfoil"
  ) {
    return "Normal";
  }
  if (normalized === "foil") return "Foil";
  return null;
}

export function crossMarketIdentityKey(input: {
  name: string;
  edition: string;
  collectorNumber: string;
  variant: string;
}): string | null {
  const collector = normalizeCollectorNumber(input.collectorNumber);
  const variant = normalizeRegionalVariant(input.variant);
  if (!collector || !variant) return null;
  return [
    normalizeSearchText(input.name),
    normalizeSearchText(input.edition),
    collector,
    variant.toLowerCase(),
  ].join("|");
}

export function calculateArbitrage(input: {
  direction: ArbitrageDirection;
  profile: RegionalCostProfile;
  usPriceUsd: number | null;
  brazilPriceBrl: number | null;
  identityVerified: boolean;
  sourcesFresh: boolean;
  availabilityVerified: boolean;
}): ArbitrageCalculation {
  if (!input.identityVerified)
    return blocked(
      "INDICATIVE",
      "Exact cross-market identity is not verified.",
    );
  if (!input.sourcesFresh)
    return blocked("STALE", "One or more market observations are stale.");
  if (!positive(input.usPriceUsd) || !positive(input.brazilPriceBrl)) {
    return blocked("IDENTITY_VERIFIED", "Both regional prices are required.");
  }
  const exchangeRate =
    input.direction === "US_TO_BRAZIL"
      ? (input.profile.brlPerUsdSell ?? input.profile.brlPerUsd)
      : (input.profile.brlPerUsdBuy ?? input.profile.brlPerUsd);
  if (!positive(exchangeRate) || !input.profile.fxObservedAt) {
    return blocked(
      "IDENTITY_VERIFIED",
      "A timestamped BRL/USD observation is required.",
    );
  }
  const officialPtax = input.profile.fxSource?.startsWith(
    "Banco Central do Brasil PTAX",
  );
  const maximumAge = officialPtax ? 7 * 86_400_000 : 48 * 3_600_000;
  if (Date.now() - Date.parse(input.profile.fxObservedAt) > maximumAge) {
    return blocked(
      "STALE",
      officialPtax
        ? "The latest official PTAX close is older than seven days."
        : "The BRL/USD observation is older than 48 hours.",
    );
  }

  let grossProceeds: number;
  let totalCost: number;
  if (input.direction === "US_TO_BRAZIL") {
    if (
      !nonNegative(input.profile.usToBrazilFixedBrl) ||
      !nonNegative(input.profile.usToBrazilPercent)
    ) {
      return blocked("IDENTITY_VERIFIED", "US-to-Brazil costs are incomplete.");
    }
    grossProceeds = input.brazilPriceBrl;
    const acquisitionBrl = input.usPriceUsd * exchangeRate;
    totalCost =
      acquisitionBrl * (1 + input.profile.usToBrazilPercent / 100) +
      input.profile.usToBrazilFixedBrl;
  } else {
    if (
      !nonNegative(input.profile.brazilToUsFixedUsd) ||
      !nonNegative(input.profile.brazilToUsPercent)
    ) {
      return blocked("IDENTITY_VERIFIED", "Brazil-to-US costs are incomplete.");
    }
    grossProceeds = input.usPriceUsd;
    const acquisitionUsd = input.brazilPriceBrl / exchangeRate;
    totalCost =
      acquisitionUsd * (1 + input.profile.brazilToUsPercent / 100) +
      input.profile.brazilToUsFixedUsd;
  }
  const netProfit = grossProceeds - totalCost;
  const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : null;
  return {
    state:
      input.availabilityVerified && netProfit > 0 ? "ACTIONABLE" : "COSTED",
    blocker: input.availabilityVerified
      ? netProfit > 0
        ? null
        : "Verified economics do not produce a positive net profit."
      : "Verify an executable price and quantity before action.",
    grossProceeds: round(grossProceeds),
    totalCost: round(totalCost),
    netProfit: round(netProfit),
    roiPercent: roiPercent === null ? null : round(roiPercent),
  };
}

function positive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

function nonNegative(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

function blocked(state: ArbitrageState, blocker: string): ArbitrageCalculation {
  return {
    state,
    blocker,
    grossProceeds: null,
    totalCost: null,
    netProfit: null,
    roiPercent: null,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
