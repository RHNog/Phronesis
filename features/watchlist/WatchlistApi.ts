import type { WatchlistEntry } from "@/features/watchlist/WatchlistRefreshEngine";

type EntriesResponse = { entries: WatchlistEntry[]; error?: string };
type EntryResponse = { entry: WatchlistEntry; error?: string };
type TrackResponse = EntryResponse & { created: boolean };

async function responseJson<T extends { error?: string }>(
  response: Response,
): Promise<T> {
  const body = (await response.json()) as T;
  if (!response.ok) {
    const error = new Error(
      body.error ?? "Market Watch request failed.",
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function loadServerWatchlistEntries(
  localEntries?: readonly WatchlistEntry[],
): Promise<WatchlistEntry[]> {
  if (localEntries?.length) {
    const response = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "import", entries: localEntries }),
    });
    return (await responseJson<EntriesResponse>(response)).entries;
  }
  const response = await fetch("/api/watchlists", { method: "GET" });
  return (await responseJson<EntriesResponse>(response)).entries;
}

export async function trackWatchlistEntry(
  entry: WatchlistEntry,
): Promise<TrackResponse> {
  const response = await fetch("/api/watchlists", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "track", entry }),
  });
  return responseJson<TrackResponse>(response);
}

export async function updateServerWatchlistEntry(
  entry: WatchlistEntry,
): Promise<WatchlistEntry> {
  const response = await fetch(
    `/api/watchlists/${encodeURIComponent(entry.id)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entry }),
    },
  );
  return (await responseJson<EntryResponse>(response)).entry;
}

export async function removeServerWatchlistEntry(
  entryId: string,
): Promise<WatchlistEntry> {
  const response = await fetch(
    `/api/watchlists/${encodeURIComponent(entryId)}`,
    { method: "DELETE" },
  );
  return (await responseJson<EntryResponse>(response)).entry;
}

export async function restoreServerWatchlistEntry(
  entryId: string,
): Promise<WatchlistEntry> {
  const response = await fetch(
    `/api/watchlists/${encodeURIComponent(entryId)}/restore`,
    { method: "POST" },
  );
  return (await responseJson<EntryResponse>(response)).entry;
}

export function watchlistApiErrorStatus(error: unknown): number | undefined {
  return error instanceof Error
    ? (error as Error & { status?: number }).status
    : undefined;
}
