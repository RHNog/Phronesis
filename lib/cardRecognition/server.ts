import { join } from "node:path";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { ScannerApplianceRepository } from "@/lib/cardRecognition/scannerAppliance";

let repository: CardRecognitionRepository | null = null;
let scannerApplianceRepository: ScannerApplianceRepository | null = null;

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

export function getScannerApplianceRepository(): ScannerApplianceRepository {
  if (!scannerApplianceRepository) scannerApplianceRepository = new ScannerApplianceRepository(getCardRecognitionRepository().database);
  return scannerApplianceRepository;
}
