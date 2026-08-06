import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { PricingRepository } from "../lib/pricing/repository";
import {
  PKMNPRICES_DAILY_SEALED_BUDGET,
  PkmnPricesSealedClient,
  PkmnPricesSealedRepository,
  PkmnPricesSealedSync,
  PokemonReleaseSource,
  parsePokemonReleaseManifest,
  type PokemonRelease,
} from "../lib/providers/pkmnprices/PkmnPricesSealed";

const releases: PokemonRelease[] = [
  { id: "new", name: "Newest Set", releaseDate: "2026-07-31" },
  { id: "old", name: "Older Set", releaseDate: "2025-01-01" },
];

function releaseSource(items = releases) {
  return new PokemonReleaseSource(async () =>
    Response.json(
      items.map((release) => ({
        id: release.id,
        name: release.name,
        releaseDate: release.releaseDate.replaceAll("-", "/"),
      })),
    ),
  );
}

function product(id: number, setName: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    tcg_player_id: id + 10_000,
    name: `${setName} Product ${id}`,
    image_url: `https://images.pkmnprices.com/sealed/${id}.jpg`,
    set: { id: id + 100, name: setName },
    ...overrides,
  };
}

test("release metadata is strict and newest-first", () => {
  const parsed = parsePokemonReleaseManifest([
    { id: "base", name: "Base", releaseDate: "1999/01/09" },
    { id: "future", name: "Future", releaseDate: "2026/09/01" },
    { id: "invalid", name: "Invalid", releaseDate: "tomorrow" },
  ]);
  assert.deepEqual(parsed.map((release) => release.id), ["future", "base"]);
});

test("sealed sync spends exactly 100 credits only on the newest unfinished release", async () => {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE pricing_products(category_id TEXT, sku TEXT, product_type TEXT, name TEXT, set_name TEXT, collector_number TEXT, variant TEXT, language TEXT, image_url TEXT, PRIMARY KEY(category_id, sku));
    CREATE TABLE pricing_latest(category_id TEXT, sku TEXT, condition_key TEXT, source_sku TEXT);
    CREATE TABLE pricing_artwork_resolutions(category_id TEXT, sku TEXT, identity_key TEXT, provider_id TEXT, image_urls_json TEXT, verified_at TEXT, PRIMARY KEY(category_id, sku));
  `);
  const requested: string[] = [];
  const client = new PkmnPricesSealedClient("secret", async (input) => {
    const url = new URL(String(input));
    requested.push(url.searchParams.get("name") ?? "");
    const count = Number(url.searchParams.get("per_page"));
    return Response.json(
      {
        data: Array.from({ length: count }, (_, index) => product(index + 1, "Newest Set")),
        pagination: { page: 1, per_page: count, total: count, total_pages: 1 },
      },
      { headers: { "x-credits-charged": String(count), "x-credits-limit": "100" } },
    );
  });
  const repository = new PkmnPricesSealedRepository(database);
  const summary = await new PkmnPricesSealedSync(
    repository,
    releaseSource(),
    client,
    { now: () => new Date("2026-08-01T12:00:00Z"), pause: async () => undefined },
  ).run();
  assert.deepEqual(requested, ["Newest Set"]);
  assert.equal(summary.creditsUsed, PKMNPRICES_DAILY_SEALED_BUDGET);
  assert.equal(summary.productsStored, 100);
  assert.equal(summary.status, "BUDGET_EXHAUSTED");
  database.close();
});

test("completed recent releases advance to older releases and zero results still consume one credit", async () => {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE pricing_products(category_id TEXT, sku TEXT, product_type TEXT, name TEXT, set_name TEXT, collector_number TEXT, variant TEXT, language TEXT, image_url TEXT, PRIMARY KEY(category_id, sku));
    CREATE TABLE pricing_latest(category_id TEXT, sku TEXT, condition_key TEXT, source_sku TEXT);
    CREATE TABLE pricing_artwork_resolutions(category_id TEXT, sku TEXT, identity_key TEXT, provider_id TEXT, image_urls_json TEXT, verified_at TEXT, PRIMARY KEY(category_id, sku));
  `);
  const requested: string[] = [];
  const client = new PkmnPricesSealedClient("secret", async (input) => {
    const url = new URL(String(input));
    const name = url.searchParams.get("name") ?? "";
    requested.push(name);
    const remaining = Number(url.searchParams.get("per_page"));
    const data = name === "Newest Set" ? [] : Array.from({ length: remaining }, (_, index) => product(index + 1, "Older Set"));
    return Response.json(
      { data, pagination: { page: 1, per_page: remaining, total: data.length, total_pages: data.length ? 1 : 0 } },
      { headers: { "x-credits-charged": String(Math.max(1, data.length)) } },
    );
  });
  const repository = new PkmnPricesSealedRepository(database);
  const summary = await new PkmnPricesSealedSync(repository, releaseSource(), client, {
    now: () => new Date("2026-08-01T12:00:00Z"),
    pause: async () => undefined,
  }).run();
  assert.deepEqual(requested, ["Newest Set", "Older Set"]);
  assert.equal(summary.creditsUsed, 100);
  assert.equal(summary.productsStored, 99);
  database.close();
});

test("exact TCGplayer identity stores a sealed artwork resolution", () => {
  const pricing = new PricingRepository();
  pricing.database.prepare(`
    INSERT INTO pricing_products(category_id, sku, product_type, name, set_name, collector_number, variant, language, image_url)
    VALUES('pokemon-en', 'local-box', 'SEALED', 'Newest Set Booster Box', 'Newest Set', NULL, 'Sealed', 'English', NULL)
  `).run();
  pricing.database.prepare(`
    INSERT INTO pricing_latest(category_id, sku, condition_key, market_price_cents, listing_price_cents, shipping_cents, shipping_source, delivered_price_cents, snapshot_date, source_sku)
    VALUES('pokemon-en', 'local-box', 'NO_CONDITION', NULL, NULL, NULL, 'UNKNOWN', NULL, '2026-08-01', '45123')
  `).run();
  const repository = new PkmnPricesSealedRepository(pricing.database);
  repository.recordPage({
    release: releases[0],
    now: new Date("2026-08-01T12:00:00Z"),
    page: {
      page: 1,
      totalPages: 1,
      creditsCharged: 1,
      providerCreditLimit: 100,
      products: [{
        id: 5,
        tcgPlayerId: 45123,
        name: "Newest Set Booster Box",
        imageUrl: "https://images.pkmnprices.com/sealed/5.jpg",
        set: { id: 50, name: "Newest Set" },
      }],
    },
  });
  const match = pricing.findBySku("pokemon-en", "local-box");
  assert.ok(match);
  assert.equal(pricing.getArtworkResolutions([match])[match.sku].small, "https://images.pkmnprices.com/sealed/5.jpg");
  const stored = pricing.database.prepare("SELECT match_method FROM pkmnprices_sealed_product WHERE provider_product_id=5").get() as { match_method: string };
  assert.equal(stored.match_method, "TCGPLAYER_ID");
  pricing.close();
});

test("plan denial is explicit and consumes no local budget", async () => {
  const database = new DatabaseSync(":memory:");
  database.exec(`
    CREATE TABLE pricing_products(category_id TEXT, sku TEXT, product_type TEXT, name TEXT, set_name TEXT, collector_number TEXT, variant TEXT, language TEXT, image_url TEXT, PRIMARY KEY(category_id, sku));
    CREATE TABLE pricing_latest(category_id TEXT, sku TEXT, condition_key TEXT, source_sku TEXT);
    CREATE TABLE pricing_artwork_resolutions(category_id TEXT, sku TEXT, identity_key TEXT, provider_id TEXT, image_urls_json TEXT, verified_at TEXT, PRIMARY KEY(category_id, sku));
  `);
  const client = new PkmnPricesSealedClient("free-plan", async () =>
    Response.json({ error: { code: "forbidden", message: "Pro required" } }, { status: 403 }),
  );
  const repository = new PkmnPricesSealedRepository(database);
  const summary = await new PkmnPricesSealedSync(repository, releaseSource(), client, {
    now: () => new Date("2026-08-01T12:00:00Z"),
  }).run();
  assert.equal(summary.status, "ACCESS_REQUIRED");
  assert.equal(summary.creditsUsed, 0);
  assert.match(summary.lastError ?? "", /does not permit sealed access/);
  database.close();
});
