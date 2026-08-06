import assert from "node:assert/strict";
import test from "node:test";
import {
  canUseCapability,
  resolveCapability,
  resolveFinishDisplay,
} from "../lib/capabilities/PlatformCapabilityResolver.ts";

test("Magic identity and market are operational", () => {
  assert.equal(resolveCapability("Magic", "identity").status, "Operational");
  assert.equal(resolveCapability("Magic", "marketData").status, "Operational");
  assert.equal(canUseCapability("magic", "marketData"), true);
});

test("Lorcana identity and verified snapshot market data are operational", () => {
  assert.equal(
    resolveCapability("Lorcana", "identity").providerSelected,
    "Lorcast",
  );
  assert.equal(resolveCapability("Lorcana", "artwork").status, "Operational");
  assert.equal(
    resolveCapability("Lorcana", "marketData").status,
    "Operational",
  );
  assert.equal(canUseCapability("lorcana", "marketData"), true);
});

test("Pokémon and One Piece use verified snapshot market data", () => {
  assert.equal(canUseCapability("Pokemon", "marketData"), true);
  assert.equal(canUseCapability("One Piece", "marketData"), true);
});

test("unknown physical finish uses the collector-facing Printing vocabulary", () => {
  assert.equal(
    resolveFinishDisplay("Lorcana", ["Unknown"]),
    "Provider Does Not Supply Printing",
  );
  assert.equal(
    resolveFinishDisplay("Magic", ["Foil", "Nonfoil"]),
    "Foil, Nonfoil",
  );
});
