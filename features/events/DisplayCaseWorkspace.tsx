"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CaseSourcePreparation from "@/components/inventory/CaseSourcePreparation";
import type { EventStockItem } from "@/lib/events/eventStock";
import type {
  DisplayCaseItem,
  DisplayCaseSnapshot,
} from "@/lib/events/displayCase";
import type { EventCurrency } from "@/lib/purchases/domain";

function money(cents: number, currency: EventCurrency | null): string {
  if (!currency) return (cents / 100).toFixed(2);
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function centsFromInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function SummaryCard({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums ${warning && value ? "text-amber-300" : "text-zinc-100"}`}
      >
        {value}
      </p>
    </div>
  );
}

function QuantityEvidence({
  openingLabel,
  opening,
  sold,
  expected,
  counted,
  variance,
}: {
  openingLabel: string;
  opening: number;
  sold: number;
  expected: number;
  counted: number | null;
  variance: number | null;
}) {
  return (
    <div className="grid grid-cols-4 gap-x-3 text-right text-xs">
      <span className="text-zinc-500">{openingLabel}</span>
      <span className="text-zinc-500">Sold</span>
      <span className="text-zinc-500">Expected</span>
      <span className="text-zinc-500">Counted</span>
      <span className="mt-1 font-semibold tabular-nums text-zinc-300">
        {opening}
      </span>
      <span className="mt-1 font-semibold tabular-nums text-zinc-300">
        {sold}
      </span>
      <span className="mt-1 font-semibold tabular-nums text-cyan-200">
        {expected}
      </span>
      <span
        className={`mt-1 font-semibold tabular-nums ${variance && variance !== 0 ? "text-amber-300" : "text-zinc-300"}`}
      >
        {counted ?? "—"}
      </span>
    </div>
  );
}

function PreparedStockRow({
  item,
  currency,
  canCount,
  pending,
  countReason,
  onCount,
}: {
  item: EventStockItem;
  currency: EventCurrency | null;
  canCount: boolean;
  pending: boolean;
  countReason: string;
  onCount: (itemId: string, count: number) => Promise<void>;
}) {
  const [count, setCount] = useState(
    String(item.countedQuantity ?? item.expectedQuantity),
  );
  const parsed = Number(count);
  return (
    <li className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-zinc-100">{item.name}</h3>
            <span className="rounded-full border border-cyan-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300">
              Opening stock
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {[item.variation, item.color].filter(Boolean).join(" · ") ||
              "Standard option"}
            {` · ${money(item.unitPriceCents, currency)}`}
          </p>
        </div>
        <QuantityEvidence
          openingLabel="Opening"
          opening={item.openingQuantity}
          sold={item.soldQuantity}
          expected={item.expectedQuantity}
          counted={item.countedQuantity}
          variance={item.countVariance}
        />
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-t border-zinc-800 pt-3">
        <label className="text-xs text-zinc-500">
          Physical Case count
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={count}
            disabled={!canCount || pending}
            onChange={(event) => setCount(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base tabular-nums text-zinc-100 outline-none focus:border-cyan-400 disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          disabled={
            !canCount ||
            pending ||
            !Number.isInteger(parsed) ||
            parsed < 0 ||
            !countReason.trim()
          }
          onClick={() => void onCount(item.id, parsed)}
          className="min-h-11 rounded-lg border border-cyan-800 px-3 text-sm font-semibold text-cyan-200 disabled:opacity-40"
        >
          Save count
        </button>
      </div>
      {item.countedQuantity !== null ? (
        <p
          className={`mt-2 text-xs ${item.countVariance === 0 ? "text-emerald-300" : "text-amber-300"}`}
        >
          Variance {item.countVariance ?? 0}
        </p>
      ) : null}
    </li>
  );
}

function CaseItemRow({
  item,
  currency,
  editable,
  canCount,
  pending,
  countReason,
  onMutate,
}: {
  item: DisplayCaseItem;
  currency: EventCurrency | null;
  editable: boolean;
  canCount: boolean;
  pending: boolean;
  countReason: string;
  onMutate: (body: Record<string, unknown>, success: string) => Promise<void>;
}) {
  const [price, setPrice] = useState(
    (item.currentSalePriceCents / 100).toFixed(2),
  );
  const [returnQuantity, setReturnQuantity] = useState("1");
  const [returnReason, setReturnReason] = useState(
    "Returned from the physical Case to General Inventory",
  );
  const [count, setCount] = useState(
    String(item.countedQuantity ?? item.expectedQuantity),
  );
  const parsedPrice = centsFromInput(price);
  const parsedReturn = Number(returnQuantity);
  const parsedCount = Number(count);
  const details = [
    item.setName,
    item.collectorNumber ? `#${item.collectorNumber}` : null,
    item.variant,
    item.language,
    item.condition,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="rounded-xl border border-fuchsia-950/80 bg-zinc-950/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-semibold text-zinc-100">{item.name}</h3>
            <span className="rounded-full border border-fuchsia-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-300">
              Event flip
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            {details || item.sku}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Cost {money(item.unitCostCents, currency)} · receipt{" "}
            <span className="font-mono">{item.receiptId.slice(0, 8)}</span>
          </p>
        </div>
        <QuantityEvidence
          openingLabel="Added"
          opening={item.totalAddedQuantity}
          sold={item.soldQuantity}
          expected={item.expectedQuantity}
          counted={item.countedQuantity}
          variance={item.countVariance}
        />
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-t border-zinc-800 pt-3">
        <label className="text-xs text-zinc-500">
          Current Sale price ({currency ?? "currency"})
          <input
            inputMode="decimal"
            value={price}
            disabled={!editable || pending}
            onChange={(event) => setPrice(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base tabular-nums text-zinc-100 outline-none focus:border-fuchsia-400 disabled:opacity-50"
          />
        </label>
        <button
          type="button"
          disabled={!editable || pending || parsedPrice === null}
          onClick={() =>
            void onMutate(
              {
                action: "update-price",
                caseItemId: item.id,
                salePriceCents: parsedPrice,
                reason: "Handler updated intended Case Sale price",
              },
              `${item.name} Sale price updated.`,
            )
          }
          className="min-h-11 rounded-lg border border-fuchsia-800 px-3 text-sm font-semibold text-fuchsia-200 disabled:opacity-40"
        >
          Save price
        </button>
      </div>

      <details className="mt-3 border-t border-zinc-800 pt-3">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-zinc-300">
          Reconcile or return this card
        </summary>
        <div className="grid gap-3 pt-2 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Physical Case count
            </p>
            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <label className="text-xs text-zinc-500">
                Counted
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={count}
                  disabled={!canCount || pending}
                  onChange={(event) => setCount(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-zinc-100 disabled:opacity-50"
                />
              </label>
              <button
                type="button"
                disabled={
                  !canCount ||
                  pending ||
                  !Number.isInteger(parsedCount) ||
                  parsedCount < 0 ||
                  !countReason.trim()
                }
                onClick={() =>
                  void onMutate(
                    {
                      action: "count-item",
                      caseItemId: item.id,
                      countedQuantity: parsedCount,
                      reason: countReason,
                    },
                    `${item.name} physical count saved.`,
                  )
                }
                className="min-h-11 rounded-lg border border-cyan-800 px-3 text-sm font-semibold text-cyan-200 disabled:opacity-40"
              >
                Save count
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-zinc-800 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Return to General Inventory
            </p>
            <div className="mt-2 grid grid-cols-[5rem_minmax(0,1fr)] gap-2">
              <label className="text-xs text-zinc-500">
                Qty
                <input
                  type="number"
                  min="1"
                  max={item.expectedQuantity}
                  step="1"
                  value={returnQuantity}
                  disabled={!editable || pending || item.expectedQuantity < 1}
                  onChange={(event) => setReturnQuantity(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-base text-zinc-100 disabled:opacity-50"
                />
              </label>
              <label className="text-xs text-zinc-500">
                Reason
                <input
                  maxLength={240}
                  value={returnReason}
                  disabled={!editable || pending}
                  onChange={(event) => setReturnReason(event.target.value)}
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-zinc-100 disabled:opacity-50"
                />
              </label>
            </div>
            <button
              type="button"
              disabled={
                !editable ||
                pending ||
                !Number.isInteger(parsedReturn) ||
                parsedReturn < 1 ||
                parsedReturn > item.expectedQuantity ||
                !returnReason.trim()
              }
              onClick={() =>
                void onMutate(
                  {
                    action: "return-to-general",
                    caseItemId: item.id,
                    quantity: parsedReturn,
                    reason: returnReason,
                    idempotencyKey: `case-return:${crypto.randomUUID()}`,
                  },
                  `${parsedReturn} ${item.name} returned to General Inventory.`,
                )
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 px-3 text-sm font-semibold text-zinc-200 disabled:opacity-40"
            >
              Return units
            </button>
          </div>
        </div>
      </details>
    </li>
  );
}

export default function DisplayCaseWorkspace({
  canOperate,
  caseSourceSheetUrl,
}: {
  canOperate: boolean;
  caseSourceSheetUrl: string | null;
}) {
  const [snapshot, setSnapshot] = useState<DisplayCaseSnapshot | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [countReason, setCountReason] = useState(
    "Display Case physical verification",
  );
  const normalizedQuery = query.trim();

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(
      () => {
        setLoading(true);
        void fetch(
          `/api/display-case?q=${encodeURIComponent(normalizedQuery)}`,
          { cache: "no-store" },
        )
          .then(async (response) => {
            const body = (await response.json().catch(() => ({}))) as {
              snapshot?: DisplayCaseSnapshot;
              error?: string;
            };
            if (!response.ok || !body.snapshot) {
              throw new Error(body.error ?? "Display Case could not load.");
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
                  : "Display Case could not load.",
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
  }, [normalizedQuery]);

  async function mutate(body: Record<string, unknown>, success: string) {
    if (!snapshot?.event) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/display-case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: snapshot.event.id, ...body }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        snapshot?: DisplayCaseSnapshot;
        error?: string;
      };
      if (!response.ok || !result.snapshot) {
        throw new Error(result.error ?? "Display Case operation failed.");
      }
      setSnapshot(result.snapshot);
      setMessage(success);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Display Case operation failed.",
      );
    } finally {
      setPending(false);
    }
  }

  const event = snapshot?.event ?? null;
  const editable = Boolean(
    canOperate && event?.status === "ACTIVE" && !pending,
  );
  const canCount = Boolean(canOperate && event && !pending);
  const currency = event?.currency ?? null;
  const summary = snapshot?.summary ?? null;
  const preparedStock = snapshot?.preparedStock ?? null;
  const eventFlips = snapshot?.eventFlips ?? null;

  return (
    <div className="w-full max-w-6xl space-y-5">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
              Physical show-floor control
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Display Case
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              One operational view of opening display stock and cards placed from
              Event Flip. Sales reduce the linked source; counts preserve variance.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link
              href="/event-flip"
              className="inline-flex min-h-11 items-center rounded-lg border border-fuchsia-800 px-3 text-fuchsia-200"
            >
              Event Flip
            </Link>
            <Link
              href="/inventory"
              className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-3 text-zinc-300"
            >
              General Inventory
            </Link>
          </nav>
        </div>
        {event ? (
          <p className="mt-4 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-100">{event.name}</span>
            {` · ${event.eventDate} · ${event.status}`}
          </p>
        ) : null}
      </header>

      {canOperate ? (
        <CaseSourcePreparation sheetUrl={caseSourceSheetUrl} />
      ) : null}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200"
        >
          {message}
        </p>
      ) : null}

      {snapshot?.summary ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          <SummaryCard
            label="Opening stock"
            value={snapshot.summary.preparedExpectedQuantity}
          />
          <SummaryCard
            label="Event flips"
            value={snapshot.summary.eventFlipExpectedQuantity}
          />
          <SummaryCard
            label="Expected in Case"
            value={snapshot.summary.totalExpectedQuantity}
          />
          <SummaryCard label="Sold from Case" value={snapshot.summary.soldQuantity} />
          <SummaryCard label="Counted" value={snapshot.summary.countedQuantity} />
          <SummaryCard
            label="Variance"
            value={snapshot.summary.varianceQuantity}
            warning
          />
        </div>
      ) : null}

      {loading && !snapshot ? (
        <p role="status" className="py-12 text-center text-sm text-zinc-500">
          Loading Display Case…
        </p>
      ) : !event ? (
        <section className="rounded-2xl border border-dashed border-zinc-800 px-5 py-12 text-center">
          <h2 className="text-xl font-semibold text-zinc-100">No event yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Start an Event Ledger to establish this event&apos;s Case.
          </p>
          <Link
            href="/event-ledger"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950"
          >
            Open Event Ledger
          </Link>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3 sm:p-5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
              <label className="text-xs font-medium text-zinc-400">
                Search the Case
                <input
                  type="search"
                  maxLength={200}
                  value={query}
                  onChange={(input) => setQuery(input.target.value)}
                  placeholder="Name, set, number, condition, color"
                  className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
                />
              </label>
              <label className="text-xs font-medium text-zinc-400">
                Physical count reason
                <input
                  maxLength={240}
                  value={countReason}
                  disabled={!canOperate}
                  onChange={(input) => setCountReason(input.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400 disabled:opacity-50"
                />
              </label>
              <a
                href={`/api/display-case?eventId=${encodeURIComponent(event.id)}&report=verification`}
                download
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-cyan-800 px-4 text-sm font-semibold text-cyan-200"
              >
                Verification CSV
              </a>
            </div>
            {summary?.untrackedSaleUnits ? (
              <p className="mt-3 rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
                {summary.untrackedSaleUnits} manually described Sale unit
                {summary.untrackedSaleUnits === 1 ? " is" : "s are"}{" "}
                not linked to either Case source.
              </p>
            ) : null}
          </section>

          <section className="rounded-2xl border border-cyan-950/80 bg-cyan-950/10 p-3 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                  Source 1
                </p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                  Opening display stock
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Immutable Google Sheet snapshot loaded through Event Ledger.
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {preparedStock?.resultCount ?? 0} option
                {preparedStock?.resultCount === 1 ? "" : "s"}
              </span>
            </div>
            {preparedStock?.manifest ? (
              preparedStock.items.length ? (
                <ul className="mt-4 space-y-2">
                  {preparedStock.items.map((item) => (
                    <PreparedStockRow
                      key={`${item.id}:${item.countedQuantity ?? "none"}:${item.expectedQuantity}`}
                      item={item}
                      currency={currency}
                      canCount={canCount}
                      pending={pending}
                      countReason={countReason}
                      onCount={(itemId, countedQuantity) =>
                        mutate(
                          {
                            action: "count-prepared-item",
                            itemId,
                            countedQuantity,
                            reason: countReason,
                          },
                          `${item.name} physical count saved.`,
                        )
                      }
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
                  No opening-stock option matches this search.
                </p>
              )
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm leading-6 text-zinc-500">
                No opening display-stock snapshot is loaded. Event Flip cards can
                still populate the Case.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-fuchsia-950/80 bg-fuchsia-950/10 p-3 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300">
                  Source 2
                </p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-100">
                  Event flips
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Receipt-backed cards reserved from General Inventory.
                </p>
              </div>
              <span className="text-xs text-zinc-500">
                {eventFlips?.resultCount ?? 0} option
                {eventFlips?.resultCount === 1 ? "" : "s"}
              </span>
            </div>
            {eventFlips?.items.length ? (
              <ul className="mt-4 space-y-2">
                {eventFlips.items.map((item) => (
                  <CaseItemRow
                    key={`${item.id}:${item.updatedAt}:${item.expectedQuantity}:${item.countedQuantity ?? "none"}`}
                    item={item}
                    currency={currency}
                    editable={editable}
                    canCount={canCount}
                    pending={pending}
                    countReason={countReason}
                    onMutate={mutate}
                  />
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm leading-6 text-zinc-500">
                {normalizedQuery
                  ? "No Event Flip card matches this search."
                  : "No purchased cards are in the Case yet. Select them in Event Flip."}
              </p>
            )}
          </section>

          {event.status === "CLOSED" ? (
            <p className="rounded-xl border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
              This event is closed. Counts and verification remain available;
              placement, returns, prices, and Sales are locked.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
