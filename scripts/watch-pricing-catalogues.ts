import { resolve } from "node:path";
import { pricingLookupConfig } from "../config/pricingLookup";
import { defaultPricingToolRoot, syncCompletedCatalogues } from "../lib/pricing/tcgplayerObserver";

const once = process.argv.includes("--once");
const databasePath = process.env.PHRONESIS_PRICING_DB_PATH ?? resolve(".data/pricing-lookup.sqlite");
const toolRoot = process.env.PHRONESIS_PRICING_TOOL_ROOT ?? defaultPricingToolRoot();
const archiveRoot = process.env.PHRONESIS_PRICING_ARCHIVE_ROOT ?? resolve(".data/pricing-catalogues");
let running = false;

function synchronize() {
  if (running) return;
  running = true;
  try {
    const attempts = syncCompletedCatalogues({ archiveRoot, databasePath, toolRoot });
    for (const attempt of attempts) process.stdout.write(`${JSON.stringify(attempt)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[pricing-sync] ${message.replace(/[\r\n]+/g, " ")}\n`);
  } finally {
    running = false;
  }
}

synchronize();
if (!once) {
  const timer = setInterval(synchronize, pricingLookupConfig.observerPollMilliseconds);
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      clearInterval(timer);
      process.exit(0);
    });
  }
}
