"use client";

import { useCallback, useEffect, useState } from "react";
import type { ModuleEntitlement } from "@/lib/auth/domain";
import CopyTextButton from "@/components/ui/CopyTextButton";

type EventSummary = { id: string; name: string; event_date: string };
type Grant = {
  id: string;
  scopeType: "EVENT" | "TASK";
  eventName: string | null;
  workerLabel: string;
  entitlements: ModuleEntitlement[];
  status: string;
  expiresAt: string;
  code?: string;
};

export default function EventAccessManagement({
  active,
  publicLoginUrl,
}: {
  active: boolean;
  publicLoginUrl: string | null;
}) {
  const [event, setEvent] = useState<EventSummary | null>(null);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [name, setName] = useState("");
  const [hours, setHours] = useState(12);
  const [vendor, setVendor] = useState(false);
  const [ledger, setLedger] = useState(false);
  const [flip, setFlip] = useState(false);
  const [inventory, setInventory] = useState(false);
  const [artworkReview, setArtworkReview] = useState(true);
  const [issued, setIssued] = useState<Grant | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const eventBound = vendor || ledger || flip || inventory;

  const load = useCallback(async () => {
    if (!active) return;
    const response = await fetch("/api/administration/event-access", { cache: "no-store" });
    if (!response.ok) {
      setMessage("Temporary access could not be loaded. Confirm that this phone is signed in as the owner.");
      return;
    }
    const body = (await response.json()) as { event: EventSummary | null; grants: Grant[] };
    setEvent(body.event);
    setGrants(body.grants);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    void fetch("/api/administration/event-access", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Temporary access could not be loaded.");
        return response.json() as Promise<{ event: EventSummary | null; grants: Grant[] }>;
      })
      .then((body) => {
        if (!cancelled) {
          setEvent(body.event);
          setGrants(body.grants);
        }
      })
      .catch(() => {
        if (!cancelled) setMessage("Temporary access could not be loaded. Confirm that this phone is signed in as the owner.");
      });
    return () => {
      cancelled = true;
    };
  }, [active]);

  async function create(submission: React.FormEvent) {
    submission.preventDefault();
    const entitlements: ModuleEntitlement[] = [];
    if (vendor) entitlements.push({ module: "VENDOR_WORKSPACE", access: "OPERATE" });
    if (ledger) entitlements.push({ module: "EVENT_LEDGER", access: "OPERATE" });
    if (flip) entitlements.push({ module: "EVENT_FLIP", access: "OPERATE" });
    if (inventory) entitlements.push({ module: "INVENTORY", access: "OPERATE" });
    if (artworkReview) entitlements.push({ module: "ARTWORK_REVIEW", access: "OPERATE" });
    if (!entitlements.length) {
      setMessage("Assign at least one temporary-access module.");
      return;
    }
    if (eventBound && !event) {
      setMessage("Start an Event Ledger event before assigning transactional modules.");
      return;
    }
    setMessage("Generating secure code…");
    setIssued(null);
    const response = await fetch("/api/administration/event-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: eventBound ? event?.id ?? null : null,
        workerLabel: name,
        durationHours: hours,
        entitlements,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as Grant & { error?: string };
    if (!response.ok) {
      setMessage(body.error ?? "Code could not be generated.");
      return;
    }
    setIssued(body);
    setName("");
    setMessage(
      body.scopeType === "TASK"
        ? "Timed task code generated. It is shown only now; send it privately to the worker."
        : "Event code generated. It is shown only now; send it privately to the worker.",
    );
    await load();
  }

  async function revoke(id: string) {
    const response = await fetch(`/api/administration/event-access?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setMessage(response.ok ? "Worker access revoked." : "Access could not be revoked.");
    await load();
  }

  function artworkOnly() {
    setVendor(false);
    setLedger(false);
    setFlip(false);
    setInventory(false);
    setArtworkReview(true);
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5" aria-labelledby="temporary-access-title">
      <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-300">Access security</p>
      <h3 id="temporary-access-title" className="mt-2 text-lg font-semibold text-white">Temporary worker login</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Generate account-free access. Artwork Review-only access needs no event and ends at the selected time or when revoked. Transactional access also ends when its Event Ledger event closes.
      </p>

      {!active ? (
        <p className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-4 text-sm text-amber-100">
          Configure private authentication before issuing worker access.
        </p>
      ) : (
        <form onSubmit={create} className="mt-5 space-y-4">
          {event ? (
            <p className="rounded-lg border border-cyan-900 bg-cyan-950/20 p-3 text-sm text-cyan-100">
              <strong>{event.name}</strong> · active event available for transactional access
            </p>
          ) : (
            <p className="rounded-lg border border-violet-800 bg-violet-950/20 p-3 text-sm text-violet-100">
              Artwork Review task access is available now. Transactional modules unlock after an Event Ledger event starts.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
            <label className="text-sm text-zinc-300">
              Worker name or station
              <input required minLength={2} maxLength={80} value={name} onChange={(change) => setName(change.target.value)} placeholder="Artwork desk — Ana" className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white" />
            </label>
            <label className="text-sm text-zinc-300">
              Duration
              <select value={hours} onChange={(change) => setHours(Number(change.target.value))} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-white">
                {[1, 2, 4, 8, 12, 16, 24].map((value) => <option key={value} value={value}>{value} hours</option>)}
              </select>
            </label>
          </div>
          <fieldset>
            <legend className="text-sm text-zinc-300">Assigned access</legend>
            <button type="button" onClick={artworkOnly} className="mt-2 min-h-11 rounded-lg border border-violet-700 px-3 text-sm font-semibold text-violet-200">
              Artwork Review only
            </button>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-200"><input type="checkbox" checked={artworkReview} onChange={(change) => setArtworkReview(change.target.checked)} /> Artwork Review</label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-200"><input type="checkbox" disabled={!event} checked={vendor} onChange={(change) => setVendor(change.target.checked)} /> Vendor Workspace {!event ? <span className="text-xs text-zinc-500">Event required</span> : null}</label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-200"><input type="checkbox" disabled={!event} checked={ledger} onChange={(change) => setLedger(change.target.checked)} /> Event Ledger {!event ? <span className="text-xs text-zinc-500">Event required</span> : null}</label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-200"><input type="checkbox" disabled={!event} checked={flip} onChange={(change) => setFlip(change.target.checked)} /> Event Flip {!event ? <span className="text-xs text-zinc-500">Event required</span> : null}</label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-zinc-200"><input type="checkbox" disabled={!event} checked={inventory} onChange={(change) => setInventory(change.target.checked)} /> General Inventory / Display Case {!event ? <span className="text-xs text-zinc-500">Event required</span> : null}</label>
            </div>
          </fieldset>
          <button className="min-h-11 rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950">
            {eventBound ? "Generate event code" : "Generate timed task code"}
          </button>
        </form>
      )}

      {message ? <p role="status" className="mt-3 text-sm text-zinc-400">{message}</p> : null}
      {issued?.code ? (
        <div className="mt-4 rounded-lg border border-cyan-700 bg-cyan-950/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Single-use worker code</p>
          <p className="mt-2 font-mono text-xl tracking-widest text-white">{issued.code}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyTextButton value={issued.code} label="Copy code" copiedLabel="Code copied" manualLabel="Worker code" className="min-h-11 rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-100" />
            <CopyTextButton value={publicLoginUrl ?? `${window.location.origin}/event-access`} label={`Copy ${publicLoginUrl ? "public " : ""}login link`} copiedLabel="Login link copied" manualLabel="Worker login link" className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-200" />
          </div>
          {publicLoginUrl ? <p className="mt-2 text-xs text-emerald-300">Browser-only public worker access is active; no Tailscale installation is required for this link.</p> : null}
        </div>
      ) : null}

      {grants.length ? (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-semibold text-zinc-200">Issued temporary access</h4>
          {grants.map((grant) => (
            <article key={grant.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/70 p-4">
              <div>
                <p className="font-medium text-white">{grant.workerLabel}</p>
                <p className="mt-1 text-xs text-zinc-400">{grant.scopeType === "TASK" ? "Timed task" : grant.eventName ?? "Event access"} · {grant.status.replaceAll("_", " ")} · until {new Date(grant.expiresAt).toLocaleString()}</p>
                <p className="mt-1 text-xs text-zinc-500">{grant.entitlements.map((entitlement) => entitlement.module.replaceAll("_", " ")).join(" · ")}</p>
              </div>
              {grant.status === "ACTIVE" || grant.status === "REDEEMED" ? <button type="button" onClick={() => void revoke(grant.id)} className="min-h-11 rounded-lg border border-red-900 px-4 text-sm text-red-200">Revoke</button> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
