"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { pricingLookupConfig } from "@/config/pricingLookup";
import {
  askingPriceSpread,
  conditionLabel,
  movementFor,
  nearestPricedCondition,
} from "@/lib/pricing/domain";
import {
  conditionLadder,
  type PriceState,
  type PricingCondition,
  type PricingSearchResponse,
  type SearchMatch,
} from "@/lib/pricing/types";

const CONDITION_STORAGE_KEY = "phronesis.pricing-lookup.singles-condition.v1";
const CONDITION_CHANGE_EVENT = "phronesis:pricing-condition-change";
const KEYBOARD_TARGET_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function storedCondition(): PricingCondition {
  const stored = window.localStorage.getItem(CONDITION_STORAGE_KEY);
  return conditionLadder.includes(stored as PricingCondition)
    ? stored as PricingCondition
    : pricingLookupConfig.defaultCondition;
}

function subscribeToCondition(onStoreChange: () => void): () => void {
  function handleStorage(event: StorageEvent) {
    if (event.key === CONDITION_STORAGE_KEY) onStoreChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(CONDITION_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CONDITION_CHANGE_EVENT, onStoreChange);
  };
}

function persistCondition(condition: PricingCondition) {
  window.localStorage.setItem(CONDITION_STORAGE_KEY, condition);
  window.dispatchEvent(new Event(CONDITION_CHANGE_EVENT));
}

function browserZoomRequiresReflow(): boolean {
  if (typeof window === "undefined" || typeof window.screen === "undefined" || window.innerWidth <= 0) return false;
  return window.devicePixelRatio >= 1.5 && window.screen.width / window.innerWidth >= 1.5;
}

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function dateLabel(value: string): string {
  const parsed = new Date(value.includes("T") ? value : `${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: value.includes("T") ? "numeric" : undefined, minute: value.includes("T") ? "2-digit" : undefined, timeZone: "UTC" }).format(parsed);
}

function operateDisclosureWithSpace(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== " ") return;
  event.preventDefault();
  const details = event.currentTarget.parentElement;
  if (details instanceof HTMLDetailsElement) details.open = !details.open;
}

function visibleKeyboardTargets(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(KEYBOARD_TARGET_SELECTOR)).filter((target) => {
    const style = window.getComputedStyle(target);
    return style.display !== "none" && style.visibility !== "hidden" && target.getClientRects().length > 0;
  });
}

function PriceBlock({ price, sealed = false }: { price: PriceState | null | undefined; sealed?: boolean }) {
  if (!price || price.deliveredPriceCents === null) {
    return (
      <div className="mt-3">
        <p className="font-semibold text-amber-200">Delivered price unavailable</p>
        <p className="mt-1 text-sm text-zinc-400">
          {sealed && price?.shippingSource === "UNKNOWN" ? "Shipping unknown" : "Listing price unavailable"}
        </p>
      </div>
    );
  }
  return (
    <div className="mt-3">
      <p className="text-xl font-semibold tracking-tight text-white">{money(price.deliveredPriceCents)} delivered</p>
      <p className="mt-1 text-sm text-zinc-300">
        {price.listingPriceCents === null ? "Listing unavailable" : `${money(price.listingPriceCents)} listing`} + {price.shippingCents === null ? "shipping unknown" : `${money(price.shippingCents)}${price.shippingSource === "ASSUMED" ? " assumed shipping" : " shipping"}`}
      </p>
    </div>
  );
}

function History({ match, price }: { match: SearchMatch; price: PriceState | null | undefined }) {
  const movement = movementFor(match, price?.marketPriceCents ?? null, price);
  if (!movement) return <p className="mt-2 text-sm text-zinc-400">No history yet</p>;
  const direction = movement.percentage > 0 ? "Up" : movement.percentage < 0 ? "Down" : "Unchanged";
  return <p className="mt-2 text-sm text-zinc-300">{direction} {Math.abs(movement.percentage).toFixed(1)}% market price since {dateLabel(movement.comparisonDate)}</p>;
}

function resultAccessibilityLabel(match: SearchMatch, price: PriceState | null | undefined, condition?: PricingCondition): string {
  const identity = [match.setName, match.collectorNumber, match.variant].filter(Boolean).join(", ");
  const type = match.productType === "SEALED" ? "Sealed, no condition" : `Single, ${condition ? conditionLabel(condition) : "condition unavailable"}`;
  let priceSummary: string;
  if (match.productType === "SINGLE" && (!price || price.deliveredPriceCents === null)) {
    const nearest = condition ? nearestPricedCondition(match.prices, condition) : null;
    priceSummary = `No listing in this condition${nearest ? `. Nearest priced grade: ${conditionLabel(nearest.condition)}, ${money(nearest.price.deliveredPriceCents ?? 0)} delivered` : ""}`;
  } else if (!price || price.deliveredPriceCents === null) {
    priceSummary = `Delivered price unavailable. ${price?.shippingSource === "UNKNOWN" ? "Shipping unknown" : "Listing price unavailable"}`;
  } else {
    const listing = price.listingPriceCents === null ? "listing unavailable" : `${money(price.listingPriceCents)} listing`;
    const shipping = price.shippingCents === null
      ? "shipping unknown"
      : `${money(price.shippingCents)}${price.shippingSource === "ASSUMED" ? " assumed shipping" : " shipping"}`;
    priceSummary = `${money(price.deliveredPriceCents)} delivered. ${listing} plus ${shipping}`;
  }
  const movement = movementFor(match, price?.marketPriceCents ?? null, price);
  const history = movement
    ? `${movement.percentage > 0 ? "Up" : movement.percentage < 0 ? "Down" : "Unchanged"} ${Math.abs(movement.percentage).toFixed(1)} percent market price since ${dateLabel(movement.comparisonDate)}`
    : "No history yet";
  const snapshot = price ? `Snapshot ${dateLabel(price.snapshotDate)}` : "Snapshot unavailable";
  return `${type}. ${match.name}. ${identity}. ${priceSummary}. ${history}. ${snapshot}.`;
}

function AskingPrice({ referenceCents }: { referenceCents: number | null }) {
  const [value, setValue] = useState("");
  const askingCents = value && Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) : null;
  const spread = askingCents !== null && askingCents >= 0 && referenceCents !== null ? askingPriceSpread(askingCents, referenceCents) : null;
  return (
    <details className="mt-3 border-t border-zinc-800 pt-3">
      <summary onKeyDown={operateDisclosureWithSpace} className="min-h-11 cursor-pointer py-2 text-sm font-medium text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">Compare asking price</summary>
      {referenceCents === null ? (
        <p className="text-sm text-zinc-400">Comparison needs a valid delivered reference price.</p>
      ) : (
        <div className="mt-2">
          <label className="block text-sm text-zinc-300">Asking price (USD)
            <input inputMode="decimal" type="number" min="0" step="0.01" value={value} onChange={(event) => setValue(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300" />
          </label>
          {spread && <p className="mt-2 text-sm text-white">Asking price is {spread.mode === "PERCENTAGE" ? `${Math.abs(spread.percentage ?? 0).toFixed(1)}%` : money(Math.abs(spread.differenceCents))} {spread.differenceCents < 0 ? "below" : spread.differenceCents > 0 ? "above" : "equal to"} delivered reference.</p>}
        </div>
      )}
    </details>
  );
}

function ResultIdentity({ match }: { match: SearchMatch }) {
  return (
    <div
      data-pricing-result-identity
      data-pricing-result-sku={match.sku}
      data-pricing-result-product-type={match.productType}
      data-pricing-result-name={match.name}
      data-pricing-result-printing={[match.setName, match.collectorNumber, match.variant].filter(Boolean).join(" · ")}
    >
      <p data-pricing-product-type className="text-xs font-semibold uppercase tracking-wider text-cyan-300">{match.productType === "SEALED" ? "Sealed · no condition" : "Single"}</p>
      <h3 data-pricing-product-name className="mt-1 text-base font-semibold text-white">{match.name}</h3>
      <p data-pricing-printing-identity className="mt-1 text-sm text-zinc-400">{[match.setName, match.collectorNumber, match.variant].filter(Boolean).join(" · ")}</p>
    </div>
  );
}

function SingleResult({ match, condition }: { match: SearchMatch; condition: PricingCondition }) {
  const price = match.prices[condition];
  const nearest = !price?.deliveredPriceCents ? nearestPricedCondition(match.prices, condition) : null;
  return (
    <li aria-label={resultAccessibilityLabel(match, price, condition)} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
      <ResultIdentity match={match} />
      {price?.deliveredPriceCents !== null && price !== undefined ? <PriceBlock price={price} /> : (
        <div className="mt-3"><p className="font-semibold text-amber-200">No listing in this condition</p>{nearest && <p className="mt-1 text-sm text-zinc-400">Nearest priced grade: {conditionLabel(nearest.condition)} · {money(nearest.price.deliveredPriceCents ?? 0)} delivered</p>}</div>
      )}
      <History match={match} price={price} />
      {price && <p className="mt-1 text-xs text-zinc-400">Snapshot {dateLabel(price.snapshotDate)}</p>}
      <details className="mt-3 border-t border-zinc-800 pt-3">
        <summary onKeyDown={operateDisclosureWithSpace} className="min-h-11 cursor-pointer py-2 text-sm font-medium text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">View all conditions</summary>
        <dl className="mt-2 space-y-2 text-sm">{conditionLadder.map((grade) => <div key={grade} className="flex justify-between gap-3"><dt className="text-zinc-400">{conditionLabel(grade)}</dt><dd className="text-right text-zinc-100">{match.prices[grade]?.deliveredPriceCents !== null && match.prices[grade] ? `${money(match.prices[grade]!.deliveredPriceCents!)} delivered` : "No listing"}</dd></div>)}</dl>
      </details>
      <AskingPrice referenceCents={price?.deliveredPriceCents ?? null} />
    </li>
  );
}

function SealedResult({ match, previewHidden = false }: { match: SearchMatch; previewHidden?: boolean }) {
  return (
    <li aria-label={resultAccessibilityLabel(match, match.sealedPrice)} className={`${previewHidden ? "hidden md:block" : ""} rounded-xl border border-cyan-950 bg-zinc-900/80 p-4`}>
      <ResultIdentity match={match} />
      <PriceBlock price={match.sealedPrice} sealed />
      <History match={match} price={match.sealedPrice} />
      {match.sealedPrice && <p className="mt-1 text-xs text-zinc-400">Snapshot {dateLabel(match.sealedPrice.snapshotDate)}</p>}
      <AskingPrice referenceCents={match.sealedPrice?.deliveredPriceCents ?? null} />
    </li>
  );
}

type PricingLookupProps = {
  initialQuery?: string;
  initialResponse?: PricingSearchResponse | null;
  initialError?: string | null;
  initialLoading?: boolean;
  evidenceMode?: boolean;
  evidenceZoomReflow?: boolean;
};

export default function PricingLookup({
  initialQuery = "",
  initialResponse = null,
  initialError = null,
  initialLoading = false,
  evidenceMode = false,
  evidenceZoomReflow = false,
}: PricingLookupProps = {}) {
  const inputId = useId();
  const [categoryId, setCategoryId] = useState("pokemon-en");
  const [query, setQuery] = useState(initialQuery);
  const [response, setResponse] = useState<PricingSearchResponse | null>(initialResponse);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);
  const [retryToken, setRetryToken] = useState(0);
  const [showAllSealed, setShowAllSealed] = useState(false);
  const [zoomReflow, setZoomReflow] = useState(evidenceZoomReflow);
  const condition = useSyncExternalStore(
    subscribeToCondition,
    storedCondition,
    () => pricingLookupConfig.defaultCondition,
  );
  const requestNumber = useRef(0);
  const lookupRoot = useRef<HTMLElement>(null);

  useEffect(() => {
    // Runtime capture must not operate server-rendered controls before React has
    // attached their handlers. This DOM marker avoids another state update
    // during hydration and gives the serialized Worker an explicit readiness
    // boundary beyond the HTTP response.
    function updateZoomReflow() {
      const requiresReflow = browserZoomRequiresReflow();
      setZoomReflow(evidenceZoomReflow || requiresReflow);
      lookupRoot.current?.setAttribute("data-browser-zoom-reflow", requiresReflow ? "true" : "false");
    }

    updateZoomReflow();
    lookupRoot.current?.setAttribute("data-interactive-ready", "true");
    window.addEventListener("resize", updateZoomReflow);
    return () => window.removeEventListener("resize", updateZoomReflow);
  }, [evidenceZoomReflow]);

  useEffect(() => {
    // Some host/browser accessibility configurations expose native controls but
    // leave focus unchanged after Tab. Preserve native traversal when it works;
    // only advance in DOM order when the browser demonstrably did nothing. The
    // keyup path is synchronous so serialized accessibility runners cannot read
    // focus before a zero-delay timer has had a chance to run.
    let fallbackTimer: number | undefined;
    let pendingTab: { before: Element | null; reverse: boolean } | null = null;

    function advancePendingTab() {
      const pending = pendingTab;
      pendingTab = null;
      if (!pending || document.activeElement !== pending.before) return;
      const targets = visibleKeyboardTargets();
      if (targets.length === 0) return;
      const currentIndex = pending.before instanceof HTMLElement ? targets.indexOf(pending.before) : -1;
      const nextIndex = pending.reverse
        ? (currentIndex <= 0 ? targets.length - 1 : currentIndex - 1)
        : (currentIndex < 0 || currentIndex === targets.length - 1 ? 0 : currentIndex + 1);
      targets[nextIndex]?.focus();
    }

    function preserveTabTraversal(event: globalThis.KeyboardEvent) {
      if (event.key !== "Tab" || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      pendingTab = { before: document.activeElement, reverse: event.shiftKey };
      window.clearTimeout(fallbackTimer);
      fallbackTimer = window.setTimeout(advancePendingTab, 50);
    }

    function completeTabTraversal(event: globalThis.KeyboardEvent) {
      if (event.key !== "Tab") return;
      window.clearTimeout(fallbackTimer);
      advancePendingTab();
    }
    window.addEventListener("keydown", preserveTabTraversal);
    window.addEventListener("keyup", completeTabTraversal);
    return () => {
      window.removeEventListener("keydown", preserveTabTraversal);
      window.removeEventListener("keyup", completeTabTraversal);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (evidenceMode) return;
    const trimmed = query.trim();
    if (trimmed.length < pricingLookupConfig.minimumQueryLength) return;
    const current = ++requestNumber.current;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const result = await fetch(`/api/pricing/search?category=${encodeURIComponent(categoryId)}&q=${encodeURIComponent(trimmed)}`, { signal: controller.signal });
        const body = await result.json();
        if (!result.ok) throw new Error(body.error ?? "Pricing lookup failed.");
        if (current === requestNumber.current) setResponse(body);
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        if (current === requestNumber.current) setError(caught instanceof Error ? caught.message : "Pricing lookup failed.");
      } finally { if (current === requestNumber.current) setLoading(false); }
    }, 220);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [categoryId, evidenceMode, query, retryToken]);

  function updateQuery(value: string) {
    setQuery(value);
    setShowAllSealed(false);
    if (value.trim().length < pricingLookupConfig.minimumQueryLength) {
      requestNumber.current += 1;
      setResponse(null);
      setError(null);
      setLoading(false);
    }
  }

  const sealedResults = response?.sealed ?? [];
  const resultCount = (response?.sealed.length ?? 0) + (response?.singles.length ?? 0);
  const noMatches = response?.category.loaded && !loading && !error && resultCount === 0;

  return (
    <section
      ref={lookupRoot}
      aria-labelledby="pricing-lookup-heading"
      data-interactive-ready="false"
      data-evidence-zoom-reflow={evidenceZoomReflow ? "true" : "false"}
      className="pricing-lookup mx-auto w-full max-w-3xl pb-16"
    >
      <header>
        <p className="text-sm font-medium text-cyan-300">Decide</p>
        <h1 id="pricing-lookup-heading" className="mt-1 text-3xl font-semibold tracking-tight text-white">Price lookup</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Delivered-price evidence for English Pokémon singles and sealed product. This panel reports data; it does not recommend a purchase.</p>
      </header>
      {!evidenceMode ? (
        <label className="mt-5 block max-w-xs text-sm font-medium text-zinc-300">
          Game catalogue
          <select
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setResponse(null);
              setShowAllSealed(false);
            }}
            className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white outline-none focus:border-cyan-400 focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {pricingLookupConfig.categories.filter((category) => category.active).map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      <div
        data-pricing-search-panel
        data-pricing-search-reflow={zoomReflow ? "true" : "false"}
        className={`pricing-search-panel -mx-4 mt-5 border-y border-zinc-800 bg-zinc-950/95 px-4 py-3 md:static md:mx-0 md:rounded-xl md:border ${zoomReflow ? "" : "sticky top-0 z-20 backdrop-blur"}`}
      >
        <label htmlFor={inputId} className="block text-sm font-medium text-zinc-200">Search card, set, collector number, or sealed product</label>
        <div className="mt-2 flex gap-2">
          <input id={inputId} type="search" aria-label="Search card, set, collector number, or sealed product" aria-describedby="pricing-result-status" value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="e.g. Charizard 199/165 or 151" className="min-h-12 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300" />
          {query && <button type="button" onClick={() => updateQuery("")} className="min-h-12 min-w-12 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">Clear</button>}
        </div>
      </div>
      <div id="pricing-result-status" aria-live="polite" className="mt-4 text-sm text-zinc-300">
        {!response && !loading && "English Pokémon · no snapshot imported"}
        {response && `${response.category.label} · ${response.category.snapshotDate ? `snapshot ${dateLabel(response.category.snapshotDate)}` : "no snapshot imported"}${response.category.stale ? " · Stale" : ""}`}
        {loading && <span className="ml-2 text-cyan-300">Updating…</span>}
      </div>
      {response?.category.stale && <p className="mt-2 rounded-lg border border-amber-900/60 bg-amber-950/30 p-3 text-sm text-amber-100">Stale snapshot. The displayed floor may no longer reflect current listings.</p>}
      {error && <div role="alert" className="mt-4 rounded-lg border border-red-900 bg-red-950/30 p-4 text-sm text-red-100">{error} <button type="button" onClick={() => setRetryToken((value) => value + 1)} className="ml-2 underline">Try again</button></div>}
      {response && !response.category.loaded && <div className="mt-5 rounded-xl border border-amber-900/60 bg-zinc-900 p-5"><h2 className="font-semibold text-white">Category not loaded</h2><p className="mt-2 text-sm text-zinc-400">English Pokémon has no imported snapshot. Supply the authoritative Pricing Tool schema contract and run an import.</p></div>}
      {noMatches && <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-5"><h2 className="font-semibold text-white">No match in loaded category</h2><p className="mt-2 text-sm text-zinc-400">Try a card name, set, collector number, or sealed product name. Printing variants are kept separate.</p></div>}
      <div id="pricing-results" className="mt-6 space-y-6">
        {sealedResults.length > 0 && <section aria-labelledby="sealed-heading"><div className="flex items-end justify-between gap-4"><div><h2 id="sealed-heading" className="text-lg font-semibold text-white">Sealed products</h2><p className="mt-1 text-xs text-zinc-400">Condition selection does not apply.</p></div></div><ul className="mt-3 space-y-3">{sealedResults.map((match, index) => <SealedResult key={match.sku} match={match} previewHidden={!showAllSealed && index >= pricingLookupConfig.mobileSealedPreviewCount} />)}</ul>{!showAllSealed && sealedResults.length > pricingLookupConfig.mobileSealedPreviewCount && <button type="button" onClick={() => setShowAllSealed(true)} className="mt-3 min-h-11 w-full rounded-lg border border-zinc-700 text-sm font-medium text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 md:hidden">Show all {sealedResults.length} sealed products</button>}</section>}
        {(response?.singles.length ?? 0) > 0 && <section aria-labelledby="singles-heading"><div data-pricing-condition-panel data-pricing-condition-reflow={zoomReflow ? "true" : "false"} className={`pricing-condition-panel -mx-4 border-y border-zinc-800 bg-zinc-950/95 px-4 py-3 md:mx-0 md:rounded-xl md:border ${zoomReflow ? "" : "sticky top-[108px] z-10 backdrop-blur md:top-0"}`}><label className="block text-sm font-medium text-zinc-200">Singles condition<select aria-label="Singles condition" value={condition} onChange={(event) => persistCondition(event.target.value as PricingCondition)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-white outline-none focus:border-cyan-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300">{conditionLadder.map((grade) => <option key={grade} value={grade}>{conditionLabel(grade)}</option>)}</select></label><p className="mt-1 text-xs text-zinc-400">Re-prices all singles below; sealed products are unaffected.</p></div><h2 id="singles-heading" className="mt-4 text-lg font-semibold text-white">Singles</h2><ul className="mt-3 space-y-3">{response?.singles.map((match) => <SingleResult key={match.sku} match={match} condition={condition} />)}</ul></section>}
      </div>
      <p className="sr-only" aria-live="polite">{response ? `${resultCount} results. Singles re-priced for ${conditionLabel(condition)}.` : ""}</p>
    </section>
  );
}
