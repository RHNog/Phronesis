import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { WatchlistEntry } from "@/features/watchlist/WatchlistRefreshEngine";

type SqlRow = Record<string, string | number | null>;

export const LEGACY_WATCHLIST_OWNER_ID = "legacy-local-owner";
export const LEGACY_WATCHLIST_WORKSPACE_ID = "legacy-local-workspace";

export type WatchlistPrincipal = {
  ownerUserId: string;
  workspaceId: string;
};

export type TrackWatchlistResult = {
  created: boolean;
  entry: WatchlistEntry;
};

export type CatalogueWatchRefreshResult = {
  evaluated: number;
  updated: number;
};

export type OwnedWatchlistEntry = {
  entry: WatchlistEntry;
  principal: WatchlistPrincipal;
};

function parseEntry(payload: string): WatchlistEntry {
  return JSON.parse(payload) as WatchlistEntry;
}

function normalizedEntry(entry: WatchlistEntry): WatchlistEntry {
  return { ...entry, watchlistId: "default" };
}

export class WatchlistRepository {
  constructor(readonly database: DatabaseSync) {
    this.migrate();
  }

  migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_watchlist (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        is_default INTEGER NOT NULL CHECK(is_default IN (0, 1)),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(workspace_id, owner_user_id, name)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_watchlist_default_owner
        ON phronesis_watchlist(workspace_id, owner_user_id)
        WHERE is_default = 1;
      CREATE TABLE IF NOT EXISTS phronesis_watchlist_entry (
        membership_id TEXT PRIMARY KEY,
        watchlist_id TEXT NOT NULL,
        entry_key TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        position INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        UNIQUE(watchlist_id, entry_key),
        FOREIGN KEY(watchlist_id) REFERENCES phronesis_watchlist(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS phronesis_watchlist_entry_active
        ON phronesis_watchlist_entry(watchlist_id, deleted_at, position);
    `);
  }

  ensureDefaultWatchlist(principal: WatchlistPrincipal): string {
    const current = this.database
      .prepare(
        `
      SELECT id FROM phronesis_watchlist
      WHERE workspace_id = ? AND owner_user_id = ? AND is_default = 1
    `,
      )
      .get(principal.workspaceId, principal.ownerUserId) as SqlRow | undefined;
    if (current) return String(current.id);
    const id = randomUUID();
    const now = new Date().toISOString();
    this.database
      .prepare(
        `
      INSERT INTO phronesis_watchlist(
        id, workspace_id, owner_user_id, name, is_default, created_at, updated_at
      ) VALUES(?, ?, ?, 'Market Watch', 1, ?, ?)
    `,
      )
      .run(id, principal.workspaceId, principal.ownerUserId, now, now);
    return id;
  }

  listEntries(principal: WatchlistPrincipal): WatchlistEntry[] {
    const watchlistId = this.ensureDefaultWatchlist(principal);
    return (
      this.database
        .prepare(
          `
      SELECT payload_json FROM phronesis_watchlist_entry
      WHERE watchlist_id = ? AND deleted_at IS NULL
      ORDER BY position ASC, created_at ASC
    `,
        )
        .all(watchlistId) as SqlRow[]
    ).map((row) => normalizedEntry(parseEntry(String(row.payload_json))));
  }

  findEntry(principal: WatchlistPrincipal, entryId: string): WatchlistEntry | null {
    const watchlistId = this.ensureDefaultWatchlist(principal);
    const row = this.database.prepare(`
      SELECT payload_json FROM phronesis_watchlist_entry
      WHERE watchlist_id = ? AND entry_key = ? AND deleted_at IS NULL
    `).get(watchlistId, entryId) as SqlRow | undefined;
    return row ? normalizedEntry(parseEntry(String(row.payload_json))) : null;
  }

  track(
    principal: WatchlistPrincipal,
    input: WatchlistEntry,
  ): TrackWatchlistResult {
    const watchlistId = this.ensureDefaultWatchlist(principal);
    const entry = normalizedEntry(input);
    const existing = this.database
      .prepare(
        `
      SELECT payload_json, deleted_at FROM phronesis_watchlist_entry
      WHERE watchlist_id = ? AND entry_key = ?
    `,
      )
      .get(watchlistId, entry.id) as SqlRow | undefined;
    if (existing && existing.deleted_at === null) {
      return {
        created: false,
        entry: normalizedEntry(parseEntry(String(existing.payload_json))),
      };
    }
    const now = new Date().toISOString();
    const nextPosition = Number(
      (
        this.database
          .prepare(
            `
      SELECT COALESCE(MAX(position), -1) + 1 AS position
      FROM phronesis_watchlist_entry WHERE watchlist_id = ?
    `,
          )
          .get(watchlistId) as SqlRow
      ).position,
    );
    if (existing) {
      this.database
        .prepare(
          `
        UPDATE phronesis_watchlist_entry
        SET payload_json = ?, position = ?, updated_at = ?, deleted_at = NULL
        WHERE watchlist_id = ? AND entry_key = ?
      `,
        )
        .run(JSON.stringify(entry), nextPosition, now, watchlistId, entry.id);
    } else {
      this.database
        .prepare(
          `
        INSERT INTO phronesis_watchlist_entry(
          membership_id, watchlist_id, entry_key, payload_json, position,
          created_at, updated_at, deleted_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, NULL)
      `,
        )
        .run(
          randomUUID(),
          watchlistId,
          entry.id,
          JSON.stringify(entry),
          nextPosition,
          now,
          now,
        );
    }
    return { created: true, entry };
  }

  importEntries(
    principal: WatchlistPrincipal,
    entries: readonly WatchlistEntry[],
  ): WatchlistEntry[] {
    const watchlistId = this.ensureDefaultWatchlist(principal);
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      let nextPosition = Number(
        (
          this.database
            .prepare(
              `
        SELECT COALESCE(MAX(position), -1) + 1 AS position
        FROM phronesis_watchlist_entry WHERE watchlist_id = ?
      `,
            )
            .get(watchlistId) as SqlRow
        ).position,
      );
      const find = this.database.prepare(`
        SELECT membership_id FROM phronesis_watchlist_entry
        WHERE watchlist_id = ? AND entry_key = ?
      `);
      const insert = this.database.prepare(`
        INSERT INTO phronesis_watchlist_entry(
          membership_id, watchlist_id, entry_key, payload_json, position,
          created_at, updated_at, deleted_at
        ) VALUES(?, ?, ?, ?, ?, ?, ?, NULL)
      `);
      for (const input of entries) {
        const entry = normalizedEntry(input);
        if (find.get(watchlistId, entry.id)) continue;
        insert.run(
          randomUUID(),
          watchlistId,
          entry.id,
          JSON.stringify(entry),
          nextPosition,
          now,
          now,
        );
        nextPosition += 1;
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.listEntries(principal);
  }

  update(
    principal: WatchlistPrincipal,
    entryId: string,
    input: WatchlistEntry,
  ): WatchlistEntry | null {
    const watchlistId = this.ensureDefaultWatchlist(principal);
    const entry = normalizedEntry({ ...input, id: entryId });
    const result = this.database
      .prepare(
        `
      UPDATE phronesis_watchlist_entry
      SET payload_json = ?, updated_at = ?
      WHERE watchlist_id = ? AND entry_key = ? AND deleted_at IS NULL
    `,
      )
      .run(
        JSON.stringify(entry),
        new Date().toISOString(),
        watchlistId,
        entryId,
      );
    return Number(result.changes) === 1 ? entry : null;
  }

  remove(
    principal: WatchlistPrincipal,
    entryId: string,
  ): WatchlistEntry | null {
    const watchlistId = this.ensureDefaultWatchlist(principal);
    const row = this.database
      .prepare(
        `
      SELECT payload_json FROM phronesis_watchlist_entry
      WHERE watchlist_id = ? AND entry_key = ? AND deleted_at IS NULL
    `,
      )
      .get(watchlistId, entryId) as SqlRow | undefined;
    if (!row) return null;
    const now = new Date().toISOString();
    this.database
      .prepare(
        `
      UPDATE phronesis_watchlist_entry SET deleted_at = ?, updated_at = ?
      WHERE watchlist_id = ? AND entry_key = ? AND deleted_at IS NULL
    `,
      )
      .run(now, now, watchlistId, entryId);
    return normalizedEntry(parseEntry(String(row.payload_json)));
  }

  restore(
    principal: WatchlistPrincipal,
    entryId: string,
  ): WatchlistEntry | null {
    const watchlistId = this.ensureDefaultWatchlist(principal);
    const row = this.database
      .prepare(
        `
      SELECT payload_json FROM phronesis_watchlist_entry
      WHERE watchlist_id = ? AND entry_key = ? AND deleted_at IS NOT NULL
    `,
      )
      .get(watchlistId, entryId) as SqlRow | undefined;
    if (!row) return null;
    const now = new Date().toISOString();
    this.database
      .prepare(
        `
      UPDATE phronesis_watchlist_entry SET deleted_at = NULL, updated_at = ?
      WHERE watchlist_id = ? AND entry_key = ? AND deleted_at IS NOT NULL
    `,
      )
      .run(now, watchlistId, entryId);
    return normalizedEntry(parseEntry(String(row.payload_json)));
  }

  refreshCatalogueEntries(
    categoryId: string,
    refresh: (entry: WatchlistEntry) => WatchlistEntry | null,
  ): CatalogueWatchRefreshResult {
    const rows = this.database
      .prepare(
        `
      SELECT membership_id, payload_json FROM phronesis_watchlist_entry
      WHERE deleted_at IS NULL
    `,
      )
      .all() as SqlRow[];
    const candidates = rows
      .map((row) => ({
        membershipId: String(row.membership_id),
        entry: normalizedEntry(parseEntry(String(row.payload_json))),
      }))
      .filter(({ entry }) =>
        entry.assetIdentity.assetId.startsWith(`${categoryId}:`),
      );
    let updated = 0;
    const statement = this.database.prepare(`
      UPDATE phronesis_watchlist_entry SET payload_json = ?, updated_at = ?
      WHERE membership_id = ? AND deleted_at IS NULL
    `);
    this.database.exec("BEGIN IMMEDIATE");
    try {
      for (const candidate of candidates) {
        const refreshed = refresh(candidate.entry);
        if (!refreshed) continue;
        statement.run(
          JSON.stringify(normalizedEntry(refreshed)),
          new Date().toISOString(),
          candidate.membershipId,
        );
        updated += 1;
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return { evaluated: candidates.length, updated };
  }

  listEnrichmentCandidates(categoryId: string): OwnedWatchlistEntry[] {
    return (this.database.prepare(`
      SELECT w.workspace_id, w.owner_user_id, e.payload_json
      FROM phronesis_watchlist_entry e
      JOIN phronesis_watchlist w ON w.id = e.watchlist_id
      WHERE e.deleted_at IS NULL
      ORDER BY e.updated_at ASC
    `).all() as SqlRow[])
      .map((row) => ({
        entry: normalizedEntry(parseEntry(String(row.payload_json))),
        principal: {
          ownerUserId: String(row.owner_user_id),
          workspaceId: String(row.workspace_id),
        },
      }))
      .filter(({ entry }) => entry.assetIdentity.assetId.startsWith(`${categoryId}:`));
  }

  claimLegacyEntries(target: WatchlistPrincipal): number {
    const source: WatchlistPrincipal = {
      ownerUserId: LEGACY_WATCHLIST_OWNER_ID,
      workspaceId: LEGACY_WATCHLIST_WORKSPACE_ID,
    };
    const entries = this.listEntries(source);
    const before = this.listEntries(target).length;
    const after = this.importEntries(target, entries).length;
    return after - before;
  }
}
