import { getAuthDatabase } from "@/lib/auth/server";
import { MarketEvidenceRepository } from "@/lib/market/MarketEvidenceRepository";
import { WatchlistRepository } from "@/lib/watchlist/WatchlistRepository";

let repository: WatchlistRepository | undefined;
let evidenceRepository: MarketEvidenceRepository | undefined;

export function getWatchlistRepository(): WatchlistRepository {
  repository ??= new WatchlistRepository(getAuthDatabase());
  return repository;
}

export function getMarketEvidenceRepository(): MarketEvidenceRepository {
  evidenceRepository ??= new MarketEvidenceRepository(getAuthDatabase());
  return evidenceRepository;
}
