import { notFound } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import { mockCards } from "@/data/mockCards";
import { mockListings } from "@/data/mockListings";
import { mockMarketplaces } from "@/data/mockMarketplaces";
import {
  defaultStrategyId,
  seedStrategies,
  seedStrategyProfiles,
} from "@/data/seedStrategies";
import { mockWatchlists } from "@/data/mockWatchlists";
import OpportunityDetails from "@/features/opportunities/components/OpportunityDetails";
import { generateOpportunity } from "@/lib/engines/opportunity/generateOpportunity";
import { applyStrategy } from "@/lib/engines/strategy/applyStrategy";
import { MockMarketProvider } from "@/lib/providers/market/MockMarketProvider";

type OpportunityDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function findById<T extends { id: string }>(items: T[], id: string) {
  return items.find((item) => item.id === id);
}

export default async function OpportunityDetailsPage({
  params,
}: OpportunityDetailsPageProps) {
  const { id } = await params;
  const provider = new MockMarketProvider();
  const selectedStrategy =
    findById(seedStrategies, defaultStrategyId) ?? seedStrategies[0];
  const selectedStrategyProfile = selectedStrategy
    ? findById(seedStrategyProfiles, selectedStrategy.profileId)
    : undefined;
  const opportunity = await generateOpportunity(
    provider,
    "store-championship-urzas-saga-textless",
  );
  const rankedOpportunity =
    opportunity && selectedStrategyProfile
      ? applyStrategy(selectedStrategyProfile, [opportunity]).find(
        (item) => item.id === id,
      )
      : undefined;

  if (!rankedOpportunity) {
    notFound();
  }

  const card = findById(mockCards, rankedOpportunity.cardId);
  const watchlist = findById(mockWatchlists, rankedOpportunity.watchlistId);
  const buyListing = findById(mockListings, rankedOpportunity.buyListingId);
  const sellListing = findById(mockListings, rankedOpportunity.sellListingId);
  const buyMarketplace = buyListing
    ? findById(mockMarketplaces, buyListing.marketplaceId)
    : undefined;
  const sellMarketplace = sellListing
    ? findById(mockMarketplaces, sellListing.marketplaceId)
    : undefined;

  if (
    !card ||
    !watchlist ||
    !buyListing ||
    !sellListing ||
    !buyMarketplace ||
    !sellMarketplace
  ) {
    notFound();
  }

  return (
    <AppShell requiredModule="INTELLIGENCE">
      <OpportunityDetails
        opportunity={rankedOpportunity}
        card={card}
        watchlist={watchlist}
        buyListing={buyListing}
        sellListing={sellListing}
        buyMarketplace={buyMarketplace}
        sellMarketplace={sellMarketplace}
      />
    </AppShell>
  );
}
