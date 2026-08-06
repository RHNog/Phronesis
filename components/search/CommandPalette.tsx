"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CardThumbnail from "@/components/cards/CardThumbnail";
import CardIdentityFacts from "@/components/cards/CardIdentityFacts";
import {
  createVendorSelectionUrl,
  dispatchWorkflowSelection,
  getWorkflowActionLabel,
  type CommandPaletteAssetSelection,
  type CommandPaletteContext,
} from "@/components/search/CommandPaletteRouter";
import { filterIdentityResultsForVendorWorkflow } from "@/lib/engines/eligibility/AssetEligibilityEngine";
import type { Card } from "@/types/card";
import type { CardIdentity } from "@/types/cardIdentity";
import { conditionProfiles, type CardConditionCode } from "@/types/conditionProfile";
import type { PrintingVariant } from "@/types/printingVariant";
import type { SearchResult } from "@/types/searchResult";
import type { IdentityProviderDiagnostics } from "@/lib/engines/identity/IdentityProviderDiagnostics";
import {
  resolveCanonicalTreatment,
  resolveVariantPhysicalFinish,
  treatmentFromFinish,
} from "@/lib/engines/identity/IdentityTreatmentResolver";
import { adaptCardPresentation, adaptIdentityPresentation } from "@/lib/engines/identity/IdentityPresentationAdapter";

type CommandPaletteProps = {
  context: CommandPaletteContext;
  open: boolean;
  onClose: () => void;
};

type PaletteStep = "search" | "printing" | "finish" | "condition";

function getVariants(printing: Card): PrintingVariant[] {
  if (printing.finishVariants?.length) {
    return printing.finishVariants.map((variant) => ({
      ...variant,
      treatmentDetails:
        variant.treatmentDetails ?? treatmentFromFinish(variant.finish),
    }));
  }
  if (printing.physicalVariants?.length) {
    return printing.physicalVariants.map((physicalVariant) => ({
      finish: physicalVariant.physicalFinish.value,
      id: physicalVariant.physicalVariantIdentityId,
      imageUrls: printing.imageUrls,
      isAvailable: physicalVariant.physicalFinish.evidence.state === "Explicit",
      physicalFinish: physicalVariant.physicalFinish,
      physicalVariantIdentityId: physicalVariant.physicalVariantIdentityId,
      printingId: printing.id,
      source: physicalVariant.physicalFinish.evidence.providerId,
    }));
  }
  const finishes = printing.availableFinishes?.length
    ? printing.availableFinishes
    : [printing.finish];

  return finishes.map((finish) => ({
    finish,
    id: `${printing.id}:${finish.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    imageUrls: printing.imageUrls,
    isAvailable: true,
    printingId: printing.id,
    source: "Identity",
    treatmentDetails:
      printing.treatmentDetails ?? resolveCanonicalTreatment(printing),
  }));
}

export default function CommandPalette({ context, open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult<CardIdentity>[]>([]);
  const [eligibilityCount, setEligibilityCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [step, setStep] = useState<PaletteStep>("search");
  const [identity, setIdentity] = useState<CardIdentity>();
  const [printing, setPrinting] = useState<Card>();
  const [variant, setVariant] = useState<PrintingVariant>();
  const [condition, setCondition] = useState<CardConditionCode>("NM");
  const [developerMode, setDeveloperMode] = useState(false);
  const [identityDiagnostics, setIdentityDiagnostics] = useState<IdentityProviderDiagnostics>();

  const stepItems = useMemo(() => {
    if (step === "search") return results;
    if (step === "printing") return identity?.printings ?? [];
    if (step === "finish") return printing ? getVariants(printing) : [];
    return conditionProfiles;
  }, [identity, printing, results, step]);

  function reset(nextQuery = "") {
    setQuery(nextQuery);
    setResults([]);
    setError("");
    setLoading(false);
    setActiveIndex(0);
    setStep("search");
    setIdentity(undefined);
    setPrinting(undefined);
    setVariant(undefined);
    setCondition("NM");
    setIdentityDiagnostics(undefined);
  }

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open || step !== "search" || query.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/identity/search?q=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Identity search unavailable.");
        const payload = (await response.json()) as {
          message?: string;
          orchestrationDiagnostics?: IdentityProviderDiagnostics;
          results?: SearchResult<CardIdentity>[];
        };
        const eligibility = filterIdentityResultsForVendorWorkflow(payload.results ?? []);
        setResults(eligibility.results);
        setEligibilityCount(eligibility.diagnostics.length);
        setIdentityDiagnostics(payload.orchestrationDiagnostics);
        setError(payload.message ?? "");
        setActiveIndex(0);
      } catch (caught) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : "Identity search unavailable.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [open, query, step]);

  function chooseActive() {
    const item = stepItems[activeIndex];
    if (!item) return;
    if (step === "search") {
      setIdentity((item as SearchResult<CardIdentity>).item);
      setStep("printing");
    } else if (step === "printing") {
      setPrinting(item as Card);
      setStep("finish");
    } else if (step === "finish") {
      setVariant(item as PrintingVariant);
      setStep("condition");
    } else {
      setCondition((item as (typeof conditionProfiles)[number]).code);
    }
    setActiveIndex(0);
  }

  function completeSelection(conditionOverride = condition) {
    if (!identity || !printing || !variant) return;
    const selection: CommandPaletteAssetSelection = {
      condition: conditionOverride,
      identityId: identity.id,
      printing,
      query,
      variant,
    };

    if (context === "MarketWatch") {
      dispatchWorkflowSelection(selection);
      onClose();
      reset();
      return;
    }

    router.push(createVendorSelectionUrl(selection));
    onClose();
    reset();
  }

  function goBack() {
    if (step === "condition") setStep("finish");
    else if (step === "finish") setStep("printing");
    else if (step === "printing") setStep("search");
    else {
      onClose();
      reset();
    }
    setActiveIndex(0);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      goBack();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((value) => stepItems.length ? (value + 1) % stepItems.length : 0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((value) => stepItems.length ? (value - 1 + stepItems.length) % stepItems.length : 0);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (step === "condition" && variant) {
        const activeCondition = conditionProfiles[activeIndex]?.code ?? condition;
        setCondition(activeCondition);
        completeSelection(activeCondition);
      }
      else chooseActive();
    }
  }

  if (!open) return null;

  return (
    <div className="app-command-palette-safe fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[10vh] backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-label="Global command palette" aria-modal="true" className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black" onKeyDown={handleKeyDown} role="dialog">
        <div className="flex items-center gap-3 border-b border-zinc-800 px-4">
          <span className="text-zinc-400" aria-hidden="true">⌕</span>
          <input
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            aria-expanded="true"
            className="h-14 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-zinc-500"
            onChange={(event) => reset(event.target.value)}
            placeholder="Search anything…"
            ref={inputRef}
            role="combobox"
            value={query}
          />
          <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-400">Cards</span>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-2 text-xs text-zinc-400">
          <span>{step === "search" ? "Collectible" : `${identity?.name ?? "Collectible"} / ${step === "finish" ? "printing" : step}`}</span>
          {process.env.NODE_ENV === "development" ? <button className="hover:text-cyan-300" onClick={() => setDeveloperMode((value) => !value)} type="button">Developer</button> : null}
        </div>

        <div className="max-h-[55vh] overflow-y-auto" id="command-palette-results" role="listbox">
          {loading ? <LoadingRows /> : null}
          {!loading && step === "search" && query.trim().length < 2 ? <Message title="Search cards" detail="Type at least two characters to begin." /> : null}
          {!loading && step === "search" && query.trim().length >= 2 && results.length === 0 ? <Message title="No matching collectible found." detail={error || "Refine search"} /> : null}

          {!loading && step === "search" ? results.map((result, index) => {
            const card = result.item.printings[0];
            const presentation = adaptCardPresentation(card);
            return (
              <button aria-selected={index === activeIndex} className={`flex w-full items-center gap-3 border-b border-zinc-900 px-4 py-3 text-left ${index === activeIndex ? "bg-cyan-400/10" : "hover:bg-zinc-900"}`} key={result.item.id} onClick={() => { setActiveIndex(index); setIdentity(result.item); setStep("printing"); }} role="option" type="button">
                <CardThumbnail alt={`${result.item.name}, ${card.set}`} assetKey={card.id} candidates={[{ source: "Provider", urls: card.imageUrls ?? { normal: card.imageUrl } }]} className="w-12" developerMode={developerMode} selected={index === activeIndex} />
                <span className="min-w-0 flex-1"><span className="block font-medium text-white">{presentation.cardName.presentationValue}</span><span className="mt-1 block text-xs text-zinc-400">{presentation.printing.label}: {presentation.printing.presentationValue} · {presentation.language.presentationValue}</span><CardIdentityFacts className="mt-1 block text-xs text-zinc-500" presentation={presentation} /></span>
                <span className="text-xs text-zinc-500">{result.score}%</span>
              </button>
            );
          }) : null}

          {step === "printing" ? identity?.printings.map((card, index) => { const presentation = adaptCardPresentation(card); return <button aria-selected={index === activeIndex} className={`flex w-full items-center gap-3 border-b border-zinc-900 px-4 py-3 text-left ${index === activeIndex ? "bg-cyan-400/10" : "hover:bg-zinc-900"}`} key={card.id} onClick={() => { setPrinting(card); setStep("finish"); setActiveIndex(0); }} role="option" type="button"><CardThumbnail alt={`${card.name}, ${card.set}`} assetKey={card.id} candidates={[{ source: "Provider", urls: card.imageUrls ?? { normal: card.imageUrl } }]} className="w-12" selected={index === activeIndex} /><span><span className="block font-medium text-white">{presentation.printing.presentationValue}</span><span className="mt-1 block text-xs text-zinc-400">{presentation.collectorNumber.presentationValue} · {presentation.language.presentationValue}</span><CardIdentityFacts className="mt-1 block text-xs text-zinc-500" presentation={presentation} /></span></button>; }) : null}

          {step === "finish" && printing ? getVariants(printing).map((item, index) => { const presentation = adaptIdentityPresentation({ cardName: printing.name, physicalFinish: item.physicalFinish }); return <button aria-selected={index === activeIndex} className={`flex w-full justify-between border-b border-zinc-900 px-4 py-4 text-left ${index === activeIndex ? "bg-cyan-400/10 text-cyan-100" : "text-zinc-200 hover:bg-zinc-900"}`} key={item.id} onClick={() => { setVariant(item); setStep("condition"); setActiveIndex(0); }} role="option" type="button"><span>{presentation.finish.visible ? resolveVariantPhysicalFinish(item) : "Continue"}</span><span className="text-xs text-zinc-500">{presentation.finish.visible ? "Printing" : "No printing selection needed"}</span></button>; }) : null}

          {step === "condition" ? conditionProfiles.map((item, index) => <button aria-selected={index === activeIndex} className={`flex w-full justify-between border-b border-zinc-900 px-4 py-4 text-left ${index === activeIndex ? "bg-cyan-400/10 text-cyan-100" : "text-zinc-200 hover:bg-zinc-900"}`} key={item.code} onClick={() => { setCondition(item.code); setActiveIndex(index); }} role="option" type="button"><span>{item.label}</span><span className="text-xs text-zinc-500">{item.code}</span></button>) : null}
        </div>

        {developerMode ? <div className="grid grid-cols-3 gap-2 border-t border-zinc-800 bg-zinc-900/70 px-4 py-3 text-[10px] text-zinc-400"><span>Provider: {identityDiagnostics?.providerSelected ?? "None"}</span><span>Provider confidence: {identityDiagnostics?.providerConfidence ?? 0}</span><span>Normalization: {identityDiagnostics?.normalizationSource ?? "None"}</span><span>Canonical: {identityDiagnostics?.canonicalIdentities[0] ?? "None"}</span><span>Fallback: {identityDiagnostics?.fallbackProvider ?? "None"}</span><span>Latency: {identityDiagnostics?.searchLatencyMs ?? 0}ms</span><span>Eligibility: {eligibilityCount}</span><span>Status: {identityDiagnostics?.status ?? "Idle"}</span><span>Image cache: PHR-UI-001</span></div> : null}

        <footer className="flex items-center justify-between border-t border-zinc-800 px-4 py-3 text-xs text-zinc-400">
          <span>↑↓ Navigate · Enter Select · Tab Focus · Esc Back</span>
          {step === "condition" && variant ? <button className="rounded-md bg-cyan-300 px-3 py-2 font-semibold text-zinc-950 hover:bg-cyan-200" onClick={() => completeSelection()} type="button">{getWorkflowActionLabel(context)}</button> : <span>⌘K</span>}
        </footer>
      </section>
    </div>
  );
}

function LoadingRows() {
  return <div aria-live="polite" className="space-y-1 p-3"><span className="sr-only">Searching collectibles</span>{[0, 1, 2].map((item) => <div className="h-16 animate-pulse rounded-lg bg-zinc-900" key={item} />)}</div>;
}

function Message({ title, detail }: { title: string; detail: string }) {
  return <div className="px-6 py-12 text-center"><p className="font-medium text-zinc-200">{title}</p><p className="mt-2 text-sm text-zinc-400">{detail}</p></div>;
}
