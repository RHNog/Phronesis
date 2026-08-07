"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import CardThumbnailPreview from "@/components/cards/CardThumbnailPreview";
import ProductArtworkCarousel from "@/components/cards/ProductArtworkCarousel";
import type {
  CardImageCandidate,
  CardImageUrls,
} from "@/components/cards/CardImageCache";
import { pricingLookupConfig } from "@/config/pricingLookup";
import {
  defaultStrategyId,
  seedStrategies,
  seedStrategyProfiles,
} from "@/data/seedStrategies";
import EvaluationSummary from "@/features/vendor/components/EvaluationSummary";
import ProviderPriceHistory from "@/features/vendor/components/ProviderPriceHistory";
import VendorCheckout from "@/features/vendor/components/VendorCheckout";
import RegionalMarketPanel from "@/features/vendor/components/RegionalMarketPanel";
import PriceChartingGradedArea from "@/features/vendor/components/PriceChartingGradedArea";
import {
  createSnapshotWatchlistEntry,
  watchlistEntryKey,
} from "@/features/watchlist/CreateWatchlistEntry";
import {
  removeServerWatchlistEntry,
  trackWatchlistEntry,
  watchlistApiErrorStatus,
} from "@/features/watchlist/WatchlistApi";
import type { WatchlistEntry } from "@/features/watchlist/WatchlistRefreshEngine";
import { defaultBusinessProfiles } from "@/lib/business/BusinessDefaults";
import {
  conditionLabel,
  groupSearchMatchesByArtwork,
  nearestPricedCondition,
} from "@/lib/pricing/domain";
import {
  MARKET_PROVIDER_IDS,
  type MarketProviderId,
} from "@/lib/market/providers";
import {
  evaluatePurchase,
  type PurchaseEvaluation,
} from "@/lib/engines/evaluation/evaluatePurchase";
import {
  conditionLadder,
  type ArtworkSearchGroup,
  type PriceState,
  type PricingCondition,
  type SearchMatch,
  type UnifiedPricingSearchResponse,
} from "@/lib/pricing/types";
import { tcgplayerVerificationUrl } from "@/lib/pricing/tcgplayerVerification";
import type { Card } from "@/types/card";
import type { CardConditionCode } from "@/types/conditionProfile";
import type { MarketPrice } from "@/types/marketPrice";
import type { PrintingVariant } from "@/types/printingVariant";

const pendingTrackStorageKey = "phronesis.pending-price-track.v1";

type ArtworkProvenance = {
  kind: "OWNER_APPROVED_REPRESENTATIVE" | "ASSISTED_REPRESENTATIVE" | "OWNER_APPROVED_PACKAGING_GALLERY";
  label: string;
  reviewedAt: string;
};

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
  return (
    pricingLookupConfig.categories.find(
      (category) => category.id === categoryId,
    )?.label ?? categoryId
  );
}

function regionalProviderLabel(
  categoryId: string,
): "LigaMagic" | "LigaPokémon" | null {
  if (categoryId === "magic-en") return "LigaMagic";
  if (categoryId === "pokemon-en") return "LigaPokémon";
  return null;
}

function regionalProviderId(
  categoryId: string,
): "ligamagic" | "ligapokemon" | null {
  if (categoryId === "magic-en") return "ligamagic";
  if (categoryId === "pokemon-en") return "ligapokemon";
  return null;
}

function money(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "Unavailable";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function timestamp(value: string | null | undefined): string {
  if (!value) return "Unavailable";
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: value.includes("T") ? "short" : undefined,
  }).format(parsed);
}

function selectedPrice(
  match: SearchMatch,
  condition: PricingCondition,
): PriceState | null {
  return match.productType === "SEALED"
    ? match.sealedPrice
    : (match.prices[condition] ?? null);
}

function bestReference(price: PriceState | null): {
  cents: number | null;
  label: string;
} {
  if (price?.directLowCents !== null && price?.directLowCents !== undefined) {
    return { cents: price.directLowCents, label: "TCG Direct Low" };
  }
  if (
    price?.marketPriceCents !== null &&
    price?.marketPriceCents !== undefined
  ) {
    return { cents: price.marketPriceCents, label: "TCG Market Price" };
  }
  if (
    price?.deliveredPriceCents !== null &&
    price?.deliveredPriceCents !== undefined
  ) {
    return {
      cents: price.deliveredPriceCents,
      label: "Delivered-low fallback",
    };
  }
  return { cents: null, label: "No usable reference" };
}

function thumbnailCandidates(
  match: SearchMatch,
  providerUrls?: CardImageUrls,
): CardImageCandidate[] {
  return [
    ...(match.imageUrl
      ? [{ source: "Repository" as const, urls: { normal: match.imageUrl } }]
      : []),
    ...(providerUrls
      ? [{ source: "Provider" as const, urls: providerUrls }]
      : []),
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
  const finish =
    input.match.productType === "SEALED" ? "Sealed" : input.match.variant;
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
    tcgplayerId:
      input.price.sourceSku && /^\d+$/.test(input.price.sourceSku)
        ? Number(input.price.sourceSku)
        : undefined,
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
    priceType:
      input.price.directLowCents !== null && input.price.directLowCents !== undefined
        ? "lowest_known"
        : input.price.marketPriceCents !== null
        ? "market_estimate"
        : "lowest_known",
    updatedAt: input.price.snapshotDate,
    confidence: 85,
    condition: input.match.productType === "SEALED" ? "NM" : conditionCodes[input.condition],
    conditionSpecific: true,
  };
  const businessProfile =
    defaultBusinessProfiles.find(
      (profile) => profile.id === input.businessProfileId,
    ) ?? defaultBusinessProfiles[0];
  const strategy =
    seedStrategies.find((candidate) => candidate.id === input.strategyId) ??
    seedStrategies[0];
  const strategyProfile =
    seedStrategyProfiles.find((profile) => profile.id === strategy.profileId) ??
    seedStrategyProfiles[0];
  return evaluatePurchase({
    businessProfile,
    card,
    condition:
      input.match.productType === "SEALED"
        ? "NM"
        : conditionCodes[input.condition],
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
  showReference,
  selected,
  onSelect,
}: {
  artwork?: CardImageUrls;
  condition: PricingCondition;
  group: ArtworkSearchGroup;
  highlighted: boolean;
  showReference: boolean;
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
        selected
          ? "border-cyan-400 bg-cyan-950/70"
          : highlighted
            ? "border-zinc-500 bg-zinc-800"
            : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
      }`}
    >
      <span className="flex items-center gap-3">
        <CardThumbnailPreview
          alt={`${group.name}, ${group.setName}`}
          assetKey={group.id}
          candidates={thumbnailCandidates(match, artwork)}
          className="w-12"
          selected={selected}
        />
        <span className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-white">
                {group.name}
              </span>
              <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-300">
                {gameLabel(group.categoryId)}
              </span>
            </span>
            <span className="mt-1 block truncate text-xs text-zinc-400">
              {group.setName}
              {group.collectorNumber
                ? ` · #${group.collectorNumber}`
                : ""} ·{" "}
              {group.variants.length === 1
                ? match.variant
                : `${group.variants.length} finishes`}
            </span>
          </span>
          <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-cyan-200">
            {showReference ? money(reference.cents) : "Select"}
          </span>
        </span>
      </span>
    </button>
  );
}

export default function SnapshotVendorWorkspace({
  canOperate,
  enabledProviderIds = MARKET_PROVIDER_IDS,
}: {
  canOperate: boolean;
  enabledProviderIds?: readonly MarketProviderId[];
}) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<UnifiedPricingSearchResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [condition, setCondition] =
    useState<PricingCondition>("LIGHTLY_PLAYED");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [askingPrice, setAskingPrice] = useState("");
  const [businessProfileId, setBusinessProfileId] =
    useState("convention-buying");
  const [strategyId, setStrategyId] = useState(defaultStrategyId);
  const [artwork, setArtwork] = useState<Record<string, CardImageUrls>>({});
  const [artworkGalleries, setArtworkGalleries] = useState<Record<string, CardImageUrls[]>>({});
  const [artworkProvenance, setArtworkProvenance] = useState<Record<string, ArtworkProvenance>>({});
  const [artworkUploadMessage, setArtworkUploadMessage] = useState<
    string | null
  >(null);
  const [tracking, setTracking] = useState<{
    created: boolean;
    entryId?: string;
    key?: string;
    message?: string;
    pending: boolean;
  }>({ created: false, pending: false });
  const requestNumber = useRef(0);

  useEffect(() => {
    const pending = window.sessionStorage.getItem(pendingTrackStorageKey);
    if (!pending) return;
    let entry: WatchlistEntry;
    try {
      entry = JSON.parse(pending) as WatchlistEntry;
    } catch {
      window.sessionStorage.removeItem(pendingTrackStorageKey);
      return;
    }
    setTracking({
      created: false,
      key: entry.id,
      pending: true,
      message: "Resuming price tracking…",
    });
    void trackWatchlistEntry(entry)
      .then((result) => {
        window.sessionStorage.removeItem(pendingTrackStorageKey);
        setTracking({
          created: result.created,
          entryId: result.entry.id,
          key: result.entry.id,
          message: result.created
            ? "Price tracking started."
            : "Already tracking this exact selection.",
          pending: false,
        });
      })
      .catch((caught) => {
        setTracking({
          created: false,
          key: entry.id,
          message:
            caught instanceof Error
              ? caught.message
              : "Price tracking could not resume.",
          pending: false,
        });
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const current = ++requestNumber.current;
    const timer = window.setTimeout(
      async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await fetch(
            `/api/pricing/search?q=${encodeURIComponent(query.trim())}`,
            { signal: controller.signal },
          );
          const body = (await result.json()) as UnifiedPricingSearchResponse & {
            error?: string;
          };
          if (!result.ok)
            throw new Error(body.error ?? "Catalogue search failed.");
          if (current === requestNumber.current) setResponse(body);
        } catch (caught) {
          if (caught instanceof DOMException && caught.name === "AbortError")
            return;
          if (current === requestNumber.current)
            setError(
              caught instanceof Error
                ? caught.message
                : "Catalogue search failed.",
            );
        } finally {
          if (current === requestNumber.current) setLoading(false);
        }
      },
      query.trim().length >= pricingLookupConfig.minimumQueryLength ? 180 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const normalizedQuery = query.trim();
    const categories = [
      ...new Set([...(response?.singles ?? []), ...(response?.sealed ?? [])].map((match) => match.categoryId)),
    ].sort();
    if (
      !categories.length ||
      normalizedQuery.length < pricingLookupConfig.minimumQueryLength
    ) {
      return () => controller.abort();
    }
    const timer = window.setTimeout(async () => {
      try {
        const responses = await Promise.all(
          categories.map(async (categoryId) => {
            const result = await fetch(
              `/api/pricing/artwork?category=${encodeURIComponent(categoryId)}&q=${encodeURIComponent(normalizedQuery)}`,
              { signal: controller.signal },
            );
            if (!result.ok) return { artwork: {}, galleries: {}, provenance: {} };
            const body = (await result.json()) as {
              artwork?: Record<string, CardImageUrls>;
              artworkGalleries?: Record<string, CardImageUrls[]>;
              artworkProvenance?: Record<string, ArtworkProvenance>;
            };
            return { artwork: body.artwork ?? {}, galleries: body.artworkGalleries ?? {}, provenance: body.artworkProvenance ?? {} };
          }),
        );
        setArtwork(Object.assign({}, ...responses.map((item) => item.artwork)));
        setArtworkGalleries(Object.assign({}, ...responses.map((item) => item.galleries)));
        setArtworkProvenance(Object.assign({}, ...responses.map((item) => item.provenance)));
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
      }
    }, 420);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, response]);

  const groups = useMemo(
    () =>
      groupSearchMatchesByArtwork([
        ...(response?.singles ?? []),
        ...(response?.sealed ?? []),
      ]).slice(0, pricingLookupConfig.resultLimit),
    [response],
  );
  const selectedGroup =
    groups.find((group) => group.id === selectedGroupId) ?? null;
  const selectedMatch =
    selectedGroup?.variants.find((match) => match.sku === selectedSku) ??
    selectedGroup?.variants[0] ??
    null;
  const selectedArtwork = selectedGroup?.variants
    .map((variant) => artwork[variant.sku])
    .find(Boolean);
  const selectedArtworkProvenance = selectedGroup?.variants
    .map((variant) => artworkProvenance[variant.sku])
    .find(Boolean);
  const selectedArtworkGallery = selectedMatch ? artworkGalleries[selectedMatch.sku] : undefined;
  const enabledProviders = useMemo(
    () => new Set(enabledProviderIds),
    [enabledProviderIds],
  );
  const tcgplayerEnabled = enabledProviders.has("tcgplayer");
  const priceChartingEnabled = enabledProviders.has("pricecharting");
  const selectedRegionalProviderId = selectedMatch
    ? regionalProviderId(selectedMatch.categoryId)
    : null;
  const regionalEnabled = selectedRegionalProviderId
    ? enabledProviders.has(selectedRegionalProviderId)
    : false;
  const rawHistoryProviderIds = useMemo(() => {
    const providerIds: MarketProviderId[] = [];
    if (tcgplayerEnabled) providerIds.push("tcgplayer");
    if (selectedRegionalProviderId && regionalEnabled) {
      providerIds.push(selectedRegionalProviderId);
    }
    return providerIds;
  }, [regionalEnabled, selectedRegionalProviderId, tcgplayerEnabled]);
  const cataloguePrice = selectedMatch
    ? selectedPrice(selectedMatch, condition)
    : null;
  const price = tcgplayerEnabled ? cataloguePrice : null;
  const reference = bestReference(price);
  const nearest =
    tcgplayerEnabled && selectedMatch?.productType === "SINGLE" && !price
      ? nearestPricedCondition(selectedMatch.prices, condition)
      : null;
  const marketProviderHeading = (() => {
    const regionalLabel = selectedMatch
      ? regionalProviderLabel(selectedMatch.categoryId)
      : null;
    if (tcgplayerEnabled && regionalEnabled && regionalLabel) {
      return `TCGplayer + ${regionalLabel} pricing`;
    }
    if (tcgplayerEnabled) return "TCGplayer pricing";
    if (regionalEnabled && regionalLabel) return `${regionalLabel} pricing`;
    return "Market providers hidden";
  })();
  const numericAskingPrice = Number(askingPrice);
  const offerEvaluation =
    selectedMatch && price && reference.cents !== null
      ? createSnapshotPurchaseEvaluation({
          match: selectedMatch,
          condition,
          price,
          askingPrice: reference.cents / 100,
          businessProfileId,
          strategyId,
        })
      : null;
  const evaluation =
    selectedMatch &&
    price &&
    askingPrice.trim() !== "" &&
    Number.isFinite(numericAskingPrice)
      ? createSnapshotPurchaseEvaluation({
          match: selectedMatch,
          condition,
          price,
          askingPrice: numericAskingPrice,
          businessProfileId,
          strategyId,
        })
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

  async function handleTrackPrice() {
    if (!selectedMatch) return;
    const entry = createSnapshotWatchlistEntry({
      artwork: selectedArtwork,
      condition,
      match: selectedMatch,
      price,
    });
    setTracking({
      created: false,
      key: entry.id,
      pending: true,
      message: "Starting price tracking…",
    });
    try {
      const result = await trackWatchlistEntry(entry);
      window.sessionStorage.removeItem(pendingTrackStorageKey);
      setTracking({
        created: result.created,
        entryId: result.entry.id,
        key: result.entry.id,
        message: result.created
          ? "Price tracking started."
          : "Already tracking this exact selection.",
        pending: false,
      });
    } catch (caught) {
      if (watchlistApiErrorStatus(caught) === 401) {
        window.sessionStorage.setItem(
          pendingTrackStorageKey,
          JSON.stringify(entry),
        );
        window.location.assign("/sign-in?callbackUrl=%2Fvendor");
        return;
      }
      setTracking({
        created: false,
        key: entry.id,
        message:
          watchlistApiErrorStatus(caught) === 403
            ? "Market Watch access is required to track this selection."
            : caught instanceof Error
              ? caught.message
              : "Price tracking could not start.",
        pending: false,
      });
    }
  }

  async function handleUndoTrack() {
    if (!tracking.created || !tracking.entryId) return;
    setTracking((current) => ({
      ...current,
      pending: true,
      message: "Removing the new watch…",
    }));
    try {
      await removeServerWatchlistEntry(tracking.entryId);
      setTracking({
        created: false,
        key: tracking.key,
        message: "Price tracking undone.",
        pending: false,
      });
    } catch (caught) {
      setTracking((current) => ({
        ...current,
        message:
          caught instanceof Error
            ? caught.message
            : "The new watch could not be removed.",
        pending: false,
      }));
    }
  }

  async function handleCuratedArtwork(file: File) {
    if (!selectedMatch) return;
    setArtworkUploadMessage("Storing exact product image…");
    const form = new FormData();
    form.set("category", selectedMatch.categoryId);
    form.set("sku", selectedMatch.sku);
    form.set("file", file);
    try {
      const response = await fetch("/api/pricing/artwork/curated", {
        method: "POST",
        body: form,
      });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        url?: string;
      };
      if (!response.ok || !body.url)
        throw new Error(body.error ?? "Product image could not be stored.");
      setArtwork((current) => ({
        ...current,
        [selectedMatch.sku]: { normal: body.url },
      }));
      setArtworkUploadMessage("Exact product image stored locally.");
    } catch (error) {
      setArtworkUploadMessage(
        error instanceof Error
          ? error.message
          : "Product image could not be stored.",
      );
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (groups.length)
        setHighlightedIndex(
          (current) =>
            (current + (event.key === "ArrowDown" ? 1 : -1) + groups.length) %
            groups.length,
        );
    } else if (event.key === "Enter" && groups[highlightedIndex]) {
      event.preventDefault();
      selectResult(groups[highlightedIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (selectedSku) resetSelection();
      else setQuery("");
    }
  }

  const selectedFreshness = response?.categories.find(
    (category) => category.categoryId === selectedMatch?.categoryId,
  );
  const loadedCategoryCount =
    response?.categories.filter((category) => category.loaded).length ?? 0;
  const failedCategoryCount =
    response?.categories.filter((category) => category.lastError).length ?? 0;
  const freshnessTone = failedCategoryCount
    ? "border-red-900 bg-red-950/40 text-red-200"
    : response?.categories.some((category) => category.loaded && category.stale)
      ? "border-amber-900 bg-amber-950/40 text-amber-200"
      : loadedCategoryCount
        ? "border-emerald-900 bg-emerald-950/30 text-emerald-200"
        : "border-zinc-800 bg-zinc-900 text-zinc-300";

  return (
    <section
      aria-labelledby="vendor-workspace-heading"
      className="vendor-snapshot-workspace w-full max-w-[1680px]"
    >
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Decide · Card-show station
          </p>
          <h1
            id="vendor-workspace-heading"
            className="mt-2 text-3xl font-semibold tracking-tight text-white"
          >
            Vendor Workspace
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Search the latest catalogue snapshot, evaluate the exact condition,
            and negotiate from one desktop workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/vendor/scanner" className="inline-flex min-h-11 items-center rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-200 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300">Scanner intake</Link>
          <div
            aria-live="polite"
            className={`rounded-lg border px-3 py-2 text-xs ${freshnessTone}`}
          >
            {!loadedCategoryCount
              ? "No catalogue loaded · observer waiting for a verified update"
              : failedCategoryCount
                ? `${failedCategoryCount} import issue${failedCategoryCount === 1 ? "" : "s"} · last-good data retained`
                : `${loadedCategoryCount} catalogues current · search routes automatically`}
          </div>
        </div>
      </header>

      {!selectedMatch ? <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
        <label className="text-xs font-medium text-zinc-300">
          Search every catalogue
          <input
            autoFocus
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setArtwork({});
              resetSelection();
              setHighlightedIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Card, set, collector number, sealed product..."
            className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-base text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300"
          />
        </label>
        <p className="mt-2 text-xs text-zinc-500">
          Phronesis searches every loaded game and identifies the catalogue on
          each result.
        </p>
        {response?.interpretations?.length ? (
          <p role="status" className="mt-2 text-xs font-medium text-cyan-300">
            {response.interpretations.map((item) => item.message).join(" · ")}
          </p>
        ) : null}
      </div> : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-3">
          <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300">Selection locked for evaluation</p><p className="truncate text-sm text-zinc-200">{selectedGroup?.name ?? selectedMatch.name} · {selectedMatch.setName}{selectedMatch.collectorNumber ? ` · #${selectedMatch.collectorNumber}` : ""}</p></div>
          <button type="button" onClick={resetSelection} className="min-h-11 rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-200 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300">Search another card</button>
        </div>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200"
        >
          {error} Last-good snapshot data remains unchanged.
        </p>
      ) : null}

      <div
        data-vendor-primary-workflow
        className="mt-5 grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(360px,0.85fr)_minmax(520px,1.15fr)]"
      >
        {!selectedMatch ? <section
          aria-labelledby="catalogue-results-heading"
          className="order-1 min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 xl:max-h-[calc(100vh-14rem)] xl:overflow-y-auto"
        >
          <div className="flex items-center justify-between gap-3 px-1 pb-3">
            <h2
              id="catalogue-results-heading"
              className="text-sm font-semibold text-white"
            >
              Catalogue results
            </h2>
            <span className="text-xs text-zinc-500">
              {loading ? "Searching…" : `${groups.length} artworks shown`}
            </span>
          </div>
          {query.trim().length < pricingLookupConfig.minimumQueryLength ? (
            <p className="rounded-lg border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">
              Type at least two characters. Use ↑ ↓ and Enter for fast
              selection.
            </p>
          ) : !loadedCategoryCount ? (
            <p className="rounded-lg border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">
              No catalogue has been imported yet. Phronesis will activate each
              one after a verified Pricing Update Tool download.
            </p>
          ) : groups.length === 0 && !loading ? (
            <p className="rounded-lg border border-dashed border-zinc-800 p-5 text-sm text-zinc-500">
              No matching product in the loaded catalogues.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((group, index) => {
                const groupArtwork = group.variants
                  .map((variant) => artwork[variant.sku])
                  .find(Boolean);
                return (
                  <li key={group.id}>
                    <ResultButton
                      artwork={groupArtwork}
                      group={group}
                      condition={condition}
                      highlighted={index === highlightedIndex}
                      showReference={tcgplayerEnabled}
                      selected={group.id === selectedGroupId}
                      onSelect={() => selectResult(group)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </section> : null}

        <div data-vendor-event-operations className="order-2 min-w-0">
          <VendorCheckout
            canOperate={canOperate}
            condition={condition}
            marketReferenceCents={reference.cents}
            match={selectedMatch}
            price={price}
            offer={
              offerEvaluation?.status === "READY"
                ? {
                    recommendedOffer: offerEvaluation.recommendedOffer,
                    openingOffer:
                      offerEvaluation.negotiationLadder.openingOffer,
                    targetOffer: offerEvaluation.negotiationLadder.targetOffer,
                    maximumBuyPrice:
                      offerEvaluation.negotiationLadder.maximumBuyPrice,
                    tcgLowCents: price?.listingPriceCents ?? null,
                    tcgMarketCents: price?.marketPriceCents ?? null,
                    tcgDirectLowCents: price?.directLowCents ?? null,
                  }
                : null
            }
          />
        </div>
        <section
          aria-labelledby="snapshot-evidence-heading"
          className={`${selectedMatch ? "order-1" : "order-3 xl:col-span-1"} min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4`}
        >
          <h2
            id="snapshot-evidence-heading"
            className="text-sm font-semibold text-white"
          >
            Snapshot evidence
          </h2>
          {!selectedMatch ? (
            <p className="mt-4 rounded-lg border border-dashed border-zinc-700 p-8 text-center text-sm text-zinc-500">
              Select an exact catalogue result to inspect its condition-level
              evidence.
            </p>
          ) : (
            <div className="mt-4">
              <div className="flex items-start gap-4">
                <ProductArtworkCarousel
                  alt={`${selectedGroup?.name ?? selectedMatch.name}, ${selectedMatch.setName}`}
                  assetKey={selectedGroup?.id ?? selectedMatch.sku}
                  fallbackCandidates={thumbnailCandidates(
                    selectedMatch,
                    selectedArtwork,
                  )}
                  images={selectedArtworkGallery}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                    {gameLabel(selectedMatch.categoryId)} ·{" "}
                    {selectedMatch.productType === "SEALED"
                      ? "Sealed product"
                      : "Single"}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    {selectedGroup?.name ?? selectedMatch.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {selectedMatch.setName}
                    {selectedMatch.collectorNumber
                      ? ` · #${selectedMatch.collectorNumber}`
                      : ""}{" "}
                    · {selectedMatch.variant} · {selectedMatch.language}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedFreshness?.snapshotDate
                      ? `Catalogue ${timestamp(selectedFreshness.snapshotDate)}`
                      : "Catalogue freshness unavailable"}
                  </p>
                  {selectedArtworkProvenance ? (
                    <p className="mt-2 inline-flex rounded-full border border-amber-700 bg-amber-950/30 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                      {selectedArtworkProvenance.label}{selectedArtworkProvenance.kind === "OWNER_APPROVED_PACKAGING_GALLERY" ? ` · ${selectedArtworkGallery?.length ?? 0} verified package images` : " · packaging may vary"}
                    </p>
                  ) : null}
                  <a
                    aria-label={`Verify ${selectedGroup?.name ?? selectedMatch.name} on TCGplayer (opens in a new tab)`}
                    className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-cyan-700 bg-cyan-950/40 px-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400 hover:bg-cyan-950/70 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    href={tcgplayerVerificationUrl(selectedMatch)}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Verify on TCGplayer
                    <span aria-hidden="true" className="ml-2">
                      ↗
                    </span>
                  </a>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    External manual cross-check; your Phronesis selection stays
                    unchanged.
                  </p>
                </div>
              </div>

              {selectedMatch.productType === "SINGLE" ? (
                <label className="mt-5 block text-xs font-medium text-zinc-400">
                  Finish
                  <select
                    aria-label="Finish"
                    value={selectedMatch.sku}
                    onChange={(event) => selectVariant(event.target.value)}
                    disabled={(selectedGroup?.variants.length ?? 0) < 2}
                    className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-70"
                  >
                    {selectedGroup?.variants.map((variant) => (
                      <option key={variant.sku} value={variant.sku}>
                        {variant.variant}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {selectedMatch.productType === "SINGLE" ? (
                <fieldset className="mt-5">
                  <legend className="text-xs font-medium text-zinc-400">
                    Condition
                  </legend>
                  <div className="mt-2 grid grid-cols-5 gap-2">
                    {conditionLadder.map((grade) => (
                      <button
                        key={grade}
                        type="button"
                        aria-pressed={condition === grade}
                        onClick={() => setCondition(grade)}
                        className={`min-h-11 rounded-lg border px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 ${condition === grade ? "border-cyan-400 bg-cyan-400 text-zinc-950" : "border-zinc-700 bg-zinc-950 text-zinc-300"}`}
                      >
                        {conditionCodes[grade]}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">
                    {conditionLabel(condition)}
                  </p>
                </fieldset>
              ) : (
                <p className="mt-5 rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm text-zinc-300">
                  Condition: Unopened
                </p>
              )}

              <section
                data-combined-pricing-card
                aria-labelledby="combined-pricing-heading"
                className="mt-5 rounded-xl border border-zinc-700 bg-zinc-900/70 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                      Raw-card market evidence
                    </p>
                    <h3
                      id="combined-pricing-heading"
                      className="mt-1 text-base font-semibold text-white"
                    >
                      {marketProviderHeading}
                    </h3>
                  </div>
                  <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2.5 py-1 text-[11px] text-zinc-400">
                    {selectedMatch.productType === "SINGLE"
                      ? `${conditionCodes[condition]} · exact printing`
                      : "Unopened product"}
                  </span>
                </div>

                {!tcgplayerEnabled ? (
                  <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">
                    <p className="font-semibold text-zinc-200">
                      TCGplayer evidence is hidden.
                    </p>
                    <p className="mt-1">
                      Re-enable this provider in{" "}
                      <Link
                        href="/user-settings"
                        className="font-semibold text-cyan-300 hover:text-cyan-200"
                      >
                        My settings
                      </Link>
                      .
                    </p>
                  </div>
                ) : !price ? (
                  <div className="mt-4 rounded-lg border border-amber-900 bg-amber-950/30 p-4 text-sm text-amber-100">
                    <p className="font-semibold">No price in this condition.</p>
                    {nearest ? (
                      <p className="mt-1 text-amber-200">
                        Nearest priced grade: {conditionLabel(nearest.condition)}{" "}
                        · {money(bestReference(nearest.price).cents)}
                      </p>
                    ) : (
                      <p className="mt-1">
                        No usable condition reference is present.
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {price.directLowCents !== null &&
                      price.directLowCents !== undefined ? (
                        <div className="rounded-lg border border-emerald-400/60 bg-emerald-950/40 p-3 sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                            Primary reference · TCG Direct Low
                          </p>
                          <p className="mt-1 text-3xl font-semibold tabular-nums text-emerald-200">
                            {money(price.directLowCents)}
                          </p>
                          <p className="mt-1 text-xs text-emerald-100/70">
                            Direct-qualified listing floor; takes precedence in
                            the offer calculation.
                          </p>
                        </div>
                      ) : null}
                      <div className="rounded-lg bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-500">Market price</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-white">
                          {money(price.marketPriceCents)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-500">Delivered low</p>
                        <p className="mt-1 text-xl font-semibold tabular-nums text-white">
                          {money(price.deliveredPriceCents)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-500">
                          Listing + shipping
                        </p>
                        <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-200">
                          {money(price.listingPriceCents)} +{" "}
                          {money(price.shippingCents)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-500">
                          Evaluation reference
                        </p>
                        <p className="mt-1 text-sm font-semibold text-cyan-200">
                          {reference.label} · {money(reference.cents)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 border-t border-zinc-800 pt-4 text-sm text-zinc-400">
                      <p>
                        Snapshot {timestamp(price.snapshotDate)} · Source SKU{" "}
                        {price.sourceSku ?? "Unavailable"}
                      </p>
                    </div>
                  </>
                )}

                {selectedMatch.productType === "SINGLE" &&
                regionalProviderLabel(selectedMatch.categoryId) &&
                regionalEnabled ? (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <RegionalMarketPanel
                      key={`${selectedMatch.categoryId}:${selectedMatch.sku}`}
                      categoryId={selectedMatch.categoryId}
                      sku={selectedMatch.sku}
                    />
                  </div>
                ) : null}

                {rawHistoryProviderIds.length > 0 ? (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <ProviderPriceHistory
                      key={`${selectedMatch.categoryId}:${selectedMatch.sku}:${condition}`}
                      categoryId={selectedMatch.categoryId}
                      sku={selectedMatch.sku}
                      condition={condition}
                      enabledProviderIds={rawHistoryProviderIds}
                      providerFilter={rawHistoryProviderIds}
                    />
                  </div>
                ) : null}

                {tcgplayerEnabled ? (
                  <div className="mt-5 rounded-lg border border-cyan-950 bg-cyan-950/20 p-3">
                  <button
                    type="button"
                    aria-busy={
                      tracking.pending &&
                      tracking.key ===
                        watchlistEntryKey(selectedMatch, condition)
                    }
                    disabled={
                      (tracking.pending || Boolean(tracking.entryId)) &&
                      tracking.key ===
                        watchlistEntryKey(selectedMatch, condition)
                    }
                    onClick={handleTrackPrice}
                    className="min-h-11 w-full rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:cursor-wait disabled:opacity-70"
                  >
                    {tracking.pending &&
                    tracking.key ===
                      watchlistEntryKey(selectedMatch, condition)
                      ? "Tracking…"
                      : tracking.entryId ===
                          watchlistEntryKey(selectedMatch, condition)
                        ? "Tracking price"
                        : "Track price"}
                  </button>
                  {tracking.key ===
                    watchlistEntryKey(selectedMatch, condition) &&
                  tracking.message ? (
                    <div
                      aria-live="polite"
                      className="mt-2 flex min-h-6 items-center justify-between gap-3 text-xs text-cyan-100"
                    >
                      <span>{tracking.message}</span>
                      {tracking.created ? (
                        <button
                          type="button"
                          onClick={handleUndoTrack}
                          disabled={tracking.pending}
                          className="min-h-11 shrink-0 px-2 font-semibold text-cyan-300 hover:text-cyan-200 disabled:opacity-60"
                        >
                          Undo
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">
                      Adds this exact finish and condition to your default
                      Market Watch list. Target and alerts stay optional.
                    </p>
                  )}
                  </div>
                ) : null}
              </section>

              {selectedMatch.productType === "SINGLE" &&
              priceChartingEnabled ? (
                <PriceChartingGradedArea
                  key={`${selectedMatch.categoryId}:${selectedMatch.sku}`}
                  match={selectedMatch}
                />
              ) : null}
              {!selectedArtwork && !selectedMatch.imageUrl ? (
                <div className="mt-3 rounded-lg border border-dashed border-zinc-700 p-3">
                  <label className="block text-xs font-medium text-zinc-300">
                    Owner image override
                    <input
                      type="file"
                      accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleCuratedArtwork(file);
                        event.currentTarget.value = "";
                      }}
                      className="mt-2 block min-h-11 w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-200"
                    />
                  </label>
                  <p className="mt-2 text-xs text-zinc-500">
                    Stores one validated local image against this exact
                    catalogue SKU. Administration permission is required.
                  </p>
                  {artworkUploadMessage ? (
                    <p role="status" className="mt-2 text-xs text-cyan-200">
                      {artworkUploadMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section
          aria-labelledby="vendor-decision-heading"
          className="order-4 min-w-0 space-y-4 xl:col-span-2"
        >
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <h2
              id="vendor-decision-heading"
              className="text-sm font-semibold text-white"
            >
              Buying decision
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <label className="text-xs font-medium text-zinc-400">
                Business Profile
                <select
                  value={businessProfileId}
                  onChange={(event) => setBusinessProfileId(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  {defaultBusinessProfiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-medium text-zinc-400">
                Buying Strategy
                <select
                  value={strategyId}
                  onChange={(event) => setStrategyId(event.target.value)}
                  className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                >
                  {seedStrategies.map((strategy) => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium text-zinc-300">
              Seller asking price (USD) · optional comparison
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                disabled={!selectedMatch || reference.cents === null}
                value={askingPrice}
                onChange={(event) => setAskingPrice(event.target.value)}
                placeholder="0.00"
                className="mt-2 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 text-xl font-semibold tabular-nums text-white outline-none disabled:cursor-not-allowed disabled:opacity-50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300"
              />
            </label>
            <p className="mt-2 text-xs text-zinc-500">
              The offer is available immediately. Add the seller&apos;s ask to
              calculate BUY, NEGOTIATE, or PASS.
            </p>
          </div>
          {evaluation ? (
            <EvaluationSummary
              askingPrice={numericAskingPrice}
              evaluation={evaluation}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-500">
              {!selectedMatch
                ? "Select a catalogue result."
                : reference.cents === null
                  ? "This selection has no usable market or delivered-low reference."
                  : "The offer ladder is ready above. Enter the seller's asking price for a decision comparison."}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
