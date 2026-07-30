"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PURCHASE_PRODUCT_LINES,
  type PurchaseEvent,
  type PurchaseLine,
  type PurchaseProductLine,
  type PurchaseReceipt,
} from "@/lib/purchases/domain";
import type { PriceState, PricingCondition, SearchMatch } from "@/lib/pricing/types";

type CheckoutState = { event: PurchaseEvent | null; cart: PurchaseLine[]; receipts: PurchaseReceipt[] };

const productLineLabels: Record<PurchaseProductLine, string> = {
  MAGIC: "Magic",
  POKEMON: "Pokémon",
  ONE_PIECE: "One Piece",
  LORCANA: "Lorcana",
};

function dollars(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function cents(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : null;
}

export default function VendorCheckout({
  match,
  condition,
  price,
  recommendedOffer,
  marketReferenceCents,
}: {
  match: SearchMatch | null;
  condition: PricingCondition;
  price: PriceState | null;
  recommendedOffer: number | null;
  marketReferenceCents: number | null;
}) {
  const [state, setState] = useState<CheckoutState>({ event: null, cart: [], receipts: [] });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [eventName, setEventName] = useState("Current Card Show");
  const [eventDate, setEventDate] = useState(new Date().toISOString().slice(0, 10));
  const [eventLocation, setEventLocation] = useState("");
  const [actualPaidInput, setActualPaidInput] = useState({ key: "", value: "" });
  const [exactNotes, setExactNotes] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkLines, setBulkLines] = useState<PurchaseProductLine[]>([]);
  const [bulkPaid, setBulkPaid] = useState("");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkQuantity, setBulkQuantity] = useState("");

  async function load() {
    const response = await fetch("/api/purchases", { cache: "no-store" });
    const body = await response.json().catch(() => ({})) as CheckoutState & { error?: string };
    if (!response.ok) throw new Error(body.error ?? "Checkout could not load.");
    setState(body);
  }

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/purchases", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as CheckoutState & { error?: string };
        if (!response.ok) throw new Error(body.error ?? "Checkout could not load.");
        return body;
      })
      .then((body) => { if (!cancelled) setState(body); })
      .catch((error) => { if (!cancelled) setMessage(error instanceof Error ? error.message : "Checkout could not load."); });
    return () => { cancelled = true; };
  }, []);
  const selectionKey = `${match?.sku ?? ""}:${condition}`;
  const actualPaid = actualPaidInput.key === selectionKey
    ? actualPaidInput.value
    : recommendedOffer === null
      ? ""
      : recommendedOffer.toFixed(2);

  async function mutate(body: Record<string, unknown>) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Checkout operation failed.");
      await load();
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkout operation failed.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function createEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await mutate({ action: "create-event", name: eventName, eventDate, location: eventLocation })) setMessage("Event checkout is ready.");
  }

  async function addExact() {
    if (!state.event || !match) return;
    const paid = cents(actualPaid);
    if (paid === null) { setMessage("Enter the actual agreed purchase price."); return; }
    const success = await mutate({
      action: "add-line",
      eventId: state.event.id,
      line: {
        kind: "EXACT",
        categoryId: match.categoryId,
        sku: match.sku,
        condition: match.productType === "SEALED" ? "Unopened" : condition,
        quantity: 1,
        actualPaidCents: paid,
        recommendedOfferCents: recommendedOffer === null ? null : Math.round(recommendedOffer * 100),
        marketReferenceCents,
        snapshotDate: price?.snapshotDate ?? null,
        notes: exactNotes,
      },
    });
    if (success) { setExactNotes(""); setMessage(`${match.name} added to event checkout.`); }
  }

  async function addBulk() {
    if (!state.event) return;
    const paid = cents(bulkPaid);
    if (paid === null || !bulkLines.length || !bulkNotes.trim()) { setMessage("Bulk requires product lines, total paid, and notes."); return; }
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
    if (success) { setBulkPaid(""); setBulkNotes(""); setBulkQuantity(""); setBulkLines([]); setBulkOpen(false); setMessage("Bulk purchase added to event checkout."); }
  }

  async function finalize() {
    if (!state.event || !state.cart.length) return;
    const success = await mutate({ action: "checkout", eventId: state.event.id, idempotencyKey: `checkout:${crypto.randomUUID()}` });
    if (success) setMessage("Purchase receipt finalized and ledgered.");
  }

  const total = useMemo(() => state.cart.reduce((sum, line) => sum + line.actualPaidCents * (line.kind === "EXACT" ? line.quantity : 1), 0), [state.cart]);

  return (
    <section aria-labelledby="vendor-checkout-heading" className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Event operations</p><h2 id="vendor-checkout-heading" className="mt-1 text-xl font-semibold text-white">Vendor checkout</h2></div>
        {state.event ? <p className="text-right text-sm text-zinc-300">{state.event.name}<span className="block text-xs text-zinc-500">{state.event.eventDate}{state.event.location ? ` · ${state.event.location}` : ""}</span></p> : null}
      </div>

      {!state.event ? (
        <form onSubmit={createEvent} className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_minmax(0,1fr)_auto] md:items-end">
          <label className="text-xs text-zinc-400">Event name<input required value={eventName} onChange={(event) => setEventName(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100" /></label>
          <label className="text-xs text-zinc-400">Date<input required type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100" /></label>
          <label className="text-xs text-zinc-400">Location<input value={eventLocation} onChange={(event) => setEventLocation(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-zinc-100" /></label>
          <button disabled={pending} className="min-h-11 rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-60">Start event</button>
        </form>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(280px,0.8fr)_minmax(320px,1.2fr)]">
          <div className="space-y-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <p className="text-sm font-semibold text-zinc-100">Selected product</p>
              {match ? <><p className="mt-2 text-sm text-zinc-200">{match.name}</p><p className="mt-1 text-xs text-zinc-500">{match.setName} · {match.variant} · {match.productType === "SEALED" ? "Unopened" : condition}</p>
                <label className="mt-3 block text-xs text-zinc-400">Actual agreed price<input type="number" min="0" step="0.01" value={actualPaid} onChange={(event) => setActualPaidInput({ key: selectionKey, value: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-100" /></label>
                <label className="mt-3 block text-xs text-zinc-400">Purchase notes<input value={exactNotes} onChange={(event) => setExactNotes(event.target.value)} placeholder="Optional" className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-zinc-100" /></label>
                <button type="button" disabled={pending} onClick={addExact} className="mt-3 min-h-11 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-60">Add selected product</button></> : <p className="mt-2 text-sm text-zinc-500">Select a catalogue product to add an exact line.</p>}
            </div>
            <button type="button" onClick={() => setBulkOpen((current) => !current)} className="min-h-11 w-full rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200">{bulkOpen ? "Close Bulk entry" : "Add Bulk purchase"}</button>
            {bulkOpen ? <div className="rounded-lg border border-zinc-700 bg-zinc-950/70 p-4">
              <fieldset><legend className="text-xs text-zinc-400">Product lines</legend><div className="mt-2 grid grid-cols-2 gap-2">{PURCHASE_PRODUCT_LINES.map((line) => <label key={line} className="flex min-h-11 items-center gap-2 text-sm text-zinc-300"><input type="checkbox" checked={bulkLines.includes(line)} onChange={(event) => setBulkLines((current) => event.target.checked ? [...current, line] : current.filter((item) => item !== line))} className="accent-cyan-300" />{productLineLabels[line]}</label>)}</div></fieldset>
              <label className="mt-3 block text-xs text-zinc-400">Total paid<input type="number" min="0" step="0.01" value={bulkPaid} onChange={(event) => setBulkPaid(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3" /></label>
              <label className="mt-3 block text-xs text-zinc-400">Approximate card count<input type="number" min="1" step="1" value={bulkQuantity} onChange={(event) => setBulkQuantity(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3" /></label>
              <label className="mt-3 block text-xs text-zinc-400">Notes · required<textarea value={bulkNotes} onChange={(event) => setBulkNotes(event.target.value)} className="mt-1 min-h-20 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
              <button type="button" disabled={pending} onClick={addBulk} className="mt-3 min-h-11 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-60">Add Bulk</button>
            </div> : null}
          </div>

          <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
            <div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">Current purchase</p><p className="font-semibold tabular-nums text-cyan-200">{dollars(total)}</p></div>
            {state.cart.length ? <ul className="mt-3 space-y-2">{state.cart.map((line) => <li key={line.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 p-3"><div className="min-w-0"><p className="truncate text-sm text-zinc-200">{line.kind === "BULK" ? `Bulk · ${line.productLines.map((item) => productLineLabels[item]).join(", ")}` : line.name}</p><p className="mt-1 text-xs text-zinc-500">{line.kind === "BULK" ? line.notes : `${line.setName} · ${line.condition}`}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold text-zinc-100">{dollars(line.actualPaidCents * (line.kind === "EXACT" ? line.quantity : 1))}</p><button type="button" onClick={() => void mutate({ action: "remove-line", lineId: line.id })} className="min-h-11 px-2 text-xs text-red-300">Remove</button></div></li>)}</ul> : <p className="mt-4 rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">No purchases added yet.</p>}
            <button type="button" disabled={pending || !state.cart.length} onClick={finalize} className="mt-4 min-h-12 w-full rounded-lg bg-emerald-300 px-4 font-semibold text-zinc-950 disabled:opacity-50">Finalize purchase receipt</button>
            {state.receipts[0] ? <p className="mt-3 text-xs text-zinc-500">Last receipt {state.receipts[0].id.slice(0, 8)} · {dollars(state.receipts[0].totalCents)} · {new Date(state.receipts[0].createdAt).toLocaleString()}</p> : null}
          </div>
        </div>
      )}
      {message ? <p role="status" className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </section>
  );
}
