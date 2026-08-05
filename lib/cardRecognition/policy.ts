import type { RecognitionCandidate, RecognitionDecisionStatus } from "@/lib/cardRecognition/contracts";

export type ConfidencePolicy = {
  version: string;
  autoAcceptEnabled: boolean;
  acceptedThreshold: number;
  acceptedMargin: number;
  reviewThreshold: number;
  qualifiedBenchmarkSha256: string | null;
};

export const conservativePolicy: ConfidencePolicy = {
  version: "recognition-policy-v1-review-only",
  autoAcceptEnabled: false,
  acceptedThreshold: 0.995,
  acceptedMargin: 0.05,
  reviewThreshold: 0.45,
  qualifiedBenchmarkSha256: null,
};

export function decideCandidates(candidates: RecognitionCandidate[], policy: ConfidencePolicy): {
  status: RecognitionDecisionStatus;
  selected: RecognitionCandidate | null;
  reason: string;
} {
  const ordered = [...candidates].sort((a, b) => b.score - a.score || a.canonicalPrintingId.localeCompare(b.canonicalPrintingId));
  const top = ordered[0];
  if (!top || top.score < policy.reviewThreshold) return { status: "ABSTAINED", selected: null, reason: "No candidate met the review threshold." };
  const margin = top.score - (ordered[1]?.score ?? 0);
  if (policy.autoAcceptEnabled && policy.qualifiedBenchmarkSha256 && top.score >= policy.acceptedThreshold && margin >= policy.acceptedMargin) {
    return { status: "ACCEPTED", selected: top, reason: "Candidate met the activated benchmark-qualified policy." };
  }
  return { status: "REVIEW", selected: top, reason: policy.autoAcceptEnabled ? "Candidate did not meet the auto-accept threshold and margin." : "Auto-accept is disabled pending a qualified holdout." };
}

export type BenchmarkCase = {
  expectedPrintingId: string;
  split: "TRAIN" | "DEV" | "HOLDOUT";
  decisionStatus: RecognitionDecisionStatus;
  selectedPrintingId: string | null;
  candidatePrintingIds?: string[];
  latencyMs: number;
  pairingCorrect?: boolean | null;
  stratum?: string;
};

export function benchmarkRecognition(cases: BenchmarkCase[], minimumHoldout = 1000, requiredAcceptedPrecision = 0.999, minimumAccepted = 100, minimumPerStratum = 30) {
  if (!Number.isInteger(minimumHoldout) || minimumHoldout < 1) throw new Error("minimumHoldout must be a positive integer");
  if (!Number.isInteger(minimumAccepted) || minimumAccepted < 1) throw new Error("minimumAccepted must be a positive integer");
  if (!Number.isInteger(minimumPerStratum) || minimumPerStratum < 1) throw new Error("minimumPerStratum must be a positive integer");
  if (!Number.isFinite(requiredAcceptedPrecision) || requiredAcceptedPrecision <= 0 || requiredAcceptedPrecision > 1) throw new Error("requiredAcceptedPrecision must be in (0,1]");
  const holdout = cases.filter((item) => item.split === "HOLDOUT");
  const accepted = holdout.filter((item) => item.decisionStatus === "ACCEPTED");
  const correct = accepted.filter((item) => item.selectedPrintingId === item.expectedPrintingId).length;
  const acceptedPrecision = accepted.length ? correct / accepted.length : null;
  const sortedLatency = holdout.map((item) => item.latencyMs).sort((a, b) => a - b);
  const percentile = (p: number) => sortedLatency.length ? sortedLatency[Math.min(sortedLatency.length - 1, Math.ceil(sortedLatency.length * p) - 1)] : null;
  const top1Correct = holdout.filter((item) => (item.candidatePrintingIds?.[0] ?? item.selectedPrintingId) === item.expectedPrintingId).length;
  const topKCorrect = holdout.filter((item) => (item.candidatePrintingIds ?? (item.selectedPrintingId ? [item.selectedPrintingId] : [])).includes(item.expectedPrintingId)).length;
  const paired = holdout.filter((item) => typeof item.pairingCorrect === "boolean");
  const strata = [...new Set(holdout.map((item) => item.stratum ?? "UNSPECIFIED"))].sort().map((stratum) => {
    const members = holdout.filter((item) => (item.stratum ?? "UNSPECIFIED") === stratum);
    return {
      stratum,
      count: members.length,
      top1Errors: members.filter((item) => (item.candidatePrintingIds?.[0] ?? item.selectedPrintingId) !== item.expectedPrintingId).length,
      acceptedErrors: members.filter((item) => item.decisionStatus === "ACCEPTED" && item.selectedPrintingId !== item.expectedPrintingId).length,
    };
  });
  const strataPowered = strata.length > 0 && strata.every((item) => item.count >= minimumPerStratum);
  const qualified = holdout.length >= minimumHoldout && accepted.length >= minimumAccepted && acceptedPrecision !== null && acceptedPrecision >= requiredAcceptedPrecision && strataPowered;
  return {
    status: qualified ? "QUALIFIED" as const : "NOT_QUALIFIED" as const,
    holdoutCount: holdout.length,
    acceptedCount: accepted.length,
    acceptedPrecision,
    top1Recall: holdout.length ? top1Correct / holdout.length : null,
    topKRecall: holdout.length ? topKCorrect / holdout.length : null,
    reviewRate: holdout.length ? holdout.filter((item) => item.decisionStatus === "REVIEW").length / holdout.length : null,
    abstainRate: holdout.length ? holdout.filter((item) => item.decisionStatus === "ABSTAINED").length / holdout.length : null,
    pairingAccuracy: paired.length ? paired.filter((item) => item.pairingCorrect).length / paired.length : null,
    p50LatencyMs: percentile(0.5),
    p95LatencyMs: percentile(0.95),
    failureStrata: strata,
    qualification: { minimumHoldout, minimumAccepted, minimumPerStratum, requiredAcceptedPrecision, strataPowered },
  };
}
