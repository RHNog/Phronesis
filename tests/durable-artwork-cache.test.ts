import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DurableArtworkCache, durableArtworkUrl, isApprovedArtworkSource } from "../lib/artwork/DurableArtworkCache.ts";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);

test("durable artwork cache writes an approved raster once and serves local bytes thereafter", async () => {
  const root = await mkdtemp(join(tmpdir(), "phronesis-artwork-"));
  let calls = 0;
  try {
    const createCache = () => new DurableArtworkCache({
      root,
      now: () => new Date("2026-07-29T23:00:00-04:00"),
      fetcher: async () => {
        calls += 1;
        return new Response(png, { status: 200, headers: { "Content-Type": "image/png" } });
      },
    });
    const source = "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png?260715";
    const first = await createCache().get(source);
    const second = await createCache().get(source);
    assert.equal(calls, 1);
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
