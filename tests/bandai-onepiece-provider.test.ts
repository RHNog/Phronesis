import assert from "node:assert/strict";
import test from "node:test";
import { BandaiOnePieceProvider, parseBandaiOnePieceCards } from "../lib/providers/bandai/BandaiOnePieceProvider.ts";

const fixture = `
<dl class="modalCol" id="OP01-003">
  <div class="infoCol"><span>OP01-003</span> | <span>L</span> | <span>LEADER</span></div>
  <div class="cardName">Monkey.D.Luffy</div>
  <img class="lazy" data-src="../images/cardlist/card/OP01-003.png?260715" alt="Monkey.D.Luffy">
  <div class="getInfo"><h3>Card Set(s)</h3>-ROMANCE DAWN- [OP01]</div>
</dl>
<dl class="modalCol" id="OP01-003_p1">
  <div class="infoCol"><span>OP01-003</span> | <span>L</span> | <span>LEADER</span></div>
  <div class="cardName">Monkey.D.Luffy</div>
  <img class="lazy" data-src="../images/cardlist/card/OP01-003_p1.png?260715" alt="Monkey.D.Luffy">
  <div class="getInfo"><h3>Card Set(s)</h3>-ROMANCE DAWN- [OP01]</div>
</dl>
<dl class="modalCol" id="EB03-003_p2">
  <div class="infoCol"><span>EB03-003</span> | <span>SP CARD</span> | <span>CHARACTER</span></div>
  <div class="cardName">Uta</div>
  <img class="lazy" data-src="../images/cardlist/card/EB03-003_p2.png?260715" alt="Uta">
  <div class="getInfo"><h3>Card Set(s)</h3>-ONE PIECE HEROINES EDITION- [EB-03]</div>
</dl>`;

test("Bandai parser preserves official base, parallel, and SP artwork identities", () => {
  const records = parseBandaiOnePieceCards(fixture);
  assert.deepEqual(records.map((record) => record.assetId), ["OP01-003", "OP01-003_p1", "EB03-003_p2"]);
  assert.equal(records[0].imageUrl, "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png?260715");
  assert.equal(records[2].rarity, "SP CARD");
});

test("Bandai provider searches once, normalizes records, and reuses its query cache", async () => {
  let calls = 0;
  let requestBody = "";
  const provider = new BandaiOnePieceProvider({
    now: () => 10_000,
    fetcher: async (_input, init) => {
      calls += 1;
      requestBody = String(init?.body);
      return new Response(fixture, { status: 200, headers: { "Content-Type": "text/html" } });
    },
  });
  const first = await provider.searchCardsWithDiagnostics("Monkey.D.Luffy");
  const second = await provider.searchCardsWithDiagnostics("Monkey.D.Luffy");
  assert.equal(calls, 1);
  assert.match(requestBody, /freewords=Monkey.D.Luffy/);
  assert.equal(first.cards[0].game, "One Piece");
  assert.equal(first.cards[0].setCode, "OP01");
  assert.equal(first.cards[1].providerIdentity?.providerRecordId, "OP01-003_p1");
  assert.equal(second.cards.length, 3);
});

test("Bandai provider rejects malformed queries before network access", async () => {
  let called = false;
  const provider = new BandaiOnePieceProvider({ fetcher: async () => { called = true; return new Response(fixture); } });
  const result = await provider.searchCardsWithDiagnostics("");
  assert.equal(result.errorKind, "MALFORMED_QUERY");
  assert.equal(called, false);
});
