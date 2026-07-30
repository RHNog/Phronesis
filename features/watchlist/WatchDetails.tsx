import WatchSparkline from "@/features/watchlist/WatchSparkline";
import {
  calculateWatchMarketChange,
  formatWatchingDuration,
} from "@/features/watchlist/WatchHistory";
import type { WatchlistEntry } from "@/features/watchlist/WatchlistRefreshEngine";
import { formatCurrency, formatMarketValue } from "@/features/watchlist/WatchlistCard";
import WatchEvidencePanel from "@/features/watchlist/WatchEvidencePanel";

export default function WatchDetails({ entry }: { entry: WatchlistEntry }) {
  const history = entry.watchHistory;
  if (!history) return <p className="text-sm text-zinc-500">Watch metadata unavailable.</p>;

  const change = calculateWatchMarketChange(
    history.initialMarketValuation,
    entry.currentValuation,
  );
  const added = new Date(history.addedAt);

  return (
    <section aria-label={`Watch details for ${entry.assetIdentity.name}`} className="grid gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Detail label="Added" value={Number.isNaN(added.getTime()) ? "No Data" : `${added.toLocaleDateString()} at ${added.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`} />
      <Detail label="Watching For" value={formatWatchingDuration(history.addedAt)} />
      <Detail label="Last Refresh" value={formatTimestamp(entry.lastRefresh)} />
      <Detail label="Last Successful Refresh" value={formatTimestamp(history.lastSuccessfulRefresh)} />
      <Detail
        label="Current Observation"
        value={`${formatMarketValue(entry, entry.currentValuation)}${entry.lastObservation ? ` · ${formatTimestamp(entry.lastObservation)}` : ""}`}
      />
      <Detail label="Observation Source" value={entry.currentValuation === null ? "No Data" : entry.observationSource} />
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Market Since Added</p>
        <p className={`mt-1 font-semibold ${change.difference !== null && change.difference >= 0 ? "text-emerald-300" : "text-red-300"}`}>
          {formatSignedCurrency(change.difference)}
        </p>
        <p className="mt-1 text-xs text-zinc-400">{formatSignedPercent(change.percentChange)}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Movement</p>
        <div className="mt-1"><WatchSparkline observations={history.observations} /></div>
      </div>
      <Detail label="Price At Watch Creation" value={formatMarketValue(entry, history.initialMarketValuation)} />
      <Detail label="Initial Observation Source" value={history.initialObservationSource === "Unavailable" ? "No Data" : history.initialObservationSource} />
      <Detail label="Refresh Source" value={history.refreshSource === "Unavailable" ? "No Data" : history.refreshSource} />
      <Detail label="Notes" value={entry.notes || "None"} wide />
      <Detail label="Reason Added" value={history.reasonAdded || "None"} wide />
      <WatchEvidencePanel entryId={entry.id} />
    </section>
  );
}

function Detail({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-200">{value}</p>
    </div>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return "No Data";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No Data" : date.toLocaleString();
}

function formatSignedCurrency(value: number | null) {
  if (value === null) return "No Data";
  const formatted = formatCurrency(Math.abs(value));
  return `${value >= 0 ? "+" : "-"}${formatted}`;
}

function formatSignedPercent(value: number | null) {
  if (value === null) return "No Data";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
