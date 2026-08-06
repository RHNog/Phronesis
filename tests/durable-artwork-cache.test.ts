import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DurableArtworkCache, durableArtworkUrl, isApprovedArtworkSource } from "../lib/artwork/DurableArtworkCache.ts";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
const avif = new Uint8Array([
  0, 0, 0, 24,
  102, 116, 121, 112,
  97, 118, 105, 102,
  0, 0, 0, 0,
  97, 118, 105, 102,
  109, 105, 102, 49,
]);

test("durable artwork cache writes an approved raster once and serves local bytes thereafter", async () => {
  const root = await mkdtemp(join(tmpdir(), "phronesis-artwork-"));
  let calls = 0;
  let requestHeaders: Headers | undefined;
  try {
    const createCache = () => new DurableArtworkCache({
      root,
      now: () => new Date("2026-07-29T23:00:00-04:00"),
      fetcher: async (_input, init) => {
        calls += 1;
        requestHeaders = new Headers(init?.headers);
        return new Response(png, { status: 200, headers: { "Content-Type": "image/png" } });
      },
    });
    const source = "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png?260715";
    const first = await createCache().get(source);
    const second = await createCache().get(source);
    assert.equal(calls, 1);
    assert.equal(requestHeaders?.get("user-agent"), "Phronesis/0.1 (durable artwork cache)");
    assert.match(requestHeaders?.get("accept") ?? "", /image\/jpeg/);
    assert.deepEqual([...second.bytes], [...first.bytes]);
    assert.equal(first.metadata.authorization, "PRODUCT_OWNER_ATTESTED_BANDAI");
    const metadataFiles = (await import("node:fs/promises")).readdir(root, { recursive: true });
    assert.ok((await metadataFiles).some((path) => String(path).endsWith(".json")));
    assert.equal(JSON.parse(await readFile(join(root, first.metadata.sourceUrlSha256.slice(0, 2), `${first.metadata.sourceUrlSha256}.json`), "utf8")).sourceHost, "en.onepiece-cardgame.com");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("durable artwork cache rejects unapproved sources and invalid content", async () => {
  const root = await mkdtemp(join(tmpdir(), "phronesis-artwork-"));
  try {
    assert.equal(isApprovedArtworkSource("https://example.com/card.png"), false);
    assert.equal(durableArtworkUrl("https://example.com/card.png"), "https://example.com/card.png");
    const cache = new DurableArtworkCache({
      root,
      fetcher: async () => new Response("<html>not an image</html>", { headers: { "Content-Type": "text/html" } }),
    });
    await assert.rejects(() => cache.get("https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png"));
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("durable artwork cache validates and retains Lorcast AVIF images", async () => {
  const root = await mkdtemp(join(tmpdir(), "phronesis-artwork-"));
  try {
    const cache = new DurableArtworkCache({
      root,
      fetcher: async () => new Response(avif, {
        status: 200,
        headers: { "Content-Type": "image/avif" },
      }),
    });
    const result = await cache.get(
      "https://cards.lorcast.io/card/digital/small/crd_46402c967ba24a1ca2ea62cb69f3b243.avif?1761752035",
    );
    assert.equal(result.metadata.authorization, "PROVIDER_API");
    assert.equal(result.metadata.contentType, "image/avif");
    assert.equal(result.metadata.sourceHost, "cards.lorcast.io");
    assert.deepEqual([...result.bytes], [...avif]);

    const invalid = new DurableArtworkCache({
      root: join(root, "invalid"),
      fetcher: async () => new Response(new Uint8Array(24), {
        status: 200,
        headers: { "Content-Type": "image/avif" },
      }),
    });
    await assert.rejects(() => invalid.get(
      "https://cards.lorcast.io/card/digital/small/invalid.avif",
    ));
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("community artwork allowlist accepts only exact Pokémon catalogue and pinned repository paths", () => {
  assert.equal(isApprovedArtworkSource("https://images.pokemontcg.io/base1/4_hires.png"), true);
  assert.equal(isApprovedArtworkSource("https://images.scrydex.com/pokemon/me3-1/large"), true);
  assert.equal(isApprovedArtworkSource(
    `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${"a".repeat(40)}/base1/display.png`,
  ), true);
  assert.equal(isApprovedArtworkSource("https://raw.githubusercontent.com/1niceroli/ptcg-assets/main/base1/display.png"), false);
  assert.equal(isApprovedArtworkSource("https://images.scrydex.com/magic/card/large"), false);
});

test("community cache signature-checks GitHub raster bytes sent as generic binary", async () => {
  const root = await mkdtemp(join(tmpdir(), "phronesis-artwork-"));
  try {
    const cache = new DurableArtworkCache({
      root,
      fetcher: async () => new Response(png, {
        status: 200,
        headers: { "Content-Type": "application/octet-stream" },
      }),
    });
    const result = await cache.get(
      `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${"a".repeat(40)}/base1/display.png`,
    );
    assert.equal(result.metadata.authorization, "COMMUNITY_CATALOGUE");
    assert.equal(result.metadata.contentType, "image/png");
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});
