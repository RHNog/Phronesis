import { join } from "node:path";
import { PricingRepository } from "@/lib/pricing/repository";

let repository: PricingRepository | undefined;

export function getPricingRepository(): PricingRepository {
  repository ??= new PricingRepository(
    process.env.PHRONESIS_PRICING_DB_PATH ?? join(process.cwd(), ".data", "pricing-lookup.sqlite"),
  );
  return repository;
}
