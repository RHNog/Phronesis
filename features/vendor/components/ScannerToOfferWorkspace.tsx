"use client";

import { useEffect, useState } from "react";
import type { ScanSessionSummary } from "@/lib/cardRecognition/repository";
import type { RecognitionDecision } from "@/lib/cardRecognition/contracts";

const stages = ["Capture", "Resolve", "Offer"] as const;

function Count({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{value}</dd></div>;
}

export default function ScannerToOfferWorkspace({ canOperate }: { canOperate: boolean }) {
  const [sessions, setSessions] = useState<ScanSessionSummary[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const [items, setItems] = useState<Array<{ frameId: string; regionId: string; status: string; decision: RecognitionDecision | null; resolved: boolean }>>([]);
  const [offer, setOffer] = useState<Array<{ regionId: string; candidate: { canonicalPrintingId: string } | null; condition: string; finish: string; quantity: number; offerCents: number; currency: string }>>([]);
  const [condition, setCondition] = useState("NEAR_MINT");
  const [finish, setFinish] = useState("Normal");
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
        const detailResponse = await fetch(`/api/card-recognition/sessions/${encodeURIComponent(nextSessions[0].id)}`, { cache: "no-store" });
        const detail = await detailResponse.json() as { items?: typeof items; offer?: typeof offer; error?: string };
        if (!detailResponse.ok) throw new Error(detail.error ?? "Session detail is unavailable.");
        const nextItems = detail.items ?? [];
        setItems(nextItems);
        setOffer(detail.offer ?? []);
        const nextUnresolved = nextItems.find((item) => !item.resolved && item.decision && (item.status === "REVIEW" || item.status === "ABSTAINED"));
        const nextCandidate = nextUnresolved?.decision?.selectedCandidate ?? nextUnresolved?.decision?.candidates[0] ?? null;
        setSelectedCandidateId(nextCandidate?.canonicalPrintingId ?? "");
        setFinish(nextCandidate?.catalogueIdentity?.variant ?? "Normal");
      } else { setItems([]); setOffer([]); }
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
      const response = await fetch("/api/card-recognition/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label }) });
      const payload = await response.json() as { session?: ScanSessionSummary; error?: string };
      if (!response.ok || !payload.session) throw new Error(payload.error ?? "Session could not be created.");
      setSessions((current) => [payload.session!, ...current]);
      setLabel("");
      setMessage("Session created. Import a sealed Windows bridge bundle to begin durable recognition.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Session could not be created."); }
    finally { setBusy(false); }
  }

  const active = sessions[0];
  const unresolved = items.find((item) => !item.resolved && item.decision && (item.status === "REVIEW" || item.status === "ABSTAINED"));
  const candidateOptions = unresolved?.decision?.candidates ?? [];
  const selectedCandidate = candidateOptions.find((candidate) => candidate.canonicalPrintingId === selectedCandidateId)
    ?? unresolved?.decision?.selectedCandidate
    ?? candidateOptions[0]
    ?? null;

  function chooseCandidate(canonicalPrintingId: string) {
    const candidate = candidateOptions.find((option) => option.canonicalPrintingId === canonicalPrintingId);
    if (!candidate) return;
    setSelectedCandidateId(canonicalPrintingId);
    setFinish(candidate.catalogueIdentity?.variant ?? "Normal");
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
        body: JSON.stringify({ regionId: unresolved.regionId, canonicalPrintingId: selectedCandidate.canonicalPrintingId, condition, finish, quantity, priceSnapshotId, priceSnapshotAt, buyingPresetId, offerCents: cents, currency: "USD" }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Exception could not be resolved.");
      setMessage("Identity and material fields confirmed. The card is now in the local offer draft.");
      setOfferDollars(""); setPriceSnapshotId(""); setPriceSnapshotAt("");
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Exception could not be resolved."); }
    finally { setBusy(false); }
  }

  async function loadPriceSnapshot() {
    if (!selectedCandidate) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/card-recognition/pricing?category=${encodeURIComponent(selectedCandidate.categoryId)}&sku=${encodeURIComponent(selectedCandidate.sku)}&condition=${encodeURIComponent(condition)}`, { cache: "no-store" });
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 id="session-title" className="text-xl font-semibold">Capture session</h2><p className="mt-1 text-sm text-zinc-500">Originals stay content-addressed; retries cannot duplicate a frame.</p></div>
        <form onSubmit={createSession} className="flex w-full flex-col gap-2 sm:max-w-lg sm:flex-row">
          <label className="sr-only" htmlFor="scan-session-label">Session label</label>
          <input id="scan-session-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Event or batch label" maxLength={120} className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30" />
          <button disabled={!canOperate || busy} className="min-h-11 rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">New session</button>
        </form>
      </div>
      <p className="mt-3 min-h-6 text-sm text-amber-200" aria-live="polite">{message}</p>
      {active ? <div className="mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="font-semibold text-zinc-100">{active.label}</p><p className="text-xs text-zinc-500">{active.id}</p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-300">{active.state.replaceAll("_", " ")}</span></div>
        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7"><Count label="Frames" value={active.counts.frames} /><Count label="Regions" value={active.counts.regions} /><Count label="Processing" value={active.counts.pending} /><Count label="Review" value={active.counts.review} /><Count label="Accepted" value={active.counts.accepted} /><Count label="Abstained" value={active.counts.abstained} /><Count label="Failed" value={active.counts.failed} /></dl>
      </div> : <div className="mt-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-6 text-sm text-zinc-500">{busy ? "Loading sessions…" : "No recognition session yet. Create one, then import the sealed bridge batch."}</div>}
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Resolve exceptions</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Machine candidates remain review-only until a powered unseen holdout qualifies an acceptance policy. Condition and price-material finish require explicit confirmation.</p></div><button type="button" onClick={() => void load()} disabled={busy} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-sm text-zinc-300">Refresh</button></div>
        {unresolved ? <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* eslint-disable-next-line @next/next/no-img-element -- authenticated content-addressed scan evidence is not a public optimization source. */}
          <img src={`/api/card-recognition/frames/${encodeURIComponent(unresolved.frameId)}`} alt="Current scanned card evidence" className="max-h-[32rem] w-full rounded-lg border border-zinc-800 bg-zinc-950 object-contain" />
          <form onSubmit={resolveCurrent} className="space-y-3"><div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="text-xs font-semibold uppercase tracking-wider text-amber-300">{unresolved.status}</p><p className="mt-2 break-all text-sm font-semibold text-zinc-100">{selectedCandidate?.canonicalPrintingId ?? "No machine candidate"}</p><p className="mt-1 text-xs text-zinc-500">{unresolved.decision?.reason}</p></div>
            {selectedCandidate ? <>{candidateOptions.length ? <fieldset className="space-y-2"><legend className="text-xs font-semibold text-zinc-300">Select exact Pokémon printing and finish</legend>{candidateOptions.map((candidate) => { const identity = candidate.catalogueIdentity; return <label key={candidate.canonicalPrintingId} className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border p-3 ${candidate.canonicalPrintingId === selectedCandidate.canonicalPrintingId ? "border-cyan-500 bg-cyan-950/30" : "border-zinc-800 bg-zinc-950"}`}><input type="radio" name="recognition-candidate" value={candidate.canonicalPrintingId} checked={candidate.canonicalPrintingId === selectedCandidate.canonicalPrintingId} onChange={() => chooseCandidate(candidate.canonicalPrintingId)} className="mt-1 size-4 accent-cyan-300" /><span className="min-w-0 text-sm"><span className="block font-semibold text-zinc-100">{identity?.name ?? candidate.canonicalPrintingId}</span><span className="mt-1 block text-xs leading-5 text-zinc-400">{identity ? `${identity.setName} · ${identity.collectorNumber ?? "No collector number"} · ${identity.variant} · ${identity.language}` : candidate.canonicalPrintingId}</span><span className="mt-1 block text-xs text-zinc-600">Rank {candidate.rank} · OCR evidence {Math.round(candidate.score * 100)}%</span></span></label>; })}</fieldset> : null}<label className="block text-xs text-zinc-400">Condition<select value={condition} onChange={(event) => { setCondition(event.target.value); setPriceSnapshotId(""); setPriceSnapshotAt(""); setReferenceCents(null); }} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white"><option value="NEAR_MINT">Near Mint</option><option value="LIGHTLY_PLAYED">Lightly Played</option><option value="MODERATELY_PLAYED">Moderately Played</option><option value="HEAVILY_PLAYED">Heavily Played</option><option value="DAMAGED">Damaged</option></select></label>
            <label className="block text-xs text-zinc-400">Catalogue finish bound to selected SKU<input required readOnly value={finish} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-300" /></label>
            <div className="grid grid-cols-2 gap-2"><label className="block text-xs text-zinc-400">Quantity<input required type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label><label className="block text-xs text-zinc-400">Offer USD<input required type="number" min="0" step="0.01" value={offerDollars} onChange={(event) => setOfferDollars(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label></div>
            <button type="button" onClick={() => void loadPriceSnapshot()} disabled={busy} className="min-h-11 w-full rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200">Load exact-condition price evidence</button>
            {priceSnapshotId ? <div className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-200"><p>Reference: {referenceCents === null ? "Unavailable" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(referenceCents / 100)}</p><p className="mt-1 break-all text-emerald-300/70">{priceSnapshotId}</p><p className="mt-1">{priceSnapshotAt}</p></div> : null}
            <label className="block text-xs text-zinc-400">Buying preset ID<input required value={buyingPresetId} onChange={(event) => setBuyingPresetId(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label>
            <button disabled={!canOperate || busy} className="min-h-12 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-50">Confirm and add to draft</button></> : <p className="rounded-lg border border-amber-900 bg-amber-950/30 p-3 text-sm text-amber-200">No candidate is safe to select. Use canonical search before resolving this abstention.</p>}
          </form>
        </div> : <div className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-500">No unresolved machine recommendation is available.</div>}
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"><h2 className="text-lg font-semibold">Offer draft</h2><p className="mt-2 text-sm leading-6 text-zinc-400">Only operator-resolved assets with explicit price and preset bindings appear here. Draft generation does not purchase, add inventory, or publish.</p>{offer.length ? <ul className="mt-4 space-y-2">{offer.map((line) => <li key={line.regionId} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><p className="break-all text-sm font-semibold">{line.candidate?.canonicalPrintingId}</p><p className="mt-1 text-xs text-zinc-400">{line.quantity} × {line.condition.replaceAll("_", " ")} · {line.finish}</p><p className="mt-2 text-lg font-semibold tabular-nums text-emerald-300">{new Intl.NumberFormat("en-US", { style: "currency", currency: line.currency }).format(line.offerCents / 100)}</p></li>)}</ul> : <div className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-500">No offer-ready cards.</div>}</div>
    </section>
  </div>;
}
