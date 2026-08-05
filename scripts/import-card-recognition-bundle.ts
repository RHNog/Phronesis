import { join, resolve } from "node:path";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { cardRecognitionDatabasePath } from "@/lib/cardRecognition/server";
import { ingestWindowsBundle } from "@/lib/cardRecognition/windowsBundle";

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value) throw new Error(`${name} is required`);
  return resolve(value);
}

const bundlePath = argument("--bundle");
const runtimeRoot = process.env.PHRONESIS_CARD_RECOGNITION_ROOT ?? join(process.cwd(), ".data", "card-recognition");
const repository = new CardRecognitionRepository(cardRecognitionDatabasePath(), runtimeRoot);

try {
  const result = await ingestWindowsBundle({ bundlePath, runtimeRoot, repository });
  process.stdout.write(`${JSON.stringify(result)}\n`);
} finally { repository.close(); }
