#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import {
  constants as fsConstants,
  copyFile,
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const LEGACY_BUNDLE_SCHEMA = "phronesis.windows-scan-bundle/v1";
const DUPLEX_BUNDLE_SCHEMA = "phronesis.windows-scan-bundle/v2";
const EVENT_SCHEMA = "phronesis.windows-bridge-event/v1";
const SESSION_PATTERN = /^phr-[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const SEGMENT_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff"]);

export class BridgeError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "BridgeError";
    this.code = code;
  }
}

function assert(condition, code, message) {
  if (!condition) throw new BridgeError(code, message);
}

async function sha256(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function safeRelativePath(value) {
  assert(typeof value === "string" && value.length > 0 && value.length <= 512, "INVALID_PATH", "Frame path is invalid.");
  assert(!value.includes("\\") && !value.includes("\0") && !path.posix.isAbsolute(value), "INVALID_PATH", "Frame path is invalid.");
  const segments = value.split("/");
  assert(segments.length <= 8 && segments.every((segment) => SEGMENT_PATTERN.test(segment)), "INVALID_PATH", "Frame path is invalid.");
  assert(ALLOWED_EXTENSIONS.has(path.posix.extname(value).toLowerCase()), "UNSUPPORTED_EXTENSION", "Frame extension is not allowed.");
  return segments.join("/");
}

function parseManifest(bytes, maxFiles) {
  let manifest;
  try {
    manifest = JSON.parse(bytes.toString("utf8").replace(/^\uFEFF/, ""));
  } catch {
    throw new BridgeError("INVALID_MANIFEST", "Bundle manifest is not valid JSON.");
  }
  assert(manifest && typeof manifest === "object" && !Array.isArray(manifest), "INVALID_MANIFEST", "Bundle manifest must be an object.");
  assert(manifest.schemaVersion === LEGACY_BUNDLE_SCHEMA || manifest.schemaVersion === DUPLEX_BUNDLE_SCHEMA, "SCHEMA_MISMATCH", "Bundle schema is unsupported.");
  assert(typeof manifest.sessionId === "string" && SESSION_PATTERN.test(manifest.sessionId), "INVALID_SESSION", "Bundle session ID is invalid.");
  assert(manifest.adapter === "paperstream-capture", "INVALID_ADAPTER", "Bundle adapter is unsupported.");
  assert(manifest.transport === "parallels-shared-folder", "INVALID_TRANSPORT", "Bundle transport is unsupported.");
  const duplex = manifest.schemaVersion === DUPLEX_BUNDLE_SCHEMA;
  const duplexPairingSemantics = new Set(["adjacent-duplex-front-first", "adjacent-duplex-back-first"]);
  assert(
    duplex ? duplexPairingSemantics.has(manifest.pairingSemantics) : manifest.pairingSemantics === "unknown",
    "INVALID_PAIRING",
    duplex ? "Duplex bundle pairing semantics are invalid." : "Legacy bundle must not claim side pairing.",
  );
  assert(Array.isArray(manifest.frames), "INVALID_FRAMES", "Bundle frames must be an array.");
  assert(manifest.frames.length >= 1 && manifest.frames.length <= maxFiles, "FRAME_LIMIT", "Bundle frame count is outside the allowed range.");
  assert(manifest.frameCount === manifest.frames.length, "FRAME_COUNT_MISMATCH", "Bundle frame count does not match its manifest.");

  const seenPaths = new Set();
  const seenSequences = new Set();
  const frames = manifest.frames.map((frame, index) => {
    assert(frame && typeof frame === "object" && !Array.isArray(frame), "INVALID_FRAME", "Frame entry is invalid.");
    const relativePath = safeRelativePath(frame.relativePath);
    const caseKey = relativePath.toLocaleLowerCase("en-US");
    assert(!seenPaths.has(caseKey), "DUPLICATE_FRAME", "Bundle contains duplicate or case-colliding paths.");
    seenPaths.add(caseKey);
    assert(Number.isSafeInteger(frame.observedSequence) && frame.observedSequence === index + 1, "INVALID_SEQUENCE", "Frame sequence is not contiguous.");
    assert(!seenSequences.has(frame.observedSequence), "DUPLICATE_SEQUENCE", "Bundle contains duplicate frame sequences.");
    seenSequences.add(frame.observedSequence);
    assert(Number.isSafeInteger(frame.byteCount) && frame.byteCount > 0, "INVALID_SIZE", "Frame byte count is invalid.");
    assert(typeof frame.sha256 === "string" && HASH_PATTERN.test(frame.sha256), "INVALID_HASH", "Frame hash is invalid.");
    if (!duplex) {
      return { observedSequence: frame.observedSequence, relativePath, byteCount: frame.byteCount, sha256: frame.sha256, side: "UNKNOWN", pairedObservedSequence: null };
    }
    const firstSide = manifest.pairingSemantics === "adjacent-duplex-front-first" ? "FRONT" : "BACK";
    const expectedSide = frame.observedSequence % 2 === 1 ? firstSide : firstSide === "FRONT" ? "BACK" : "FRONT";
    const expectedPair = frame.observedSequence % 2 === 1 ? frame.observedSequence + 1 : frame.observedSequence - 1;
    assert(frame.side === expectedSide, "INVALID_PAIRING", "Duplex frame side contradicts the declared first-side sequence.");
    assert(Number.isSafeInteger(frame.pairedObservedSequence) && frame.pairedObservedSequence === expectedPair, "INVALID_PAIRING", "Duplex frame pair is not adjacent and reciprocal.");
    return { observedSequence: frame.observedSequence, relativePath, byteCount: frame.byteCount, sha256: frame.sha256, side: frame.side, pairedObservedSequence: frame.pairedObservedSequence };
  });
  if (duplex) {
    assert(frames.length % 2 === 0, "INVALID_PAIRING", "Duplex bundle must contain complete front/back pairs.");
    for (const frame of frames) {
      const paired = frames[frame.pairedObservedSequence - 1];
      assert(paired?.pairedObservedSequence === frame.observedSequence && paired.side !== frame.side, "INVALID_PAIRING", "Duplex pair is not reciprocal.");
    }
  }
  return { ...manifest, frames };
}

async function assertRegularContainedFile(framesRoot, relativePath) {
  const candidate = path.join(framesRoot, ...relativePath.split("/"));
  const info = await lstat(candidate).catch(() => null);
  assert(info?.isFile() && !info.isSymbolicLink(), "INVALID_FRAME_FILE", "Frame is missing or is not a regular file.");
  const [realRoot, realCandidate] = await Promise.all([realpath(framesRoot), realpath(candidate)]);
  const prefix = `${realRoot}${path.sep}`;
  assert(realCandidate.startsWith(prefix), "PATH_ESCAPE", "Frame resolves outside the bundle.");
  return { candidate, info };
}

export async function verifyBundle(bundlePath, { maxFiles = 16 } = {}) {
  assert(Number.isInteger(maxFiles) && maxFiles >= 1 && maxFiles <= 64, "INVALID_LIMIT", "Frame limit is invalid.");
  const bundleInfo = await lstat(bundlePath).catch(() => null);
  assert(bundleInfo?.isDirectory() && !bundleInfo.isSymbolicLink(), "INVALID_BUNDLE", "Bundle is missing or is not a regular directory.");
  const manifestPath = path.join(bundlePath, "manifest.json");
  const readyPath = path.join(bundlePath, "READY");
  const framesRoot = path.join(bundlePath, "frames");
  const [manifestBytes, readyBytes, framesInfo] = await Promise.all([
    readFile(manifestPath).catch(() => null),
    readFile(readyPath).catch(() => null),
    lstat(framesRoot).catch(() => null),
  ]);
  assert(manifestBytes && readyBytes && framesInfo?.isDirectory() && !framesInfo.isSymbolicLink(), "INCOMPLETE_BUNDLE", "Bundle is incomplete.");
  const manifestSha256 = createHash("sha256").update(manifestBytes).digest("hex");
  const readyHash = readyBytes.toString("utf8").trim().toLowerCase();
  assert(HASH_PATTERN.test(readyHash) && readyHash === manifestSha256, "READY_MISMATCH", "Ready marker does not bind the manifest.");
  const manifest = parseManifest(manifestBytes, maxFiles);
  assert(path.basename(path.resolve(bundlePath)) === manifest.sessionId, "SESSION_PATH_MISMATCH", "Bundle folder does not match the session ID.");

  for (const frame of manifest.frames) {
    const { candidate, info } = await assertRegularContainedFile(framesRoot, frame.relativePath);
    assert(info.size === frame.byteCount, "SIZE_MISMATCH", "Frame byte count does not match the manifest.");
    assert((await sha256(candidate)) === frame.sha256, "HASH_MISMATCH", "Frame hash does not match the manifest.");
  }
  return { manifest, manifestBytes, readyHash, manifestSha256, framesRoot };
}

async function verifyExistingImport(destination, verified) {
  const destinationManifest = await readFile(path.join(destination, "manifest.json")).catch(() => null);
  const receiptBytes = await readFile(path.join(destination, "IMPORT_RECEIPT.json")).catch(() => null);
  if (!destinationManifest || !receiptBytes) return false;
  if (createHash("sha256").update(destinationManifest).digest("hex") !== verified.manifestSha256) return false;
  let receipt;
  try {
    receipt = JSON.parse(receiptBytes.toString("utf8"));
  } catch {
    return false;
  }
  if (receipt.schemaVersion !== "phronesis.windows-scan-import/v1" || receipt.sessionId !== verified.manifest.sessionId || receipt.manifestSha256 !== verified.manifestSha256) return false;
  const importedFrames = path.join(destination, "frames");
  for (const frame of verified.manifest.frames) {
    const { candidate, info } = await assertRegularContainedFile(importedFrames, frame.relativePath).catch(() => ({ candidate: null, info: null }));
    if (!candidate || info.size !== frame.byteCount || (await sha256(candidate)) !== frame.sha256) return false;
  }
  return true;
}

export async function importBundle(bundlePath, outputRoot, { maxFiles = 16 } = {}) {
  const verified = await verifyBundle(bundlePath, { maxFiles });
  await mkdir(outputRoot, { recursive: true });
  const rootInfo = await lstat(outputRoot);
  assert(rootInfo.isDirectory() && !rootInfo.isSymbolicLink(), "INVALID_OUTPUT_ROOT", "Output root is not a regular directory.");
  const destination = path.join(outputRoot, verified.manifest.sessionId);
  const destinationInfo = await lstat(destination).catch(() => null);
  if (destinationInfo) {
    assert(destinationInfo.isDirectory() && !destinationInfo.isSymbolicLink(), "IMPORT_CONFLICT", "Import destination conflicts with an existing file.");
    if (await verifyExistingImport(destination, verified)) return { ...verified, status: "already_imported" };
    throw new BridgeError("IMPORT_CONFLICT", "Import destination contains conflicting evidence.");
  }

  const stagingRoot = path.join(outputRoot, ".staging");
  await mkdir(stagingRoot, { recursive: true });
  const stage = path.join(stagingRoot, `${verified.manifest.sessionId}.${randomUUID()}`);
  await mkdir(path.join(stage, "frames"), { recursive: true });

  for (const frame of verified.manifest.frames) {
    const source = path.join(verified.framesRoot, ...frame.relativePath.split("/"));
    const target = path.join(stage, "frames", ...frame.relativePath.split("/"));
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target, fsConstants.COPYFILE_EXCL);
    const targetInfo = await stat(target);
    assert(targetInfo.size === frame.byteCount && (await sha256(target)) === frame.sha256, "IMPORT_HASH_MISMATCH", "Imported frame failed verification.");
  }
  await writeFile(path.join(stage, "manifest.json"), verified.manifestBytes, { flag: "wx" });
  await writeFile(path.join(stage, "READY"), verified.readyHash, { encoding: "utf8", flag: "wx" });
  const receipt = {
    schemaVersion: "phronesis.windows-scan-import/v1",
    sessionId: verified.manifest.sessionId,
    manifestSha256: verified.manifestSha256,
    frameCount: verified.manifest.frames.length,
  };
  await writeFile(path.join(stage, "IMPORT_RECEIPT.json"), JSON.stringify(receipt), { encoding: "utf8", flag: "wx" });
  await rename(stage, destination);
  return { ...verified, status: "imported" };
}

function parseCli(argv) {
  const [command, ...rest] = argv;
  assert(command === "inspect" || command === "import", "USAGE", "Command must be inspect or import.");
  const options = { command, maxFiles: 16 };
  for (let index = 0; index < rest.length; index += 2) {
    const flag = rest[index];
    const value = rest[index + 1];
    assert(value !== undefined, "USAGE", "CLI option is missing a value.");
    if (flag === "--bundle") options.bundle = value;
    else if (flag === "--output-root") options.outputRoot = value;
    else if (flag === "--max-files") options.maxFiles = Number(value);
    else throw new BridgeError("USAGE", "CLI option is not supported.");
  }
  assert(options.bundle, "USAGE", "--bundle is required.");
  if (command === "import") assert(options.outputRoot, "USAGE", "--output-root is required for import.");
  return options;
}

async function main() {
  let sequence = 0;
  let sessionId = "unknown";
  const emit = (type, details = {}) => {
    sequence += 1;
    process.stdout.write(`${JSON.stringify({ schemaVersion: EVENT_SCHEMA, eventId: randomUUID(), sequence, timestamp: new Date().toISOString(), sessionId, type, details })}\n`);
  };
  try {
    const options = parseCli(process.argv.slice(2));
    emit("program.started", { command: options.command });
    const result = options.command === "inspect"
      ? await verifyBundle(options.bundle, { maxFiles: options.maxFiles })
      : await importBundle(options.bundle, options.outputRoot, { maxFiles: options.maxFiles });
    sessionId = result.manifest.sessionId;
    for (const frame of result.manifest.frames) {
      emit("frame.verified", { observedSequence: frame.observedSequence, fileName: path.posix.basename(frame.relativePath), byteCount: frame.byteCount, sha256: frame.sha256 });
    }
    emit(options.command === "inspect" ? "bundle.verified" : "bundle.imported", {
      frameCount: result.manifest.frames.length,
      manifestSha256: result.manifestSha256,
      status: result.status ?? "verified",
    });
  } catch (error) {
    const bridgeError = error instanceof BridgeError ? error : new BridgeError("UNEXPECTED", "Bridge operation failed safely.");
    emit("program.failed", { code: bridgeError.code, message: bridgeError.message });
    process.exitCode = bridgeError.code === "USAGE" ? 2 : 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
