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

export type BenchmarkCase = { expectedPrintingId: string; split: "TRAIN" | "DEV" | "HOLDOUT"; decisionStatus: RecognitionDecisionStatus; selectedPrintingId: string | null; latencyMs: number };

export function benchmarkRecognition(cases: BenchmarkCase[], minimumHoldout = 1000, requiredAcceptedPrecision = 0.999) {
  const holdout = cases.filter((item) => item.split === "HOLDOUT");
  const accepted = holdout.filter((item) => item.decisionStatus === "ACCEPTED");
  const correct = accepted.filter((item) => item.selectedPrintingId === item.expectedPrintingId).length;
  const acceptedPrecision = accepted.length ? correct / accepted.length : null;
  const sortedLatency = holdout.map((item) => item.latencyMs).sort((a, b) => a - b);
  const percentile = (p: number) => sortedLatency.length ? sortedLatency[Math.min(sortedLatency.length - 1, Math.ceil(sortedLatency.length * p) - 1)] : null;
  const qualified = holdout.length >= minimumHoldout && accepted.length > 0 && acceptedPrecision !== null && acceptedPrecision >= requiredAcceptedPrecision;
  return {
    status: qualified ? "QUALIFIED" as const : "NOT_QUALIFIED" as const,
    holdoutCount: holdout.length,
    acceptedCount: accepted.length,
    acceptedPrecision,
    reviewRate: holdout.length ? holdout.filter((item) => item.decisionStatus === "REVIEW").length / holdout.length : null,
    abstainRate: holdout.length ? holdout.filter((item) => item.decisionStatus === "ABSTAINED").length / holdout.length : null,
    p50LatencyMs: percentile(0.5),
    p95LatencyMs: percentile(0.95),
    qualification: { minimumHoldout, requiredAcceptedPrecision },
  };
}
