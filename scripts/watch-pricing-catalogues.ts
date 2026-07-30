import { resolve } from "node:path";
import { pricingLookupConfig } from "../config/pricingLookup";
import {
  defaultPricingToolRoot,
  syncCompletedCatalogues,
} from "../lib/pricing/tcgplayerObserver";
import { refreshWatchedCategory } from "../lib/watchlist/CatalogueWatchRefresh";
import { enrichWatchedCategoryWithJustTCG } from "../lib/watchlist/JustTCGWatchEnrichment";
import {
  getMarketEvidenceRepository,
  getWatchlistRepository,
} from "../lib/watchlist/server";

const once = process.argv.includes("--once");
const databasePath =
  process.env.PHRONESIS_PRICING_DB_PATH ??
  resolve(".data/pricing-lookup.sqlite");
const toolRoot =
  process.env.PHRONESIS_PRICING_TOOL_ROOT ?? defaultPricingToolRoot();
const archiveRoot =
  process.env.PHRONESIS_PRICING_ARCHIVE_ROOT ??
  resolve(".data/pricing-catalogues");
let running = false;

async function synchronize() {
  if (running) return;
  running = true;
  try {
    const verifiedCategories = new Set<string>();
    const attempts = syncCompletedCatalogues({
      archiveRoot,
      databasePath,
      toolRoot,
      onVerifiedCheckpoint: ({
        categoryId,
        checkpointAt,
        pricingRepository,
      }) => {
        verifiedCategories.add(categoryId);
        const refreshed = refreshWatchedCategory({
          categoryId,
          checkpointAt,
          pricingRepository,
          watchlistRepository: getWatchlistRepository(),
        });
        process.stdout.write(
          `${JSON.stringify({ categoryId, checkpointAt, watchlists: refreshed })}\n`,
        );
      },
    });
    for (const attempt of attempts)
      process.stdout.write(`${JSON.stringify(attempt)}\n`);
    for (const categoryId of verifiedCategories) {
      const enrichment = await enrichWatchedCategoryWithJustTCG({
        categoryId,
        evidenceRepository: getMarketEvidenceRepository(),
        watchlistRepository: getWatchlistRepository(),
      });
      process.stdout.write(
        `${JSON.stringify({ categoryId, justtcgWatchEnrichment: enrichment })}\n`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `[pricing-sync] ${message.replace(/[\r\n]+/g, " ")}\n`,
    );
  } finally {
    running = false;
  }
}

void synchronize();
if (!once) {
  const timer = setInterval(
    () => void synchronize(),
    pricingLookupConfig.observerPollMilliseconds,
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      clearInterval(timer);
      process.exit(0);
    });
  }
}
