import { resolve } from "node:path";
import { pricingLookupConfig } from "../config/pricingLookup";
import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import {
  defaultPricingToolRoot,
  syncCompletedCatalogues,
} from "../lib/pricing/tcgplayerObserver";
import { refreshWatchedCategory } from "../lib/watchlist/CatalogueWatchRefresh";
import { enrichWatchedCategoryWithJustTCG } from "../lib/watchlist/JustTCGWatchEnrichment";
import {
  getMarketEvidenceRepository,
  getWatchlistRepository,
} from "../lib/watchlist/repositories";
import { rebuildRegionalCrosswalk } from "../lib/regional/reconciliation";
import { rebuildPokemonRegionalCrosswalk } from "../lib/regional/pokemonReconciliation";

const once = process.argv.includes("--once");
const databasePath = operationalPricingDatabasePath();
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
    if (verifiedCategories.has("magic-en")) {
      const report = rebuildRegionalCrosswalk({ databasePath });
      process.stdout.write(
        `${JSON.stringify({ event: "regional-crosswalk-reconciled", sourceRunId: report.sourceRunId, matched: report.matched, comparableBoth: report.comparableBoth, fingerprint: report.crosswalkFingerprint })}\n`,
      );
    }
    if (verifiedCategories.has("pokemon-en")) {
      try {
        const report = rebuildPokemonRegionalCrosswalk({ databasePath });
        process.stdout.write(
          `${JSON.stringify({ event: "pokemon-regional-crosswalk-reconciled", sourceRunId: report.sourceRunId, matched: report.matched, targetExact: report.targetExact, targetCompatible: report.targetCompatible, fingerprint: report.targetLedgerFingerprint })}\n`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("No complete LigaPokemon dry-run snapshot")) {
          throw error;
        }
        process.stdout.write(
          `${JSON.stringify({ event: "pokemon-regional-crosswalk-skipped", reason: "NO_COMPLETE_SNAPSHOT" })}\n`,
        );
      }
    }
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
