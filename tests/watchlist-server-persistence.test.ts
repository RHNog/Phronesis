import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  createSnapshotWatchlistEntry,
  watchlistEntryKey,
} from "../features/watchlist/CreateWatchlistEntry.ts";
import { refreshWatchlistEntryFromCatalogue } from "../lib/watchlist/CatalogueWatchRefresh.ts";
import {
  LEGACY_WATCHLIST_OWNER_ID,
  LEGACY_WATCHLIST_WORKSPACE_ID,
  WatchlistRepository,
} from "../lib/watchlist/WatchlistRepository.ts";
import type { SearchMatch } from "../lib/pricing/types.ts";

const match: SearchMatch = {
  categoryId: "magic-en",
  sku: "mox-opal-som-179-normal",
  productType: "SINGLE",
  name: "Mox Opal",
  setName: "Scars of Mirrodin",
  collectorNumber: "179",
  variant: "Normal",
  language: "English",
  imageUrl: null,
  score: 1,
  prices: {
    NEAR_MINT: {
      marketPriceCents: 18200,
      listingPriceCents: 18000,
      shippingCents: 200,
      shippingSource: "EXPORTED",
      snapshotDate: "2026-07-30T00:00:00.000Z",
      deliveredPriceCents: 18200,
      sourceSku: "12345",
    },
  },
  sealedPrice: null,
  previousMarketPriceCents: null,
  previousSnapshotDate: null,
};

function entry() {
  return createSnapshotWatchlistEntry({
    condition: "NEAR_MINT",
    match,
    price: match.prices.NEAR_MINT!,
  });
}

test("snapshot tracking creates an exact finish-condition identity", () => {
  const tracked = entry();
  assert.equal(tracked.id, watchlistEntryKey(match, "NEAR_MINT"));
  assert.equal(tracked.currentValuation, 182);
  assert.equal(tracked.condition, "NM");
  assert.equal(tracked.targetPrice, 0);
  assert.equal(tracked.watchHistory?.initialMarketValuation, 182);
});

test("verified catalogue refresh appends repository history without provider acquisition", () => {
  const original = entry();
  const latestPrice = {
    ...match.prices.NEAR_MINT!,
    marketPriceCents: 20_000,
    snapshotDate: "2026-07-30T06:00:00.000Z",
  };
  const refreshed = refreshWatchlistEntryFromCatalogue(
    original,
    { ...match, prices: { ...match.prices, NEAR_MINT: latestPrice } },
    "2026-07-30T06:01:00.000Z",
  );
  assert.ok(refreshed);
  assert.equal(refreshed.currentValuation, 200);
  assert.equal(refreshed.marketTrend, "Increasing");
  assert.equal(refreshed.developerDiagnostics.providerHit, false);
  assert.equal(refreshed.watchHistory?.observations.length, 2);
  assert.equal(refreshed.lastRefresh, "2026-07-30T06:01:00.000Z");
});

test("server watchlist persistence is user-scoped, idempotent, and reversible", () => {
  const database = new DatabaseSync(":memory:");
  const repository = new WatchlistRepository(database);
  const first = { ownerUserId: "user-a", workspaceId: "workspace" };
  const second = { ownerUserId: "user-b", workspaceId: "workspace" };
  assert.equal(repository.track(first, entry()).created, true);
  assert.equal(repository.track(first, entry()).created, false);
  assert.equal(repository.listEntries(first).length, 1);
  assert.equal(repository.listEntries(second).length, 0);
  assert.equal(repository.remove(first, entry().id)?.id, entry().id);
  assert.equal(repository.listEntries(first).length, 0);
  assert.equal(repository.restore(first, entry().id)?.id, entry().id);
  assert.equal(repository.listEntries(first).length, 1);
  database.close();
});

test("local migration respects removal tombstones and legacy claims retain rollback data", () => {
  const database = new DatabaseSync(":memory:");
  const repository = new WatchlistRepository(database);
  const legacy = {
    ownerUserId: LEGACY_WATCHLIST_OWNER_ID,
    workspaceId: LEGACY_WATCHLIST_WORKSPACE_ID,
  };
  repository.importEntries(legacy, [entry()]);
  repository.remove(legacy, entry().id);
  assert.equal(repository.importEntries(legacy, [entry()]).length, 0);
  repository.restore(legacy, entry().id);
  const target = { ownerUserId: "owner", workspaceId: "workspace" };
  assert.equal(repository.claimLegacyEntries(target), 1);
  assert.equal(repository.claimLegacyEntries(target), 0);
  assert.equal(repository.listEntries(legacy).length, 1);
  assert.equal(repository.listEntries(target).length, 1);
  database.close();
});
