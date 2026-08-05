import { join } from "node:path";
import { cardRecognitionDatabasePath } from "@/lib/cardRecognition/server";
import { operationalPricingDatabasePath } from "@/lib/pricing/databasePath";
import { processOneRecognitionJob } from "@/lib/cardRecognition/workerRuntime";

const runtimeRoot = process.env.PHRONESIS_CARD_RECOGNITION_ROOT ?? join(process.cwd(), ".data", "card-recognition");
const defaultExecutable = join(process.cwd(), "native", "recognition-worker", "macos", "PhronesisVisionWorker", ".build", "release", "phronesis-vision-worker");
const executable = process.env.PHRONESIS_VISION_WORKER ?? defaultExecutable;
const result = await processOneRecognitionJob({ databasePath: cardRecognitionDatabasePath(), runtimeRoot, pricingDatabasePath: operationalPricingDatabasePath(), visionExecutablePath: executable });
process.stdout.write(`${JSON.stringify(result)}\n`);
if (result.status === "FAILED") process.exitCode = 1;
