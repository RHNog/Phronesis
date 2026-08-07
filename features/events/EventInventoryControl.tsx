"use client";

import { useEffect, useRef, useState } from "react";
import type {
  EventStockItem,
  EventStockSnapshot,
} from "@/lib/events/eventStock";
import type { EventCurrency } from "@/lib/purchases/domain";

const inventoryHeaders = [
  "Item Name",
  "Price",
  "Quantity",
  "Color",
  "Variation",
] as const;

function money(cents: number, currency: EventCurrency | null): string {
  if (!currency) return "Unknown currency";
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function dateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StockSummaryCard({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 text-xl font-semibold tabular-nums ${warning && value ? "text-amber-300" : "text-zinc-100"}`}
      >
        {value}
      </p>
    </div>
  );
}

function CountRow({
  item,
  currency,
  reason,
  disabled,
  onSave,
}: {
  item: EventStockItem;
  currency: EventCurrency | null;
  reason: string;
  disabled: boolean;
  onSave: (itemId: string, countedQuantity: number) => Promise<void>;
}) {
  const [count, setCount] = useState(
    String(item.countedQuantity ?? item.expectedQuantity),
  );
  const parsed = Number(count);
  const valid = Number.isInteger(parsed) && parsed >= 0;

  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-100">{item.name}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {[item.variation, item.color].filter(Boolean).join(" · ") ||
              "Standard option"}
            {` · ${money(item.unitPriceCents, currency)}`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-x-4 text-right text-xs">
          <span className="text-zinc-500">Open</span>
          <span className="text-zinc-500">Sold</span>
          <span className="text-zinc-500">Left</span>
          <span className="mt-1 font-semibold tabular-nums text-zinc-300">
            {item.openingQuantity}
          </span>
          <span className="mt-1 font-semibold tabular-nums text-zinc-300">
            {item.soldQuantity}
          </span>
          <span className="mt-1 font-semibold tabular-nums text-cyan-200">
            {item.expectedQuantity}
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2 border-t border-zinc-800 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="text-xs font-medium text-zinc-400">
          Physical count
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            value={count}
            disabled={disabled}
            onChange={(event) => setCount(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base tabular-nums text-zinc-100 outline-none focus:border-cyan-400 disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          disabled={disabled || !valid || !reason.trim()}
          onClick={() => onSave(item.id, parsed)}
          className="min-h-11 rounded-lg border border-cyan-800 px-4 text-sm font-semibold text-cyan-200 disabled:opacity-50"
        >
          Save count
        </button>
      </div>
      {item.countedQuantity !== null ? (
        <p
          className={`mt-2 text-xs ${item.countVariance === 0 ? "text-emerald-300" : "text-amber-300"}`}
        >
          Last count {item.countedQuantity} · variance {item.countVariance ?? 0}
          {item.lastCountedAt ? ` · ${dateTime(item.lastCountedAt)}` : ""}
        </p>
      ) : null}
    </li>
  );
}

export default function EventInventoryControl({
  eventId,
  eventStatus,
  currency,
  canOperate,
  caseSourceSheetUrl,
  refreshToken = 0,
  onChanged,
}: {
  eventId: string;
  eventStatus: "ACTIVE" | "CLOSED";
  currency: EventCurrency | null;
  canOperate: boolean;
  caseSourceSheetUrl: string | null;
  refreshToken?: number;
  onChanged?: () => void;
}) {
  const [snapshot, setSnapshot] = useState<EventStockSnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countReason, setCountReason] = useState(
    "End-of-event physical verification",
  );
  const fileInput = useRef<HTMLInputElement | null>(null);
  const normalizedQuery = query.trim();

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(
      () => {
        setLoading(true);
        void fetch(
          `/api/event-inventory?eventId=${encodeURIComponent(eventId)}&q=${encodeURIComponent(normalizedQuery)}`,
          { cache: "no-store" },
        )
          .then(async (response) => {
            const body = (await response.json().catch(() => ({}))) as {
              snapshot?: EventStockSnapshot;
              error?: string;
            };
            if (!response.ok || !body.snapshot) {
              throw new Error(body.error ?? "Event Inventory could not load.");
            }
            if (!cancelled) {
              setSnapshot(body.snapshot);
              setError(null);
            }
          })
          .catch((reason) => {
            if (!cancelled) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "Event Inventory could not load.",
              );
            }
          })
          .finally(() => {
            if (!cancelled) setLoading(false);
          });
      },
      normalizedQuery ? 140 : 0,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [eventId, normalizedQuery, refreshToken]);

  async function mutate(
    body: Record<string, unknown>,
  ): Promise<EventStockSnapshot> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/event-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ...body }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        snapshot?: EventStockSnapshot;
        error?: string;
      };
      if (!response.ok || !result.snapshot) {
        throw new Error(result.error ?? "Event Inventory operation failed.");
      }
      setSnapshot(result.snapshot);
      onChanged?.();
      return result.snapshot;
    } catch (reason) {
      const operationError =
        reason instanceof Error
          ? reason
          : new Error("Event Inventory operation failed.");
      setError(operationError.message);
      throw operationError;
    } finally {
      setPending(false);
    }
  }

  async function importCsv(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setError("Choose the Event Inventory CSV exported from Google Sheets.");
      return;
    }
    if (!file.name.toLocaleLowerCase("en-US").endsWith(".csv")) {
      setError("Event Inventory import requires a .csv file.");
      return;
    }
    try {
      const next = await mutate({
        action: "import-csv",
        sourceName: file.name,
        csv: await file.text(),
      });
      if (fileInput.current) fileInput.current.value = "";
      setQuery("");
      setMessage(
        `Imported ${next.summary.optionCount} options and ${next.summary.openingQuantity} opening units.`,
      );
    } catch {
      // mutate owns the actionable error state.
    }
  }

  async function saveCount(itemId: string, countedQuantity: number) {
    try {
      await mutate({
        action: "count-item",
        itemId,
        countedQuantity,
        reason: countReason,
      });
      setMessage("Physical count saved as append-only verification evidence.");
    } catch {
      // mutate owns the actionable error state.
    }
  }

  const manifest = snapshot?.manifest ?? null;
  const summary = snapshot?.summary;
  return (
    <section
      aria-labelledby="event-inventory-heading"
      className="rounded-2xl border border-cyan-900/70 bg-cyan-950/10 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Opening Case source
          </p>
          <h2
            id="event-inventory-heading"
            className="mt-2 text-xl font-semibold text-white"
          >
            Opening Display Stock
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Prepare the five-column Google Sheet, export its display-stock tab as
            CSV, and import one immutable opening snapshot before selling.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canOperate && caseSourceSheetUrl ? (
            <a
              href={caseSourceSheetUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200"
            >
              Edit Case Source Sheet
            </a>
          ) : null}
          <a
            href="/templates/event-inventory-template.csv"
            download
            className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200"
          >
            Download CSV template
          </a>
        </div>
      </div>

      <div
        className="mt-4 flex flex-wrap gap-2"
        aria-label="Required inventory columns"
      >
        {inventoryHeaders.map((header) => (
          <span
            key={header}
            className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400"
          >
            {header}
          </span>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="mt-4 rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200"
        >
          {message}
        </p>
      ) : null}

      {eventStatus === "ACTIVE" && canOperate && currency ? (
        <form
          onSubmit={importCsv}
          className="mt-4 grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
        >
          <label className="text-xs font-medium text-zinc-400">
            Import CSV snapshot
            <input
              ref={fileInput}
              required
              type="file"
              accept=".csv,text/csv"
              disabled={pending}
              className="mt-2 block min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 text-sm text-zinc-300 file:mr-3 file:min-h-11 file:border-0 file:bg-zinc-800 file:px-3 file:text-sm file:font-semibold file:text-zinc-100 disabled:opacity-50"
            />
          </label>
          <button
            disabled={pending}
            className="min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 disabled:opacity-50"
          >
            {pending
              ? "Working…"
              : manifest
                ? "Review replacement"
                : "Import inventory"}
          </button>
          {manifest ? (
            <p className="text-xs leading-5 text-amber-200 sm:col-span-2">
              A replacement is allowed only before the first tracked Sale. The
              server rejects any attempt to rewrite a consumed opening baseline.
            </p>
          ) : null}
        </form>
      ) : eventStatus === "ACTIVE" && canOperate && !currency ? (
        <p className="mt-4 rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
          This legacy event has no currency baseline, so priced inventory cannot
          be imported. Start a current Event Ledger to use stock control.
        </p>
      ) : null}

      {manifest ? (
        <>
          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 text-xs leading-5 text-zinc-400">
            <p className="font-semibold text-zinc-200">{manifest.sourceName}</p>
            <p>
              Imported {dateTime(manifest.importedAt)} · {manifest.rowCount}{" "}
              rows ·{` ${manifest.totalQuantity} units`}
            </p>
            <p
              className="mt-1 break-all font-mono text-[11px] text-zinc-600"
              title={manifest.sourceHash}
            >
              SHA-256 {manifest.sourceHash}
            </p>
          </div>

          {summary ? (
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
              <StockSummaryCard label="Options" value={summary.optionCount} />
              <StockSummaryCard
                label="Opening"
                value={summary.openingQuantity}
              />
              <StockSummaryCard label="Sold" value={summary.soldQuantity} />
              <StockSummaryCard
                label="Expected left"
                value={summary.expectedQuantity}
              />
              <StockSummaryCard
                label="Counted"
                value={summary.countedOptionCount}
              />
              <StockSummaryCard
                label="Variance"
                value={summary.varianceQuantity}
                warning
              />
              <StockSummaryCard
                label="Untracked sold"
                value={summary.untrackedSaleUnits}
                warning
              />
            </div>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a
              href={`/api/event-inventory?eventId=${encodeURIComponent(eventId)}&report=sold`}
              download
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200"
            >
              Download sold report
            </a>
            <a
              href={`/api/event-inventory?eventId=${encodeURIComponent(eventId)}&report=leftover`}
              download
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-800 px-4 text-sm font-semibold text-cyan-200"
            >
              Download leftover report
            </a>
          </div>

          <div className="mt-5 border-t border-zinc-800 pt-5">
            <button
              type="button"
              aria-expanded={verificationOpen}
              aria-controls="event-inventory-verification"
              onClick={() => setVerificationOpen((current) => !current)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/60 px-4 text-left"
            >
              <span>
                <span className="block text-sm font-semibold text-zinc-200">
                  Physical verification
                </span>
                <span className="mt-1 block text-xs text-zinc-500">
                  Search options and preserve append-only count evidence.
                </span>
              </span>
              <span aria-hidden="true" className="text-lg text-cyan-300">
                {verificationOpen ? "−" : "+"}
              </span>
            </button>

            {verificationOpen ? (
              <div id="event-inventory-verification" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-medium text-zinc-400">
                    Find an option to verify
                    <input
                      type="search"
                      maxLength={200}
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Name, color, variation, or price"
                      className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
                    />
                  </label>
                  <label className="text-xs font-medium text-zinc-400">
                    Count reason
                    <input
                      maxLength={240}
                      value={countReason}
                      disabled={!canOperate}
                      onChange={(event) => setCountReason(event.target.value)}
                      className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400 disabled:opacity-50"
                    />
                  </label>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                  <span>
                    {loading
                      ? "Loading stock…"
                      : `${snapshot?.resultCount ?? 0} option${snapshot?.resultCount === 1 ? "" : "s"}`}
                  </span>
                  {snapshot?.truncated ? (
                    <span>Showing the best 40 · refine search</span>
                  ) : null}
                </div>

                {snapshot?.items.length ? (
                  <ul className="mt-3 space-y-2">
                    {snapshot.items.map((item) => (
                      <CountRow
                        key={`${item.id}:${item.countedQuantity ?? "none"}:${item.expectedQuantity}`}
                        item={item}
                        currency={currency}
                        reason={countReason}
                        disabled={!canOperate || pending}
                        onSave={saveCount}
                      />
                    ))}
                  </ul>
                ) : !loading ? (
                  <p className="mt-3 rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                    No Event Inventory option matches this search.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : !loading ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm leading-6 text-zinc-500">
          No inventory snapshot is loaded. Sales can still be recorded manually,
          but those units will be flagged as untracked and cannot produce an
          expected-leftover quantity.
        </p>
      ) : null}
    </section>
  );
}
