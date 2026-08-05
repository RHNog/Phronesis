import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
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

export function verifyCorpusManifest(manifest: CorpusManifest): VerifiedCorpusManifest {
  if (manifest.schemaVersion !== "phronesis.corpus.v1") throw new Error("unsupported corpus schema");
  if (!manifest.corpusVersion || !Number.isFinite(Date.parse(manifest.createdAt))) throw new Error("invalid corpus metadata");
  const ids = new Set<string>();
  for (const asset of manifest.assets) {
    if (ids.has(asset.assetId)) throw new Error(`duplicate corpus asset ${asset.assetId}`);
    ids.add(asset.assetId);
    assertSha256(asset.objectSha256, `asset ${asset.assetId} objectSha256`);
    if (!asset.source || !asset.provenance || !asset.license) throw new Error(`asset ${asset.assetId} lacks provenance`);
  }
  return { ...manifest, manifestSha256: createHash("sha256").update(stableJson(manifest)).digest("hex") };
}

export function verifyCorpusObjects(manifest: CorpusManifest, resolvePath: (sha256: string) => string): void {
  for (const asset of manifest.assets) {
    const bytes = readFileSync(resolvePath(asset.objectSha256));
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== asset.objectSha256) throw new Error(`checksum mismatch for corpus asset ${asset.assetId}`);
  }
}
