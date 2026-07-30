import assert from "node:assert/strict";
import test from "node:test";
import { CanonicalCardIdentityAdapter } from "../lib/engines/identity/IdentityProviderAdapter.ts";
import { IdentityOrchestrator, createIdentityProviderRegistry } from "../lib/engines/identity/IdentityOrchestrator.ts";
import { IdentityProviderRegistry } from "../lib/engines/identity/IdentityProviderRegistry.ts";
import { selectIdentityProvider } from "../lib/engines/identity/IdentityProviderSelection.ts";
import type { IdentityProvider } from "../lib/engines/identity/IdentityProvider.ts";

test("registers four operational games with Flesh and Blood pending", () => {
  const matrix = createIdentityProviderRegistry().getCapabilityMatrix();
  assert.deepEqual(
    matrix.map((item) => [item.games[0], item.lifecycle]),
    [
      ["Magic", "OPERATIONAL"],
      ["Lorcana", "OPERATIONAL"],
      ["Pokemon", "OPERATIONAL"],
      ["One Piece", "OPERATIONAL"],
      ["Flesh and Blood", "PENDING_CONNECTION"],
    ],
  );
});

test("recognizes Mulan as Lorcana and selects Lorcast", () => {
  const selection = selectIdentityProvider(createIdentityProviderRegistry(), { query: "Mulan" });
  assert.equal(selection.game, "Lorcana");
  assert.equal(selection.provider?.name, "Lorcast");
  assert.equal(selection.provider?.capability.lifecycle, "OPERATIONAL");
});

test("reports the remaining known pending game distinctly", async () => {
  const orchestrator = new IdentityOrchestrator(createIdentityProviderRegistry());
  for (const [query, provider] of [
    ["Flesh and Blood Command and Conquer", "Flesh and Blood"],
  ]) {
    const result = await orchestrator.search(query);
    assert.equal(result.status, "PROVIDER_PENDING");
    assert.equal(result.orchestrationDiagnostics.providerSelected, provider);
  }
});

test("selects the official Bandai provider for One Piece", () => {
  const selection = selectIdentityProvider(createIdentityProviderRegistry(), { query: "One Piece Luffy" });
  assert.equal(selection.game, "One Piece");
  assert.equal(selection.provider?.name, "Bandai One Piece Card List");
  assert.equal(selection.provider?.capability.lifecycle, "OPERATIONAL");
});

test("normalizes operational provider output into canonical identity", async () => {
  const provider: IdentityProvider = {
    adapter: new CanonicalCardIdentityAdapter("FixtureAdapter", "fixture-magic"),
    capability: {
      artwork: true,
      conditions: false,
      finishes: true,
      games: ["Magic"],
      languages: true,
      lifecycle: "OPERATIONAL",
      printings: true,
    },
    getCard: async () => null,
    id: "fixture-magic",
    name: "Fixture Magic",
    searchCards: async () => [{
      finish: "Nonfoil",
      game: "Magic",
      id: "mox-opal-som-179",
      imageUrl: "https://example.test/mox-opal.jpg",
      name: "Mox Opal",
      number: "179",
      rarity: "Mythic",
      set: "Scars of Mirrodin",
    }],
  };
  const registry = new IdentityProviderRegistry().register(provider);
  const result = await new IdentityOrchestrator(registry).search("Mox Opal");
  assert.equal(result.status, "OPERATIONAL");
  assert.equal(result.results[0].item.providerIdentity.providerId, "fixture-magic");
  assert.equal(result.results[0].item.canonicalIdentity, "gameplay:magic:mox-opal");
  assert.equal(result.results[0].item.ontologyVersion, "PHR-ARCH-007");
  assert.equal(result.results[0].item.printings[0].number, "179");
  assert.equal(result.results[0].item.artwork?.normal, "https://example.test/mox-opal.jpg");
});

test("classifies an operational provider exception as temporarily offline", async () => {
  const provider: IdentityProvider = {
    adapter: new CanonicalCardIdentityAdapter("OfflineAdapter", "offline"),
    capability: {
      artwork: false,
      conditions: false,
      finishes: false,
      games: ["Magic"],
      languages: false,
      lifecycle: "OPERATIONAL",
      printings: false,
    },
    getCard: async () => null,
    id: "offline",
    name: "Offline",
    searchCards: async () => { throw new Error("offline"); },
  };
  const result = await new IdentityOrchestrator(
    new IdentityProviderRegistry().register(provider),
  ).search("Mox Opal");
  assert.equal(result.status, "PROVIDER_OFFLINE");
  assert.equal(result.orchestrationDiagnostics.lifecycle, "TEMPORARILY_OFFLINE");
});
