import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { BridgeError, importBundle, verifyBundle } from "../bridge-import.mjs";

async function fixture({ sessionId = "phr-test-001", frameNames = ["001.jpg", "002.jpg"], duplex = false, firstSide = "FRONT" } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "phr-windows-bridge-"));
  const bundle = path.join(root, sessionId);
  const framesRoot = path.join(bundle, "frames");
  await mkdir(framesRoot, { recursive: true });
  const frames = [];
  for (const [index, name] of frameNames.entries()) {
    const bytes = Buffer.from(`synthetic-frame-${index + 1}`);
    await writeFile(path.join(framesRoot, name), bytes);
    const observedSequence = index + 1;
    frames.push({
      observedSequence,
      relativePath: name,
      byteCount: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      ...(duplex ? {
        side: observedSequence % 2 === 1 ? firstSide : firstSide === "FRONT" ? "BACK" : "FRONT",
        pairedObservedSequence: observedSequence % 2 === 1 ? observedSequence + 1 : observedSequence - 1,
      } : {}),
    });
  }
  const manifest = {
    schemaVersion: duplex ? "phronesis.windows-scan-bundle/v2" : "phronesis.windows-scan-bundle/v1",
    sessionId,
    adapter: "paperstream-capture",
    transport: "parallels-shared-folder",
    profileName: "Phronesis Card Duplex",
    pairingSemantics: duplex ? firstSide === "FRONT" ? "adjacent-duplex-front-first" : "adjacent-duplex-back-first" : "unknown",
    frameCount: frames.length,
    frames,
  };
  const manifestBytes = Buffer.from(JSON.stringify(manifest));
  await writeFile(path.join(bundle, "manifest.json"), manifestBytes);
  await writeFile(path.join(bundle, "READY"), createHash("sha256").update(manifestBytes).digest("hex"));
  return { root, bundle, framesRoot, manifest };
}

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) => error instanceof BridgeError && error.code === code);
}

test("verifies a valid sealed bundle", async () => {
  const { bundle } = await fixture();
  const result = await verifyBundle(bundle);
  assert.equal(result.manifest.frameCount, 2);
});

test("verifies explicit reciprocal adjacent duplex pairs", async () => {
  const { bundle } = await fixture({ sessionId: "phr-test-duplex", duplex: true });
  const result = await verifyBundle(bundle);
  assert.equal(result.manifest.schemaVersion, "phronesis.windows-scan-bundle/v2");
  assert.deepEqual(result.manifest.frames.map(({ side, pairedObservedSequence }) => ({ side, pairedObservedSequence })), [
    { side: "FRONT", pairedObservedSequence: 2 },
    { side: "BACK", pairedObservedSequence: 1 },
  ]);
});

test("verifies the physically observed back-first reciprocal pairs", async () => {
  const { bundle } = await fixture({ sessionId: "phr-test-duplex-back-first", duplex: true, firstSide: "BACK" });
  const result = await verifyBundle(bundle);
  assert.equal(result.manifest.pairingSemantics, "adjacent-duplex-back-first");
  assert.deepEqual(result.manifest.frames.map(({ side, pairedObservedSequence }) => ({ side, pairedObservedSequence })), [
    { side: "BACK", pairedObservedSequence: 2 },
    { side: "FRONT", pairedObservedSequence: 1 },
  ]);
});

test("rejects incomplete or contradictory duplex pairs", async () => {
  const odd = await fixture({ sessionId: "phr-test-duplex-odd", frameNames: ["001.jpg"], duplex: true });
  await expectCode(verifyBundle(odd.bundle), "INVALID_PAIRING");

  const contradictory = await fixture({ sessionId: "phr-test-duplex-wrong", duplex: true });
  contradictory.manifest.frames[1].side = "FRONT";
  const bytes = Buffer.from(JSON.stringify(contradictory.manifest));
  await writeFile(path.join(contradictory.bundle, "manifest.json"), bytes);
  await writeFile(path.join(contradictory.bundle, "READY"), createHash("sha256").update(bytes).digest("hex"));
  await expectCode(verifyBundle(contradictory.bundle), "INVALID_PAIRING");
});

test("imports atomically and repeats idempotently", async () => {
  const { root, bundle } = await fixture();
  const outputRoot = path.join(root, "imports");
  const first = await importBundle(bundle, outputRoot);
  const second = await importBundle(bundle, outputRoot);
  assert.equal(first.status, "imported");
  assert.equal(second.status, "already_imported");
  const receipt = JSON.parse(await readFile(path.join(outputRoot, "phr-test-001", "IMPORT_RECEIPT.json"), "utf8"));
  assert.equal(receipt.frameCount, 2);
});

test("rejects a missing ready marker", async () => {
  const { bundle } = await fixture();
  await writeFile(path.join(bundle, "READY"), "");
  await expectCode(verifyBundle(bundle), "READY_MISMATCH");
});

test("rejects a ready marker that does not bind the manifest", async () => {
  const { bundle } = await fixture();
  await writeFile(path.join(bundle, "READY"), "0".repeat(64));
  await expectCode(verifyBundle(bundle), "READY_MISMATCH");
});

test("rejects a changed source frame", async () => {
  const { bundle, framesRoot } = await fixture();
  await writeFile(path.join(framesRoot, "001.jpg"), "changed");
  await expectCode(verifyBundle(bundle), "SIZE_MISMATCH");
});

test("rejects traversal paths", async () => {
  const { bundle, manifest } = await fixture();
  manifest.frames[0].relativePath = "../escape.jpg";
  const bytes = Buffer.from(JSON.stringify(manifest));
  await writeFile(path.join(bundle, "manifest.json"), bytes);
  await writeFile(path.join(bundle, "READY"), createHash("sha256").update(bytes).digest("hex"));
  await expectCode(verifyBundle(bundle), "INVALID_PATH");
});

test("rejects duplicate case-colliding paths", async () => {
  const { bundle, manifest } = await fixture();
  manifest.frames[1].relativePath = "001.JPG";
  const bytes = Buffer.from(JSON.stringify(manifest));
  await writeFile(path.join(bundle, "manifest.json"), bytes);
  await writeFile(path.join(bundle, "READY"), createHash("sha256").update(bytes).digest("hex"));
  await expectCode(verifyBundle(bundle), "DUPLICATE_FRAME");
});

test("rejects a symlinked frame", async () => {
  const { root, bundle, framesRoot, manifest } = await fixture({ frameNames: ["001.jpg"] });
  const outside = path.join(root, "outside.jpg");
  await writeFile(outside, "outside");
  await writeFile(path.join(framesRoot, "001.jpg"), "temporary");
  const filePath = path.join(framesRoot, "linked.jpg");
  await symlink(outside, filePath);
  manifest.frames[0] = {
    observedSequence: 1,
    relativePath: "linked.jpg",
    byteCount: 7,
    sha256: createHash("sha256").update("outside").digest("hex"),
  };
  const bytes = Buffer.from(JSON.stringify(manifest));
  await writeFile(path.join(bundle, "manifest.json"), bytes);
  await writeFile(path.join(bundle, "READY"), createHash("sha256").update(bytes).digest("hex"));
  await expectCode(verifyBundle(bundle), "INVALID_FRAME_FILE");
});

test("rejects a conflicting existing import", async () => {
  const { root, bundle } = await fixture();
  const outputRoot = path.join(root, "imports");
  await importBundle(bundle, outputRoot);
  await writeFile(path.join(outputRoot, "phr-test-001", "frames", "001.jpg"), "conflict");
  await expectCode(importBundle(bundle, outputRoot), "IMPORT_CONFLICT");
});

test("rejects unsupported extensions and excessive frame counts", async () => {
  const { bundle, manifest } = await fixture();
  manifest.frames[0].relativePath = "001.pdf";
  const bytes = Buffer.from(JSON.stringify(manifest));
  await writeFile(path.join(bundle, "manifest.json"), bytes);
  await writeFile(path.join(bundle, "READY"), createHash("sha256").update(bytes).digest("hex"));
  await expectCode(verifyBundle(bundle), "UNSUPPORTED_EXTENSION");

  const valid = await fixture({ sessionId: "phr-test-002" });
  await expectCode(verifyBundle(valid.bundle, { maxFiles: 1 }), "FRAME_LIMIT");
});
