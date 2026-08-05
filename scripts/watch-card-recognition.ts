import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { cardRecognitionDatabasePath } from "@/lib/cardRecognition/server";
import { operationalPricingDatabasePath } from "@/lib/pricing/databasePath";
import { ingestWindowsBundle } from "@/lib/cardRecognition/windowsBundle";
import { processOneRecognitionJob } from "@/lib/cardRecognition/workerRuntime";

const once = process.argv.includes("--once");
const inboxValue = process.env.PHRONESIS_WINDOWS_BUNDLE_INBOX?.trim();
if (!inboxValue) throw new Error("PHRONESIS_WINDOWS_BUNDLE_INBOX is required");
const inbox = resolve(inboxValue);
const runtimeRoot = process.env.PHRONESIS_CARD_RECOGNITION_ROOT ?? join(process.cwd(), ".data", "card-recognition");
const databasePath = cardRecognitionDatabasePath();
const pricingDatabasePath = operationalPricingDatabasePath();
const visionExecutablePath = process.env.PHRONESIS_VISION_WORKER ?? join(process.cwd(), "native", "recognition-worker", "macos", "PhronesisVisionWorker", ".build", "release", "phronesis-vision-worker");

async function cycle() {
  const repository = new CardRecognitionRepository(databasePath, runtimeRoot);
  try {
    for (const name of readdirSync(inbox, { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name).sort()) {
      const bundlePath = join(inbox, name);
      if (!existsSync(join(bundlePath, "READY"))) continue;
      const result = await ingestWindowsBundle({ bundlePath, runtimeRoot, repository });
      process.stdout.write(`${JSON.stringify({ type: "bundle", status: result.bridgeStatus, sessionId: result.session.id, frameCount: result.session.counts.frames })}\n`);
    }
  } finally { repository.close(); }
  while (true) {
    const result = await processOneRecognitionJob({ databasePath, runtimeRoot, pricingDatabasePath, visionExecutablePath });
    process.stdout.write(`${JSON.stringify({ type: "recognition", ...result })}\n`);
    if (result.status === "IDLE") break;
  }
}

do {
  await cycle();
  if (!once) await new Promise((resolveDelay) => setTimeout(resolveDelay, 2_000));
} while (!once);
