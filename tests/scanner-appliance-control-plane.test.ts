import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { ScannerApplianceRepository } from "@/lib/cardRecognition/scannerAppliance";

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "phronesis-scanner-appliance-"));
  const recognition = new CardRecognitionRepository(":memory:", root);
  const appliances = new ScannerApplianceRepository(recognition.database);
  return { root, recognition, appliances };
}

function timeout(milliseconds: number, message: string): Promise<never> {
  return new Promise((_, rejectTimeout) => {
    const timer = setTimeout(() => rejectTimeout(new Error(message)), milliseconds);
    timer.unref();
  });
}

function pair(appliances: ScannerApplianceRepository, now = new Date("2026-08-06T16:00:00.000Z")) {
  const pairing = appliances.createPairing("owner-1", now);
  return appliances.redeemPairing({
    code: pairing.code,
    label: "Booth scanner",
    platform: "WINDOWS",
    adapter: "WINDOWS_PAPERSTREAM",
    agentVersion: "0.1.0",
    capabilities: { frontOnly: true, captureCommandConfigured: true, scannerModel: "fi-8170", driverName: "PaperStream" },
    now: new Date(now.getTime() + 1_000),
  });
}

test("scanner pairing is single-use and stores only a device-token hash", () => {
  const { root, recognition, appliances } = fixture();
  try {
    const now = new Date("2026-08-06T16:00:00.000Z");
    const pairing = appliances.createPairing("owner-1", now);
    assert.match(pairing.code, /^PHR-(?:[A-Z2-9]{4}-){3}[A-Z2-9]{4}$/);
    const result = appliances.redeemPairing({
      code: pairing.code,
      label: "Windows booth",
      platform: "WINDOWS",
      adapter: "WINDOWS_PAPERSTREAM",
      agentVersion: "0.1.0",
      capabilities: { captureCommandConfigured: true, scannerModel: "fi-8170" },
      now: new Date(now.getTime() + 1_000),
    });
    assert.equal(result.appliance.state, "READY");
    assert.equal(result.appliance.capabilities.frontOnly, true);
    const stored = recognition.database.prepare("SELECT token_hash FROM recognition_appliance WHERE id=?").get(result.appliance.id) as { token_hash: string };
    assert.notEqual(stored.token_hash, result.token);
    assert.equal(stored.token_hash, createHash("sha256").update(result.token).digest("hex"));
    assert.deepEqual(appliances.authenticate(result.token), { applianceId: result.appliance.id });
    assert.throws(() => appliances.redeemPairing({
      code: pairing.code, label: "Replay", platform: "WINDOWS", adapter: "WINDOWS_PAPERSTREAM", agentVersion: "0.1.0", capabilities: {},
      now: new Date(now.getTime() + 2_000),
    }), /invalid or expired/);
  } finally { recognition.close(); rmSync(root, { recursive: true, force: true }); }
});

test("scanner heartbeat reports ready, setup-required, offline, and revoked truthfully", () => {
  const { root, recognition, appliances } = fixture();
  try {
    const now = new Date("2026-08-06T16:00:00.000Z");
    const result = pair(appliances, now);
    const setup = appliances.heartbeat({ applianceId: result.appliance.id, driverReady: false, capabilities: {}, lastError: "Driver unavailable", now: new Date(now.getTime() + 2_000) });
    assert.equal(setup.state, "SETUP_REQUIRED");
    assert.equal(setup.lastError, "Driver unavailable");
    assert.equal(appliances.getAppliance(result.appliance.id, new Date(now.getTime() + 30_000)).state, "OFFLINE");
    assert.equal(appliances.revoke(result.appliance.id, new Date(now.getTime() + 31_000)).state, "REVOKED");
    assert.throws(() => appliances.authenticate(result.token), /authentication failed/);
  } finally { recognition.close(); rmSync(root, { recursive: true, force: true }); }
});

test("Phronesis claims one exact Start command and ingests front frames idempotently", () => {
  const { root, recognition, appliances } = fixture();
  try {
    const paired = pair(appliances);
    const sessionId = recognition.createSessionWithMaterial({ label: "Agent batch", conditionCode: "NEAR_MINT", finish: "Holofoil", configuredBy: "owner-1" });
    const start = appliances.queueStart({ applianceId: paired.appliance.id, sessionId, createdByUserId: "operator-1" });
    assert.equal(start.status, "QUEUED");
    assert.equal(start.payload.frontOnly, true);
    assert.throws(() => appliances.queueStart({ applianceId: paired.appliance.id, sessionId, createdByUserId: "operator-1" }), /active scan command/);
    const claimed = appliances.poll({ applianceId: paired.appliance.id });
    assert.equal(claimed?.id, start.id);
    assert.equal(claimed?.status, "CLAIMED");
    assert.equal(appliances.poll({ applianceId: paired.appliance.id, currentCommandId: start.id })?.id, start.id);
    const bytes = Buffer.from("synthetic front frame");
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const first = appliances.ingestFrontFrame({
      recognition, applianceId: paired.appliance.id, commandId: start.id, sequence: 1,
      mediaType: "image/jpeg", bytes, declaredSha256: sha256, capturedAt: "2026-08-06T16:01:00.000Z",
    });
    const second = appliances.ingestFrontFrame({
      recognition, applianceId: paired.appliance.id, commandId: start.id, sequence: 1,
      mediaType: "image/jpeg", bytes, declaredSha256: sha256, capturedAt: "2026-08-06T16:01:00.000Z",
    });
    assert.equal(first.status, "IMPORTED");
    assert.equal(second.status, "ALREADY_IMPORTED");
    assert.equal(recognition.sessionItems(sessionId)[0].side, "FRONT");
    assert.equal(recognition.sessionItems(sessionId)[0].pairedFrameId, null);
    assert.equal(appliances.getCommand(start.id).uploadedFrames, 1);
    assert.throws(() => appliances.ingestFrontFrame({
      recognition, applianceId: paired.appliance.id, commandId: start.id, sequence: 2,
      mediaType: "image/jpeg", bytes, declaredSha256: "0".repeat(64), capturedAt: "2026-08-06T16:01:00.000Z",
    }), /checksum/);
    assert.equal(appliances.report({ applianceId: paired.appliance.id, commandId: start.id, outcome: "SUCCEEDED", result: { uploadedFrames: 1 } }).status, "SUCCEEDED");
  } finally { recognition.close(); rmSync(root, { recursive: true, force: true }); }
});

test("Cancel is prioritized for an active capture and queued Start is cancelled before claim", () => {
  const { root, recognition, appliances } = fixture();
  try {
    const paired = pair(appliances);
    const firstSession = recognition.createSessionWithMaterial({ label: "First", conditionCode: "NEAR_MINT", finish: "Normal", configuredBy: "owner-1" });
    const firstStart = appliances.queueStart({ applianceId: paired.appliance.id, sessionId: firstSession, createdByUserId: "operator-1" });
    appliances.poll({ applianceId: paired.appliance.id });
    assert.throws(() => appliances.revoke(paired.appliance.id), /cancel the active scanner command/);
    const firstCancel = appliances.queueCancel({ applianceId: paired.appliance.id, sessionId: firstSession, createdByUserId: "operator-1" });
    assert.equal(appliances.poll({ applianceId: paired.appliance.id, currentCommandId: firstStart.id })?.id, firstCancel.id);
    assert.equal(appliances.report({ applianceId: paired.appliance.id, commandId: firstCancel.id, outcome: "SUCCEEDED" }).status, "SUCCEEDED");
    assert.equal(appliances.report({ applianceId: paired.appliance.id, commandId: firstStart.id, outcome: "FAILED", error: "Capture cancelled by the operator." }).status, "FAILED");

    const secondSession = recognition.createSessionWithMaterial({ label: "Second", conditionCode: "NEAR_MINT", finish: "Normal", configuredBy: "owner-1" });
    const secondStart = appliances.queueStart({ applianceId: paired.appliance.id, sessionId: secondSession, createdByUserId: "operator-1" });
    const secondCancel = appliances.queueCancel({ applianceId: paired.appliance.id, sessionId: secondSession, createdByUserId: "operator-1" });
    assert.equal(appliances.getCommand(secondStart.id).status, "CANCELLED");
    assert.equal(appliances.poll({ applianceId: paired.appliance.id })?.id, secondCancel.id);
  } finally { recognition.close(); rmSync(root, { recursive: true, force: true }); }
});

test("portable agent supports safe local capture configuration without printing its token", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-scanner-agent-cli-"));
  const configPath = join(root, "agent.json");
  const outputRoot = join(root, "capture");
  const token = "s".repeat(43);
  const agentPath = join(process.cwd(), "public", "downloads", "phronesis-scanner-agent.mjs");
  try {
    writeFileSync(configPath, JSON.stringify({
      schemaVersion: "phronesis.scanner-agent-config/v1",
      controller: "https://access.phronesis.com",
      applianceId: "appliance-1",
      token,
      label: "Fixture",
      platform: "MACOS",
      adapter: "MANAGED_CAPTURE",
      agentVersion: "0.1.0",
      pollIntervalMs: 2_000,
      capture: { executable: null, args: [], outputRoot },
    }));
    const configured = spawnSync(process.execPath, [agentPath, "configure", "--config", configPath, "--capture-executable", "/bin/echo", "--capture-arg", "--output-directory", "--capture-arg", "{outputDir}", "--output-root", outputRoot], { encoding: "utf8" });
    assert.equal(configured.status, 0, configured.stderr);
    assert.doesNotMatch(`${configured.stdout}${configured.stderr}`, new RegExp(token));
    const stored = JSON.parse(readFileSync(configPath, "utf8")) as { token: string; capture: { args: string[] } };
    assert.equal(stored.token, token);
    assert.deepEqual(stored.capture.args, ["--output-directory", "{outputDir}"]);
    const doctor = spawnSync(process.execPath, [agentPath, "doctor", "--config", configPath], { encoding: "utf8" });
    assert.equal(doctor.status, 0, doctor.stderr);
    assert.match(doctor.stdout, /"ready": true/);
    assert.doesNotMatch(doctor.stdout, new RegExp(token));
    const help = spawnSync(process.execPath, [agentPath, "help"], { encoding: "utf8" });
    assert.equal(help.status, 0);
    assert.match(help.stdout, /opens no inbound port/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test("portable agent executes a controlled capture and uploads one front image end to end", async () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-scanner-agent-run-"));
  const configPath = join(root, "agent.json");
  const outputRoot = join(root, "capture");
  const captureScript = join(root, "capture.mjs");
  const agentPath = join(process.cwd(), "public", "downloads", "phronesis-scanner-agent.mjs");
  const token = "t".repeat(43);
  const command = { id: "11111111-1111-4111-8111-111111111111", applianceId: "appliance-1", sessionId: "session-1", kind: "START", status: "CLAIMED", payload: { frontOnly: true, maxFrames: 500 }, uploadedFrames: 0 };
  let completed = false;
  let uploadedBody = Buffer.alloc(0);
  const outcomes: string[] = [];
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      assert.equal(request.headers.authorization, `Bearer ${token}`);
      response.setHeader("content-type", "application/json");
      if (request.url === "/api/card-recognition/appliance-agent/poll") {
        response.end(JSON.stringify({ appliance: { id: "appliance-1" }, command: completed ? null : command }));
        return;
      }
      if (request.url === "/api/card-recognition/appliance-agent/frame") {
        uploadedBody = Buffer.concat(chunks);
        assert.equal(request.headers["x-phronesis-command-id"], command.id);
        assert.equal(request.headers["x-phronesis-frame-sequence"], "1");
        assert.equal(request.headers["content-type"], "image/jpeg");
        response.statusCode = 201;
        response.end(JSON.stringify({ status: "IMPORTED" }));
        return;
      }
      if (request.url === "/api/card-recognition/appliance-agent/report") {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { outcome: string };
        outcomes.push(body.outcome);
        if (body.outcome === "SUCCEEDED") completed = true;
        response.end(JSON.stringify({ command: { ...command, status: body.outcome } }));
        return;
      }
      response.statusCode = 404;
      response.end(JSON.stringify({ error: "not found" }));
    });
  });
  let child: ReturnType<typeof spawn> | null = null;
  try {
    await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    writeFileSync(captureScript, `import { mkdirSync, writeFileSync } from "node:fs";\nmkdirSync(process.argv[2], { recursive: true });\nwriteFileSync(process.argv[2] + "/front.jpg", "synthetic-front");\n`);
    writeFileSync(configPath, JSON.stringify({
      schemaVersion: "phronesis.scanner-agent-config/v1",
      controller: `http://127.0.0.1:${address.port}`,
      applianceId: "appliance-1",
      token,
      label: "Fixture",
      platform: "MACOS",
      adapter: "MANAGED_CAPTURE",
      agentVersion: "0.1.0",
      pollIntervalMs: 50,
      capture: { executable: process.execPath, args: [captureScript, "{outputDir}"], outputRoot },
    }));
    child = spawn(process.execPath, [agentPath, "run", "--config", configPath], { stdio: ["ignore", "pipe", "pipe"] });
    await Promise.race([
      new Promise<void>((resolveCompleted) => {
        const interval = setInterval(() => { if (completed) { clearInterval(interval); resolveCompleted(); } }, 25);
      }),
      timeout(10_000, "agent integration timed out"),
    ]);
    child.kill("SIGTERM");
    await Promise.race([
      new Promise<void>((resolveExit) => child?.once("exit", () => resolveExit())),
      timeout(5_000, "agent did not stop"),
    ]);
    assert.equal(uploadedBody.toString("utf8"), "synthetic-front");
    assert.deepEqual(outcomes, ["RUNNING", "SUCCEEDED"]);
    assert.equal(existsSync(join(outputRoot, command.id, "front.jpg")), true);
  } finally {
    if (child && child.exitCode === null) child.kill("SIGKILL");
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
    rmSync(root, { recursive: true, force: true });
  }
});

test("portable agent terminates its exact capture process when Phronesis sends Cancel", async () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-scanner-agent-cancel-"));
  const configPath = join(root, "agent.json");
  const outputRoot = join(root, "capture");
  const captureScript = join(root, "long-capture.mjs");
  const agentPath = join(process.cwd(), "public", "downloads", "phronesis-scanner-agent.mjs");
  const token = "u".repeat(43);
  const start = { id: "22222222-2222-4222-8222-222222222222", applianceId: "appliance-1", sessionId: "session-2", kind: "START", status: "CLAIMED", payload: { frontOnly: true, maxFrames: 500 }, uploadedFrames: 0 };
  const cancel = { ...start, id: "33333333-3333-4333-8333-333333333333", kind: "CANCEL" };
  const outcomes = new Map<string, string>();
  let frameRequests = 0;
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      response.setHeader("content-type", "application/json");
      if (request.url === "/api/card-recognition/appliance-agent/poll") {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { currentCommandId?: string | null };
        const cancelled = outcomes.get(cancel.id) === "SUCCEEDED" && outcomes.get(start.id) === "FAILED";
        response.end(JSON.stringify({ appliance: { id: "appliance-1" }, command: cancelled ? null : body.currentCommandId === start.id ? cancel : start }));
        return;
      }
      if (request.url === "/api/card-recognition/appliance-agent/report") {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { commandId: string; outcome: string };
        outcomes.set(body.commandId, body.outcome);
        response.end(JSON.stringify({ command: { id: body.commandId, status: body.outcome } }));
        return;
      }
      if (request.url === "/api/card-recognition/appliance-agent/frame") frameRequests += 1;
      response.statusCode = 400;
      response.end(JSON.stringify({ error: "unexpected request" }));
    });
  });
  let child: ReturnType<typeof spawn> | null = null;
  try {
    await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
    const address = server.address();
    assert.ok(address && typeof address === "object");
    writeFileSync(captureScript, "setTimeout(() => process.exit(0), 10000);\n");
    writeFileSync(configPath, JSON.stringify({
      schemaVersion: "phronesis.scanner-agent-config/v1", controller: `http://127.0.0.1:${address.port}`,
      applianceId: "appliance-1", token, label: "Fixture", platform: "MACOS", adapter: "MANAGED_CAPTURE", agentVersion: "0.1.0", pollIntervalMs: 50,
      capture: { executable: process.execPath, args: [captureScript, "{outputDir}"], outputRoot },
    }));
    child = spawn(process.execPath, [agentPath, "run", "--config", configPath], { stdio: ["ignore", "pipe", "pipe"] });
    await Promise.race([
      new Promise<void>((resolveCompleted) => {
        const interval = setInterval(() => {
          if (outcomes.get(cancel.id) === "SUCCEEDED" && outcomes.get(start.id) === "FAILED") { clearInterval(interval); resolveCompleted(); }
        }, 25);
      }),
      timeout(10_000, "agent cancellation timed out"),
    ]);
    child.kill("SIGTERM");
    await Promise.race([new Promise<void>((resolveExit) => child?.once("exit", () => resolveExit())), timeout(5_000, "cancelled agent did not stop")]);
    assert.equal(frameRequests, 0);
    assert.equal(outcomes.get(cancel.id), "SUCCEEDED");
    assert.equal(outcomes.get(start.id), "FAILED");
  } finally {
    if (child && child.exitCode === null) child.kill("SIGKILL");
    await new Promise<void>((resolveClose) => server.close(() => resolveClose()));
    rmSync(root, { recursive: true, force: true });
  }
});

test("scanner control routes keep permanent-admin pairing and device bearer auth distinct", () => {
  const operatorRoute = readFileSync(new URL("../app/api/card-recognition/appliances/route.ts", import.meta.url), "utf8");
  const pairRoute = readFileSync(new URL("../app/api/card-recognition/appliance-agent/pair/route.ts", import.meta.url), "utf8");
  const pollRoute = readFileSync(new URL("../app/api/card-recognition/appliance-agent/poll/route.ts", import.meta.url), "utf8");
  const reportRoute = readFileSync(new URL("../app/api/card-recognition/appliance-agent/report/route.ts", import.meta.url), "utf8");
  const frameRoute = readFileSync(new URL("../app/api/card-recognition/appliance-agent/frame/route.ts", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("../features/vendor/components/ScannerToOfferWorkspace.tsx", import.meta.url), "utf8");
  assert.match(operatorRoute, /authorizeIdentityRequired\(request, "ADMINISTRATION", "ADMIN"\)/);
  assert.match(operatorRoute, /authorizeRequest\(request, "VENDOR_WORKSPACE", "OPERATE"\)/);
  assert.doesNotMatch(pairRoute, /authorizeRequest|authorizeHeaders/);
  assert.match(pollRoute, /maximumRequestBytes/);
  assert.match(reportRoute, /maximumRequestBytes/);
  assert.match(frameRoute, /bearerToken\(request\)/);
  assert.match(frameRoute, /scannerApplianceMaxFrameBytes/);
  assert.match(workspace, /Start scanner/);
  assert.match(workspace, /stop command was sent to the scanner appliance/);
  assert.match(workspace, /Front only/);
});
