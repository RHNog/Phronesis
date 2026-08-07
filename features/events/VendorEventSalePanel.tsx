"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import EventSaleItemsEditor, {
  newEventSaleItem,
  type EventSaleItemInput,
} from "@/features/events/EventSaleItemsEditor";
import {
  EVENT_PAYMENT_METHODS,
  type EventCurrency,
  type EventLedgerSnapshot,
  type EventPaymentMethod,
  type PurchaseEvent,
} from "@/lib/purchases/domain";

const paymentLabels: Record<EventPaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  TRANSFER: "Transfer",
  OTHER: "Other",
};

function positiveCents(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  const cents = Math.round(parsed * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function money(cents: number | null, currency: EventCurrency | null): string {
  if (cents === null || !currency) return "Unknown";
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default function VendorEventSalePanel({
  active,
  canOperate,
  event,
}: {
  active: boolean;
  canOperate: boolean;
  event: PurchaseEvent;
}) {
  const [snapshot, setSnapshot] = useState<EventLedgerSnapshot | null>(null);
  const [pending, setPending] = useState(false);
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState<EventSaleItemInput[]>(() => [
    newEventSaleItem(),
  ]);
  const [stockRefreshToken, setStockRefreshToken] = useState(0);
  const [paymentMethod, setPaymentMethod] =
    useState<EventPaymentMethod>("CASH");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | null>(null);
  const amountInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void fetch("/api/event-ledger", { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          snapshot?: EventLedgerSnapshot;
          error?: string;
        };
        if (!response.ok || !body.snapshot) {
          throw new Error(body.error ?? "Event Ledger could not load.");
        }
        if (body.snapshot.event?.id !== event.id) {
          throw new Error(
            "The active Event Ledger changed. Open the full ledger to continue.",
          );
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
              : "Event Ledger could not load.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [active, event.id]);

  async function recordSale(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const amountCents = positiveCents(amount);
    if (amountCents === null) {
      setError("Enter a positive total sale amount.");
      return;
    }

    const soldItems = items.map((item) => ({
      description: item.description.trim(),
      quantity: Number(item.quantity),
      inventoryItemId: item.inventoryItemId,
      caseItemId: item.caseItemId,
      productOwnerId: item.productOwnerId ?? undefined,
    }));
    if (soldItems.some((item) => !item.description)) {
      setError("Describe every item sold.");
      return;
    }
    if (
      soldItems.some(
        (item) =>
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 1000,
      )
    ) {
      setError(
        "Every sold-item quantity must be a whole number from 1 to 1,000.",
      );
      return;
    }

    const operationKey =
      idempotencyKey.current ?? `vendor-sale:${crypto.randomUUID()}`;
    idempotencyKey.current = operationKey;
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/event-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "record-sale",
          eventId: event.id,
          idempotencyKey: operationKey,
          sale: {
            amountCents,
            paymentMethod,
            items: soldItems,
            notes,
          },
        }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        snapshot?: EventLedgerSnapshot;
        error?: string;
      };
      if (!response.ok || !body.snapshot) {
        throw new Error(body.error ?? "Sale could not be recorded.");
      }
      if (body.snapshot.event?.id !== event.id) {
        throw new Error(
          "The Event Ledger changed before the Sale was confirmed.",
        );
      }

      setSnapshot(body.snapshot);
      idempotencyKey.current = null;
      setAmount("");
      setItems([newEventSaleItem()]);
      setStockRefreshToken((value) => value + 1);
      setPaymentMethod("CASH");
      setNotes("");
      setMessage("Sale recorded in the shared Event Ledger.");
      window.setTimeout(() => amountInput.current?.focus(), 0);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Sale could not be recorded.",
      );
    } finally {
      setPending(false);
    }
  }

  const summary = snapshot?.summary ?? null;
  const currency = snapshot?.event?.currency ?? event.currency;
  const loading = active && !snapshot && !error;
  const canRecord =
    canOperate &&
    snapshot?.event?.status === "ACTIVE" &&
    event.status === "ACTIVE";

  return (
    <section
      aria-labelledby="vendor-quick-sale-heading"
      className="rounded-xl border border-emerald-900/70 bg-emerald-950/10 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            Lite Event Ledger
          </p>
          <h3
            id="vendor-quick-sale-heading"
            className="mt-1 text-lg font-semibold text-white"
          >
            Quick sale
          </h3>
          <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
            Record the Sale here. Drawer control, activity, correction, and
            close remain in the full Event Ledger.
          </p>
        </div>
        <Link
          href="/event-ledger"
          className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          Open full Event Ledger →
        </Link>
      </div>

      {loading ? (
        <p className="mt-4 animate-pulse text-sm text-zinc-400">
          Loading live drawer…
        </p>
      ) : null}

      {summary ? (
        <div
          aria-label="Lite event cash summary"
          className="mt-4 grid grid-cols-2 gap-3"
        >
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Expected cash
            </p>
            <p className="mt-2 break-words text-xl font-semibold tabular-nums text-white">
              {money(summary.expectedCashCents, currency)}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Gross sales
            </p>
            <p className="mt-2 break-words text-xl font-semibold tabular-nums text-emerald-200">
              {money(summary.grossSalesCents, currency)}
            </p>
          </div>
        </div>
      ) : null}

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
          className="mt-4 rounded-lg border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200"
        >
          {message}
        </p>
      ) : null}

      {!canOperate ? (
        <p className="mt-4 text-sm text-amber-200">
          View-only access: Operate permission is required to record a Sale.
        </p>
      ) : snapshot && snapshot.event?.status !== "ACTIVE" ? (
        <p className="mt-4 text-sm text-amber-200">
          This event is closed. Open the full Event Ledger to review or start
          the next event.
        </p>
      ) : null}

      {canRecord ? (
        <form onSubmit={recordSale} className="mt-5 space-y-4">
          <label className="block text-xs font-medium text-zinc-400">
            Total sale amount
            <input
              ref={amountInput}
              required
              inputMode="decimal"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(inputEvent) => setAmount(inputEvent.target.value)}
              placeholder="0.00"
              className="mt-2 min-h-14 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-2xl font-semibold tabular-nums text-white outline-none focus:border-emerald-300"
            />
          </label>

          <EventSaleItemsEditor
            eventId={event.id}
            currency={currency}
            items={items}
            productOwners={snapshot.productOwners}
            onChange={setItems}
            disabled={pending}
            refreshToken={stockRefreshToken}
            accent="emerald"
          />

          <fieldset>
            <legend className="text-xs font-medium text-zinc-400">
              Payment method
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EVENT_PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  aria-pressed={paymentMethod === method}
                  disabled={pending}
                  onClick={() => setPaymentMethod(method)}
                  className={`min-h-11 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 ${
                    paymentMethod === method
                      ? "border-emerald-300 bg-emerald-300/10 text-emerald-200"
                      : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                  }`}
                >
                  {paymentLabels[method]}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-xs font-medium text-zinc-400">
            Sale note · optional
            <input
              maxLength={500}
              value={notes}
              onChange={(inputEvent) => setNotes(inputEvent.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-emerald-300"
            />
          </label>

          <button
            disabled={pending}
            className="min-h-12 w-full rounded-xl bg-emerald-300 px-5 font-semibold text-zinc-950 transition hover:bg-emerald-200 disabled:opacity-50"
          >
            {pending
              ? "Recording…"
              : `Record sale${items.length > 1 ? ` · ${items.length} items` : ""}`}
          </button>
        </form>
      ) : null}
    </section>
  );
}
