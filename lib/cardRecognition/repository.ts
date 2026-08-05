import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { CorpusManifest, VerifiedCorpusManifest } from "@/lib/cardRecognition/corpus";
import { verifyCorpusManifest, verifyCorpusObjects } from "@/lib/cardRecognition/corpus";
import type { DetectedCardRegion, RecognitionDecision, ScanFrame } from "@/lib/cardRecognition/contracts";
import { fullFrameRegion, validateFrame, validateRegionGeometry } from "@/lib/cardRecognition/contracts";

export type ScanSessionState = "CAPTURING" | "PROCESSING" | "REVIEW" | "OFFER_READY" | "CANCELLED";

export type ScanSessionSummary = {
  id: string;
  label: string;
  state: ScanSessionState;
  createdAt: string;
  updatedAt: string;
  counts: { frames: number; regions: number; pending: number; review: number; accepted: number; abstained: number; failed: number };
};

export class CardRecognitionRepository {
  readonly database: DatabaseSync;
  readonly root: string;

  constructor(databasePath = ":memory:", root = join(process.cwd(), ".data", "card-recognition")) {
    this.root = root;
    mkdirSync(this.objectRoot(), { recursive: true });
    mkdirSync(join(root, "bundles"), { recursive: true });
    mkdirSync(join(root, "indexes"), { recursive: true });
    mkdirSync(join(root, "quarantine"), { recursive: true });
    if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
    this.migrate();
  }

  close(): void { this.database.close(); }
  private objectRoot(): string { return join(this.root, "objects", "sha256"); }
  objectPath(sha256: string): string { return join(this.objectRoot(), sha256.slice(0, 2), sha256); }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS recognition_session (
        id TEXT PRIMARY KEY, label TEXT NOT NULL, state TEXT NOT NULL,
        created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS recognition_frame (
        id TEXT PRIMARY KEY, session_id TEXT NOT NULL, sequence INTEGER NOT NULL,
        side TEXT NOT NULL, object_sha256 TEXT NOT NULL, media_type TEXT NOT NULL,
        byte_length INTEGER NOT NULL, captured_at TEXT NOT NULL, paired_frame_id TEXT,
        UNIQUE(session_id, sequence, side), FOREIGN KEY(session_id) REFERENCES recognition_session(id)
      );
      CREATE TABLE IF NOT EXISTS recognition_region (
        id TEXT PRIMARY KEY, frame_id TEXT NOT NULL, region_order INTEGER NOT NULL,
        revision INTEGER NOT NULL, state TEXT NOT NULL, geometry_json TEXT NOT NULL,
        parent_region_id TEXT, correction_reason TEXT, created_at TEXT NOT NULL,
        UNIQUE(frame_id, region_order, revision), FOREIGN KEY(frame_id) REFERENCES recognition_frame(id)
      );
      CREATE TABLE IF NOT EXISTS recognition_decision (
        id TEXT PRIMARY KEY, region_id TEXT NOT NULL, status TEXT NOT NULL,
        payload_json TEXT NOT NULL, created_at TEXT NOT NULL,
        FOREIGN KEY(region_id) REFERENCES recognition_region(id)
      );
      CREATE TABLE IF NOT EXISTS recognition_resolution (
        id TEXT PRIMARY KEY, region_id TEXT NOT NULL, revision INTEGER NOT NULL,
        decision_id TEXT NOT NULL, condition_code TEXT NOT NULL, finish TEXT NOT NULL,
        quantity INTEGER NOT NULL, price_snapshot_id TEXT NOT NULL, price_snapshot_at TEXT NOT NULL,
        buying_preset_id TEXT NOT NULL, offer_cents INTEGER NOT NULL, currency TEXT NOT NULL,
        resolved_by TEXT NOT NULL, resolved_at TEXT NOT NULL,
        UNIQUE(region_id,revision), FOREIGN KEY(region_id) REFERENCES recognition_region(id),
        FOREIGN KEY(decision_id) REFERENCES recognition_decision(id)
      );
      CREATE TABLE IF NOT EXISTS recognition_job (
        id TEXT PRIMARY KEY, region_id TEXT NOT NULL UNIQUE, state TEXT NOT NULL,
        lease_owner TEXT, lease_expires_at TEXT, attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT, updated_at TEXT NOT NULL,
        FOREIGN KEY(region_id) REFERENCES recognition_region(id)
      );
      CREATE TABLE IF NOT EXISTS recognition_corpus (
        version TEXT PRIMARY KEY, manifest_sha256 TEXT NOT NULL UNIQUE,
        manifest_json TEXT NOT NULL, activated_at TEXT, deactivated_at TEXT
      );
      CREATE TABLE IF NOT EXISTS recognition_runtime_state (
        singleton INTEGER PRIMARY KEY CHECK(singleton=1), active_corpus_version TEXT,
        last_good_corpus_version TEXT,
        FOREIGN KEY(active_corpus_version) REFERENCES recognition_corpus(version),
        FOREIGN KEY(last_good_corpus_version) REFERENCES recognition_corpus(version)
      );
      INSERT OR IGNORE INTO recognition_runtime_state(singleton) VALUES(1);
    `);
  }

  putObject(bytes: Uint8Array): { sha256: string; path: string; created: boolean } {
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const path = this.objectPath(sha256);
    if (existsSync(path)) {
      if (createHash("sha256").update(readFileSync(path)).digest("hex") !== sha256) throw new Error("existing object failed checksum");
      return { sha256, path, created: false };
    }
    mkdirSync(dirname(path), { recursive: true });
    const temporary = `${path}.${randomUUID()}.tmp`;
    writeFileSync(temporary, bytes, { flag: "wx" });
    renameSync(temporary, path);
    return { sha256, path, created: true };
  }

  createSession(label: string, now = new Date().toISOString()): string {
    return this.createSessionWithId(randomUUID(), label, now);
  }

  createSessionWithId(id: string, label: string, now = new Date().toISOString()): string {
    if (!/^[A-Za-z0-9][A-Za-z0-9:._-]{0,127}$/.test(id)) throw new Error("scan session identifier is invalid");
    this.database.prepare("INSERT INTO recognition_session(id,label,state,created_at,updated_at) VALUES(?,?,?,?,?)")
      .run(id, label.trim() || "Card recognition session", "CAPTURING", now, now);
    return id;
  }

  setSessionState(sessionId: string, state: ScanSessionState, now = new Date().toISOString()): void {
    const result = this.database.prepare("UPDATE recognition_session SET state=?, updated_at=? WHERE id=?").run(state, now, sessionId);
    if (!result.changes) throw new Error("scan session not found");
  }

  reconcileSessionState(sessionId: string, now = new Date().toISOString()): ScanSessionState {
    const row = this.database.prepare(`SELECT s.state,
      (SELECT COUNT(*) FROM recognition_region r JOIN recognition_frame f ON f.id=r.frame_id
        WHERE f.session_id=s.id AND r.state='ACTIVE'
          AND r.revision=(SELECT MAX(r2.revision) FROM recognition_region r2 WHERE r2.frame_id=r.frame_id AND r2.region_order=r.region_order)) regions,
      (SELECT COUNT(*) FROM recognition_job j JOIN recognition_region r ON r.id=j.region_id JOIN recognition_frame f ON f.id=r.frame_id
        WHERE f.session_id=s.id AND j.state IN ('PENDING','LEASED')) pending,
      (SELECT COUNT(*) FROM recognition_resolution x JOIN recognition_region r ON r.id=x.region_id JOIN recognition_frame f ON f.id=r.frame_id
        WHERE f.session_id=s.id AND r.state='ACTIVE'
          AND r.revision=(SELECT MAX(r2.revision) FROM recognition_region r2 WHERE r2.frame_id=r.frame_id AND r2.region_order=r.region_order)
          AND x.revision=(SELECT MAX(x2.revision) FROM recognition_resolution x2 WHERE x2.region_id=x.region_id)) resolved
      FROM recognition_session s WHERE s.id=?`).get(sessionId) as { state: string; regions: number; pending: number; resolved: number } | undefined;
    if (!row) throw new Error("scan session not found");
    if (row.state === "CANCELLED") return "CANCELLED";
    const state: ScanSessionState = row.regions === 0
      ? "CAPTURING"
      : row.pending > 0
        ? "PROCESSING"
        : row.resolved === row.regions
          ? "OFFER_READY"
          : "REVIEW";
    this.setSessionState(sessionId, state, now);
    return state;
  }

  listSessions(limit = 20): ScanSessionSummary[] {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const rows = this.database.prepare("SELECT id FROM recognition_session ORDER BY updated_at DESC,id DESC LIMIT ?").all(safeLimit) as Array<{ id: string }>;
    return rows.map((row) => this.sessionSummary(row.id));
  }

  sessionSummary(sessionId: string): ScanSessionSummary {
    const row = this.database.prepare(`SELECT s.*,
      (SELECT COUNT(*) FROM recognition_frame f WHERE f.session_id=s.id) frames,
      (SELECT COUNT(*) FROM recognition_region r JOIN recognition_frame f ON f.id=r.frame_id WHERE f.session_id=s.id AND r.state='ACTIVE' AND r.revision=(SELECT MAX(r2.revision) FROM recognition_region r2 WHERE r2.frame_id=r.frame_id AND r2.region_order=r.region_order)) regions,
      (SELECT COUNT(*) FROM recognition_job j JOIN recognition_region r ON r.id=j.region_id JOIN recognition_frame f ON f.id=r.frame_id WHERE f.session_id=s.id AND j.state IN ('PENDING','LEASED')) pending,
      (SELECT COUNT(*) FROM recognition_decision d JOIN recognition_region r ON r.id=d.region_id JOIN recognition_frame f ON f.id=r.frame_id WHERE f.session_id=s.id AND d.status='REVIEW') review_count,
      (SELECT COUNT(*) FROM recognition_decision d JOIN recognition_region r ON r.id=d.region_id JOIN recognition_frame f ON f.id=r.frame_id WHERE f.session_id=s.id AND d.status='ACCEPTED') accepted,
      (SELECT COUNT(*) FROM recognition_decision d JOIN recognition_region r ON r.id=d.region_id JOIN recognition_frame f ON f.id=r.frame_id WHERE f.session_id=s.id AND d.status='ABSTAINED') abstained,
      (SELECT COUNT(*) FROM recognition_decision d JOIN recognition_region r ON r.id=d.region_id JOIN recognition_frame f ON f.id=r.frame_id WHERE f.session_id=s.id AND d.status='FAILED') failed
      FROM recognition_session s WHERE s.id=?`).get(sessionId) as Record<string, string | number | null> | undefined;
    if (!row) throw new Error("scan session not found");
    return {
      id: String(row.id), label: String(row.label), state: String(row.state) as ScanSessionState,
      createdAt: String(row.created_at), updatedAt: String(row.updated_at),
      counts: { frames: Number(row.frames), regions: Number(row.regions), pending: Number(row.pending), review: Number(row.review_count), accepted: Number(row.accepted), abstained: Number(row.abstained), failed: Number(row.failed) },
    };
  }

  sessionItems(sessionId: string): Array<{ frameId: string; regionId: string; objectSha256: string; status: string; decision: RecognitionDecision | null; resolved: boolean }> {
    const rows = this.database.prepare(`SELECT f.id frame_id,r.id region_id,f.object_sha256,
      (SELECT d.payload_json FROM recognition_decision d WHERE d.region_id=r.id ORDER BY d.rowid DESC LIMIT 1) decision_json,
      EXISTS(SELECT 1 FROM recognition_resolution x WHERE x.region_id=r.id) resolved
      FROM recognition_region r JOIN recognition_frame f ON f.id=r.frame_id
      WHERE f.session_id=? AND r.state='ACTIVE' AND r.revision=(SELECT MAX(r2.revision) FROM recognition_region r2 WHERE r2.frame_id=r.frame_id AND r2.region_order=r.region_order)
      ORDER BY f.sequence,r.region_order`).all(sessionId) as Array<{ frame_id: string; region_id: string; object_sha256: string; decision_json: string | null; resolved: number }>;
    return rows.map((row) => {
      const decision = row.decision_json ? JSON.parse(row.decision_json) as RecognitionDecision : null;
      return { frameId: row.frame_id, regionId: row.region_id, objectSha256: row.object_sha256, status: decision?.status ?? "PROCESSING", decision, resolved: Boolean(row.resolved) };
    });
  }

  frameObject(frameId: string): { path: string; mediaType: string; sha256: string } {
    const row = this.database.prepare("SELECT object_sha256,media_type FROM recognition_frame WHERE id=?").get(frameId) as { object_sha256: string; media_type: string } | undefined;
    if (!row) throw new Error("scan frame not found");
    return { path: this.objectPath(row.object_sha256), mediaType: row.media_type, sha256: row.object_sha256 };
  }

  resolveRegion(input: { sessionId: string; regionId: string; canonicalPrintingId: string; condition: string; finish: string; quantity: number; priceSnapshotId: string; priceSnapshotAt: string; buyingPresetId: string; offerCents: number; currency: string; resolvedBy: string; now?: string }): RecognitionDecision {
    const allowedConditions = new Set(["NEAR_MINT", "LIGHTLY_PLAYED", "MODERATELY_PLAYED", "HEAVILY_PLAYED", "DAMAGED"]);
    if (!allowedConditions.has(input.condition)) throw new Error("condition is invalid");
    if (!input.finish.trim() || !input.priceSnapshotId.trim() || !input.buyingPresetId.trim()) throw new Error("finish, price snapshot, and buying preset are required");
    if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0 || !Number.isSafeInteger(input.offerCents) || input.offerCents < 0) throw new Error("quantity or offer is invalid");
    if (!Number.isFinite(Date.parse(input.priceSnapshotAt))) throw new Error("price snapshot timestamp is invalid");
    const row = this.database.prepare(`SELECT d.payload_json FROM recognition_decision d JOIN recognition_region r ON r.id=d.region_id JOIN recognition_frame f ON f.id=r.frame_id
      WHERE d.region_id=? AND f.session_id=? ORDER BY d.rowid DESC LIMIT 1`).get(input.regionId, input.sessionId) as { payload_json: string } | undefined;
    if (!row) throw new Error("recognition decision not found");
    const prior = JSON.parse(row.payload_json) as RecognitionDecision;
    const selected = prior.candidates.find((candidate) => candidate.canonicalPrintingId === input.canonicalPrintingId);
    if (!selected) throw new Error("selected candidate was not produced by recognition");
    const now = input.now ?? new Date().toISOString();
    const decision: RecognitionDecision = { ...prior, decisionId: randomUUID(), status: "ACCEPTED", selectedCandidate: selected, decidedBy: "OPERATOR", reason: "Operator reviewed identity and confirmed material fields.", createdAt: now };
    const revisionRow = this.database.prepare("SELECT COALESCE(MAX(revision),0)+1 revision FROM recognition_resolution WHERE region_id=?").get(input.regionId) as { revision: number };
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare("INSERT INTO recognition_decision(id,region_id,status,payload_json,created_at) VALUES(?,?,?,?,?)").run(decision.decisionId, decision.regionId, decision.status, JSON.stringify(decision), now);
      this.database.prepare(`INSERT INTO recognition_resolution(id,region_id,revision,decision_id,condition_code,finish,quantity,price_snapshot_id,price_snapshot_at,buying_preset_id,offer_cents,currency,resolved_by,resolved_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(randomUUID(), input.regionId, revisionRow.revision, decision.decisionId, input.condition, input.finish.trim(), input.quantity, input.priceSnapshotId.trim(), input.priceSnapshotAt, input.buyingPresetId.trim(), input.offerCents, input.currency.trim().toUpperCase(), input.resolvedBy, now);
      this.database.exec("COMMIT");
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
    this.reconcileSessionState(input.sessionId, now);
    return decision;
  }

  offerDraft(sessionId: string) {
    return this.database.prepare(`SELECT r.id region_id,d.payload_json,x.condition_code,x.finish,x.quantity,x.price_snapshot_id,x.price_snapshot_at,x.buying_preset_id,x.offer_cents,x.currency,x.resolved_by,x.resolved_at
      FROM recognition_resolution x JOIN recognition_region r ON r.id=x.region_id JOIN recognition_frame f ON f.id=r.frame_id JOIN recognition_decision d ON d.id=x.decision_id
      WHERE f.session_id=? AND x.revision=(SELECT MAX(x2.revision) FROM recognition_resolution x2 WHERE x2.region_id=x.region_id)
      ORDER BY f.sequence,r.region_order`).all(sessionId).map((raw) => {
        const row = raw as Record<string, string | number>;
        const decision = JSON.parse(String(row.payload_json)) as RecognitionDecision;
        return { regionId: String(row.region_id), candidate: decision.selectedCandidate, condition: String(row.condition_code), finish: String(row.finish), quantity: Number(row.quantity), priceSnapshotId: String(row.price_snapshot_id), priceSnapshotAt: String(row.price_snapshot_at), buyingPresetId: String(row.buying_preset_id), offerCents: Number(row.offer_cents), currency: String(row.currency), resolvedBy: String(row.resolved_by), resolvedAt: String(row.resolved_at) };
      });
  }

  addFrame(frame: ScanFrame): { status: "IMPORTED" | "ALREADY_IMPORTED"; region: DetectedCardRegion } {
    validateFrame(frame);
    const existing = this.database.prepare("SELECT object_sha256 FROM recognition_frame WHERE id=?").get(frame.frameId) as { object_sha256: string } | undefined;
    if (existing) {
      if (existing.object_sha256 !== frame.objectSha256) throw new Error("frame identifier collision");
      return { status: "ALREADY_IMPORTED", region: this.activeRegions(frame.frameId)[0] };
    }
    if (!existsSync(this.objectPath(frame.objectSha256))) throw new Error("frame object is not durable");
    const region = fullFrameRegion(frame.frameId);
    const now = new Date().toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare(`INSERT INTO recognition_frame(id,session_id,sequence,side,object_sha256,media_type,byte_length,captured_at,paired_frame_id)
        VALUES(?,?,?,?,?,?,?,?,?)`).run(frame.frameId, frame.sessionId, frame.sequence, frame.side, frame.objectSha256, frame.mediaType, frame.byteLength, frame.capturedAt, frame.pairedFrameId);
      this.insertRegion(region, now);
      this.database.prepare("INSERT INTO recognition_job(id,region_id,state,updated_at) VALUES(?,?,?,?)").run(randomUUID(), region.regionId, "PENDING", now);
      this.database.exec("COMMIT");
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
    return { status: "IMPORTED", region };
  }

  private insertRegion(region: DetectedCardRegion, now: string): void {
    validateRegionGeometry(region.geometry);
    this.database.prepare(`INSERT INTO recognition_region(id,frame_id,region_order,revision,state,geometry_json,parent_region_id,correction_reason,created_at)
      VALUES(?,?,?,?,?,?,?,?,?)`).run(region.regionId, region.frameId, region.order, region.revision, region.state, JSON.stringify(region.geometry), region.parentRegionId, region.correctionReason, now);
  }

  reviseRegion(regionId: string, geometry: DetectedCardRegion["geometry"], reason: string, state: DetectedCardRegion["state"] = "ACTIVE"): DetectedCardRegion {
    validateRegionGeometry(geometry);
    const prior = this.database.prepare("SELECT * FROM recognition_region WHERE id=?").get(regionId) as Record<string, string | number | null> | undefined;
    if (!prior) throw new Error("region not found");
    const revision = Number(prior.revision) + 1;
    const next: DetectedCardRegion = {
      regionId: `${String(prior.frame_id)}:region:${Number(prior.region_order)}:r${revision}`,
      frameId: String(prior.frame_id), order: Number(prior.region_order), revision, state,
      geometry, parentRegionId: regionId, correctionReason: reason,
    };
    const now = new Date().toISOString();
    this.insertRegion(next, now);
    this.database.prepare("INSERT INTO recognition_job(id,region_id,state,updated_at) VALUES(?,?,?,?)").run(randomUUID(), next.regionId, state === "ACTIVE" ? "PENDING" : "CANCELLED", now);
    return next;
  }

  activeRegions(frameId: string): DetectedCardRegion[] {
    const rows = this.database.prepare(`SELECT r.* FROM recognition_region r JOIN (
      SELECT frame_id,region_order,MAX(revision) revision FROM recognition_region WHERE frame_id=? GROUP BY frame_id,region_order
    ) latest ON latest.frame_id=r.frame_id AND latest.region_order=r.region_order AND latest.revision=r.revision
    WHERE r.state='ACTIVE' ORDER BY r.region_order`).all(frameId) as Array<Record<string, string | number | null>>;
    return rows.map((row) => ({ regionId: String(row.id), frameId: String(row.frame_id), order: Number(row.region_order), revision: Number(row.revision), state: "ACTIVE", geometry: JSON.parse(String(row.geometry_json)), parentRegionId: row.parent_region_id ? String(row.parent_region_id) : null, correctionReason: row.correction_reason ? String(row.correction_reason) : null }));
  }

  acquireJob(owner: string, leaseMs: number, now = new Date()): { jobId: string; regionId: string } | null {
    const timestamp = now.toISOString();
    const expiry = new Date(now.getTime() + leaseMs).toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const row = this.database.prepare(`SELECT id,region_id FROM recognition_job WHERE state='PENDING' OR (state='LEASED' AND lease_expires_at<=?) ORDER BY updated_at,id LIMIT 1`).get(timestamp) as { id: string; region_id: string } | undefined;
      if (!row) { this.database.exec("COMMIT"); return null; }
      this.database.prepare("UPDATE recognition_job SET state='LEASED',lease_owner=?,lease_expires_at=?,attempts=attempts+1,updated_at=? WHERE id=?").run(owner, expiry, timestamp, row.id);
      this.database.exec("COMMIT");
      return { jobId: row.id, regionId: row.region_id };
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }

  jobContext(jobId: string): { jobId: string; regionId: string; frameId: string; objectSha256: string; objectPath: string } {
    const row = this.database.prepare(`SELECT j.id job_id,j.region_id,r.frame_id,f.object_sha256
      FROM recognition_job j JOIN recognition_region r ON r.id=j.region_id JOIN recognition_frame f ON f.id=r.frame_id
      WHERE j.id=?`).get(jobId) as { job_id: string; region_id: string; frame_id: string; object_sha256: string } | undefined;
    if (!row) throw new Error("recognition job not found");
    return { jobId: row.job_id, regionId: row.region_id, frameId: row.frame_id, objectSha256: row.object_sha256, objectPath: this.objectPath(row.object_sha256) };
  }

  failJob(jobId: string, owner: string, message: string, now = new Date().toISOString()): void {
    const context = this.database.prepare(`SELECT f.session_id FROM recognition_job j JOIN recognition_region r ON r.id=j.region_id JOIN recognition_frame f ON f.id=r.frame_id WHERE j.id=?`)
      .get(jobId) as { session_id: string } | undefined;
    const result = this.database.prepare("UPDATE recognition_job SET state='FAILED',last_error=?,lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND state='LEASED' AND lease_owner=?")
      .run(message.slice(0, 500), now, jobId, owner);
    if (!result.changes) throw new Error("job lease is not owned");
    if (context) this.reconcileSessionState(context.session_id, now);
  }

  completeJob(jobId: string, owner: string, decision: RecognitionDecision): void {
    const row = this.database.prepare(`SELECT j.region_id,j.state,j.lease_owner,f.session_id FROM recognition_job j JOIN recognition_region r ON r.id=j.region_id JOIN recognition_frame f ON f.id=r.frame_id WHERE j.id=?`)
      .get(jobId) as { region_id: string; state: string; lease_owner: string | null; session_id: string } | undefined;
    if (!row || row.state !== "LEASED" || row.lease_owner !== owner || row.region_id !== decision.regionId) throw new Error("job lease is not owned");
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database.prepare("INSERT INTO recognition_decision(id,region_id,status,payload_json,created_at) VALUES(?,?,?,?,?)").run(decision.decisionId, decision.regionId, decision.status, JSON.stringify(decision), decision.createdAt);
      this.database.prepare("UPDATE recognition_job SET state='COMPLETED',lease_owner=NULL,lease_expires_at=NULL,updated_at=? WHERE id=?").run(decision.createdAt, jobId);
      this.database.exec("COMMIT");
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
    this.reconcileSessionState(row.session_id, decision.createdAt);
  }

  activateCorpus(manifest: CorpusManifest, now = new Date().toISOString()): VerifiedCorpusManifest {
    const verified = verifyCorpusManifest(manifest);
    verifyCorpusObjects(manifest, (sha) => this.objectPath(sha));
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const current = this.database.prepare("SELECT active_corpus_version FROM recognition_runtime_state WHERE singleton=1").get() as { active_corpus_version: string | null };
      this.database.prepare("INSERT OR IGNORE INTO recognition_corpus(version,manifest_sha256,manifest_json) VALUES(?,?,?)").run(manifest.corpusVersion, verified.manifestSha256, JSON.stringify(manifest));
      if (current.active_corpus_version && current.active_corpus_version !== manifest.corpusVersion) this.database.prepare("UPDATE recognition_corpus SET deactivated_at=? WHERE version=?").run(now, current.active_corpus_version);
      this.database.prepare("UPDATE recognition_corpus SET activated_at=?,deactivated_at=NULL WHERE version=?").run(now, manifest.corpusVersion);
      this.database.prepare("UPDATE recognition_runtime_state SET last_good_corpus_version=COALESCE(active_corpus_version,?),active_corpus_version=? WHERE singleton=1").run(manifest.corpusVersion, manifest.corpusVersion);
      this.database.exec("COMMIT");
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
    return verified;
  }

  rollbackCorpus(now = new Date().toISOString()): string {
    const state = this.database.prepare("SELECT active_corpus_version,last_good_corpus_version FROM recognition_runtime_state WHERE singleton=1").get() as { active_corpus_version: string | null; last_good_corpus_version: string | null };
    if (!state.last_good_corpus_version) throw new Error("no last-good corpus is available");
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (state.active_corpus_version) this.database.prepare("UPDATE recognition_corpus SET deactivated_at=? WHERE version=?").run(now, state.active_corpus_version);
      this.database.prepare("UPDATE recognition_corpus SET activated_at=?,deactivated_at=NULL WHERE version=?").run(now, state.last_good_corpus_version);
      this.database.prepare("UPDATE recognition_runtime_state SET active_corpus_version=?,last_good_corpus_version=? WHERE singleton=1").run(state.last_good_corpus_version, state.active_corpus_version);
      this.database.exec("COMMIT");
      return state.last_good_corpus_version;
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }
}
