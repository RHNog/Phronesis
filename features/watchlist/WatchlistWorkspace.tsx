"use client";

import { useEffect, useMemo, useState } from "react";
import {
  commandPaletteSelectionEvent,
  type CommandPaletteAssetSelection,
} from "@/components/search/CommandPaletteRouter";
import WatchlistCard from "@/features/watchlist/WatchlistCard";
import {
  loadServerWatchlistEntries,
  removeServerWatchlistEntry,
  restoreServerWatchlistEntry,
  trackWatchlistEntry,
  updateServerWatchlistEntry,
} from "@/features/watchlist/WatchlistApi";
import {
  defaultWatchlistId,
  readPersistedWatchlistEntries,
  removeWatchlistEntry,
  restoreWatchlistEntry,
  saveWatchlistEntries,
  updateWatchlistEntry,
  type RemovedWatchlistEntry,
} from "@/features/watchlist/WatchlistStorage";
import {
  EditWatchlistEntryDialog,
  RemoveWatchlistEntryDialog,
} from "@/features/watchlist/WatchlistEntryDialogs";
import WatchlistTable from "@/features/watchlist/WatchlistTable";
import WatchlistToolbar from "@/features/watchlist/WatchlistToolbar";
import {
  calculateWatchlistMetrics,
  refreshWatchlistEntry,
  type WatchlistEntry,
} from "@/features/watchlist/WatchlistRefreshEngine";
import { resolveCanonicalTreatment } from "@/lib/engines/identity/IdentityTreatmentResolver";

export default function WatchlistWorkspace() {
  const [developerMode, setDeveloperMode] = useState(false);
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [refreshingEntryId, setRefreshingEntryId] = useState<string | null>(
    null,
  );
  const [providerRequestsUsed, setProviderRequestsUsed] = useState(0);
  const [pendingRemoval, setPendingRemoval] = useState<WatchlistEntry>();
  const [editingEntry, setEditingEntry] = useState<WatchlistEntry>();
  const [undoRemoval, setUndoRemoval] = useState<RemovedWatchlistEntry>();
  const [synchronizing, setSynchronizing] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const localEntries = readPersistedWatchlistEntries();
    void loadServerWatchlistEntries(localEntries ?? undefined)
      .then((serverEntries) => {
        if (cancelled) return;
        setEntries(serverEntries);
        saveWatchlistEntries(serverEntries);
        setSyncError(null);
      })
      .catch((error) => {
        if (!cancelled) {
          if (localEntries) setEntries(localEntries);
          setSyncError(
            error instanceof Error
              ? error.message
              : "Market Watch could not synchronize.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSynchronizing(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handlePaletteSelection(event: Event) {
      const selection = (event as CustomEvent<CommandPaletteAssetSelection>)
        .detail;
      const id = `${selection.printing.id}:${selection.variant.id}:${selection.condition}`;

      const entry = calculateWatchlistMetrics({
        assetIdentity: {
          assetId: selection.identityId,
          collectorNumber: selection.printing.number,
          game: selection.printing.game.toLowerCase(),
          image: {
            source: "Provider",
            urls: selection.variant.imageUrls ??
              selection.printing.imageUrls ?? {
                normal: selection.printing.imageUrl,
              },
          },
          name: selection.printing.name,
          printing: `${selection.printing.set} #${selection.printing.number}`,
          printingId: selection.printing.id,
          setCode: selection.printing.setCode,
          variantId: selection.variant.id,
          gameplayIdentityId: selection.printing.gameplayIdentityId,
          marketIdentityId:
            selection.printing.marketIdentities?.[0]?.marketIdentityId,
          physicalVariantIdentityId:
            selection.variant.physicalVariantIdentityId ??
            selection.printing.physicalVariants?.[0]?.physicalVariantIdentityId,
          printingIdentityId:
            selection.printing.printingIdentity?.printingIdentityId,
        },
        condition: selection.condition,
        currentValuation: null,
        developerDiagnostics: {
          apiSaved: true,
          cacheAgeMs: null,
          observationAgeMs: null,
          providerHit: false,
          replay: false,
          repositoryHit: false,
          repositorySource: "Awaiting explicit refresh",
        },
        finish: selection.variant.finish,
        id,
        language: selection.printing.language ?? "English",
        lastObservation: null,
        lastRefresh: null,
        marketTrend: "Unknown",
        observationSource: "Unavailable",
        refreshStatus: "Idle",
        targetPrice: 0,
        physicalFinish:
          selection.variant.physicalFinish ?? selection.printing.physicalFinish,
        printingDesignFacets: selection.printing.printingDesignFacets ?? [],
        treatment:
          selection.variant.treatmentDetails ??
          selection.printing.treatmentDetails ??
          resolveCanonicalTreatment(selection.printing),
        watchlistId: defaultWatchlistId,
      });
      void trackWatchlistEntry(entry)
        .then((result) => {
          setEntries((current) => {
            if (current.some((candidate) => candidate.id === result.entry.id))
              return current;
            const next = [...current, result.entry];
            saveWatchlistEntries(next);
            return next;
          });
          setSyncError(null);
        })
        .catch((error) =>
          setSyncError(
            error instanceof Error
              ? error.message
              : "The card could not be tracked.",
          ),
        );
    }

    window.addEventListener(
      commandPaletteSelectionEvent,
      handlePaletteSelection,
    );
    return () =>
      window.removeEventListener(
        commandPaletteSelectionEvent,
        handlePaletteSelection,
      );
  }, []);

  useEffect(() => {
    if (!undoRemoval) return;
    const timeout = window.setTimeout(() => setUndoRemoval(undefined), 7000);
    return () => window.clearTimeout(timeout);
  }, [undoRemoval]);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((first, second) => {
        const priorityOrder = {
          Highest: 0,
          High: 1,
          Medium: 2,
          Low: 3,
          Lowest: 4,
        };

        return (
          priorityOrder[first.refreshPriority] -
          priorityOrder[second.refreshPriority]
        );
      }),
    [entries],
  );

  async function handleRefresh(entry: WatchlistEntry) {
    setRefreshingEntryId(entry.id);

    const refreshed = await refreshWatchlistEntry({
      budget: {
        providerRequestsAvailable: 100,
        providerRequestsUsed,
      },
      entry,
      manual: true,
    });
    if (refreshed.developerDiagnostics.providerHit) {
      setProviderRequestsUsed((current) => current + 1);
    }

    try {
      const persisted = await updateServerWatchlistEntry(refreshed);
      setEntries((current) => {
        const membershipStillExists = current.some(
          (candidate) =>
            candidate.id === persisted.id &&
            candidate.watchlistId === persisted.watchlistId,
        );
        if (!membershipStillExists) return current;
        const nextEntries = updateWatchlistEntry(current, persisted);
        saveWatchlistEntries(nextEntries);
        return nextEntries;
      });
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "The refreshed observation could not synchronize.",
      );
    }
    setRefreshingEntryId((current) => (current === entry.id ? null : current));
  }

  async function handleConfirmRemove() {
    if (!pendingRemoval) return;
    try {
      await removeServerWatchlistEntry(pendingRemoval.id);
      const result = removeWatchlistEntry(
        entries,
        pendingRemoval.id,
        pendingRemoval.watchlistId,
      );
      if (!result.removed) {
        setPendingRemoval(undefined);
        return;
      }
      setEntries(result.entries);
      saveWatchlistEntries(result.entries);
      setUndoRemoval(result.removed);
      if (refreshingEntryId === pendingRemoval.id) setRefreshingEntryId(null);
      setPendingRemoval(undefined);
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "The watch could not be removed.",
      );
    }
  }

  async function handleUndoRemove() {
    if (!undoRemoval) return;
    try {
      const restoredEntry = await restoreServerWatchlistEntry(
        undoRemoval.entry.id,
      );
      setEntries((current) => {
        const restored = restoreWatchlistEntry(current, {
          ...undoRemoval,
          entry: restoredEntry,
        });
        saveWatchlistEntries(restored);
        return restored;
      });
      setUndoRemoval(undefined);
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "The watch could not be restored.",
      );
    }
  }

  async function handleSaveEdit(updatedEntry: WatchlistEntry) {
    const updated = calculateWatchlistMetrics(updatedEntry);
    try {
      const persisted = await updateServerWatchlistEntry(updated);
      const nextEntries = updateWatchlistEntry(entries, persisted);
      setEntries(nextEntries);
      saveWatchlistEntries(nextEntries);
      setEditingEntry(undefined);
      setSyncError(null);
    } catch (error) {
      setSyncError(
        error instanceof Error
          ? error.message
          : "The watch could not be updated.",
      );
    }
  }

  return (
    <div className="w-full space-y-5">
      <WatchlistToolbar
        developerMode={developerMode}
        entries={entries}
        onDeveloperModeChange={setDeveloperMode}
        providerRequestsUsed={providerRequestsUsed}
      />

      {synchronizing ? (
        <p
          aria-live="polite"
          className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400"
        >
          Synchronizing your Market Watch…
        </p>
      ) : null}
      {syncError ? (
        <p
          role="alert"
          className="rounded-lg border border-amber-900 bg-amber-950/30 px-4 py-3 text-sm text-amber-100"
        >
          {syncError} Your last local copy remains available.
        </p>
      ) : null}

      {sortedEntries.length > 0 ? (
        <WatchlistTable
          developerMode={developerMode}
          entries={sortedEntries}
          onEdit={setEditingEntry}
          onRefresh={handleRefresh}
          onRemove={setPendingRemoval}
          refreshingEntryId={refreshingEntryId}
        />
      ) : (
        <section className="rounded-lg border border-dashed border-zinc-700 bg-zinc-950 px-6 py-14 text-center">
          <h3 className="font-semibold text-zinc-200">
            Your Watchlist is empty
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Press ⌘K or Ctrl+K to find a collectible and add it.
          </p>
        </section>
      )}

      <section className="space-y-3 md:hidden">
        {sortedEntries.map((entry) => (
          <WatchlistCard
            developerMode={developerMode}
            entry={entry}
            isRefreshing={refreshingEntryId === entry.id}
            key={entry.id}
            onEdit={setEditingEntry}
            onRefresh={handleRefresh}
            onRemove={setPendingRemoval}
          />
        ))}
      </section>

      <RemoveWatchlistEntryDialog
        entry={pendingRemoval}
        onCancel={() => setPendingRemoval(undefined)}
        onConfirm={handleConfirmRemove}
      />
      <EditWatchlistEntryDialog
        entry={editingEntry}
        onCancel={() => setEditingEntry(undefined)}
        onSave={handleSaveEdit}
      />

      {undoRemoval ? (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-40 flex items-center gap-4 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 shadow-xl shadow-black/40"
          role="status"
        >
          <span>
            {undoRemoval.entry.assetIdentity.name} removed from Watchlist.
          </span>
          <button
            className="font-semibold text-cyan-300 hover:text-cyan-200"
            onClick={handleUndoRemove}
            type="button"
          >
            Undo
          </button>
        </div>
      ) : null}
    </div>
  );
}
