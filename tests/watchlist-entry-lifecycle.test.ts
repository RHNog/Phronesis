import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateWatchlistMetrics,
  refreshWatchlistEntry,
  type WatchlistEntry,
} from "../features/watchlist/WatchlistRefreshEngine.ts";
import {
  defaultWatchlistId,
  hydrateWatchlistEntries,
  removeWatchlistEntry,
  restoreWatchlistEntry,
} from "../features/watchlist/WatchlistStorage.ts";

function entry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
  return calculateWatchlistMetrics({
    assetIdentity: {
      assetId: "lorcana:mulan",
      collectorNumber: "189",
      game: "Lorcana",
      name: "Mulan — Armored Fighter",
      printing: "Ursula's Return #189",
      printingId: "mulan-189",
      variantId: "mulan-189:unknown",
    },
    condition: "NM",
    currentValuation: null,
    developerDiagnostics: {
      apiSaved: true,
      cacheAgeMs: null,
      observationAgeMs: null,
      providerHit: false,
      replay: false,
      repositoryHit: false,
    },
    finish: "Unknown",
    id: "mulan-entry",
    language: "English",
    lastObservation: null,
    lastRefresh: null,
    marketTrend: "Unknown",
    observationSource: "Unavailable",
    refreshStatus: "Idle",
    targetPrice: 25,
    watchlistId: defaultWatchlistId,
    ...overrides,
  });
}

test("removal is scoped to current watchlist and undo restores position", () => {
  const defaultEntry = entry();
  const secondMembership = entry({ watchlistId: "buying" });
  const result = removeWatchlistEntry(
    [defaultEntry, secondMembership],
    defaultEntry.id,
    defaultWatchlistId,
  );
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].watchlistId, "buying");
  assert.equal(result.removed?.entry.assetIdentity.assetId, "lorcana:mulan");
  assert.deepEqual(restoreWatchlistEntry(result.entries, result.removed!), [
    defaultEntry,
    secondMembership,
  ]);
});

test("older persisted memberships migrate to the default watchlist", () => {
  const legacy = {
    ...entry(),
    watchlistId: undefined,
  } as unknown as WatchlistEntry;
  assert.equal(
    hydrateWatchlistEntries([legacy])[0].watchlistId,
    defaultWatchlistId,
  );
});

test("Lorcana refresh is skipped without calling market acquisition", async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    throw new Error("Market API must not be called");
  }) as typeof fetch;
  try {
    const refreshed = await refreshWatchlistEntry({
      entry: entry(),
      manual: true,
    });
    assert.equal(called, false);
    assert.equal(refreshed.refreshStatus, "Refresh Skipped");
    assert.equal(refreshed.marketStatus, "Stale Observation");
    assert.match(
      refreshed.developerDiagnostics.providerRequestJustification ?? "",
      /verified catalogue checkpoints/i,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
