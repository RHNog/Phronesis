import { randomUUID } from "node:crypto";
import type { ObservedCardIdentity, RecognitionCandidate, RecognitionDecision } from "@/lib/cardRecognition/contracts";
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

export const activeRecognitionLane = {
  categoryId: "pokemon-en",
  game: "POKEMON",
  language: "ENGLISH",
  corpusVersion: "catalogue-ocr-only-pokemon-en-20260806",
  indexVersion: "vision-v1-pokemon-artwork-index-disabled",
  pipelineVersion: "local-vision-ocr-pokemon-en-v2-observed-identity",
} as const;

export type ObservedLanguage = "ENGLISH" | "SPANISH" | "UNKNOWN";

function normalizeNameLine(value: string): string {
  return value
    .replace(/[{}©™]/g, " ")
    .replace(/^(?:BASIC|BASIG|BASIE|STAGE\s*[12]|STAGE[12]|FASE\s*[12LI]|FASE[12LI])\b[\s,.:;-]*/i, "")
    .replace(/\s+\d+(?:\s*\/\s*\d+)?\s*$/, "")
    .replace(/[^\p{L}\p{N}',\- ]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function likelyNameQueries(analysis: VisionAnalysis): string[] {
  const normalized = analysis.ocr
    .filter((item) => item.confidence >= 0.45 && item.y >= 0.68 && item.text.length >= 2)
    .sort((left, right) => right.y - left.y || left.x - right.x)
    .map((item) => normalizeNameLine(item.text))
    .filter((item) => item.length >= 2)
    .filter((item) => !/^(?:evolves?\s+from\b|hp\s*\d+\b)/i.test(item))
    .filter((item) => !/^(?:basic|stage\s*[12]?|trainer|energy)$/i.test(item));
  const withOcrAlternates = normalized.flatMap((item) => item.length >= 6 && /[a-z]l$/i.test(item) ? [item, item.slice(0, -1)] : [item]);
  return withOcrAlternates.filter((item, index, all) => all.indexOf(item) === index).slice(0, 6);
}

export function classifyObservedGame(analysis: VisionAnalysis): "MAGIC" | "POKEMON" | "UNKNOWN" {
  const text = analysis.ocr.map((item) => item.text).join("\n");
  if (/\b(?:pok[eé]mon|evolves from|trainer|basic energy|stage\s*[12]|hp\s*\d+)\b/i.test(text)) return "POKEMON";
  if (/\b(?:legendary\s+)?(?:creature|instant|sorcery|enchantment|artifact|planeswalker|battle|land)\b/i.test(text) || /wizards of the coast/i.test(text)) return "MAGIC";
  return "UNKNOWN";
}

export function classifyObservedLanguage(analysis: VisionAnalysis): ObservedLanguage {
  const text = analysis.ocr.map((item) => item.text).join("\n");
  if (/\b(?:evoluciona\s+de|debilidad|retirada|tu\s+rival|puntos?\s+de\s+da[ñn]o|este\s+pok[eé]mon|altura|peso)\b/i.test(text)) return "SPANISH";
  if (/\b(?:evolves?\s+from|weakness|retreat|your\s+opponent|draw\s+a\s+card|this\s+pok[eé]mon|during\s+your|search\s+your\s+deck|attach|discard)\b/i.test(text)) return "ENGLISH";
  return "UNKNOWN";
}

function observedCollector(analysis: VisionAnalysis): { numerator: string; denominator: string; display: string } | null {
  for (const item of [...analysis.ocr].sort((left, right) => left.y - right.y || left.x - right.x)) {
    const match = item.text.match(/\b(\d{1,3}[a-z]?)\s*\/\s*(\d{2,3})\b/i);
    if (match) return { numerator: match[1], denominator: match[2], display: `${match[1]}/${match[2]}` };
  }
  return null;
}

export function observeCardIdentity(analysis: VisionAnalysis): ObservedCardIdentity {
  return {
    probableName: likelyNameQueries(analysis)[0] ?? null,
    collectorNumber: observedCollector(analysis)?.display ?? null,
    game: classifyObservedGame(analysis),
    language: classifyObservedLanguage(analysis),
  };
}

function normalizedCollector(value: string | null): string | null {
  if (!value) return null;
  const match = value.match(/(\d{1,3}[a-z]?)\s*\/\s*(\d{2,3})/i);
  if (!match) return null;
  const normalizePart = (part: string) => part.replace(/^0+(?=\d)/, "").toLowerCase();
  return `${normalizePart(match[1])}/${normalizePart(match[2])}`;
}

export function retrieveCandidates(analysis: VisionAnalysis, catalogue: RecognitionCatalogue, categoryId: string = activeRecognitionLane.categoryId): RecognitionCandidate[] {
  const game = classifyObservedGame(analysis);
  if (categoryId === "pokemon-en" && (game !== "POKEMON" || classifyObservedLanguage(analysis) !== "ENGLISH")) return [];
  if (categoryId === "magic-en" && game !== "MAGIC") return [];
  if (categoryId !== "pokemon-en" && categoryId !== "magic-en") return [];
  const byIdentity = new Map<string, RecognitionCandidate>();
  const queries = likelyNameQueries(analysis);
  const collector = categoryId === "pokemon-en" ? observedCollector(analysis) : null;
  for (const [queryIndex, nameQuery] of queries.entries()) {
    const searchQueries = collector ? [`${nameQuery} ${collector.numerator} ${collector.denominator}`, nameQuery] : [nameQuery];
    for (const searchQuery of searchQueries) {
      for (const [matchIndex, match] of catalogue.search(categoryId, searchQuery).slice(0, 10).entries()) {
        if (match.language.localeCompare("English", undefined, { sensitivity: "base" }) !== 0) continue;
        const id = `${match.categoryId}:${match.sku}`;
        const exactName = match.name.localeCompare(nameQuery, undefined, { sensitivity: "base" }) === 0;
        const collectorMatch = collector !== null && normalizedCollector(match.collectorNumber) === normalizedCollector(collector.display);
        const queryWeight = Math.max(0.45, 0.86 - queryIndex * 0.08);
        const rankPenalty = matchIndex * 0.025;
        const score = Math.max(0, Math.min(0.94, queryWeight + (exactName ? 0.05 : 0) + (collectorMatch ? 0.03 : 0) - rankPenalty));
        const existing = byIdentity.get(id);
        if (existing && existing.score >= score) continue;
        byIdentity.set(id, {
          canonicalPrintingId: id,
          canonicalVariantId: null,
          categoryId: match.categoryId,
          sku: match.sku,
          catalogueIdentity: { name: match.name, setName: match.setName, collectorNumber: match.collectorNumber, variant: match.variant, language: match.language },
          rank: 0,
          score,
          evidence: [
            { kind: "OCR_NAME", score: exactName ? 1 : score, value: nameQuery, artifactSha256: null },
            ...(collector ? [{ kind: "OCR_COLLECTOR" as const, score: collectorMatch ? 1 : 0, value: collector.display, artifactSha256: null }] : []),
            { kind: "LANGUAGE", score: 1, value: "English", artifactSha256: null },
          ],
        });
      }
      if (byIdentity.size) break;
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
  categoryId?: string;
  policy?: ConfidencePolicy;
  now?: string;
}): RecognitionDecision {
  const policy = input.policy ?? conservativePolicy;
  const categoryId = input.categoryId ?? activeRecognitionLane.categoryId;
  const candidates = retrieveCandidates(input.analysis, input.catalogue, categoryId);
  const result = decideCandidates(candidates, policy);
  const observation = observeCardIdentity(input.analysis);
  return {
    decisionId: randomUUID(), regionId: input.regionId, status: result.status,
    selectedCandidate: result.selected, candidates,
    corpusVersion: input.corpusVersion, indexVersion: input.indexVersion,
    pipelineVersion: input.pipelineVersion ?? (categoryId === activeRecognitionLane.categoryId ? activeRecognitionLane.pipelineVersion : "local-vision-ocr-v1"), policyVersion: policy.version,
    decidedBy: "MACHINE", reason: result.reason, createdAt: input.now ?? new Date().toISOString(), observation,
  };
}
