import type { RegionalCostProfile } from "@/lib/regional/domain";
import type { MarketProviderId } from "@/lib/market/providers";

export const PERSONAL_COST_FIELDS = [
  "usToBrazilFixedBrl",
  "usToBrazilPercent",
  "usToBrazilMinAcquisitionUsd",
  "usToBrazilMaxAcquisitionUsd",
  "usToBrazilMinGrossProceedsBrl",
  "usToBrazilMinGrossSpreadBrl",
  "usToBrazilMinNetProfitBrl",
  "usToBrazilMinProfitMarginPercent",
  "usToBrazilMinRoiPercent",
  "brazilToUsFixedUsd",
  "brazilToUsPercent",
  "brazilToUsMinAcquisitionBrl",
  "brazilToUsMaxAcquisitionBrl",
  "brazilToUsMinGrossProceedsUsd",
  "brazilToUsMinGrossSpreadUsd",
  "brazilToUsMinNetProfitUsd",
  "brazilToUsMinProfitMarginPercent",
  "brazilToUsMinRoiPercent",
  "maxEvidenceAgeHours",
] as const;

export type PersonalCostField = (typeof PERSONAL_COST_FIELDS)[number];

export type PersonalCostOverrides = Record<PersonalCostField, number | null>;

export type PersonalProviderPreference = {
  id: MarketProviderId;
  label: string;
  description: string;
  categoryIds: readonly string[];
  enabled: boolean;
  included: true;
};

export type UserMarketSettings = {
  providers: PersonalProviderPreference[];
  enabledProviderIds: MarketProviderId[];
  costOverrides: PersonalCostOverrides;
  workspaceCostProfile: RegionalCostProfile;
  effectiveCostProfile: RegionalCostProfile;
  updatedAt: string | null;
};

export function emptyPersonalCostOverrides(): PersonalCostOverrides {
  return Object.fromEntries(
    PERSONAL_COST_FIELDS.map((field) => [field, null]),
  ) as PersonalCostOverrides;
}

export function effectiveRegionalCostProfile(
  workspaceProfile: RegionalCostProfile,
  overrides: PersonalCostOverrides,
): RegionalCostProfile {
  const effective = { ...workspaceProfile };
  for (const field of PERSONAL_COST_FIELDS) {
    if (overrides[field] !== null) effective[field] = overrides[field];
  }
  return effective;
}
