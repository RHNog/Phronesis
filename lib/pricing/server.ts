import { operationalPricingDatabasePath } from "@/lib/pricing/databasePath";
import { PricingRepository } from "@/lib/pricing/repository";

let repository: PricingRepository | undefined;

export function getPricingRepository(): PricingRepository {
  repository ??= new PricingRepository(operationalPricingDatabasePath());
  return repository;
}
