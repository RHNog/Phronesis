"use client";

import Link from "next/link";
import { useState } from "react";
import EventAccessManagement from "@/components/auth/EventAccessManagement";

export default function OngoingEventTeamAccess({
  canManage,
  signInRequired,
  publicLoginUrl,
}: {
  canManage: boolean;
  signInRequired: boolean;
  publicLoginUrl: string | null;
}) {
  const [temporaryOpen, setTemporaryOpen] = useState(false);

  return (
    <section
      aria-labelledby="ongoing-event-team-heading"
      className="rounded-2xl border border-sky-900/70 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_46%),rgba(12,74,110,0.08)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            Live access
          </p>
          <h2
            id="ongoing-event-team-heading"
            className="mt-2 text-xl font-semibold text-white"
          >
            Event team
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Add people while this ledger is active. Approved-account access
            takes effect on the next request and remains until removed;
            temporary worker access ends automatically when this event closes.
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            This team is access control, not the consignor roster locked at
            opening.
          </p>
        </div>
        <span className="rounded-full border border-sky-800 bg-sky-950/30 px-2.5 py-1 text-xs font-semibold text-sky-200">
          Ongoing event
        </span>
      </div>

      {canManage ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Approved account
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Approve a trusted account or add Event Ledger to an existing
                member. This is permanent module access until you change it.
              </p>
              <Link
                href="/settings?panel=people"
                className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-cyan-800 px-3 text-sm font-semibold text-cyan-200"
              >
                Add approved account
              </Link>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <p className="text-sm font-semibold text-white">
                Temporary event worker
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Issue one single-use Event Ledger code without creating an
                account. The event and timer both limit the session.
              </p>
              <button
                type="button"
                aria-expanded={temporaryOpen}
                aria-controls="ongoing-event-worker-access"
                onClick={() => setTemporaryOpen((current) => !current)}
                className="mt-3 min-h-11 rounded-lg border border-sky-800 px-3 text-sm font-semibold text-sky-200"
              >
                {temporaryOpen ? "Hide worker access" : "Add temporary worker"}
              </button>
            </div>
          </div>
          {temporaryOpen ? (
            <div id="ongoing-event-worker-access" className="mt-4">
              <EventAccessManagement
                active
                publicLoginUrl={publicLoginUrl}
                variant="EVENT_LEDGER"
              />
            </div>
          ) : null}
        </>
      ) : signInRequired ? (
        <div className="mt-4 rounded-xl border border-amber-900/70 bg-amber-950/20 p-4 text-sm leading-6 text-amber-200">
          <p>
            Permanent owner sign-in is required before Phronesis can issue or
            change user access.
          </p>
          <Link
            href="/sign-in?callbackURL=%2Fevent-ledger"
            className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-amber-800 px-3 font-semibold text-amber-100"
          >
            Sign in to manage event team
          </Link>
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-500">
          A permanent Phronesis administrator manages approved accounts and
          temporary event workers.
        </p>
      )}
    </section>
  );
}
