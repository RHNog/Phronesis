"use client";

import { useEffect, useState } from "react";
import type { RecognitionOfferSummary, ScanSessionSummary } from "@/lib/cardRecognition/repository";
import type { RecognitionDecision } from "@/lib/cardRecognition/contracts";
import type { RecognitionValuationSnapshot, RecognitionValuationSummary } from "@/lib/cardRecognition/sqliteCatalogue";

const stages = ["Capture", "Resolve", "Offer"] as const;
const batchConditions = [
  { value: "NEAR_MINT", label: "Near Mint" },
  { value: "LIGHTLY_PLAYED", label: "Lightly Played" },
  { value: "MODERATELY_PLAYED", label: "Moderately Played" },
  { value: "HEAVILY_PLAYED", label: "Heavily Played" },
  { value: "DAMAGED", label: "Damaged" },
] as const;
const batchFinishes = ["Normal", "Holofoil", "Reverse Holofoil"] as const;
const emptyOfferSummary: RecognitionOfferSummary = { lines: [], groups: [], totals: [], lineCount: 0, groupCount: 0, unitCount: 0 };
const buyingPresetId = "tcg-low-80";
const emptyValuationSummary: RecognitionValuationSummary = {
  unitCount: 0,
  tcgLow: { currency: "USD", totalCents: 0, coveredUnits: 0 },
  tcgMarket: { currency: "USD", totalCents: 0, coveredUnits: 0 },
  regionalLow: { currency: "BRL", totalCentavos: 0, coveredUnits: 0, providers: [] },
  suggestedOffer: { currency: "USD", totalCents: 0, coveredUnits: 0, presetId: buyingPresetId },
};

function conditionLabel(value: string): string {
  return batchConditions.find((condition) => condition.value === value)?.label ?? value.replaceAll("_", " ");
}

function money(cents: number, currency: "USD" | "BRL"): string {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "pt-BR", { style: "currency", currency }).format(cents / 100);
}

type RecognitionReviewItem = {
  frameId: string;
  pairedFrameId: string | null;
  side: "FRONT" | "BACK" | "UNKNOWN";
  regionId: string;
  status: string;
  decision: RecognitionDecision | null;
  resolved: boolean;
};

function Count({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{value}</dd></div>;
}

export default function ScannerToOfferWorkspace({ canOperate }: { canOperate: boolean }) {
  const [sessions, setSessions] = useState<ScanSessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [label, setLabel] = useState("");
  const [newBatchCondition, setNewBatchCondition] = useState("");
  const [newBatchFinish, setNewBatchFinish] = useState("");
  const [batchConditionDraft, setBatchConditionDraft] = useState("");
  const [batchFinishDraft, setBatchFinishDraft] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<RecognitionReviewItem[]>([]);
  const [offerSummary, setOfferSummary] = useState<RecognitionOfferSummary>(emptyOfferSummary);
  const [valuationSummary, setValuationSummary] = useState<RecognitionValuationSummary>(emptyValuationSummary);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [cardCondition, setCardCondition] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceSnapshotId, setPriceSnapshotId] = useState("");
  const [priceSnapshotAt, setPriceSnapshotAt] = useState("");
  const [valuation, setValuation] = useState<RecognitionValuationSnapshot | null>(null);
  const [pricingBusy, setPricingBusy] = useState(false);

  async function load(options: { sessionId?: string; announce?: boolean; initial?: boolean } = {}) {
    setBusy(true);
    try {
      const response = await fetch("/api/card-recognition/sessions", { cache: "no-store" });
      const payload = await response.json() as { sessions?: ScanSessionSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Session status is unavailable.");
      const nextSessions = payload.sessions ?? [];
      setSessions(nextSessions);
      const requestedSessionId = options.sessionId ?? selectedSessionId;
      const activeSession = nextSessions.find((session) => session.id === requestedSessionId) ?? nextSessions[0];
      if (activeSession) {
        setSelectedSessionId(activeSession.id);
        setBatchConditionDraft(activeSession.batchMaterial?.conditionCode ?? "");
        setBatchFinishDraft(activeSession.batchMaterial?.finish ?? "");
        const detailResponse = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(activeSession.id)}`, { cache: "no-store" });
        const detail = await detailResponse.json() as { items?: typeof items; offerSummary?: RecognitionOfferSummary; valuationSummary?: RecognitionValuationSummary; error?: string };
        if (!detailResponse.ok) throw new Error(detail.error ?? "Session detail is unavailable.");
        const nextItems = detail.items ?? [];
        setItems(nextItems);
        setOfferSummary(detail.offerSummary ?? emptyOfferSummary);
        setValuationSummary(detail.valuationSummary ?? emptyValuationSummary);
        const nextReviewItems = nextItems.filter((item) => !item.resolved && item.decision && (item.status === "REVIEW" || item.status === "ABSTAINED"));
        const preserveRegion = activeSession.id === selectedSessionId
          ? nextReviewItems.find((item) => item.regionId === selectedRegionId)
          : undefined;
        const nextUnresolved = preserveRegion ?? nextReviewItems[0];
        setSelectedRegionId(nextUnresolved?.regionId ?? "");
        const nextCandidates = nextUnresolved?.decision?.candidates ?? [];
        const nextCandidate = nextCandidates.find((candidate) => candidate.catalogueIdentity?.variant.localeCompare(activeSession.batchMaterial?.finish ?? "", undefined, { sensitivity: "base" }) === 0) ?? nextCandidates[0] ?? null;
        setSelectedCandidateId(nextCandidate?.canonicalPrintingId ?? "");
        setCardCondition(activeSession.batchMaterial?.conditionCode ?? "");
        setPriceSnapshotId(""); setPriceSnapshotAt(""); setValuation(null);
        if (options.announce) {
          const timestamp = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" }).format(new Date());
          setMessage(`Status refreshed at ${timestamp}. ${nextReviewItems.length} unresolved ${nextReviewItems.length === 1 ? "card" : "cards"}.`);
        } else if (options.initial) setMessage("");
      } else {
        setSelectedSessionId(""); setSelectedRegionId(""); setItems([]); setOfferSummary(emptyOfferSummary); setValuationSummary(emptyValuationSummary); setBatchConditionDraft(""); setBatchFinishDraft(""); setSelectedCandidateId(""); setCardCondition("");
        if (options.announce) setMessage("Status refreshed. No recognition sessions are available.");
        else if (options.initial) setMessage("");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Session status is unavailable."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load({ initial: true }); }, 0);
    return () => window.clearTimeout(timeout);
    // Initial session hydration is intentionally consumed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    if (!canOperate) return;
    setBusy(true);
    try {
      const response = await fetch("/api/card-recognition/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label, conditionCode: newBatchCondition, finish: newBatchFinish }) });
      const payload = await response.json() as { session?: ScanSessionSummary; error?: string };
      if (!response.ok || !payload.session) throw new Error(payload.error ?? "Session could not be created.");
      setSessions((current) => [payload.session!, ...current]);
      setSelectedSessionId(payload.session.id);
      setSelectedRegionId("");
      setLabel("");
      setNewBatchCondition(""); setNewBatchFinish("");
      setBatchConditionDraft(payload.session.batchMaterial?.conditionCode ?? ""); setBatchFinishDraft(payload.session.batchMaterial?.finish ?? "");
      setItems([]); setOfferSummary(emptyOfferSummary); setValuationSummary(emptyValuationSummary); setSelectedCandidateId(""); setCardCondition(payload.session.batchMaterial?.conditionCode ?? "");
      setMessage("Homogeneous batch created. Import a sealed Windows bridge bundle to begin durable recognition.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Session could not be created."); }
    finally { setBusy(false); }
  }

  async function configureBatchMaterial(event: React.FormEvent) {
    event.preventDefault();
    const activeSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];
    if (!canOperate || !activeSession) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(activeSession.id)}`, {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ conditionCode: batchConditionDraft, finish: batchFinishDraft }),
      });
      const payload = await response.json() as { session?: ScanSessionSummary; error?: string };
      if (!response.ok || !payload.session) throw new Error(payload.error ?? "Batch material could not be configured.");
      setMessage("Batch condition and finish applied. Every resolved card must match this declaration.");
      await load({ sessionId: activeSession.id });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Batch material could not be configured."); }
    finally { setBusy(false); }
  }

  async function cancelActiveSession() {
    const activeSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];
    if (!canOperate || !activeSession || activeSession.state === "CANCELLED") return;
    const confirmed = window.confirm("Cancel this Phronesis scan session? Existing scan evidence will be retained. PaperStream is controlled separately and will not be stopped by this action.");
    if (!confirmed) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(activeSession.id)}`, { method: "DELETE" });
      const payload = await response.json() as { session?: ScanSessionSummary; error?: string };
      if (!response.ok || !payload.session) throw new Error(payload.error ?? "Scan session could not be cancelled.");
      setMessage("Phronesis session cancelled. Existing evidence was retained; start a new batch when PaperStream is ready.");
      await load({ sessionId: activeSession.id });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Scan session could not be cancelled."); }
    finally { setBusy(false); }
  }

  const active = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];
  const reviewItems = items.filter((item) => !item.resolved && item.decision && (item.status === "REVIEW" || item.status === "ABSTAINED"));
  const unresolved = reviewItems.find((item) => item.regionId === selectedRegionId) ?? reviewItems[0];
  const unresolvedIndex = unresolved ? reviewItems.findIndex((item) => item.regionId === unresolved.regionId) : -1;
  const allCandidateOptions = unresolved?.decision?.candidates ?? [];
  const candidateOptions = active?.batchMaterial ? allCandidateOptions : [];
  const selectedCandidate = allCandidateOptions.find((candidate) => candidate.canonicalPrintingId === selectedCandidateId)
    ?? allCandidateOptions[0]
    ?? null;

  useEffect(() => {
    const categoryId = selectedCandidate?.categoryId;
    const sku = selectedCandidate?.sku;
    if (!categoryId || !sku || !cardCondition) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setPricingBusy(true);
      void fetch(`/api/card-recognition/pricing?category=${encodeURIComponent(categoryId)}&sku=${encodeURIComponent(sku)}&condition=${encodeURIComponent(cardCondition)}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          const payload = await response.json() as { snapshot?: RecognitionValuationSnapshot; error?: string };
          if (!response.ok || !payload.snapshot) throw new Error(payload.error ?? "Price evidence is unavailable.");
          setValuation(payload.snapshot); setPriceSnapshotId(payload.snapshot.priceSnapshotId); setPriceSnapshotAt(payload.snapshot.priceSnapshotAt);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setValuation(null); setPriceSnapshotId(""); setPriceSnapshotAt("");
          setMessage(error instanceof Error ? error.message : "Price evidence is unavailable.");
        })
        .finally(() => { if (!controller.signal.aborted) setPricingBusy(false); });
    }, 0);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [selectedCandidate?.categoryId, selectedCandidate?.sku, cardCondition]);

  function chooseCandidate(canonicalPrintingId: string) {
    const candidate = candidateOptions.find((option) => option.canonicalPrintingId === canonicalPrintingId);
    if (!candidate) return;
    setSelectedCandidateId(canonicalPrintingId);
    setPriceSnapshotId("");
    setPriceSnapshotAt("");
    setValuation(null);
  }

  function chooseReviewItem(index: number) {
    const item = reviewItems[index];
    if (!item) return;
    setSelectedRegionId(item.regionId);
    const candidates = item.decision?.candidates ?? [];
    const candidate = candidates.find((option) => option.catalogueIdentity?.variant.localeCompare(active?.batchMaterial?.finish ?? "", undefined, { sensitivity: "base" }) === 0) ?? candidates[0] ?? null;
    setSelectedCandidateId(candidate?.canonicalPrintingId ?? "");
    setCardCondition(active?.batchMaterial?.conditionCode ?? "");
    setPriceSnapshotId(""); setPriceSnapshotAt(""); setValuation(null);
  }

  async function resolveCurrent(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !unresolved || !selectedCandidate) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(active.id)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ regionId: unresolved.regionId, canonicalPrintingId: selectedCandidate.canonicalPrintingId, condition: cardCondition, finish: selectedCandidate.catalogueIdentity.variant, quantity, priceSnapshotId, priceSnapshotAt, buyingPresetId }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Exception could not be resolved.");
      setMessage("Identity and per-card material confirmed. The 80%-of-TCG-Low offer is now in the local draft.");
      setQuantity(1); setPriceSnapshotId(""); setPriceSnapshotAt(""); setValuation(null);
      await load({ sessionId: active.id });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Exception could not be resolved."); }
    finally { setBusy(false); }
  }

  return <div className="w-full max-w-6xl space-y-5">
    <header className="rounded-2xl border border-cyan-950 bg-zinc-900/80 p-5 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300">Local card recognition</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Scanner to offer</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">English Pokémon is the active first-release lane. Durable local intake produces evidence-backed identity review and draft offers; recognition abstains when evidence is insufficient and never publishes.</p>
      <ol className="mt-5 grid grid-cols-3 gap-2" aria-label="Workflow stages">{stages.map((stage, index) => <li key={stage} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${index === 0 ? "border-cyan-500 bg-cyan-950/40 text-cyan-100" : "border-zinc-800 bg-zinc-950 text-zinc-500"}`}><span className="mr-2 text-xs">{index + 1}</span>{stage}</li>)}</ol>
    </header>

    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5" aria-labelledby="session-title">
      <div><h2 id="session-title" className="text-xl font-semibold">Capture session</h2><p className="mt-1 text-sm text-zinc-500">Set material defaults for the batch. Every card can be corrected explicitly during review; originals remain content-addressed.</p></div>
      <form onSubmit={createSession} className="mt-4 grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(10rem,.7fr)_minmax(11rem,.7fr)_auto]">
        <label className="text-xs text-zinc-400" htmlFor="scan-session-label">Batch label<input id="scan-session-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Event or batch label" maxLength={120} className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30" /></label>
        <label className="text-xs text-zinc-400" htmlFor="new-batch-condition">Batch condition<select id="new-batch-condition" required value={newBatchCondition} onChange={(event) => setNewBatchCondition(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white"><option value="" disabled>Select condition</option>{batchConditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</select></label>
        <label className="text-xs text-zinc-400" htmlFor="new-batch-finish">Batch finish<select id="new-batch-finish" required value={newBatchFinish} onChange={(event) => setNewBatchFinish(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white"><option value="" disabled>Select finish</option>{batchFinishes.map((finish) => <option key={finish} value={finish}>{finish}</option>)}</select></label>
        <button disabled={!canOperate || busy || !newBatchCondition || !newBatchFinish} className="min-h-11 self-end rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">New batch</button>
      </form>
      <p className="mt-3 min-h-6 text-sm text-amber-200" aria-live="polite">{message}</p>
      {active ? <div className="mt-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="min-w-0 flex-1 text-xs text-zinc-400" htmlFor="active-scan-session">Review batch
            <select id="active-scan-session" value={active.id} onChange={(event) => void load({ sessionId: event.target.value, announce: true })} disabled={busy} className="mt-1 min-h-11 w-full max-w-xl rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white disabled:cursor-wait disabled:opacity-60">
              {sessions.map((session) => <option key={session.id} value={session.id}>{session.label} · {session.state.replaceAll("_", " ")} · {new Date(session.createdAt).toLocaleString()}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">{active.state.replaceAll("_", " ")}</span>{active.state !== "CANCELLED" ? <button type="button" onClick={() => void cancelActiveSession()} disabled={!canOperate || busy} className="min-h-11 rounded-lg border border-red-800 px-3 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button> : null}</div>
        </div>
        <p className="mt-2 break-all text-xs text-zinc-500">{active.id}</p>
        {active.orientationCorrection ? <p className="mt-3 rounded-lg border border-cyan-900 bg-cyan-950/25 px-3 py-2 text-xs leading-5 text-cyan-100">Duplex orientation repaired from verified scanner evidence on {new Date(active.orientationCorrection.correctedAt).toLocaleString()}. The card face is now the front evidence; the Pokémon design is retained as the paired reverse.</p> : null}
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"><Count label="Frames" value={active.counts.frames} /><Count label="Regions" value={active.counts.regions} /><Count label="Processing" value={active.counts.pending} /><Count label="Review" value={active.counts.review} /><Count label="Accepted" value={active.counts.accepted} /><Count label="Abstained" value={active.counts.abstained} /><Count label="Failed" value={active.counts.failed} /></dl>
        {active.state !== "CANCELLED" ? <form onSubmit={configureBatchMaterial} className={`mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,1fr)_minmax(11rem,1fr)_auto] ${active.batchMaterial ? "border-emerald-900 bg-emerald-950/20" : "border-amber-900 bg-amber-950/20"}`}>
          <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Batch material defaults</p><p className="mt-1 text-xs leading-5 text-zinc-400">These values pre-fill each card. Review can override condition and exact catalogue variation without changing other cards.</p>{active.batchMaterial ? <p className="mt-1 text-xs text-emerald-300">Revision {active.batchMaterial.revision} · {active.batchMaterial.locked ? "Defaults locked; per-card corrections remain available" : "Defaults editable until first resolution"}</p> : <p className="mt-1 text-xs text-amber-200">Required before price evidence or resolution.</p>}</div>
          <label className="text-xs text-zinc-400" htmlFor="active-batch-condition">Default condition<select id="active-batch-condition" required disabled={active.batchMaterial?.locked} value={batchConditionDraft} onChange={(event) => { setBatchConditionDraft(event.target.value); setValuation(null); }} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60"><option value="" disabled>Select condition</option>{batchConditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</select></label>
          <label className="text-xs text-zinc-400" htmlFor="active-batch-finish">Default finish<select id="active-batch-finish" required disabled={active.batchMaterial?.locked} value={batchFinishDraft} onChange={(event) => { setBatchFinishDraft(event.target.value); setValuation(null); }} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60"><option value="" disabled>Select finish</option>{batchFinishes.map((finish) => <option key={finish} value={finish}>{finish}</option>)}</select></label>
          <button disabled={!canOperate || busy || active.batchMaterial?.locked || !batchConditionDraft || !batchFinishDraft} className="min-h-11 self-end rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50">{active.batchMaterial ? "Update batch" : "Set batch"}</button>
        </form> : <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">This session is cancelled. Its evidence remains retained. Create a new batch above when PaperStream is ready.</p>}
      </div> : <div className="mt-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-500">{busy ? "Loading sessions…" : "No recognition session yet. Create one, then import the sealed bridge batch."}</div>}
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Resolve exceptions</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Machine identity remains review-only. Confirm the exact variation and card condition here; batch material is only the default.</p><p className="mt-2 text-xs text-zinc-500">Observed identities: {items.filter((item) => item.decision?.observation?.probableName).length}/{items.length} · Exact English-market candidates: {items.filter((item) => item.decision?.candidates.length).length}/{items.length}</p></div><button type="button" onClick={() => void load({ sessionId: active?.id, announce: true })} disabled={busy} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 disabled:cursor-wait disabled:opacity-50">{busy ? "Loading…" : "Refresh status"}</button></div>
        {reviewItems.length > 0 ? <nav className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-950 p-2" aria-label="Exception review queue">
          <button type="button" onClick={() => chooseReviewItem(unresolvedIndex - 1)} disabled={busy || unresolvedIndex <= 0} className="min-h-11 rounded-md border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous unresolved card">← Previous</button>
          <p className="px-2 text-sm font-semibold tabular-nums text-zinc-300" aria-live="polite">Card {unresolvedIndex + 1} of {reviewItems.length}</p>
          <button type="button" onClick={() => chooseReviewItem(unresolvedIndex + 1)} disabled={busy || unresolvedIndex < 0 || unresolvedIndex >= reviewItems.length - 1} className="min-h-11 rounded-md border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next unresolved card">Next →</button>
        </nav> : null}
        {unresolved ? <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="grid content-start gap-3" aria-label="Scan evidence">
            <figure className="rounded-lg border border-zinc-800 bg-zinc-950 p-2">
              <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">{unresolved.side === "FRONT" ? "Front evidence" : "Scanned evidence"}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated content-addressed scan evidence is not a public optimization source. */}
              <img src={`/api/card-recognition/frames/${encodeURIComponent(unresolved.frameId)}`} alt={unresolved.side === "FRONT" ? "Current card front evidence" : "Current scanned card evidence"} className="max-h-[32rem] w-full rounded-md bg-zinc-950 object-contain" />
            </figure>
            {unresolved.pairedFrameId ? <details className="rounded-lg border border-zinc-800 bg-zinc-950 p-2"><summary className="min-h-11 cursor-pointer content-center px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">Show retained reverse evidence</summary><figure className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated content-addressed scan evidence is not a public optimization source. */}
              <img src={`/api/card-recognition/frames/${encodeURIComponent(unresolved.pairedFrameId)}`} alt="Acquisition-proven paired card reverse evidence" className="max-h-[32rem] w-full rounded-md bg-zinc-950 object-contain" />
              <figcaption className="mt-2 text-xs leading-5 text-zinc-500">Retained acquisition evidence only; it is not processed for identity, grading, finish, or pricing.</figcaption>
            </figure></details> : null}
          </div>
          <form onSubmit={resolveCurrent} className="space-y-3"><div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-300">{unresolved.status}</p><p className="mt-2 break-words text-sm font-semibold text-zinc-100">{selectedCandidate?.catalogueIdentity.name ?? unresolved.decision?.observation?.probableName ?? "Identity unavailable"}</p><p className="mt-1 text-xs text-zinc-500">{unresolved.decision?.observation ? `${unresolved.decision.observation.collectorNumber ?? "No collector number"} · ${unresolved.decision.observation.language}` : unresolved.decision?.reason}</p></div>
            {selectedCandidate ? <>{candidateOptions.length ? <fieldset className="space-y-2"><legend className="text-xs font-semibold text-zinc-300">Select exact printing and variation</legend>{candidateOptions.map((candidate) => { const identity = candidate.catalogueIdentity; return <label key={candidate.canonicalPrintingId} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 ${candidate.canonicalPrintingId === selectedCandidate.canonicalPrintingId ? "border-cyan-500 bg-cyan-950/30" : "border-zinc-800 bg-zinc-950"}`}><input type="radio" name="recognition-candidate" value={candidate.canonicalPrintingId} checked={candidate.canonicalPrintingId === selectedCandidate.canonicalPrintingId} onChange={() => chooseCandidate(candidate.canonicalPrintingId)} className="mt-1 size-4 accent-cyan-300" /><span className="min-w-0 text-sm"><span className="block font-semibold text-zinc-100">{identity.name}</span><span className="mt-1 block text-xs leading-5 text-zinc-400">{`${identity.setName} · ${identity.collectorNumber ?? "No collector number"} · ${identity.variant} · ${identity.language}`}</span><span className="mt-1 block text-xs text-zinc-600">Rank {candidate.rank} · OCR evidence {Math.round(candidate.score * 100)}%</span></span></label>; })}</fieldset> : null}
            <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-zinc-400">Card condition<select required value={cardCondition} onChange={(event) => { setCardCondition(event.target.value); setValuation(null); setPriceSnapshotId(""); setPriceSnapshotAt(""); }} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white">{batchConditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</select></label><label className="block text-xs text-zinc-400">Card variation<input readOnly value={selectedCandidate.catalogueIdentity.variant} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-zinc-200" /></label></div>
            {active?.batchMaterial && (cardCondition !== active.batchMaterial.conditionCode || selectedCandidate.catalogueIdentity.variant.localeCompare(active.batchMaterial.finish, undefined, { sensitivity: "base" }) !== 0) ? <p className="rounded-lg border border-amber-900 bg-amber-950/25 p-3 text-xs text-amber-100">Per-card override from default {conditionLabel(active.batchMaterial.conditionCode)} · {active.batchMaterial.finish}. This correction will be retained in the offer evidence.</p> : null}
            <label className="block text-xs text-zinc-400">Quantity<input required type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label>
            <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-200">{pricingBusy ? <p>Loading current valuation…</p> : valuation ? <div className="grid grid-cols-2 gap-3"><p><span className="block text-zinc-500">TCG Low</span>{valuation.tcgLowCents === null ? "Unavailable" : money(valuation.tcgLowCents, "USD")}</p><p><span className="block text-zinc-500">TCG Market</span>{valuation.tcgMarketCents === null ? "Unavailable" : money(valuation.tcgMarketCents, "USD")}</p><p><span className="block text-zinc-500">{valuation.regionalProvider ?? "Liga low"}</span>{valuation.regionalLowCentavos === null ? "Unavailable" : money(valuation.regionalLowCentavos, "BRL")}<span className="mt-1 block text-zinc-600">{valuation.regionalCondition || valuation.regionalLanguage ? `${valuation.regionalCondition ?? "Condition not supplied"} · ${valuation.regionalLanguage ?? "Language not supplied"} reference` : "Regional reference"}</span></p><p><span className="block text-zinc-500">Suggested offer</span>{valuation.suggestedOfferCents === null ? "Unavailable" : money(valuation.suggestedOfferCents, "USD")}</p><p className="col-span-2 text-zinc-500">Preset: 20% off TCG Low (80%)</p></div> : <p>Current valuation is unavailable for this exact condition.</p>}</div>
            <button disabled={!canOperate || busy || pricingBusy || !priceSnapshotId || valuation?.suggestedOfferCents === null} className="min-h-12 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-50">Confirm at {valuation?.suggestedOfferCents === null || valuation?.suggestedOfferCents === undefined ? "80% of TCG Low" : money(valuation.suggestedOfferCents, "USD")}</button></> : <p className="rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">{!active?.batchMaterial ? "Set the batch material defaults before resolving cards." : unresolved.decision?.observation?.language !== "ENGLISH" ? `${unresolved.decision?.observation?.probableName ?? "This card"} was observed as ${unresolved.decision?.observation?.language ?? "unsupported language"}. Exact English-market resolution remains blocked.` : "No candidate is safe to select. Use canonical search before resolving this abstention."}</p>}
          </form>
        </div> : <div className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-500">No unresolved machine recommendation is available.</div>}
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Offer draft</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Exact commercial bindings consolidate into quantities while every contributing scan remains traceable. Draft generation does not purchase, add inventory, or publish.</p></div>{offerSummary.lineCount ? <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">{offerSummary.groupCount} lines · {offerSummary.unitCount} units · {offerSummary.lineCount} scans</span> : null}</div>
        {valuationSummary.unitCount ? <><dl className="mt-4 grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">TCG Low total · USD</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-white">{money(valuationSummary.tcgLow.totalCents, "USD")}</dd><p className="mt-1 text-xs text-zinc-500">{valuationSummary.tcgLow.coveredUnits} of {valuationSummary.unitCount} units covered</p></div><div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">TCG Market total · USD</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-white">{money(valuationSummary.tcgMarket.totalCents, "USD")}</dd><p className="mt-1 text-xs text-zinc-500">{valuationSummary.tcgMarket.coveredUnits} of {valuationSummary.unitCount} units covered</p></div><div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Liga low total · BRL</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-white">{money(valuationSummary.regionalLow.totalCentavos, "BRL")}</dd><p className="mt-1 text-xs text-zinc-500">{valuationSummary.regionalLow.coveredUnits} of {valuationSummary.unitCount} units · {valuationSummary.regionalLow.providers.join(" + ") || "No regional coverage"}</p></div><div className="rounded-xl border border-emerald-900 bg-emerald-950/25 p-4"><dt className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Suggested offer · USD</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-emerald-100">{money(valuationSummary.suggestedOffer.totalCents, "USD")}</dd><p className="mt-1 text-xs text-emerald-300/70">80% of TCG Low · {valuationSummary.suggestedOffer.coveredUnits} of {valuationSummary.unitCount} units covered</p></div></dl><p className="mt-2 text-xs text-zinc-600">Liga totals are regional reference evidence and retain their source condition/language; they are not silently converted to the selected card grade.</p></> : null}
        {offerSummary.groups.length ? <ul className="mt-4 space-y-2">{offerSummary.groups.map((group) => { const identity = group.candidate?.catalogueIdentity; return <li key={group.groupId} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{identity?.name ?? group.candidate?.canonicalPrintingId}</p><p className="mt-1 text-xs leading-5 text-zinc-400">{identity ? `${identity.setName} · ${identity.collectorNumber ?? "No collector number"}` : group.candidate?.canonicalPrintingId}</p><p className="mt-1 text-xs text-zinc-500">{conditionLabel(group.condition)} · {group.finish} · {group.evidenceRegionIds.length} {group.evidenceRegionIds.length === 1 ? "scan" : "scans"}</p></div><span className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-200">Qty {group.quantity}</span></div><div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-zinc-800 pt-3"><p className="text-xs text-zinc-500">{new Intl.NumberFormat("en-US", { style: "currency", currency: group.currency }).format(group.unitOfferCents / 100)} each</p><p className="text-lg font-semibold tabular-nums text-emerald-300">{new Intl.NumberFormat("en-US", { style: "currency", currency: group.currency }).format(group.subtotalCents / 100)}</p></div></li>; })}</ul> : <div className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-500">No offer-ready cards.</div>}
      </div>
    </section>
  </div>;
}
