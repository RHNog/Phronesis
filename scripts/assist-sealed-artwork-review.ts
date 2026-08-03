import { join } from "node:path";
import { PricingRepository } from "../lib/pricing/repository";
import { runAssistedSealedArtworkRecovery } from "../lib/providers/community/SealedArtworkReview";

const databasePath = process.env.PHRONESIS_PRICING_DB_PATH ?? join(process.cwd(), ".data", "pricing-lookup.sqlite");
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
