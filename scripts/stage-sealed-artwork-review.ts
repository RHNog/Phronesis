import { join } from "node:path";
import { PricingRepository } from "../lib/pricing/repository";
import { stageSealedArtworkReview } from "../lib/providers/community/SealedArtworkReview";

const databasePath = process.env.PHRONESIS_PRICING_DB_PATH ?? join(process.cwd(), ".data", "pricing-lookup.sqlite");
const repository = new PricingRepository(databasePath);

try {
  const result = await stageSealedArtworkReview(repository);
  process.stdout.write(`${JSON.stringify({ event: "sealed-artwork-review-staged", databasePath, ...result })}\n`);
} finally {
  repository.close();
}
