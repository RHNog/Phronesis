"use client";

import { useEffect, useMemo, useState } from "react";
import type { InventoryLot, InventorySnapshot } from "@/lib/inventory/domain";

type Filter = "ACTIVE" | "EXACT" | "BULK" | "VOIDED" | "ALL";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function cost(cents: number) {
  return currency.format(cents / 100);
}

function acquired(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function detail(lot: InventoryLot) {
  if (lot.kind === "BULK") {
    const amount = lot.approximateQuantity
      ? ` · ~${lot.approximateQuantity.toLocaleString()} cards`
      : "";
    return `${lot.productLines.join(" · ")}${amount}`;
  }
  return [
    lot.setName,
    lot.collectorNumber ? `#${lot.collectorNumber}` : null,
    lot.variant,
    lot.condition,
  ].filter(Boolean).join(" · ");
}

export default function InventoryWorkspace() {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ACTIVE");

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/inventory", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => null) as InventorySnapshot | { error?: string } | null;
        if (!response.ok) throw new Error(body && "error" in body ? body.error : "Inventory could not be loaded.");
        return body as InventorySnapshot;
      })
      .then((body) => {
        if (!cancelled) setSnapshot(body);
      })
      .catch((reason) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Inventory could not be loaded.");
      });
    return () => { cancelled = true; };
  }, []);

  const lots = useMemo(() => (snapshot?.lots ?? []).filter((lot) => {
    if (filter === "ALL") return true;
    if (filter === "ACTIVE") return !lot.voidedAt;
    if (filter === "VOIDED") return Boolean(lot.voidedAt);
    return !lot.voidedAt && lot.kind === filter;
  }), [filter, snapshot]);

  return (
    <section className="w-full max-w-[1500px] space-y-6" aria-labelledby="inventory-heading">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Manage · cost basis</p>
        <h1 id="inventory-heading" className="mt-2 text-3xl font-semibold tracking-tight text-white">Inventory</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
          Purchases appear here automatically when an event receipt is finalized. Exact cards retain their printing and condition; Bulk remains a truthful aggregate lot.
        </p>
      </header>

      {error ? <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/40 p-4 text-sm text-red-200">{error}</div> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Inventory summary">
        {[
          ["Active cost basis", snapshot ? cost(snapshot.summary.totalCostBasisCents) : "—"],
          ["Active lots", snapshot?.summary.activeLotCount ?? "—"],
          ["Exact units", snapshot?.summary.exactUnitCount ?? "—"],
          ["Bulk lots", snapshot?.summary.bulkLotCount ?? "—"],
          ["Voided lots", snapshot?.summary.voidedLotCount ?? "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Inventory filters">
        {(["ACTIVE", "EXACT", "BULK", "VOIDED", "ALL"] as const).map((option) => (
          <button key={option} type="button" onClick={() => setFilter(option)} aria-pressed={filter === option}
            className={`min-h-10 rounded-lg border px-4 text-sm font-medium transition ${filter === option ? "border-cyan-400 bg-cyan-400 text-zinc-950" : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"}`}>
            {option === "ACTIVE" ? "All active" : option[0] + option.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
        {!snapshot ? <p className="p-8 text-center text-sm text-zinc-500">Loading inventory…</p> : null}
        {snapshot && !lots.length ? <p className="p-8 text-center text-sm text-zinc-500">No lots match this view.</p> : null}
        <div className="divide-y divide-zinc-800">
          {lots.map((lot) => (
            <article key={lot.id} className={`grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_10rem_11rem_12rem] md:items-center ${lot.voidedAt ? "opacity-60" : ""}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-2 py-1 text-[11px] font-bold tracking-wide ${lot.kind === "BULK" ? "bg-amber-950 text-amber-300" : "bg-cyan-950 text-cyan-300"}`}>{lot.productType}</span>
                  {lot.voidedAt ? <span className="rounded bg-red-950 px-2 py-1 text-[11px] font-bold text-red-300">VOIDED</span> : null}
                  <h2 className="truncate font-semibold text-zinc-100">{lot.name}</h2>
                </div>
                <p className="mt-2 truncate text-sm text-zinc-400">{detail(lot)}</p>
                {lot.notes ? <p className="mt-1 truncate text-xs text-zinc-500">{lot.notes}</p> : null}
                {lot.voidReason ? <p className="mt-1 text-xs text-red-300">{lot.voidReason}</p> : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-600">Quantity</p>
                <p className="mt-1 text-sm text-zinc-200">{lot.kind === "EXACT" ? lot.quantity : lot.approximateQuantity ? `~${lot.approximateQuantity.toLocaleString()}` : "Unspecified"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-600">Cost basis</p>
                <p className="mt-1 font-semibold text-cyan-300">{cost(lot.totalCostCents)}</p>
                {lot.unitCostCents !== null && (lot.quantity ?? 0) > 1 ? <p className="text-xs text-zinc-500">{cost(lot.unitCostCents)} each</p> : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-600">Receipt provenance</p>
                <p className="mt-1 text-sm text-zinc-300">{acquired(lot.acquiredAt)}</p>
                <p className="mt-1 font-mono text-xs text-zinc-600" title={lot.sourceReceiptId}>Receipt {lot.sourceReceiptId.slice(0, 8)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
