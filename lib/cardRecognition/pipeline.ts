import { randomUUID } from "node:crypto";
import type { RecognitionCandidate, RecognitionDecision } from "@/lib/cardRecognition/contracts";
import { conservativePolicy, decideCandidates, type ConfidencePolicy } from "@/lib/cardRecognition/policy";
import type { VisionAnalysis } from "@/lib/cardRecognition/visionWorker";

export type RecognitionSearchMatch = {
  categoryId: string;
  sku: string;
  name: string;
  setName: string;
  collectorNumber: string | null;
  variant: string;
  language: string;
};

export type RecognitionCatalogue = { search(categoryId: string, query: string): RecognitionSearchMatch[] };

function likelyNameQueries(analysis: VisionAnalysis): string[] {
  return analysis.ocr
    .filter((item) => item.confidence >= 0.45 && item.y >= 0.68 && item.text.length >= 2)
    .sort((left, right) => right.y - left.y || left.x - right.x)
    .map((item) => item.text.replace(/[{}©™]/g, " ").replace(/\s+\d+(?:\s*\/\s*\d+)?\s*$/, "").replace(/[^\p{L}\p{N}',\- ]/gu, " ").replace(/\s+/g, " ").trim())
    .filter((item, index, all) => item.length >= 2 && all.indexOf(item) === index)
    .slice(0, 4);
}

export function classifyObservedGame(analysis: VisionAnalysis): "MAGIC" | "POKEMON" | "UNKNOWN" {
  const text = analysis.ocr.map((item) => item.text).join("\n");
  if (/\b(?:pok[eé]mon|evolves from|trainer|basic energy|stage\s*[12]|hp\s*\d+)\b/i.test(text)) return "POKEMON";
  if (/\b(?:legendary\s+)?(?:creature|instant|sorcery|enchantment|artifact|planeswalker|battle|land)\b/i.test(text) || /wizards of the coast/i.test(text)) return "MAGIC";
  return "UNKNOWN";
}

export function retrieveCandidates(analysis: VisionAnalysis, catalogue: RecognitionCatalogue, categoryId = "magic-en"): RecognitionCandidate[] {
  if (categoryId === "magic-en" && classifyObservedGame(analysis) !== "MAGIC") return [];
  const byIdentity = new Map<string, RecognitionCandidate>();
  const queries = likelyNameQueries(analysis);
  for (const [queryIndex, query] of queries.entries()) {
    for (const [matchIndex, match] of catalogue.search(categoryId, query).slice(0, 10).entries()) {
      const id = `${match.categoryId}:${match.sku}`;
      const exactName = match.name.localeCompare(query, undefined, { sensitivity: "base" }) === 0;
      const queryWeight = Math.max(0.45, 0.86 - queryIndex * 0.08);
      const rankPenalty = matchIndex * 0.025;
      const score = Math.max(0, Math.min(0.94, queryWeight + (exactName ? 0.08 : 0) - rankPenalty));
      const existing = byIdentity.get(id);
      if (existing && existing.score >= score) continue;
      byIdentity.set(id, {
        canonicalPrintingId: id,
        canonicalVariantId: null,
        categoryId: match.categoryId,
        sku: match.sku,
        rank: 0,
        score,
        evidence: [{ kind: "OCR_NAME", score, value: query, artifactSha256: null }],
      });
    }
    if (byIdentity.size) break;
  }
  return [...byIdentity.values()]
    .sort((left, right) => right.score - left.score || left.canonicalPrintingId.localeCompare(right.canonicalPrintingId))
    .slice(0, 10)
    .map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

export function createRecognitionDecision(input: {
  regionId: string;
  analysis: VisionAnalysis;
  catalogue: RecognitionCatalogue;
  corpusVersion: string;
  indexVersion: string;
  pipelineVersion?: string;
  policy?: ConfidencePolicy;
  now?: string;
}): RecognitionDecision {
  const policy = input.policy ?? conservativePolicy;
  const candidates = retrieveCandidates(input.analysis, input.catalogue);
  const result = decideCandidates(candidates, policy);
  return {
    decisionId: randomUUID(), regionId: input.regionId, status: result.status,
    selectedCandidate: result.selected, candidates,
    corpusVersion: input.corpusVersion, indexVersion: input.indexVersion,
    pipelineVersion: input.pipelineVersion ?? "local-vision-ocr-v1", policyVersion: policy.version,
    decidedBy: "MACHINE", reason: result.reason, createdAt: input.now ?? new Date().toISOString(),
  };
}
