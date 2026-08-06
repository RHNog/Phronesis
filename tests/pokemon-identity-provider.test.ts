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

test("TCGdex readiness enumeration follows bounded pagination and normalizes every page", async () => {
  const requestedPages: string[] = [];
  const provider = new TcgdexProvider({
    fetcher: async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith("/sets")) {
        return new Response(JSON.stringify([{ id: "base1", name: "Base Set" }]), { status: 200 });
      }
      const page = url.searchParams.get("pagination:page") ?? "1";
      requestedPages.push(page);
      const records = page === "1"
        ? Array.from({ length: 20_000 }, (_, index) => ({ id: `base1-${index + 1}`, localId: String(index + 1), name: `Card ${index + 1}`, image: `https://assets.tcgdex.net/en/base/base1/${index + 1}` }))
        : [{ id: "base1-20001", localId: "20001", name: "Last Card", image: "https://assets.tcgdex.net/en/base/base1/20001" }];
      return new Response(JSON.stringify(records), { status: 200 });
    },
  });
  const result = await provider.listAllCardsWithDiagnostics();
  assert.deepEqual(requestedPages, ["1", "2"]);
  assert.equal(result.cards.length, 20_001);
  assert.equal(result.cards.at(-1)?.name, "Last Card");
});
