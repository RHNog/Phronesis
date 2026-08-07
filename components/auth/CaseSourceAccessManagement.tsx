"use client";

import CopyTextButton from "@/components/ui/CopyTextButton";
import { hasCaseSourcePreparationAccess } from "@/lib/auth/caseSourceAccess";
import type { ModuleEntitlement } from "@/lib/auth/domain";

type Member = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  status: "ACTIVE" | "DISABLED";
  entitlements: readonly ModuleEntitlement[];
};

export default function CaseSourceAccessManagement({
  members,
  sheetUrl,
  directoryStatus,
}: {
  members: readonly Member[];
  sheetUrl: string | null;
  directoryStatus: "LOADING" | "READY" | "ERROR";
}) {
  const eligible = members.filter(hasCaseSourcePreparationAccess);

  return (
    <section
      aria-labelledby="case-source-access-heading"
      className="mt-6 rounded-xl border border-emerald-900/70 bg-emerald-950/10 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            External collaboration
          </p>
          <h4
            id="case-source-access-heading"
            className="mt-2 text-lg font-semibold text-white"
          >
            Case Source Google editors
          </h4>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Assign Inventory · Operate here, then add that exact account email
            as an Editor in Google. Both permissions are required; Phronesis
            never makes the Sheet public.
          </p>
        </div>
        <span className="rounded-full border border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-200">
          {directoryStatus === "READY"
            ? `${eligible.length} eligible`
            : directoryStatus === "LOADING"
              ? "Checking access…"
              : "Owner sign-in required"}
        </span>
      </div>

      {sheetUrl ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-950/40"
          >
            Open Sheet and click Share
          </a>
          <CopyTextButton
            value={sheetUrl}
            label="Copy Sheet link"
            copiedLabel="Sheet link copied"
            manualLabel="Private Case Source Sheet link"
            className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200"
          />
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-amber-900/70 bg-amber-950/20 px-3 py-3 text-sm text-amber-200">
          Configure the server-only Case Source Sheet URL before granting Google
          editor access.
        </p>
      )}

      {directoryStatus === "ERROR" ? (
        <div className="mt-4 rounded-lg border border-amber-900/70 bg-amber-950/20 p-4 text-sm leading-6 text-amber-200">
          <p>
            Sign in with the permanent owner account to load the approved member
            directory before sharing Google Editor access.
          </p>
          <a
            href="/sign-in"
            className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-amber-800 px-3 font-semibold text-amber-100"
          >
            Sign in as owner
          </a>
        </div>
      ) : directoryStatus === "LOADING" ? (
        <p role="status" className="mt-4 text-sm text-zinc-500">
          Checking approved Case Source editors…
        </p>
      ) : eligible.length ? (
        <ul className="mt-4 space-y-2">
          {eligible.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {member.name ?? member.email ?? member.userId}
                </p>
                <p className="mt-1 break-all text-xs text-zinc-500">
                  {member.email ?? "No account email available"}
                </p>
              </div>
              {member.email ? (
                <CopyTextButton
                  value={member.email}
                  label="Copy editor email"
                  copiedLabel="Editor email copied"
                  manualLabel="Eligible Case Source editor email"
                  className="min-h-11 rounded-lg border border-zinc-700 px-3 text-xs font-semibold text-zinc-200"
                />
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-500">
          No active member has Inventory · Operate yet.
        </p>
      )}

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Removing Phronesis access does not silently rewrite Google Drive. Remove
        the same email from the Sheet&apos;s Share dialog when access is revoked.
      </p>
    </section>
  );
}
