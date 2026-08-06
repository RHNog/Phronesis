import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { extname, join } from "node:path";
import { importBundle } from "../../native/scanner-agent/windows/PhronesisScannerBridge/bridge-import.mjs";
import type { CardRecognitionRepository } from "@/lib/cardRecognition/repository";

function mediaType(path: string): "image/jpeg" | "image/png" | "image/tiff" {
  const extension = extname(path).toLowerCase();
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";
  if (extension === ".png") return "image/png";
  if (extension === ".tif" || extension === ".tiff") return "image/tiff";
  throw new Error("unsupported frame extension");
}

export async function ingestWindowsBundle(input: { bundlePath: string; runtimeRoot: string; repository: CardRecognitionRepository }) {
  const imported = await importBundle(input.bundlePath, join(input.runtimeRoot, "bundles"), { maxFiles: 64 });
  try { input.repository.createSessionWithId(imported.manifest.sessionId, imported.manifest.profileName || "Windows scanner intake"); }
  catch (error) { if (!(error instanceof Error) || !error.message.includes("UNIQUE constraint failed")) throw error; }
  const frames = [];
  for (const frame of imported.manifest.frames) {
    const sourcePath = join(input.runtimeRoot, "bundles", imported.manifest.sessionId, "frames", ...frame.relativePath.split("/"));
    const bytes = readFileSync(sourcePath);
    const object = input.repository.putObject(bytes);
    if (object.sha256 !== frame.sha256 || createHash("sha256").update(bytes).digest("hex") !== frame.sha256) throw new Error("verified bundle changed before repository import");
    const frameId = `${imported.manifest.sessionId}:frame:${frame.observedSequence}`;
    const pairedFrameId = frame.pairedObservedSequence === null
      ? null
      : `${imported.manifest.sessionId}:frame:${frame.pairedObservedSequence}`;
    const scanFrame = {
      frameId,
      sessionId: imported.manifest.sessionId,
      sequence: frame.observedSequence - 1,
      side: frame.side,
      objectSha256: frame.sha256,
      mediaType: mediaType(sourcePath),
      byteLength: frame.byteCount,
      capturedAt: new Date().toISOString(),
      pairedFrameId,
    } as const;
    const scheduleRecognition = frame.side !== "BACK";
    const result = scheduleRecognition
      ? input.repository.addFrame(scanFrame, { scheduleRecognition: true })
      : input.repository.addFrame(scanFrame, { scheduleRecognition: false });
    frames.push({ sequence: frame.observedSequence, side: frame.side, pairedFrameId, recognitionScheduled: scheduleRecognition, status: result.status, sha256: frame.sha256 });
  }
  input.repository.reconcileSessionState(imported.manifest.sessionId);
  return { schemaVersion: "phronesis.recognition-import.v1" as const, bridgeStatus: imported.status, manifestSha256: imported.manifestSha256, session: input.repository.sessionSummary(imported.manifest.sessionId), frames };
}
