import { join } from "node:path";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { cardRecognitionDatabasePath } from "@/lib/cardRecognition/server";

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1]?.trim() : "";
  if (!value) throw new Error(`${name} is required`);
  return value;
}

if (!process.argv.includes("--confirm-swap-front-back")) {
  throw new Error("--confirm-swap-front-back is required");
}

const sessionId = argument("--session");
const correctedBy = argument("--operator");
const reason = argument("--reason");
const runtimeRoot = process.env.PHRONESIS_CARD_RECOGNITION_ROOT ?? join(process.cwd(), ".data", "card-recognition");
const repository = new CardRecognitionRepository(cardRecognitionDatabasePath(), runtimeRoot);
try {
  const result = repository.correctDuplexOrientation({ sessionId, correctedBy, reason });
  process.stdout.write(`${JSON.stringify({ status: result.status, session: result.session }, null, 2)}\n`);
} finally {
  repository.close();
}
