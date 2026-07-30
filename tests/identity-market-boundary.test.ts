import assert from "node:assert/strict";
import test from "node:test";
import { searchIdentityCardsWithDiagnostics } from "@/lib/engines/search/searchIdentityCards";
import {
  createWorkflowCommand,
  type WorkflowCommand,
} from "@/lib/workflow/commands/WorkflowCommand";
import {
  initialVendorWorkflowSnapshot,
  processWorkflowCommand,
} from "@/lib/workflow/VendorWorkflowMachine";
import type { Card } from "@/types/card";

function createPrinting(name: string, set = "Test Set"): Card {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    name,
    game: "Magic",
    set,
    number: "1",
    rarity: "Rare",
    finish: "Nonfoil",
    availableFinishes: ["Nonfoil"],
    finishVariants: [
      {
        id: `${id}:nonfoil`,
        printingId: id,
        finish: "Nonfoil",
        isAvailable: true,
        source: "Scryfall",
      },
    ],
    imageUrl: "https://example.com/card.jpg",
  };
}

const identityCards = [
  createPrinting("Mox Opal", "Double Masters"),
  createPrinting("Chrome Mox", "Mirrodin"),
  createPrinting("Lightning Bolt", "Magic 2011"),
  createPrinting("Lightning Bolt", "Secret Lair"),
  createPrinting("Collected Company", "Dragons of Tarkir"),
  createPrinting("Urza's Saga", "Modern Horizons 2"),
];

const requestedSearches = [
  "Mox Opal",
  "Chrome Mox",
  "Lightning Bolt",
  "Collected Company",
  "Urza's Saga",
];

const scryfallIdentityProvider = {
  id: "scryfall",
  name: "Scryfall",
  async searchCardsWithDiagnostics(query: string) {
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
    const normalized = normalize(query);
    const cards = identityCards.filter(
      (card) => normalize(card.name) === normalized,
    );

    return {
      cacheStatus: "MISS" as const,
      cards,
      durationMs: 1,
      rawResponses: cards,
    };
  },
  async searchCards(query: string) {
    return this.searchCardsWithDiagnostics(query).then((result) => result.cards);
  },
  async getCard(id: string) {
    return identityCards.find((card) => card.id === id) ?? null;
  },
};

function runWorkflow(commands: WorkflowCommand[]) {
  return commands.reduce(
    (snapshot, command) => processWorkflowCommand(snapshot, command).workflow,
    initialVendorWorkflowSnapshot,
  );
}

test("Identity search remains Scryfall-provider based for requested cards", async () => {
  for (const query of requestedSearches) {
    const response = await searchIdentityCardsWithDiagnostics(
      query,
      scryfallIdentityProvider,
    );

    assert.equal(response.diagnostics.providerName, "Scryfall");
    assert.ok(response.results.length > 0, `${query} should return identities.`);
    assert.equal(response.results[0].item.name, query);
  }
});

test("Market context is absent until identity flow selects a printing and variant", () => {
  const searchOnly = runWorkflow([
    createWorkflowCommand("SearchCards", { query: "Chrome Mox" }),
    createWorkflowCommand(
      "LoadSearchResults",
      {
        results: [
          {
            id: "chrome-mox",
            name: "Chrome Mox",
            game: "Magic",
            printings: [
              createPrinting("Chrome Mox", "Mirrodin"),
              {
                ...createPrinting("Chrome Mox", "Double Masters"),
                id: "chrome-mox-double-masters",
                finishVariants: [
                  {
                    id: "chrome-mox-double-masters:nonfoil",
                    printingId: "chrome-mox-double-masters",
                    finish: "Nonfoil",
                    isAvailable: true,
                    source: "Scryfall",
                  },
                ],
              },
            ],
          },
        ],
      },
      "SearchEngine",
    ),
  ]);

  assert.equal(searchOnly.assetContext.printingId, "");
  assert.equal(searchOnly.assetContext.variantId, "");
  assert.equal(searchOnly.assetContext.marketSnapshotId, "");

  const selected = processWorkflowCommand(
    searchOnly,
    createWorkflowCommand("SelectPrinting", {
      identityCount: 1,
      printing: {
        ...createPrinting("Chrome Mox", "Double Masters"),
        id: "chrome-mox-double-masters",
        finishVariants: [
          {
            id: "chrome-mox-double-masters:nonfoil",
            printingId: "chrome-mox-double-masters",
            finish: "Nonfoil",
            isAvailable: true,
            source: "Scryfall",
          },
        ],
      },
      printingCount: 2,
    }),
  ).workflow;

  assert.equal(selected.assetContext.printingId, "chrome-mox-double-masters");
  assert.equal(
    selected.assetContext.variantId,
    "chrome-mox-double-masters:nonfoil",
  );
});
