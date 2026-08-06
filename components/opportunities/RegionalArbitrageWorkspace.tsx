"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ArbitrageCandidate } from "@/lib/regional/RegionalIntelligenceRepository";
import type { ArbitrageDirection } from "@/lib/regional/domain";

type DirectionFilter = "ALL" | ArbitrageDirection;

const directionLabel = (direction: ArbitrageDirection) =>
  direction === "US_TO_BRAZIL" ? "US → Brazil" : "Brazil → US";

const stateStyle = (state: string) => {
  if (state === "ACTIONABLE")
    return "border-emerald-800 bg-emerald-950/40 text-emerald-200";
  if (state === "REJECTED")
    return "border-rose-900 bg-rose-950/40 text-rose-200";
  if (state === "COSTED")
    return "border-cyan-900 bg-cyan-950/40 text-cyan-200";
  return "border-amber-800 bg-amber-950/40 text-amber-200";
};

const money = (value: number, currency: "USD" | "BRL") =>
  new Intl.NumberFormat(currency === "USD" ? "en-US" : "pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);

const age = (value: string) => {
  const hours = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 3_600_000),
  );
  if (hours < 1) return "Updated <1h ago";
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
};

export default function RegionalArbitrageWorkspace() {
  const [items, setItems] = useState<ArbitrageCandidate[]>([]);
  const [message, setMessage] = useState("Loading regional candidates…");
  const [selected, setSelected] = useState<ArbitrageCandidate | null>(null);
  const [filter, setFilter] = useState<DirectionFilter>("ALL");

  const load = async (signal?: AbortSignal) => {
    const response = await fetch("/api/regional/arbitrage?limit=50", {
      signal,
    });
    const body = (await response.json()) as {
      candidates?: ArbitrageCandidate[];
      error?: string;
    };
    if (!response.ok)
      throw new Error(body.error ?? "Regional candidates unavailable.");
    const candidates = body.candidates ?? [];
    setItems(candidates);
    setMessage(
      candidates.length
        ? ""
        : "No exact regional candidates are available yet.",
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    async function initialLoad() {
      const response = await fetch("/api/regional/arbitrage?limit=50", {
        signal: controller.signal,
      });
      const body = (await response.json()) as {
        candidates?: ArbitrageCandidate[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Regional candidates unavailable.");
      }
      const candidates = body.candidates ?? [];
      setItems(candidates);
      setMessage(
        candidates.length
          ? ""
          : "No exact regional candidates are available yet.",
      );
    }
    void initialLoad().catch((error) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Regional candidates unavailable.",
        );
      }
    });
    return () => controller.abort();
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => filter === "ALL" || item.direction === filter),
    [filter, items],
  );
  const summary = useMemo(
    () => ({
      usToBrazil: items.filter((item) => item.direction === "US_TO_BRAZIL")
        .length,
      brazilToUs: items.filter((item) => item.direction === "BRAZIL_TO_US")
        .length,
      ready: items.filter((item) =>
        ["COSTED", "ACTIONABLE"].includes(item.state),
      ).length,
      targetsMet: items.filter((item) => item.meetsTargets === true).length,
      targetsMissed: items.filter((item) => item.meetsTargets === false).length,
      targetsPending: items.filter((item) => item.meetsTargets === null).length,
    }),
    [items],
  );

  async function verify(form: FormData) {
    if (!selected) return;
    setMessage("Recording availability…");
    const response = await fetch("/api/regional/arbitrage", {
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
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "Verification failed.");
      return;
    }
    setSelected(null);
    await load();
    setMessage("Executable availability recorded.");
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/80 shadow-2xl shadow-black/20">
      <div className="border-b border-zinc-800 bg-[radial-gradient(circle_at_top_right,rgba(8,145,178,0.16),transparent_42%)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Regional arbitrage
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Cross-market decision queue
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Exact printing matches ranked by net economics. Market evidence
              can surface a lead; only verified availability can make it
              actionable.
            </p>
          </div>
          <Link
            href="/settings"
            className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 text-sm font-semibold text-zinc-200 transition hover:border-cyan-700 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            Review cost settings
          </Link>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ["Exact candidates", items.length, "Identity reconciled"],
            ["US → Brazil", summary.usToBrazil, "Import route"],
            ["Brazil → US", summary.brazilToUs, "Export route"],
            [
              "Meet targets",
              summary.targetsMet,
              `${summary.targetsMissed} miss · ${summary.targetsPending} pending`,
            ],
          ].map(([label, value, note]) => (
            <div
              key={label}
              className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
            >
              <dt className="text-xs text-zinc-500">{label}</dt>
              <dd className="mt-1 text-2xl font-semibold text-white">
                {value}
              </dd>
              <p className="mt-1 text-xs text-zinc-500">{note}</p>
            </div>
          ))}
        </dl>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:flex-wrap"
            aria-label="Filter arbitrage direction"
          >
            {(
              [
                ["ALL", "All routes"],
                ["US_TO_BRAZIL", "US → Brazil"],
                ["BRAZIL_TO_US", "Brazil → US"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={`min-h-11 rounded-lg border px-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${filter === value ? "border-cyan-700 bg-cyan-950/60 text-cyan-200" : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Showing {visibleItems.length} of {items.length}
          </p>
        </div>

        {message ? (
          <p
            role="status"
            className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm text-zinc-400"
          >
            {message}
          </p>
        ) : null}

        <div className="mt-4 grid gap-3">
          {visibleItems.map((item) => {
            const canVerify =
              item.state === "COSTED" ||
              item.state === "ACTIONABLE" ||
              item.state === "REJECTED";
            return (
              <article
                key={item.id}
                className="grid min-w-0 gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-zinc-700 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,1.25fr)_minmax(13rem,.75fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-900 bg-cyan-950/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">
                      Exact match
                    </span>
                    <span className="text-xs text-zinc-500">
                      {age(item.evidenceObservedAt)}
                    </span>
                  </div>
                  <h3 className="mt-2 break-words text-base font-semibold text-white">
                    {item.name}
                  </h3>
                  <p className="mt-1 break-words text-xs text-zinc-400">
                    {item.setName} · #{item.collectorNumber || "—"} ·{" "}
                    {item.variant}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {directionLabel(item.direction)}
                  </p>
                  <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Acquire · {item.acquisitionMarket}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-white">
                        {money(item.acquisitionValue, item.acquisitionCurrency)}
                      </p>
                    </div>
                    <span aria-hidden="true" className="text-cyan-700">
                      →
                    </span>
                    <div className="min-w-0 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                        Exit · {item.exitMarket}
                      </p>
                      <p className="mt-1 break-words text-sm font-semibold text-white">
                        {money(item.grossProceeds, item.grossCurrency)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 grid gap-1 text-[11px] leading-4 text-zinc-500 sm:grid-cols-2">
                    <p>{item.acquisitionBenchmark}</p>
                    <p className="sm:text-right">{item.exitBenchmark}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Expected net</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${item.netProfit === null ? "text-amber-200" : "text-cyan-200"}`}
                  >
                    {item.netProfit === null
                      ? "Pending costs"
                      : money(
                          item.netProfit,
                          item.grossCurrency,
                        )}
                  </p>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                    <div>
                      <dt>Margin</dt>
                      <dd className="text-zinc-300">
                        {item.profitMarginPercent === null
                          ? "—"
                          : `${item.profitMarginPercent.toFixed(1)}%`}
                      </dd>
                    </div>
                    <div>
                      <dt>ROI</dt>
                      <dd className="text-zinc-300">
                        {item.roiPercent === null
                          ? "—"
                          : `${item.roiPercent.toFixed(1)}%`}
                      </dd>
                    </div>
                    <div>
                      <dt>Gross spread</dt>
                      <dd className="text-zinc-300">
                        {item.grossSpread === null
                          ? "—"
                          : money(item.grossSpread, item.grossCurrency)}
                      </dd>
                    </div>
                    <div>
                      <dt>Total cost</dt>
                      <dd className="text-zinc-300">
                        {item.totalCost === null
                          ? "—"
                          : money(item.totalCost, item.grossCurrency)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="flex flex-col items-start gap-2 lg:items-end">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stateStyle(item.state)}`}
                  >
                    {item.state.replaceAll("_", " ")}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${item.meetsTargets === true ? "border-emerald-900 text-emerald-300" : item.meetsTargets === false ? "border-rose-900 text-rose-300" : "border-zinc-800 text-zinc-500"}`}
                  >
                    {item.meetsTargets === true
                      ? "TARGETS MET"
                      : item.meetsTargets === false
                        ? "TARGETS MISSED"
                        : "TARGETS PENDING"}
                  </span>
                  <p className="max-w-xs text-xs leading-5 text-zinc-500 lg:text-right">
                    {item.blocker ??
                      "Economics complete; verify a real listing or offer."}
                  </p>
                  {canVerify ? (
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950"
                    >
                      Verify availability
                    </button>
                  ) : (
                    <Link
                      href="/settings"
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-cyan-300"
                    >
                      Configure costs →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {selected ? (
          <form
            action={verify}
            className="mt-5 rounded-xl border border-cyan-900 bg-cyan-950/20 p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Availability evidence
                </p>
                <h3 className="mt-1 font-semibold text-white">
                  Verify {selected.name}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {directionLabel(selected.direction)} · record a current,
                  executable acquisition listing from {selected.acquisitionMarket}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="min-h-11 px-3 text-sm text-zinc-300"
              >
                Cancel
              </button>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                required
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                aria-label="Executable price"
                placeholder="Executable price"
                className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white"
              />
              <input
                required
                name="quantity"
                type="number"
                min="1"
                step="1"
                aria-label="Available quantity"
                placeholder="Available quantity"
                className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white"
              />
              <input
                required
                name="counterparty"
                aria-label="Seller or dealer label"
                placeholder="Seller / dealer label"
                className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white"
              />
              <input
                name="notes"
                aria-label="Verification notes"
                placeholder="Notes"
                className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white"
              />
            </div>
            <button className="mt-3 min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950">
              Record verification
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
