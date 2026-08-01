"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VendorEventSalePanel from "@/features/events/VendorEventSalePanel";
import {
  EVENT_PAYMENT_METHODS,
  PURCHASE_PRODUCT_LINES,
  type EventCurrency,
  type EventPaymentMethod,
  type ExactPurchaseLine,
  type PurchaseEvent,
  type PurchaseLine,
  type PurchaseProductLine,
  type PurchaseReceipt,
} from "@/lib/purchases/domain";
import type {
  PriceState,
  PricingCondition,
  SearchMatch,
} from "@/lib/pricing/types";

type CheckoutState = {
  event: PurchaseEvent | null;
  cart: PurchaseLine[];
  receipts: PurchaseReceipt[];
};

const productLineLabels: Record<PurchaseProductLine, string> = {
  MAGIC: "Magic",
  POKEMON: "Pokémon",
  ONE_PIECE: "One Piece",
  LORCANA: "Lorcana",
};

function money(cents: number, currency: EventCurrency | null = "USD") {
  const selectedCurrency = currency ?? "USD";
  return new Intl.NumberFormat(selectedCurrency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency: selectedCurrency,
  }).format(cents / 100);
}

function cents(value: string): number | null {
  const parsed = Number(value);
  const rounded = Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
  return rounded > 0 ? rounded : null;
}

export default function VendorCheckout({
  canOperate,
  match,
  condition,
  price,
  recommendedOffer,
  marketReferenceCents,
}: {
  canOperate: boolean;
  match: SearchMatch | null;
  condition: PricingCondition;
  price: PriceState | null;
  recommendedOffer: number | null;
  marketReferenceCents: number | null;
}) {
  const [state, setState] = useState<CheckoutState>({
    event: null,
    cart: [],
    receipts: [],
  });
  const [message, setMessage] = useState<string | null>(null);
  const [stationMode, setStationMode] = useState<"PURCHASE" | "SALE">(
    "PURCHASE",
  );
  const [pending, setPending] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<EventPaymentMethod>("CASH");
  const [actualPaidInput, setActualPaidInput] = useState({
    key: "",
    value: "",
  });
  const [exactQuantity, setExactQuantity] = useState("1");
  const [exactNotes, setExactNotes] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLines, setBulkLines] = useState<PurchaseProductLine[]>([]);
  const [bulkPaid, setBulkPaid] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkQuantity, setBulkQuantity] = useState("");
  const [casePlacementsByLine, setCasePlacementsByLine] = useState<
    Record<string, { price: string; quantity: string }>
  >({});

  async function load() {
    const response = await fetch("/api/purchases", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as CheckoutState & {
      error?: string;
    };
    if (!response.ok) throw new Error(body.error ?? "Checkout could not load.");
    setState(body);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/purchases", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response
          .json()
          .catch(() => ({}))) as CheckoutState & { error?: string };
        if (!response.ok)
          throw new Error(body.error ?? "Checkout could not load.");
        return body;
      })
      .then((body) => {
        if (!cancelled) setState(body);
      })
      .catch((error) => {
        if (!cancelled)
          setMessage(
            error instanceof Error ? error.message : "Checkout could not load.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const selectionKey = `${match?.sku ?? ""}:${condition}`;
  const actualPaid =
    actualPaidInput.key === selectionKey
      ? actualPaidInput.value
      : recommendedOffer === null
        ? ""
        : recommendedOffer.toFixed(2);

  async function mutate(body: Record<string, unknown>) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok)
        throw new Error(result.error ?? "Checkout operation failed.");
      await load();
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Checkout operation failed.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }

  async function addExact() {
    if (!state.event || !match) return;
    const paid = cents(actualPaid);
    if (paid === null) {
      setMessage("Enter the actual agreed purchase price.");
      return;
    }
    const quantity = Number(exactQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 1000) {
      setMessage("Purchase quantity must be between 1 and 1000.");
      return;
    }
    const success = await mutate({
      action: "add-line",
      eventId: state.event.id,
      line: {
        kind: "EXACT",
        categoryId: match.categoryId,
        sku: match.sku,
        condition: match.productType === "SEALED" ? "Unopened" : condition,
        quantity,
        actualPaidCents: paid,
        recommendedOfferCents:
          recommendedOffer === null ? null : Math.round(recommendedOffer * 100),
        marketReferenceCents,
        snapshotDate: price?.snapshotDate ?? null,
        notes: exactNotes,
      },
    });
    if (success) {
      setExactQuantity("1");
      setExactNotes("");
      setMessage(`${match.name} added to event checkout.`);
    }
  }

  async function addBulk() {
    if (!state.event) return;
    const paid = cents(bulkPaid);
    if (paid === null || !bulkLines.length || !bulkNotes.trim()) {
      setMessage("Bulk requires product lines, total paid, and notes.");
      return;
    }
    const success = await mutate({
      action: "add-line",
      eventId: state.event.id,
      line: {
        kind: "BULK",
        productLines: bulkLines,
        actualPaidCents: paid,
        notes: bulkNotes,
        approximateQuantity: bulkQuantity || null,
      },
    });
    if (success) {
      setBulkPaid("");
      setBulkNotes("");
      setBulkQuantity("");
      setBulkLines([]);
      setBulkOpen(false);
      setMessage("Bulk purchase added to event checkout.");
    }
  }

  async function removeLine(lineId: string) {
    const success = await mutate({
      action: "remove-line",
      lineId,
    });
    if (success) {
      setCasePlacementsByLine((current) => {
        const next = { ...current };
        delete next[lineId];
        return next;
      });
    }
  }

  async function finalize() {
    if (!state.event || !state.cart.length) return;
    const selectedCaseLines = state.cart.filter(
      (line): line is ExactPurchaseLine =>
        line.kind === "EXACT" &&
        line.productType === "SINGLE" &&
        Object.prototype.hasOwnProperty.call(casePlacementsByLine, line.id),
    );
    const casePlacements = selectedCaseLines.map((line) => ({
      lineId: line.id,
      quantity: Number(casePlacementsByLine[line.id]?.quantity),
      salePriceCents: cents(casePlacementsByLine[line.id]?.price ?? ""),
    }));
    if (casePlacements.some((placement) => placement.salePriceCents === null)) {
      setMessage("Enter a positive Case Sale price for every selected card.");
      return;
    }
    if (
      casePlacements.some(
        (placement, index) =>
          !Number.isInteger(placement.quantity) ||
          placement.quantity <= 0 ||
          placement.quantity > selectedCaseLines[index].quantity,
      )
    ) {
      setMessage(
        "Case quantity must be between 1 and the purchased quantity for every selected card.",
      );
      return;
    }
    const success = await mutate({
      action: "checkout",
      eventId: state.event.id,
      paymentMethod,
      idempotencyKey: `checkout:${crypto.randomUUID()}`,
      casePlacements,
    });
    if (success) {
      setCasePlacementsByLine({});
      setMessage(
        selectedCaseLines.length
          ? `Purchase finalized and ${selectedCaseLines.length} card ${selectedCaseLines.length === 1 ? "was" : "were"} sent to the Display Case.`
          : "Purchase receipt finalized and ledgered.",
      );
    }
  }

  const total = useMemo(
    () =>
      state.cart.reduce(
        (sum, line) =>
          sum +
          line.actualPaidCents * (line.kind === "EXACT" ? line.quantity : 1),
        0,
      ),
    [state.cart],
  );
  const eventCurrency = state.event?.currency ?? null;
  const selectedCaseLineCount = state.cart.filter((line) =>
    Object.prototype.hasOwnProperty.call(casePlacementsByLine, line.id),
  ).length;

  return (
    <section
      aria-labelledby="vendor-checkout-heading"
      className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
            Event operations
          </p>
          <h2
            id="vendor-checkout-heading"
            className="mt-1 text-xl font-semibold text-white"
          >
            Event station
          </h2>
        </div>
        {state.event ? (
          <p className="text-right text-sm text-zinc-300">
            {state.event.name}
            <span className="block text-xs text-zinc-500">
              {state.event.eventDate}
              {state.event.location ? ` · ${state.event.location}` : ""}
            </span>
          </p>
        ) : null}
      </div>

      {!state.event ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-5">
          <p className="text-sm text-zinc-300">
            Start the event and declare opening cash before recording purchases
            or Sales.
          </p>
          <Link
            href="/event-ledger"
            className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950"
          >
            Open Event Ledger →
          </Link>
        </div>
      ) : (
        <>
          <div
            role="group"
            aria-label="Event station mode"
            className="mt-4 grid grid-cols-2 rounded-xl border border-zinc-700 bg-zinc-950 p-1"
          >
            <button
              type="button"
              aria-pressed={stationMode === "PURCHASE"}
              onClick={() => setStationMode("PURCHASE")}
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
                stationMode === "PURCHASE"
                  ? "bg-cyan-300 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Purchase intake
            </button>
            <button
              type="button"
              aria-pressed={stationMode === "SALE"}
              onClick={() => setStationMode("SALE")}
              className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
                stationMode === "SALE"
                  ? "bg-emerald-300 text-zinc-950"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Quick sale
            </button>
          </div>

          <div
            className={
              stationMode === "PURCHASE"
                ? "mt-4 grid gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(320px,1.2fr)]"
                : "hidden"
            }
          >
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm font-semibold text-zinc-100">
                Selected product
              </p>
              {match ? (
                <>
                  <p className="mt-2 text-sm text-zinc-200">{match.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {match.setName} · {match.variant} ·{" "}
                    {match.productType === "SEALED" ? "Unopened" : condition}
                  </p>
                  <label className="mt-3 block text-xs text-zinc-400">
                    Actual agreed price
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={actualPaid}
                      onChange={(event) =>
                        setActualPaidInput({
                          key: selectionKey,
                          value: event.target.value,
                        })
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
                    />
                  </label>
                  <label className="mt-3 block text-xs text-zinc-400">
                    Purchase quantity
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="1"
                      inputMode="numeric"
                      value={exactQuantity}
                      onChange={(event) => setExactQuantity(event.target.value)}
                      className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
                    />
                  </label>
                  <label className="mt-3 block text-xs text-zinc-400">
                    Purchase notes
                    <input
                      value={exactNotes}
                      onChange={(event) => setExactNotes(event.target.value)}
                      placeholder="Optional"
                      className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-100"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={addExact}
                    className="mt-3 min-h-11 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-60"
                  >
                    Add selected product
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  Select a catalogue product to add an exact line.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setBulkOpen((current) => !current)}
              className="min-h-11 w-full rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200"
            >
              {bulkOpen ? "Close Bulk entry" : "Add Bulk purchase"}
            </button>
            {bulkOpen ? (
              <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-4">
                <fieldset>
                  <legend className="text-xs text-zinc-400">
                    Product lines
                  </legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PURCHASE_PRODUCT_LINES.map((line) => (
                      <label
                        key={line}
                        className="flex min-h-11 items-center gap-2 text-sm text-zinc-300"
                      >
                        <input
                          type="checkbox"
                          checked={bulkLines.includes(line)}
                          onChange={(event) =>
                            setBulkLines((current) =>
                              event.target.checked
                                ? [...current, line]
                                : current.filter((item) => item !== line),
                            )
                          }
                          className="accent-cyan-300"
                        />
                        {productLineLabels[line]}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="mt-3 block text-xs text-zinc-400">
                  Total paid
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={bulkPaid}
                    onChange={(event) => setBulkPaid(event.target.value)}
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3"
                  />
                </label>
                <label className="mt-3 block text-xs text-zinc-400">
                  Approximate card count
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={bulkQuantity}
                    onChange={(event) => setBulkQuantity(event.target.value)}
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3"
                  />
                </label>
                <label className="mt-3 block text-xs text-zinc-400">
                  Notes · required
                  <textarea
                    value={bulkNotes}
                    onChange={(event) => setBulkNotes(event.target.value)}
                    className="mt-1 min-h-20 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3"
                  />
                </label>
                <button
                  type="button"
                  disabled={pending}
                  onClick={addBulk}
                  className="mt-3 min-h-11 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-60"
                >
                  Add Bulk
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                Current purchase
              </p>
              <p className="font-semibold tabular-nums text-cyan-200">
                {money(total, state.event.currency)}
              </p>
            </div>
            {state.cart.length ? (
              <ul className="mt-3 space-y-2">
                {state.cart.map((line) => {
                  const caseEligible =
                    line.kind === "EXACT" && line.productType === "SINGLE";
                  const sendToCase = Object.prototype.hasOwnProperty.call(
                    casePlacementsByLine,
                    line.id,
                  );
                  return (
                    <li
                      key={line.id}
                      className="rounded-lg border border-zinc-800 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-200">
                            {line.kind === "BULK"
                              ? `Bulk · ${line.productLines.map((item) => productLineLabels[item]).join(", ")}`
                              : line.name}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {line.kind === "BULK"
                              ? line.notes
                              : `${line.setName} · ${line.condition}`}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold text-zinc-100">
                            {money(
                              line.actualPaidCents *
                                (line.kind === "EXACT" ? line.quantity : 1),
                              eventCurrency,
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => void removeLine(line.id)}
                            className="min-h-11 px-2 text-xs text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      {caseEligible ? (
                        <div className="mt-3 border-t border-zinc-800 pt-3">
                          <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-zinc-200">
                            <input
                              type="checkbox"
                              checked={sendToCase}
                              onChange={(event) => {
                                const checked = event.target.checked;
                                setCasePlacementsByLine((current) => {
                                  if (!checked) {
                                    const next = { ...current };
                                    delete next[line.id];
                                    return next;
                                  }
                                  return {
                                    ...current,
                                    [line.id]: {
                                      quantity: "1",
                                      price: line.marketReferenceCents
                                        ? (line.marketReferenceCents / 100).toFixed(2)
                                        : "",
                                    },
                                  };
                                });
                              }}
                              className="size-4 accent-cyan-300"
                            />
                            Send directly to Display Case
                          </label>
                          {sendToCase ? (
                            <div className="mt-2 grid gap-3 sm:grid-cols-2">
                              <label className="block text-xs font-medium text-zinc-400">
                                Case quantity
                                <input
                                  type="number"
                                  min="1"
                                  max={line.quantity}
                                  step="1"
                                  inputMode="numeric"
                                  value={casePlacementsByLine[line.id]?.quantity ?? "1"}
                                  onChange={(event) =>
                                    setCasePlacementsByLine((current) => ({
                                      ...current,
                                      [line.id]: {
                                        ...(current[line.id] ?? { price: "" }),
                                        quantity: event.target.value,
                                      },
                                    }))
                                  }
                                  className="mt-1 min-h-11 w-full rounded-lg border border-cyan-700 bg-zinc-900 px-3 text-zinc-100 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                                />
                              </label>
                              <label className="block text-xs font-medium text-zinc-400">
                                Case Sale price · required
                                <input
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  inputMode="decimal"
                                  value={casePlacementsByLine[line.id]?.price ?? ""}
                                  onChange={(event) =>
                                    setCasePlacementsByLine((current) => ({
                                      ...current,
                                      [line.id]: {
                                        ...(current[line.id] ?? { quantity: "1" }),
                                        price: event.target.value,
                                      },
                                    }))
                                  }
                                  className="mt-1 min-h-11 w-full rounded-lg border border-cyan-700 bg-zinc-900 px-3 text-zinc-100 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                                />
                              </label>
                              <p className="text-xs text-zinc-500 sm:col-span-2">
                                Defaults to 1 of {line.quantity} purchased. Remaining copies stay available in General Inventory and Event Flip.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : line.kind === "EXACT" ? (
                        <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                          Sealed products stay in General Inventory.
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                No purchases added yet.
              </p>
            )}
            <fieldset className="mt-4">
              <legend className="text-xs text-zinc-400">Payment method</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {EVENT_PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    aria-pressed={paymentMethod === method}
                    onClick={() => setPaymentMethod(method)}
                    className={`min-h-11 rounded-lg border px-2 text-xs font-semibold ${paymentMethod === method ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-zinc-700 text-zinc-400"}`}
                  >
                    {method === "TRANSFER"
                      ? "Transfer"
                      : method[0] + method.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </fieldset>
            <button
              type="button"
              disabled={pending || !state.cart.length}
              onClick={finalize}
              className="mt-4 min-h-12 w-full rounded-lg bg-emerald-300 px-4 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {selectedCaseLineCount
                ? `Finalize purchase + send ${selectedCaseLineCount} to Case`
                : "Finalize purchase receipt"}
            </button>
            <Link
              href="/event-ledger"
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-cyan-300"
            >
              View live drawer →
            </Link>
            {state.receipts[0] ? (
              <p className="mt-3 text-xs text-zinc-500">
                Last receipt {state.receipts[0].id.slice(0, 8)} ·{" "}
                {money(state.receipts[0].totalCents, state.event.currency)} ·{" "}
                {new Date(state.receipts[0].createdAt).toLocaleString()}
              </p>
            ) : null}
          </div>
          </div>

          <div className={stationMode === "SALE" ? "mt-4" : "hidden"}>
            <VendorEventSalePanel
              key={state.event.id}
              active={stationMode === "SALE"}
              canOperate={canOperate}
              event={state.event}
            />
          </div>
        </>
      )}
      {message ? (
        <p role="status" className="mt-3 text-sm text-zinc-300">
          {message}
        </p>
      ) : null}
    </section>
  );
}
