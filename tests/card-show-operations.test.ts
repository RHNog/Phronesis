import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { AuthorizationRepository } from "../lib/auth/AuthorizationRepository.ts";
import { CuratedArtworkStore } from "../lib/artwork/CuratedArtworkStore.ts";
import {
  calculateWatchlistMetrics,
  getMarketStatus,
  refreshWatchlistEntry,
  type WatchlistEntry,
} from "../features/watchlist/WatchlistRefreshEngine.ts";
import { providerArtworkQueries } from "../lib/pricing/artwork.ts";
import type { PricingRepository } from "../lib/pricing/repository.ts";
import type { SearchMatch } from "../lib/pricing/types.ts";
import { resolveCatalogueWatch } from "../lib/watchlist/CatalogueWatchRefresh.ts";
import { PurchaseLedgerRepository } from "../lib/purchases/PurchaseLedgerRepository.ts";
import { validatePurchaseLineDraft } from "../lib/purchases/domain.ts";

const match: SearchMatch = {
  categoryId: "magic-en",
  sku: "tcg:urzas-saga-store-29-foil",
  productType: "SINGLE",
  name: "Urza's Saga",
  setName: "Store Championships",
  collectorNumber: "29",
  variant: "Foil",
  language: "English",
  imageUrl: null,
  score: 100,
  prices: {
    NEAR_MINT: {
      marketPriceCents: 10000,
      listingPriceCents: 9800,
      shippingCents: 200,
      shippingSource: "EXPORTED",
      deliveredPriceCents: 10000,
      snapshotDate: "2026-07-30T12:00:00.000Z",
      sourceSku: "123",
    },
  },
  sealedPrice: null,
  previousMarketPriceCents: null,
  previousSnapshotDate: null,
};

function watch(overrides: Partial<WatchlistEntry> = {}) {
  return calculateWatchlistMetrics({
    assetIdentity: {
      assetId: "scryfall:legacy",
      collectorNumber: "29",
      game: "Magic",
      name: "Urza's Saga",
      printing: "Store Championships #29",
      printingId: "scryfall-printing-id",
      variantId: "scryfall-variant-id",
    },
    condition: "NM",
    currentValuation: 100,
    developerDiagnostics: {
      apiSaved: true,
      cacheAgeMs: null,
      observationAgeMs: null,
      providerHit: false,
      replay: false,
      repositoryHit: true,
    },
    finish: "Foil",
    id: "legacy-watch",
    language: "English",
    lastObservation: "2026-07-29T12:00:00.000Z",
    lastRefresh: "2026-07-29T12:00:00.000Z",
    marketTrend: "Unknown",
    observationSource: "Repository",
    refreshStatus: "Idle",
    targetPrice: 0,
    watchlistId: "default",
    ...overrides,
  });
}

test("targetless watches do not display a misleading difference", () => {
  const entry = watch();
  assert.equal(entry.difference, null);
  assert.equal(entry.percentDifference, null);
});

test("refresh failure takes precedence over recently refreshed", () => {
  assert.equal(
    getMarketStatus({
      lastRefresh: new Date().toISOString(),
      observationSource: "Repository",
      percentToTarget: null,
      refreshStatus: "Refresh Failed",
    }),
    "Refresh Recommended",
  );
});

test("failed client refresh preserves the last successful refresh and explains non-JSON failures", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response("upstream failure", { status: 500 })) as typeof fetch;
  try {
    const entry = watch();
    const refreshed = await refreshWatchlistEntry({ entry, manual: true });
    assert.equal(refreshed.refreshStatus, "Refresh Failed");
    assert.equal(refreshed.lastRefresh, entry.lastRefresh);
    assert.match(
      refreshed.developerDiagnostics.errorMessage ?? "",
      /failed with 500/i,
    );
  } finally {
    globalThis.fetch = original;
  }
});

test("a strict unique legacy watch reconciles to its exact catalogue SKU", () => {
  const pricing = {
    findBySku: () => null,
    search: () => ({ singles: [match], sealed: [] }),
  } as unknown as PricingRepository;
  const resolution = resolveCatalogueWatch(watch(), pricing);
  assert.ok(resolution.match);
  assert.equal(resolution.match.sku, match.sku);
  assert.equal(resolution.reconciled, true);
});

test("legacy reconciliation tolerates provider set-label drift only when physical identity is unique", () => {
  const renamedSet = {
    ...match,
    setName: "Game Day & Store Championship Promos",
  };
  const pricing = {
    findBySku: () => null,
    search: () => ({ singles: [renamedSet], sealed: [] }),
  } as unknown as PricingRepository;
  const resolution = resolveCatalogueWatch(watch(), pricing);
  assert.equal(resolution.match?.sku, match.sku);

  const ambiguous = {
    ...renamedSet,
    sku: "tcg:another-physical-product",
    setName: "Different Provider Label",
  };
  const ambiguousPricing = {
    findBySku: () => null,
    search: () => ({ singles: [renamedSet, ambiguous], sealed: [] }),
  } as unknown as PricingRepository;
  assert.equal(resolveCatalogueWatch(watch(), ambiguousPricing).match, null);
});

test("visible Pokémon identities produce bounded independent artwork queries", () => {
  const results = [
    {
      ...match,
      categoryId: "pokemon-en",
      name: "Code Card - First Partner",
      setName: "First Partner Pack",
      sku: "code",
    },
    {
      ...match,
      categoryId: "pokemon-en",
      name: "Mudkip",
      setName: "First Partner Pack",
      sku: "mudkip",
    },
    {
      ...match,
      categoryId: "pokemon-en",
      name: "Bulbasaur",
      setName: "First Partner Pack",
      sku: "bulbasaur",
    },
  ];
  assert.deepEqual(providerArtworkQueries("pokemon-en", "first par", results), [
    "Code Card - First Partner",
    "Mudkip",
    "Bulbasaur",
  ]);
});

test("employee activation codes are hashed, single-use, and preserve assigned modules", () => {
  const repository = new AuthorizationRepository();
  repository.requestAccess({
    userId: "employee-user",
    email: "employee@example.com",
    name: "Existing Employee Account",
  });
  const invitation = repository.createInvitation({
    email: "employee@example.com",
    role: "OPERATOR",
    entitlements: [{ module: "VENDOR_WORKSPACE", access: "OPERATE" }],
    requireActivation: true,
  });
  assert.ok(invitation.activationCode);
  assert.equal(repository.findPendingInvitation(invitation.email), null);
  repository.redeemActivationCode(invitation.activationCode!);
  assert.throws(
    () => repository.redeemActivationCode(invitation.activationCode!),
    /invalid|already used/i,
  );
  const membership = repository.provisionInvitedUser(
    invitation.email,
    "employee-user",
  );
  assert.deepEqual(membership.entitlements, [
    { module: "VENDOR_WORKSPACE", access: "OPERATE" },
  ]);
  assert.equal(
    repository.authorize("employee-user", "MARKET_WATCH", "VIEW").allowed,
    false,
  );
  assert.equal(repository.getAccessRequest("employee-user")?.status, "APPROVED");
  repository.close();
});

test("event checkout persists exact and mixed Bulk lines into an idempotent receipt", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const principal = { workspaceId: "workspace", operatorUserId: "employee" };
  const event = ledger.createEvent(principal, {
    name: "Saturday Show",
    eventDate: "2026-08-01",
    location: "Convention Center",
  });
  ledger.addLine(
    principal,
    event.id,
    validatePurchaseLineDraft({
      kind: "EXACT",
      categoryId: match.categoryId,
      sku: match.sku,
      condition: "NM",
      quantity: 1,
      actualPaidCents: 6000,
      recommendedOfferCents: 6000,
      marketReferenceCents: 10000,
      snapshotDate: "2026-07-30T12:00:00.000Z",
    }),
    match,
  );
  ledger.addLine(
    principal,
    event.id,
    validatePurchaseLineDraft({
      kind: "BULK",
      productLines: ["MAGIC", "POKEMON"],
      actualPaidCents: 2000,
      notes: "Two mixed low-value boxes",
      approximateQuantity: 1000,
    }),
  );
  const receipt = ledger.checkout(principal, event.id, "checkout:test-0001");
  assert.equal(receipt.totalCents, 8000);
  assert.equal(receipt.lines.length, 2);
  assert.equal(
    ledger.checkout(principal, event.id, "checkout:test-0001").id,
    receipt.id,
  );
  assert.equal(ledger.listCart(principal, event.id).length, 0);
  assert.ok(
    ledger.voidReceipt(principal, receipt.id, "Corrected by administrator")
      .voidedAt,
  );
  database.close();
});

test("open purchase cart lines edit value and quantity without changing identity", () => {
  const database = new DatabaseSync(":memory:");
  const ledger = new PurchaseLedgerRepository(database);
  const principal = { workspaceId: "workspace", operatorUserId: "employee" };
  const event = ledger.createEvent(principal, {
    name: "Editable Cart Show",
    eventDate: "2026-08-01",
  });
  const exact = ledger.addLine(
    principal,
    event.id,
    validatePurchaseLineDraft({
      kind: "EXACT",
      categoryId: match.categoryId,
      sku: match.sku,
      condition: "NM",
      quantity: 1,
      actualPaidCents: 6000,
      recommendedOfferCents: 6000,
      marketReferenceCents: 10000,
      snapshotDate: "2026-07-30T12:00:00.000Z",
    }),
    match,
  );
  const bulk = ledger.addLine(
    principal,
    event.id,
    validatePurchaseLineDraft({
      kind: "BULK",
      productLines: ["MAGIC", "POKEMON"],
      actualPaidCents: 2000,
      notes: "Mixed collection",
      approximateQuantity: 100,
    }),
  );

  const updatedExact = ledger.updateLine(principal, exact.id, {
    actualPaidCents: 4500,
    quantity: 3,
  });
  assert.equal(updatedExact.kind, "EXACT");
  if (updatedExact.kind === "EXACT") {
    assert.equal(updatedExact.actualPaidCents, 4500);
    assert.equal(updatedExact.quantity, 3);
    assert.equal(updatedExact.sku, match.sku);
    assert.equal(updatedExact.condition, "NM");
    assert.equal(updatedExact.marketReferenceCents, 10000);
  }
  const updatedBulk = ledger.updateLine(principal, bulk.id, {
    actualPaidCents: 2500,
    quantity: null,
  });
  assert.equal(updatedBulk.kind, "BULK");
  if (updatedBulk.kind === "BULK") {
    assert.equal(updatedBulk.actualPaidCents, 2500);
    assert.equal(updatedBulk.approximateQuantity, null);
    assert.deepEqual(updatedBulk.productLines, ["MAGIC", "POKEMON"]);
    assert.equal(updatedBulk.notes, "Mixed collection");
  }
  assert.throws(
    () =>
      ledger.updateLine(principal, exact.id, {
        actualPaidCents: 0,
        quantity: 3,
      }),
    /positive/i,
  );
  assert.throws(
    () =>
      ledger.updateLine(principal, exact.id, {
        actualPaidCents: 4500,
        quantity: 0,
      }),
    /between 1 and 1000/i,
  );
  assert.throws(
    () =>
      ledger.updateLine(
        { workspaceId: "workspace", operatorUserId: "other-employee" },
        exact.id,
        { actualPaidCents: 4500, quantity: 2 },
      ),
    /not found/i,
  );
  assert.equal(ledger.removeLine(principal, bulk.id), true);
  const receipt = ledger.checkout(principal, event.id, "checkout:edited-cart");
  assert.equal(receipt.totalCents, 13_500);
  assert.equal(receipt.lines.length, 1);
  database.close();
});

test("Bulk requires both supported product ownership and notes", () => {
  assert.throws(
    () =>
      validatePurchaseLineDraft({
        kind: "BULK",
        productLines: [],
        actualPaidCents: 10,
        notes: "",
      }),
    /product line/i,
  );
});

test("curated product artwork is integrity checked and bound to exact SKU", async () => {
  const directory = mkdtempSync(join(tmpdir(), "phronesis-curated-"));
  try {
    const store = new CuratedArtworkStore(directory);
    const bytes = Uint8Array.from([
      137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0,
    ]);
    await store.put("pokemon-en", "first-partner-mudkip", bytes, "image/png");
    const stored = await store.get("pokemon-en", "first-partner-mudkip");
    assert.deepEqual(Array.from(stored.bytes), Array.from(bytes));
    assert.equal(stored.metadata.sku, "first-partner-mudkip");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("the manual watch composer and compact cart-adjacent offer are wired into production surfaces", () => {
  const watchlist = readFileSync(
    new URL("../features/watchlist/WatchlistWorkspace.tsx", import.meta.url),
    "utf8",
  );
  const vendor = readFileSync(
    new URL(
      "../features/vendor/components/SnapshotVendorWorkspace.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(watchlist, /CreateWatchlistEntryDialog/);
  const checkout = readFileSync(
    new URL(
      "../features/vendor/components/VendorCheckout.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const purchaseRoute = readFileSync(
    new URL("../app/api/purchases/route.ts", import.meta.url),
    "utf8",
  );
  assert.match(checkout, /Recommended offer/);
  assert.match(checkout, /TCG Low/);
  assert.match(checkout, /TCG Market/);
  assert.match(checkout, /Unit purchase price/);
  assert.match(checkout, /Purchase quantity/);
  assert.match(checkout, /Save changes/);
  assert.match(checkout, /Remove item/);
  assert.match(checkout, /Save every cart change before finalizing/);
  assert.match(purchaseRoute, /body\.action === "update-line"/);
  assert.doesNotMatch(vendor, /OfferFirstSummary/);
  assert.match(vendor, /VendorCheckout/);
  assert.match(vendor, /Owner image override/);
});

test("Settings owns provider health and owner-only encrypted credential registration", () => {
  const settings = readFileSync(
    new URL(
      "../features/settings/components/SettingsControlCenter.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const providers = readFileSync(
    new URL("../components/settings/ProviderConnections.tsx", import.meta.url),
    "utf8",
  );
  const providerHealth = readFileSync(
    new URL("../app/api/market/provider-health/route.ts", import.meta.url),
    "utf8",
  );
  const access = readFileSync(
    new URL("../components/auth/AccessManagement.tsx", import.meta.url),
    "utf8",
  );
  assert.match(settings, /ProviderConnections/);
  assert.match(providers, /provider-health/);
  assert.match(providers, /Regional marketplaces/);
  assert.match(providers, /LigaMagic/);
  assert.match(providers, /LigaPokémon/);
  assert.match(providers, /Refresh status/);
  assert.match(providers, /Credential entry remains locked/);
  assert.match(providers, /type="password"/);
  assert.match(providers, /administration\/provider-credentials/);
  assert.match(providers, /Save securely/);
  assert.ok(providers.indexOf('id: "ligamagic"') < providers.indexOf('id: "ligapokemon"'));
  assert.ok(providers.indexOf('id: "ligapokemon"') < providers.indexOf('id: "justtcg"'));
  assert.ok(providers.indexOf('id: "justtcg"') < providers.indexOf('id: "pricecharting"'));
  assert.ok(providers.indexOf('id: "pricecharting"') < providers.indexOf('id: "ebay-browse"'));
  assert.match(providerHealth, /getLigaProviderHealth/);
  assert.match(providerHealth, /authorizeRequest\(request, "ADMINISTRATION", "VIEW"\)/);
  assert.match(access, /Pending accounts/);
  assert.match(access, /Approve and assign modules/);
  assert.match(access, /Verify this person outside Phronesis/);
  assert.match(access, /PHRONESIS_AUTH_MODE=OPTIONAL/);
});
