import type {
  CapabilityStatus,
  GameCapabilityProfile,
  PlatformCapability,
  PlatformCapabilityId,
} from "@/lib/capabilities/PlatformCapability";

const labels: Record<PlatformCapabilityId, string> = {
  artwork: "Artwork",
  condition: "Condition",
  developerDiagnostics: "Developer Diagnostics",
  finish: "Finish",
  treatment: "Treatment",
  physicalVariant: "Printing",
  identity: "Identity",
  inventory: "Inventory",
  marketData: "Market Data",
  marketIntelligence: "Market Intelligence",
  portfolio: "Portfolio",
  printings: "Printings",
  purchaseEvaluation: "Purchase Evaluation",
  watchlists: "Watchlists",
};

function capability(
  id: PlatformCapabilityId,
  status: CapabilityStatus,
  input: Omit<PlatformCapability, "id" | "label" | "status">,
): PlatformCapability {
  return { id, label: labels[id], status, ...input };
}

const sharedOperational = {
  developerDiagnostics: capability("developerDiagnostics", "Operational", {
    reason: "Atlas diagnostics are connected for this workflow.",
    resolution: "Developer diagnostics available.",
    source: "Project Phronesis",
  }),
  watchlists: capability("watchlists", "Operational", {
    reason: "Market Watch membership storage supports this game.",
    resolution: "Watchlist membership available.",
    source: "Market Watch",
  }),
};

const futureCapabilities = [
  capability("portfolio", "Pending", {
    reason: "Portfolio is not implemented in the current platform release.",
    resolution: "Coming Soon",
    source: "Product Roadmap",
  }),
  capability("inventory", "Operational", {
    reason: "Finalized purchase receipts create workspace inventory cost-basis lots.",
    resolution: "Receipt-backed inventory intake operational.",
    source: "Event Purchase Ledger",
  }),
];

const magicProfile: GameCapabilityProfile = {
  game: "Magic",
  capabilities: [
    capability("identity", "Operational", {
      provider: "Scryfall",
      providerSelected: "Scryfall",
      reason: "The Magic identity provider is connected.",
      resolution: "Identity provider operational.",
      source: "Identity Provider Registry",
    }),
    capability("artwork", "Operational", {
      provider: "Scryfall",
      providerSelected: "Scryfall",
      reason: "Canonical identity includes provider artwork.",
      resolution: "Artwork available.",
      source: "Canonical Identity",
    }),
    capability("printings", "Operational", {
      provider: "Scryfall",
      providerSelected: "Scryfall",
      reason: "Individual Magic printings are normalized.",
      resolution: "Printing selection available.",
      source: "Canonical Identity",
    }),
    capability("finish", "Operational", {
      provider: "Scryfall",
      providerSelected: "Scryfall",
      reason: "The identity provider supplies finish variants.",
      resolution: "Finish supplied by provider.",
      source: "Identity Provider Capability",
    }),
    capability("treatment", "Operational", {
      provider: "Scryfall",
      providerSelected: "Scryfall",
      reason:
        "Canonical treatment is resolved from explicit provider finish and printing metadata.",
      resolution: "Treatment operational.",
      source: "Canonical Identity",
    }),
    capability("physicalVariant", "Operational", {
      provider: "Scryfall",
      providerSelected: "Scryfall",
      reason:
        "Scryfall explicitly supplies physical finish availability for Magic printings.",
      resolution: "Printing options operational.",
      source: "Physical Variant Identity",
    }),
    capability("condition", "Operational", {
      reason: "Condition is selected by the user for physical cards.",
      resolution: "Condition selection available.",
      source: "Workflow",
    }),
    capability("marketData", "Operational", {
      provider: "JustTCG / Repository",
      providerSelected: "Repository First",
      reason: "Compatible Magic market evidence providers are registered.",
      resolution: "Repository-first market acquisition available.",
      source: "Market Ontology",
    }),
    capability("marketIntelligence", "Operational", {
      provider: "Market Intelligence Engine",
      reason: "Market observations can be interpreted for Magic.",
      resolution: "Market Intelligence available.",
      source: "Market Intelligence",
    }),
    ...futureCapabilities,
    sharedOperational.watchlists,
    capability("purchaseEvaluation", "Operational", {
      reason: "Identity and compatible market evidence are available.",
      resolution: "Purchase Evaluation available.",
      source: "Vendor Workflow",
    }),
    sharedOperational.developerDiagnostics,
  ],
};

const lorcanaProfile: GameCapabilityProfile = {
  game: "Lorcana",
  capabilities: [
    capability("identity", "Operational", {
      provider: "Lorcast",
      providerSelected: "Lorcast",
      reason:
        "Lorcast is registered as the operational Lorcana identity provider.",
      resolution: "Identity provider operational.",
      source: "Identity Provider Registry",
    }),
    capability("artwork", "Operational", {
      provider: "Lorcast",
      providerSelected: "Lorcast",
      reason: "Lorcast canonical identities include artwork URIs.",
      resolution: "Artwork available.",
      source: "Canonical Identity",
    }),
    capability("printings", "Operational", {
      provider: "Lorcast",
      providerSelected: "Lorcast",
      reason: "Lorcast all-print identity search is operational.",
      resolution: "Printing selection available.",
      source: "Canonical Identity",
    }),
    capability("finish", "Unavailable", {
      provider: "Lorcast",
      providerSelected: "Lorcast",
      reason:
        "The connected identity provider does not supply finish availability.",
      resolution: "Provider Does Not Supply Printing",
      source: "Identity Provider Capability",
    }),
    capability("treatment", "Operational", {
      provider: "Lorcast",
      providerSelected: "Lorcast",
      reason:
        "Lorcast rarity supplies printing design facets such as Enchanted and Promo.",
      resolution: "Printing design operational.",
      source: "Printing Identity",
    }),
    capability("physicalVariant", "Unavailable", {
      provider: "Lorcast",
      providerSelected: "Lorcast",
      reason: "Lorcast does not explicitly supply finish availability.",
      resolution: "Provider Does Not Supply Finish",
      source: "Physical Variant Identity",
    }),
    capability("condition", "Operational", {
      reason: "Condition is selected by the user for a physical card.",
      resolution: "Condition selection available.",
      source: "Workflow",
    }),
    capability("marketData", "Operational", {
      provider: "TCGplayer Catalogue Snapshot / Repository",
      providerSelected: "Verified Catalogue Snapshot",
      reason:
        "Verified Lorcana catalogue snapshots supply condition-level market and delivered-low observations.",
      resolution: "Four-daily repository pricing available.",
      source: "Pricing Snapshot Repository",
    }),
    capability("marketIntelligence", "Pending", {
      futureProvider: "Compatible Lorcana Market Provider",
      reason: "Market Intelligence requires compatible market observations.",
      resolution: "Market Data Coming Soon",
      source: "Market Intelligence Capability",
    }),
    ...futureCapabilities,
    sharedOperational.watchlists,
    capability("purchaseEvaluation", "Pending", {
      futureProvider: "Compatible Lorcana Market Provider",
      reason: "Purchase Evaluation requires compatible market evidence.",
      resolution: "Market Data Coming Soon",
      source: "Vendor Workflow Capability",
    }),
    sharedOperational.developerDiagnostics,
  ],
};

const pendingIdentityProfile = (game: string): GameCapabilityProfile => ({
  game,
  capabilities: (Object.keys(labels) as PlatformCapabilityId[]).map((id) =>
    capability(
      id,
      id === "watchlists" ||
        id === "developerDiagnostics" ||
        id === "marketData"
        ? "Operational"
        : "Pending",
      {
        futureProvider:
          id === "identity"
            ? `Compatible ${game} Identity Provider`
            : undefined,
        reason:
          id === "watchlists"
            ? "Watchlist membership can retain a canonical identity when available."
            : id === "marketData"
              ? `Verified ${game} catalogue snapshots supply condition-level repository prices.`
              : id === "developerDiagnostics"
                ? "Developer diagnostics are platform-owned."
                : `${labels[id]} is not yet connected for ${game}.`,
        resolution:
          id === "watchlists" || id === "developerDiagnostics"
            ? "Operational"
            : id === "marketData"
              ? "Four-daily repository pricing available."
              : "Coming Soon",
        source:
          id === "identity"
            ? "Identity Provider Registry"
            : id === "marketData"
              ? "Pricing Snapshot Repository"
              : "Platform Capability Registry",
        provider:
          id === "marketData"
            ? "TCGplayer Catalogue Snapshot / Repository"
            : undefined,
        providerSelected:
          id === "marketData" ? "Verified Catalogue Snapshot" : undefined,
      },
    ),
  ),
});

export const platformCapabilityProfiles: GameCapabilityProfile[] = [
  magicProfile,
  lorcanaProfile,
  pendingIdentityProfile("Pokemon"),
  pendingIdentityProfile("One Piece"),
  pendingIdentityProfile("Flesh and Blood"),
];
