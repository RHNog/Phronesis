import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stableJson } from "@/lib/cardRecognition/stableJson";
import { assertSha256 } from "@/lib/cardRecognition/contracts";

export type CorpusSplit = "TRAIN" | "DEV" | "HOLDOUT";

export type CorpusAsset = {
  assetId: string;
  canonicalPrintingId: string;
  canonicalVariantId: string | null;
  categoryId: string;
  sku: string;
  language: string;
  setName: string;
  collectorNumber: string | null;
  finishApplicability: string[];
  source: string;
  provenance: string;
  license: string;
  redistribution: "PERMITTED" | "RESTRICTED" | "UNKNOWN";
  recognitionUse?: "APPROVED" | "REVIEW_ONLY" | "UNVERIFIED";
  recognitionApproval?: { approvedBy: string; approvedAt: string; scope: string } | null;
  objectSha256: string;
  split: CorpusSplit;
};

export type CorpusManifest = {
  schemaVersion: "phronesis.corpus.v1";
  corpusVersion: string;
  createdAt: string;
  assets: CorpusAsset[];
};

export type VerifiedCorpusManifest = CorpusManifest & { manifestSha256: string };

export type CorpusBuildAsset = Omit<CorpusAsset, "objectSha256"> & { sourcePath: string };

export type CorpusBuildSpecification = {
  schemaVersion: "phronesis.corpus-build.v1";
  corpusVersion: string;
  createdAt: string;
  assets: CorpusBuildAsset[];
};

const splits = new Set<CorpusSplit>(["TRAIN", "DEV", "HOLDOUT"]);
const redistributionValues = new Set<CorpusAsset["redistribution"]>(["PERMITTED", "RESTRICTED", "UNKNOWN"]);

export function verifyCorpusManifest(manifest: CorpusManifest): VerifiedCorpusManifest {
  if (manifest.schemaVersion !== "phronesis.corpus.v1") throw new Error("unsupported corpus schema");
  if (!manifest.corpusVersion || !Number.isFinite(Date.parse(manifest.createdAt))) throw new Error("invalid corpus metadata");
  const ids = new Set<string>();
  const identitySplits = new Map<string, CorpusSplit>();
  const objectSplits = new Map<string, CorpusSplit>();
  for (const asset of manifest.assets) {
    if (ids.has(asset.assetId)) throw new Error(`duplicate corpus asset ${asset.assetId}`);
    ids.add(asset.assetId);
    assertSha256(asset.objectSha256, `asset ${asset.assetId} objectSha256`);
    if (!asset.source || !asset.provenance || !asset.license) throw new Error(`asset ${asset.assetId} lacks provenance`);
    if (!splits.has(asset.split)) throw new Error(`asset ${asset.assetId} has invalid split`);
    if (!redistributionValues.has(asset.redistribution)) throw new Error(`asset ${asset.assetId} has invalid redistribution status`);
    if (asset.recognitionUse && !new Set(["APPROVED", "REVIEW_ONLY", "UNVERIFIED"]).has(asset.recognitionUse)) throw new Error(`asset ${asset.assetId} has invalid recognition-use status`);
    if (asset.recognitionUse === "APPROVED" && (!asset.recognitionApproval?.approvedBy || !asset.recognitionApproval.scope || !Number.isFinite(Date.parse(asset.recognitionApproval.approvedAt)))) throw new Error(`asset ${asset.assetId} lacks recognition-use approval evidence`);
    if (!asset.canonicalPrintingId || !asset.categoryId || !asset.sku || !asset.language || !asset.setName) throw new Error(`asset ${asset.assetId} lacks canonical identity metadata`);
    const identityKey = `${asset.canonicalPrintingId}\u0000${asset.canonicalVariantId ?? ""}`;
    const priorSplit = identitySplits.get(identityKey);
    if (priorSplit && priorSplit !== asset.split) throw new Error(`canonical identity ${asset.canonicalPrintingId} leaks across ${priorSplit} and ${asset.split}`);
    identitySplits.set(identityKey, asset.split);
    const priorObjectSplit = objectSplits.get(asset.objectSha256);
    if (priorObjectSplit && priorObjectSplit !== asset.split) throw new Error(`corpus object ${asset.objectSha256} leaks across ${priorObjectSplit} and ${asset.split}`);
    objectSplits.set(asset.objectSha256, asset.split);
  }
  return { ...manifest, manifestSha256: createHash("sha256").update(stableJson(manifest)).digest("hex") };
}

export function corpusObjectPath(root: string, sha256: string): string {
  assertSha256(sha256, "corpus object sha256");
  return join(root, "objects", sha256.slice(0, 2), sha256);
}

function atomicWrite(path: string, bytes: string | Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, bytes, { flag: "wx" });
  renameSync(temporary, path);
}

export function buildCorpusBundle(specification: CorpusBuildSpecification, outputRoot: string): VerifiedCorpusManifest {
  if (specification.schemaVersion !== "phronesis.corpus-build.v1") throw new Error("unsupported corpus build schema");
  const pending = specification.assets.map(({ sourcePath, ...metadata }) => {
    const bytes = readFileSync(sourcePath);
    const objectSha256 = createHash("sha256").update(bytes).digest("hex");
    return { sourcePath, metadata: { ...metadata, objectSha256 } };
  });
  const verified = verifyCorpusManifest({
    schemaVersion: "phronesis.corpus.v1",
    corpusVersion: specification.corpusVersion,
    createdAt: specification.createdAt,
    assets: pending.map((item) => item.metadata),
  });
  const manifestPath = join(outputRoot, "manifest.json");
  const canonical = `${stableJson({ schemaVersion: verified.schemaVersion, corpusVersion: verified.corpusVersion, createdAt: verified.createdAt, assets: verified.assets })}\n`;
  if (existsSync(manifestPath) && readFileSync(manifestPath, "utf8") !== canonical) throw new Error("corpus bundle already contains a different manifest");
  for (const item of pending) {
    const destination = corpusObjectPath(outputRoot, item.metadata.objectSha256);
    if (!existsSync(destination)) atomicWrite(destination, readFileSync(item.sourcePath));
  }
  verifyCorpusObjects(verified, (sha256) => corpusObjectPath(outputRoot, sha256));
  if (!existsSync(manifestPath)) atomicWrite(manifestPath, canonical);
  return verified;
}

export function assessCorpusReadiness(manifest: CorpusManifest, minimumHoldout = 1000) {
  if (!Number.isInteger(minimumHoldout) || minimumHoldout < 1) throw new Error("minimumHoldout must be a positive integer");
  const verified = verifyCorpusManifest(manifest);
  const counts = { TRAIN: 0, DEV: 0, HOLDOUT: 0 };
  const blockers: string[] = [];
  const warnings: string[] = [];
  let unapprovedLicenseCount = 0;
  let unapprovedRecognitionUseCount = 0;
  let restrictedCount = 0;
  for (const asset of manifest.assets) {
    counts[asset.split] += 1;
    if (asset.redistribution === "UNKNOWN" || /^(unknown|unverified)$/i.test(asset.license.trim())) unapprovedLicenseCount += 1;
    if (asset.recognitionUse !== "APPROVED") unapprovedRecognitionUseCount += 1;
    if (asset.redistribution === "RESTRICTED") restrictedCount += 1;
  }
  if (unapprovedLicenseCount) blockers.push(`${unapprovedLicenseCount} assets have unapproved licensing`);
  if (unapprovedRecognitionUseCount) blockers.push(`${unapprovedRecognitionUseCount} assets are not approved for recognition calibration`);
  if (restrictedCount) warnings.push(`${restrictedCount} assets are restricted to their licensed use`);
  if (counts.HOLDOUT < minimumHoldout) blockers.push(`holdout contains ${counts.HOLDOUT}; minimum is ${minimumHoldout}`);
  return {
    status: blockers.length ? "NOT_READY" as const : "READY" as const,
    manifestSha256: verified.manifestSha256,
    counts,
    blockers: [...new Set(blockers)].sort(),
    warnings: [...new Set(warnings)].sort(),
  };
}

export function verifyCorpusObjects(manifest: CorpusManifest, resolvePath: (sha256: string) => string): void {
  for (const asset of manifest.assets) {
    const bytes = readFileSync(resolvePath(asset.objectSha256));
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== asset.objectSha256) throw new Error(`checksum mismatch for corpus asset ${asset.assetId}`);
  }
}
