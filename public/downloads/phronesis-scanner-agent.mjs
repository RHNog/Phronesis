#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { homedir, hostname, platform as hostPlatform } from "node:os";
import { basename, dirname, extname, isAbsolute, join, resolve, sep } from "node:path";

export const agentVersion = "0.1.0";
const schemaVersion = "phronesis.scanner-agent-config/v1";
const allowedExtensions = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".tif", "image/tiff"],
  [".tiff", "image/tiff"],
]);
const maximumFrameBytes = 25 * 1024 * 1024;
const maximumFrames = 500;

function output(value) {
  process.stdout.write(`${typeof value === "string" ? value : JSON.stringify(value, null, 2)}\n`);
}

function fail(message, code = 1) {
  const error = new Error(message);
  error.exitCode = code;
  throw error;
}

export function defaultConfigPath(platform = hostPlatform()) {
  if (platform === "darwin") return join(homedir(), "Library", "Application Support", "Phronesis", "scanner-agent.json");
  if (platform === "win32") return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "Phronesis", "scanner-agent.json");
  return join(homedir(), ".config", "phronesis", "scanner-agent.json");
}

function defaultOutputRoot(platform = hostPlatform()) {
  if (platform === "win32") return "C:\\PhronesisScannerAgent\\capture";
  return join(homedir(), "Library", "Application Support", "Phronesis", "scanner-capture");
}

function defaultPaperStreamExecutable() {
  return "C:\\Program Files (x86)\\fiScanner\\PaperStream Capture\\PFU.PaperStream.Capture.exe";
}

export function parseArguments(argv) {
  const command = argv[0] || "help";
  const values = {};
  for (let index = 1; index < argv.length; index += 1) {
    const entry = argv[index];
    if (!entry.startsWith("--")) fail(`Unexpected argument: ${entry}`, 2);
    const key = entry.slice(2);
    const next = argv[index + 1];
    if (next === undefined || (key !== "capture-arg" && next.startsWith("--"))) fail(`Missing value for --${key}.`, 2);
    index += 1;
    if (key === "capture-arg") {
      values.captureArgs = [...(values.captureArgs || []), next];
    } else {
      values[key] = next;
    }
  }
  return { command, values };
}

function controllerUrl(value) {
  let parsed;
  try { parsed = new URL(value); }
  catch { fail("Controller must be a valid URL.", 2); }
  const loopback = new Set(["127.0.0.1", "localhost", "::1"]).has(parsed.hostname);
  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && loopback)) fail("Controller must use HTTPS except for loopback testing.", 2);
  if (parsed.username || parsed.password || parsed.search || parsed.hash) fail("Controller URL must not contain credentials, a query, or a fragment.", 2);
  parsed.pathname = parsed.pathname.replace(/\/$/, "");
  return parsed.toString().replace(/\/$/, "");
}

function platformName(platform = hostPlatform()) {
  if (platform === "darwin") return "MACOS";
  if (platform === "win32") return "WINDOWS";
  fail("The Phronesis Scanner Agent supports macOS and Windows.", 2);
}

function adapterName(value, platform = platformName()) {
  const adapter = String(value || (platform === "WINDOWS" ? "WINDOWS_PAPERSTREAM" : "MACOS_ICA")).trim().toUpperCase().replaceAll("-", "_");
  const allowed = new Set(["MACOS_ICA", "WINDOWS_PAPERSTREAM", "MANAGED_CAPTURE"]);
  if (!allowed.has(adapter)) fail("Adapter must be macos-ica, windows-paperstream, or managed-capture.", 2);
  if (adapter === "MACOS_ICA" && platform !== "MACOS") fail("macOS ICA adapter requires macOS.", 2);
  if (adapter === "WINDOWS_PAPERSTREAM" && platform !== "WINDOWS") fail("PaperStream adapter requires Windows.", 2);
  return adapter;
}

function atomicWriteJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  if (hostPlatform() === "win32" && existsSync(path)) {
    const backup = `${path}.${process.pid}.backup`;
    renameSync(path, backup);
    try {
      renameSync(temporary, path);
      unlinkSync(backup);
    } catch (error) {
      if (!existsSync(path) && existsSync(backup)) renameSync(backup, path);
      throw error;
    }
  } else renameSync(temporary, path);
  if (hostPlatform() !== "win32") chmodSync(path, 0o600);
}

export function loadConfig(path = defaultConfigPath()) {
  if (!existsSync(path)) fail(`Scanner Agent is not paired. Expected configuration at ${path}.`, 2);
  let config;
  try { config = JSON.parse(readFileSync(path, "utf8")); }
  catch { fail("Scanner Agent configuration is unreadable.", 2); }
  if (config?.schemaVersion !== schemaVersion || typeof config.token !== "string" || !config.token || typeof config.controller !== "string") {
    fail("Scanner Agent configuration is invalid.", 2);
  }
  try {
    const runtime = JSON.parse(readFileSync(`${path}.runtime`, "utf8"));
    config.runtime = { activeCommandId: typeof runtime.activeCommandId === "string" ? runtime.activeCommandId : null };
  } catch { config.runtime = { activeCommandId: null }; }
  return config;
}

function saveRuntime(configPath, activeCommandId) {
  atomicWriteJson(`${configPath}.runtime`, { activeCommandId: activeCommandId || null });
}

function isInside(root, target) {
  const normalizedRoot = resolve(root);
  const normalizedTarget = resolve(target);
  return normalizedTarget === normalizedRoot || normalizedTarget.startsWith(`${normalizedRoot}${sep}`);
}

function localReadiness(config) {
  const errors = [];
  const executable = config.capture?.executable;
  if (!executable || typeof executable !== "string") errors.push("Capture executable is not configured.");
  else if (!isAbsolute(executable)) errors.push("Capture executable must use an absolute path.");
  else if (!existsSync(executable)) errors.push("Capture executable was not found.");
  else if (!lstatSync(executable).isFile()) errors.push("Capture executable is not a regular file.");
  const outputRoot = config.capture?.outputRoot;
  if (!outputRoot || typeof outputRoot !== "string" || !isAbsolute(outputRoot)) errors.push("Capture output root must use an absolute path.");
  else {
    try { mkdirSync(outputRoot, { recursive: true }); }
    catch { errors.push("Capture output root is not writable."); }
  }
  if (!Array.isArray(config.capture?.args)) errors.push("Capture arguments are invalid.");
  return {
    ready: errors.length === 0,
    errors,
    capabilities: {
      frontOnly: true,
      captureCommandConfigured: errors.length === 0,
      scannerModel: config.scannerModel || null,
      driverName: config.driverName || null,
      driverVersion: config.driverVersion || null,
    },
  };
}

function safeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+[A-Za-z0-9_-]+/gi, "Bearer [REDACTED]").slice(0, 500);
}

async function requestJson(config, path, body, attempts = 1) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${config.controller}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Controller returned HTTP ${response.status}.`);
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await delay(Math.min(1_000 * 2 ** (attempt - 1), 5_000));
    }
  }
  throw lastError;
}

async function pair(values) {
  const platform = platformName();
  const adapter = adapterName(values.adapter, platform);
  const controller = controllerUrl(values.controller || "");
  const code = String(values.code || "").trim();
  if (!code) fail("Pairing requires --code.", 2);
  const configPath = resolve(values.config || defaultConfigPath());
  if (existsSync(configPath)) fail(`Configuration already exists at ${configPath}. Move it aside or revoke that appliance before pairing again.`, 2);
  let executable = values["capture-executable"] || null;
  let captureArgs = values.captureArgs || [];
  if (!executable && platform === "WINDOWS" && adapter === "WINDOWS_PAPERSTREAM") {
    const candidate = defaultPaperStreamExecutable();
    if (existsSync(candidate)) {
      executable = candidate;
      captureArgs = captureArgs.length ? captureArgs : ["/DocType:\"Phronesis Card Front\"", "/BatchFolder:{commandId}", "/Exit"];
    }
  }
  const outputRoot = resolve(values["output-root"] || defaultOutputRoot());
  const initialConfig = {
    schemaVersion,
    controller,
    applianceId: null,
    token: null,
    label: String(values.label || hostname()).trim().slice(0, 120),
    platform,
    adapter,
    agentVersion,
    pollIntervalMs: 2_000,
    capture: { executable, args: captureArgs, outputRoot },
    scannerModel: values["scanner-model"] || null,
    driverName: values["driver-name"] || null,
    driverVersion: values["driver-version"] || null,
    runtime: { activeCommandId: null },
  };
  const readiness = localReadiness(initialConfig);
  const response = await requestJson({ controller, token: null }, "/api/card-recognition/appliance-agent/pair", {
    code,
    label: initialConfig.label,
    platform,
    adapter,
    agentVersion,
    capabilities: readiness.capabilities,
  });
  if (typeof response.token !== "string" || typeof response.appliance?.id !== "string") fail("Controller pairing response was invalid.");
  atomicWriteJson(configPath, { ...initialConfig, applianceId: response.appliance.id, token: response.token });
  output({
    paired: true,
    applianceId: response.appliance.id,
    label: initialConfig.label,
    configPath,
    ready: readiness.ready,
    setup: readiness.errors,
    next: `Run ${basename(process.argv[0])} doctor --config \"${configPath}\", then run the agent continuously.`,
  });
}

function configure(values) {
  const configPath = resolve(values.config || defaultConfigPath());
  const config = loadConfig(configPath);
  const next = {
    ...config,
    capture: {
      executable: values["capture-executable"] || config.capture?.executable || null,
      args: values.captureArgs || config.capture?.args || [],
      outputRoot: resolve(values["output-root"] || config.capture?.outputRoot || defaultOutputRoot()),
    },
    scannerModel: values["scanner-model"] || config.scannerModel || null,
    driverName: values["driver-name"] || config.driverName || null,
    driverVersion: values["driver-version"] || config.driverVersion || null,
    runtime: undefined,
  };
  delete next.runtime;
  atomicWriteJson(configPath, next);
  const readiness = localReadiness(next);
  output({ configured: true, configPath, ready: readiness.ready, errors: readiness.errors });
  if (!readiness.ready) process.exitCode = 3;
}

async function poll(config, readiness, currentCommandId = null) {
  const response = await requestJson(config, "/api/card-recognition/appliance-agent/poll", {
    driverReady: readiness.ready,
    capabilities: readiness.capabilities,
    lastError: readiness.errors.join(" ") || null,
    agentVersion,
    currentCommandId,
  }, 3);
  return response.command || null;
}

async function report(config, commandId, outcome, error = null, result = undefined) {
  return requestJson(config, "/api/card-recognition/appliance-agent/report", { commandId, outcome, error, result }, 3);
}

function expandCaptureArguments(args, command, outputDirectory) {
  const values = {
    "{commandId}": command.id,
    "{sessionId}": command.sessionId,
    "{outputDir}": outputDirectory,
  };
  return args.map((argument) => {
    let expanded = String(argument);
    for (const [placeholder, value] of Object.entries(values)) expanded = expanded.replaceAll(placeholder, value);
    if (/\{[^}]+\}/.test(expanded)) fail(`Capture argument contains an unknown placeholder: ${expanded}`, 2);
    return expanded;
  });
}

function collectOutput(stream, maximum = 8_192) {
  let text = "";
  stream?.on("data", (chunk) => { text = `${text}${String(chunk)}`.slice(-maximum); });
  return () => text.trim();
}

function waitForExit(child) {
  return new Promise((resolveExit) => {
    child.once("error", (error) => resolveExit({ code: null, signal: null, error }));
    child.once("exit", (code, signal) => resolveExit({ code, signal, error: null }));
  });
}

async function terminateChild(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (hostPlatform() === "win32") {
    await new Promise((resolveTask) => {
      const task = spawn("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], { shell: false, windowsHide: true, stdio: "ignore" });
      task.once("exit", resolveTask);
      task.once("error", resolveTask);
    });
    return;
  }
  child.kill("SIGTERM");
  await delay(2_000);
  if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function walkFrames(root, current = root, result = []) {
  if (!isInside(root, current)) fail("Capture output escaped its configured root.");
  for (const entry of readdirSync(current, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(current, entry.name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) fail("Capture output contains a symbolic link.");
    if (stat.isDirectory()) walkFrames(root, path, result);
    else if (stat.isFile()) {
      const mediaType = allowedExtensions.get(extname(entry.name).toLowerCase());
      if (!mediaType) fail(`Capture output contains an unsupported file: ${entry.name}`);
      if (stat.size < 1 || stat.size > maximumFrameBytes) fail(`Capture frame is outside the byte limit: ${entry.name}`);
      result.push({ path, mediaType, capturedAt: stat.mtime.toISOString() });
      if (result.length > maximumFrames) fail("Capture output exceeds the frame limit.");
    }
  }
  return result;
}

export function discoverFrames(outputDirectory) {
  if (!existsSync(outputDirectory) || !lstatSync(outputDirectory).isDirectory()) fail("Capture command did not produce its expected output directory.");
  return walkFrames(outputDirectory);
}

async function uploadFrame(config, command, frame, sequence) {
  const bytes = readFileSync(frame.path);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${config.controller}/api/card-recognition/appliance-agent/frame`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.token}`,
          "content-type": frame.mediaType,
          "content-length": String(bytes.byteLength),
          "x-phronesis-command-id": command.id,
          "x-phronesis-frame-sequence": String(sequence),
          "x-phronesis-sha256": sha256,
          "x-phronesis-captured-at": frame.capturedAt,
        },
        body: bytes,
        signal: AbortSignal.timeout(60_000),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `Frame upload returned HTTP ${response.status}.`);
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await delay(1_000 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

async function checkCancellation(config, readiness, command, child = null) {
  const next = await poll(config, readiness, command.id);
  if (!next || next.id === command.id) return false;
  if (next.kind !== "CANCEL" || next.sessionId !== command.sessionId) fail("Controller returned a conflicting command.");
  if (child) await terminateChild(child);
  await report(config, next.id, "SUCCEEDED", null, { cancelledCommandId: command.id });
  await report(config, command.id, "FAILED", "Capture cancelled by the operator.");
  return true;
}

async function executeStart(configPath, config, readiness, command) {
  let child = null;
  let terminalReported = false;
  let outputDirectory = null;
  try {
    saveRuntime(configPath, command.id);
    const outputRoot = resolve(config.capture.outputRoot);
    outputDirectory = join(outputRoot, command.id);
    if (!isInside(outputRoot, outputDirectory)) fail("Capture output path is invalid.");
    if (existsSync(outputDirectory)) fail(`Capture output already exists and was retained: ${outputDirectory}`);
    mkdirSync(outputRoot, { recursive: true });
    const args = expandCaptureArguments(config.capture.args, command, outputDirectory);
    await report(config, command.id, "RUNNING");
    child = spawn(config.capture.executable, args, {
      cwd: dirname(config.capture.executable),
      shell: false,
      windowsHide: false,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PHRONESIS_SCAN_COMMAND_ID: command.id,
        PHRONESIS_SCAN_SESSION_ID: command.sessionId,
        PHRONESIS_SCAN_OUTPUT: outputDirectory,
      },
    });
    const stdout = collectOutput(child.stdout);
    const stderr = collectOutput(child.stderr);
    const exit = waitForExit(child);
    while (child.exitCode === null && child.signalCode === null) {
      const completed = await Promise.race([exit.then(() => true), delay(1_000).then(() => false)]);
      if (completed) break;
      if (await checkCancellation(config, readiness, command, child)) {
        terminalReported = true;
        saveRuntime(configPath, null);
        return;
      }
    }
    const result = await exit;
    if (result.error || result.code !== 0) {
      const detail = safeError(result.error || stderr() || stdout() || `Capture exited with ${result.code ?? result.signal}.`);
      await report(config, command.id, "FAILED", detail);
      terminalReported = true;
      saveRuntime(configPath, null);
      return;
    }
    await delay(750);
    const frames = discoverFrames(outputDirectory);
    if (!frames.length) fail("Capture command produced no supported front images.");
    for (let index = 0; index < frames.length; index += 1) {
      if (await checkCancellation(config, readiness, command)) {
        terminalReported = true;
        saveRuntime(configPath, null);
        return;
      }
      await uploadFrame(config, command, frames[index], index + 1);
    }
    await report(config, command.id, "SUCCEEDED", null, { uploadedFrames: frames.length });
    terminalReported = true;
    saveRuntime(configPath, null);
    output({ event: "scan.completed", commandId: command.id, sessionId: command.sessionId, uploadedFrames: frames.length, retainedOutput: outputDirectory });
  } catch (error) {
    if (child) await terminateChild(child).catch(() => undefined);
    if (!terminalReported) await report(config, command.id, "FAILED", safeError(error)).catch(() => undefined);
    try { saveRuntime(configPath, null); } catch { /* The terminal command report remains authoritative. */ }
    throw error;
  }
}

async function recoverInterrupted(configPath, config, readiness) {
  const commandId = config.runtime?.activeCommandId;
  if (!commandId) return;
  const command = await poll(config, readiness, commandId);
  if (command?.kind === "CANCEL") {
    await report(config, command.id, "SUCCEEDED", null, { cancelledCommandId: commandId, recoveredAfterRestart: true });
  }
  try { await report(config, commandId, "FAILED", "Scanner Agent restarted during capture. Retained output requires operator review."); }
  catch { /* The command may already have been completed or cancelled. */ }
  saveRuntime(configPath, null);
}

async function run(values) {
  const configPath = resolve(values.config || defaultConfigPath());
  let config = loadConfig(configPath);
  let readiness = localReadiness(config);
  await recoverInterrupted(configPath, config, readiness);
  config = loadConfig(configPath);
  output({ event: "agent.started", applianceId: config.applianceId, label: config.label, ready: readiness.ready, setup: readiness.errors });
  let stopping = false;
  const stop = () => { stopping = true; };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  let failures = 0;
  while (!stopping) {
    try {
      readiness = localReadiness(config);
      const command = await poll(config, readiness);
      failures = 0;
      if (command?.kind === "START") {
        if (!readiness.ready) await report(config, command.id, "FAILED", readiness.errors.join(" "));
        else await executeStart(configPath, config, readiness, command);
      } else if (command?.kind === "CANCEL") {
        await report(config, command.id, "SUCCEEDED", null, { noActiveCapture: true });
      }
      await delay(Number(config.pollIntervalMs) || 2_000);
    } catch (error) {
      failures += 1;
      process.stderr.write(`${safeError(error)}\n`);
      await delay(Math.min(2_000 * 2 ** Math.min(failures - 1, 5), 30_000));
    }
  }
  output({ event: "agent.stopped", applianceId: config.applianceId });
}

function doctor(values) {
  const configPath = resolve(values.config || defaultConfigPath());
  const config = loadConfig(configPath);
  const readiness = localReadiness(config);
  output({
    schemaVersion: "phronesis.scanner-agent-doctor/v1",
    agentVersion,
    applianceId: config.applianceId,
    label: config.label,
    platform: config.platform,
    adapter: config.adapter,
    controller: config.controller,
    configPath,
    tokenStored: true,
    ready: readiness.ready,
    errors: readiness.errors,
    captureExecutable: config.capture?.executable || null,
    outputRoot: config.capture?.outputRoot || null,
  });
  if (!readiness.ready) process.exitCode = 3;
}

function help() {
  output(`Phronesis Scanner Agent ${agentVersion}

Pair this Mac or Windows computer once:
  phronesis-scanner-agent pair --controller https://your-phronesis-host --code PHR-XXXX-XXXX-XXXX-XXXX [options]

Configure or replace the local capture adapter without re-pairing:
  phronesis-scanner-agent configure --capture-executable ABSOLUTE_PATH --capture-arg ARG --output-root ABSOLUTE_PATH

Verify local driver/capture readiness:
  phronesis-scanner-agent doctor [--config PATH]

Run the outbound controller loop:
  phronesis-scanner-agent run [--config PATH]

Pair options:
  --label NAME
  --adapter macos-ica|windows-paperstream|managed-capture
  --capture-executable ABSOLUTE_PATH
  --capture-arg ARG                 Repeat for each local argument
  --output-root ABSOLUTE_PATH
  --scanner-model NAME
  --driver-name NAME
  --driver-version VERSION
  --config PATH

Capture argument placeholders: {commandId}, {sessionId}, {outputDir}

The controller never supplies executable paths or arguments. The agent opens no inbound port and uploads front images only.`);
}

export async function main(argv = process.argv.slice(2)) {
  const { command, values } = parseArguments(argv);
  if (command === "help" || command === "--help" || command === "-h") return help();
  if (command === "pair") return pair(values);
  if (command === "configure") return configure(values);
  if (command === "doctor") return doctor(values);
  if (command === "run") return run(values);
  fail(`Unknown command: ${command}`, 2);
}

if (process.env.PHRONESIS_SCANNER_AGENT_LIBRARY !== "1") {
  main().catch((error) => {
    process.stderr.write(`${safeError(error)}\n`);
    process.exitCode = Number(error?.exitCode) || 1;
  });
}
