import { join } from "node:path";
import { activeRecognitionLane } from "@/lib/cardRecognition/pipeline";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { cardRecognitionDatabasePath } from "@/lib/cardRecognition/server";

function argument(name: string): string | null {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1]?.trim() : undefined;
  return value || null;
}

const sessionId = argument("--session");
if (!sessionId) throw new Error("--session is required");
const reason = argument("--reason") ?? `Recognition pipeline ${activeRecognitionLane.pipelineVersion}`;
const runtimeRoot = process.env.PHRONESIS_CARD_RECOGNITION_ROOT ?? join(process.cwd(), ".data", "card-recognition");
const repository = new CardRecognitionRepository(cardRecognitionDatabasePath(), runtimeRoot);

try {
  const result = repository.reprocessSession(sessionId, reason);
  process.stdout.write(`${JSON.stringify({ schemaVersion: "phronesis.recognition-reprocess.v1", sessionId, reason, status: result.status, regionCount: result.regions.length })}\n`);
} finally { repository.close(); }
