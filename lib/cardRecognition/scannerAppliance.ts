import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { ScanFrame } from "@/lib/cardRecognition/contracts";
import type { CardRecognitionRepository } from "@/lib/cardRecognition/repository";

export const scannerAppliancePlatforms = ["MACOS", "WINDOWS"] as const;
export const scannerApplianceAdapters = ["MACOS_ICA", "WINDOWS_PAPERSTREAM", "MANAGED_CAPTURE"] as const;
export type ScannerAppliancePlatform = typeof scannerAppliancePlatforms[number];
export type ScannerApplianceAdapter = typeof scannerApplianceAdapters[number];
export type ScannerApplianceState = "READY" | "SETUP_REQUIRED" | "OFFLINE" | "REVOKED";
export type ScannerApplianceCommandKind = "START" | "CANCEL";
export type ScannerApplianceCommandStatus = "QUEUED" | "CLAIMED" | "SUCCEEDED" | "FAILED" | "CANCELLED";

const pairingLifetimeMs = 10 * 60 * 1_000;
const pairingAttemptWindowMs = 60 * 1_000;
const onlineWindowMs = 15 * 1_000;
export const scannerApplianceMaxFrameBytes = 25 * 1024 * 1024;
export const scannerApplianceMaxFrames = 500;
const allowedMediaTypes = new Set<ScanFrame["mediaType"]>(["image/jpeg", "image/png", "image/tiff"]);
const pairingAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type ScannerApplianceCapabilities = {
  frontOnly: true;
  captureCommandConfigured: boolean;
  scannerModel: string | null;
  driverName: string | null;
  driverVersion: string | null;
};

export type ScannerApplianceView = {
  id: string;
  label: string;
  platform: ScannerAppliancePlatform;
  adapter: ScannerApplianceAdapter;
  agentVersion: string;
  capabilities: ScannerApplianceCapabilities;
  state: ScannerApplianceState;
  driverReady: boolean;
  lastSeenAt: string | null;
  lastError: string | null;
  pairedAt: string;
  revokedAt: string | null;
  activeCommand: ScannerApplianceCommandView | null;
};

export type ScannerApplianceCommandView = {
  id: string;
  applianceId: string;
  sessionId: string;
  kind: ScannerApplianceCommandKind;
  status: ScannerApplianceCommandStatus;
  payload: { frontOnly: true; maxFrames: number };
  uploadedFrames: number;
  createdAt: string;
  claimedAt: string | null;
  completedAt: string | null;
  error: string | null;
};

type SqlRow = Record<string, string | number | null>;

function hashSecret(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function cleanString(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maximum) : null;
}

function normalizeCapabilities(value: unknown): ScannerApplianceCapabilities {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    frontOnly: true,
    captureCommandConfigured: input.captureCommandConfigured === true,
    scannerModel: cleanString(input.scannerModel, 120),
    driverName: cleanString(input.driverName, 120),
    driverVersion: cleanString(input.driverVersion, 80),
  };
}

function normalizePlatform(value: unknown): ScannerAppliancePlatform {
  const platform = String(value ?? "").trim().toUpperCase();
  if (!scannerAppliancePlatforms.includes(platform as ScannerAppliancePlatform)) throw new Error("scanner platform is unsupported");
  return platform as ScannerAppliancePlatform;
}

function normalizeAdapter(value: unknown, platform: ScannerAppliancePlatform): ScannerApplianceAdapter {
  const adapter = String(value ?? "").trim().toUpperCase();
  if (!scannerApplianceAdapters.includes(adapter as ScannerApplianceAdapter)) throw new Error("scanner adapter is unsupported");
  if (adapter === "MACOS_ICA" && platform !== "MACOS") throw new Error("macOS ICA adapter requires macOS");
  if (adapter === "WINDOWS_PAPERSTREAM" && platform !== "WINDOWS") throw new Error("PaperStream adapter requires Windows");
  return adapter as ScannerApplianceAdapter;
}

function normalizePairingCode(value: string): string {
  return value.trim().toUpperCase().replaceAll("-", "");
}

function createPairingCode(): string {
  const bytes = randomBytes(16);
  let body = "";
  for (let index = 0; index < 16; index += 1) body += pairingAlphabet[bytes[index] % pairingAlphabet.length];
  return `PHR-${body.slice(0, 4)}-${body.slice(4, 8)}-${body.slice(8, 12)}-${body.slice(12)}`;
}

function validateAgentToken(token: string): void {
  if (!/^[A-Za-z0-9_-]{40,64}$/.test(token)) throw new Error("scanner appliance authentication failed");
}

function parseCapabilities(value: string): ScannerApplianceCapabilities {
  try { return normalizeCapabilities(JSON.parse(value)); }
  catch { return normalizeCapabilities({}); }
}

export class ScannerApplianceRepository {
  constructor(private readonly database: DatabaseSync) {
    this.migrate();
  }

  private migrate(): void {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS recognition_appliance_pairing (
        id TEXT PRIMARY KEY,
        code_hash TEXT NOT NULL UNIQUE,
        created_by_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used_at TEXT
      );
      CREATE TABLE IF NOT EXISTS recognition_appliance_pair_attempt (
        code_hash TEXT PRIMARY KEY,
        attempts INTEGER NOT NULL,
        window_started_at TEXT NOT NULL,
        last_attempt_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS recognition_appliance (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        platform TEXT NOT NULL,
        adapter TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        agent_version TEXT NOT NULL,
        capabilities_json TEXT NOT NULL,
        driver_ready INTEGER NOT NULL DEFAULT 0,
        last_seen_at TEXT,
        last_error TEXT,
        paired_at TEXT NOT NULL,
        revoked_at TEXT
      );
      CREATE TABLE IF NOT EXISTS recognition_appliance_command (
        id TEXT PRIMARY KEY,
        appliance_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        kind TEXT NOT NULL,
        status TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        uploaded_frames INTEGER NOT NULL DEFAULT 0,
        created_by_user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        claimed_at TEXT,
        completed_at TEXT,
        result_json TEXT,
        error TEXT,
        FOREIGN KEY(appliance_id) REFERENCES recognition_appliance(id),
        FOREIGN KEY(session_id) REFERENCES recognition_session(id)
      );
      CREATE INDEX IF NOT EXISTS recognition_appliance_command_queue
        ON recognition_appliance_command(appliance_id,status,kind,created_at);
    `);
  }

  createPairing(createdByUserId: string, now = new Date()): { code: string; expiresAt: string } {
    const actor = createdByUserId.trim();
    if (!actor) throw new Error("permanent administrator identity is required");
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + pairingLifetimeMs).toISOString();
    const code = createPairingCode();
    this.database.prepare(`INSERT INTO recognition_appliance_pairing(id,code_hash,created_by_user_id,created_at,expires_at)
      VALUES(?,?,?,?,?)`).run(randomUUID(), hashSecret(normalizePairingCode(code)), actor, createdAt, expiresAt);
    return { code, expiresAt };
  }

  redeemPairing(input: {
    code: string;
    label: string;
    platform: unknown;
    adapter: unknown;
    agentVersion: string;
    capabilities: unknown;
    now?: Date;
  }): { appliance: ScannerApplianceView; token: string } {
    const now = input.now ?? new Date();
    const nowIso = now.toISOString();
    const normalizedCode = normalizePairingCode(input.code);
    if (!/^PHR[A-Z2-9]{16}$/.test(normalizedCode)) throw new Error("pairing code is invalid or expired");
    const codeHash = hashSecret(normalizedCode);
    this.recordPairAttempt(now);
    const platform = normalizePlatform(input.platform);
    const adapter = normalizeAdapter(input.adapter, platform);
    const label = input.label.trim().slice(0, 120);
    const agentVersion = input.agentVersion.trim().slice(0, 40);
    if (!label || !agentVersion) throw new Error("scanner label and agent version are required");
    const capabilities = normalizeCapabilities(input.capabilities);
    const token = randomBytes(32).toString("base64url");
    const applianceId = randomUUID();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const pairing = this.database.prepare(`SELECT id,expires_at,used_at FROM recognition_appliance_pairing WHERE code_hash=?`)
        .get(codeHash) as { id: string; expires_at: string; used_at: string | null } | undefined;
      if (!pairing || pairing.used_at || Date.parse(pairing.expires_at) <= now.getTime()) throw new Error("pairing code is invalid or expired");
      this.database.prepare(`INSERT INTO recognition_appliance(
        id,label,platform,adapter,token_hash,agent_version,capabilities_json,driver_ready,last_seen_at,last_error,paired_at
      ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`).run(
        applianceId, label, platform, adapter, hashSecret(token), agentVersion, JSON.stringify(capabilities),
        capabilities.captureCommandConfigured ? 1 : 0, nowIso, capabilities.captureCommandConfigured ? null : "Capture command is not configured.", nowIso,
      );
      const used = this.database.prepare("UPDATE recognition_appliance_pairing SET used_at=? WHERE id=? AND used_at IS NULL").run(nowIso, pairing.id);
      if (!used.changes) throw new Error("pairing code is invalid or expired");
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return { appliance: this.getAppliance(applianceId, now), token };
  }

  private recordPairAttempt(now: Date): void {
    const codeHash = "GLOBAL_PAIRING_WINDOW";
    const row = this.database.prepare("SELECT attempts,window_started_at FROM recognition_appliance_pair_attempt WHERE code_hash=?")
      .get(codeHash) as { attempts: number; window_started_at: string } | undefined;
    const nowIso = now.toISOString();
    if (!row || now.getTime() - Date.parse(row.window_started_at) >= pairingAttemptWindowMs) {
      this.database.prepare(`INSERT INTO recognition_appliance_pair_attempt(code_hash,attempts,window_started_at,last_attempt_at)
        VALUES(?,?,?,?) ON CONFLICT(code_hash) DO UPDATE SET attempts=excluded.attempts,window_started_at=excluded.window_started_at,last_attempt_at=excluded.last_attempt_at`)
        .run(codeHash, 1, nowIso, nowIso);
      return;
    }
    if (row.attempts >= 60) throw new Error("pairing code is invalid or expired");
    this.database.prepare("UPDATE recognition_appliance_pair_attempt SET attempts=attempts+1,last_attempt_at=? WHERE code_hash=?").run(nowIso, codeHash);
  }

  authenticate(token: string): { applianceId: string } {
    validateAgentToken(token);
    const row = this.database.prepare("SELECT id,revoked_at FROM recognition_appliance WHERE token_hash=?")
      .get(hashSecret(token)) as { id: string; revoked_at: string | null } | undefined;
    if (!row || row.revoked_at) throw new Error("scanner appliance authentication failed");
    return { applianceId: row.id };
  }

  heartbeat(input: {
    applianceId: string;
    driverReady: boolean;
    capabilities: unknown;
    lastError?: unknown;
    agentVersion?: unknown;
    now?: Date;
  }): ScannerApplianceView {
    const now = input.now ?? new Date();
    const capabilities = normalizeCapabilities(input.capabilities);
    const lastError = input.driverReady ? null : cleanString(input.lastError, 500) ?? "Scanner adapter is not ready.";
    const agentVersion = cleanString(input.agentVersion, 40);
    const result = this.database.prepare(`UPDATE recognition_appliance SET
      driver_ready=?,capabilities_json=?,last_seen_at=?,last_error=?,agent_version=COALESCE(?,agent_version)
      WHERE id=? AND revoked_at IS NULL`).run(
        input.driverReady ? 1 : 0, JSON.stringify(capabilities), now.toISOString(), lastError, agentVersion, input.applianceId,
      );
    if (!result.changes) throw new Error("scanner appliance authentication failed");
    return this.getAppliance(input.applianceId, now);
  }

  listAppliances(now = new Date()): ScannerApplianceView[] {
    const rows = this.database.prepare("SELECT id FROM recognition_appliance ORDER BY paired_at DESC,id DESC").all() as Array<{ id: string }>;
    return rows.map((row) => this.getAppliance(row.id, now));
  }

  getAppliance(applianceId: string, now = new Date()): ScannerApplianceView {
    const row = this.database.prepare("SELECT * FROM recognition_appliance WHERE id=?").get(applianceId) as SqlRow | undefined;
    if (!row) throw new Error("scanner appliance not found");
    const lastSeenAt = row.last_seen_at ? String(row.last_seen_at) : null;
    const revokedAt = row.revoked_at ? String(row.revoked_at) : null;
    const driverReady = Boolean(row.driver_ready);
    const online = lastSeenAt !== null && now.getTime() - Date.parse(lastSeenAt) <= onlineWindowMs;
    const state: ScannerApplianceState = revokedAt ? "REVOKED" : !online ? "OFFLINE" : driverReady ? "READY" : "SETUP_REQUIRED";
    const command = this.database.prepare(`SELECT * FROM recognition_appliance_command
      WHERE appliance_id=? AND status IN ('QUEUED','CLAIMED') ORDER BY CASE kind WHEN 'CANCEL' THEN 0 ELSE 1 END,created_at LIMIT 1`)
      .get(applianceId) as SqlRow | undefined;
    return {
      id: String(row.id),
      label: String(row.label),
      platform: String(row.platform) as ScannerAppliancePlatform,
      adapter: String(row.adapter) as ScannerApplianceAdapter,
      agentVersion: String(row.agent_version),
      capabilities: parseCapabilities(String(row.capabilities_json)),
      state,
      driverReady,
      lastSeenAt,
      lastError: row.last_error ? String(row.last_error) : null,
      pairedAt: String(row.paired_at),
      revokedAt,
      activeCommand: command ? this.commandFromRow(command) : null,
    };
  }

  revoke(applianceId: string, now = new Date()): ScannerApplianceView {
    const nowIso = now.toISOString();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const activeCommand = this.database.prepare(`SELECT 1 FROM recognition_appliance_command
        WHERE appliance_id=? AND status IN ('QUEUED','CLAIMED') LIMIT 1`).get(applianceId);
      if (activeCommand) throw new Error("cancel the active scanner command before revoking this appliance");
      const changed = this.database.prepare("UPDATE recognition_appliance SET revoked_at=? WHERE id=? AND revoked_at IS NULL").run(nowIso, applianceId);
      if (!changed.changes && !this.database.prepare("SELECT 1 FROM recognition_appliance WHERE id=?").get(applianceId)) throw new Error("scanner appliance not found");
      this.database.exec("COMMIT");
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
    return this.getAppliance(applianceId, now);
  }

  queueStart(input: { applianceId: string; sessionId: string; createdByUserId: string; now?: Date }): ScannerApplianceCommandView {
    const now = input.now ?? new Date();
    const actor = input.createdByUserId.trim();
    if (!actor) throw new Error("operator identity is required");
    const commandId = randomUUID();
    const payload = { frontOnly: true as const, maxFrames: scannerApplianceMaxFrames };
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const appliance = this.database.prepare("SELECT revoked_at FROM recognition_appliance WHERE id=?").get(input.applianceId) as { revoked_at: string | null } | undefined;
      if (!appliance) throw new Error("scanner appliance not found");
      if (appliance.revoked_at) throw new Error("scanner appliance is revoked");
      const session = this.database.prepare(`SELECT state,
        (SELECT COUNT(*) FROM recognition_frame WHERE session_id=recognition_session.id) frame_count
        FROM recognition_session WHERE id=?`).get(input.sessionId) as { state: string; frame_count: number } | undefined;
      if (!session) throw new Error("scan session not found");
      if (session.state !== "CAPTURING") throw new Error("only a capturing session can start the scanner");
      if (session.frame_count !== 0) throw new Error("scanner appliance Start requires an empty capturing session");
      const existing = this.database.prepare(`SELECT id FROM recognition_appliance_command
        WHERE (appliance_id=? OR session_id=?) AND kind='START' AND status IN ('QUEUED','CLAIMED') LIMIT 1`)
        .get(input.applianceId, input.sessionId);
      if (existing) throw new Error("the appliance or session already has an active scan command");
      this.database.prepare(`INSERT INTO recognition_appliance_command(
        id,appliance_id,session_id,kind,status,payload_json,created_by_user_id,created_at
      ) VALUES(?,?,?,?,?,?,?,?)`).run(
        commandId, input.applianceId, input.sessionId, "START", "QUEUED", JSON.stringify(payload), actor, now.toISOString(),
      );
      this.database.exec("COMMIT");
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
    return this.getCommand(commandId);
  }

  queueCancel(input: { applianceId: string; sessionId: string; createdByUserId: string; now?: Date }): ScannerApplianceCommandView {
    const now = input.now ?? new Date();
    const actor = input.createdByUserId.trim();
    if (!actor) throw new Error("operator identity is required");
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const appliance = this.database.prepare("SELECT revoked_at FROM recognition_appliance WHERE id=?").get(input.applianceId) as { revoked_at: string | null } | undefined;
      if (!appliance) throw new Error("scanner appliance not found");
      if (appliance.revoked_at) throw new Error("scanner appliance is revoked");
      if (!this.database.prepare("SELECT 1 FROM recognition_session WHERE id=?").get(input.sessionId)) throw new Error("scan session not found");
      const existing = this.database.prepare(`SELECT * FROM recognition_appliance_command
        WHERE appliance_id=? AND session_id=? AND kind='CANCEL' AND status IN ('QUEUED','CLAIMED') ORDER BY created_at LIMIT 1`)
        .get(input.applianceId, input.sessionId) as SqlRow | undefined;
      if (existing) {
        this.database.exec("COMMIT");
        return this.commandFromRow(existing);
      }
      this.database.prepare(`UPDATE recognition_appliance_command SET status='CANCELLED',completed_at=?,error='Cancelled before agent claim.'
        WHERE appliance_id=? AND session_id=? AND kind='START' AND status='QUEUED'`).run(now.toISOString(), input.applianceId, input.sessionId);
      const id = randomUUID();
      const payload = { frontOnly: true as const, maxFrames: scannerApplianceMaxFrames };
      this.database.prepare(`INSERT INTO recognition_appliance_command(
        id,appliance_id,session_id,kind,status,payload_json,created_by_user_id,created_at
      ) VALUES(?,?,?,?,?,?,?,?)`).run(id, input.applianceId, input.sessionId, "CANCEL", "QUEUED", JSON.stringify(payload), actor, now.toISOString());
      this.database.exec("COMMIT");
      return this.getCommand(id);
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }

  poll(input: { applianceId: string; currentCommandId?: string | null; now?: Date }): ScannerApplianceCommandView | null {
    const now = input.now ?? new Date();
    this.database.exec("BEGIN IMMEDIATE");
    try {
      if (!this.database.prepare("SELECT 1 FROM recognition_appliance WHERE id=? AND revoked_at IS NULL").get(input.applianceId)) {
        throw new Error("scanner appliance authentication failed");
      }
      let row: SqlRow | undefined;
      if (input.currentCommandId) {
        const current = this.database.prepare(`SELECT * FROM recognition_appliance_command
          WHERE id=? AND appliance_id=? AND kind='START' AND status='CLAIMED'`)
          .get(input.currentCommandId, input.applianceId) as SqlRow | undefined;
        if (current) {
          row = this.database.prepare(`SELECT * FROM recognition_appliance_command
            WHERE appliance_id=? AND session_id=? AND kind='CANCEL' AND status='QUEUED' ORDER BY created_at LIMIT 1`)
            .get(input.applianceId, current.session_id) as SqlRow | undefined;
          if (!row) {
            this.database.exec("COMMIT");
            return this.commandFromRow(current);
          }
        }
      } else {
        row = this.database.prepare(`SELECT * FROM recognition_appliance_command
          WHERE appliance_id=? AND status='QUEUED' ORDER BY CASE kind WHEN 'CANCEL' THEN 0 ELSE 1 END,created_at LIMIT 1`)
          .get(input.applianceId) as SqlRow | undefined;
      }
      if (!row) { this.database.exec("COMMIT"); return null; }
      if (row.kind === "START") {
        const session = this.database.prepare("SELECT state FROM recognition_session WHERE id=?").get(row.session_id) as { state: string } | undefined;
        if (!session || session.state !== "CAPTURING") {
          this.database.prepare(`UPDATE recognition_appliance_command SET status='CANCELLED',completed_at=?,error='Recognition session is no longer capturing.' WHERE id=?`)
            .run(now.toISOString(), row.id);
          this.database.exec("COMMIT");
          return null;
        }
      }
      const claimed = this.database.prepare("UPDATE recognition_appliance_command SET status='CLAIMED',claimed_at=? WHERE id=? AND status='QUEUED'")
        .run(now.toISOString(), row.id);
      if (!claimed.changes) { this.database.exec("COMMIT"); return null; }
      this.database.exec("COMMIT");
      return this.getCommand(String(row.id));
    } catch (error) { this.database.exec("ROLLBACK"); throw error; }
  }

  report(input: {
    applianceId: string;
    commandId: string;
    outcome: "RUNNING" | "SUCCEEDED" | "FAILED";
    error?: unknown;
    result?: unknown;
    now?: Date;
  }): ScannerApplianceCommandView {
    const row = this.database.prepare("SELECT kind,status FROM recognition_appliance_command WHERE id=? AND appliance_id=?")
      .get(input.commandId, input.applianceId) as { kind: string; status: string } | undefined;
    if (!row || row.status !== "CLAIMED") throw new Error("scanner command is not active");
    if (input.outcome === "RUNNING") return this.getCommand(input.commandId);
    const command = this.getCommand(input.commandId);
    if (input.outcome === "SUCCEEDED" && row.kind === "START" && command.uploadedFrames === 0) throw new Error("a completed scan must upload at least one front image");
    let resultJson: string | null = null;
    if (input.result !== undefined) {
      resultJson = JSON.stringify(input.result);
      if (resultJson.length > 4_096) throw new Error("scanner command result is too large");
    }
    const error = input.outcome === "FAILED" ? cleanString(input.error, 500) ?? "Scanner command failed." : null;
    this.database.prepare(`UPDATE recognition_appliance_command SET status=?,completed_at=?,result_json=?,error=? WHERE id=? AND status='CLAIMED'`)
      .run(input.outcome === "SUCCEEDED" ? "SUCCEEDED" : "FAILED", (input.now ?? new Date()).toISOString(), resultJson, error, input.commandId);
    return this.getCommand(input.commandId);
  }

  getCommand(commandId: string): ScannerApplianceCommandView {
    const row = this.database.prepare("SELECT * FROM recognition_appliance_command WHERE id=?").get(commandId) as SqlRow | undefined;
    if (!row) throw new Error("scanner command not found");
    return this.commandFromRow(row);
  }

  ingestFrontFrame(input: {
    recognition: CardRecognitionRepository;
    applianceId: string;
    commandId: string;
    sequence: number;
    mediaType: string;
    bytes: Uint8Array;
    declaredSha256: string;
    capturedAt: string;
  }): { status: "IMPORTED" | "ALREADY_IMPORTED"; frameId: string; sha256: string } {
    if (!Number.isSafeInteger(input.sequence) || input.sequence < 1 || input.sequence > scannerApplianceMaxFrames) throw new Error("frame sequence is outside the allowed range");
    if (!allowedMediaTypes.has(input.mediaType as ScanFrame["mediaType"])) throw new Error("frame media type is unsupported");
    if (input.bytes.byteLength < 1 || input.bytes.byteLength > scannerApplianceMaxFrameBytes) throw new Error("frame byte length is outside the allowed range");
    if (!/^[a-f0-9]{64}$/.test(input.declaredSha256)) throw new Error("frame checksum is invalid");
    if (!Number.isFinite(Date.parse(input.capturedAt))) throw new Error("frame capture time is invalid");
    const sha256 = hashSecret(Buffer.from(input.bytes));
    if (sha256 !== input.declaredSha256) throw new Error("frame checksum did not match the uploaded bytes");
    const command = this.database.prepare(`SELECT c.*,a.revoked_at,s.state session_state FROM recognition_appliance_command c
      JOIN recognition_appliance a ON a.id=c.appliance_id JOIN recognition_session s ON s.id=c.session_id
      WHERE c.id=? AND c.appliance_id=?`).get(input.commandId, input.applianceId) as SqlRow | undefined;
    if (!command || command.revoked_at || command.kind !== "START" || command.status !== "CLAIMED") throw new Error("frame is not bound to an active scanner command");
    if (!new Set(["CAPTURING", "PROCESSING"]).has(String(command.session_state))) throw new Error("recognition session cannot accept scanner frames");
    const frameId = `${input.commandId}:front:${input.sequence}`;
    const durable = input.recognition.putObject(input.bytes);
    const imported = input.recognition.addFrame({
      frameId,
      sessionId: String(command.session_id),
      sequence: input.sequence,
      side: "FRONT",
      objectSha256: durable.sha256,
      mediaType: input.mediaType as ScanFrame["mediaType"],
      byteLength: input.bytes.byteLength,
      capturedAt: input.capturedAt,
      pairedFrameId: null,
    }, { scheduleRecognition: true });
    this.database.prepare(`UPDATE recognition_appliance_command SET uploaded_frames=(
      SELECT COUNT(*) FROM recognition_frame WHERE session_id=? AND id LIKE ?
    ) WHERE id=?`).run(String(command.session_id), `${input.commandId}:front:%`, input.commandId);
    input.recognition.reconcileSessionState(String(command.session_id));
    return { status: imported.status, frameId, sha256 };
  }

  private commandFromRow(row: SqlRow): ScannerApplianceCommandView {
    const parsed = JSON.parse(String(row.payload_json)) as { frontOnly?: unknown; maxFrames?: unknown };
    return {
      id: String(row.id),
      applianceId: String(row.appliance_id),
      sessionId: String(row.session_id),
      kind: String(row.kind) as ScannerApplianceCommandKind,
      status: String(row.status) as ScannerApplianceCommandStatus,
      payload: { frontOnly: true, maxFrames: Number(parsed.maxFrames) || scannerApplianceMaxFrames },
      uploadedFrames: Number(row.uploaded_frames),
      createdAt: String(row.created_at),
      claimedAt: row.claimed_at ? String(row.claimed_at) : null,
      completedAt: row.completed_at ? String(row.completed_at) : null,
      error: row.error ? String(row.error) : null,
    };
  }
}

export function bearerToken(request: Request): string {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([A-Za-z0-9_-]{40,64})$/.exec(authorization);
  if (!match) throw new Error("scanner appliance authentication failed");
  return match[1];
}
