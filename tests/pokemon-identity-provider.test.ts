import assert from "node:assert/strict";
import test from "node:test";
import { TcgdexProvider } from "../lib/providers/tcgdex/TcgdexProvider";

test("TCGdex provider normalizes Pokémon artwork and reuses card and set caches", async () => {
  let calls = 0;
  let requestUrl = "";
  const provider = new TcgdexProvider({
    now: () => 10_000,
    fetcher: async (input) => {
      calls += 1;
      requestUrl = String(input);
      const payload = requestUrl.includes("/sets")
        ? [{ id: "base1", name: "Base Set" }]
        : [{ id: "base1-4", localId: "4", name: "Charizard", image: "https://assets.tcgdex.net/en/base/base1/4" }];
      return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });

  const first = await provider.searchCardsWithDiagnostics("Charizard");
  const second = await provider.searchCardsWithDiagnostics("Charizard");
  assert.equal(calls, 2);
  assert.equal(first.cards[0].game, "Pokemon");
  assert.equal(first.cards[0].imageUrls?.small, "https://assets.tcgdex.net/en/base/base1/4/low.webp");
  assert.equal(second.cards[0].id, "base1-4");
  assert.match(requestUrl, /name=Charizard/);
});

test("Pokémon TCG provider rejects malformed queries before network access", async () => {
  let called = false;
  const provider = new TcgdexProvider({
    fetcher: async () => {
      called = true;
      return new Response("{}");
    },
  });
  const result = await provider.searchCardsWithDiagnostics("");
  assert.equal(result.errorKind, "MALFORMED_QUERY");
  assert.equal(called, false);
});
