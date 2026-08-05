import { createHash } from "node:crypto";
import { assertSha256 } from "@/lib/cardRecognition/contracts";
import { stableJson } from "@/lib/cardRecognition/stableJson";

export type RecognizedAssetEnvelopeV1 = {
  schemaVersion: "phronesis.recognized-asset.v1";
  assetId: string;
  canonicalIdentity: {
    game: string;
    printingId: string;
    variantId: string | null;
    categoryId: string;
    sku: string;
  };
  recognition: {
    decisionId: string;
    status: "ACCEPTED" | "OPERATOR_REVIEWED";
    confidence: number;
    corpusVersion: string;
    indexVersion: string;
    pipelineVersion: string;
    policyVersion: string;
  };
  materialResolution: {
    condition: "NEAR_MINT" | "LIGHTLY_PLAYED" | "MODERATELY_PLAYED" | "HEAVILY_PLAYED" | "DAMAGED";
    finish: string;
    conditionConfirmedBy: string;
    finishConfirmedBy: string;
  };
  commercialBindings: {
    quantity: number;
    priceSnapshotId: string;
    priceSnapshotAt: string;
    buyingPresetId: string;
    offerCents: number;
    currency: string;
  };
  marketMappings: Array<{
    provider: "TCGPLAYER" | "LIGAMAGIC" | "LIGAPOKEMON";
    externalId: string;
    verifiedAt: string;
    staleAfter: string;
  }>;
  evidence: {
    frameSha256: string;
    regionRevisionId: string;
    evidenceSha256: string[];
  };
};

export type SealedRecognizedAssetEnvelope = { envelope: RecognizedAssetEnvelopeV1; envelopeSha256: string };

function nonEmpty(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
}

export function validateRecognizedAssetEnvelope(value: RecognizedAssetEnvelopeV1, now = new Date()): void {
  if (value.schemaVersion !== "phronesis.recognized-asset.v1") throw new Error("unsupported recognized-asset schema");
  nonEmpty(value.assetId, "assetId");
  nonEmpty(value.canonicalIdentity.printingId, "canonical printingId");
  nonEmpty(value.canonicalIdentity.sku, "canonical sku");
  if (!Number.isFinite(value.recognition.confidence) || value.recognition.confidence < 0 || value.recognition.confidence > 1) throw new Error("confidence must be within [0,1]");
  if (!Number.isSafeInteger(value.commercialBindings.quantity) || value.commercialBindings.quantity <= 0) throw new Error("quantity must be positive");
  if (!Number.isSafeInteger(value.commercialBindings.offerCents) || value.commercialBindings.offerCents < 0) throw new Error("offerCents must be non-negative");
  assertSha256(value.evidence.frameSha256, "frameSha256");
  for (const sha of value.evidence.evidenceSha256) assertSha256(sha, "evidenceSha256");
  const providers = new Set<string>();
  for (const mapping of value.marketMappings) {
    if (providers.has(mapping.provider)) throw new Error(`duplicate market mapping for ${mapping.provider}`);
    providers.add(mapping.provider);
    nonEmpty(mapping.externalId, `${mapping.provider} externalId`);
    if (!Number.isFinite(Date.parse(mapping.verifiedAt)) || !Number.isFinite(Date.parse(mapping.staleAfter))) throw new Error("mapping timestamps must be valid");
    if (Date.parse(mapping.staleAfter) <= now.getTime()) throw new Error(`${mapping.provider} market mapping is stale`);
  }
}

export function sealRecognizedAssetEnvelope(envelope: RecognizedAssetEnvelopeV1, now = new Date()): SealedRecognizedAssetEnvelope {
  validateRecognizedAssetEnvelope(envelope, now);
  return { envelope, envelopeSha256: createHash("sha256").update(stableJson(envelope)).digest("hex") };
}

export function validateRecognizedAssetBatch(items: RecognizedAssetEnvelopeV1[], now = new Date()): void {
  const ids = new Set<string>();
  for (const item of items) {
    validateRecognizedAssetEnvelope(item, now);
    if (ids.has(item.assetId)) throw new Error(`duplicate assetId ${item.assetId}`);
    ids.add(item.assetId);
  }
}

function mappingFor(envelope: RecognizedAssetEnvelopeV1, provider: RecognizedAssetEnvelopeV1["marketMappings"][number]["provider"]) {
  const mapping = envelope.marketMappings.find((candidate) => candidate.provider === provider);
  if (!mapping) throw new Error(`recognized asset ${envelope.assetId} has no verified ${provider} mapping`);
  return mapping;
}

export type DraftArtifact<T> = { sourceEnvelopeSha256: string; draftSha256: string; row: T };

function draft<T>(envelope: RecognizedAssetEnvelopeV1, row: T, now?: Date): DraftArtifact<T> {
  const sealed = sealRecognizedAssetEnvelope(envelope, now);
  return { sourceEnvelopeSha256: sealed.envelopeSha256, draftSha256: createHash("sha256").update(stableJson(row)).digest("hex"), row };
}

export function toTcgplayerDraft(envelope: RecognizedAssetEnvelopeV1, now = new Date()) {
  const mapping = mappingFor(envelope, "TCGPLAYER");
  return draft(envelope, {
    "TCGplayer Id": mapping.externalId,
    "Add to Quantity": envelope.commercialBindings.quantity,
    "Condition": envelope.materialResolution.condition,
    "Language": "English",
    "Printing": envelope.materialResolution.finish,
    "My Price": (envelope.commercialBindings.offerCents / 100).toFixed(2),
  }, now);
}

export function toLigaDraft(envelope: RecognizedAssetEnvelopeV1, provider: "LIGAMAGIC" | "LIGAPOKEMON", now = new Date()) {
  const mapping = mappingFor(envelope, provider);
  return draft(envelope, {
    provider,
    providerCardId: mapping.externalId,
    canonicalPrintingId: envelope.canonicalIdentity.printingId,
    condition: envelope.materialResolution.condition,
    finish: envelope.materialResolution.finish,
    quantity: envelope.commercialBindings.quantity,
    draftPriceCents: envelope.commercialBindings.offerCents,
    currency: envelope.commercialBindings.currency,
  }, now);
}
