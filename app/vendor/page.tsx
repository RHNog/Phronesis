import AppShell from "@/components/ui/AppShell";
import Link from "next/link";
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
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-3xl font-semibold tracking-tight text-white">
            Vendor Workspace
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Search, price, and evaluate an in-person buying opportunity.
          </p>
          </div>
          <Link href="/price-lookup" className="inline-flex min-h-11 items-center rounded-lg border border-cyan-800 bg-cyan-950/40 px-4 text-sm font-semibold text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Open price lookup</Link>
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
