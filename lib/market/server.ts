import "server-only";
import { MarketHistoryRepository } from "@/lib/market/history";
import { getPricingRepository } from "@/lib/pricing/server";

let repository: MarketHistoryRepository | undefined;

export function getMarketHistoryRepository(): MarketHistoryRepository {
  repository ??= new MarketHistoryRepository(getPricingRepository().database);
  return repository;
}
