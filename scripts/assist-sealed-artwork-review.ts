import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import { PricingRepository } from "../lib/pricing/repository";
import { runAssistedSealedArtworkRecovery } from "../lib/providers/community/SealedArtworkReview";

const databasePath = operationalPricingDatabasePath();
const dryRun = !process.argv.includes("--apply");
const repository = new PricingRepository(databasePath);

try {
  const before = repository.getArtworkReviewQueue().summary;
  const result = await runAssistedSealedArtworkRecovery(repository, { dryRun });
  const after = repository.getArtworkReviewQueue().summary;
  process.stdout.write(`${JSON.stringify({
    event: "sealed-artwork-assisted-recovery",
    databasePath,
    before,
    ...result,
    after,
  })}\n`);
} finally {
  repository.close();
}
