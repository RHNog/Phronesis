import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { MarketIntelligenceEngine } from "@/lib/market/intelligence/MarketIntelligenceEngine";
import { JustTCGAdapter } from "@/lib/providers/justtcg/JustTCGAdapter";
import type { JustTCGRawCardResponse } from "@/lib/providers/justtcg/JustTCGNormalizer";

const replayCards = [
  "Mox Opal",
  "Chrome Mox",
  "Lightning Bolt",
  "Black Lotus",
  "Collected Company",
  "Urza's Saga",
];

const fixturePaths: Record<string, string> = {
  "Mox Opal": "mox-opal/6be9b1d5-9ab8-4adb-ba54-2c0117e842fa/normal/nm/english.json",
  "Chrome Mox": "chrome-mox.json",
  "Lightning Bolt": "lightning-bolt.json",
  "Black Lotus": "black-lotus.json",
  "Collected Company": "collected-company.json",
  "Urza's Saga": "urzas-saga.json",
};

function createProfileFromReplay(cardName: string) {
  const fixturePath = path.join(
    process.cwd(),
    "fixtures/providers/justtcg/magic",
    fixturePaths[cardName],
  );
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
    metadata: { recordedFrom: string };
    raw: JustTCGRawCardResponse;
  };
  const adapter = new JustTCGAdapter();

  assert.equal(fixture.metadata.recordedFrom, "MANUAL_FIXTURE", cardName);
  assert.deepEqual(adapter.validate(fixture.raw), [], cardName);

  return new MarketIntelligenceEngine().analyzeJustTCGNormalizedResponse(
    adapter.normalize(fixture.raw, { cardName }),
  );
}

test("Market Intelligence Engine generates replay-only profiles for certified fixtures", async () => {

  for (const cardName of replayCards) {
    const profile = createProfileFromReplay(cardName);

    assert.ok(profile.signals.length >= 2, cardName);
    assert.ok(profile.reasoning.length >= 3, cardName);
    assert.notEqual(profile.marketHealth, "Distressed", cardName);
    assert.notEqual(profile.confidence.label, "Very Low", cardName);
  }
});

test("Market Intelligence signals and reasoning differ by replayed observation", async () => {
  const profiles = new Map<string, ReturnType<MarketIntelligenceEngine["analyzeRepositorySnapshot"]>>();

  for (const cardName of replayCards) {
    profiles.set(cardName, createProfileFromReplay(cardName));
  }

  const moxOpal = profiles.get("Mox Opal");
  const collectedCompany = profiles.get("Collected Company");
  const lightningBolt = profiles.get("Lightning Bolt");
  const blackLotus = profiles.get("Black Lotus");

  assert.ok(moxOpal);
  assert.ok(collectedCompany);
  assert.ok(lightningBolt);
  assert.ok(blackLotus);
  assert.notEqual(
    moxOpal.observationSummary.currentPrice,
    collectedCompany.observationSummary.currentPrice,
  );
  assert.notDeepEqual(
    moxOpal.signals.map((signal) => signal.id),
    collectedCompany.signals.map((signal) => signal.id),
  );
  assert.notEqual(
    lightningBolt.reasoning.join(" "),
    blackLotus.reasoning.join(" "),
  );
});
