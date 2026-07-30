import IntelligenceConsole from "@/components/intelligence/IntelligenceConsole";
import {
  getConfidenceLabel,
  getIntelligenceGrade,
} from "@/components/intelligence/IntelligenceGrade";
import DecisionBadge from "@/features/vendor/components/DecisionBadge";
import type { ReadyPurchaseEvaluation } from "@/lib/engines/evaluation/evaluatePurchase";

const visibleEvidenceLimit = 3;
const emptyEvidenceLabel = "None identified in current evidence.";

export type BuyingIntelligenceSummary = {
  assessment: string;
  businessConclusion: string;
  confidenceLabel: string;
  confidenceReason: string;
  decisionAction: ReadyPurchaseEvaluation["decision"]["action"];
  evidenceCoverage: number;
  grade: string;
  opportunities: string[];
  primaryDrivers: string[];
  risks: string[];
};

function visibleEvidence(items: string[]) {
  return items.filter(Boolean).slice(0, visibleEvidenceLimit);
}

export function createBuyingIntelligenceSummary(
  evaluation: ReadyPurchaseEvaluation,
): BuyingIntelligenceSummary {
  const assessment = evaluation.cardProfile.assetAssessment;

  return {
    assessment: assessment.overallAssessment,
    businessConclusion: assessment.businessSummary,
    confidenceLabel: getConfidenceLabel(assessment.confidence.score),
    confidenceReason: assessment.confidence.reason,
    decisionAction: evaluation.decision.action,
    evidenceCoverage: assessment.evidenceCoverage,
    grade: getIntelligenceGrade(assessment.overallScore),
    opportunities: visibleEvidence(assessment.opportunityFactors),
    primaryDrivers: visibleEvidence(assessment.primaryDrivers),
    risks: visibleEvidence(assessment.riskFactors),
  };
}

function EvidenceList({
  items,
  title,
}: {
  items: string[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2 text-sm text-zinc-300">
          {items.map((item) => (
            <li key={item} className="flex min-w-0 gap-2">
              <span aria-hidden="true" className="mt-0.5 text-cyan-300">
                •
              </span>
              <span className="min-w-0 break-words">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-zinc-500">{emptyEvidenceLabel}</p>
      )}
    </div>
  );
}

export default function BuyingIntelligencePanel({
  evaluation,
}: {
  evaluation: ReadyPurchaseEvaluation;
}) {
  const summary = createBuyingIntelligenceSummary(evaluation);

  return (
    <section
      aria-labelledby="phronesis-intelligence-heading"
      className="mt-4 border-t border-zinc-800 pt-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
            Decision explanation
          </p>
          <h3
            id="phronesis-intelligence-heading"
            className="mt-1 text-base font-semibold text-white"
          >
            Phronesis Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Current action</span>
          <DecisionBadge action={summary.decisionAction} />
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="text-xs text-zinc-500">Asset Assessment</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">
            {summary.grade}
            <span className="ml-2 text-sm font-medium text-zinc-300">
              {summary.assessment}
            </span>
          </p>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="text-xs text-zinc-500">Evidence Coverage</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {summary.evidenceCoverage}%
          </p>
        </div>
        <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3">
          <p className="text-xs text-zinc-500">Assessment Confidence</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {summary.confidenceLabel}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-cyan-400/20 bg-cyan-400/5 p-3">
        <p className="text-xs font-medium uppercase tracking-wide text-cyan-300">
          Business conclusion
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-200">
          {summary.businessConclusion}
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Confidence context: {summary.confidenceReason}
        </p>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-3">
        <EvidenceList items={summary.primaryDrivers} title="Primary signals" />
        <EvidenceList items={summary.opportunities} title="Opportunities" />
        <EvidenceList items={summary.risks} title="Risks" />
      </div>

      <details className="group mt-3 rounded-md border border-zinc-800 bg-zinc-950/40">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 [&::-webkit-details-marker]:hidden">
          <span>Explore intelligence models</span>
          <span aria-hidden="true" className="text-xs text-zinc-500 group-open:hidden">
            ▶
          </span>
          <span aria-hidden="true" className="hidden text-xs text-zinc-500 group-open:inline">
            ▼
          </span>
        </summary>
        <div className="border-t border-zinc-800 p-2">
          <IntelligenceConsole cardProfile={evaluation.cardProfile} />
        </div>
      </details>
    </section>
  );
}
