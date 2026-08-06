"use client";

import { useEffect, useState } from "react";
import type { RecognitionOfferSummary, ScanSessionSummary } from "@/lib/cardRecognition/repository";
import type { RecognitionDecision } from "@/lib/cardRecognition/contracts";

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

function conditionLabel(value: string): string {
  return batchConditions.find((condition) => condition.value === value)?.label ?? value.replaceAll("_", " ");
}

function sameFinish(left: string | undefined, right: string | undefined): boolean {
  return Boolean(left && right && left.localeCompare(right, undefined, { sensitivity: "base" }) === 0);
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
  const [label, setLabel] = useState("");
  const [newBatchCondition, setNewBatchCondition] = useState("");
  const [newBatchFinish, setNewBatchFinish] = useState("");
  const [batchConditionDraft, setBatchConditionDraft] = useState("");
  const [batchFinishDraft, setBatchFinishDraft] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<RecognitionReviewItem[]>([]);
  const [offerSummary, setOfferSummary] = useState<RecognitionOfferSummary>(emptyOfferSummary);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [offerDollars, setOfferDollars] = useState("");
  const [priceSnapshotId, setPriceSnapshotId] = useState("");
  const [priceSnapshotAt, setPriceSnapshotAt] = useState("");
  const [buyingPresetId, setBuyingPresetId] = useState("custom");
  const [referenceCents, setReferenceCents] = useState<number | null>(null);

  async function load() {
    setBusy(true);
    try {
      const response = await fetch("/api/card-recognition/sessions", { cache: "no-store" });
      const payload = await response.json() as { sessions?: ScanSessionSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Session status is unavailable.");
      const nextSessions = payload.sessions ?? [];
      setSessions(nextSessions);
      if (nextSessions[0]) {
        const activeSession = nextSessions[0];
        setBatchConditionDraft(activeSession.batchMaterial?.conditionCode ?? "");
        setBatchFinishDraft(activeSession.batchMaterial?.finish ?? "");
        const detailResponse = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(nextSessions[0].id)}`, { cache: "no-store" });
        const detail = await detailResponse.json() as { items?: typeof items; offerSummary?: RecognitionOfferSummary; error?: string };
        if (!detailResponse.ok) throw new Error(detail.error ?? "Session detail is unavailable.");
        const nextItems = detail.items ?? [];
        setItems(nextItems);
        setOfferSummary(detail.offerSummary ?? emptyOfferSummary);
        const nextUnresolved = nextItems.find((item) => !item.resolved && item.decision && (item.status === "REVIEW" || item.status === "ABSTAINED"));
        const nextCandidate = activeSession.batchMaterial
          ? nextUnresolved?.decision?.candidates.find((candidate) => sameFinish(candidate.catalogueIdentity?.variant, activeSession.batchMaterial?.finish)) ?? null
          : null;
        setSelectedCandidateId(nextCandidate?.canonicalPrintingId ?? "");
        setPriceSnapshotId(""); setPriceSnapshotAt(""); setReferenceCents(null);
      } else { setItems([]); setOfferSummary(emptyOfferSummary); setBatchConditionDraft(""); setBatchFinishDraft(""); setSelectedCandidateId(""); }
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Session status is unavailable."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => { void load(); }, 0);
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
      setLabel("");
      setNewBatchCondition(""); setNewBatchFinish("");
      setBatchConditionDraft(payload.session.batchMaterial?.conditionCode ?? ""); setBatchFinishDraft(payload.session.batchMaterial?.finish ?? "");
      setItems([]); setOfferSummary(emptyOfferSummary); setSelectedCandidateId("");
      setMessage("Homogeneous batch created. Import a sealed Windows bridge bundle to begin durable recognition.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Session could not be created."); }
    finally { setBusy(false); }
  }

  async function configureBatchMaterial(event: React.FormEvent) {
    event.preventDefault();
    const activeSession = sessions[0];
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
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Batch material could not be configured."); }
    finally { setBusy(false); }
  }

  async function cancelActiveSession() {
    const activeSession = sessions[0];
    if (!canOperate || !activeSession || activeSession.state === "CANCELLED") return;
    const confirmed = window.confirm("Cancel this Phronesis scan session? Existing scan evidence will be retained. PaperStream is controlled separately and will not be stopped by this action.");
    if (!confirmed) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(activeSession.id)}`, { method: "DELETE" });
      const payload = await response.json() as { session?: ScanSessionSummary; error?: string };
      if (!response.ok || !payload.session) throw new Error(payload.error ?? "Scan session could not be cancelled.");
      setMessage("Phronesis session cancelled. Existing evidence was retained; start a new batch when PaperStream is ready.");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Scan session could not be cancelled."); }
    finally { setBusy(false); }
  }

  const active = sessions[0];
  const unresolved = items.find((item) => !item.resolved && item.decision && (item.status === "REVIEW" || item.status === "ABSTAINED"));
  const allCandidateOptions = unresolved?.decision?.candidates ?? [];
  const candidateOptions = active?.batchMaterial
    ? allCandidateOptions.filter((candidate) => sameFinish(candidate.catalogueIdentity?.variant, active.batchMaterial?.finish))
    : [];
  const selectedCandidate = candidateOptions.find((candidate) => candidate.canonicalPrintingId === selectedCandidateId)
    ?? candidateOptions[0]
    ?? null;

  function chooseCandidate(canonicalPrintingId: string) {
    const candidate = candidateOptions.find((option) => option.canonicalPrintingId === canonicalPrintingId);
    if (!candidate) return;
    setSelectedCandidateId(canonicalPrintingId);
    setPriceSnapshotId("");
    setPriceSnapshotAt("");
    setReferenceCents(null);
  }

  async function resolveCurrent(event: React.FormEvent) {
    event.preventDefault();
    if (!active || !unresolved || !selectedCandidate) return;
    const cents = Math.round(Number(offerDollars) * 100);
    setBusy(true);
    try {
      const response = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(active.id)}`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ regionId: unresolved.regionId, canonicalPrintingId: selectedCandidate.canonicalPrintingId, quantity, priceSnapshotId, priceSnapshotAt, buyingPresetId, offerCents: cents, currency: "USD" }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Exception could not be resolved.");
      setMessage("Identity confirmed against the batch material. The card is now in the local offer draft.");
      setQuantity(1); setOfferDollars(""); setPriceSnapshotId(""); setPriceSnapshotAt(""); setReferenceCents(null);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Exception could not be resolved."); }
    finally { setBusy(false); }
  }

  async function loadPriceSnapshot() {
    if (!selectedCandidate || !active?.batchMaterial) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/card-recognition/pricing?category=${encodeURIComponent(selectedCandidate.categoryId)}&sku=${encodeURIComponent(selectedCandidate.sku)}&condition=${encodeURIComponent(active.batchMaterial.conditionCode)}`, { cache: "no-store" });
      const payload = await response.json() as { snapshot?: { priceSnapshotId: string; priceSnapshotAt: string; referenceCents: number }; error?: string };
      if (!response.ok || !payload.snapshot) throw new Error(payload.error ?? "Price evidence is unavailable.");
      setPriceSnapshotId(payload.snapshot.priceSnapshotId);
      setPriceSnapshotAt(payload.snapshot.priceSnapshotAt);
      setReferenceCents(payload.snapshot.referenceCents);
      setMessage("Exact condition price evidence loaded. Choose the buying preset and offer amount.");
    } catch (error) { setPriceSnapshotId(""); setPriceSnapshotAt(""); setReferenceCents(null); setMessage(error instanceof Error ? error.message : "Price evidence is unavailable."); }
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
      <div><h2 id="session-title" className="text-xl font-semibold">Capture session</h2><p className="mt-1 text-sm text-zinc-500">Create one homogeneous condition-and-finish batch. Originals stay content-addressed; retries cannot duplicate a frame.</p></div>
      <form onSubmit={createSession} className="mt-4 grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(10rem,.7fr)_minmax(11rem,.7fr)_auto]">
        <label className="text-xs text-zinc-400" htmlFor="scan-session-label">Batch label<input id="scan-session-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Event or batch label" maxLength={120} className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30" /></label>
        <label className="text-xs text-zinc-400" htmlFor="new-batch-condition">Batch condition<select id="new-batch-condition" required value={newBatchCondition} onChange={(event) => setNewBatchCondition(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white"><option value="" disabled>Select condition</option>{batchConditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</select></label>
        <label className="text-xs text-zinc-400" htmlFor="new-batch-finish">Batch finish<select id="new-batch-finish" required value={newBatchFinish} onChange={(event) => setNewBatchFinish(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white"><option value="" disabled>Select finish</option>{batchFinishes.map((finish) => <option key={finish} value={finish}>{finish}</option>)}</select></label>
        <button disabled={!canOperate || busy || !newBatchCondition || !newBatchFinish} className="min-h-11 self-end rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">New batch</button>
      </form>
      <p className="mt-3 min-h-6 text-sm text-amber-200" aria-live="polite">{message}</p>
      {active ? <div className="mt-3">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-zinc-100">{active.label}</p><p className="text-xs text-zinc-500">{active.id}</p></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">{active.state.replaceAll("_", " ")}</span>{active.state !== "CANCELLED" ? <button type="button" onClick={() => void cancelActiveSession()} disabled={!canOperate || busy} className="min-h-11 rounded-lg border border-red-800 px-3 text-sm font-semibold text-red-200 disabled:cursor-not-allowed disabled:opacity-50">Cancel</button> : null}</div></div>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"><Count label="Frames" value={active.counts.frames} /><Count label="Regions" value={active.counts.regions} /><Count label="Processing" value={active.counts.pending} /><Count label="Review" value={active.counts.review} /><Count label="Accepted" value={active.counts.accepted} /><Count label="Abstained" value={active.counts.abstained} /><Count label="Failed" value={active.counts.failed} /></dl>
        {active.state !== "CANCELLED" ? <form onSubmit={configureBatchMaterial} className={`mt-4 grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,1fr)_minmax(11rem,1fr)_auto] ${active.batchMaterial ? "border-emerald-900 bg-emerald-950/20" : "border-amber-900 bg-amber-950/20"}`}>
          <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs font-semibold uppercase tracking-wider text-zinc-200">Batch material</p><p className="mt-1 text-xs leading-5 text-zinc-400">Every card in this session uses one condition and one finish. Split mixed cards into separate batches. Scanner images do not assign either value.</p>{active.batchMaterial ? <p className="mt-1 text-xs text-emerald-300">Revision {active.batchMaterial.revision} · {active.batchMaterial.locked ? "Locked after first resolution" : "Editable until first resolution"}</p> : <p className="mt-1 text-xs text-amber-200">Required before price evidence or resolution.</p>}</div>
          <label className="text-xs text-zinc-400" htmlFor="active-batch-condition">Batch condition<select id="active-batch-condition" required disabled={active.batchMaterial?.locked} value={batchConditionDraft} onChange={(event) => { setBatchConditionDraft(event.target.value); setPriceSnapshotId(""); setPriceSnapshotAt(""); setReferenceCents(null); }} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60"><option value="" disabled>Select condition</option>{batchConditions.map((condition) => <option key={condition.value} value={condition.value}>{condition.label}</option>)}</select></label>
          <label className="text-xs text-zinc-400" htmlFor="active-batch-finish">Batch finish<select id="active-batch-finish" required disabled={active.batchMaterial?.locked} value={batchFinishDraft} onChange={(event) => { setBatchFinishDraft(event.target.value); setPriceSnapshotId(""); setPriceSnapshotAt(""); setReferenceCents(null); }} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white disabled:cursor-not-allowed disabled:opacity-60"><option value="" disabled>Select finish</option>{batchFinishes.map((finish) => <option key={finish} value={finish}>{finish}</option>)}</select></label>
          <button disabled={!canOperate || busy || active.batchMaterial?.locked || !batchConditionDraft || !batchFinishDraft} className="min-h-11 self-end rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50">{active.batchMaterial ? "Update batch" : "Set batch"}</button>
        </form> : <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-400">This session is cancelled. Its evidence remains retained. Create a new batch above when PaperStream is ready.</p>}
      </div> : <div className="mt-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-500">{busy ? "Loading sessions…" : "No recognition session yet. Create one, then import the sealed bridge batch."}</div>}
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Resolve exceptions</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Machine identity candidates remain review-only. Condition and finish come from the declared homogeneous batch, not from automatic grading.</p></div><button type="button" onClick={() => void load()} disabled={busy} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300">Refresh</button></div>
        {unresolved ? <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="grid content-start gap-3" aria-label="Duplex scan evidence">
            <figure className="rounded-lg border border-zinc-800 bg-zinc-950 p-2">
              <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">{unresolved.side === "FRONT" ? "Front evidence" : "Scanned evidence"}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated content-addressed scan evidence is not a public optimization source. */}
              <img src={`/api/card-recognition/frames/${encodeURIComponent(unresolved.frameId)}`} alt={unresolved.side === "FRONT" ? "Current card front evidence" : "Current scanned card evidence"} className="max-h-[32rem] w-full rounded-md bg-zinc-950 object-contain" />
            </figure>
            {unresolved.pairedFrameId ? <figure className="rounded-lg border border-zinc-800 bg-zinc-950 p-2">
              <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">Paired reverse evidence</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element -- authenticated content-addressed scan evidence is not a public optimization source. */}
              <img src={`/api/card-recognition/frames/${encodeURIComponent(unresolved.pairedFrameId)}`} alt="Acquisition-proven paired card reverse evidence" className="max-h-[32rem] w-full rounded-md bg-zinc-950 object-contain" />
              <p className="mt-2 text-xs leading-5 text-zinc-500">Linked by the validated duplex acquisition manifest. Evidence only; no automatic grading.</p>
            </figure> : <div className="rounded-lg border border-dashed border-amber-900 bg-amber-950/20 p-3 text-xs leading-5 text-amber-200">
              <p className="font-semibold uppercase tracking-wider">Paired reverse unavailable</p>
              <p className="mt-1 text-amber-100/70">This legacy frame has no acquisition-proven reverse. Phronesis will not infer one from filename or scan order; the batch declaration remains authoritative.</p>
            </div>}
          </div>
          <form onSubmit={resolveCurrent} className="space-y-3"><div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-300">{unresolved.status}</p><p className="mt-2 break-all text-sm font-semibold text-zinc-100">{selectedCandidate?.canonicalPrintingId ?? "No machine candidate"}</p><p className="mt-1 text-xs text-zinc-500">{unresolved.decision?.reason}</p></div>
            {selectedCandidate ? <>{candidateOptions.length ? <fieldset className="space-y-2"><legend className="text-xs font-semibold text-zinc-300">Select exact Pokémon printing</legend>{candidateOptions.map((candidate) => { const identity = candidate.catalogueIdentity; return <label key={candidate.canonicalPrintingId} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 ${candidate.canonicalPrintingId === selectedCandidate.canonicalPrintingId ? "border-cyan-500 bg-cyan-950/30" : "border-zinc-800 bg-zinc-950"}`}><input type="radio" name="recognition-candidate" value={candidate.canonicalPrintingId} checked={candidate.canonicalPrintingId === selectedCandidate.canonicalPrintingId} onChange={() => chooseCandidate(candidate.canonicalPrintingId)} className="mt-1 size-4 accent-cyan-300" /><span className="min-w-0 text-sm"><span className="block font-semibold text-zinc-100">{identity?.name ?? candidate.canonicalPrintingId}</span><span className="mt-1 block text-xs leading-5 text-zinc-400">{identity ? `${identity.setName} · ${identity.collectorNumber ?? "No collector number"} · ${identity.variant} · ${identity.language}` : candidate.canonicalPrintingId}</span><span className="mt-1 block text-xs text-zinc-600">Rank {candidate.rank} · OCR evidence {Math.round(candidate.score * 100)}%</span></span></label>; })}</fieldset> : null}<div className="rounded-lg border border-emerald-900 bg-emerald-950/20 p-3 text-sm text-emerald-100"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Batch material applied</p><p className="mt-1">{active?.batchMaterial ? `${conditionLabel(active.batchMaterial.conditionCode)} · ${active.batchMaterial.finish}` : "Not configured"}</p></div>
            <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-zinc-400">Quantity<input required type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label><label className="block text-xs text-zinc-400">Offer USD<input required type="number" min="0" step="0.01" value={offerDollars} onChange={(event) => setOfferDollars(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label></div>
            <button type="button" onClick={() => void loadPriceSnapshot()} disabled={busy || !active?.batchMaterial} className="min-h-11 w-full rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50">Load batch-condition price evidence</button>
            {priceSnapshotId ? <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-200"><p>Reference: {referenceCents === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(referenceCents / 100)}</p><p className="mt-1 break-all text-emerald-300/70">{priceSnapshotId}</p><p className="mt-1">{priceSnapshotAt}</p></div> : null}
            <label className="block text-xs text-zinc-400">Buying preset ID<input required value={buyingPresetId} onChange={(event) => setBuyingPresetId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label>
            <button disabled={!canOperate || busy || !priceSnapshotId || offerDollars === ""} className="min-h-12 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-50">Confirm and add to draft</button></> : <p className="rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">{!active?.batchMaterial ? "Set the batch condition and finish before resolving cards." : allCandidateOptions.length ? `No candidate matches the ${active.batchMaterial.finish} batch. Move this card to the matching finish batch; Phronesis will not override the declaration.` : "No candidate is safe to select. Use canonical search before resolving this abstention."}</p>}
          </form>
        </div> : <div className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-500">No unresolved machine recommendation is available.</div>}
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Offer draft</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Exact commercial bindings consolidate into quantities while every contributing scan remains traceable. Draft generation does not purchase, add inventory, or publish.</p></div>{offerSummary.lineCount ? <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">{offerSummary.groupCount} lines · {offerSummary.unitCount} units · {offerSummary.lineCount} scans</span> : null}</div>
        {offerSummary.totals.length ? <dl className="mt-4 grid gap-2 sm:grid-cols-2">{offerSummary.totals.map((total) => <div key={total.currency} className="rounded-xl border border-emerald-900 bg-emerald-950/25 p-4"><dt className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Lot total · {total.currency}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums text-emerald-100">{new Intl.NumberFormat("en-US", { style: "currency", currency: total.currency }).format(total.totalCents / 100)}</dd></div>)}</dl> : null}
        {offerSummary.groups.length ? <ul className="mt-4 space-y-2">{offerSummary.groups.map((group) => { const identity = group.candidate?.catalogueIdentity; return <li key={group.groupId} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words text-sm font-semibold">{identity?.name ?? group.candidate?.canonicalPrintingId}</p><p className="mt-1 text-xs leading-5 text-zinc-400">{identity ? `${identity.setName} · ${identity.collectorNumber ?? "No collector number"}` : group.candidate?.canonicalPrintingId}</p><p className="mt-1 text-xs text-zinc-500">{conditionLabel(group.condition)} · {group.finish} · {group.evidenceRegionIds.length} {group.evidenceRegionIds.length === 1 ? "scan" : "scans"}</p></div><span className="shrink-0 rounded-full border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-200">Qty {group.quantity}</span></div><div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-zinc-800 pt-3"><p className="text-xs text-zinc-500">{new Intl.NumberFormat("en-US", { style: "currency", currency: group.currency }).format(group.unitOfferCents / 100)} each</p><p className="text-lg font-semibold tabular-nums text-emerald-300">{new Intl.NumberFormat("en-US", { style: "currency", currency: group.currency }).format(group.subtotalCents / 100)}</p></div></li>; })}</ul> : <div className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-500">No offer-ready cards.</div>}
      </div>
    </section>
  </div>;
}
