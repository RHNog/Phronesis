"use client";

import CopyTextButton from "@/components/ui/CopyTextButton";

const CASE_SOURCE_COLUMNS = [
  "Item Name",
  "Price",
  "Quantity",
  "Color",
  "Variation",
] as const;

export default function CaseSourcePreparation({
  sheetUrl,
}: {
  sheetUrl: string | null;
}) {
  return (
    <section
      aria-labelledby="case-source-preparation-heading"
      className="overflow-hidden rounded-2xl border border-emerald-900/70 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.13),transparent_42%),rgba(6,78,59,0.1)] p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Case Source preparation
          </p>
          <h2
            id="case-source-preparation-heading"
            className="mt-2 text-xl font-semibold text-white"
          >
            Prepare opening display inventory
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            Inventory operators can collaborate in the native Google Sheet before
            the event opens. Export its inventory tab as CSV only when the
            opening Case is ready to be frozen in Event Ledger.
          </p>
        </div>
        <span className="rounded-full border border-emerald-800 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-200">
          Inventory · Operate
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Case Source columns">
        {CASE_SOURCE_COLUMNS.map((column) => (
          <span
            key={column}
            className="rounded-full border border-zinc-800 bg-zinc-950/70 px-3 py-1 text-xs text-zinc-400"
          >
            {column}
          </span>
        ))}
      </div>

      {sheetUrl ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-200"
          >
            Open editable Case Source
          </a>
          <CopyTextButton
            value={sheetUrl}
            label="Copy Sheet link"
            copiedLabel="Sheet link copied"
            manualLabel="Private Case Source Sheet link"
            className="min-h-11 rounded-lg border border-emerald-800 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-950/40"
          />
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-amber-900/70 bg-amber-950/20 px-3 py-3 text-sm text-amber-200">
          The Case Source Sheet is not configured. Ask an administrator to set
          the server-only Sheet address.
        </p>
      )}

      <p className="mt-3 text-xs leading-5 text-zinc-500">
        Phronesis access and Google access are separate. If Google asks for
        permission, request Editor access with the same email approved in
        Phronesis; the owner confirms it against People &amp; access.
      </p>
    </section>
  );
}
