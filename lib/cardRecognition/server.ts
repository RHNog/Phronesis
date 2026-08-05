import { join } from "node:path";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";

let repository: CardRecognitionRepository | null = null;

export function cardRecognitionDatabasePath(): string {
  return process.env.PHRONESIS_CARD_RECOGNITION_DB ?? join(process.cwd(), ".data", "card-recognition.sqlite");
}

export function cardRecognitionRuntimeRoot(): string {
  return process.env.PHRONESIS_CARD_RECOGNITION_ROOT ?? join(process.cwd(), ".data", "card-recognition");
}

export function getCardRecognitionRepository(): CardRecognitionRepository {
  if (!repository) repository = new CardRecognitionRepository(cardRecognitionDatabasePath(), cardRecognitionRuntimeRoot());
  return repository;
}
