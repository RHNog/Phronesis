import { resolve } from "node:path";
import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import { drainCapturedCatalogues } from "../lib/pricing/tcgplayerObserver";
import { refreshWatchedCategory } from "../lib/watchlist/CatalogueWatchRefresh";
import { enrichWatchedCategoryWithJustTCG } from "../lib/watchlist/JustTCGWatchEnrichment";
import {
  getMarketEvidenceRepository,
  getWatchlistRepository,
} from "../lib/watchlist/repositories";
import { rebuildRegionalCrosswalk } from "../lib/regional/reconciliation";
import { rebuildPokemonRegionalCrosswalk } from "../lib/regional/pokemonReconciliation";

const databasePath = operationalPricingDatabasePath();
const archiveRoot =
  process.env.PHRONESIS_PRICING_ARCHIVE_ROOT ??
  resolve(".data/pricing-catalogues");

async function importCapturedCatalogues(): Promise<void> {
  const verifiedCategories = new Set<string>();
  const attempts = drainCapturedCatalogues({
    archiveRoot,
    databasePath,
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
  for (const attempt of attempts) {
    process.stdout.write(`${JSON.stringify(attempt)}\n`);
  }
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
        `${JSON.stringify({ event: "pokemon-regional-crosswalk-reconciled", sourceRunId: report.sourceRunId, matched: report.matched, comparableBoth: report.comparableBoth, fingerprint: report.crosswalkFingerprint })}\n`,
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
  if (attempts.some((attempt) => attempt.outcome === "FAILED")) {
    process.exitCode = 1;
  }
}

void importCapturedCatalogues().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `[pricing-import] ${message.replace(/[\r\n]+/g, " ").slice(0, 800)}\n`,
  );
  process.exitCode = 1;
});
