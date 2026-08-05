import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { fullFrameRegion, validateRegionGeometry, type RecognitionCandidate } from "@/lib/cardRecognition/contracts";
import { benchmarkRecognition, conservativePolicy, decideCandidates } from "@/lib/cardRecognition/policy";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { sealRecognizedAssetEnvelope, toLigaDraft, toTcgplayerDraft, validateRecognizedAssetBatch, type RecognizedAssetEnvelopeV1 } from "@/lib/cardRecognition/interchange";
import { activeRecognitionLane, classifyObservedGame, classifyObservedLanguage, createRecognitionDecision, retrieveCandidates } from "@/lib/cardRecognition/pipeline";
import { SqliteRecognitionCatalogue } from "@/lib/cardRecognition/sqliteCatalogue";
import { DatabaseSync } from "node:sqlite";
import { assessCorpusReadiness, buildCorpusBundle, corpusObjectPath, verifyCorpusManifest, type CorpusManifest } from "@/lib/cardRecognition/corpus";
import { runCalibration } from "@/lib/cardRecognition/calibration";
import { benchmarkRegionDetection, regionIntersectionOverUnion, validateRegionDetection, type RegionDetectionResult } from "@/lib/cardRecognition/regionDetection";

function candidate(score: number, id = "printing-1"): RecognitionCandidate {
  return { canonicalPrintingId: id, canonicalVariantId: null, categoryId: "1", sku: "sku-1", catalogueIdentity: { name: "Fixture", setName: "Fixture Set", collectorNumber: "1/1", variant: "Normal", language: "English" }, rank: 1, score, evidence: [] };
}

function envelope(): RecognizedAssetEnvelopeV1 {
  return {
    schemaVersion: "phronesis.recognized-asset.v1", assetId: "asset-1",
    canonicalIdentity: { game: "MAGIC", printingId: "printing-1", variantId: null, categoryId: "1", sku: "sku-1" },
    recognition: { decisionId: "decision-1", status: "OPERATOR_REVIEWED", confidence: 0.9, corpusVersion: "corpus-1", indexVersion: "index-1", pipelineVersion: "pipeline-1", policyVersion: "review-only" },
    materialResolution: { condition: "NEAR_MINT", finish: "NONFOIL", conditionConfirmedBy: "operator-1", finishConfirmedBy: "operator-1" },
    commercialBindings: { quantity: 1, priceSnapshotId: "price-1", priceSnapshotAt: "2026-08-04T00:00:00.000Z", buyingPresetId: "preset-1", offerCents: 125, currency: "USD" },
    marketMappings: [
      { provider: "TCGPLAYER", externalId: "123", verifiedAt: "2026-08-04T00:00:00.000Z", staleAfter: "2030-08-04T00:00:00.000Z" },
      { provider: "LIGAMAGIC", externalId: "lm-1", verifiedAt: "2026-08-04T00:00:00.000Z", staleAfter: "2030-08-04T00:00:00.000Z" },
    ],
    evidence: { frameSha256: "a".repeat(64), regionRevisionId: "region-1", evidenceSha256: ["b".repeat(64)] },
  };
}

test("region model defaults to one full frame and rejects invalid corrections", () => {
  assert.deepEqual(fullFrameRegion("frame-1").geometry, { x: 0, y: 0, width: 1, height: 1, rotationDegrees: 0 });
  assert.throws(() => validateRegionGeometry({ x: 0.8, y: 0, width: 0.3, height: 1, rotationDegrees: 0 }), /bounds/);
});

function regionPrediction(regions: Array<{ x: number; y: number; width: number; height: number; confidence?: number }>): RegionDetectionResult {
  return { schemaVersion: "phronesis.vision-regions.v1", coordinateOrigin: "TOP_LEFT", regions: regions.map(({ confidence = 0.9, ...geometry }, order) => ({ order, confidence, geometry: { ...geometry, rotationDegrees: 0 } })) };
}

test("region suggestions require top-left deterministic order and reject duplicates", () => {
  const valid = regionPrediction([{ x: 0.1, y: 0.1, width: 0.2, height: 0.3 }, { x: 0.4, y: 0.1, width: 0.2, height: 0.3 }]);
  assert.doesNotThrow(() => validateRegionDetection(valid));
  assert.equal(regionIntersectionOverUnion(valid.regions[0].geometry, valid.regions[0].geometry), 1);
  assert.throws(() => validateRegionDetection({ ...valid, coordinateOrigin: "BOTTOM_LEFT" as "TOP_LEFT" }), /contract/);
  assert.throws(() => validateRegionDetection({ ...valid, regions: [{ ...valid.regions[0], order: 1 }] }), /contiguous/);
  assert.throws(() => validateRegionDetection(regionPrediction([{ x: 0.1, y: 0.1, width: 0.2, height: 0.3 }, { x: 0.105, y: 0.105, width: 0.2, height: 0.3 }])), /duplicates/);
});

test("synthetic region cases validate contracts but cannot qualify production segmentation", () => {
  const geometry = { x: 0.1, y: 0.1, width: 0.2, height: 0.3, rotationDegrees: 0 as const };
  const input = { schemaVersion: "phronesis.region-benchmark.v1" as const, benchmarkVersion: "regions-v1", createdAt: "2026-08-05T02:00:00.000Z", qualification: { minimumRealHoldoutFrames: 1, minimumPerStratum: 1 }, cases: [{ caseId: "synthetic-1", split: "HOLDOUT" as const, sourceKind: "SYNTHETIC" as const, sourceFrameSha256: "c".repeat(64), labelSha256: "d".repeat(64), stratum: "synthetic-grid", expectedRegions: [geometry], prediction: regionPrediction([geometry]), latencyMs: 10 }] };
  const first = benchmarkRegionDetection(input);
  const second = benchmarkRegionDetection(structuredClone(input));
  assert.equal(first.reportSha256, second.reportSha256);
  assert.equal(first.syntheticCaseCount, 1);
  assert.equal(first.realHoldoutFrameCount, 0);
  assert.equal(first.status, "NOT_QUALIFIED");
});

test("region benchmark matches each label once and reports underpowered real evidence", () => {
  const first = { x: 0.1, y: 0.1, width: 0.2, height: 0.3, rotationDegrees: 0 as const };
  const second = { x: 0.4, y: 0.1, width: 0.2, height: 0.3, rotationDegrees: 0 as const };
  const report = benchmarkRegionDetection({ schemaVersion: "phronesis.region-benchmark.v1", benchmarkVersion: "regions-v1", createdAt: "2026-08-05T02:00:00.000Z", cases: [{ caseId: "real-1", split: "HOLDOUT", sourceKind: "LABELED_REAL", sourceFrameSha256: "d".repeat(64), labelSha256: "e".repeat(64), labelApproval: { approvedBy: "test-owner", approvedAt: "2026-08-05T00:00:00.000Z", scope: "synthetic unit-test declaration" }, stratum: "nine-pocket", expectedRegions: [first, second], prediction: regionPrediction([first]), latencyMs: 20 }] });
  assert.equal(report.truePositives, 1);
  assert.equal(report.falsePositives, 0);
  assert.equal(report.falseNegatives, 1);
  assert.equal(report.precision, 1);
  assert.equal(report.recall, 0.5);
  assert.equal(report.exactCountRate, 0);
  assert.equal(report.status, "NOT_QUALIFIED");
});

test("region benchmark validates thresholds and can qualify only labeled real evidence", () => {
  const geometry = { x: 0.1, y: 0.1, width: 0.2, height: 0.3, rotationDegrees: 0 as const };
  const base = { schemaVersion: "phronesis.region-benchmark.v1" as const, benchmarkVersion: "regions-v1", createdAt: "2026-08-05T02:00:00.000Z", cases: [{ caseId: "real-1", split: "HOLDOUT" as const, sourceKind: "LABELED_REAL" as const, sourceFrameSha256: "e".repeat(64), labelSha256: "f".repeat(64), labelApproval: { approvedBy: "test-owner", approvedAt: "2026-08-05T00:00:00.000Z", scope: "synthetic unit-test declaration" }, stratum: "nine-pocket", expectedRegions: [geometry], prediction: regionPrediction([geometry]), latencyMs: 20 }] };
  assert.throws(() => benchmarkRegionDetection({ ...base, qualification: { minimumRealHoldoutFrames: 0 } }), /positive integer/);
  const report = benchmarkRegionDetection({ ...base, qualification: { minimumRealHoldoutFrames: 1, minimumPerStratum: 1, requiredPrecision: 1, requiredRecall: 1, requiredExactCountRate: 1, maximumP95LatencyMs: 20 } });
  assert.equal(report.status, "QUALIFIED");
  assert.equal(report.meanMatchedIou, 1);
});

test("real region evidence requires approval and cannot reuse a source frame", () => {
  const geometry = { x: 0.1, y: 0.1, width: 0.2, height: 0.3, rotationDegrees: 0 as const };
  const item = { caseId: "real-1", split: "HOLDOUT" as const, sourceKind: "LABELED_REAL" as const, sourceFrameSha256: "1".repeat(64), labelSha256: "2".repeat(64), stratum: "nine-pocket", expectedRegions: [geometry], prediction: regionPrediction([geometry]), latencyMs: 20 };
  const base = { schemaVersion: "phronesis.region-benchmark.v1" as const, benchmarkVersion: "regions-v1", createdAt: "2026-08-05T02:00:00.000Z" };
  assert.throws(() => benchmarkRegionDetection({ ...base, cases: [item] }), /approval evidence/);
  const approved = { ...item, labelApproval: { approvedBy: "test-owner", approvedAt: "2026-08-05T00:00:00.000Z", scope: "synthetic unit-test declaration" } };
  assert.throws(() => benchmarkRegionDetection({ ...base, cases: [approved, { ...approved, caseId: "real-2", labelSha256: "3".repeat(64) }] }), /reused/);
});

test("review-only policy never auto-accepts and safely abstains below threshold", () => {
  assert.equal(decideCandidates([candidate(1)], conservativePolicy).status, "REVIEW");
  assert.equal(decideCandidates([candidate(0.2)], conservativePolicy).status, "ABSTAINED");
});

test("underpowered holdout cannot qualify auto-accept", () => {
  const report = benchmarkRecognition([{ expectedPrintingId: "printing-1", split: "HOLDOUT", decisionStatus: "ACCEPTED", selectedPrintingId: "printing-1", latencyMs: 25 }]);
  assert.equal(report.status, "NOT_QUALIFIED");
  assert.equal(report.acceptedPrecision, 1);
});

test("corpus builder hashes bytes, emits a canonical manifest, and is idempotent", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-corpus-build-"));
  try {
    const source = join(root, "source.jpg");
    const output = join(root, "bundle");
    writeFileSync(source, "licensed synthetic reference");
    const specification = {
      schemaVersion: "phronesis.corpus-build.v1" as const,
      corpusVersion: "fixture-v1",
      createdAt: "2026-08-05T00:00:00.000Z",
      assets: [{ assetId: "asset-1", canonicalPrintingId: "printing-1", canonicalVariantId: null, categoryId: "magic-en", sku: "sku-1", language: "English", setName: "Fixture", collectorNumber: "1", finishApplicability: ["NONFOIL"], source: "synthetic-test", provenance: "source-controlled synthetic bytes", license: "test-only", redistribution: "PERMITTED" as const, split: "HOLDOUT" as const, sourcePath: source }],
    };
    const first = buildCorpusBundle(specification, output);
    const second = buildCorpusBundle(specification, output);
    assert.equal(first.manifestSha256, second.manifestSha256);
    assert.equal(readFileSync(corpusObjectPath(output, first.assets[0].objectSha256), "utf8"), "licensed synthetic reference");
    assert.equal(JSON.parse(readFileSync(join(output, "manifest.json"), "utf8")).corpusVersion, "fixture-v1");
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("corpus validation rejects canonical identity leakage across immutable splits", () => {
  const common = { canonicalPrintingId: "printing-1", canonicalVariantId: null, categoryId: "magic-en", sku: "sku-1", language: "English", setName: "Fixture", collectorNumber: "1", finishApplicability: ["NONFOIL"], source: "synthetic-test", provenance: "fixture", license: "test-only", redistribution: "PERMITTED" as const, objectSha256: "a".repeat(64) };
  assert.throws(() => verifyCorpusManifest({ schemaVersion: "phronesis.corpus.v1", corpusVersion: "leaky", createdAt: "2026-08-05T00:00:00.000Z", assets: [{ ...common, assetId: "train", split: "TRAIN" }, { ...common, assetId: "holdout", split: "HOLDOUT" }] }), /leaks across/);
});

test("an invalid corpus build writes no content-addressed objects", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-corpus-invalid-"));
  try {
    const source = join(root, "source.jpg");
    const output = join(root, "bundle");
    writeFileSync(source, "synthetic collision");
    const common = { canonicalPrintingId: "printing-1", canonicalVariantId: null, categoryId: "magic-en", sku: "sku-1", language: "English", setName: "Fixture", collectorNumber: "1", finishApplicability: ["NONFOIL"], source: "synthetic-test", provenance: "fixture", license: "test-only", redistribution: "PERMITTED" as const, sourcePath: source };
    assert.throws(() => buildCorpusBundle({ schemaVersion: "phronesis.corpus-build.v1", corpusVersion: "invalid", createdAt: "2026-08-05T00:00:00.000Z", assets: [{ ...common, assetId: "train", split: "TRAIN" }, { ...common, assetId: "holdout", split: "HOLDOUT" }] }, output), /leaks across/);
    assert.equal(existsSync(join(output, "manifest.json")), false);
    assert.equal(existsSync(join(output, "objects")), false);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("sealed calibration reports metrics but remains blocked by underpowered or unknown-license evidence", () => {
  const manifest: CorpusManifest = {
    schemaVersion: "phronesis.corpus.v1", corpusVersion: "fixture-v1", createdAt: "2026-08-05T00:00:00.000Z",
    assets: [{ assetId: "asset-1", canonicalPrintingId: "printing-1", canonicalVariantId: null, categoryId: "magic-en", sku: "sku-1", language: "English", setName: "Fixture", collectorNumber: "1", finishApplicability: ["NONFOIL"], source: "synthetic-test", provenance: "fixture", license: "unknown", redistribution: "UNKNOWN", objectSha256: "b".repeat(64), split: "HOLDOUT" }],
  };
  const input = { schemaVersion: "phronesis.recognition-calibration.v1" as const, benchmarkVersion: "benchmark-v1", createdAt: "2026-08-05T01:00:00.000Z", manifest, qualification: { minimumHoldout: 1, minimumAccepted: 1, minimumPerStratum: 1, requiredAcceptedPrecision: 1 }, cases: [{ caseId: "case-1", corpusAssetId: "asset-1", expectedPrintingId: "printing-1", split: "HOLDOUT" as const, decisionStatus: "ACCEPTED" as const, selectedPrintingId: "printing-1", candidatePrintingIds: ["printing-1"], latencyMs: 12, pairingCorrect: true, stratum: "standard-nonfoil" }] };
  const first = runCalibration(input);
  const second = runCalibration(structuredClone(input));
  assert.equal(first.reportSha256, second.reportSha256);
  assert.equal(first.metrics.top1Recall, 1);
  assert.equal(first.metrics.topKRecall, 1);
  assert.equal(first.metrics.pairingAccuracy, 1);
  assert.equal(first.metrics.failureStrata[0].stratum, "standard-nonfoil");
  assert.equal(first.corpusReadiness.status, "NOT_READY");
  assert.equal(first.status, "NOT_QUALIFIED");
});

test("calibration cannot change a corpus asset split or expected identity", () => {
  const manifest: CorpusManifest = { schemaVersion: "phronesis.corpus.v1", corpusVersion: "fixture-v1", createdAt: "2026-08-05T00:00:00.000Z", assets: [{ assetId: "asset-1", canonicalPrintingId: "printing-1", canonicalVariantId: null, categoryId: "magic-en", sku: "sku-1", language: "English", setName: "Fixture", collectorNumber: "1", finishApplicability: ["NONFOIL"], source: "synthetic-test", provenance: "fixture", license: "test-only", redistribution: "PERMITTED", recognitionUse: "APPROVED", recognitionApproval: { approvedBy: "test-owner", approvedAt: "2026-08-05T00:00:00.000Z", scope: "synthetic calibration test" }, objectSha256: "c".repeat(64), split: "HOLDOUT" }] };
  const base = { schemaVersion: "phronesis.recognition-calibration.v1" as const, benchmarkVersion: "benchmark-v1", createdAt: "2026-08-05T01:00:00.000Z", manifest };
  assert.throws(() => runCalibration({ ...base, cases: [{ caseId: "case-1", corpusAssetId: "asset-1", expectedPrintingId: "printing-1", split: "DEV", decisionStatus: "REVIEW", selectedPrintingId: "printing-1", latencyMs: 1 }] }), /immutable split/);
  assert.throws(() => runCalibration({ ...base, cases: [{ caseId: "case-1", corpusAssetId: "asset-1", expectedPrintingId: "printing-2", split: "HOLDOUT", decisionStatus: "REVIEW", selectedPrintingId: "printing-2", latencyMs: 1 }] }), /expected identity/);
  assert.throws(() => runCalibration({ ...base, cases: [{ caseId: "case-1", corpusAssetId: "asset-1", expectedPrintingId: "printing-1", split: "HOLDOUT", decisionStatus: "REVIEW", selectedPrintingId: "printing-1", latencyMs: 1 }, { caseId: "case-2", corpusAssetId: "asset-1", expectedPrintingId: "printing-1", split: "HOLDOUT", decisionStatus: "REVIEW", selectedPrintingId: "printing-1", latencyMs: 1 }] }), /reused/);
  assert.throws(() => runCalibration({ ...base, qualification: { minimumHoldout: 0 }, cases: [] }), /positive integer/);
  assert.equal(assessCorpusReadiness(manifest, 1).status, "READY");
});

test("repository stores content once, imports frames idempotently, and revisions are append-only", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-recognition-"));
  const repository = new CardRecognitionRepository(":memory:", root);
  try {
    const object = repository.putObject(Buffer.from("frame"));
    assert.equal(repository.putObject(Buffer.from("frame")).created, false);
    const sessionId = repository.createSession("test");
    const frame = { frameId: randomUUID(), sessionId, sequence: 0, side: "FRONT" as const, objectSha256: object.sha256, mediaType: "image/jpeg" as const, byteLength: 5, capturedAt: "2026-08-04T00:00:00.000Z", pairedFrameId: null };
    const first = repository.addFrame(frame);
    assert.equal(first.status, "IMPORTED");
    assert.equal(repository.addFrame(frame).status, "ALREADY_IMPORTED");
    const revised = repository.reviseRegion(first.region.regionId, { x: 0.1, y: 0.1, width: 0.8, height: 0.8, rotationDegrees: 90 }, "operator crop");
    assert.equal(revised.revision, 2);
    assert.equal(repository.activeRegions(frame.frameId)[0].regionId, revised.regionId);
  } finally { repository.close(); rmSync(root, { recursive: true, force: true }); }
});

test("corpus activation verifies objects and rolls back transactionally", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-corpus-"));
  const repository = new CardRecognitionRepository(":memory:", root);
  try {
    const first = repository.putObject(Buffer.from("reference-one"));
    const second = repository.putObject(Buffer.from("reference-two"));
    const manifest = (version: string, sha: string) => ({ schemaVersion: "phronesis.corpus.v1" as const, corpusVersion: version, createdAt: "2026-08-04T00:00:00.000Z", assets: [{ assetId: `${version}-asset`, canonicalPrintingId: "printing-1", canonicalVariantId: null, categoryId: "magic-en", sku: "sku-1", language: "English", setName: "Fixture", collectorNumber: "1", finishApplicability: ["NONFOIL"], source: "synthetic-test", provenance: "source-controlled synthetic fixture", license: "test-only", redistribution: "PERMITTED" as const, objectSha256: sha, split: "HOLDOUT" as const }] });
    repository.activateCorpus(manifest("corpus-1", first.sha256));
    repository.activateCorpus(manifest("corpus-2", second.sha256));
    assert.equal(repository.rollbackCorpus(), "corpus-1");
    assert.throws(() => repository.activateCorpus(manifest("corpus-bad", "f".repeat(64))), /ENOENT/);
  } finally { repository.close(); rmSync(root, { recursive: true, force: true }); }
});

test("expired recognition leases are recoverable by a new worker", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-recognition-"));
  const repository = new CardRecognitionRepository(":memory:", root);
  try {
    const object = repository.putObject(Buffer.from("frame"));
    const sessionId = repository.createSession("lease");
    repository.addFrame({ frameId: randomUUID(), sessionId, sequence: 0, side: "FRONT", objectSha256: object.sha256, mediaType: "image/jpeg", byteLength: 5, capturedAt: "2026-08-04T00:00:00.000Z", pairedFrameId: null });
    assert.ok(repository.acquireJob("worker-a", 1, new Date("2026-08-04T00:00:00.000Z")));
    assert.ok(repository.acquireJob("worker-b", 1000, new Date("2026-08-04T00:00:01.000Z")));
  } finally { repository.close(); rmSync(root, { recursive: true, force: true }); }
});

test("session state follows durable work instead of a stale import badge", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-recognition-state-"));
  const repository = new CardRecognitionRepository(":memory:", root);
  try {
    const object = repository.putObject(Buffer.from("frame"));
    const sessionId = repository.createSession("state");
    const imported = repository.addFrame({ frameId: randomUUID(), sessionId, sequence: 0, side: "FRONT", objectSha256: object.sha256, mediaType: "image/jpeg", byteLength: 5, capturedAt: "2026-08-04T00:00:00.000Z", pairedFrameId: null });
    assert.equal(repository.reconcileSessionState(sessionId), "PROCESSING");
    const lease = repository.acquireJob("worker", 1000, new Date("2026-08-04T00:00:00.000Z"));
    assert.ok(lease);
    repository.completeJob(lease.jobId, "worker", { decisionId: "decision-state", regionId: imported.region.regionId, status: "ABSTAINED", selectedCandidate: null, candidates: [], corpusVersion: "c1", indexVersion: "i1", pipelineVersion: "p1", policyVersion: "review", decidedBy: "MACHINE", reason: "No supported candidate.", createdAt: "2026-08-04T00:00:01.000Z" });
    assert.equal(repository.sessionSummary(sessionId).state, "REVIEW");
    assert.equal(repository.reconcileSessionState(sessionId), "REVIEW");
    const replay = repository.reprocessSession(sessionId, "Recognition pipeline pokemon-v1", "2026-08-04T00:00:02.000Z");
    assert.equal(replay.status, "REPROCESSED");
    assert.equal(replay.regions[0].revision, 2);
    assert.deepEqual(repository.sessionSummary(sessionId).counts, { frames: 1, regions: 1, pending: 1, review: 0, accepted: 0, abstained: 0, failed: 0 });
    const replayLease = repository.acquireJob("worker-pokemon", 1000, new Date("2026-08-04T00:00:03.000Z"));
    assert.ok(replayLease);
    repository.completeJob(replayLease.jobId, "worker-pokemon", { decisionId: "decision-pokemon", regionId: replay.regions[0].regionId, status: "REVIEW", selectedCandidate: candidate(0.94, "pokemon-en:sku-1"), candidates: [candidate(0.94, "pokemon-en:sku-1")], corpusVersion: "c2", indexVersion: "i2", pipelineVersion: "pokemon-v1", policyVersion: "review", decidedBy: "MACHINE", reason: "review", createdAt: "2026-08-04T00:00:04.000Z" });
    assert.deepEqual(repository.sessionSummary(sessionId).counts, { frames: 1, regions: 1, pending: 0, review: 1, accepted: 0, abstained: 0, failed: 0 });
    assert.equal(repository.reprocessSession(sessionId, "Recognition pipeline pokemon-v1").status, "ALREADY_REPROCESSED");
  } finally { repository.close(); rmSync(root, { recursive: true, force: true }); }
});

test("operator resolution is append-only and creates a bound local offer line", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-recognition-"));
  const repository = new CardRecognitionRepository(":memory:", root);
  try {
    const object = repository.putObject(Buffer.from("frame"));
    const sessionId = repository.createSession("offer");
    const imported = repository.addFrame({ frameId: randomUUID(), sessionId, sequence: 0, side: "FRONT", objectSha256: object.sha256, mediaType: "image/jpeg", byteLength: 5, capturedAt: "2026-08-04T00:00:00.000Z", pairedFrameId: null });
    const lease = repository.acquireJob("worker", 1000, new Date("2026-08-04T00:00:00.000Z"));
    assert.ok(lease);
    repository.completeJob(lease.jobId, "worker", { decisionId: "decision-1", regionId: imported.region.regionId, status: "REVIEW", selectedCandidate: candidate(0.9), candidates: [candidate(0.9)], corpusVersion: "c1", indexVersion: "i1", pipelineVersion: "p1", policyVersion: "review", decidedBy: "MACHINE", reason: "review", createdAt: "2026-08-04T00:00:01.000Z" });
    assert.throws(() => repository.resolveRegion({ sessionId, regionId: imported.region.regionId, canonicalPrintingId: "printing-1", condition: "NEAR_MINT", finish: "Reverse Holofoil", quantity: 2, priceSnapshotId: "price-1", priceSnapshotAt: "2026-08-04T00:00:00.000Z", buyingPresetId: "preset-1", offerCents: 125, currency: "USD", resolvedBy: "operator-1", now: "2026-08-04T00:00:02.000Z" }), /finish must match/);
    repository.resolveRegion({ sessionId, regionId: imported.region.regionId, canonicalPrintingId: "printing-1", condition: "NEAR_MINT", finish: "Normal", quantity: 2, priceSnapshotId: "price-1", priceSnapshotAt: "2026-08-04T00:00:00.000Z", buyingPresetId: "preset-1", offerCents: 125, currency: "USD", resolvedBy: "operator-1", now: "2026-08-04T00:00:02.000Z" });
    const offer = repository.offerDraft(sessionId);
    assert.equal(offer.length, 1);
    assert.equal(offer[0].quantity, 2);
    assert.equal(offer[0].candidate?.canonicalPrintingId, "printing-1");
    assert.equal(repository.sessionItems(sessionId)[0].resolved, true);
  } finally { repository.close(); rmSync(root, { recursive: true, force: true }); }
});

test("recognized envelope is stable and draft adapters remain pure", () => {
  const item = envelope();
  const first = sealRecognizedAssetEnvelope(item, new Date("2026-08-05T00:00:00.000Z"));
  const second = sealRecognizedAssetEnvelope(structuredClone(item), new Date("2026-08-05T00:00:00.000Z"));
  assert.equal(first.envelopeSha256, second.envelopeSha256);
  assert.equal(toTcgplayerDraft(item, new Date("2026-08-05T00:00:00.000Z")).row["TCGplayer Id"], "123");
  assert.equal(toLigaDraft(item, "LIGAMAGIC", new Date("2026-08-05T00:00:00.000Z")).row.provider, "LIGAMAGIC");
  assert.throws(() => toLigaDraft(item, "LIGAPOKEMON", new Date("2026-08-05T00:00:00.000Z")), /no verified/);
  assert.throws(() => validateRecognizedAssetBatch([item, item], new Date("2026-08-05T00:00:00.000Z")), /duplicate assetId/);
});

test("Magic retrieval remains explicit and is no longer the default product lane", () => {
  const analysis = { schemaVersion: "phronesis.vision-analysis.v1" as const, featurePrint: "fixture", ocr: [{ text: "Jin Sakai, Ghost of Tsushima 10", confidence: 0.99, x: 0.1, y: 0.9, width: 0.7, height: 0.05 }, { text: "Legendary Creature — Human Samurai", confidence: 0.99, x: 0.1, y: 0.45, width: 0.7, height: 0.05 }] };
  const catalogue = { search: (_categoryId: string, query: string) => query === "Jin Sakai, Ghost of Tsushima" ? [{ categoryId: "magic-en", sku: "123", name: "Jin Sakai, Ghost of Tsushima", setName: "FIN", collectorNumber: "1", variant: "Normal", language: "English" }] : [] };
  assert.equal(retrieveCandidates(analysis, catalogue).length, 0);
  assert.equal(retrieveCandidates(analysis, catalogue, "magic-en")[0].canonicalPrintingId, "magic-en:123");
  const decision = createRecognitionDecision({ regionId: "region-1", analysis, catalogue, categoryId: "magic-en", corpusVersion: "corpus-1", indexVersion: "index-1", now: "2026-08-04T00:00:00.000Z" });
  assert.equal(decision.status, "REVIEW");
  assert.equal(decision.selectedCandidate?.sku, "123");
});

test("English Pokémon name and collector evidence retrieves labelled exact variants", () => {
  const analysis = { schemaVersion: "phronesis.vision-analysis.v1" as const, featurePrint: "fixture", ocr: [{ text: "BASIC", confidence: 0.99, x: 0.1, y: 0.94, width: 0.2, height: 0.05 }, { text: "Geodude", confidence: 0.99, x: 0.2, y: 0.91, width: 0.5, height: 0.05 }, { text: "HP 80", confidence: 0.99, x: 0.75, y: 0.9, width: 0.2, height: 0.05 }, { text: "During your opponent's next turn, this Pokémon takes 30 less damage.", confidence: 0.99, x: 0.1, y: 0.4, width: 0.8, height: 0.05 }, { text: "MEW EN 074/165", confidence: 0.99, x: 0.1, y: 0.03, width: 0.5, height: 0.05 }] };
  const searches: Array<{ categoryId: string; query: string }> = [];
  const catalogue = { search: (categoryId: string, query: string) => {
    searches.push({ categoryId, query });
    return query === "Geodude 074 165" ? [
      { categoryId: "pokemon-en", sku: "normal", name: "Geodude", setName: "SV: Scarlet & Violet 151", collectorNumber: "074/165", variant: "Normal", language: "English" },
      { categoryId: "pokemon-en", sku: "reverse", name: "Geodude", setName: "SV: Scarlet & Violet 151", collectorNumber: "074/165", variant: "Reverse Holofoil", language: "English" },
    ] : [];
  } };
  assert.equal(activeRecognitionLane.categoryId, "pokemon-en");
  assert.equal(classifyObservedGame(analysis), "POKEMON");
  assert.equal(classifyObservedLanguage(analysis), "ENGLISH");
  const candidates = retrieveCandidates(analysis, catalogue);
  assert.deepEqual(searches[0], { categoryId: "pokemon-en", query: "Geodude 074 165" });
  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].catalogueIdentity.name, "Geodude");
  assert.equal(candidates[1].catalogueIdentity.variant, "Reverse Holofoil");
  const decision = createRecognitionDecision({ regionId: "region-pokemon", analysis, catalogue, corpusVersion: "pokemon-corpus", indexVersion: "pokemon-index", now: "2026-08-05T00:00:00.000Z" });
  assert.equal(decision.status, "REVIEW");
  assert.equal(decision.pipelineVersion, "local-vision-ocr-pokemon-en-v1");
});

test("Spanish Pokémon and card backs abstain before catalogue retrieval", () => {
  const spanish = { schemaVersion: "phronesis.vision-analysis.v1" as const, featurePrint: "fixture", ocr: [{ text: "FASE 1", confidence: 1, x: 0.1, y: 0.94, width: 0.2, height: 0.05 }, { text: "Toxicroak", confidence: 1, x: 0.2, y: 0.91, width: 0.5, height: 0.05 }, { text: "Evoluciona de Croagunk", confidence: 1, x: 0.1, y: 0.88, width: 0.5, height: 0.05 }, { text: "El Pokémon Activo de tu rival pasa a estar Envenenado.", confidence: 1, x: 0.1, y: 0.4, width: 0.8, height: 0.05 }] };
  const back = { schemaVersion: "phronesis.vision-analysis.v1" as const, featurePrint: "fixture", ocr: [{ text: "ParétoN", confidence: 0.3, x: 0.1, y: 0.7, width: 0.2, height: 0.05 }] };
  const catalogue = { search: () => { throw new Error("unsupported evidence must not query the catalogue"); } };
  assert.equal(classifyObservedLanguage(spanish), "SPANISH");
  assert.equal(retrieveCandidates(spanish, catalogue).length, 0);
  assert.equal(classifyObservedGame(back), "UNKNOWN");
  assert.equal(retrieveCandidates(back, catalogue).length, 0);
});

test("read-only catalogue retrieval uses exact FTS tokens", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-catalogue-"));
  const databasePath = join(root, "catalogue.sqlite");
  const database = new DatabaseSync(databasePath);
  database.exec(`CREATE TABLE pricing_products(category_id TEXT,sku TEXT,product_type TEXT,name TEXT,set_name TEXT,collector_number TEXT,variant TEXT,language TEXT);
    CREATE TABLE pricing_latest(category_id TEXT,sku TEXT,condition_key TEXT,snapshot_date TEXT,source_sku TEXT,direct_low_cents INTEGER,market_price_cents INTEGER,delivered_price_cents INTEGER);
    CREATE VIRTUAL TABLE pricing_search USING fts5(category_id UNINDEXED,sku UNINDEXED,name,set_name,collector_number,variant);
    INSERT INTO pricing_products VALUES('magic-en','sku-1','SINGLE','Jin Sakai, Ghost of Tsushima','FIN','1','Normal','English');
    INSERT INTO pricing_latest VALUES('magic-en','sku-1','NEAR_MINT','2026-08-04','123',900,1000,1100);
    INSERT INTO pricing_search VALUES('magic-en','sku-1','Jin Sakai, Ghost of Tsushima','FIN','1','Normal');`);
  database.close();
  const catalogue = new SqliteRecognitionCatalogue(databasePath);
  try {
    assert.equal(catalogue.search("magic-en", "Jin Sakai Ghost of Tsushima")[0].sku, "sku-1");
    assert.deepEqual(catalogue.priceSnapshot("magic-en", "sku-1", "NEAR_MINT"), { priceSnapshotId: "pricing:magic-en:sku-1:NEAR_MINT:2026-08-04:123", priceSnapshotAt: "2026-08-04T00:00:00.000Z", referenceCents: 900, referenceKind: "TCG_DIRECT_LOW" });
  }
  finally { catalogue.close(); rmSync(root, { recursive: true, force: true }); }
});
