"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  EventStockItem,
  EventStockSnapshot,
} from "@/lib/events/eventStock";
import type { EventCurrency } from "@/lib/purchases/domain";

export type EventSaleItemInput = {
  id: string;
  description: string;
  quantity: string;
  inventoryItemId?: string;
  unitListPriceCents?: number;
  color?: string | null;
  variation?: string | null;
  expectedQuantity?: number;
};

export function newEventSaleItem(): EventSaleItemInput {
  return { id: crypto.randomUUID(), description: "", quantity: "1" };
}

function money(cents: number, currency: EventCurrency | null): string {
  if (!currency) return "Unknown currency";
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function optionDescription(item: EventStockItem): string {
  return [item.name, item.variation, item.color].filter(Boolean).join(" · ");
}

export default function EventSaleItemsEditor({
  eventId,
  currency,
  items,
  onChange,
  disabled = false,
  refreshToken = 0,
  accent = "cyan",
}: {
  eventId: string;
  currency: EventCurrency | null;
  items: EventSaleItemInput[];
  onChange: (items: EventSaleItemInput[]) => void;
  disabled?: boolean;
  refreshToken?: number;
  accent?: "cyan" | "emerald";
}) {
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<EventStockSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  const selectedIds = useMemo(
    () =>
      new Set(
        items.flatMap((item) =>
          item.inventoryItemId ? [item.inventoryItemId] : [],
        ),
      ),
    [items],
  );

  function chooseStockItem(stockItem: EventStockItem) {
    if (disabled || stockItem.expectedQuantity < 1) return;
    const existingIndex = items.findIndex(
      (item) => item.inventoryItemId === stockItem.id,
    );
    if (existingIndex >= 0) {
      const existing = items[existingIndex];
      const nextQuantity = Number(existing?.quantity ?? 0) + 1;
      if (nextQuantity > stockItem.expectedQuantity) {
        setError(
          `${stockItem.name} has only ${stockItem.expectedQuantity} expected remaining.`,
        );
        return;
      }
      onChange(
        items.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: String(nextQuantity) }
            : item,
        ),
      );
      setQuery("");
      return;
    }
    if (items.length >= 25 && !items.some((item) => !item.description.trim())) {
      setError("A Sale can contain at most 25 item lines.");
      return;
    }
    const selected: EventSaleItemInput = {
      id: crypto.randomUUID(),
      description: optionDescription(stockItem),
      quantity: "1",
      inventoryItemId: stockItem.id,
      unitListPriceCents: stockItem.unitPriceCents,
      color: stockItem.color,
      variation: stockItem.variation,
      expectedQuantity: stockItem.expectedQuantity,
    };
    const emptyIndex = items.findIndex(
      (item) => !item.inventoryItemId && !item.description.trim(),
    );
    onChange(
      emptyIndex >= 0
        ? items.map((item, index) => (index === emptyIndex ? selected : item))
        : [...items, selected],
    );
    setError(null);
    setQuery("");
  }

  function updateItem(id: string, patch: Partial<EventSaleItemInput>) {
    onChange(
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(id: string) {
    const remaining = items.filter((item) => item.id !== id);
    onChange(remaining.length ? remaining : [newEventSaleItem()]);
  }

  const focusClass =
    accent === "emerald" ? "focus:border-emerald-300" : "focus:border-cyan-400";
  const resultClass =
    accent === "emerald"
      ? "hover:border-emerald-500 focus:border-emerald-400"
      : "hover:border-cyan-600 focus:border-cyan-500";

  return (
    <fieldset>
      <legend className="text-xs font-medium text-zinc-400">
        What was actually sold?
      </legend>

      <div className="mt-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
        <label className="block text-xs font-medium text-zinc-400">
          Search Event Inventory
          <input
            type="search"
            autoComplete="off"
            maxLength={200}
            value={query}
            disabled={disabled || !snapshot?.manifest}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              snapshot?.manifest
                ? "Name, color, variation, or price"
                : "Import Event Inventory in the full ledger first"
            }
            className={`mt-2 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-zinc-100 outline-none disabled:cursor-not-allowed disabled:opacity-60 ${focusClass}`}
          />
        </label>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
          <span>
            {snapshot?.manifest
              ? `${snapshot.summary.expectedQuantity} of ${snapshot.summary.openingQuantity} units expected`
              : "Manual Sale lines remain available for unlisted items."}
          </span>
          {loading ? <span role="status">Searching…</span> : null}
        </div>

        {normalizedQuery && snapshot?.manifest ? (
          <div
            className="mt-3 space-y-2"
            role="list"
            aria-label="Event Inventory results"
          >
            {snapshot.items.length ? (
              snapshot.items.map((stockItem) => {
                const unavailable = stockItem.expectedQuantity < 1;
                const selected = selectedIds.has(stockItem.id);
                return (
                  <button
                    key={stockItem.id}
                    type="button"
                    role="listitem"
                    disabled={disabled || unavailable}
                    onClick={() => chooseStockItem(stockItem)}
                    className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left outline-none transition disabled:opacity-50 ${resultClass}`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-zinc-100">
                        {stockItem.name}
                      </span>
                      <span className="mt-1 block truncate text-xs text-zinc-400">
                        {[stockItem.variation, stockItem.color]
                          .filter(Boolean)
                          .join(" · ") || "Standard option"}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold tabular-nums text-cyan-200">
                        {money(stockItem.unitPriceCents, currency)}
                      </span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {unavailable
                          ? "Sold out"
                          : selected
                            ? `${stockItem.expectedQuantity} left · add one`
                            : `${stockItem.expectedQuantity} left`}
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-5 text-center text-sm text-zinc-500">
                No stocked option matches this search. Add an untracked item
                only if it truly was not in the imported manifest.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-3 space-y-3">
        {items.map((item, index) => {
          const tracked = Boolean(item.inventoryItemId);
          return (
            <div
              key={item.id}
              className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3"
            >
              {tracked ? (
                <div className="min-w-0 self-center">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Tracked
                    </span>
                    <span className="text-xs text-zinc-500">
                      Item {index + 1}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-zinc-100">
                    {item.description}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {item.unitListPriceCents === undefined
                      ? "Imported option"
                      : `${money(item.unitListPriceCents, currency)} list · ${item.expectedQuantity ?? "?"} expected`}
                  </p>
                </div>
              ) : (
                <label className="text-xs text-zinc-500">
                  Untracked item {index + 1}
                  <input
                    required
                    maxLength={160}
                    value={item.description}
                    disabled={disabled}
                    onChange={(event) =>
                      updateItem(item.id, { description: event.target.value })
                    }
                    placeholder="Describe an item absent from the manifest"
                    className={`mt-1 min-h-11 w-full rounded-lg border border-amber-900/70 bg-zinc-900 px-3 text-base text-zinc-100 outline-none disabled:opacity-50 ${focusClass}`}
                  />
                </label>
              )}
              <label className="text-xs text-zinc-500">
                Qty
                <input
                  required
                  inputMode="numeric"
                  type="number"
                  min="1"
                  max={item.expectedQuantity ?? 1000}
                  step="1"
                  value={item.quantity}
                  disabled={disabled}
                  onChange={(event) =>
                    updateItem(item.id, { quantity: event.target.value })
                  }
                  className={`mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2 text-center text-base text-zinc-100 outline-none disabled:opacity-50 ${focusClass}`}
                />
              </label>
              {items.length > 1 || tracked ? (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => removeItem(item.id)}
                  className="min-h-11 justify-self-start px-1 text-xs font-medium text-red-300 disabled:opacity-50"
                >
                  Remove item
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled || items.length >= 25}
        onClick={() => onChange([...items, newEventSaleItem()])}
        className="mt-2 min-h-11 rounded-lg px-2 text-sm font-semibold text-amber-300 disabled:text-zinc-600"
      >
        + Add untracked item
      </button>
    </fieldset>
  );
}
