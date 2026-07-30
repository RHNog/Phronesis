"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import CardThumbnail from "@/components/cards/CardThumbnail";
import type { CardImageCandidate, CardImageUrls } from "@/components/cards/CardImageCache";
import { pricingLookupConfig } from "@/config/pricingLookup";
import { defaultStrategyId, seedStrategies, seedStrategyProfiles } from "@/data/seedStrategies";
import EvaluationSummary from "@/features/vendor/components/EvaluationSummary";
import { defaultBusinessProfiles } from "@/lib/business/BusinessDefaults";
import { conditionLabel, groupSearchMatchesByArtwork, movementFor, nearestPricedCondition } from "@/lib/pricing/domain";
import { evaluatePurchase, type PurchaseEvaluation } from "@/lib/engines/evaluation/evaluatePurchase";
import {
  conditionLadder,
  type ArtworkSearchGroup,
  type PriceState,
  type PricingCondition,
  type SearchMatch,
  type UnifiedPricingSearchResponse,
} from "@/lib/pricing/types";
import type { Card } from "@/types/card";
import type { CardConditionCode } from "@/types/conditionProfile";
import type { MarketPrice } from "@/types/marketPrice";
import type { PrintingVariant } from "@/types/printingVariant";

const conditionCodes: Record<PricingCondition, CardConditionCode> = {
  NEAR_MINT: "NM",
  LIGHTLY_PLAYED: "LP",
  MODERATELY_PLAYED: "MP",
  HEAVILY_PLAYED: "HP",
  DAMAGED: "DMG",
};

const games: Record<string, Card["game"]> = {
  "magic-en": "Magic",
  "pokemon-en": "Pokemon",
  "onepiece-en": "One Piece",
  "lorcana-en": "Lorcana",
  "riftbound-en": "Riftbound",
};

function gameLabel(categoryId: string): string {
  return pricingLookupConfig.categories.find((category) => category.id === categoryId)?.label ?? categoryId;
}

function money(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "Unavailable";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function timestamp(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(parsed);
}

function selectedPrice(match: SearchMatch, condition: PricingCondition): PriceState | null {
  return match.productType === "SEALED" ? match.sealedPrice : match.prices[condition] ?? null;
}

function bestReference(price: PriceState | null): { cents: number | null; label: string } {
  if (price?.marketPriceCents !== null && price?.marketPriceCents !== undefined) {
    return { cents: price.marketPriceCents, label: "TCG Market Price" };
  }
  if (price?.deliveredPriceCents !== null && price?.deliveredPriceCents !== undefined) {
    return { cents: price.deliveredPriceCents, label: "Delivered-low fallback" };
  }
  return { cents: null, label: "No usable reference" };
}

function thumbnailCandidates(match: SearchMatch, providerUrls?: CardImageUrls): CardImageCandidate[] {
  return [
    ...(match.imageUrl ? [{ source: "Repository" as const, urls: { normal: match.imageUrl } }] : []),
    ...(providerUrls ? [{ source: "Provider" as const, urls: providerUrls }] : []),
  ];
}

export function createSnapshotPurchaseEvaluation(input: {
  match: SearchMatch;
  condition: PricingCondition;
  price: PriceState;
  askingPrice: number;
  businessProfileId: string;
  strategyId: string;
}): PurchaseEvaluation | null {
  const reference = bestReference(input.price);
  if (reference.cents === null || input.askingPrice <= 0) return null;
  const finish = input.match.productType === "SEALED" ? "Sealed" : input.match.variant;
  const variant: PrintingVariant = {
    id: `${input.match.sku}:${finish}`,
    printingId: input.match.sku,
    finish,
    isAvailable: true,
    source: "TCGplayer catalogue snapshot",
  };
  const card: Card = {
    id: input.match.sku,
    name: input.match.name,
    game: games[input.match.categoryId] ?? "Magic",
    set: input.match.setName,
    number: input.match.collectorNumber ?? "",
    rarity: "Catalogue",
    finish,
    availableFinishes: [finish],
    finishVariants: [variant],
    imageUrl: input.match.imageUrl ?? "",
    language: input.match.language,
    tcgplayerId: input.price.sourceSku && /^\d+$/.test(input.price.sourceSku) ? Number(input.price.sourceSku) : undefined,
  };
  const marketPrice: MarketPrice = {
    id: `snapshot:${input.price.sourceSku ?? input.match.sku}:${input.price.snapshotDate}`,
    cardId: input.match.sku,
    printingId: input.match.sku,
    variantId: variant.id,
    providerId: "tcgplayer",
    source: reference.label,
    currency: "USD",
    finish,
    price: reference.cents / 100,
    priceType: input.price.marketPriceCents !== null ? "market_estimate" : "lowest_known",
    updatedAt: input.price.snapshotDate,
    confidence: 85,
    condition: input.match.productType === "SEALED" ? "Unopened" : conditionLabel(input.condition),
    conditionSpecific: true,
  };
  const businessProfile = defaultBusinessProfiles.find((profile) => profile.id === input.businessProfileId) ?? defaultBusinessProfiles[0];
  const strategy = seedStrategies.find((candidate) => candidate.id === input.strategyId) ?? seedStrategies[0];
  const strategyProfile = seedStrategyProfiles.find((profile) => profile.id === strategy.profileId) ?? seedStrategyProfiles[0];
  return evaluatePurchase({
    businessProfile,
    card,
    condition: input.match.productType === "SEALED" ? "NM" : conditionCodes[input.condition],
    marketPrice,
    purchasePrice: input.askingPrice,
    selectedVariant: variant,
    strategyProfile,
  });
}

function ResultButton({
  artwork,
  condition,
  group,
  highlighted,
  selected,
  onSelect,
}: {
  artwork?: CardImageUrls;
  condition: PricingCondition;
  group: ArtworkSearchGroup;
  highlighted: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  const match = group.variants[0];
  const price = selectedPrice(match, condition);
  const reference = bestReference(price);
  return (
    <button
      type="button"
      onClick={onSelect}
      data-vendor-result-group={group.id}
      className={`min-h-14 w-full rounded-lg border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
        selected ? "border-cyan-400 bg-cyan-950/70" : highlighted ? "border-zinc-500 bg-zinc-800" : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
      }`}
    >
      <span className="flex items-center gap-3">
        <CardThumbnail
          alt={`${group.name}, ${group.setName}`}
          assetKey={group.id}
          candidates={thumbnailCandidates(match, artwork)}
          className="w-12"
          selected={selected}
        />
        <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">{group.name}</span>
              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">{gameLabel(group.categoryId)}</span>
            </span>
            <span className="mt-1 block truncate text-xs text-zinc-400">
              {group.setName}{group.collectorNumber ? ` · #${group.collectorNumber}` : ""} · {group.variants.length === 1 ? match.variant : `${group.variants.length} finishes`}
            </span>
          </span>
          <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-cyan-200">{money(reference.cents)}</span>
        </span>
      </span>
    </button>
  );
}

export default function SnapshotVendorWorkspace() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<UnifiedPricingSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [condition, setCondition] = useState<PricingCondition>("LIGHTLY_PLAYED");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [askingPrice, setAskingPrice] = useState("");
  const [businessProfileId, setBusinessProfileId] = useState("convention-buying");
  const [strategyId, setStrategyId] = useState(defaultStrategyId);
  const [artwork, setArtwork] = useState<Record<string, CardImageUrls>>({});
  const requestNumber = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++requestNumber.current;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetch(`/api/pricing/search?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const body = await result.json() as UnifiedPricingSearchResponse & { error?: string };
        if (!result.ok) throw new Error(body.error ?? "Catalogue search failed.");
        if (current === requestNumber.current) setResponse(body);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        if (current === requestNumber.current) setError(caught instanceof Error ? caught.message : "Catalogue search failed.");
      } finally {
        if (current === requestNumber.current) setLoading(false);
      }
    }, query.trim().length >= pricingLookupConfig.minimumQueryLength ? 180 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const normalizedQuery = query.trim();
    const categories = [...new Set((response?.singles ?? []).map((match) => match.categoryId))].sort();
    if (!categories.length || normalizedQuery.length < pricingLookupConfig.minimumQueryLength) {
      return () => controller.abort();
    }
    const timer = window.setTimeout(async () => {
      try {
        const responses = await Promise.all(categories.map(async (categoryId) => {
          const result = await fetch(`/api/pricing/artwork?category=${encodeURIComponent(categoryId)}&q=${encodeURIComponent(normalizedQuery)}`, { signal: controller.signal });
          if (!result.ok) return {};
          const body = await result.json() as { artwork?: Record<string, CardImageUrls> };
          return body.artwork ?? {};
        }));
        setArtwork(Object.assign({}, ...responses));
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      }
    }, 420);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query, response]);

  const groups = useMemo(() => groupSearchMatchesByArtwork([...(response?.singles ?? []), ...(response?.sealed ?? [])]).slice(0, pricingLookupConfig.resultLimit), [response]);
  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const selectedMatch = selectedGroup?.variants.find((match) => match.sku === selectedSku) ?? selectedGroup?.variants[0] ?? null;
  const price = selectedMatch ? selectedPrice(selectedMatch, condition) : null;
  const reference = bestReference(price);
  const movement = selectedMatch && price ? movementFor(selectedMatch, price.marketPriceCents, price) : null;
  const nearest = selectedMatch?.productType === "SINGLE" && !price ? nearestPricedCondition(selectedMatch.prices, condition) : null;
  const numericAskingPrice = Number(askingPrice);
  const evaluation = selectedMatch && price && Number.isFinite(numericAskingPrice)
    ? createSnapshotPurchaseEvaluation({ match: selectedMatch, condition, price, askingPrice: numericAskingPrice, businessProfileId, strategyId })
    : null;

  function resetSelection() {
    setSelectedGroupId(null);
    setSelectedSku(null);
    setAskingPrice("");
  }

  function selectResult(group: ArtworkSearchGroup) {
    setSelectedGroupId(group.id);
    setSelectedSku(group.variants[0].sku);
    setAskingPrice("");
  }

  function selectVariant(sku: string) {
    setSelectedSku(sku);
    setAskingPrice("");
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (groups.length) setHighlightedIndex((current) => (current + (event.key === "ArrowDown" ? 1 : -1) + groups.length) % groups.length);
    } else if (event.key === "Enter" && groups[highlightedIndex]) {
      event.preventDefault();
      selectResult(groups[highlightedIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (selectedSku) resetSelection();
      else setQuery("");
    }
  }

  const selectedFreshness = response?.categories.find((category) => category.categoryId === selectedMatch?.categoryId);
  const loadedCategoryCount = response?.categories.filter((category) => category.loaded).length ?? 0;
  const failedCategoryCount = response?.categories.filter((category) => category.lastError).length ?? 0;
  const freshnessTone = failedCategoryCount
    ? "border-red-900 bg-red-950/40 text-red-200"
    : response?.categories.some((category) => category.loaded && category.stale)
      ? "border-amber-900 bg-amber-950/40 text-amber-200"
      : loadedCategoryCount
        ? "border-emerald-900 bg-emerald-950/30 text-emerald-200"
        : "border-zinc-800 bg-zinc-900 text-zinc-300";

  return (
    <section aria-labelledby="vendor-workspace-heading" className="vendor-snapshot-workspace w-full max-w-[1680px]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Decide · Card-show station</p>
          <h1 id="vendor-workspace-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Vendor Workspace</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">Search the latest catalogue snapshot, evaluate the exact condition, and negotiate from one desktop workspace.</p>
        </div>
        <div aria-live="polite" className={`rounded-lg border px-3 py-2 text-xs ${freshnessTone}`}>
          {!loadedCategoryCount ? "No catalogue loaded · observer waiting for a verified update" : failedCategoryCount ? `${failedCategoryCount} import issue${failedCategoryCount === 1 ? "" : "s"} · last-good data retained` : `${loadedCategoryCount} catalogues current · search routes automatically`}
        </div>
      </header>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
        <label className="text-xs font-medium text-zinc-300">Search every catalogue
          <input autoFocus type="search" value={query} onChange={(event) => { setQuery(event.target.value); setArtwork({}); resetSelection(); setHighlightedIndex(0); }} onKeyDown={handleSearchKeyDown} placeholder="Card, set, collector number, sealed product..." className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300" />
        </label>
        <p className="mt-2 text-xs text-zinc-500">Phronesis searches every loaded game and identifies the catalogue on each result.</p>
      </div>

      {error ? <p role="alert" className="mt-3 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">{error} Last-good snapshot data remains unchanged.</p> : null}

      <div className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(230px,0.8fr)_minmax(280px,1fr)_minmax(300px,0.95fr)]">
        <section aria-labelledby="catalogue-results-heading" className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 xl:max-h-[calc(100vh-14rem)] xl:overflow-y-auto">
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <h2 id="catalogue-results-heading" className="text-sm font-semibold text-white">Catalogue results</h2>
            <span className="text-xs text-zinc-500">{loading ? "Searching…" : `${groups.length} artworks shown`}</span>
          </div>
          {query.trim().length < pricingLookupConfig.minimumQueryLength ? <p className="rounded-lg border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">Type at least two characters. Use ↑ ↓ and Enter for fast selection.</p> : !loadedCategoryCount ? <p className="rounded-lg border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">No catalogue has been imported yet. Phronesis will activate each one after a verified Pricing Update Tool download.</p> : groups.length === 0 && !loading ? <p className="rounded-lg border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">No matching product in the loaded catalogues.</p> : <ul className="space-y-2">{groups.map((group, index) => {
            const groupArtwork = group.variants.map((variant) => artwork[variant.sku]).find(Boolean);
            return <li key={group.id}><ResultButton artwork={groupArtwork} group={group} condition={condition} highlighted={index === highlightedIndex} selected={group.id === selectedGroupId} onSelect={() => selectResult(group)} /></li>;
          })}</ul>}
        </section>

        <section aria-labelledby="snapshot-evidence-heading" className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 id="snapshot-evidence-heading" className="text-sm font-semibold text-white">Snapshot evidence</h2>
          {!selectedMatch ? <p className="mt-4 rounded-lg border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">Select an exact catalogue result to inspect its condition-level evidence.</p> : <div className="mt-4">
            <div className="flex items-start gap-4">
              <CardThumbnail alt={`${selectedGroup?.name ?? selectedMatch.name}, ${selectedMatch.setName}`} assetKey={selectedGroup?.id ?? selectedMatch.sku} candidates={thumbnailCandidates(selectedMatch, selectedGroup?.variants.map((variant) => artwork[variant.sku]).find(Boolean))} className="w-16" selected />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{gameLabel(selectedMatch.categoryId)} · {selectedMatch.productType === "SEALED" ? "Sealed product" : "Single"}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{selectedGroup?.name ?? selectedMatch.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{selectedMatch.setName}{selectedMatch.collectorNumber ? ` · #${selectedMatch.collectorNumber}` : ""} · {selectedMatch.variant} · {selectedMatch.language}</p>
                <p className="mt-1 text-xs text-zinc-500">{selectedFreshness?.snapshotDate ? `Catalogue ${timestamp(selectedFreshness.snapshotDate)}` : "Catalogue freshness unavailable"}</p>
              </div>
            </div>

            {selectedMatch.productType === "SINGLE" ? <label className="mt-5 block text-xs font-medium text-zinc-400">Finish<select aria-label="Finish" value={selectedMatch.sku} onChange={(event) => selectVariant(event.target.value)} disabled={(selectedGroup?.variants.length ?? 0) < 2} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-70">{selectedGroup?.variants.map((variant) => <option key={variant.sku} value={variant.sku}>{variant.variant}</option>)}</select></label> : null}

            {selectedMatch.productType === "SINGLE" ? <fieldset className="mt-5"><legend className="text-xs font-medium text-zinc-400">Condition</legend><div className="mt-2 grid grid-cols-5 gap-2">{conditionLadder.map((grade) => <button key={grade} type="button" aria-pressed={condition === grade} onClick={() => setCondition(grade)} className={`min-h-11 rounded-lg border px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 ${condition === grade ? "border-cyan-400 bg-cyan-400 text-zinc-950" : "border-zinc-700 bg-zinc-950 text-zinc-300"}`}>{conditionCodes[grade]}</button>)}</div><p className="mt-2 text-xs text-zinc-500">{conditionLabel(condition)}</p></fieldset> : <p className="mt-5 rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-300">Condition: Unopened</p>}

            {!price ? <div className="mt-5 rounded-lg border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-100"><p className="font-semibold">No price in this condition.</p>{nearest ? <p className="mt-1 text-amber-200">Nearest priced grade: {conditionLabel(nearest.condition)} · {money(bestReference(nearest.price).cents)}</p> : <p className="mt-1">No usable condition reference is present.</p>}</div> : <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Market price</p><p className="mt-1 text-xl font-semibold tabular-nums text-white">{money(price.marketPriceCents)}</p></div>
                <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Delivered low</p><p className="mt-1 text-xl font-semibold tabular-nums text-white">{money(price.deliveredPriceCents)}</p></div>
                <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Listing + shipping</p><p className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">{money(price.listingPriceCents)} + {money(price.shippingCents)}</p></div>
                <div className="rounded-lg bg-zinc-950 p-3"><p className="text-xs text-zinc-500">Evaluation reference</p><p className="mt-1 text-sm font-semibold text-cyan-200">{reference.label} · {money(reference.cents)}</p></div>
              </div>
              <div className="mt-4 border-t border-zinc-800 pt-4 text-sm text-zinc-400"><p>{movement ? `${movement.percentage >= 0 ? "Up" : "Down"} ${Math.abs(movement.percentage).toFixed(1)}% since ${timestamp(movement.comparisonDate)}` : "No earlier price change yet."}</p><p className="mt-1">Snapshot {timestamp(price.snapshotDate)} · Source SKU {price.sourceSku ?? "Unavailable"}</p></div>
            </>}
          </div>}
        </section>

        <section aria-labelledby="vendor-decision-heading" className="min-w-0 space-y-4 xl:sticky xl:top-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <h2 id="vendor-decision-heading" className="text-sm font-semibold text-white">Buying decision</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className="text-xs font-medium text-zinc-400">Business Profile<select value={businessProfileId} onChange={(event) => setBusinessProfileId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300">{defaultBusinessProfiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select></label>
              <label className="text-xs font-medium text-zinc-400">Buying Strategy<select value={strategyId} onChange={(event) => setStrategyId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300">{seedStrategies.map((strategy) => <option key={strategy.id} value={strategy.id}>{strategy.name}</option>)}</select></label>
            </div>
            <label className="mt-4 block text-sm font-medium text-zinc-300">Seller asking price (USD)<input type="number" inputMode="decimal" min="0" step="0.01" disabled={!selectedMatch || reference.cents === null} value={askingPrice} onChange={(event) => setAskingPrice(event.target.value)} placeholder="0.00" className="mt-2 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-xl font-semibold tabular-nums text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300" /></label>
            <p className="mt-2 text-xs text-zinc-500">The decision updates automatically from the existing Phronesis evaluation and offer engines.</p>
          </div>
          {evaluation ? <EvaluationSummary askingPrice={numericAskingPrice} evaluation={evaluation} /> : <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-500">{!selectedMatch ? "Select a catalogue result." : reference.cents === null ? "This selection has no usable market or delivered-low reference." : "Enter the seller's asking price to calculate the offer ladder and decision."}</div>}
        </section>
      </div>
    </section>
  );
}
