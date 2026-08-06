import { join } from "node:path";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { cardRecognitionDatabasePath } from "@/lib/cardRecognition/server";

const index = process.argv.indexOf("--session");
const sessionId = index >= 0 ? process.argv[index + 1]?.trim() : undefined;
if (!sessionId) throw new Error("--session is required");

const runtimeRoot = process.env.PHRONESIS_CARD_RECOGNITION_ROOT ?? join(process.cwd(), ".data", "card-recognition");
const repository = new CardRecognitionRepository(cardRecognitionDatabasePath(), runtimeRoot);

try {
  const result = repository.recoverSessionJobs(sessionId);
  process.stdout.write(`${JSON.stringify({ schemaVersion: "phronesis.recognition-recovery.v1", sessionId, requeued: result.requeued })}\n`);
} finally {
  repository.close();
}
