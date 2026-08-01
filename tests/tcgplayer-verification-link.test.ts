import assert from "node:assert/strict";
import test from "node:test";
import {
  tcgplayerVerificationQuery,
  tcgplayerVerificationUrl,
} from "../lib/pricing/tcgplayerVerification.ts";

test("TCGplayer verification search preserves exact visible card context", () => {
  const identity = {
    name: "Monkey.D.Luffy (022) (Alternate Art)",
    collectorNumber: "OP16-022",
    setName: "The Time of Battle",
  };
  assert.equal(
    tcgplayerVerificationQuery(identity),
    "Monkey.D.Luffy (022) (Alternate Art) OP16-022 The Time of Battle",
  );
  const url = new URL(tcgplayerVerificationUrl(identity));
  assert.equal(url.origin, "https://www.tcgplayer.com");
  assert.equal(url.pathname, "/search/all/product");
  assert.equal(url.searchParams.get("q"), tcgplayerVerificationQuery(identity));
  assert.equal(url.searchParams.get("view"), "grid");
});

test("TCGplayer verification omits missing fields without leaking sentinels", () => {
  const url = tcgplayerVerificationUrl({
    name: "Opus XIII: Crystal Radiance Booster Pack",
    collectorNumber: null,
    setName: "Opus XIII: Crystal Radiance",
  });
  assert.doesNotMatch(url, /null|undefined/);
  assert.equal(
    new URL(url).searchParams.get("q"),
    "Opus XIII: Crystal Radiance Booster Pack Opus XIII: Crystal Radiance",
  );
});

test("TCGplayer verification safely encodes punctuation, slashes, and Unicode", () => {
  const url = tcgplayerVerificationUrl({
    name: "Farfetch’d & Pikachu ex",
    collectorNumber: "025/182",
    setName: "Destined Rivals",
  });
  const parsed = new URL(url);
  assert.equal(
    parsed.searchParams.get("q"),
    "Farfetch’d & Pikachu ex 025/182 Destined Rivals",
  );
  assert.equal(parsed.hash, "");
});
