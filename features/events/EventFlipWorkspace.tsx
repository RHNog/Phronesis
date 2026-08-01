"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type {
  EventFlipCandidate,
  EventFlipSnapshot,
} from "@/lib/events/displayCase";

type SelectionDraft = {
  selected: boolean;
  quantity: string;
  salePrice: string;
};

function money(cents: number, currency: "USD" | "BRL" | null): string {
  if (!currency) return `${(cents / 100).toFixed(2)}`;
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function priceInput(cents: number | null): string {
  return cents === null ? "" : (cents / 100).toFixed(2);
}

function priceCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized) * 100);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

function itemDetails(item: EventFlipCandidate): string {
  return [
    item.setName,
    item.collectorNumber ? `#${item.collectorNumber}` : null,
    item.variant,
    item.language,
    item.condition,
  ]
    .filter(Boolean)
    .join(" · ");
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-100">
        {value}
      </p>
    </div>
  );
}

export default function EventFlipWorkspace({
  canOperate,
}: {
  canOperate: boolean;
}) {
  const [snapshot, setSnapshot] = useState<EventFlipSnapshot | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SelectionDraft>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [blockedOpen, setBlockedOpen] = useState(false);

  function adoptSnapshot(next: EventFlipSnapshot) {
    setSnapshot(next);
    setDrafts((current) => {
      const result: Record<string, SelectionDraft> = {};
      for (const item of next.candidates) {
        result[item.id] = current[item.id] ?? {
          selected: false,
          quantity: "1",
          salePrice: priceInput(item.suggestedSalePriceCents),
        };
      }
      return result;
    });
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/event-flip", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          snapshot?: EventFlipSnapshot;
          error?: string;
        };
        if (!response.ok || !body.snapshot) {
          throw new Error(body.error ?? "Event Flip could not load.");
        }
        if (!cancelled) adoptSnapshot(body.snapshot);
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(
            reason instanceof Error ? reason.message : "Event Flip could not load.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleCandidates = useMemo(() => {
    const tokens = query
      .trim()
      .toLocaleLowerCase("en-US")
      .split(/\s+/)
      .filter(Boolean);
    if (!tokens.length) return snapshot?.candidates ?? [];
    return (snapshot?.candidates ?? []).filter((item) => {
      const searchable = [item.name, itemDetails(item), item.sku]
        .join(" ")
        .toLocaleLowerCase("en-US");
      return tokens.every((token) => searchable.includes(token));
    });
  }, [query, snapshot]);

  const selected = (snapshot?.candidates ?? []).filter(
    (item) => drafts[item.id]?.selected,
  );
  const selectedQuantity = selected.reduce(
    (sum, item) => sum + Math.max(0, Number(drafts[item.id]?.quantity) || 0),
    0,
  );
  const editable =
    canOperate && snapshot?.event?.status === "ACTIVE" && !pending;
  const eventCurrency = snapshot?.event?.currency ?? null;

  function updateDraft(itemId: string, patch: Partial<SelectionDraft>) {
    setDrafts((current) => ({
      ...current,
      [itemId]: {
        ...(current[itemId] ?? {
          selected: false,
          quantity: "1",
          salePrice: "",
        }),
        ...patch,
      },
    }));
  }

  async function addSelected() {
    if (!snapshot?.event || !selected.length) return;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const selections = selected.map((item) => {
        const draft = drafts[item.id];
        const quantity = Number(draft?.quantity);
        const salePriceCents = priceCents(draft?.salePrice ?? "");
        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > item.availableToFlipQuantity
        ) {
          throw new Error(
            `${item.name} quantity must be between 1 and ${item.availableToFlipQuantity}.`,
          );
        }
        if (salePriceCents === null) {
          throw new Error(`${item.name} needs a positive Sale price.`);
        }
        return { inventoryLotId: item.inventoryLotId, quantity, salePriceCents };
      });
      const response = await fetch("/api/event-flip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-to-case",
          eventId: snapshot.event.id,
          idempotencyKey: `event-flip:${crypto.randomUUID()}`,
          selections,
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        snapshot?: EventFlipSnapshot;
        error?: string;
      };
      if (!response.ok || !body.snapshot) {
        throw new Error(body.error ?? "Cards could not be added to the Case.");
      }
      adoptSnapshot(body.snapshot);
      setDrafts((current) =>
        Object.fromEntries(
          Object.entries(current).map(([id, draft]) => [
            id,
            { ...draft, selected: false, quantity: "1" },
          ]),
        ),
      );
      setMessage(
        `${selectedQuantity} card${selectedQuantity === 1 ? "" : "s"} added to the Display Case.`,
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Cards could not be added to the Case.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-6xl space-y-5">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-300">
              Purchase-fed sorting lane
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              Event Flip
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
              Select newly purchased exact cards, confirm their Case quantity and
              intended Sale price, then place the whole batch in one action.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <Link
              href="/display-case"
              className="inline-flex min-h-11 items-center rounded-lg border border-fuchsia-800 px-3 text-fuchsia-200"
            >
              Open Display Case
            </Link>
            <Link
              href="/inventory"
              className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-3 text-zinc-300"
            >
              General Inventory
            </Link>
          </nav>
        </div>
        {snapshot?.event ? (
          <p className="mt-4 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-100">
              {snapshot.event.name}
            </span>
            {` · ${snapshot.event.eventDate} · ${snapshot.event.status}`}
          </p>
        ) : null}
      </header>

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

      {snapshot ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryCard
            label="Exact card options"
            value={snapshot.summary.exactCardOptions}
          />
          <SummaryCard
            label="Ready to flip"
            value={snapshot.summary.readyToFlipUnits}
          />
          <SummaryCard
            label="Already in Case"
            value={snapshot.summary.alreadyInCaseUnits}
          />
          <SummaryCard
            label="General only"
            value={snapshot.summary.blockedOutcomes}
          />
        </div>
      ) : null}

      {loading ? (
        <p role="status" className="py-12 text-center text-sm text-zinc-500">
          Loading purchased cards…
        </p>
      ) : !snapshot?.event ? (
        <section className="rounded-2xl border border-dashed border-zinc-800 px-5 py-12 text-center">
          <h2 className="text-xl font-semibold text-zinc-100">No event yet</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Start an Event Ledger, then completed Purchase checkouts will appear
            here automatically.
          </p>
          <Link
            href="/event-ledger"
            className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-fuchsia-300 px-4 text-sm font-semibold text-zinc-950"
          >
            Open Event Ledger
          </Link>
        </section>
      ) : (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3 sm:p-5">
          <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
            <label className="w-full min-w-0 text-xs font-medium text-zinc-400 sm:max-w-md sm:flex-1">
              Find a purchased card
              <input
                type="search"
                value={query}
                maxLength={200}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, set, number, variation, or SKU"
                className="mt-2 min-h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-fuchsia-400"
              />
            </label>
            <p className="text-xs text-zinc-500">
              {visibleCandidates.length} option
              {visibleCandidates.length === 1 ? "" : "s"} shown
            </p>
          </div>

          {visibleCandidates.length ? (
            <ul className="mt-4 space-y-3">
              {visibleCandidates.map((item) => {
                const draft = drafts[item.id] ?? {
                  selected: false,
                  quantity: "1",
                  salePrice: priceInput(item.suggestedSalePriceCents),
                };
                const unavailable = item.availableToFlipQuantity < 1;
                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border p-3 sm:p-4 ${
                      draft.selected
                        ? "border-fuchsia-700 bg-fuchsia-950/20"
                        : "border-zinc-800 bg-zinc-950/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        aria-label={`Select ${item.name}`}
                        checked={draft.selected}
                        disabled={!editable || unavailable}
                        onChange={(event) =>
                          updateDraft(item.id, { selected: event.target.checked })
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-fuchsia-300"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h2 className="truncate font-semibold text-zinc-100">
                              {item.name}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-zinc-400">
                              {itemDetails(item) || item.sku}
                            </p>
                          </div>
                          <div className="shrink-0 text-right text-xs">
                            <p className="font-semibold tabular-nums text-zinc-200">
                              {item.availableToFlipQuantity} available
                            </p>
                            <p className="mt-1 text-zinc-500">
                              {item.onHandQuantity} owned · {item.displayCaseQuantity}{" "}
                              in Case
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[7rem_10rem_minmax(0,1fr)] sm:items-end">
                          <label className="text-xs text-zinc-500">
                            Case qty
                            <input
                              type="number"
                              min="1"
                              max={item.availableToFlipQuantity}
                              step="1"
                              value={draft.quantity}
                              disabled={!editable || unavailable}
                              onChange={(event) =>
                                updateDraft(item.id, {
                                  quantity: event.target.value,
                                })
                              }
                              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base tabular-nums text-zinc-100 outline-none focus:border-fuchsia-400 disabled:opacity-50"
                            />
                          </label>
                          <label className="text-xs text-zinc-500">
                            Sale price ({eventCurrency ?? "currency"})
                            <input
                              inputMode="decimal"
                              value={draft.salePrice}
                              disabled={!editable || unavailable}
                              onChange={(event) =>
                                updateDraft(item.id, {
                                  salePrice: event.target.value,
                                })
                              }
                              placeholder="Required"
                              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base tabular-nums text-zinc-100 outline-none focus:border-fuchsia-400 disabled:opacity-50"
                            />
                          </label>
                          <p className="col-span-2 text-xs leading-5 text-zinc-500 sm:col-span-1 sm:pb-2">
                            Cost {money(item.unitCostCents, eventCurrency)}
                            {item.suggestedSalePriceCents === null
                              ? " · no market-reference price was stored"
                              : ` · reference ${money(item.suggestedSalePriceCents, eventCurrency)}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
              No purchased exact card matches this search.
            </p>
          )}

          {snapshot.event.status === "CLOSED" ? (
            <p className="mt-4 rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2 text-sm text-amber-200">
              This event is closed. Its sorting evidence remains visible, but new
              cards cannot be placed in the Case.
            </p>
          ) : null}

          <div className={`${selected.length ? "sticky bottom-3" : ""} mt-4 rounded-xl border border-fuchsia-800/80 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4`}>
            <p className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-100">
                {selected.length} selected
              </span>
              {` · ${selectedQuantity} card${selectedQuantity === 1 ? "" : "s"}`}
            </p>
            <button
              type="button"
              disabled={!editable || !selected.length}
              onClick={() => void addSelected()}
              className="mt-3 min-h-12 w-full rounded-lg bg-fuchsia-300 px-4 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40 sm:mt-0 sm:w-auto"
            >
              {pending ? "Adding cards…" : "Add selected to Display Case"}
            </button>
          </div>
        </section>
      )}

      {snapshot?.blocked.length ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-3 sm:p-5">
          <button
            type="button"
            aria-expanded={blockedOpen}
            onClick={() => setBlockedOpen((current) => !current)}
            className="flex min-h-11 w-full items-center justify-between gap-3 text-left"
          >
            <span>
              <span className="block font-semibold text-zinc-200">
                General-only and unitemized outcomes
              </span>
              <span className="mt-1 block text-xs text-zinc-500">
                {snapshot.blocked.length} Purchase outcome
                {snapshot.blocked.length === 1 ? "" : "s"} preserved truthfully
              </span>
            </span>
            <span className="text-xl text-zinc-500" aria-hidden="true">
              {blockedOpen ? "−" : "+"}
            </span>
          </button>
          {blockedOpen ? (
            <ul className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
              {snapshot.blocked.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {item.source.replaceAll("_", " ")}
                    </span>
                    <span className="text-sm font-semibold text-zinc-200">
                      {item.description}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    {item.reason}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
