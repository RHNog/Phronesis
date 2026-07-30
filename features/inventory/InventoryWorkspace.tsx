"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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

export default function InventoryWorkspace({ canOperate }: { canOperate: boolean }) {
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [locationName, setLocationName] = useState("");
  const [managingLot, setManagingLot] = useState<InventoryLot | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [physicalCount, setPhysicalCount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

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

  async function inventoryAction(body: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => null) as { snapshot?: InventorySnapshot; error?: string } | null;
      if (!response.ok || !result?.snapshot) throw new Error(result?.error ?? "Inventory could not be updated.");
      setSnapshot(result.snapshot);
      return result.snapshot;
    } finally {
      setSaving(false);
    }
  }

  async function createLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await inventoryAction({ action: "create-location", name: locationName });
      setLocationName("");
      setNotice("Location created.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Location could not be created.");
    }
  }

  function openManager(lot: InventoryLot) {
    setManagingLot(lot);
    setSelectedLocationId(lot.locationId ?? "");
    setPhysicalCount("");
    setReason("");
    setNotice(null);
  }

  async function reconcileLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!managingLot) return;
    const body: Record<string, unknown> = {
      action: "reconcile-lot",
      lotId: managingLot.id,
      locationId: selectedLocationId || null,
      reason,
    };
    if (physicalCount.trim() !== "") body.countedQuantity = Number(physicalCount);
    try {
      await inventoryAction(body);
      setManagingLot(null);
      setNotice("Lot reconciliation recorded.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Lot could not be reconciled.");
    }
  }

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
      {notice ? <div role="status" className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-4 text-sm text-emerald-200">{notice}</div> : null}

      {canOperate ? (
        <form onSubmit={createLocation} className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm text-zinc-300">
            New inventory location
            <input value={locationName} onChange={(event) => setLocationName(event.target.value)} maxLength={80} required
              placeholder="Display case, Shelf A, Bulk box 3…"
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white outline-none focus:border-cyan-400" />
          </label>
          <button disabled={saving || !locationName.trim()} className="min-h-11 rounded-lg bg-cyan-400 px-5 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">
            Add location
          </button>
        </form>
      ) : null}

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
            <article key={lot.id} className={`grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_8rem_8rem_9rem_10rem_auto] lg:items-center ${lot.voidedAt ? "opacity-60" : ""}`}>
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
                <p className="text-xs uppercase tracking-wide text-zinc-600">On hand</p>
                <p className="mt-1 text-sm text-zinc-200">{lot.onHandQuantity === null ? "Unspecified" : lot.onHandQuantity.toLocaleString()}</p>
                <p className="mt-1 text-xs text-zinc-500">{lot.quantityBasis === "COUNTED" ? "Physical count" : lot.quantityBasis === "APPROXIMATE" ? "Approximate intake" : lot.quantityBasis === "RECEIPT" ? "Receipt quantity" : "Unknown basis"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-600">Location</p>
                <p className="mt-1 text-sm text-zinc-200">{lot.locationName}</p>
                {lot.lastCountedAt ? <p className="mt-1 text-xs text-zinc-500">Counted {acquired(lot.lastCountedAt)}</p> : null}
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
              <div>
                {canOperate && !lot.voidedAt ? (
                  <button type="button" onClick={() => openManager(lot)} className="min-h-10 rounded-lg border border-zinc-700 px-3 text-sm font-medium text-zinc-200 hover:border-cyan-500 hover:text-cyan-200">
                    Manage lot
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </div>

      {snapshot?.recentEvents.length ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-5" aria-labelledby="inventory-activity-heading">
          <h2 id="inventory-activity-heading" className="text-lg font-semibold text-white">Recent reconciliation activity</h2>
          <div className="mt-4 divide-y divide-zinc-800">
            {snapshot.recentEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="grid gap-1 py-3 text-sm md:grid-cols-[8rem_minmax(0,1fr)_14rem]">
                <span className="font-semibold text-cyan-300">{event.type === "MOVE" ? "Moved" : "Counted"}</span>
                <span className="text-zinc-300">
                  {event.lotName}: {event.type === "MOVE"
                    ? `${event.previousLocationName ?? "Unassigned"} → ${event.nextLocationName ?? "Unassigned"}`
                    : `${event.previousQuantity ?? "Unknown"} → ${event.nextQuantity}`}
                  <span className="text-zinc-500"> · {event.reason}</span>
                </span>
                <span className="text-zinc-500 md:text-right">{acquired(event.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {managingLot ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center" role="presentation">
          <form onSubmit={reconcileLot} role="dialog" aria-modal="true" aria-labelledby="manage-lot-heading" className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl">
            <h2 id="manage-lot-heading" className="text-xl font-semibold text-white">Manage {managingLot.name}</h2>
            <p className="mt-1 text-sm text-zinc-500">Receipt evidence stays unchanged. Record only what you physically verified.</p>
            <div className="mt-5 space-y-4">
              <label className="block text-sm text-zinc-300">
                Location
                <select value={selectedLocationId} onChange={(event) => setSelectedLocationId(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-white">
                  <option value="">Unassigned</option>
                  {(snapshot?.locations ?? []).map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                </select>
              </label>
              <label className="block text-sm text-zinc-300">
                Physical count (optional)
                <input type="number" min={0} step={1} value={physicalCount} onChange={(event) => setPhysicalCount(event.target.value)} placeholder={`Current: ${managingLot.onHandQuantity ?? "unknown"}`}
                  className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-white" />
              </label>
              <label className="block text-sm text-zinc-300">
                Reason
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} required maxLength={240} rows={3} placeholder="Moved after show intake; verified during shelf count…"
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white" />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setManagingLot(null)} className="min-h-11 rounded-lg border border-zinc-700 px-4 text-zinc-200">Cancel</button>
              <button disabled={saving || !reason.trim() || (selectedLocationId === (managingLot.locationId ?? "") && physicalCount.trim() === "")}
                className="min-h-11 rounded-lg bg-cyan-400 px-4 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50">
                Record reconciliation
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
