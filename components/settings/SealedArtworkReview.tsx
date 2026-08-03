"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type ReviewState = "PENDING" | "ACCEPTED" | "REJECTED";
type ReviewCandidate = {
  sku: string;
  sourcePath: string;
  sourceUrl: string;
  productClass: string;
  reason: string;
  rank: number;
  state: ReviewState;
  reviewedAt: string | null;
};
type ReviewProduct = {
  categoryId: string;
  sku: string;
  name: string;
  setName: string;
  productClass: string;
  reason: string;
  candidates: ReviewCandidate[];
};
type ReviewQueue = {
  items: ReviewProduct[];
  page: { limit: number; offset: number; total: number };
  summary: {
    exact: number;
    representative: number;
    ownerRepresentative: number;
    assistedRepresentative: number;
    visible: number;
    totalSealed: number;
    pending: number;
    accepted: number;
    rejected: number;
  };
};

const emptyQueue: ReviewQueue = {
  items: [],
  page: { limit: 6, offset: 0, total: 0 },
  summary: { exact: 0, representative: 0, ownerRepresentative: 0, assistedRepresentative: 0, visible: 0, totalSealed: 0, pending: 0, accepted: 0, rejected: 0 },
};

function percentage(value: number, total: number): string {
  return total ? `${((value / total) * 100).toFixed(2)}%` : "0.00%";
}

function label(value: string): string {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function SealedArtworkReview() {
  const [queue, setQueue] = useState<ReviewQueue>(emptyQueue);
  const [state, setState] = useState<ReviewState>("PENDING");
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const params = new URLSearchParams({ state, q: query.trim(), limit: "6", offset: String(offset) });
    const response = await fetch(`/api/administration/sealed-artwork-review?${params}`, { signal });
    const body = await response.json() as ReviewQueue & { error?: string };
    if (!response.ok) throw new Error(body.error ?? "Artwork review queue could not be loaded.");
    setQueue(body);
  }, [offset, query, state]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void load(controller.signal).catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMessage(error instanceof Error ? error.message : "Artwork review queue could not be loaded.");
        }
      });
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [load]);

  async function mutate(action: "ACCEPT" | "REJECT" | "RESTORE" | "UNDO", product: ReviewProduct, candidate: ReviewCandidate) {
    setBusy(true);
    setMessage("Recording review…");
    try {
      const response = await fetch("/api/administration/sealed-artwork-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, categoryId: product.categoryId, sku: product.sku, sourceUrl: candidate.sourceUrl }),
      });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Review decision could not be recorded.");
      setMessage(action === "ACCEPT" ? "Representative image approved." : action === "UNDO" ? "Approval undone." : action === "REJECT" ? "Candidate rejected." : "Candidate restored.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review decision could not be recorded.");
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    setMessage("Refreshing candidate metadata from the community source…");
    try {
      const response = await fetch("/api/administration/sealed-artwork-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "REFRESH" }),
      });
      const body = await response.json() as { error?: string; reviewProducts?: number; reviewCandidates?: number; durationMs?: number };
      if (!response.ok) throw new Error(body.error ?? "Candidate refresh failed.");
      setOffset(0);
      setMessage(`${(body.reviewProducts ?? 0).toLocaleString()} products and ${(body.reviewCandidates ?? 0).toLocaleString()} candidates staged in ${((body.durationMs ?? 0) / 1000).toFixed(1)}s.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Candidate refresh failed.");
    } finally {
      setBusy(false);
    }
  }

  async function assist() {
    setBusy(true);
    setMessage("Applying the conservative assisted-recovery policy…");
    try {
      const response = await fetch("/api/administration/sealed-artwork-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "ASSIST" }),
      });
      const body = await response.json() as { error?: string; applied?: number; alreadyApplied?: number; eligible?: number; skipped?: number; durationMs?: number };
      if (!response.ok) throw new Error(body.error ?? "Assisted artwork recovery failed.");
      setOffset(0);
      setMessage(`${(body.applied ?? 0).toLocaleString()} representative images applied; ${(body.alreadyApplied ?? 0).toLocaleString()} already current and ${(body.skipped ?? 0).toLocaleString()} unsafe ambiguities left for review. Completed in ${((body.durationMs ?? 0) / 1000).toFixed(1)}s.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Assisted artwork recovery failed.");
    } finally {
      setBusy(false);
    }
  }

  const { summary } = queue;
  return (
    <section aria-labelledby="sealed-artwork-review-title" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Artwork operations</p>
          <h3 id="sealed-artwork-review-title" className="mt-2 text-xl font-semibold text-white">Pokémon sealed image review</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Phronesis can recover safe exact-set representatives automatically. This queue keeps only the ambiguous exceptions for human review; neither path replaces or reclassifies exact artwork.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void assist()} disabled={busy} className="min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-50">Run safe recovery</button>
          <button type="button" onClick={() => void refresh()} disabled={busy} className="min-h-11 rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-200 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-50">Refresh candidates</button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs text-zinc-500">Exact</p><p className="mt-1 text-xl font-semibold text-white">{summary.exact.toLocaleString()}</p><p className="text-xs text-zinc-400">{percentage(summary.exact, summary.totalSealed)}</p></div>
        <div className="rounded-xl border border-cyan-900 bg-cyan-950/20 p-3"><p className="text-xs text-cyan-300">Assisted representative</p><p className="mt-1 text-xl font-semibold text-white">{summary.assistedRepresentative.toLocaleString()}</p><p className="text-xs text-zinc-400">{percentage(summary.assistedRepresentative, summary.totalSealed)}</p></div>
        <div className="rounded-xl border border-cyan-900 bg-cyan-950/20 p-3"><p className="text-xs text-cyan-300">Owner representative</p><p className="mt-1 text-xl font-semibold text-white">{summary.ownerRepresentative.toLocaleString()}</p><p className="text-xs text-zinc-400">{percentage(summary.ownerRepresentative, summary.totalSealed)}</p></div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs text-zinc-500">Visible total</p><p className="mt-1 text-xl font-semibold text-white">{summary.visible.toLocaleString()}</p><p className="text-xs text-zinc-400">{percentage(summary.visible, summary.totalSealed)}</p></div>
        <div className="rounded-xl border border-amber-900 bg-amber-950/20 p-3"><p className="text-xs text-amber-300">Pending products</p><p className="mt-1 text-xl font-semibold text-white">{summary.pending.toLocaleString()}</p><p className="text-xs text-zinc-400">of {summary.totalSealed.toLocaleString()} sealed</p></div>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Artwork review state">
          {(["PENDING", "ACCEPTED", "REJECTED"] as const).map((option) => (
            <button key={option} type="button" role="tab" aria-selected={state === option} onClick={() => { setState(option); setOffset(0); }} className={`min-h-11 rounded-lg border px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 ${state === option ? "border-cyan-400 bg-cyan-400 text-zinc-950" : "border-zinc-700 text-zinc-300"}`}>{label(option)} ({option === "PENDING" ? summary.pending : option === "ACCEPTED" ? summary.accepted : summary.rejected})</button>
          ))}
        </div>
        <label className="block text-xs font-medium text-zinc-400">Search queue<input value={query} onChange={(event) => { setQuery(event.target.value); setOffset(0); }} placeholder="Product, set, SKU, or source file" className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 lg:w-80" /></label>
      </div>

      {message ? <p role="status" className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-cyan-200">{message}</p> : null}

      <div aria-busy={busy} className="mt-4 space-y-4">
        {!queue.items.length ? <p className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">No {state.toLowerCase()} products in this view. Refresh candidates if the queue has not been staged yet.</p> : queue.items.map((product) => (
          <article key={product.sku} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h4 className="font-semibold text-white">{product.name}</h4><p className="mt-1 text-sm text-zinc-400">{product.setName} · {label(product.productClass)}</p><p className="mt-1 text-xs text-zinc-500">{label(product.reason)} · {product.sku}</p></div>
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${state === "PENDING" ? "border-amber-700 text-amber-200" : state === "ACCEPTED" ? "border-emerald-700 text-emerald-200" : "border-red-900 text-red-200"}`}>{state === "PENDING" ? "Human check required" : state === "ACCEPTED" ? "Representative active" : "Candidate rejected"}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {product.candidates.map((candidate) => (
                <div key={candidate.sourceUrl} className="min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 p-3">
                  <div className="relative h-60 overflow-hidden rounded-lg bg-zinc-900">
                    <Image unoptimized fill sizes="(max-width: 640px) 100vw, 320px" src={`/api/administration/sealed-artwork-review?source=${encodeURIComponent(candidate.sourceUrl)}`} alt={`Candidate artwork for ${product.name}`} className="object-contain p-2" />
                  </div>
                  <p className="mt-3 break-all font-mono text-[11px] leading-5 text-zinc-400">{candidate.sourcePath}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {state === "PENDING" ? <><button type="button" disabled={busy} onClick={() => void mutate("ACCEPT", product, candidate)} className="min-h-11 flex-1 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-zinc-950 disabled:opacity-50">Approve representative</button><button type="button" disabled={busy} onClick={() => void mutate("REJECT", product, candidate)} className="min-h-11 rounded-lg border border-red-900 px-3 text-sm font-semibold text-red-200 disabled:opacity-50">Reject</button></> : null}
                    {state === "ACCEPTED" ? <button type="button" disabled={busy} onClick={() => void mutate("UNDO", product, candidate)} className="min-h-11 w-full rounded-lg border border-amber-700 px-3 text-sm font-semibold text-amber-200 disabled:opacity-50">Undo approval</button> : null}
                    {state === "REJECTED" ? <button type="button" disabled={busy} onClick={() => void mutate("RESTORE", product, candidate)} className="min-h-11 w-full rounded-lg border border-cyan-700 px-3 text-sm font-semibold text-cyan-200 disabled:opacity-50">Restore candidate</button> : null}
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" disabled={offset === 0 || busy} onClick={() => setOffset(Math.max(0, offset - queue.page.limit))} className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 disabled:opacity-40">Previous</button>
        <span className="text-xs text-zinc-500">{queue.page.total ? `${offset + 1}–${Math.min(offset + queue.page.limit, queue.page.total)} of ${queue.page.total}` : "0 products"}</span>
        <button type="button" disabled={offset + queue.page.limit >= queue.page.total || busy} onClick={() => setOffset(offset + queue.page.limit)} className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300 disabled:opacity-40">Next</button>
      </div>
    </section>
  );
}
