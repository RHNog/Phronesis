import { randomUUID } from "node:crypto";
import { CardRecognitionRepository } from "@/lib/cardRecognition/repository";
import { VisionRecognitionWorker } from "@/lib/cardRecognition/visionWorker";
import { SqliteRecognitionCatalogue } from "@/lib/cardRecognition/sqliteCatalogue";
import { activeRecognitionLane, createRecognitionDecision } from "@/lib/cardRecognition/pipeline";

export async function processOneRecognitionJob(input: { databasePath: string; runtimeRoot: string; pricingDatabasePath: string; visionExecutablePath: string }) {
  const owner = `worker-${randomUUID()}`;
  const repository = new CardRecognitionRepository(input.databasePath, input.runtimeRoot);
  const catalogue = new SqliteRecognitionCatalogue(input.pricingDatabasePath);
  try {
    const lease = repository.acquireJob(owner, 120_000);
    if (!lease) return { schemaVersion: "phronesis.recognition-worker-event.v1" as const, status: "IDLE" as const };
    const context = repository.jobContext(lease.jobId);
    try {
      const analysis = await new VisionRecognitionWorker(input.visionExecutablePath).analyze(context.objectPath);
      const decision = createRecognitionDecision({
        regionId: context.regionId,
        analysis,
        catalogue,
        categoryId: activeRecognitionLane.categoryId,
        corpusVersion: activeRecognitionLane.corpusVersion,
        indexVersion: activeRecognitionLane.indexVersion,
        pipelineVersion: activeRecognitionLane.pipelineVersion,
      });
      repository.completeJob(lease.jobId, owner, decision);
      return { schemaVersion: "phronesis.recognition-worker-event.v1" as const, status: "COMPLETED" as const, jobId: lease.jobId, regionId: context.regionId, decisionStatus: decision.status, candidateCount: decision.candidates.length };
    } catch (error) {
      repository.failJob(lease.jobId, owner, error instanceof Error ? error.message : "local recognition failed");
      return { schemaVersion: "phronesis.recognition-worker-event.v1" as const, status: "FAILED" as const, jobId: lease.jobId };
    }
  } finally { catalogue.close(); repository.close(); }
}
