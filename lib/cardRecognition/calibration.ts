import { createHash } from "node:crypto";
import { assessCorpusReadiness, verifyCorpusManifest, type CorpusManifest } from "@/lib/cardRecognition/corpus";
import { benchmarkRecognition, type BenchmarkCase } from "@/lib/cardRecognition/policy";
import { stableJson } from "@/lib/cardRecognition/stableJson";

export type CalibrationCase = BenchmarkCase & {
  caseId: string;
  corpusAssetId: string;
};

export type CalibrationInputV1 = {
  schemaVersion: "phronesis.recognition-calibration.v1";
  benchmarkVersion: string;
  createdAt: string;
  manifest: CorpusManifest;
  cases: CalibrationCase[];
  qualification?: {
    minimumHoldout?: number;
    minimumAccepted?: number;
    minimumPerStratum?: number;
    requiredAcceptedPrecision?: number;
  };
};

export function runCalibration(input: CalibrationInputV1) {
  if (input.schemaVersion !== "phronesis.recognition-calibration.v1") throw new Error("unsupported calibration schema");
  if (!input.benchmarkVersion || !Number.isFinite(Date.parse(input.createdAt))) throw new Error("invalid calibration metadata");
  const verifiedManifest = verifyCorpusManifest(input.manifest);
  const assets = new Map(input.manifest.assets.map((asset) => [asset.assetId, asset]));
  const caseIds = new Set<string>();
  const testedAssets = new Set<string>();
  for (const item of input.cases) {
    if (caseIds.has(item.caseId)) throw new Error(`duplicate calibration case ${item.caseId}`);
    caseIds.add(item.caseId);
    if (testedAssets.has(item.corpusAssetId)) throw new Error(`corpus asset ${item.corpusAssetId} is reused by multiple calibration cases`);
    testedAssets.add(item.corpusAssetId);
    const asset = assets.get(item.corpusAssetId);
    if (!asset) throw new Error(`calibration case ${item.caseId} references unknown asset ${item.corpusAssetId}`);
    if (asset.split !== item.split) throw new Error(`calibration case ${item.caseId} changes immutable split assignment`);
    if (asset.canonicalPrintingId !== item.expectedPrintingId) throw new Error(`calibration case ${item.caseId} changes expected identity`);
    if (!Number.isFinite(item.latencyMs) || item.latencyMs < 0) throw new Error(`calibration case ${item.caseId} has invalid latency`);
    if (item.decisionStatus === "ACCEPTED" && !item.selectedPrintingId) throw new Error(`accepted calibration case ${item.caseId} lacks a selection`);
    if (item.decisionStatus === "ABSTAINED" && item.selectedPrintingId) throw new Error(`abstained calibration case ${item.caseId} cannot contain a selection`);
    if (item.candidatePrintingIds?.length && item.selectedPrintingId && item.candidatePrintingIds[0] !== item.selectedPrintingId) throw new Error(`calibration case ${item.caseId} selection is not the top candidate`);
  }
  const qualification = {
    minimumHoldout: input.qualification?.minimumHoldout ?? 1000,
    minimumAccepted: input.qualification?.minimumAccepted ?? 100,
    minimumPerStratum: input.qualification?.minimumPerStratum ?? 30,
    requiredAcceptedPrecision: input.qualification?.requiredAcceptedPrecision ?? 0.999,
  };
  const corpusReadiness = assessCorpusReadiness(input.manifest, qualification.minimumHoldout);
  const metrics = benchmarkRecognition(input.cases, qualification.minimumHoldout, qualification.requiredAcceptedPrecision, qualification.minimumAccepted, qualification.minimumPerStratum);
  const status = corpusReadiness.status === "READY" && metrics.status === "QUALIFIED" ? "QUALIFIED" as const : "NOT_QUALIFIED" as const;
  const report = {
    schemaVersion: "phronesis.recognition-benchmark-report.v1" as const,
    benchmarkVersion: input.benchmarkVersion,
    createdAt: input.createdAt,
    corpusVersion: input.manifest.corpusVersion,
    manifestSha256: verifiedManifest.manifestSha256,
    status,
    corpusReadiness,
    metrics,
  };
  return { ...report, reportSha256: createHash("sha256").update(stableJson(report)).digest("hex") };
}
