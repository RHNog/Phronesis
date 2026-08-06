import type { WatchlistEntry } from "@/features/watchlist/WatchlistRefreshEngine";

export function parseWatchlistEntry(value: unknown): WatchlistEntry {
  if (!value || typeof value !== "object")
    throw new Error("A watchlist entry is required.");
  const entry = value as Partial<WatchlistEntry>;
  if (
    typeof entry.id !== "string" ||
    !entry.id.trim() ||
    typeof entry.condition !== "string" ||
    !entry.condition.trim() ||
    typeof entry.finish !== "string" ||
    !entry.finish.trim() ||
    typeof entry.language !== "string" ||
    !entry.language.trim() ||
    !entry.assetIdentity ||
    typeof entry.assetIdentity.name !== "string" ||
    !entry.assetIdentity.name.trim() ||
    typeof entry.assetIdentity.game !== "string" ||
    !entry.assetIdentity.game.trim() ||
    typeof entry.assetIdentity.printingId !== "string" ||
    !entry.assetIdentity.printingId.trim() ||
    typeof entry.assetIdentity.variantId !== "string" ||
    !entry.assetIdentity.variantId.trim()
  ) {
    throw new Error(
      "The exact card, finish, condition, and language are required.",
    );
  }
  if (entry.id.length > 500 || JSON.stringify(entry).length > 100_000) {
    throw new Error("The watchlist entry exceeds the supported size.");
  }
  return entry as WatchlistEntry;
}

export function parseWatchlistEntries(value: unknown): WatchlistEntry[] {
  if (!Array.isArray(value))
    throw new Error("Watchlist entries must be an array.");
  if (value.length > 2_000)
    throw new Error("At most 2,000 entries can be migrated at once.");
  return value.map(parseWatchlistEntry);
}
