import {
  calculateWatchlistMetrics,
  type WatchlistDeveloperDiagnostics,
  type WatchlistEntry,
} from "@/features/watchlist/WatchlistRefreshEngine";
import { treatmentFromFinish } from "@/lib/engines/identity/IdentityTreatmentResolver";
import { explicitEvidence } from "@/lib/engines/identity/IdentityOntology";

function legacyPhysicalFinish(finish: string) {
  const value =
    finish.toLowerCase() === "normal" || finish.toLowerCase() === "nonfoil"
      ? "Normal"
      : finish.replace(/\b\w/g, (character) => character.toUpperCase());
  return {
    evidence: explicitEvidence(
      "watchlist-migration",
      "legacy finish",
      "Migrated from an existing watchlist finish selection without changing membership.",
      90,
    ),
    value,
  };
}

function migratePhysicalFinish(entry: WatchlistEntry) {
  return entry.physicalFinish ?? legacyPhysicalFinish(entry.finish);
}

const storageKey = "project-phronesis-market-watch-v1";
export const defaultWatchlistId = "default";

export function readPersistedWatchlistEntries(): WatchlistEntry[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return hydrateWatchlistEntries(JSON.parse(raw) as WatchlistEntry[]);
  } catch {
    return null;
  }
}

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function createSeedDiagnostics(hours: number): WatchlistDeveloperDiagnostics {
  const ageMs = hours * 60 * 60 * 1000;

  return {
    apiSaved: true,
    cacheAgeMs: ageMs,
    observationAgeMs: ageMs,
    providerHit: false,
    replay: false,
    repositoryHit: true,
    repositorySource: "Seeded repository observation",
  };
}

export const seedWatchlistEntries: WatchlistEntry[] = [
  calculateWatchlistMetrics({
    assetIdentity: {
      assetId: "magic:mox-opal",
      collectorNumber: "179",
      game: "magic",
      name: "Mox Opal",
      printing: "Scars of Mirrodin #179",
      printingId: "scars-of-mirrodin-179",
      providerProductIdentifier: "mox-opal",
      providerVariantIdentifier: "mox-opal-som-normal-nm-english",
      setCode: "SOM",
      variantId: "scars-of-mirrodin-179-normal",
      image: {
        source: "Repository",
        urls: {
          small:
            "https://cards.scryfall.io/small/front/6/b/6be9b1d5-9ab8-4adb-ba54-2c0117e842fa.jpg?1782715284",
          normal:
            "https://cards.scryfall.io/normal/front/6/b/6be9b1d5-9ab8-4adb-ba54-2c0117e842fa.jpg?1782715284",
          large:
            "https://cards.scryfall.io/large/front/6/b/6be9b1d5-9ab8-4adb-ba54-2c0117e842fa.jpg?1782715284",
        },
      },
    },
    condition: "NM",
    currentValuation: 182,
    developerDiagnostics: createSeedDiagnostics(2),
    finish: "normal",
    physicalFinish: legacyPhysicalFinish("normal"),
    id: "mox-opal-som-normal-nm-english",
    language: "English",
    lastObservation: hoursAgo(2),
    lastRefresh: hoursAgo(2),
    marketTrend: "Stable",
    observationSource: "Repository",
    refreshStatus: "Repository Reused",
    targetPrice: 220,
    treatment: treatmentFromFinish("normal"),
    watchlistId: defaultWatchlistId,
  }),
  calculateWatchlistMetrics({
    assetIdentity: {
      assetId: "magic:lightning-bolt",
      collectorNumber: "149",
      game: "magic",
      name: "Lightning Bolt",
      printing: "Magic 2011 #149",
      printingId: "magic-2011-lightning-bolt-149",
      providerProductIdentifier: "lightning-bolt",
      providerVariantIdentifier: "lightning-bolt-secret-lair-foil-nm-english",
      setCode: "M11",
      variantId: "magic-2011-lightning-bolt-149-foil",
      image: {
        source: "Repository",
        urls: {
          small:
            "https://cards.scryfall.io/small/front/e/7/e768c957-3a1f-42f5-853a-96942f645df5.jpg?1782715389",
          normal:
            "https://cards.scryfall.io/normal/front/e/7/e768c957-3a1f-42f5-853a-96942f645df5.jpg?1782715389",
          large:
            "https://cards.scryfall.io/large/front/e/7/e768c957-3a1f-42f5-853a-96942f645df5.jpg?1782715389",
        },
      },
    },
    condition: "NM",
    currentValuation: 38,
    developerDiagnostics: createSeedDiagnostics(9),
    finish: "foil",
    physicalFinish: legacyPhysicalFinish("foil"),
    id: "lightning-bolt-secret-lair-foil-nm-english",
    language: "English",
    lastObservation: hoursAgo(9),
    lastRefresh: hoursAgo(9),
    marketTrend: "Increasing",
    observationSource: "Repository",
    refreshStatus: "Refresh Skipped",
    targetPrice: 42,
    treatment: treatmentFromFinish("foil"),
    watchlistId: defaultWatchlistId,
  }),
  calculateWatchlistMetrics({
    assetIdentity: {
      assetId: "magic:collected-company",
      collectorNumber: "177",
      game: "magic",
      name: "Collected Company",
      printing: "Dragons of Tarkir #177",
      printingId: "dragons-of-tarkir-177",
      providerProductIdentifier: "collected-company",
      providerVariantIdentifier: "collected-company-dtk-normal-lp-english",
      setCode: "DTK",
      variantId: "dragons-of-tarkir-177-normal",
      image: {
        source: "Repository",
        urls: {
          small:
            "https://cards.scryfall.io/small/front/c/f/cfa7b456-7e83-4587-a875-9b35fde318c2.jpg?1782712709",
          normal:
            "https://cards.scryfall.io/normal/front/c/f/cfa7b456-7e83-4587-a875-9b35fde318c2.jpg?1782712709",
          large:
            "https://cards.scryfall.io/large/front/c/f/cfa7b456-7e83-4587-a875-9b35fde318c2.jpg?1782712709",
        },
      },
    },
    condition: "LP",
    currentValuation: 13.5,
    developerDiagnostics: createSeedDiagnostics(4),
    finish: "normal",
    physicalFinish: legacyPhysicalFinish("normal"),
    id: "collected-company-dtk-normal-lp-english",
    language: "English",
    lastObservation: hoursAgo(4),
    lastRefresh: hoursAgo(4),
    marketTrend: "Declining",
    observationSource: "Repository",
    refreshStatus: "Repository Reused",
    targetPrice: 20,
    treatment: treatmentFromFinish("normal"),
    watchlistId: defaultWatchlistId,
  }),
  calculateWatchlistMetrics({
    assetIdentity: {
      assetId: "lorcana:elsa-spirit-of-winter",
      collectorNumber: "42",
      game: "lorcana",
      name: "Elsa - Spirit of Winter",
      printing: "The First Chapter #42",
      printingId: "lorcana-first-chapter-42",
      setCode: "TFC",
      variantId: "lorcana-first-chapter-42-cold-foil",
      image: {
        source: "Repository",
        urls: {
          small:
            "https://cards.lorcast.io/card/digital/small/crd_04bca46a8e2d4e9ba0fbdbfc6c99e51e.avif?1709690747",
          normal:
            "https://cards.lorcast.io/card/digital/normal/crd_04bca46a8e2d4e9ba0fbdbfc6c99e51e.avif?1709690747",
          large:
            "https://cards.lorcast.io/card/digital/large/crd_04bca46a8e2d4e9ba0fbdbfc6c99e51e.avif?1709690747",
        },
      },
    },
    condition: "NM",
    currentValuation: 815,
    developerDiagnostics: createSeedDiagnostics(30),
    finish: "cold foil",
    physicalFinish: legacyPhysicalFinish("cold foil"),
    id: "elsa-spirit-of-winter-tfc-cold-foil-nm-english",
    language: "English",
    lastObservation: hoursAgo(30),
    lastRefresh: hoursAgo(30),
    marketTrend: "Unknown",
    observationSource: "Repository",
    refreshStatus: "Refresh Skipped",
    targetPrice: 900,
    treatment: treatmentFromFinish("cold foil"),
    watchlistId: defaultWatchlistId,
  }),
];

export function loadWatchlistEntries() {
  if (typeof window === "undefined") {
    return seedWatchlistEntries;
  }

  const raw = window.localStorage.getItem(storageKey);

  if (!raw) {
    saveWatchlistEntries(seedWatchlistEntries);

    return seedWatchlistEntries;
  }

  try {
    const parsed = JSON.parse(raw) as WatchlistEntry[];

    const hydrated = hydrateWatchlistEntries(parsed);
    saveWatchlistEntries(hydrated);
    return hydrated;
  } catch {
    saveWatchlistEntries(seedWatchlistEntries);

    return seedWatchlistEntries;
  }
}

export function hydrateWatchlistEntries(entries: WatchlistEntry[]) {
  return entries.map((entry) => {
    const repositorySeed = seedWatchlistEntries.find(
      (seed) => seed.assetIdentity.assetId === entry.assetIdentity.assetId,
    );

    return calculateWatchlistMetrics({
      ...entry,
      assetIdentity: repositorySeed
        ? { ...entry.assetIdentity, ...repositorySeed.assetIdentity }
        : entry.assetIdentity,
      treatment: entry.treatment ?? treatmentFromFinish(entry.finish),
      physicalFinish: migratePhysicalFinish(entry),
      printingDesignFacets: entry.printingDesignFacets ?? [],
      watchlistId: entry.watchlistId ?? defaultWatchlistId,
    });
  });
}

export function saveWatchlistEntries(entries: WatchlistEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(entries));
}

export function updateWatchlistEntry(
  entries: WatchlistEntry[],
  updatedEntry: WatchlistEntry,
) {
  return entries.map((entry) =>
    entry.id === updatedEntry.id &&
    entry.watchlistId === updatedEntry.watchlistId
      ? updatedEntry
      : entry,
  );
}

export type RemovedWatchlistEntry = {
  entry: WatchlistEntry;
  index: number;
};

export function removeWatchlistEntry(
  entries: WatchlistEntry[],
  entryId: string,
  watchlistId = defaultWatchlistId,
): { entries: WatchlistEntry[]; removed?: RemovedWatchlistEntry } {
  const index = entries.findIndex(
    (entry) => entry.id === entryId && entry.watchlistId === watchlistId,
  );
  if (index < 0) return { entries };

  return {
    entries: entries.filter((_, entryIndex) => entryIndex !== index),
    removed: { entry: entries[index], index },
  };
}

export function restoreWatchlistEntry(
  entries: WatchlistEntry[],
  removed: RemovedWatchlistEntry,
) {
  if (
    entries.some(
      (entry) =>
        entry.id === removed.entry.id &&
        entry.watchlistId === removed.entry.watchlistId,
    )
  ) {
    return entries;
  }

  const next = [...entries];
  next.splice(
    Math.min(Math.max(removed.index, 0), next.length),
    0,
    removed.entry,
  );
  return next;
}
