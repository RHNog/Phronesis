import { normalizeSearchText } from "@/lib/pricing/searchText";

export type OnePieceSetEvidenceRow = {
  sku: string;
  setName: string;
  collectorNumber: string | null;
};

export type DerivedPricingSetAlias = {
  alias: string;
  canonicalSetName: string;
  evidenceCount: number;
  runnerUpCount: number;
};

type OnePieceFamily = "op" | "eb" | "st" | "prb";

const specialSetSignals = /\b(?:anniversary|championship|event|flagship|judge|pirate party|pre\s*release|promotion|promo|regional|serial|store tournament|tournament|treasure cup|winner)\b/i;

export function canonicalOnePieceCollectorNumber(value: string): string | null {
  const normalized = normalizeSearchText(value).replaceAll(" ", "");
  if (!/^\d{1,3}$/.test(normalized)) return null;
  const number = Number(normalized);
  if (!Number.isInteger(number) || number < 1 || number > 999) return null;
  return String(number).padStart(3, "0");
}

export function canonicalOnePieceSetCode(value: string): string | null {
  const normalized = normalizeSearchText(value).replaceAll(" ", "");
  const match = normalized.match(/^(op|eb|st|prb)0*(\d{1,2})$/);
  if (!match) return null;
  const family = match[1] as OnePieceFamily;
  const number = Number(match[2]);
  if (!Number.isInteger(number) || number < 1 || number > 99) return null;
  return `${family}${String(number).padStart(2, "0")}`;
}

export function onePieceSetCodeFromCollectorNumber(
  collectorNumber: string | null,
): string | null {
  if (!collectorNumber) return null;
  const match = collectorNumber
    .trim()
    .match(/^(OP|EB|ST|PRB)[\s-]*0*(\d{1,2})[\s-]+\d{1,4}\b/i);
  return match ? canonicalOnePieceSetCode(`${match[1]}${match[2]}`) : null;
}

function compatibleSetName(alias: string, setName: string): boolean {
  if (!setName.trim()) return false;
  const family = alias.match(/^[a-z]+/)?.[0] as OnePieceFamily | undefined;
  const normalized = normalizeSearchText(setName);
  if (specialSetSignals.test(normalized)) return false;
  if (family === "st") return /\bstarter deck\b/.test(normalized);
  if (family === "prb") return /\b(?:premium|the best)\b/.test(normalized);
  if (family === "op" || family === "eb") {
    return !/\bstarter deck\b|\bpremium booster\b/.test(normalized);
  }
  return false;
}

export function deriveOnePieceSetAliases(
  rows: readonly OnePieceSetEvidenceRow[],
): DerivedPricingSetAlias[] {
  const evidence = new Map<
    string,
    Map<string, { setName: string; skus: Set<string> }>
  >();

  for (const row of rows) {
    const alias = onePieceSetCodeFromCollectorNumber(row.collectorNumber);
    if (!alias || !compatibleSetName(alias, row.setName)) continue;
    const normalizedSetName = normalizeSearchText(row.setName);
    if (!normalizedSetName) continue;
    const candidates = evidence.get(alias) ?? new Map();
    const candidate = candidates.get(normalizedSetName) ?? {
      setName: row.setName.trim(),
      skus: new Set<string>(),
    };
    candidate.skus.add(row.sku);
    candidates.set(normalizedSetName, candidate);
    evidence.set(alias, candidates);
  }

  const aliases: DerivedPricingSetAlias[] = [];
  for (const [alias, candidates] of evidence) {
    const ranked = [...candidates.values()].sort(
      (left, right) =>
        right.skus.size - left.skus.size ||
        left.setName.localeCompare(right.setName),
    );
    const winner = ranked[0];
    const runnerUpCount = ranked[1]?.skus.size ?? 0;
    if (!winner || winner.skus.size < 2) continue;
    if (runnerUpCount > 0 && winner.skus.size < runnerUpCount * 1.5) continue;
    aliases.push({
      alias,
      canonicalSetName: winner.setName,
      evidenceCount: winner.skus.size,
      runnerUpCount,
    });
  }

  return aliases.sort((left, right) => left.alias.localeCompare(right.alias));
}
