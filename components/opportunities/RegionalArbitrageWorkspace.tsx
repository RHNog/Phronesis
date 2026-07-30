"use client";

import { useEffect, useState } from "react";
import type { ArbitrageCandidate } from "@/lib/regional/RegionalIntelligenceRepository";

export default function RegionalArbitrageWorkspace() {
  const [items, setItems] = useState<ArbitrageCandidate[]>([]);
  const [message, setMessage] = useState("Loading regional candidates…");
  const [selected, setSelected] = useState<ArbitrageCandidate | null>(null);
  const load = async () => {
    const r = await fetch("/api/regional/arbitrage?limit=50");
    const b = (await r.json()) as {
      candidates?: ArbitrageCandidate[];
      error?: string;
    };
    if (!r.ok) throw new Error(b.error ?? "Regional candidates unavailable.");
    setItems(b.candidates ?? []);
    setMessage(
      (b.candidates ?? []).length
        ? ""
        : "Configure FX and cross-border costs to rank exact matches.",
    );
  };
  useEffect(() => {
    const controller = new AbortController();
    async function initialLoad() {
      const r = await fetch("/api/regional/arbitrage?limit=50", {
        signal: controller.signal,
      });
      const b = (await r.json()) as {
        candidates?: ArbitrageCandidate[];
        error?: string;
      };
      if (!r.ok) throw new Error(b.error ?? "Regional candidates unavailable.");
      setItems(b.candidates ?? []);
      setMessage(
        (b.candidates ?? []).length
          ? ""
          : "Configure FX and cross-border costs to rank exact matches.",
      );
    }
    void initialLoad().catch((e) => {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        setMessage(
          e instanceof Error ? e.message : "Regional candidates unavailable.",
        );
    });
    return () => controller.abort();
  }, []);
  async function verify(form: FormData) {
    if (!selected) return;
    setMessage("Recording availability…");
    const r = await fetch("/api/regional/arbitrage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        categoryId: selected.categoryId,
        sku: selected.sku,
        direction: selected.direction,
        executablePrice: Number(form.get("price")),
        quantity: Number(form.get("quantity")),
        counterpartyLabel: String(form.get("counterparty")),
        observedAt: new Date().toISOString(),
        notes: String(form.get("notes") ?? ""),
      }),
    });
    const b = (await r.json()) as { error?: string };
    if (!r.ok) {
      setMessage(b.error ?? "Verification failed.");
      return;
    }
    setSelected(null);
    await load();
    setMessage("Executable availability recorded.");
  }
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Regional arbitrage
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Two-way verification queue
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Ranked net economics; benchmark data never becomes actionable by
            itself.
          </p>
        </div>
        <span className="text-xs text-zinc-500">{items.length} candidates</span>
      </div>
      {message ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-400"
        >
          {message}
        </p>
      ) : null}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-zinc-500">
            <tr>
              <th className="p-3">Printing</th>
              <th>Direction</th>
              <th>Evidence</th>
              <th>Net</th>
              <th>ROI</th>
              <th>Gate</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-zinc-800">
                <td className="p-3">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-zinc-500">
                    {item.setName} · #{item.collectorNumber} · {item.variant}
                  </p>
                </td>
                <td className="text-zinc-300">
                  {item.direction === "US_TO_BRAZIL"
                    ? "US → Brazil"
                    : "Brazil → US"}
                </td>
                <td className="text-xs text-zinc-400">
                  ${item.usPriceUsd.toFixed(2)} / R${" "}
                  {item.brazilPriceBrl.toFixed(2)}
                </td>
                <td className="font-semibold text-cyan-200">
                  {item.netProfit === null
                    ? "—"
                    : item.direction === "US_TO_BRAZIL"
                      ? `R$ ${item.netProfit.toFixed(2)}`
                      : `$${item.netProfit.toFixed(2)}`}
                </td>
                <td>
                  {item.roiPercent === null
                    ? "—"
                    : `${item.roiPercent.toFixed(1)}%`}
                </td>
                <td>
                  <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                    {item.state}
                  </span>
                </td>
                <td>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      disabled={
                        item.state !== "COSTED" && item.state !== "ACTIONABLE"
                      }
                      className="min-h-11 px-3 text-xs font-semibold text-cyan-300"
                    >
                      {item.state === "COSTED" || item.state === "ACTIONABLE"
                        ? "Verify availability"
                        : "Configure costs"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected ? (
        <form
          action={verify}
          className="mt-5 rounded-xl border border-cyan-900 bg-cyan-950/20 p-4"
        >
          <h3 className="font-semibold text-white">
            Verify executable availability
          </h3>
          <p className="mt-1 text-xs text-zinc-400">
            {selected.name} ·{" "}
            {selected.direction === "US_TO_BRAZIL"
              ? "source listing in USD"
              : "source listing in BRL"}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <input
              required
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Executable price"
              className="min-h-11 rounded border border-zinc-700 bg-zinc-950 px-3 text-white"
            />
            <input
              required
              name="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="Quantity"
              className="min-h-11 rounded border border-zinc-700 bg-zinc-950 px-3 text-white"
            />
            <input
              required
              name="counterparty"
              placeholder="Seller / dealer label"
              className="min-h-11 rounded border border-zinc-700 bg-zinc-950 px-3 text-white"
            />
            <input
              name="notes"
              placeholder="Notes"
              className="min-h-11 rounded border border-zinc-700 bg-zinc-950 px-3 text-white"
            />
          </div>
          <div className="mt-3 flex gap-3">
            <button className="min-h-11 rounded bg-cyan-300 px-4 text-sm font-semibold text-zinc-950">
              Record verification
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="min-h-11 px-3 text-sm text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
