import "server-only";
import { getPricingRepository } from "@/lib/pricing/server";
import { BcbPtaxProvider } from "@/lib/regional/BcbPtaxProvider";
import { RegionalIntelligenceRepository } from "@/lib/regional/RegionalIntelligenceRepository";
import type { RegionalCostProfile } from "@/lib/regional/domain";

let repository: RegionalIntelligenceRepository | undefined;
export function getRegionalIntelligenceRepository(): RegionalIntelligenceRepository {
  repository ??= new RegionalIntelligenceRepository(
    getPricingRepository().database,
  );
  return repository;
}

const AUTOMATIC_REFRESH_INTERVAL = 3_600_000;
let refreshInFlight: Promise<RegionalCostProfile> | undefined;

export async function getRegionalProfileWithOfficialFx(options?: {
  force?: boolean;
}): Promise<RegionalCostProfile> {
  const regional = getRegionalIntelligenceRepository();
  const profile = regional.getProfile();
  const lastAttempt = profile.fxLastAttemptAt
    ? Date.parse(profile.fxLastAttemptAt)
    : Number.NaN;
  if (
    !options?.force &&
    Number.isFinite(lastAttempt) &&
    Date.now() - lastAttempt < AUTOMATIC_REFRESH_INTERVAL
  )
    return profile;
  refreshInFlight ??= refreshOfficialFx(regional).finally(() => {
    refreshInFlight = undefined;
  });
  return refreshInFlight;
}

async function refreshOfficialFx(
  regional: RegionalIntelligenceRepository,
): Promise<RegionalCostProfile> {
  try {
    const quote = await new BcbPtaxProvider().latestClosingQuote();
    return regional.recordOfficialFx(quote);
  } catch {
    return regional.recordOfficialFxFailure(new Date().toISOString());
  }
}
