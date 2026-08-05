import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { fullFrameRegion, validateRegionGeometry, type RecognitionCandidate } from "@/lib/cardRecognition/contracts";
import { benchmarkRecognition, conservativePolicy, decideCandidates } from "@/lib/cardRecognition/policy";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { sealRecognizedAssetEnvelope, toLigaDraft, toTcgplayerDraft, validateRecognizedAssetBatch, type RecognizedAssetEnvelopeV1 } from "@/lib/cardRecognition/interchange";
import { classifyObservedGame, createRecognitionDecision, retrieveCandidates } from "@/lib/cardRecognition/pipeline";
import { SqliteRecognitionCatalogue } from "@/lib/cardRecognition/sqliteCatalogue";
import { DatabaseSync } from "node:sqlite";

function candidate(score: number, id = "printing-1"): RecognitionCandidate {
  return { canonicalPrintingId: id, canonicalVariantId: null, categoryId: "1", sku: "sku-1", rank: 1, score, evidence: [] };
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

test("review-only policy never auto-accepts and safely abstains below threshold", () => {
  assert.equal(decideCandidates([candidate(1)], conservativePolicy).status, "REVIEW");
  assert.equal(decideCandidates([candidate(0.2)], conservativePolicy).status, "ABSTAINED");
});

test("underpowered holdout cannot qualify auto-accept", () => {
  const report = benchmarkRecognition([{ expectedPrintingId: "printing-1", split: "HOLDOUT", decisionStatus: "ACCEPTED", selectedPrintingId: "printing-1", latencyMs: 25 }]);
  assert.equal(report.status, "NOT_QUALIFIED");
  assert.equal(report.acceptedPrecision, 1);
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
    repository.resolveRegion({ sessionId, regionId: imported.region.regionId, canonicalPrintingId: "printing-1", condition: "NEAR_MINT", finish: "NONFOIL", quantity: 2, priceSnapshotId: "price-1", priceSnapshotAt: "2026-08-04T00:00:00.000Z", buyingPresetId: "preset-1", offerCents: 125, currency: "USD", resolvedBy: "operator-1", now: "2026-08-04T00:00:02.000Z" });
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

test("Vision OCR retrieves a canonical candidate but remains operator review", () => {
  const analysis = { schemaVersion: "phronesis.vision-analysis.v1" as const, featurePrint: "fixture", ocr: [{ text: "Jin Sakai, Ghost of Tsushima 10", confidence: 0.99, x: 0.1, y: 0.9, width: 0.7, height: 0.05 }, { text: "Legendary Creature — Human Samurai", confidence: 0.99, x: 0.1, y: 0.45, width: 0.7, height: 0.05 }] };
  const catalogue = { search: (_categoryId: string, query: string) => query === "Jin Sakai, Ghost of Tsushima" ? [{ categoryId: "magic-en", sku: "123", name: "Jin Sakai, Ghost of Tsushima", setName: "FIN", collectorNumber: "1", variant: "Normal", language: "English" }] : [] };
  assert.equal(retrieveCandidates(analysis, catalogue)[0].canonicalPrintingId, "magic-en:123");
  const decision = createRecognitionDecision({ regionId: "region-1", analysis, catalogue, corpusVersion: "corpus-1", indexVersion: "index-1", now: "2026-08-04T00:00:00.000Z" });
  assert.equal(decision.status, "REVIEW");
  assert.equal(decision.selectedCandidate?.sku, "123");
});

test("game classification prevents Pokémon headers from becoming Magic candidates", () => {
  const analysis = { schemaVersion: "phronesis.vision-analysis.v1" as const, featurePrint: "fixture", ocr: [{ text: "BASIC", confidence: 0.99, x: 0.1, y: 0.9, width: 0.2, height: 0.05 }, { text: "Alcremie HP 90", confidence: 0.99, x: 0.2, y: 0.85, width: 0.5, height: 0.05 }] };
  assert.equal(classifyObservedGame(analysis), "POKEMON");
  assert.equal(retrieveCandidates(analysis, { search: () => { throw new Error("unsupported game must not query Magic"); } }).length, 0);
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
