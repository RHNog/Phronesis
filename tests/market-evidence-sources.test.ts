import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { MarketEvidenceRepository } from "../lib/market/MarketEvidenceRepository.ts";
import { CardTraderListingProvider } from "../lib/providers/CardTraderProvider.ts";
import { EbayBrowseListingProvider } from "../lib/providers/eBayProvider.ts";
import { createSnapshotWatchlistEntry } from "../features/watchlist/CreateWatchlistEntry.ts";
import { WatchlistRepository } from "../lib/watchlist/WatchlistRepository.ts";
import {
  enrichWatchedCategoryWithJustTCG,
  getJustTCGWatchEnrichmentConfig,
} from "../lib/watchlist/JustTCGWatchEnrichment.ts";
import type { JustTCGNormalizedResponse } from "../lib/providers/justtcg/JustTCGNormalizer.ts";
import type { SearchMatch } from "../lib/pricing/types.ts";

test("official listing adapters remain disabled without server credentials", async () => {
  let called = false;
  const request = (async () => { called = true; return new Response(); }) as typeof fetch;
  const ebay = new EbayBrowseListingProvider({}, request);
  const cardTrader = new CardTraderListingProvider({}, request);
  assert.equal(ebay.getStatus().configured, false);
  assert.equal(cardTrader.getStatus().configured, false);
  await assert.rejects(() => ebay.fetchActiveListings({ query: "Mox Opal" }), /remains disabled/);
  await assert.rejects(() => cardTrader.fetchActiveListings({ blueprintId: 1 }), /remains disabled/);
  assert.equal(called, false);
});

test("eBay Browse normalizes only current fixed-price listing evidence", async () => {
  const request = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.match(url.searchParams.get("filter") ?? "", /FIXED_PRICE/);
    assert.equal((init?.headers as Record<string, string>).authorization, "Bearer token");
    return Response.json({ itemSummaries: [
      { itemId: "live", title: "Mox Opal", itemWebUrl: "https://www.ebay.com/itm/live", condition: "Used", itemEndDate: "2099-01-01T00:00:00.000Z", price: { value: "100.00", currency: "USD" }, shippingOptions: [{ shippingCost: { value: "5.00", currency: "USD" } }] },
      { itemId: "expired", itemWebUrl: "https://www.ebay.com/itm/expired", itemEndDate: "2020-01-01T00:00:00.000Z", price: { value: "1.00", currency: "USD" } },
    ] });
  }) as typeof fetch;
  const provider = new EbayBrowseListingProvider({ accessToken: "token" }, request);
  const listings = await provider.fetchActiveListings({ query: "Mox Opal", limit: 10 });
  assert.equal(listings.length, 1);
  assert.equal(listings[0].priceCents, 10_000);
  assert.equal(listings[0].shippingCents, 500);
});

test("CardTrader requires exact blueprint identity and normalizes official marketplace products", async () => {
  const request = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("blueprint_id"), "42");
    assert.equal((init?.headers as Record<string, string>).authorization, "Bearer token");
    return Response.json([{ id: 7, name_en: "Mox Opal", quantity: 2, price: { cents: 9_900, currency: "EUR" }, properties_hash: { condition: "Near Mint" } }]);
  }) as typeof fetch;
  const provider = new CardTraderListingProvider({ token: "token" }, request);
  await assert.rejects(() => provider.fetchActiveListings({ blueprintId: 0 }), /exact CardTrader blueprint/);
  const listings = await provider.fetchActiveListings({ blueprintId: 42 });
  assert.equal(listings[0].priceCents, 9_900);
  assert.equal(listings[0].quantity, 2);
  assert.equal(listings[0].condition, "Near Mint");
});

test("active listings and first-party observed sales persist as separate user-owned evidence", () => {
  const database = new DatabaseSync(":memory:");
  const repository = new MarketEvidenceRepository(database);
  const owner = { ownerUserId: "owner", workspaceId: "workspace" };
  const other = { ownerUserId: "other", workspaceId: "workspace" };
  repository.replaceActiveListings(owner, "entry", "ebay-browse", [{
    externalId: "listing-1",
    providerId: "ebay-browse",
    title: "Mox Opal",
    priceCents: 10_000,
    shippingCents: 500,
    currency: "USD",
    condition: "Used",
    quantity: 1,
    observedAt: "2026-07-30T00:00:00.000Z",
    sourceUrl: "https://www.ebay.com/itm/listing-1",
  }]);
  repository.recordObservedSale(owner, {
    entryId: "entry",
    priceCents: 9_500,
    observedAt: "2026-07-30T01:00:00.000Z",
    provenance: "Recorded from an in-person card-show sale.",
  });
  const records = repository.list(owner, "entry");
  assert.deepEqual(new Set(records.map((record) => record.evidenceType)), new Set(["ACTIVE_LISTING", "OBSERVED_SALE"]));
  assert.equal(records.find((record) => record.evidenceType === "OBSERVED_SALE")?.providerId, "phronesis-first-party");
  assert.equal(repository.list(other, "entry").length, 0);
  database.close();
});

test("JustTCG watch enrichment is explicit, budgeted, and stored only as a market estimate", async () => {
  assert.equal(getJustTCGWatchEnrichmentConfig({}).enabled, false);
  const database = new DatabaseSync(":memory:");
  const watchlists = new WatchlistRepository(database);
  const evidence = new MarketEvidenceRepository(database);
  const principal = { ownerUserId: "owner", workspaceId: "workspace" };
  const match: SearchMatch = {
    categoryId: "magic-en",
    sku: "mox-opal-normal",
    productType: "SINGLE",
    name: "Mox Opal",
    setName: "Scars of Mirrodin",
    collectorNumber: "179",
    variant: "Normal",
    language: "English",
    imageUrl: null,
    score: 1,
    prices: {},
    sealedPrice: null,
    previousMarketPriceCents: null,
    previousSnapshotDate: null,
  };
  const entry = createSnapshotWatchlistEntry({ condition: "NEAR_MINT", match, price: null });
  entry.assetIdentity.providerVariantIdentifier = "12345";
  watchlists.track(principal, entry);
  let calls = 0;
  const response = {
    cards: [{
      name: "Mox Opal",
      number: "179",
      variants: [{
        tcgplayerSkuId: "12345",
        currentPriceUsd: 190,
        condition: "Near Mint",
        printing: "Normal",
        language: "English",
        variantUuid: "variant-uuid",
        lastUpdatedAt: "2026-07-30T06:00:00.000Z",
      }],
    }],
    synchronizedAt: "2026-07-30T06:00:00.000Z",
    usage: { apiDailyRequestsRemaining: 99 },
  } as unknown as JustTCGNormalizedResponse;
  const result = await enrichWatchedCategoryWithJustTCG({
    categoryId: "magic-en",
    evidenceRepository: evidence,
    watchlistRepository: watchlists,
    environment: {
      JUSTTCG_API_KEY: "configured",
      PHRONESIS_JUSTTCG_WATCH_ENRICHMENT: "ENABLED",
      PHRONESIS_JUSTTCG_WATCH_REQUEST_BUDGET: "1",
    },
    execute: async () => { calls += 1; return response; },
  });
  assert.equal(calls, 1);
  assert.equal(result.enriched, 1);
  const records = evidence.list(principal, entry.id);
  assert.equal(records[0].evidenceType, "MARKET_ESTIMATE");
  assert.equal(records[0].priceCents, 19_000);
  assert.equal(records.some((record) => record.evidenceType === "OBSERVED_SALE"), false);
  database.close();
});
