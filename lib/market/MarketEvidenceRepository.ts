import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { WatchlistPrincipal } from "@/lib/watchlist/WatchlistRepository";
import type {
  ActiveListingEvidence,
  MarketEvidenceRecord,
} from "@/types/marketEvidence";

type SqlRow = Record<string, string | number | null>;

function rowToRecord(row: SqlRow): MarketEvidenceRecord {
  return {
    id: String(row.id),
    entryId: String(row.entry_key),
    evidenceType: String(row.evidence_type) as MarketEvidenceRecord["evidenceType"],
    providerId: String(row.provider_id),
    title: row.title as string | null,
    priceCents: Number(row.price_cents),
    shippingCents: row.shipping_cents === null ? null : Number(row.shipping_cents),
    currency: String(row.currency),
    condition: row.condition as string | null,
    quantity: Number(row.quantity),
    observedAt: String(row.observed_at),
    sourceUrl: row.source_url as string | null,
    provenance: String(row.provenance),
    createdAt: String(row.created_at),
  };
}

function safeSourceUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Evidence source URL must use HTTP or HTTPS.");
  }
  return url.toString();
}

export class MarketEvidenceRepository {
  constructor(readonly database: DatabaseSync) {
    this.migrate();
  }

  migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_market_evidence (
        id TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL,
        owner_user_id TEXT NOT NULL,
        entry_key TEXT NOT NULL,
        external_key TEXT,
        evidence_type TEXT NOT NULL CHECK(evidence_type IN ('MARKET_ESTIMATE','ACTIVE_LISTING','OBSERVED_SALE')),
        provider_id TEXT NOT NULL,
        title TEXT,
        price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
        shipping_cents INTEGER CHECK(shipping_cents IS NULL OR shipping_cents >= 0),
        currency TEXT NOT NULL,
        condition TEXT,
        quantity INTEGER NOT NULL CHECK(quantity > 0),
        observed_at TEXT NOT NULL,
        source_url TEXT,
        provenance TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS phronesis_market_evidence_owner_entry
        ON phronesis_market_evidence(workspace_id, owner_user_id, entry_key, evidence_type, observed_at DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS phronesis_market_evidence_external
        ON phronesis_market_evidence(workspace_id, owner_user_id, entry_key, provider_id, external_key)
        WHERE external_key IS NOT NULL;
    `);
  }

  list(principal: WatchlistPrincipal, entryId: string): MarketEvidenceRecord[] {
    return (this.database.prepare(`
      SELECT * FROM phronesis_market_evidence
      WHERE workspace_id = ? AND owner_user_id = ? AND entry_key = ?
      ORDER BY observed_at DESC, created_at DESC
    `).all(principal.workspaceId, principal.ownerUserId, entryId) as SqlRow[]).map(rowToRecord);
  }

  recordObservedSale(principal: WatchlistPrincipal, input: {
    entryId: string;
    priceCents: number;
    currency?: string;
    condition?: string | null;
    quantity?: number;
    observedAt: string;
    sourceUrl?: string | null;
    provenance?: string;
  }): MarketEvidenceRecord {
    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) throw new Error("Observed sale price must be non-negative cents.");
    const quantity = input.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10_000) throw new Error("Observed sale quantity is invalid.");
    if (Number.isNaN(new Date(input.observedAt).getTime())) throw new Error("Observed sale time is invalid.");
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO phronesis_market_evidence(
        id, workspace_id, owner_user_id, entry_key, external_key, evidence_type,
        provider_id, title, price_cents, shipping_cents, currency, condition,
        quantity, observed_at, source_url, provenance, created_at
      ) VALUES(?, ?, ?, ?, NULL, 'OBSERVED_SALE', 'phronesis-first-party', NULL, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      principal.workspaceId,
      principal.ownerUserId,
      input.entryId,
      input.priceCents,
      input.currency?.trim().toUpperCase() || "USD",
      input.condition?.trim() || null,
      quantity,
      input.observedAt,
      safeSourceUrl(input.sourceUrl),
      input.provenance?.trim() || "Recorded by an authorized Phronesis user.",
      createdAt,
    );
    return this.list(principal, input.entryId).find((record) => record.id === id)!;
  }

  recordMarketEstimate(principal: WatchlistPrincipal, input: {
    entryId: string;
    externalKey: string;
    providerId: string;
    priceCents: number;
    currency?: string;
    condition?: string | null;
    observedAt: string;
    provenance: string;
  }): MarketEvidenceRecord {
    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) throw new Error("Market estimate must be non-negative cents.");
    if (Number.isNaN(new Date(input.observedAt).getTime())) throw new Error("Market estimate time is invalid.");
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.database.prepare(`
      INSERT INTO phronesis_market_evidence(
        id, workspace_id, owner_user_id, entry_key, external_key, evidence_type,
        provider_id, title, price_cents, shipping_cents, currency, condition,
        quantity, observed_at, source_url, provenance, created_at
      ) VALUES(?, ?, ?, ?, ?, 'MARKET_ESTIMATE', ?, NULL, ?, NULL, ?, ?, 1, ?, NULL, ?, ?)
      ON CONFLICT DO UPDATE SET price_cents = excluded.price_cents, condition = excluded.condition,
        observed_at = excluded.observed_at, provenance = excluded.provenance,
        created_at = excluded.created_at
    `).run(
      id,
      principal.workspaceId,
      principal.ownerUserId,
      input.entryId,
      input.externalKey,
      input.providerId,
      input.priceCents,
      input.currency?.trim().toUpperCase() || "USD",
      input.condition?.trim() || null,
      input.observedAt,
      input.provenance,
      createdAt,
    );
    return this.list(principal, input.entryId).find(
      (record) => record.providerId === input.providerId && record.observedAt === input.observedAt,
    )!;
  }

  replaceActiveListings(
    principal: WatchlistPrincipal,
    entryId: string,
    providerId: string,
    listings: readonly ActiveListingEvidence[],
  ): MarketEvidenceRecord[] {
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`
        DELETE FROM phronesis_market_evidence
        WHERE workspace_id = ? AND owner_user_id = ? AND entry_key = ?
          AND evidence_type = 'ACTIVE_LISTING' AND provider_id = ?
      `).run(principal.workspaceId, principal.ownerUserId, entryId, providerId);
      const insert = this.database.prepare(`
        INSERT INTO phronesis_market_evidence(
          id, workspace_id, owner_user_id, entry_key, external_key, evidence_type,
          provider_id, title, price_cents, shipping_cents, currency, condition,
          quantity, observed_at, source_url, provenance, created_at
        ) VALUES(?, ?, ?, ?, ?, 'ACTIVE_LISTING', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Official provider active-listing response.', ?)
      `);
      for (const listing of listings) {
        insert.run(
          randomUUID(), principal.workspaceId, principal.ownerUserId, entryId,
          listing.externalId, providerId, listing.title, listing.priceCents,
          listing.shippingCents, listing.currency, listing.condition,
          listing.quantity, listing.observedAt, listing.sourceUrl, now,
        );
      }
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.list(principal, entryId).filter(
      (record) => record.evidenceType === "ACTIVE_LISTING" && record.providerId === providerId,
    );
  }
}
