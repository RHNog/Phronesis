import AppShell from "@/components/ui/AppShell";
import { mockCards } from "@/data/mockCards";
import { mockListings } from "@/data/mockListings";
import {
  defaultStrategyId,
  seedStrategies,
  seedStrategyProfiles,
} from "@/data/seedStrategies";
import PurchaseEvaluationForm from "@/features/evaluation/components/PurchaseEvaluationForm";

export default function EvaluatePage() {
  return (
    <AppShell>
      <div className="w-full space-y-6">
        <header>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Purchase Evaluation
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Evaluate a single card according to the selected buying strategy.
          </p>
        </header>

        <PurchaseEvaluationForm
          cards={mockCards}
          marketListings={mockListings}
          strategies={seedStrategies}
          strategyProfiles={seedStrategyProfiles}
          defaultStrategyId={defaultStrategyId}
        />
      </div>
    </AppShell>
  );
}
