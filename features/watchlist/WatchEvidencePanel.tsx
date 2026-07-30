"use client";

import { useEffect, useMemo, useState } from "react";
import type { MarketEvidenceRecord } from "@/types/marketEvidence";

type ProviderOutcome = {
  providerId: string;
  status: "DISABLED" | "SKIPPED" | "UPDATED" | "FAILED";
  count?: number;
  reason?: string;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

export default function WatchEvidencePanel({ entryId }: { entryId: string }) {
  const [records, setRecords] = useState<MarketEvidenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outcomes, setOutcomes] = useState<ProviderOutcome[]>([]);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [sourceUrl, setSourceUrl] = useState("");
  const [savingSale, setSavingSale] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/watchlists/${encodeURIComponent(entryId)}/evidence`, { signal: controller.signal })
      .then(async (response) => {
        const body = await response.json() as { records?: MarketEvidenceRecord[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "Market evidence could not load.");
        setRecords(body.records ?? []);
      })
      .catch((caught) => {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          setError(caught instanceof Error ? caught.message : "Market evidence could not load.");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [entryId]);

  const listings = useMemo(() => records.filter((record) => record.evidenceType === "ACTIVE_LISTING"), [records]);
  const sales = useMemo(() => records.filter((record) => record.evidenceType === "OBSERVED_SALE"), [records]);

  async function refreshListings() {
    setRefreshing(true);
    setError(null);
    try {
      const response = await fetch(`/api/watchlists/${encodeURIComponent(entryId)}/evidence/refresh`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      });
      const body = await response.json() as { records?: MarketEvidenceRecord[]; outcomes?: ProviderOutcome[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Listing refresh failed.");
      setRecords(body.records ?? []);
      setOutcomes(body.outcomes ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Listing refresh failed.");
    } finally {
      setRefreshing(false);
    }
  }

  async function recordSale() {
    const priceCents = Math.round(Number(price) * 100);
    const count = Number(quantity);
    if (!Number.isInteger(priceCents) || priceCents < 0 || !Number.isInteger(count) || count < 1) {
      setError("Enter a valid sale price and quantity.");
      return;
    }
    setSavingSale(true);
    setError(null);
    try {
      const response = await fetch(`/api/watchlists/${encodeURIComponent(entryId)}/evidence`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ priceCents, quantity: count, sourceUrl: sourceUrl || undefined }),
      });
      const body = await response.json() as { record?: MarketEvidenceRecord; error?: string };
      if (!response.ok || !body.record) throw new Error(body.error ?? "Observed sale could not be recorded.");
      setRecords((current) => [body.record!, ...current]);
      setPrice("");
      setQuantity("1");
      setSourceUrl("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Observed sale could not be recorded.");
    } finally {
      setSavingSale(false);
    }
  }

  return (
    <section aria-label="Listing and observed-sale evidence" className="col-span-full border-t border-zinc-800 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-100">Listings and observed sales</h4>
          <p className="mt-1 text-xs text-zinc-500">Asking listings, market estimates, and completed sales remain separate evidence.</p>
        </div>
        <button type="button" onClick={refreshListings} disabled={refreshing} className="min-h-11 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-cyan-300 hover:border-cyan-500 disabled:cursor-wait disabled:opacity-60">{refreshing ? "Refreshing…" : "Refresh official listings"}</button>
      </div>
      {loading ? <p className="mt-3 text-xs text-zinc-500">Loading saved evidence…</p> : null}
      {error ? <p role="alert" className="mt-3 text-xs text-amber-200">{error}</p> : null}
      {outcomes.length ? <ul className="mt-3 space-y-1 text-xs text-zinc-400">{outcomes.map((outcome) => <li key={outcome.providerId}><span className="font-semibold text-zinc-300">{outcome.providerId}</span>: {outcome.status.toLowerCase()}{outcome.count !== undefined ? ` · ${outcome.count} listings` : ""}{outcome.reason ? ` · ${outcome.reason}` : ""}</li>)}</ul> : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Active listings</p>
          {listings.length ? <ul className="mt-2 space-y-2">{listings.slice(0, 10).map((record) => <li key={record.id} className="rounded-md bg-zinc-950 p-2 text-xs text-zinc-300"><span className="font-semibold text-white">{money(record.priceCents, record.currency)}</span>{record.shippingCents !== null ? ` + ${money(record.shippingCents, record.currency)} shipping` : " · shipping unknown"}<span className="block text-zinc-500">{record.providerId} · {record.condition ?? "condition unavailable"} · {new Date(record.observedAt).toLocaleString()}</span></li>)}</ul> : <p className="mt-2 text-xs text-zinc-500">No saved active listings. Optional official adapters remain disabled until credentials and access are approved.</p>}
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Observed sales</p>
          {sales.length ? <ul className="mt-2 space-y-2">{sales.slice(0, 10).map((record) => <li key={record.id} className="rounded-md bg-zinc-950 p-2 text-xs text-zinc-300"><span className="font-semibold text-white">{money(record.priceCents, record.currency)}</span> · {record.quantity} sold<span className="block text-zinc-500">{record.provenance} · {new Date(record.observedAt).toLocaleString()}</span></li>)}</ul> : <p className="mt-2 text-xs text-zinc-500">No completed sale has been observed. Phronesis will not infer one from an asking listing.</p>}
        </div>
      </div>
      <details className="mt-4 rounded-lg border border-zinc-800 p-3">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-cyan-300">Record a completed sale you observed</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-zinc-400">Sale price (USD)<input type="number" min="0" step="0.01" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label>
          <label className="text-xs text-zinc-400">Copies sold<input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label>
          <label className="text-xs text-zinc-400">Source link (optional)<input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-base text-white" /></label>
        </div>
        <button type="button" onClick={recordSale} disabled={savingSale} className="mt-3 min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-wait disabled:opacity-60">{savingSale ? "Saving…" : "Save observed sale"}</button>
      </details>
    </section>
  );
}
