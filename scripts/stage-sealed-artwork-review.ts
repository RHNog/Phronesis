import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import { PricingRepository } from "../lib/pricing/repository";
import { stageSealedArtworkReview } from "../lib/providers/community/SealedArtworkReview";

const databasePath = operationalPricingDatabasePath();
const repository = new PricingRepository(databasePath);

try {
  const result = await stageSealedArtworkReview(repository);
  process.stdout.write(`${JSON.stringify({ event: "sealed-artwork-review-staged", databasePath, ...result })}\n`);
} finally {
  repository.close();
}
