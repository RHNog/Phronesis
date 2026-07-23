import AppShell from "@/components/ui/AppShell";
import { mockCards } from "@/data/mockCards";
import {
  defaultStrategyId,
  seedStrategies,
  seedStrategyProfiles,
} from "@/data/seedStrategies";
import VendorWorkspace from "@/features/vendor/components/VendorWorkspace";
import { IdentityOrchestrator } from "@/lib/engines/identity/IdentityOrchestrator";

async function getIdentityCards() {
  const response = await new IdentityOrchestrator().search("urza saga textless");
  const cards = response.results.flatMap((result) => result.item.printings);

  return cards.length > 0 ? cards : mockCards;
}

type VendorPageProps = {
  searchParams: Promise<{
    condition?: string;
    printingId?: string;
    search?: string;
    variantId?: string;
  }>;
};

export default async function VendorPage({ searchParams }: VendorPageProps) {
  const selectionIntent = await searchParams;
  const cards = await getIdentityCards();

  return (
    <AppShell commandPaletteContext="VendorWorkspace">
      <div className="w-full space-y-6">
        <header>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Vendor Workspace
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Search, price, and evaluate an in-person buying opportunity.
          </p>
        </header>

        <VendorWorkspace
          cards={cards}
          defaultStrategyId={defaultStrategyId}
          strategies={seedStrategies}
          strategyProfiles={seedStrategyProfiles}
          initialSelection={selectionIntent}
        />
      </div>
    </AppShell>
  );
}
