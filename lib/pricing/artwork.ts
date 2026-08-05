import type { Card, CardImageUrls } from "@/types/card";
import type { SearchMatch } from "@/lib/pricing/types";
import { artworkIdentityName } from "@/lib/pricing/domain";
import { pokemonSetIdentity } from "@/lib/pricing/pokemonIdentity";

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

function comparableSet(value: string, categoryId: string): string {
  return categoryId === "pokemon-en"
    ? pokemonSetIdentity(value)
    : normalizedSet(value);
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

export function providerArtworkQuery(
  categoryId: string,
  query: string,
  matches: SearchMatch[],
): string {
  const firstSingleName = matches.find((match) => match.productType === "SINGLE")?.name;
  if (!firstSingleName || !new Set(["pokemon-en", "lorcana-en"]).has(categoryId)) return query;
  const identityName = artworkIdentityName(firstSingleName);
  return categoryId === "lorcana-en"
    ? identityName.replace(/\s+[-\u2013\u2014]\s+/g, " ")
    : identityName;
}

export function providerArtworkQueries(
  categoryId: string,
  query: string,
  matches: SearchMatch[],
  limit = 8,
): string[] {
  if (categoryId === "onepiece-en") {
    return [...new Set(matches
      .filter((match) => match.productType === "SINGLE")
      .map((match) => match.collectorNumber?.trim() || artworkIdentityName(match.name))
      .filter((value) => value.length >= 2))]
      .slice(0, limit);
  }
  if (!new Set(["magic-en", "pokemon-en", "lorcana-en"]).has(categoryId)) return [providerArtworkQuery(categoryId, query, matches)];
  return [...new Set(matches
    .filter((match) => match.productType === "SINGLE")
    .map((match) => categoryId === "magic-en"
      ? artworkIdentityName(match.name)
      : providerArtworkQuery(categoryId, query, [match]))
    .filter((value) => value.length >= 2))]
    .slice(0, limit);
}

export function resolveSnapshotArtwork(
  matches: SearchMatch[],
  cards: Card[],
): Record<string, CardImageUrls> {
  const artwork: Record<string, CardImageUrls> = {};
  const bySetAndNumber = new Map<string, Card[]>();
  const bySetAndName = new Map<string, Card[]>();
  const byNameAndNumber = new Map<string, Card[]>();
  const add = (index: Map<string, Card[]>, key: string, card: Card) => {
    const existing = index.get(key);
    if (existing) existing.push(card);
    else index.set(key, [card]);
  };
  for (const card of cards) {
    const cardName = normalized(card.name);
    const cardNumber = normalizedCollectorNumber(card.number);
    for (const categoryId of ["magic-en", "pokemon-en", "lorcana-en"] as const) {
      const cardSet = comparableSet(card.set, categoryId);
      add(bySetAndNumber, `${categoryId}|${cardSet}|${cardNumber}`, card);
      add(bySetAndName, `${categoryId}|${cardSet}|${cardName}`, card);
      add(byNameAndNumber, `${categoryId}|${cardName}|${cardNumber}`, card);
    }
  }
  for (const match of matches) {
    if (match.productType !== "SINGLE") continue;
    const set = comparableSet(match.setName, match.categoryId);
    const number = normalizedCollectorNumber(match.collectorNumber);
    const name = normalized(artworkIdentityName(match.name));
    const printingCandidates = number
      ? bySetAndNumber.get(`${match.categoryId}|${set}|${number}`) ?? []
      : bySetAndName.get(`${match.categoryId}|${set}|${name}`) ?? [];
    const exactNames = printingCandidates.filter((card) => normalized(card.name) === name);
    const identityCandidates = number
      ? byNameAndNumber.get(`${match.categoryId}|${name}|${number}`) ?? []
      : [];
    const selected = exactNames.length === 1
      ? exactNames[0]
      : number && printingCandidates.length === 1
        ? printingCandidates[0]
        : match.categoryId === "magic-en" && printingCandidates.length === 0 && identityCandidates.length === 1
          ? identityCandidates[0]
        : undefined;
    const urls = selected ? usableArtwork(selected) : undefined;
    if (urls) artwork[match.sku] = urls;
  }
  return artwork;
}
function onePieceBaseName(value: string): string {
  return normalized(
    artworkIdentityName(value)
      .replace(/\s+-\s+(?:EB|OP|P|PRB|ST)-?\d{1,3}(?:-\d{1,3})?.*$/i, "")
      .replace(/(?:\s*\([^)]*\))+\s*$/g, "")
  );
}

function officialAssetId(card: Card): string {
  return card.providerIdentity?.providerRecordId ?? "";
}

function onePieceAllowsIdentityFallback(setName: string, collectorNumber: string): boolean {
  if (/^p-\d+$/i.test(collectorNumber)) return true;
  return !/(?:promotion|pre[ -]?release|release event|tournament|championship|winner|regional|treasure|serial|anniversary|premium booster|event pack|judge|demo|tutorial|learn together|double pack)/i.test(setName);
}

export function resolveOnePieceSnapshotArtwork(
  matches: SearchMatch[],
  cards: Card[],
): Record<string, CardImageUrls> {
  const artwork: Record<string, CardImageUrls> = {};
  const byIdentity = new Map<string, Card[]>();
  const bySetAndIdentity = new Map<string, Card[]>();
  for (const card of cards) {
    const identity = `${normalized(card.number).replace(/\s+/g, "")}|${onePieceBaseName(card.name)}`;
    const byIdentityCandidates = byIdentity.get(identity);
    if (byIdentityCandidates) byIdentityCandidates.push(card);
    else byIdentity.set(identity, [card]);
    const setIdentity = `${normalizedOnePieceSet(card.set)}|${identity}`;
    const bySetCandidates = bySetAndIdentity.get(setIdentity);
    if (bySetCandidates) bySetCandidates.push(card);
    else bySetAndIdentity.set(setIdentity, [card]);
  }
  const selectVariant = (candidates: Card[], wantsSp: boolean, wantsParallel: boolean): Card | undefined => {
    const variants = wantsSp
      ? candidates.filter((card) => normalized(card.rarity) === "sp card")
      : wantsParallel
        ? candidates.filter((card) => /_p\d+$/i.test(officialAssetId(card)) && normalized(card.rarity) !== "sp card")
        : candidates.filter((card) => officialAssetId(card).toUpperCase() === card.number.toUpperCase());
    return variants.length === 1 ? variants[0] : undefined;
  };
  for (const match of matches) {
    if (match.productType !== "SINGLE") continue;
    const set = normalizedOnePieceSet(match.setName);
    const number = normalized(match.collectorNumber).replace(/\s+/g, "");
    const name = onePieceBaseName(match.name);
    const descriptors = [...match.name.matchAll(/\(([^)]+)\)|\[([^\]]+)\]/g)].map((item) => normalized(item[1] ?? item[2]));
    const wantsSp = descriptors.some((value) => value === "sp" || value === "sp card");
    const wantsParallel = descriptors.some((value) => /(?:alternate art|parallel|reprint)/.test(value));
    const hasUnknownDescriptor = descriptors.some((value) => !/^\d+$/.test(value) && !/(?:alternate art|parallel|reprint|sp(?: card)?)/.test(value));
    if (hasUnknownDescriptor) continue;
    const identity = `${number}|${name}`;
    const setCandidates = bySetAndIdentity.get(`${set}|${identity}`) ?? [];
    const identityCandidates = byIdentity.get(identity) ?? [];
    const selected = selectVariant(setCandidates, wantsSp, wantsParallel)
      ?? (setCandidates.length === 0 && onePieceAllowsIdentityFallback(match.setName, number)
        ? selectVariant(identityCandidates, wantsSp, wantsParallel)
        : undefined);
    const urls = selected ? usableArtwork(selected) : undefined;
    if (urls) artwork[match.sku] = urls;
  }
  return artwork;
}
