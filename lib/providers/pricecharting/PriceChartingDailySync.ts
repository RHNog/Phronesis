import { createHash } from "node:crypto";
import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { importPriceChartingCsv, inspectPriceChartingCsv, type PriceChartingGameProfile, type PriceChartingImportReport } from "./PriceChartingBulkImport";

export const PRICECHARTING_CSV_MIN_INTERVAL_MS = 10 * 60 * 1_000;
const MAX_REDIRECTS = 3;
const ALLOWED_CONTENT_TYPES = ["text/csv", "text/plain", "application/csv", "application/octet-stream", "application/download"];

export type PriceChartingDailySource = { gameProfile: PriceChartingGameProfile; url: string };
export type PriceChartingDailyResult = {
  gameProfile: PriceChartingGameProfile;
  receiptId?: number;
  sourceHash?: string;
  sourceRows?: number;
  status: "SUCCEEDED" | "SKIPPED_ALREADY_CURRENT" | "FAILED";
  errorCode?: string;
};

type Fetcher = (input: string | URL, init?: RequestInit) => Promise<Response>;

function hash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function utcDate(date: Date): string { return date.toISOString().slice(0, 10); }
function safeDownloadUrl(raw: string): URL {
  const url = new URL(raw);
  if (url.protocol !== "https:" || !["pricecharting.com", "www.pricecharting.com"].includes(url.hostname.toLowerCase()) || url.username || url.password || url.hash) {
    throw new Error("PRICECHARTING_DOWNLOAD_URL_REJECTED");
  }
  return url;
}

async function fetchCsv(rawUrl: string, fetcher: Fetcher): Promise<string> {
  let url = safeDownloadUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetcher(url, { headers: { accept: "text/csv,application/octet-stream;q=0.9" }, redirect: "manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("PRICECHARTING_DOWNLOAD_REDIRECT_REJECTED");
      url = safeDownloadUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`PRICECHARTING_DOWNLOAD_HTTP_${response.status}`);
    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (contentType && !ALLOWED_CONTENT_TYPES.includes(contentType)) throw new Error("PRICECHARTING_DOWNLOAD_CONTENT_TYPE_REJECTED");
    const source = await response.text();
    if (/^\s*<!doctype html|^\s*<html/i.test(source)) throw new Error("PRICECHARTING_DOWNLOAD_HTML_REJECTED");
    return source;
  }
  throw new Error("PRICECHARTING_DOWNLOAD_REDIRECT_REJECTED");
}

function errorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : "PRICECHARTING_DAILY_SYNC_FAILED";
  return /^PRICECHARTING_[A-Z0-9_]+$/.test(message) ? message : "PRICECHARTING_DAILY_SYNC_FAILED";
}

export class PriceChartingDailySync {
  private readonly database: DatabaseSync;

  constructor(private readonly options: {
    applicationVersion?: string;
    databasePath: string;
    fetcher?: Fetcher;
    now?: () => Date;
    receiptDirectory: string;
    sleep?: (milliseconds: number) => Promise<void>;
  }) {
    this.database = new DatabaseSync(options.databasePath);
    this.database.exec(`CREATE TABLE IF NOT EXISTS pricecharting_daily_sync_state (
      game_profile TEXT NOT NULL,
      utc_date TEXT NOT NULL,
      status TEXT NOT NULL,
      attempted_at TEXT NOT NULL,
      completed_at TEXT,
      source_hash TEXT,
      receipt_id INTEGER,
      source_rows INTEGER,
      error_code TEXT,
      PRIMARY KEY(game_profile, utc_date)
    );
    CREATE TABLE IF NOT EXISTS pricecharting_provider_request_state (
      provider_id TEXT PRIMARY KEY,
      last_request_at TEXT NOT NULL
    )`);
  }

  close(): void { this.database.close(); }

  async run(sources: PriceChartingDailySource[]): Promise<PriceChartingDailyResult[]> {
    const fetcher = this.options.fetcher ?? fetch;
    const now = this.options.now ?? (() => new Date());
    const sleep = this.options.sleep ?? ((milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds)));
    const results: PriceChartingDailyResult[] = [];
    const seen = new Set<PriceChartingGameProfile>();

    for (const source of sources) {
      if (seen.has(source.gameProfile)) throw new Error(`Duplicate PriceCharting daily source: ${source.gameProfile}`);
      seen.add(source.gameProfile);
      const day = utcDate(now());
      const current = this.database.prepare("SELECT status,receipt_id,source_hash,source_rows FROM pricecharting_daily_sync_state WHERE game_profile=? AND utc_date=?").get(source.gameProfile, day) as Record<string, unknown> | undefined;
      if (current?.status === "SUCCEEDED") {
        results.push({ gameProfile: source.gameProfile, receiptId: Number(current.receipt_id), sourceHash: String(current.source_hash), sourceRows: Number(current.source_rows), status: "SKIPPED_ALREADY_CURRENT" });
        continue;
      }
      const attemptedAt = now().toISOString();
      this.database.prepare(`INSERT INTO pricecharting_daily_sync_state(game_profile,utc_date,status,attempted_at,error_code)
        VALUES(?,?,'IN_PROGRESS',?,NULL) ON CONFLICT(game_profile,utc_date) DO UPDATE SET status='IN_PROGRESS',attempted_at=excluded.attempted_at,completed_at=NULL,error_code=NULL`).run(source.gameProfile, day, attemptedAt);
      try {
        safeDownloadUrl(source.url);
        const priorRequest = this.database.prepare("SELECT last_request_at FROM pricecharting_provider_request_state WHERE provider_id='pricecharting-csv'").get() as { last_request_at: string } | undefined;
        if (priorRequest) {
          const remaining = PRICECHARTING_CSV_MIN_INTERVAL_MS - (now().valueOf() - new Date(priorRequest.last_request_at).valueOf());
          if (remaining > 0) await sleep(remaining);
        }
        this.database.prepare(`INSERT INTO pricecharting_provider_request_state(provider_id,last_request_at) VALUES('pricecharting-csv',?)
          ON CONFLICT(provider_id) DO UPDATE SET last_request_at=excluded.last_request_at`).run(now().toISOString());
        const csv = await fetchCsv(source.url, fetcher);
        const inspection = inspectPriceChartingCsv(csv, source.gameProfile);
        const sourceHash = hash(csv);
        const downloadDirectory = join(this.options.receiptDirectory, "downloads");
        mkdirSync(downloadDirectory, { recursive: true });
        const partial = join(downloadDirectory, `${source.gameProfile}-${sourceHash}.partial`);
        const file = join(downloadDirectory, `${source.gameProfile}-${sourceHash}.csv`);
        writeFileSync(partial, csv, { encoding: "utf8", mode: 0o600 });
        renameSync(partial, file);
        const report: PriceChartingImportReport = importPriceChartingCsv({
          applicationVersion: this.options.applicationVersion,
          apply: true,
          databasePath: this.options.databasePath,
          file,
          gameProfile: source.gameProfile,
          receiptDirectory: this.options.receiptDirectory,
        });
        const completedAt = now().toISOString();
        this.database.prepare(`UPDATE pricecharting_daily_sync_state SET status='SUCCEEDED',completed_at=?,source_hash=?,receipt_id=?,source_rows=?,error_code=NULL WHERE game_profile=? AND utc_date=?`)
          .run(completedAt, sourceHash, report.receiptId, inspection.rowCount, source.gameProfile, day);
        results.push({ gameProfile: source.gameProfile, receiptId: report.receiptId, sourceHash, sourceRows: inspection.rowCount, status: "SUCCEEDED" });
      } catch (error) {
        const code = errorCode(error);
        this.database.prepare(`UPDATE pricecharting_daily_sync_state SET status='FAILED',completed_at=?,error_code=? WHERE game_profile=? AND utc_date=?`).run(now().toISOString(), code, source.gameProfile, day);
        results.push({ gameProfile: source.gameProfile, status: "FAILED", errorCode: code });
      }
    }
    return results;
  }
}
