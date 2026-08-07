"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
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

export type VendorOfferDetails = {
  recommendedOffer: number;
  openingOffer: number;
  targetOffer: number;
  maximumBuyPrice: number;
  tcgLowCents: number | null;
  tcgMarketCents: number | null;
  tcgDirectLowCents: number | null;
};

const productLineLabels: Record<PurchaseProductLine, string> = {
  MAGIC: "Magic",
  POKEMON: "Pokémon",
  ONE_PIECE: "One Piece",
  LORCANA: "Lorcana",
};

function money(cents: number | null, currency: EventCurrency | null = "USD") {
  if (cents === null) return "Unavailable";
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

function CartLineEditor({
  children,
  currency,
  line,
  pending,
  onDirtyChange,
  onRemove,
  onPhotoRemove,
  onPhotoUpload,
  onUpdate,
}: {
  children?: ReactNode;
  currency: EventCurrency | null;
  line: PurchaseLine;
  pending: boolean;
  onDirtyChange: (lineId: string, dirty: boolean) => void;
  onRemove: (lineId: string) => Promise<void>;
  onPhotoRemove: (line: PurchaseLine) => Promise<void>;
  onPhotoUpload: (line: PurchaseLine, file: File) => Promise<void>;
  onUpdate: (
    line: PurchaseLine,
    actualPaidCents: number,
    quantity: number | null,
  ) => Promise<boolean>;
}) {
  const storedQuantity =
    line.kind === "EXACT" ? line.quantity : (line.approximateQuantity ?? null);
  const [paidInput, setPaidInput] = useState(
    (line.actualPaidCents / 100).toFixed(2),
  );
  const [quantityInput, setQuantityInput] = useState(
    storedQuantity === null ? "" : String(storedQuantity),
  );

  const parsedPaid = cents(paidInput);
  const parsedQuantity =
    quantityInput.trim() === "" ? null : Number(quantityInput);
  const quantityValid =
    line.kind === "EXACT"
      ? Number.isInteger(parsedQuantity) &&
        parsedQuantity !== null &&
        parsedQuantity >= 1 &&
        parsedQuantity <= 1000
      : parsedQuantity === null ||
        (Number.isSafeInteger(parsedQuantity) && parsedQuantity > 0);
  const valid = parsedPaid !== null && quantityValid;
  const dirty =
    parsedPaid !== line.actualPaidCents || parsedQuantity !== storedQuantity;

  useEffect(() => {
    onDirtyChange(line.id, dirty);
  }, [dirty, line.id, onDirtyChange]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valid || parsedPaid === null) return;
    await onUpdate(line, parsedPaid, parsedQuantity);
  }

  const lineTotal =
    line.actualPaidCents * (line.kind === "EXACT" ? line.quantity : 1);
  const validationMessage =
    parsedPaid === null
      ? "Enter a positive purchase value."
      : !quantityValid
        ? line.kind === "EXACT"
          ? "Quantity must be a whole number from 1 to 1000."
          : "Approximate count must be blank or a positive whole number."
        : null;
  const validationId = `cart-line-${line.id}-validation`;

  return (
    <li className="rounded-lg border border-zinc-800 p-3">
      <form onSubmit={save}>
        <div className="flex items-start justify-between gap-3">
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
            <p className="text-[10px] uppercase tracking-wide text-zinc-500">
              Saved line total
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-zinc-100">
              {money(lineTotal, currency)}
            </p>
            {dirty ? (
              <span className="mt-1 inline-flex rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                Unsaved
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-400">
            {line.kind === "EXACT" ? "Unit purchase price" : "Bulk total paid"}
            <input
              aria-describedby={validationMessage ? validationId : undefined}
              aria-invalid={parsedPaid === null}
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={paidInput}
              onChange={(event) => setPaidInput(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 tabular-nums text-zinc-100 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            />
          </label>
          <label className="block text-xs font-medium text-zinc-400">
            {line.kind === "EXACT" ? "Purchase quantity" : "Approximate count"}
            <input
              aria-describedby={validationMessage ? validationId : undefined}
              aria-invalid={!quantityValid}
              type="number"
              min="1"
              max={line.kind === "EXACT" ? 1000 : undefined}
              step="1"
              inputMode="numeric"
              placeholder={line.kind === "BULK" ? "Optional" : undefined}
              value={quantityInput}
              onChange={(event) => setQuantityInput(event.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 tabular-nums text-zinc-100 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            />
          </label>
        </div>
        {validationMessage ? (
          <p
            id={validationId}
            aria-live="polite"
            className="mt-2 text-xs text-red-300"
          >
            {validationMessage}
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="submit"
            disabled={pending || !dirty || !valid}
            className="min-h-11 rounded-lg border border-cyan-700 bg-cyan-950/40 px-3 text-xs font-semibold text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save changes
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => void onRemove(line.id)}
            className="min-h-11 rounded-lg border border-red-900/80 bg-red-950/25 px-3 text-xs font-semibold text-red-300 disabled:opacity-40"
          >
            Remove item
          </button>
        </div>
      </form>
      <div className="mt-3 border-t border-zinc-800 pt-3">
        <p className="text-xs font-medium text-zinc-300">Purchase photo</p>
        {line.evidenceImage ? (
          <div className="mt-2 overflow-hidden rounded-lg border border-zinc-700 bg-black/40">
            <Image
              src={`/api/purchases/evidence?id=${encodeURIComponent(line.evidenceImage.id)}`}
              alt={`Purchase evidence for ${line.kind === "BULK" ? "Bulk purchase" : line.name}`}
              width={640}
              height={480}
              unoptimized
              className="max-h-56 w-full object-contain"
            />
          </div>
        ) : (
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Especially useful for mixed collections, boxes, and other Bulk
            purchases.
          </p>
        )}
        <div className={`mt-2 grid gap-2 ${line.evidenceImage ? "grid-cols-2" : "grid-cols-1"}`}>
          <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-center text-xs font-semibold text-zinc-200 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-300/30">
            {line.evidenceImage ? "Replace photo" : "Take or upload photo"}
            <input
              type="file"
              accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onPhotoUpload(line, file);
                event.currentTarget.value = "";
              }}
              className="sr-only"
            />
          </label>
          {line.evidenceImage ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void onPhotoRemove(line)}
              className="min-h-11 rounded-lg border border-red-900/80 bg-red-950/25 px-3 text-xs font-semibold text-red-300 disabled:opacity-40"
            >
              Remove photo
            </button>
          ) : null}
        </div>
        <p className="mt-2 text-[11px] text-zinc-500">
          One private image · JPEG, PNG, WebP, GIF, or AVIF · 8 MB maximum
        </p>
      </div>
      {children}
    </li>
  );
}

export default function VendorCheckout({
  canOperate,
  match,
  condition,
  price,
  offer,
  marketReferenceCents,
}: {
  canOperate: boolean;
  match: SearchMatch | null;
  condition: PricingCondition;
  price: PriceState | null;
  offer: VendorOfferDetails | null;
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
  const [bulkPhoto, setBulkPhoto] = useState<File | null>(null);
  const [bulkPhotoPreviewUrl, setBulkPhotoPreviewUrl] = useState<string | null>(
    null,
  );
  const [casePlacementsByLine, setCasePlacementsByLine] = useState<
    Record<string, { price: string; quantity: string }>
  >({});
  const [dirtyCartLineIds, setDirtyCartLineIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [clearCartConfirming, setClearCartConfirming] = useState(false);
  const cartRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (bulkPhotoPreviewUrl) URL.revokeObjectURL(bulkPhotoPreviewUrl);
    };
  }, [bulkPhotoPreviewUrl]);

  const handleLineDirtyChange = useCallback(
    (lineId: string, dirty: boolean) => {
      setDirtyCartLineIds((current) => {
        if (current.has(lineId) === dirty) return current;
        const next = new Set(current);
        if (dirty) next.add(lineId);
        else next.delete(lineId);
        return next;
      });
    },
    [],
  );

  async function load() {
    const response = await fetch("/api/purchases", { cache: "no-store" });
    const body = (await response.json().catch(() => ({}))) as CheckoutState & {
      error?: string;
    };
    if (!response.ok) throw new Error(body.error ?? "Checkout could not load.");
    setState(body);
    if (!body.cart.length) setClearCartConfirming(false);
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
      : offer === null
        ? ""
        : offer.recommendedOffer.toFixed(2);

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
          offer === null ? null : Math.round(offer.recommendedOffer * 100),
        marketReferenceCents,
        snapshotDate: price?.snapshotDate ?? null,
        notes: exactNotes,
      },
    });
    if (success) {
      setExactQuantity("1");
      setExactNotes("");
      setMessage(`${match.name} added to event checkout.`);
      cartRailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  async function addBulk() {
    if (!state.event) return;
    const paid = cents(bulkPaid);
    if (paid === null || !bulkLines.length || !bulkNotes.trim()) {
      setMessage("Bulk requires product lines, total paid, and notes.");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-line",
          eventId: state.event.id,
          line: {
            kind: "BULK",
            productLines: bulkLines,
            actualPaidCents: paid,
            notes: bulkNotes,
            approximateQuantity: bulkQuantity || null,
          },
        }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
        line?: PurchaseLine;
      };
      if (!response.ok || !result.line) {
        throw new Error(result.error ?? "Bulk purchase could not be added.");
      }
      let photoError: string | null = null;
      if (bulkPhoto) {
        try {
          await storePurchasePhoto(result.line, bulkPhoto);
        } catch (error) {
          photoError =
            error instanceof Error
              ? error.message
              : "the selected photo could not be stored";
        }
      }
      await load();
      setBulkPaid("");
      setBulkNotes("");
      setBulkQuantity("");
      setBulkLines([]);
      setBulkPhoto(null);
      setBulkPhotoPreviewUrl(null);
      setBulkOpen(false);
      setMessage(
        photoError
          ? `Bulk purchase was added, but ${photoError} Use Take or upload photo on the saved cart item to retry.`
          : bulkPhoto
            ? "Bulk purchase and its private photo were added to the cart."
            : "Bulk purchase added to event checkout.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Bulk purchase could not be added.",
      );
    } finally {
      setPending(false);
    }
  }

  async function removeLine(lineId: string) {
    const success = await mutate({
      action: "remove-line",
      lineId,
    });
    if (success) {
      setDirtyCartLineIds((current) => {
        const next = new Set(current);
        next.delete(lineId);
        return next;
      });
      setCasePlacementsByLine((current) => {
        const next = { ...current };
        delete next[lineId];
        return next;
      });
      setMessage("Item removed from the purchase cart.");
      if (state.cart.length === 1) setClearCartConfirming(false);
    }
  }

  async function clearCart() {
    if (!state.event || !state.cart.length) return;
    const cleared = await mutate({
      action: "clear-cart",
      eventId: state.event.id,
    });
    if (!cleared) return;
    setDirtyCartLineIds(new Set());
    setCasePlacementsByLine({});
    setClearCartConfirming(false);
    setMessage("Purchase cart cleared. Finalized receipts were not changed.");
  }

  async function storePurchasePhoto(line: PurchaseLine, file: File) {
    const form = new FormData();
    form.set("lineId", line.id);
    form.set("file", file);
    const response = await fetch("/api/purchases/evidence", {
      method: "POST",
      body: form,
    });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(result.error ?? "Purchase photo could not be stored.");
    }
  }

  async function uploadPurchasePhoto(line: PurchaseLine, file: File) {
    if (file.size > 8 * 1024 * 1024) {
      setMessage("Purchase photo must be no larger than 8 MB.");
      return;
    }
    setPending(true);
    setMessage(null);
    try {
      await storePurchasePhoto(line, file);
      await load();
      setMessage(
        `${line.kind === "BULK" ? "Bulk purchase" : line.name} photo stored privately.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Purchase photo could not be stored.",
      );
    } finally {
      setPending(false);
    }
  }

  async function removePurchasePhoto(line: PurchaseLine) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/purchases/evidence?lineId=${encodeURIComponent(line.id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? "Purchase photo could not be removed.");
      }
      await load();
      setMessage("Purchase photo removed from the draft cart line.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Purchase photo could not be removed.",
      );
    } finally {
      setPending(false);
    }
  }

  async function updateLine(
    line: PurchaseLine,
    actualPaidCents: number,
    quantity: number | null,
  ): Promise<boolean> {
    const success = await mutate({
      action: "update-line",
      lineId: line.id,
      changes: { actualPaidCents, quantity },
    });
    if (success) {
      setDirtyCartLineIds((current) => {
        const next = new Set(current);
        next.delete(line.id);
        return next;
      });
      if (line.kind === "EXACT" && quantity !== null) {
        setCasePlacementsByLine((current) => {
          const placement = current[line.id];
          if (!placement || Number(placement.quantity) <= quantity) {
            return current;
          }
          return {
            ...current,
            [line.id]: { ...placement, quantity: String(quantity) },
          };
        });
      }
      setMessage(
        `${line.kind === "EXACT" ? line.name : "Bulk purchase"} updated in the cart.`,
      );
    }
    return success;
  }

  async function finalize() {
    if (!state.event || !state.cart.length) return;
    if (dirtyCartLineIds.size) {
      setMessage("Save every cart change before finalizing the purchase.");
      return;
    }
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
      setDirtyCartLineIds(new Set());
      setCasePlacementsByLine({});
      setClearCartConfirming(false);
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
      className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
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
                ? "mt-4 grid items-start gap-4 xl:grid-cols-[minmax(220px,0.72fr)_minmax(280px,1.28fr)]"
                : "hidden"
            }
          >
            <div ref={cartRailRef} data-purchase-cart-rail className="space-y-3 xl:sticky xl:top-4">
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
                        onChange={(event) =>
                          setExactQuantity(event.target.value)
                        }
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
                  <div className="mt-3 rounded-lg border border-cyan-950 bg-cyan-950/20 p-3">
                    <p className="text-xs font-semibold text-cyan-200">
                      Bulk purchase picture · optional
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      Photograph the collection, box, or binder now. It will be
                      attached privately when you add this Bulk purchase.
                    </p>
                    {bulkPhotoPreviewUrl ? (
                      <div className="mt-2 overflow-hidden rounded-lg border border-zinc-700 bg-black/40">
                        <Image
                          src={bulkPhotoPreviewUrl}
                          alt="Selected Bulk purchase picture preview"
                          width={640}
                          height={480}
                          unoptimized
                          className="max-h-56 w-full object-contain"
                        />
                      </div>
                    ) : null}
                    <div
                      className={`mt-2 grid gap-2 ${bulkPhoto ? "grid-cols-2" : "grid-cols-1"}`}
                    >
                      <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-cyan-800 bg-cyan-950/30 px-3 text-center text-xs font-semibold text-cyan-100 focus-within:ring-2 focus-within:ring-cyan-300/30">
                        {bulkPhoto ? "Replace picture" : "Take or upload picture"}
                        <input
                          type="file"
                          accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                          disabled={pending}
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            if (file && file.size > 8 * 1024 * 1024) {
                              setMessage(
                                "Bulk purchase picture must be no larger than 8 MB.",
                              );
                            } else if (file) {
                              setBulkPhotoPreviewUrl(URL.createObjectURL(file));
                              setBulkPhoto(file);
                              setMessage(null);
                            }
                            event.currentTarget.value = "";
                          }}
                          className="sr-only"
                        />
                      </label>
                      {bulkPhoto ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            setBulkPhoto(null);
                            setBulkPhotoPreviewUrl(null);
                          }}
                          className="min-h-11 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 disabled:opacity-40"
                        >
                          Remove picture
                        </button>
                      ) : null}
                    </div>
                    {bulkPhoto ? (
                      <p className="mt-2 truncate text-[11px] text-zinc-400">
                        Ready: {bulkPhoto.name}
                      </p>
                    ) : (
                      <p className="mt-2 text-[11px] text-zinc-500">
                        JPEG, PNG, WebP, GIF, or AVIF · 8 MB maximum
                      </p>
                    )}
                  </div>
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

            <div className="space-y-3">
              {offer ? (
                <details className="rounded-lg border border-cyan-800 bg-cyan-950/30">
                  <summary className="min-h-12 cursor-pointer list-none px-4 py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300">
                    <span className="flex flex-wrap items-end justify-between gap-2">
                      <span>
                        <span className="block text-[11px] font-semibold uppercase tracking-wider text-cyan-300">
                          Recommended offer
                        </span>
                        <span className="mt-1 block text-2xl font-semibold tabular-nums text-white">
                          {money(
                            Math.round(offer.recommendedOffer * 100),
                            "USD",
                          )}
                        </span>
                      </span>
                      <span className="text-right text-[11px] leading-5 text-zinc-400">
                        {offer.tcgDirectLowCents !== null ? <span className="block font-semibold text-emerald-300">Direct Low {money(offer.tcgDirectLowCents, "USD")}</span> : null}
                        TCG Low {money(offer.tcgLowCents, "USD")}
                        <span className="block">
                          TCG Market {money(offer.tcgMarketCents, "USD")}
                        </span>
                      </span>
                    </span>
                  </summary>
                  <div className="grid grid-cols-3 gap-2 border-t border-cyan-900/70 p-3 text-xs">
                    <div className="rounded-lg bg-zinc-950/70 p-2">
                      <p className="text-zinc-500">Opening</p>
                      <p className="mt-1 font-semibold text-zinc-100">
                        {money(Math.round(offer.openingOffer * 100), "USD")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950/70 p-2">
                      <p className="text-zinc-500">Target</p>
                      <p className="mt-1 font-semibold text-cyan-200">
                        {money(Math.round(offer.targetOffer * 100), "USD")}
                      </p>
                    </div>
                    <div className="rounded-lg bg-zinc-950/70 p-2">
                      <p className="text-zinc-500">Walk away</p>
                      <p className="mt-1 font-semibold text-amber-200">
                        {money(Math.round(offer.maximumBuyPrice * 100), "USD")}
                      </p>
                    </div>
                  </div>
                </details>
              ) : null}
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Current purchase
                    </p>
                    {dirtyCartLineIds.size ? (
                      <p className="mt-1 text-xs text-amber-200">
                        {dirtyCartLineIds.size} unsaved cart{" "}
                        {dirtyCartLineIds.size === 1 ? "change" : "changes"}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold tabular-nums text-cyan-200">
                      {money(total, state.event.currency)}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
                      Saved subtotal
                    </p>
                    {state.cart.length ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setClearCartConfirming(true)}
                        className="mt-2 min-h-11 rounded-lg border border-red-900/80 bg-red-950/20 px-3 text-xs font-semibold text-red-300 disabled:opacity-40"
                      >
                        Clear cart
                      </button>
                    ) : null}
                  </div>
                </div>
                {clearCartConfirming && state.cart.length ? (
                  <div
                    role="group"
                    aria-label="Confirm clear purchase cart"
                    className="mt-3 rounded-lg border border-red-900/80 bg-red-950/25 p-3"
                  >
                    <p className="text-sm font-semibold text-red-200">
                      Clear all {state.cart.length} saved cart {state.cart.length === 1 ? "item" : "items"}?
                    </p>
                    <p className="mt-1 text-xs leading-5 text-zinc-400">
                      Unsubmitted purchase photos will also be removed. Finalized
                      receipts are not affected.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setClearCartConfirming(false)}
                        className="min-h-11 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-zinc-200 disabled:opacity-40"
                      >
                        Keep cart
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => void clearCart()}
                        className="min-h-11 rounded-lg border border-red-700 bg-red-700/30 px-3 text-xs font-semibold text-red-100 disabled:opacity-40"
                      >
                        Clear {state.cart.length} {state.cart.length === 1 ? "item" : "items"}
                      </button>
                    </div>
                  </div>
                ) : null}
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
                        <CartLineEditor
                          key={`${line.id}:${line.actualPaidCents}:${line.kind === "EXACT" ? line.quantity : (line.approximateQuantity ?? "")}:${line.evidenceImage?.id ?? ""}`}
                          currency={eventCurrency}
                          line={line}
                          pending={pending}
                          onDirtyChange={handleLineDirtyChange}
                          onRemove={removeLine}
                          onPhotoRemove={removePurchasePhoto}
                          onPhotoUpload={uploadPurchasePhoto}
                          onUpdate={updateLine}
                        >
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
                                            ? (
                                                line.marketReferenceCents / 100
                                              ).toFixed(2)
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
                                      value={
                                        casePlacementsByLine[line.id]
                                          ?.quantity ?? "1"
                                      }
                                      onChange={(event) =>
                                        setCasePlacementsByLine((current) => ({
                                          ...current,
                                          [line.id]: {
                                            ...(current[line.id] ?? {
                                              price: "",
                                            }),
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
                                      value={
                                        casePlacementsByLine[line.id]?.price ??
                                        ""
                                      }
                                      onChange={(event) =>
                                        setCasePlacementsByLine((current) => ({
                                          ...current,
                                          [line.id]: {
                                            ...(current[line.id] ?? {
                                              quantity: "1",
                                            }),
                                            price: event.target.value,
                                          },
                                        }))
                                      }
                                      className="mt-1 min-h-11 w-full rounded-lg border border-cyan-700 bg-zinc-900 px-3 text-zinc-100 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                                    />
                                  </label>
                                  <p className="text-xs text-zinc-500 sm:col-span-2">
                                    Defaults to 1 of {line.quantity} purchased.
                                    Remaining copies stay available in General
                                    Inventory and Event Flip.
                                  </p>
                                </div>
                              ) : null}
                            </div>
                          ) : line.kind === "EXACT" ? (
                            <p className="mt-3 border-t border-zinc-800 pt-3 text-xs text-zinc-500">
                              Sealed products stay in General Inventory.
                            </p>
                          ) : null}
                        </CartLineEditor>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-lg border border-dashed border-zinc-800 p-6 text-center text-sm text-zinc-500">
                    No purchases added yet.
                  </p>
                )}
                <fieldset className="mt-4">
                  <legend className="text-xs text-zinc-400">
                    Payment method
                  </legend>
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
                    {money(state.receipts[0].totalCents, state.event.currency)}{" "}
                    · {new Date(state.receipts[0].createdAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
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
