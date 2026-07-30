import { pricingLookupConfig } from "@/config/pricingLookup";
import {
  conditionLadder,
  type NormalizedPricingRow,
  type ArtworkSearchGroup,
  type PriceState,
  type PricingCondition,
  type ProductType,
  type SearchMatch,
} from "@/lib/pricing/types";

const conditionLabels: Record<PricingCondition, string> = {
  NEAR_MINT: "Near Mint",
  LIGHTLY_PLAYED: "Lightly Played",
  MODERATELY_PLAYED: "Moderately Played",
  HEAVILY_PLAYED: "Heavily Played",
  DAMAGED: "Damaged",
};

export function conditionLabel(condition: PricingCondition): string {
  return conditionLabels[condition];
}

export function deliveredPriceFor(
  productType: ProductType,
  listingPriceCents: number | null,
  exportedShippingCents: number | null,
): Pick<PriceState, "deliveredPriceCents" | "shippingCents" | "shippingSource"> {
  if (listingPriceCents === null) {
    return {
      deliveredPriceCents: null,
      shippingCents: exportedShippingCents,
      shippingSource: exportedShippingCents === null ? "UNKNOWN" : "EXPORTED",
    };
  }

  if (exportedShippingCents !== null) {
    return {
      deliveredPriceCents: listingPriceCents + exportedShippingCents,
      shippingCents: exportedShippingCents,
      shippingSource: "EXPORTED",
    };
  }

  if (productType === "SEALED") {
    return {
      deliveredPriceCents: null,
      shippingCents: null,
      shippingSource: "UNKNOWN",
    };
  }

  return {
    deliveredPriceCents:
      listingPriceCents + pricingLookupConfig.assumedSingleShippingCents,
    shippingCents: pricingLookupConfig.assumedSingleShippingCents,
    shippingSource: "ASSUMED",
  };
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const finishOnlyParenthetical = /\((?:\d{2,4}|[a-z]{1,4}\d{1,4}|(?:etched|foil|holofoil|reverse holofoil|rainbow foil|surge foil|galaxy foil|confetti foil|pool party foil|textured foil|cold foil))\)\s*$/i;

export function artworkIdentityName(value: string): string {
  let name = value.trim();
  while (finishOnlyParenthetical.test(name)) name = name.replace(finishOnlyParenthetical, "").trim();
  return name;
}

export function artworkIdentityKey(match: Pick<SearchMatch, "categoryId" | "productType" | "name" | "setName" | "collectorNumber" | "language" | "sku">): string {
  if (match.productType === "SEALED") return `${match.categoryId}|sealed|${match.sku}`;
  return [
    match.categoryId,
    "single",
    normalizeSearchText(artworkIdentityName(match.name)),
    normalizeSearchText(match.setName),
    normalizeSearchText(match.collectorNumber ?? ""),
    normalizeSearchText(match.language),
  ].join("|");
}

function variantPreference(match: SearchMatch): number {
  const variant = normalizeSearchText(match.variant);
  if (variant === "normal" || variant === "nonfoil" || variant === "unlimited") return 0;
  return 1;
}

export function groupSearchMatchesByArtwork(matches: SearchMatch[]): ArtworkSearchGroup[] {
  const groups = new Map<string, ArtworkSearchGroup>();
  for (const match of matches) {
    const id = artworkIdentityKey(match);
    const existing = groups.get(id);
    if (existing) {
      existing.variants.push(match);
      existing.score = Math.max(existing.score, match.score);
      existing.imageUrl ??= match.imageUrl;
      continue;
    }
    groups.set(id, {
      id,
      categoryId: match.categoryId,
      productType: match.productType,
      name: artworkIdentityName(match.name),
      setName: match.setName,
      collectorNumber: match.collectorNumber,
      language: match.language,
      imageUrl: match.imageUrl,
      score: match.score,
      variants: [match],
    });
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      variants: [...group.variants].sort((a, b) => variantPreference(a) - variantPreference(b) || a.variant.localeCompare(b.variant) || a.sku.localeCompare(b.sku)),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

const singleSignals = /\b(?:nm|lp|mp|hp|dmg|holo|reverse|promo|stamped|illustration|rare|\d{1,4}\s*\/\s*\d{1,4})\b/i;
const collectorNumberOnly = /^(?:[a-z]{0,4}\s*)?\d{1,4}(?:\s*\/\s*\d{1,4})?[a-z]?$/i;

export function queryClearlyTargetsSingle(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return singleSignals.test(query) || collectorNumberOnly.test(normalized);
}

export function searchScore(row: Pick<NormalizedPricingRow, "name" | "setName" | "collectorNumber" | "variant" | "productType">, query: string): number {
  const q = normalizeSearchText(query);
  if (!q) return 0;
  const name = normalizeSearchText(row.name);
  const set = normalizeSearchText(row.setName);
  const number = normalizeSearchText(row.collectorNumber ?? "");
  const variant = normalizeSearchText(row.variant);
  const tokens = q.split(" ");
  let score = 0;
  if (name === q) score += 100;
  else if (name.startsWith(q)) score += 70;
  else if (name.includes(q)) score += 50;
  if (set === q) score += 55;
  else if (set.includes(q)) score += 28;
  if (number === q) score += 65;
  if (variant.includes(q)) score += 24;
  score += tokens.filter((token) =>
    `${name} ${set} ${number} ${variant}`.includes(token),
  ).length * 6;
  if (row.productType === "SEALED" && (name === q || set === q)) score += 10;
  return score;
}

export function nearestPricedCondition(
  prices: SearchMatch["prices"],
  selected: PricingCondition,
): { condition: PricingCondition; price: PriceState } | null {
  const selectedIndex = conditionLadder.indexOf(selected);
  return conditionLadder
    .map((condition, index) => ({
      condition,
      price: prices[condition],
      distance: Math.abs(index - selectedIndex),
      index,
    }))
    .filter(
      (candidate): candidate is {
        condition: PricingCondition;
        price: PriceState;
        distance: number;
        index: number;
      } => candidate.price?.deliveredPriceCents !== null && candidate.price !== undefined,
    )
    .sort((a, b) => a.distance - b.distance || a.index - b.index)[0] ?? null;
}

export function movementFor(match: SearchMatch, currentMarketPriceCents: number | null, price?: PriceState | null) {
  const previousMarketPriceCents = price?.previousMarketPriceCents ?? match.previousMarketPriceCents;
  const previousSnapshotDate = price?.previousSnapshotDate ?? match.previousSnapshotDate;
  if (
    currentMarketPriceCents === null ||
    previousMarketPriceCents === null ||
    previousMarketPriceCents === 0 ||
    previousSnapshotDate === null
  ) {
    return null;
  }
  return {
    percentage:
      ((currentMarketPriceCents - previousMarketPriceCents) /
        previousMarketPriceCents) *
      100,
    comparisonDate: previousSnapshotDate,
  };
}

export function askingPriceSpread(askingCents: number, referenceCents: number) {
  const differenceCents = askingCents - referenceCents;
  if (referenceCents >= pricingLookupConfig.askingPricePercentageThresholdCents) {
    return { mode: "PERCENTAGE" as const, differenceCents, percentage: (differenceCents / referenceCents) * 100 };
  }
  return { mode: "ABSOLUTE" as const, differenceCents, percentage: null };
}

export function isStale(snapshotDate: string | null, now = new Date()): boolean {
  if (!snapshotDate) return false;
  const parsed = new Date(snapshotDate.includes("T") ? snapshotDate : `${snapshotDate}T00:00:00Z`);
  const age = now.getTime() - parsed.getTime();
  return age > pricingLookupConfig.staleAfterDays * 86_400_000;
}
