"use client";

import { useEffect, useState } from "react";
import type { WatchlistEntry } from "@/features/watchlist/WatchlistRefreshEngine";

type WatchlistToolbarProps = {
  developerMode: boolean;
  entries: WatchlistEntry[];
  onDeveloperModeChange: (enabled: boolean) => void;
};

export default function WatchlistToolbar({
  developerMode,
  entries,
  onDeveloperModeChange,
}: WatchlistToolbarProps) {
  const [providerSummary, setProviderSummary] = useState("Checking…");
  const apiSaved = entries.filter(
    (entry) => entry.developerDiagnostics.apiSaved,
  ).length;
  const approaching = entries.filter(
    (entry) => entry.marketStatus === "Approaching Target",
  ).length;
  const aboveTarget = entries.filter(
    (entry) => entry.marketStatus === "Above Target",
  ).length;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/market/provider-health", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ providers: Array<{ status: string }> }> : null)
      .then((body) => {
        if (!cancelled && body) setProviderSummary(`${body.providers.filter((provider) => provider.status === "READY").length}/${body.providers.length} ready`);
      })
      .catch(() => { if (!cancelled) setProviderSummary("Unavailable"); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950/80 px-4 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Market Watch
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Repository-first target monitoring for individual assets.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Entries" value={entries.length.toString()} />
          <Metric label="Approaching" value={approaching.toString()} />
          <Metric label="Above Target" value={aboveTarget.toString()} />
          <Metric
            label="Providers"
            value={providerSummary}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-zinc-800 pt-4 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Catalogue-first refresh · API saved on {apiSaved} entries. Provider health never implies upstream quota.
        </p>
        <label className="inline-flex items-center gap-2 text-zinc-300">
          <input
            checked={developerMode}
            className="h-4 w-4 accent-cyan-400"
            onChange={(event) => onDeveloperModeChange(event.target.checked)}
            type="checkbox"
          />
          Developer diagnostics
        </label>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-900 px-3 py-2">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-base font-semibold text-white">{value}</p>
    </div>
  );
}
