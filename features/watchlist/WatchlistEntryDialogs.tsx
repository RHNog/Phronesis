"use client";

import { useState, type ReactNode } from "react";
import type { WatchlistEntry } from "@/features/watchlist/WatchlistRefreshEngine";

export function CreateWatchlistEntryDialog({
  entry,
  onCancel,
  onCreate,
}: {
  entry?: WatchlistEntry;
  onCancel: () => void;
  onCreate: (entry: WatchlistEntry) => void;
}) {
  if (!entry) return null;
  return <CreateDialogContent entry={entry} key={entry.id} onCancel={onCancel} onCreate={onCreate} />;
}

function CreateDialogContent({
  entry,
  onCancel,
  onCreate,
}: {
  entry: WatchlistEntry;
  onCancel: () => void;
  onCreate: (entry: WatchlistEntry) => void;
}) {
  const [target, setTarget] = useState("");
  const [noTarget, setNoTarget] = useState(false);
  const [notes, setNotes] = useState("");
  const [reasonAdded, setReasonAdded] = useState("");
  const parsedTarget = Number(target);
  const validTarget = !noTarget && target.trim() !== "" && Number.isFinite(parsedTarget) && parsedTarget > 0;
  const valid = noTarget || validTarget;

  return (
    <DialogFrame ariaLabel="Configure Market Watch entry" onDismiss={onCancel}>
      <h2 className="text-lg font-semibold text-white">Add to Market Watch</h2>
      <p className="mt-2 text-sm font-medium text-zinc-200">{entry.assetIdentity.name}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">
        {entry.assetIdentity.printing} · {entry.finish} · {entry.condition} · {entry.language}
      </p>
      <label className="mt-5 block text-sm text-zinc-300">
        Target price
        <input
          autoFocus
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
          disabled={noTarget}
          min="0.01"
          onChange={(event) => setTarget(event.target.value)}
          placeholder="0.00"
          step="0.01"
          type="number"
          value={target}
        />
      </label>
      <label className="mt-3 flex min-h-11 items-center gap-3 text-sm text-zinc-300">
        <input checked={noTarget} onChange={(event) => setNoTarget(event.target.checked)} type="checkbox" className="h-4 w-4 accent-cyan-300" />
        Track without a target for now
      </label>
      <label className="mt-3 block text-sm text-zinc-300">
        Notes
        <textarea className="mt-2 min-h-20 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-400" onChange={(event) => setNotes(event.target.value)} placeholder="Optional" value={notes} />
      </label>
      <label className="mt-3 block text-sm text-zinc-300">
        Reason added
        <input className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-400" onChange={(event) => setReasonAdded(event.target.value)} placeholder="Optional buying thesis" value={reasonAdded} />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800" onClick={onCancel} type="button">Cancel</button>
        <button
          className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!valid}
          onClick={() => onCreate({
            ...entry,
            notes: notes.trim() || undefined,
            targetPrice: noTarget ? 0 : parsedTarget,
            watchHistory: entry.watchHistory
              ? { ...entry.watchHistory, reasonAdded: reasonAdded.trim() || undefined }
              : entry.watchHistory,
          })}
          type="button"
        >
          Add to Market Watch
        </button>
      </div>
    </DialogFrame>
  );
}

export function RemoveWatchlistEntryDialog({
  entry,
  onCancel,
  onConfirm,
}: {
  entry?: WatchlistEntry;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!entry) return null;

  return (
    <DialogFrame ariaLabel="Confirm watchlist removal" onDismiss={onCancel}>
      <h2 className="text-lg font-semibold text-white">Remove from Watchlist?</h2>
      <p className="mt-3 text-sm leading-6 text-zinc-400">
        Remove “{entry.assetIdentity.name}” from Watchlist? Its identity and market history will remain available.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <button className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800" onClick={onCancel} type="button">
          Cancel
        </button>
        <button autoFocus className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400" onClick={onConfirm} type="button">
          Remove
        </button>
      </div>
    </DialogFrame>
  );
}

export function EditWatchlistEntryDialog({
  entry,
  onCancel,
  onSave,
}: {
  entry?: WatchlistEntry;
  onCancel: () => void;
  onSave: (entry: WatchlistEntry) => void;
}) {
  if (!entry) return null;
  return <EditDialogContent entry={entry} key={`${entry.watchlistId}:${entry.id}`} onCancel={onCancel} onSave={onSave} />;
}

function EditDialogContent({
  entry,
  onCancel,
  onSave,
}: {
  entry: WatchlistEntry;
  onCancel: () => void;
  onSave: (entry: WatchlistEntry) => void;
}) {
  const [target, setTarget] = useState(String(entry.targetPrice));
  const [notes, setNotes] = useState(entry.notes ?? "");
  const [reasonAdded, setReasonAdded] = useState(entry.watchHistory?.reasonAdded ?? "");
  const parsedTarget = Number(target);
  const valid = Number.isFinite(parsedTarget) && parsedTarget >= 0;

  return (
    <DialogFrame ariaLabel="Edit watchlist entry" onDismiss={onCancel}>
      <h2 className="text-lg font-semibold text-white">Edit {entry.assetIdentity.name}</h2>
      <label className="mt-5 block text-sm text-zinc-300">
        Target price
        <input
          autoFocus
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          min="0"
          onChange={(event) => setTarget(event.target.value)}
          step="0.01"
          type="number"
          value={target}
        />
      </label>
      <label className="mt-4 block text-sm text-zinc-300">
        Notes
        <textarea
          className="mt-2 min-h-24 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          onChange={(event) => setNotes(event.target.value)}
          value={notes}
        />
      </label>
      <label className="mt-4 block text-sm text-zinc-300">
        Reason added
        <input
          className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
          onChange={(event) => setReasonAdded(event.target.value)}
          placeholder="Optional"
          value={reasonAdded}
        />
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <button className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800" onClick={onCancel} type="button">Cancel</button>
        <button className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50" disabled={!valid} onClick={() => onSave({ ...entry, notes: notes.trim(), targetPrice: parsedTarget, watchHistory: entry.watchHistory ? { ...entry.watchHistory, reasonAdded: reasonAdded.trim() || undefined } : entry.watchHistory })} type="button">Save</button>
      </div>
    </DialogFrame>
  );
}

export function DialogFrame({
  ariaLabel,
  children,
  onDismiss,
}: {
  ariaLabel: string;
  children: ReactNode;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onDismiss()}>
      <section aria-label={ariaLabel} aria-modal="true" className="w-full max-w-md rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-2xl" role="dialog">
        {children}
      </section>
    </div>
  );
}
