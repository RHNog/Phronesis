export const recognitionDecisionStatuses = ["ACCEPTED", "REVIEW", "ABSTAINED", "FAILED"] as const;
export type RecognitionDecisionStatus = (typeof recognitionDecisionStatuses)[number];

export type NormalizedRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDegrees: 0 | 90 | 180 | 270;
};

export type ScanFrame = {
  frameId: string;
  sessionId: string;
  sequence: number;
  side: "FRONT" | "BACK" | "UNKNOWN";
  objectSha256: string;
  mediaType: "image/jpeg" | "image/png" | "image/tiff";
  byteLength: number;
  capturedAt: string;
  pairedFrameId: string | null;
};

export type DetectedCardRegion = {
  regionId: string;
  frameId: string;
  order: number;
  revision: number;
  state: "ACTIVE" | "REJECTED";
  geometry: NormalizedRegion;
  parentRegionId: string | null;
  correctionReason: string | null;
};

export type RecognitionEvidence = {
  kind: "ARTWORK" | "OCR_NAME" | "OCR_SET" | "OCR_COLLECTOR" | "GEOMETRY" | "LANGUAGE" | "FINISH";
  score: number;
  value: string | null;
  artifactSha256: string | null;
};

export type RecognitionCandidate = {
  canonicalPrintingId: string;
  canonicalVariantId: string | null;
  categoryId: string;
  sku: string;
  catalogueIdentity: {
    name: string;
    setName: string;
    collectorNumber: string | null;
    variant: string;
    language: string;
  };
  rank: number;
  score: number;
  evidence: RecognitionEvidence[];
};

export type RecognitionDecision = {
  decisionId: string;
  regionId: string;
  status: RecognitionDecisionStatus;
  selectedCandidate: RecognitionCandidate | null;
  candidates: RecognitionCandidate[];
  corpusVersion: string;
  indexVersion: string;
  pipelineVersion: string;
  policyVersion: string;
  decidedBy: "MACHINE" | "OPERATOR";
  reason: string;
  createdAt: string;
};

export function assertSha256(value: string, field: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`${field} must be a lowercase SHA-256`);
}

function finiteUnit(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error(`${field} must be within [0,1]`);
}

export function validateRegionGeometry(region: NormalizedRegion): void {
  finiteUnit(region.x, "x");
  finiteUnit(region.y, "y");
  finiteUnit(region.width, "width");
  finiteUnit(region.height, "height");
  if (region.width === 0 || region.height === 0) throw new Error("region must have positive area");
  if (region.x + region.width > 1 || region.y + region.height > 1) throw new Error("region exceeds frame bounds");
  if (![0, 90, 180, 270].includes(region.rotationDegrees)) throw new Error("rotation must be a right angle");
}

export function validateFrame(frame: ScanFrame): void {
  if (!frame.frameId || !frame.sessionId) throw new Error("frame and session identifiers are required");
  if (!Number.isSafeInteger(frame.sequence) || frame.sequence < 0) throw new Error("frame sequence must be a non-negative integer");
  if (!Number.isSafeInteger(frame.byteLength) || frame.byteLength <= 0) throw new Error("frame byte length must be positive");
  assertSha256(frame.objectSha256, "objectSha256");
  if (!Number.isFinite(Date.parse(frame.capturedAt))) throw new Error("capturedAt must be an ISO timestamp");
}

export function fullFrameRegion(frameId: string): DetectedCardRegion {
  return {
    regionId: `${frameId}:region:0:r1`,
    frameId,
    order: 0,
    revision: 1,
    state: "ACTIVE",
    geometry: { x: 0, y: 0, width: 1, height: 1, rotationDegrees: 0 },
    parentRegionId: null,
    correctionReason: null,
  };
}

export function validateRegions(regions: DetectedCardRegion[]): void {
  const orders = new Set<number>();
  for (const region of regions) {
    validateRegionGeometry(region.geometry);
    if (!Number.isSafeInteger(region.order) || region.order < 0) throw new Error("region order must be non-negative");
    if (orders.has(region.order)) throw new Error("active region order must be unique");
    orders.add(region.order);
  }
}
