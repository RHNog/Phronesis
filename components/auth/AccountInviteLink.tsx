"use client";

import { useState, useSyncExternalStore } from "react";
import CopyTextButton from "@/components/ui/CopyTextButton";
import { buildAccountSignUpUrl } from "@/lib/auth/accountInvite";

function subscribeToBrowserEnvironment(): () => void {
  return () => undefined;
}

function getCurrentOrigin(): string | null {
  return window.location.origin;
}

function getServerOrigin(): null {
  return null;
}

function getShareSupport(): boolean {
  return typeof navigator.share === "function";
}

function getServerShareSupport(): false {
  return false;
}

export default function AccountInviteLink({
  restrictedPublicOrigin,
}: {
  restrictedPublicOrigin: string | null;
}) {
  const currentOrigin = useSyncExternalStore(
    subscribeToBrowserEnvironment,
    getCurrentOrigin,
    getServerOrigin,
  );
  const shareSupported = useSyncExternalStore(
    subscribeToBrowserEnvironment,
    getShareSupport,
    getServerShareSupport,
  );
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const inviteUrl = buildAccountSignUpUrl(
    restrictedPublicOrigin,
    currentOrigin,
  );

  async function shareInvite(): Promise<void> {
    if (typeof navigator.share !== "function") return;
    setShareStatus("Opening share options…");
    try {
      await navigator.share({
        title: "Join Phronesis",
        text: "Create your Phronesis account. Access remains pending until the owner verifies you and assigns your modules.",
        url: inviteUrl,
      });
      setShareStatus("Invite shared.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setShareStatus(null);
        return;
      }
      setShareStatus("Sharing could not be opened. Copy the link instead.");
    }
  }

  return (
    <section
      aria-labelledby="account-invite-title"
      className="mt-4 overflow-hidden rounded-xl border border-cyan-800/80 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.14),transparent_45%),rgba(8,47,73,0.16)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Permanent account invite
          </p>
          <h4
            id="account-invite-title"
            className="mt-2 text-lg font-semibold text-white"
          >
            Invite people to Phronesis
          </h4>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Send this Sign Up link. Creating an account grants zero access; the
            request waits here until you verify the person and assign exact
            modules.
          </p>
        </div>
        <span className="rounded-full border border-cyan-800 bg-cyan-950/50 px-2.5 py-1 text-xs font-semibold text-cyan-200">
          Owner approval required
        </span>
      </div>

      <p className="mt-4 break-all rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-3 font-mono text-sm text-zinc-200">
        {inviteUrl}
      </p>

      <div className="mt-3 flex flex-wrap items-start gap-2">
        <CopyTextButton
          value={inviteUrl}
          label="Copy Sign Up link"
          copiedLabel="Sign Up link copied"
          manualLabel="Sign Up invite link"
          className="min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:opacity-50"
        />
        {shareSupported ? (
          <button
            type="button"
            onClick={() => void shareInvite()}
            className="min-h-11 rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-950/50"
          >
            Share invite
          </button>
        ) : null}
        <a
          href={inviteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white"
        >
          Preview Sign Up
        </a>
      </div>
      <p role="status" aria-live="polite" className="mt-2 text-xs text-zinc-400">
        {shareStatus}
      </p>
      <p className="mt-3 text-xs leading-5 text-zinc-500">
        {restrictedPublicOrigin
          ? "This uses the configured restricted-public address; Settings and owner administration remain blocked there."
          : "This is a private-network invite. The recipient must be able to reach this Phronesis address."}
      </p>
    </section>
  );
}
