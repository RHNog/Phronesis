import type { Card, CardImageUrls } from "@/types/card";
import type { SearchMatch } from "@/lib/pricing/types";

function normalized(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedSet(value: string): string {
  return normalized(
    value
      .replace(/^\s*[A-Z]{1,8}\d{0,4}(?:\.[A-Z0-9]+)?\s*:\s*/i, "")
      .replace(/\s+\([A-Z0-9-]+\)\s*$/, ""),
  );
}

function normalizedOnePieceSet(value: string): string {
  return normalized(
    value
      .replace(/\[[A-Z0-9-]+\]/gi, " ")
      .replace(/\b(?:starter|ultra)\s+deck(?:\s+ex)?\s*\d*\s*:?/gi, " ")
      .replace(/\b(?:premium|extra)\s+booster(?:\s+pack)?\b/gi, " ")
      .replace(/\bbooster\s+pack\b/gi, " ")
      .replace(/\bone\s+piece\s+card\b/gi, " ")
      .replace(/\bone\s+piece\b/gi, " ")
  ).replace(/\bcards\b/g, "card");
}

function normalizedCollectorNumber(value: string | null | undefined): string {
  const numerator = normalized(value).split(" ")[0] ?? "";
  const match = numerator.match(/^(\d+)([a-z]*)$/);
  return match ? `${Number(match[1])}${match[2]}` : numerator;
}

function usableArtwork(card: Card): CardImageUrls | undefined {
  const urls = card.imageUrls ?? (card.imageUrl ? { normal: card.imageUrl } : undefined);
  return urls && (urls.small || urls.normal || urls.large) ? urls : undefined;
}

export function resolveSnapshotArtwork(
  matches: SearchMatch[],
  cards: Card[],
): Record<string, CardImageUrls> {
  const artwork: Record<string, CardImageUrls> = {};
  for (const match of matches) {
    if (match.productType !== "SINGLE") continue;
    const set = normalizedSet(match.setName);
    const number = normalizedCollectorNumber(match.collectorNumber);
    const name = normalized(match.name);
    const setCandidates = cards.filter((card) => normalizedSet(card.set) === set);
    const printingCandidates = number
      ? setCandidates.filter((card) => normalizedCollectorNumber(card.number) === number)
      : setCandidates.filter((card) => normalized(card.name) === name);
    const exactNames = printingCandidates.filter((card) => normalized(card.name) === name);
    const selected = exactNames.length === 1
      ? exactNames[0]
      : number && printingCandidates.length === 1
        ? printingCandidates[0]
        : undefined;
    const urls = selected ? usableArtwork(selected) : undefined;
    if (urls) artwork[match.sku] = urls;
  }
  return artwork;
}

function onePieceBaseName(value: string): string {
  return normalized(
    value
      .replace(/\s+-\s+(?:EB|OP|P|PRB|ST)-?\d{1,3}(?:-\d{1,3})?.*$/i, "")
      .replace(/\s*\([^)]*\)\s*$/g, "")
  );
}

function officialAssetId(card: Card): string {
  return card.providerIdentity?.providerRecordId ?? "";
}

export function resolveOnePieceSnapshotArtwork(
  matches: SearchMatch[],
  cards: Card[],
): Record<string, CardImageUrls> {
  const artwork: Record<string, CardImageUrls> = {};
  for (const match of matches) {
    if (match.productType !== "SINGLE") continue;
    const set = normalizedOnePieceSet(match.setName);
    const number = normalized(match.collectorNumber).replace(/\s+/g, "");
    const name = onePieceBaseName(match.name);
    const descriptors = [...match.name.matchAll(/\(([^)]+)\)/g)].map((item) => normalized(item[1]));
    const wantsSp = descriptors.some((value) => value === "sp" || value === "sp card");
    const wantsParallel = descriptors.some((value) => /(?:alternate art|parallel|reprint)/.test(value));
    const hasUnknownDescriptor = descriptors.some((value) => !/^\d+$/.test(value) && !/(?:alternate art|parallel|reprint|sp(?: card)?)/.test(value));
    if (hasUnknownDescriptor) continue;
    const candidates = cards.filter((card) =>
      normalizedOnePieceSet(card.set) === set &&
      normalized(card.number).replace(/\s+/g, "") === number &&
      onePieceBaseName(card.name) === name
    );
    const variantCandidates = wantsSp
      ? candidates.filter((card) => normalized(card.rarity) === "sp card")
      : wantsParallel
        ? candidates.filter((card) => /_p\d+$/i.test(officialAssetId(card)) && normalized(card.rarity) !== "sp card")
        : candidates.filter((card) => officialAssetId(card).toUpperCase() === card.number.toUpperCase());
    const selected = variantCandidates.length === 1 ? variantCandidates[0] : undefined;
    const urls = selected ? usableArtwork(selected) : undefined;
    if (urls) artwork[match.sku] = urls;
  }
  return artwork;
}
