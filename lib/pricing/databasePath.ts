import { join, resolve } from "node:path";

export const OPERATIONAL_PRICING_DATABASE_RELATIVE_PATH =
  ".data/mobile-review.sqlite";

export function operationalPricingDatabasePath(
  root = process.cwd(),
  configured = process.env.PHRONESIS_PRICING_DB_PATH,
): string {
  const explicit = configured?.trim();
  return explicit
    ? resolve(root, explicit)
    : join(root, OPERATIONAL_PRICING_DATABASE_RELATIVE_PATH);
}
