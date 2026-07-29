import { pricingLookupConfig } from "@/config/pricingLookup";
import {
  conditionLadder,
  type NormalizedPricingRow,
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

export function movementFor(match: SearchMatch, currentMarketPriceCents: number | null) {
  if (
    currentMarketPriceCents === null ||
    match.previousMarketPriceCents === null ||
    match.previousMarketPriceCents === 0 ||
    match.previousSnapshotDate === null
  ) {
    return null;
  }
  return {
    percentage:
      ((currentMarketPriceCents - match.previousMarketPriceCents) /
        match.previousMarketPriceCents) *
      100,
    comparisonDate: match.previousSnapshotDate,
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
  const age = now.getTime() - new Date(`${snapshotDate}T00:00:00Z`).getTime();
  return age > pricingLookupConfig.staleAfterDays * 86_400_000;
}
