"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import EventInventoryControl from "@/features/events/EventInventoryControl";
import OngoingEventTeamAccess from "@/features/events/OngoingEventTeamAccess";
import EventSaleItemsEditor, {
  newEventSaleItem,
  type EventSaleItemInput,
} from "@/features/events/EventSaleItemsEditor";
import {
  EVENT_PAYMENT_METHODS,
  type EventCurrency,
  type EventLedgerEntry,
  type EventLedgerReportSummary,
  type EventLedgerSnapshot,
  type EventPaymentMethod,
  type EventProductOwnerDraft,
} from "@/lib/purchases/domain";

type EntryMode = "SALE" | "PURCHASE";
type ProductOwnerInput = EventProductOwnerDraft & { id: string };

function newProductOwnerInput(): ProductOwnerInput {
  return { id: crypto.randomUUID(), name: "", reference: "" };
}

const paymentLabels: Record<EventPaymentMethod, string> = {
  CASH: "Cash",
  CARD: "Card",
  TRANSFER: "Transfer",
  OTHER: "Other",
};

const entryLabels: Record<EventLedgerEntry["type"], string> = {
  SALE: "Sale",
  PURCHASE: "Purchase",
  CASH_ADJUSTMENT: "Cash adjustment",
  REVERSAL: "Reversal",
};

function toCents(value: string, allowZero = false): number | null {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || (!allowZero && amount === 0)) {
    return null;
  }
  const cents = Math.round(amount * 100);
  return Number.isSafeInteger(cents) ? cents : null;
}

function localToday(): string {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function money(cents: number | null, currency: EventCurrency | null): string {
  if (cents === null || !currency) return "Unknown";
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

function eventDateLabel(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function PaymentSelector({
  value,
  onChange,
  disabled,
}: {
  value: EventPaymentMethod;
  onChange: (method: EventPaymentMethod) => void;
  disabled: boolean;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-medium text-zinc-400">
        Payment method
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EVENT_PAYMENT_METHODS.map((method) => (
          <button
            key={method}
            type="button"
            aria-pressed={value === method}
            disabled={disabled}
            onClick={() => onChange(method)}
            className={`min-h-11 rounded-lg border px-3 text-sm font-semibold transition disabled:opacity-50 ${
              value === method
                ? "border-cyan-400 bg-cyan-400/10 text-cyan-200"
                : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {paymentLabels[method]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function StartEventForm({
  pending,
  canOperate,
  compact = false,
  onSubmit,
}: {
  pending: boolean;
  canOperate: boolean;
  compact?: boolean;
  onSubmit: (input: {
    name: string;
    eventDate: string;
    location: string;
    currency: EventCurrency;
    openingCashCents: number;
    productOwners: EventProductOwnerDraft[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState("Current Card Show");
  const [eventDate, setEventDate] = useState(localToday);
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState<EventCurrency>("USD");
  const [openingCash, setOpeningCash] = useState("0.00");
  const [productOwners, setProductOwners] = useState<ProductOwnerInput[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const openingCashCents = toCents(openingCash, true);
    if (openingCashCents === null) {
      setLocalError("Enter opening cash as zero or a positive amount.");
      return;
    }
    setLocalError(null);
    await onSubmit({
      name,
      eventDate,
      location,
      currency,
      openingCashCents,
      productOwners: productOwners.map((owner) => ({
        name: owner.name,
        reference: owner.reference,
      })),
    });
  }

  return (
    <section
      className={`rounded-2xl border border-zinc-800 bg-zinc-900/70 ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
        {compact ? "Next event" : "Start the drawer"}
      </p>
      <h2 className="mt-2 text-xl font-semibold text-white">
        {compact ? "Start a new event" : "Declare opening cash"}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
        Opening cash is the baseline for every sale, purchase, adjustment, and
        final count.
      </p>
      {canOperate ? (
        <form onSubmit={submit} className="mt-5 grid gap-4 lg:grid-cols-2">
          <label className="text-xs font-medium text-zinc-400">
            Event name
            <input
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
            />
          </label>
          <label className="text-xs font-medium text-zinc-400">
            Date
            <input
              required
              type="date"
              value={eventDate}
              onChange={(event) => setEventDate(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
            />
          </label>
          <label className="text-xs font-medium text-zinc-400">
            Location · optional
            <input
              maxLength={160}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
            />
          </label>
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3">
            <label className="text-xs font-medium text-zinc-400">
              Currency
              <select
                value={currency}
                onChange={(event) =>
                  setCurrency(event.target.value as EventCurrency)
                }
                className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
              >
                <option value="USD">USD</option>
                <option value="BRL">BRL</option>
              </select>
            </label>
            <label className="text-xs font-medium text-zinc-400">
              Opening cash
              <input
                required
                inputMode="decimal"
                type="number"
                min="0"
                step="0.01"
                value={openingCash}
                onChange={(event) => setOpeningCash(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base tabular-nums text-zinc-100 outline-none focus:border-cyan-400"
              />
            </label>
          </div>
          <fieldset
            aria-labelledby="event-product-owners-heading"
            className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 lg:col-span-2"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3
                  id="event-product-owners-heading"
                  className="text-sm font-semibold text-zinc-200"
                >
                  Product owners · optional
                </h3>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-zinc-500">
                  Add consignors before opening. The roster locks when the
                  event starts; house inventory is always available.
                </p>
              </div>
              <button
                type="button"
                disabled={productOwners.length >= 50}
                onClick={() =>
                  setProductOwners((current) => [
                    ...current,
                    newProductOwnerInput(),
                  ])
                }
                className="min-h-11 rounded-lg border border-cyan-800 px-3 text-sm font-semibold text-cyan-200 disabled:opacity-50"
              >
                + Add product owner
              </button>
            </div>
            {productOwners.length ? (
              <div className="mt-4 space-y-3">
                {productOwners.map((owner, index) => (
                  <div
                    key={owner.id}
                    className="grid gap-2 rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
                  >
                    <label className="text-xs text-zinc-400">
                      Owner name
                      <input
                        required
                        maxLength={100}
                        value={owner.name}
                        onChange={(event) =>
                          setProductOwners((current) =>
                            current.map((candidate) =>
                              candidate.id === owner.id
                                ? { ...candidate, name: event.target.value }
                                : candidate,
                            ),
                          )
                        }
                        placeholder={`Consignor ${index + 1}`}
                        className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
                      />
                    </label>
                    <label className="text-xs text-zinc-400">
                      Reference · optional
                      <input
                        maxLength={120}
                        value={owner.reference ?? ""}
                        onChange={(event) =>
                          setProductOwners((current) =>
                            current.map((candidate) =>
                              candidate.id === owner.id
                                ? {
                                    ...candidate,
                                    reference: event.target.value,
                                  }
                                : candidate,
                            ),
                          )
                        }
                        placeholder="Vendor, booth, or account note"
                        className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setProductOwners((current) =>
                          current.filter(
                            (candidate) => candidate.id !== owner.id,
                          ),
                        )
                      }
                      className="min-h-11 rounded-lg px-3 text-sm font-semibold text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-500">
                No consignors added. Every sale will default to house inventory.
              </p>
            )}
          </fieldset>
          <button
            disabled={pending}
            className="min-h-12 rounded-lg bg-cyan-300 px-5 font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:opacity-50 lg:col-span-2"
          >
            {pending ? "Starting…" : "Start event ledger"}
          </button>
          {localError ? (
            <p role="alert" className="text-sm text-red-300 lg:col-span-2">
              {localError}
            </p>
          ) : null}
        </form>
      ) : (
        <p className="mt-4 text-sm text-amber-200">
          Operate access is required to start an event.
        </p>
      )}
    </section>
  );
}

export default function EventLedgerWorkspace({
  canOperate,
  canManageEventTeam,
  eventTeamSignInRequired,
  publicEventLoginUrl,
  caseSourceSheetUrl,
  initialEventId,
}: {
  canOperate: boolean;
  canManageEventTeam: boolean;
  eventTeamSignInRequired: boolean;
  publicEventLoginUrl: string | null;
  caseSourceSheetUrl: string | null;
  initialEventId: string | null;
}) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<EventLedgerSnapshot | null>(null);
  const [reports, setReports] = useState<EventLedgerReportSummary[]>([]);
  const [reportsTruncated, setReportsTruncated] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(Boolean(initialEventId));
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<EntryMode>("SALE");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<EventPaymentMethod>("CASH");
  const [saleItems, setSaleItems] = useState<EventSaleItemInput[]>(() => [
    newEventSaleItem(),
  ]);
  const [stockRefreshToken, setStockRefreshToken] = useState(0);
  const [saleNotes, setSaleNotes] = useState("");
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const [adjustmentDirection, setAdjustmentDirection] = useState<"IN" | "OUT">(
    "IN",
  );
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [reverseEntryId, setReverseEntryId] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const idempotencyKeys = useRef(new Map<string, string>());
  const amountInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query = initialEventId
      ? `?eventId=${encodeURIComponent(initialEventId)}`
      : "";
    void fetch(`/api/event-ledger${query}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as {
          snapshot?: EventLedgerSnapshot;
          reports?: EventLedgerReportSummary[];
          reportsTruncated?: boolean;
          error?: string;
        };
        if (!response.ok || !body.snapshot) {
          throw new Error(body.error ?? "Event ledger could not load.");
        }
        if (!cancelled) {
          setSnapshot(body.snapshot);
          setReports(body.reports ?? []);
          setReportsTruncated(Boolean(body.reportsTruncated));
          setError(null);
        }
      })
      .catch((reason) => {
        if (!cancelled)
          setError(
            reason instanceof Error
              ? reason.message
              : "Event ledger could not load.",
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialEventId]);

  function openReport(eventId: string) {
    setArchiveOpen(false);
    setLoading(true);
    router.push(`/event-ledger?eventId=${encodeURIComponent(eventId)}`, {
      scroll: false,
    });
  }

  function returnToCurrentEvent() {
    setLoading(true);
    router.push("/event-ledger", { scroll: false });
  }

  function operationKey(scope: string): string {
    const existing = idempotencyKeys.current.get(scope);
    if (existing) return existing;
    const key = `${scope}:${crypto.randomUUID()}`;
    idempotencyKeys.current.set(scope, key);
    return key;
  }

  async function mutate(body: Record<string, unknown>): Promise<boolean> {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/event-ledger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json().catch(() => ({}))) as {
        snapshot?: EventLedgerSnapshot;
        reports?: EventLedgerReportSummary[];
        reportsTruncated?: boolean;
        error?: string;
      };
      if (!response.ok || !result.snapshot) {
        throw new Error(result.error ?? "Event ledger operation failed.");
      }
      setSnapshot(result.snapshot);
      if (result.reports) setReports(result.reports);
      if (result.reportsTruncated !== undefined) {
        setReportsTruncated(result.reportsTruncated);
      }
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Event ledger operation failed.",
      );
      return false;
    } finally {
      setPending(false);
    }
  }

  async function startEvent(input: {
    name: string;
    eventDate: string;
    location: string;
    currency: EventCurrency;
    openingCashCents: number;
    productOwners: EventProductOwnerDraft[];
  }) {
    const success = await mutate({ action: "create-event", ...input });
    if (success) {
      setMessage(
        "Event ledger started. Opening cash and product owners are locked in.",
      );
    }
  }

  async function recordEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const eventId = snapshot?.event?.id;
    const amountCents = toCents(amount);
    if (!eventId || amountCents === null) {
      setError("Enter a positive transaction amount.");
      return;
    }

    if (mode === "SALE") {
      const items = saleItems.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        inventoryItemId: item.inventoryItemId,
        caseItemId: item.caseItemId,
        productOwnerId: item.productOwnerId ?? undefined,
      }));
      if (items.some((item) => !item.description.trim())) {
        setError("Describe every item sold.");
        return;
      }
      const scope = "sale";
      const success = await mutate({
        action: "record-sale",
        eventId,
        idempotencyKey: operationKey(scope),
        sale: { amountCents, paymentMethod, items, notes: saleNotes },
      });
      if (!success) return;
      idempotencyKeys.current.delete(scope);
      setAmount("");
      setSaleItems([newEventSaleItem()]);
      setStockRefreshToken((value) => value + 1);
      setSaleNotes("");
      setPaymentMethod("CASH");
      setMessage("Sale recorded.");
      window.setTimeout(() => amountInput.current?.focus(), 0);
      return;
    }

    const scope = "purchase";
    const success = await mutate({
      action: "record-purchase",
      eventId,
      idempotencyKey: operationKey(scope),
      purchase: {
        amountCents,
        paymentMethod,
        description: purchaseDescription,
      },
    });
    if (!success) return;
    idempotencyKeys.current.delete(scope);
    setAmount("");
    setPurchaseDescription("");
    setPaymentMethod("CASH");
    setMode("SALE");
    setMessage("Purchase recorded.");
    window.setTimeout(() => amountInput.current?.focus(), 0);
  }

  async function recordAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const eventId = snapshot?.event?.id;
    const amountCents = toCents(adjustmentAmount);
    if (!eventId || amountCents === null || !adjustmentReason.trim()) {
      setError("Adjustment amount and reason are required.");
      return;
    }
    const scope = "adjustment";
    const success = await mutate({
      action: "record-adjustment",
      eventId,
      idempotencyKey: operationKey(scope),
      adjustment: {
        amountCents,
        direction: adjustmentDirection,
        reason: adjustmentReason,
      },
    });
    if (!success) return;
    idempotencyKeys.current.delete(scope);
    setAdjustmentAmount("");
    setAdjustmentReason("");
    setAdjustmentOpen(false);
    setMessage("Cash adjustment recorded.");
  }

  async function reverseEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const eventId = snapshot?.event?.id;
    if (!eventId || !reverseEntryId || !reverseReason.trim()) {
      setError("A reversal reason is required.");
      return;
    }
    const scope = `reverse:${reverseEntryId}`;
    const success = await mutate({
      action: "reverse-entry",
      eventId,
      entryId: reverseEntryId,
      reason: reverseReason,
      idempotencyKey: operationKey(scope),
    });
    if (!success) return;
    idempotencyKeys.current.delete(scope);
    setReverseEntryId(null);
    setReverseReason("");
    setStockRefreshToken((value) => value + 1);
    setMessage("Entry reversed. The original remains in activity.");
  }

  async function closeEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const eventId = snapshot?.event?.id;
    const closingCashCents = toCents(closingCash, true);
    if (!eventId || closingCashCents === null) {
      setError("Enter the physical cash count, including zero.");
      return;
    }
    const success = await mutate({
      action: "close-event",
      eventId,
      closingCashCents,
    });
    if (success) {
      setClosingCash("");
      setMessage("Event closed. The expected cash and variance are preserved.");
    }
  }

  const event = snapshot?.event ?? null;
  const summary = snapshot?.summary ?? null;
  const entries = snapshot?.entries ?? [];
  const productOwners = snapshot?.productOwners ?? [];
  const canStartNewEvent = snapshot?.canStartNewEvent ?? false;
  const viewingPastReport = Boolean(initialEventId);
  const currency = event?.currency ?? null;
  const heroExpected =
    event?.status === "CLOSED"
      ? (summary?.closingExpectedCashCents ?? null)
      : (summary?.expectedCashCents ?? null);
  const varianceLabel = useMemo(() => {
    const variance = summary?.closingVarianceCents;
    if (variance === null || variance === undefined) return null;
    if (variance === 0) return "Balanced";
    return variance > 0 ? "Over" : "Short";
  }, [summary?.closingVarianceCents]);

  if (loading) {
    return (
      <div className="w-full max-w-7xl animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 text-sm text-zinc-400">
        Loading event ledger…
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Event operations
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Event Ledger
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              Record walk-up sales and purchases as they happen, then reconcile
              the physical drawer.
            </p>
          </div>
          <div className="flex flex-wrap items-stretch justify-end gap-2">
            <button
              type="button"
              aria-expanded={archiveOpen}
              aria-controls="past-event-reports"
              onClick={() => setArchiveOpen((current) => !current)}
              className="min-h-11 rounded-xl border border-cyan-800 bg-cyan-950/20 px-4 text-sm font-semibold text-cyan-200 transition hover:border-cyan-600"
            >
              Past event reports
              {reports.length
                ? ` · ${reports.length}${reportsTruncated ? "+" : ""}`
                : ""}
            </button>
            {event ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-right">
                <p className="text-sm font-semibold text-zinc-100">
                  {event.name}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {eventDateLabel(event.eventDate)}
                  {event.location ? ` · ${event.location}` : ""}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-red-900/70 bg-red-950/40 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200"
        >
          {message}
        </p>
      ) : null}

      {archiveOpen ? (
        <PastEventReports
          reports={reports}
          truncated={reportsTruncated}
          selectedEventId={initialEventId}
          onSelect={openReport}
          onClose={() => setArchiveOpen(false)}
        />
      ) : null}

      {viewingPastReport && event ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-800/70 bg-violet-950/20 p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              Past event report
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              Read-only closeout evidence for {event.name}.
            </p>
          </div>
          <button
            type="button"
            onClick={returnToCurrentEvent}
            className="min-h-11 rounded-lg border border-violet-700 px-4 text-sm font-semibold text-violet-200"
          >
            Back to current event
          </button>
        </section>
      ) : null}

      {!event ? (
        <StartEventForm
          pending={pending}
          canOperate={canOperate}
          onSubmit={startEvent}
        />
      ) : summary ? (
        <>
          <section
            aria-label="Event cash summary"
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
          >
            <div className="rounded-2xl border border-cyan-800/70 bg-cyan-950/30 p-5 sm:col-span-2 xl:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                {event.status === "CLOSED"
                  ? "Expected at close"
                  : "Expected cash"}
              </p>
              <p className="mt-3 break-words text-3xl font-semibold tabular-nums text-white sm:text-4xl">
                {money(heroExpected, currency)}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                Opening {money(summary.openingCashCents, currency)} · cash
                adjustments {money(summary.cashAdjustmentCents, currency)}
              </p>
            </div>
            <SummaryCard
              label="Gross sales"
              value={money(summary.grossSalesCents, currency)}
              detail={`${money(summary.nonCashSalesCents, currency)} non-cash`}
            />
            <SummaryCard
              label="Purchase spend"
              value={money(summary.purchaseSpendCents, currency)}
              detail={`${money(summary.cashPurchaseCents, currency)} cash`}
            />
            <SummaryCard
              label="Net cash movement"
              value={money(summary.netEventCashMovementCents, currency)}
              detail={`${summary.activeTransactionCount} active entries`}
            />
          </section>

          <section
            aria-label="Event product owners"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-900/70 bg-violet-950/15 px-4 py-3"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                Sale ownership
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                House inventory
                {productOwners.length
                  ? ` + ${productOwners.length} consignor${productOwners.length === 1 ? "" : "s"}`
                  : " only"}
              </p>
            </div>
            <div className="flex max-w-full flex-wrap justify-end gap-2">
              {productOwners.map((owner) => (
                <span
                  key={owner.id}
                  title={owner.reference}
                  className="max-w-full truncate rounded-full border border-violet-800 bg-violet-950/30 px-2.5 py-1 text-xs text-violet-200"
                >
                  {owner.name}
                  {owner.reference ? ` · ${owner.reference}` : ""}
                </span>
              ))}
              <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500">
                Locked at opening
              </span>
            </div>
          </section>

          {event.status === "ACTIVE" && !viewingPastReport ? (
            <OngoingEventTeamAccess
              canManage={canManageEventTeam}
              signInRequired={eventTeamSignInRequired}
              publicLoginUrl={publicEventLoginUrl}
            />
          ) : null}

          <EventInventoryControl
            eventId={event.id}
            eventStatus={event.status}
            currency={event.currency}
            canOperate={canOperate}
            caseSourceSheetUrl={caseSourceSheetUrl}
            refreshToken={stockRefreshToken}
            onChanged={() => setStockRefreshToken((value) => value + 1)}
          />

          {event.status === "CLOSED" ? (
            <section className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    Closed reconciliation
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {varianceLabel ?? "Count recorded"}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-right text-sm">
                  <span className="text-zinc-500">Counted</span>
                  <span className="font-semibold tabular-nums text-zinc-100">
                    {money(summary.closingCashCents, currency)}
                  </span>
                  <span className="text-zinc-500">Variance</span>
                  <span
                    className={`font-semibold tabular-nums ${summary.closingVarianceCents === 0 ? "text-emerald-300" : "text-amber-300"}`}
                  >
                    {money(summary.closingVarianceCents, currency)}
                  </span>
                </div>
              </div>
            </section>
          ) : null}

          <div
            className={
              event.status === "ACTIVE"
                ? "grid items-start gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
                : "space-y-5"
            }
          >
            <div className="space-y-4">
              {event.status === "ACTIVE" && canOperate ? (
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5">
                  <div className="grid grid-cols-2 rounded-xl border border-zinc-700 bg-zinc-950 p-1">
                    {(["SALE", "PURCHASE"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={mode === option}
                        onClick={() => setMode(option)}
                        className={`min-h-11 rounded-lg px-4 text-sm font-semibold ${mode === option ? (option === "SALE" ? "bg-emerald-300 text-zinc-950" : "bg-amber-300 text-zinc-950") : "text-zinc-400"}`}
                      >
                        {option === "SALE" ? "Sale" : "Purchase"}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={recordEntry} className="mt-5 space-y-5">
                    <label className="block text-xs font-medium text-zinc-400">
                      {mode === "SALE"
                        ? "Total sale amount"
                        : "Total purchase amount"}
                      <input
                        ref={amountInput}
                        required
                        autoFocus
                        inputMode="decimal"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0.00"
                        className="mt-2 min-h-14 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-2xl font-semibold tabular-nums text-white outline-none focus:border-cyan-400"
                      />
                    </label>

                    {mode === "SALE" ? (
                      <EventSaleItemsEditor
                        eventId={event.id}
                        currency={event.currency}
                        items={saleItems}
                        productOwners={productOwners}
                        onChange={setSaleItems}
                        disabled={pending}
                        refreshToken={stockRefreshToken}
                      />
                    ) : (
                      <label className="block text-xs font-medium text-zinc-400">
                        What was purchased? · optional
                        <input
                          maxLength={240}
                          value={purchaseDescription}
                          onChange={(event) =>
                            setPurchaseDescription(event.target.value)
                          }
                          placeholder="Short description"
                          className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
                        />
                      </label>
                    )}

                    <PaymentSelector
                      value={paymentMethod}
                      onChange={setPaymentMethod}
                      disabled={pending}
                    />

                    {mode === "SALE" ? (
                      <label className="block text-xs font-medium text-zinc-400">
                        Sale note · optional
                        <input
                          maxLength={500}
                          value={saleNotes}
                          onChange={(event) => setSaleNotes(event.target.value)}
                          className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
                        />
                      </label>
                    ) : null}

                    <button
                      disabled={pending}
                      className={`min-h-12 w-full rounded-xl px-5 font-semibold text-zinc-950 disabled:opacity-50 ${mode === "SALE" ? "bg-emerald-300" : "bg-amber-300"}`}
                    >
                      {pending
                        ? "Recording…"
                        : mode === "SALE"
                          ? `Record sale${saleItems.length > 1 ? ` · ${saleItems.length} items` : ""}`
                          : "Record purchase"}
                    </button>
                  </form>
                </section>
              ) : event.status === "ACTIVE" ? (
                <p className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-200">
                  View-only access: an operator must record or close
                  transactions.
                </p>
              ) : null}

              {event.status === "ACTIVE" && canOperate ? (
                <>
                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <button
                      type="button"
                      aria-expanded={adjustmentOpen}
                      onClick={() => setAdjustmentOpen((value) => !value)}
                      className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-zinc-200"
                    >
                      Cash adjustment{" "}
                      <span aria-hidden="true">
                        {adjustmentOpen ? "−" : "+"}
                      </span>
                    </button>
                    {adjustmentOpen ? (
                      <form
                        onSubmit={recordAdjustment}
                        className="mt-3 space-y-3 border-t border-zinc-800 pt-4"
                      >
                        <div className="grid grid-cols-2 gap-2">
                          {(["IN", "OUT"] as const).map((direction) => (
                            <button
                              key={direction}
                              type="button"
                              aria-pressed={adjustmentDirection === direction}
                              onClick={() => setAdjustmentDirection(direction)}
                              className={`min-h-11 rounded-lg border text-sm font-semibold ${adjustmentDirection === direction ? "border-cyan-400 bg-cyan-400/10 text-cyan-200" : "border-zinc-700 text-zinc-400"}`}
                            >
                              Cash {direction === "IN" ? "in" : "out"}
                            </button>
                          ))}
                        </div>
                        <label className="block text-xs text-zinc-400">
                          Amount
                          <input
                            required
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            step="0.01"
                            value={adjustmentAmount}
                            onChange={(event) =>
                              setAdjustmentAmount(event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base"
                          />
                        </label>
                        <label className="block text-xs text-zinc-400">
                          Reason
                          <input
                            required
                            maxLength={240}
                            value={adjustmentReason}
                            onChange={(event) =>
                              setAdjustmentReason(event.target.value)
                            }
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base"
                          />
                        </label>
                        <button
                          disabled={pending}
                          className="min-h-11 w-full rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-200 disabled:opacity-50"
                        >
                          Record adjustment
                        </button>
                      </form>
                    ) : null}
                  </section>

                  <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                    <h2 className="text-sm font-semibold text-zinc-200">
                      Close and reconcile
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      Count the physical drawer. Closing locks ordinary event
                      entries.
                    </p>
                    <form
                      onSubmit={closeEvent}
                      className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                    >
                      <label className="text-xs text-zinc-400">
                        Actual cash counted
                        <input
                          required
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={closingCash}
                          onChange={(event) =>
                            setClosingCash(event.target.value)
                          }
                          className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base"
                        />
                      </label>
                      <button
                        disabled={pending}
                        className="min-h-11 rounded-lg border border-red-900 px-4 text-sm font-semibold text-red-200 disabled:opacity-50"
                      >
                        Close event
                      </button>
                    </form>
                  </section>
                </>
              ) : null}
            </div>

            <section
              aria-labelledby="event-activity-heading"
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Immutable history
                  </p>
                  <h2
                    id="event-activity-heading"
                    className="mt-1 text-xl font-semibold text-white"
                  >
                    Activity
                  </h2>
                </div>
                <span className="text-xs text-zinc-500">Newest first</span>
              </div>
              {entries.length ? (
                <ol className="mt-4 space-y-3">
                  {entries.map((entry) => {
                    const reversible =
                      event.status === "ACTIVE" &&
                      canOperate &&
                      entry.type !== "REVERSAL" &&
                      !entry.reversedByEntryId &&
                      !entry.linkedReceiptId;
                    return (
                      <li
                        key={entry.id}
                        className={`rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 ${entry.reversedByEntryId ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-100">
                                {entryLabels[entry.type]}
                              </span>
                              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                                {paymentLabels[entry.paymentMethod]}
                              </span>
                              {entry.reversedByEntryId ? (
                                <span className="text-[11px] font-semibold uppercase text-amber-300">
                                  Reversed
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 text-xs text-zinc-500">
                              {new Date(entry.createdAt).toLocaleString()} ·
                              operator {entry.operatorUserId.slice(0, 12)}
                            </p>
                          </div>
                          <p
                            className={`shrink-0 text-base font-semibold tabular-nums ${entry.type === "SALE" ? "text-emerald-300" : entry.type === "PURCHASE" ? "text-amber-300" : "text-zinc-200"}`}
                          >
                            {entry.type === "SALE"
                              ? "+"
                              : entry.type === "PURCHASE"
                                ? "−"
                                : ""}
                            {money(entry.amountCents, currency)}
                          </p>
                        </div>
                        {entry.items.length ? (
                          <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                            {entry.items.map((item) => (
                              <li
                                key={item.position}
                                className="flex flex-wrap items-center gap-x-2 gap-y-1"
                              >
                                <span>
                                  <span className="font-semibold tabular-nums text-zinc-500">
                                    {item.quantity}×
                                  </span>{" "}
                                  {item.description}
                                </span>
                                <span className="rounded-full border border-violet-900/80 bg-violet-950/20 px-2 py-0.5 text-[11px] font-medium text-violet-200">
                                  {item.productOwnerName ?? "House inventory"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {entry.description ? (
                          <p className="mt-3 text-sm leading-5 text-zinc-400">
                            {entry.description}
                          </p>
                        ) : null}
                        {entry.linkedReceiptId ? (
                          <p className="mt-3 text-xs text-zinc-500">
                            Vendor receipt {entry.linkedReceiptId.slice(0, 8)} ·
                            correct through receipt void
                          </p>
                        ) : null}
                        {entry.type === "CASH_ADJUSTMENT" ? (
                          <p className="mt-2 text-xs text-zinc-500">
                            Drawer effect{" "}
                            {entry.cashEffectCents >= 0 ? "+" : "−"}
                            {money(Math.abs(entry.cashEffectCents), currency)}
                          </p>
                        ) : null}
                        {reversible ? (
                          reverseEntryId === entry.id ? (
                            <form
                              onSubmit={reverseEntry}
                              className="mt-3 border-t border-zinc-800 pt-3"
                            >
                              <label className="text-xs text-zinc-400">
                                Why reverse this entry?
                                <input
                                  required
                                  autoFocus
                                  maxLength={240}
                                  value={reverseReason}
                                  onChange={(event) =>
                                    setReverseReason(event.target.value)
                                  }
                                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base"
                                />
                              </label>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReverseEntryId(null);
                                    setReverseReason("");
                                  }}
                                  className="min-h-11 rounded-lg border border-zinc-700 text-sm text-zinc-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  disabled={pending}
                                  className="min-h-11 rounded-lg border border-red-800 text-sm font-semibold text-red-200 disabled:opacity-50"
                                >
                                  Confirm reversal
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReverseEntryId(entry.id);
                                setReverseReason("");
                              }}
                              className="mt-2 min-h-11 px-1 text-xs font-semibold text-red-300"
                            >
                              Reverse entry
                            </button>
                          )
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-zinc-800 px-4 py-10 text-center text-sm text-zinc-500">
                  No event activity yet. Record the first sale or purchase.
                </p>
              )}
            </section>
          </div>

          {event.status === "CLOSED" &&
          canStartNewEvent &&
          !viewingPastReport ? (
            <StartEventForm
              compact
              pending={pending}
              canOperate={canOperate}
              onSubmit={startEvent}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function PastEventReports({
  reports,
  truncated,
  selectedEventId,
  onSelect,
  onClose,
}: {
  reports: EventLedgerReportSummary[];
  truncated: boolean;
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("en-US");
  const filteredReports = useMemo(
    () =>
      normalizedQuery
        ? reports.filter(({ event }) =>
            [event.name, event.location ?? "", event.eventDate].some((value) =>
              value.toLocaleLowerCase("en-US").includes(normalizedQuery),
            ),
          )
        : reports,
    [normalizedQuery, reports],
  );

  return (
    <section
      id="past-event-reports"
      aria-labelledby="past-event-reports-heading"
      className="rounded-2xl border border-cyan-900/70 bg-zinc-900/80 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Closed event archive
          </p>
          <h2
            id="past-event-reports-heading"
            className="mt-2 text-xl font-semibold text-white"
          >
            Past event reports
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {reports.length
              ? `${reports.length}${truncated ? "+" : ""} preserved report${reports.length === 1 ? "" : "s"}, newest first.`
              : "Closed events will appear here with their preserved reconciliation and activity."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-300"
        >
          Close archive
        </button>
      </div>

      {reports.length ? (
        <>
          <label className="mt-4 block text-xs font-medium text-zinc-400">
            Find an event report
            <input
              type="search"
              maxLength={200}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Event name, location, or date"
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-zinc-100 outline-none focus:border-cyan-400"
            />
          </label>
          <p className="mt-3 text-xs text-zinc-500" role="status">
            {filteredReports.length} matching report
            {filteredReports.length === 1 ? "" : "s"}
            {truncated ? " · showing the latest 100" : ""}
          </p>
          {filteredReports.length ? (
            <ol className="mt-3 grid gap-3 lg:grid-cols-2">
              {filteredReports.map(({ event, summary }) => (
                <li key={event.id}>
                  <button
                    type="button"
                    aria-current={selectedEventId === event.id ? "page" : undefined}
                    onClick={() => onSelect(event.id)}
                    className={`min-h-11 w-full rounded-xl border p-4 text-left transition hover:border-cyan-700 ${selectedEventId === event.id ? "border-cyan-500 bg-cyan-950/20" : "border-zinc-800 bg-zinc-950/60"}`}
                  >
                    <span className="flex flex-wrap items-start justify-between gap-2">
                      <span>
                        <span className="block font-semibold text-zinc-100">
                          {event.name}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {eventDateLabel(event.eventDate)}
                          {event.location ? ` · ${event.location}` : ""}
                        </span>
                      </span>
                      <span className="text-xs font-semibold text-cyan-300">
                        Open report →
                      </span>
                    </span>
                    <span className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-3">
                      <ReportMetric
                        label="Sales"
                        value={money(summary.grossSalesCents, event.currency)}
                      />
                      <ReportMetric
                        label="Purchases"
                        value={money(summary.purchaseSpendCents, event.currency)}
                      />
                      <ReportMetric
                        label="Variance"
                        value={money(
                          summary.closingVarianceCents,
                          event.currency,
                        )}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
              No reports match that search.
            </p>
          )}
        </>
      ) : null}
    </section>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <span className="min-w-0">
      <span className="block text-[10px] font-medium uppercase tracking-wider text-zinc-600">
        {label}
      </span>
      <span className="mt-1 block truncate text-xs font-semibold tabular-nums text-zinc-300">
        {value}
      </span>
    </span>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-xl font-semibold tabular-nums text-zinc-100">
        {value}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </div>
  );
}
