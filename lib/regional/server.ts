import "server-only";
import { getPricingRepository } from "@/lib/pricing/server";
import { RegionalIntelligenceRepository } from "@/lib/regional/RegionalIntelligenceRepository";

let repository: RegionalIntelligenceRepository | undefined;
export function getRegionalIntelligenceRepository(): RegionalIntelligenceRepository {
  repository ??= new RegionalIntelligenceRepository(
    getPricingRepository().database,
  );
  return repository;
}
