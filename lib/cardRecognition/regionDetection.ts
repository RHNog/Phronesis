import { createHash } from "node:crypto";
import { assertSha256, validateRegionGeometry, type NormalizedRegion } from "@/lib/cardRecognition/contracts";
import { stableJson } from "@/lib/cardRecognition/stableJson";

export type RegionSuggestion = {
  order: number;
  geometry: NormalizedRegion;
  confidence: number;
};

export type RegionDetectionResult = {
  schemaVersion: "phronesis.vision-regions.v1";
  coordinateOrigin: "TOP_LEFT";
  regions: RegionSuggestion[];
};

export function regionIntersectionOverUnion(left: NormalizedRegion, right: NormalizedRegion): number {
  const width = Math.max(0, Math.min(left.x + left.width, right.x + right.width) - Math.max(left.x, right.x));
  const height = Math.max(0, Math.min(left.y + left.height, right.y + right.height) - Math.max(left.y, right.y));
  const intersection = width * height;
  const union = left.width * left.height + right.width * right.height - intersection;
  return union > 0 ? Math.min(1, Math.max(0, intersection / union)) : 0;
}

export function validateRegionDetection(result: RegionDetectionResult): void {
  if (result.schemaVersion !== "phronesis.vision-regions.v1" || result.coordinateOrigin !== "TOP_LEFT" || !Array.isArray(result.regions)) throw new Error("invalid region-detection contract");
  result.regions.forEach((suggestion, index) => {
    if (suggestion.order !== index) throw new Error("region suggestions must use contiguous deterministic order");
    if (!Number.isFinite(suggestion.confidence) || suggestion.confidence < 0 || suggestion.confidence > 1) throw new Error("region confidence must be within [0,1]");
    validateRegionGeometry(suggestion.geometry);
    for (let prior = 0; prior < index; prior += 1) {
      if (regionIntersectionOverUnion(suggestion.geometry, result.regions[prior].geometry) >= 0.8) throw new Error("region suggestions contain overlapping duplicates");
    }
  });
}

export type RegionBenchmarkCase = {
  caseId: string;
  split: "TRAIN" | "DEV" | "HOLDOUT";
  sourceKind: "SYNTHETIC" | "LABELED_REAL";
  sourceFrameSha256: string;
  labelSha256: string;
  labelApproval?: { approvedBy: string; approvedAt: string; scope: string } | null;
  stratum: string;
  expectedRegions: NormalizedRegion[];
  prediction: RegionDetectionResult;
  latencyMs: number;
};

export type RegionBenchmarkInputV1 = {
  schemaVersion: "phronesis.region-benchmark.v1";
  benchmarkVersion: string;
  createdAt: string;
  cases: RegionBenchmarkCase[];
  qualification?: {
    minimumRealHoldoutFrames?: number;
    minimumPerStratum?: number;
    iouThreshold?: number;
    requiredPrecision?: number;
    requiredRecall?: number;
    requiredExactCountRate?: number;
    maximumP95LatencyMs?: number;
  };
};

function positiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
}

function unitInterval(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > 1) throw new Error(`${name} must be in (0,1]`);
}

function matchRegions(expected: NormalizedRegion[], predicted: RegionSuggestion[], threshold: number) {
  const unmatched = new Set(expected.map((_, index) => index));
  const matches: number[] = [];
  for (const suggestion of predicted) {
    let bestIndex = -1;
    let bestIou = 0;
    for (const index of unmatched) {
      const iou = regionIntersectionOverUnion(expected[index], suggestion.geometry);
      if (iou > bestIou || (iou === bestIou && index < bestIndex)) {
        bestIndex = index;
        bestIou = iou;
      }
    }
    if (bestIndex >= 0 && bestIou >= threshold) {
      unmatched.delete(bestIndex);
      matches.push(bestIou);
    }
  }
  return { matches, falsePositives: predicted.length - matches.length, falseNegatives: expected.length - matches.length };
}

export function benchmarkRegionDetection(input: RegionBenchmarkInputV1) {
  if (input.schemaVersion !== "phronesis.region-benchmark.v1") throw new Error("unsupported region benchmark schema");
  if (!input.benchmarkVersion || !Number.isFinite(Date.parse(input.createdAt))) throw new Error("invalid region benchmark metadata");
  const qualification = {
    minimumRealHoldoutFrames: input.qualification?.minimumRealHoldoutFrames ?? 100,
    minimumPerStratum: input.qualification?.minimumPerStratum ?? 10,
    iouThreshold: input.qualification?.iouThreshold ?? 0.75,
    requiredPrecision: input.qualification?.requiredPrecision ?? 0.995,
    requiredRecall: input.qualification?.requiredRecall ?? 0.99,
    requiredExactCountRate: input.qualification?.requiredExactCountRate ?? 0.98,
    maximumP95LatencyMs: input.qualification?.maximumP95LatencyMs ?? 1_000,
  };
  positiveInteger(qualification.minimumRealHoldoutFrames, "minimumRealHoldoutFrames");
  positiveInteger(qualification.minimumPerStratum, "minimumPerStratum");
  unitInterval(qualification.iouThreshold, "iouThreshold");
  unitInterval(qualification.requiredPrecision, "requiredPrecision");
  unitInterval(qualification.requiredRecall, "requiredRecall");
  unitInterval(qualification.requiredExactCountRate, "requiredExactCountRate");
  if (!Number.isFinite(qualification.maximumP95LatencyMs) || qualification.maximumP95LatencyMs <= 0) throw new Error("maximumP95LatencyMs must be positive");

  const caseIds = new Set<string>();
  const sourceFrames = new Set<string>();
  const labels = new Set<string>();
  for (const item of input.cases) {
    if (!item.caseId || caseIds.has(item.caseId)) throw new Error(`duplicate or empty region benchmark case ${item.caseId}`);
    caseIds.add(item.caseId);
    assertSha256(item.sourceFrameSha256, `case ${item.caseId} sourceFrameSha256`);
    assertSha256(item.labelSha256, `case ${item.caseId} labelSha256`);
    if (sourceFrames.has(item.sourceFrameSha256)) throw new Error(`source frame ${item.sourceFrameSha256} is reused by multiple benchmark cases`);
    if (labels.has(item.labelSha256)) throw new Error(`label ${item.labelSha256} is reused by multiple benchmark cases`);
    sourceFrames.add(item.sourceFrameSha256);
    labels.add(item.labelSha256);
    if (item.sourceKind === "LABELED_REAL" && (!item.labelApproval?.approvedBy || !item.labelApproval.scope || !Number.isFinite(Date.parse(item.labelApproval.approvedAt)))) throw new Error(`real benchmark case ${item.caseId} lacks label approval evidence`);
    if (!item.stratum.trim()) throw new Error(`case ${item.caseId} lacks a stratum`);
    if (!Number.isFinite(item.latencyMs) || item.latencyMs < 0) throw new Error(`case ${item.caseId} has invalid latency`);
    item.expectedRegions.forEach(validateRegionGeometry);
    validateRegionDetection(item.prediction);
  }

  const realHoldout = input.cases.filter((item) => item.split === "HOLDOUT" && item.sourceKind === "LABELED_REAL");
  const measured = realHoldout.map((item) => ({ item, ...matchRegions(item.expectedRegions, item.prediction.regions, qualification.iouThreshold) }));
  const truePositives = measured.reduce((sum, item) => sum + item.matches.length, 0);
  const falsePositives = measured.reduce((sum, item) => sum + item.falsePositives, 0);
  const falseNegatives = measured.reduce((sum, item) => sum + item.falseNegatives, 0);
  const precision = truePositives + falsePositives ? truePositives / (truePositives + falsePositives) : null;
  const recall = truePositives + falseNegatives ? truePositives / (truePositives + falseNegatives) : null;
  const exactCountRate = measured.length ? measured.filter(({ item }) => item.expectedRegions.length === item.prediction.regions.length).length / measured.length : null;
  const allIous = measured.flatMap((item) => item.matches);
  const meanMatchedIou = allIous.length ? allIous.reduce((sum, value) => sum + value, 0) / allIous.length : null;
  const latencies = realHoldout.map((item) => item.latencyMs).sort((a, b) => a - b);
  const p95LatencyMs = latencies.length ? latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)] : null;
  const failureStrata = [...new Set(realHoldout.map((item) => item.stratum))].sort().map((stratum) => {
    const members = measured.filter(({ item }) => item.stratum === stratum);
    return {
      stratum,
      frameCount: members.length,
      falsePositives: members.reduce((sum, item) => sum + item.falsePositives, 0),
      falseNegatives: members.reduce((sum, item) => sum + item.falseNegatives, 0),
      exactCountFailures: members.filter(({ item }) => item.expectedRegions.length !== item.prediction.regions.length).length,
    };
  });
  const strataPowered = failureStrata.length > 0 && failureStrata.every((item) => item.frameCount >= qualification.minimumPerStratum);
  const qualified = realHoldout.length >= qualification.minimumRealHoldoutFrames && strataPowered && precision !== null && precision >= qualification.requiredPrecision && recall !== null && recall >= qualification.requiredRecall && exactCountRate !== null && exactCountRate >= qualification.requiredExactCountRate && p95LatencyMs !== null && p95LatencyMs <= qualification.maximumP95LatencyMs;
  const report = {
    schemaVersion: "phronesis.region-benchmark-report.v1" as const,
    benchmarkVersion: input.benchmarkVersion,
    createdAt: input.createdAt,
    status: qualified ? "QUALIFIED" as const : "NOT_QUALIFIED" as const,
    syntheticCaseCount: input.cases.filter((item) => item.sourceKind === "SYNTHETIC").length,
    realHoldoutFrameCount: realHoldout.length,
    truePositives,
    falsePositives,
    falseNegatives,
    precision,
    recall,
    exactCountRate,
    meanMatchedIou,
    p95LatencyMs,
    failureStrata,
    qualification: { ...qualification, strataPowered },
  };
  return { ...report, reportSha256: createHash("sha256").update(stableJson(report)).digest("hex") };
}
