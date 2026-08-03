import { operationalPricingDatabasePath } from "../lib/pricing/databasePath";
import { DurableArtworkCache, isApprovedArtworkSource } from "../lib/artwork/DurableArtworkCache";
import { resolveOnePieceSnapshotArtwork, resolveSnapshotArtwork } from "../lib/pricing/artwork";
import { PricingRepository, type ArtworkWarmCandidate } from "../lib/pricing/repository";
import { BandaiOnePieceProvider } from "../lib/providers/bandai/BandaiOnePieceProvider";
import { TcgdexProvider } from "../lib/providers/tcgdex/TcgdexProvider";
import type { Card, CardImageUrls } from "../types/card";

const maximumPrefetch = 5_000;
const maximumConcurrency = 8;
const maximumOnePieceQueries = 200;

function integerArgument(name: string, fallback: number, maximum: number): number {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const parsed = Number.parseInt(process.argv[index + 1] ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > maximum) {
    throw new Error(`${name} must be an integer from 0 through ${maximum}.`);
  }
  return parsed;
}

async function runBounded<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
  const results = new Array<T>(tasks.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (nextIndex < tasks.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await tasks[index]();
    }
  });
  await Promise.all(workers);
  return results;
}

function onePieceQueryPrefix(collectorNumber: string | null): string | null {
  const compact = (collectorNumber ?? "").toUpperCase().replace(/\s+/g, "");
  const match = compact.match(/^([A-Z]{1,6}(?:-?\d{1,3})?)-\d{1,4}/);
  if (!match) return null;
  const prefix = match[1].replace(/-$/, "");
  return prefix.length === 1 ? `${prefix}-` : prefix;
}

function preferredSource(urls: CardImageUrls): string | null {
  return urls.small ?? urls.normal ?? urls.large ?? urls.artCrop ?? null;
}

function deduplicatedCards(cards: Card[]): Card[] {
  return [...new Map(cards.map((card) => [card.id, card])).values()];
}

const prefetchLimit = integerArgument("--prefetch", 1_000, maximumPrefetch);
const concurrency = integerArgument("--concurrency", 4, maximumConcurrency) || 1;
const databasePath = operationalPricingDatabasePath();
const repository = new PricingRepository(databasePath);

try {
  const pokemonCandidates = repository.listArtworkCandidates("pokemon-en");
  const onePieceCandidates = repository.listArtworkCandidates("onepiece-en");
  const pokemonProvider = new TcgdexProvider();
  const onePieceProvider = new BandaiOnePieceProvider();

  process.stdout.write(`${JSON.stringify({
    event: "artwork-readiness-started",
    databasePath,
    pokemonCandidates: pokemonCandidates.length,
    onePieceCandidates: onePieceCandidates.length,
    prefetchLimit,
    concurrency,
  })}\n`);

  const pokemonResult = await pokemonProvider.listAllCardsWithDiagnostics();
  const pokemonArtwork = pokemonResult.errorMessage
    ? {}
    : resolveSnapshotArtwork(pokemonCandidates, pokemonResult.cards);
  const pokemonSaved = pokemonResult.errorMessage
    ? 0
    : repository.replaceArtworkResolutions(pokemonCandidates, pokemonArtwork, "tcgdex");
  process.stdout.write(`${JSON.stringify({
    event: "pokemon-artwork-indexed",
    providerCards: pokemonResult.cards.length,
    resolvedProducts: Object.keys(pokemonArtwork).length,
    savedProducts: pokemonSaved,
    errorKind: pokemonResult.errorKind ?? null,
    errorMessage: pokemonResult.errorMessage ?? null,
  })}\n`);

  const prefixFrequency = new Map<string, number>();
  for (const candidate of onePieceCandidates) {
    const prefix = onePieceQueryPrefix(candidate.collectorNumber);
    if (prefix) prefixFrequency.set(prefix, (prefixFrequency.get(prefix) ?? 0) + 1);
  }
  const onePieceQueries = [...prefixFrequency.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maximumOnePieceQueries)
    .map(([prefix]) => prefix);
  const onePieceResults = await runBounded(
    onePieceQueries.map((query) => () => onePieceProvider.searchCardsWithDiagnostics(query)),
    Math.min(concurrency, 2),
  );
  const onePieceCards = deduplicatedCards(onePieceResults.flatMap((result) => result.cards));
  const onePieceArtwork = resolveOnePieceSnapshotArtwork(onePieceCandidates, onePieceCards);
  const onePieceErrors = onePieceResults.filter((result) => result.errorMessage).length;
  const onePieceSaved = onePieceErrors || onePieceCards.length === 0
    ? 0
    : repository.replaceArtworkResolutions(onePieceCandidates, onePieceArtwork, "bandai-onepiece");
  process.stdout.write(`${JSON.stringify({
    event: "one-piece-artwork-indexed",
    providerQueries: onePieceQueries.length,
    providerCards: onePieceCards.length,
    resolvedProducts: Object.keys(onePieceArtwork).length,
    savedProducts: onePieceSaved,
    failedQueries: onePieceErrors,
  })}\n`);

  const allCandidates: ArtworkWarmCandidate[] = [...pokemonCandidates, ...onePieceCandidates];
  const persistedByCategory = [
    { candidates: pokemonCandidates, artwork: repository.getArtworkResolutions(pokemonCandidates) },
    { candidates: onePieceCandidates, artwork: repository.getArtworkResolutions(onePieceCandidates) },
  ];
  const priority = new Map(allCandidates.map((candidate) => [
    `${candidate.categoryId}|${candidate.sku}`,
    candidate.artworkPriorityCents,
  ]));
  const sourceEntries = persistedByCategory.flatMap(({ candidates, artwork }) => {
    const candidatesBySku = new Map(candidates.map((candidate) => [candidate.sku, candidate]));
    return Object.entries(artwork).map(([sku, urls]) => {
      const candidate = candidatesBySku.get(sku);
      const source = preferredSource(urls);
      return candidate && source && isApprovedArtworkSource(source)
        ? { source, priority: priority.get(`${candidate.categoryId}|${sku}`) ?? 0 }
        : null;
    });
  })
    .filter((entry): entry is { source: string; priority: number } => Boolean(entry));
  const priorityBySource = new Map<string, number>();
  for (const entry of sourceEntries) {
    priorityBySource.set(entry.source, Math.max(priorityBySource.get(entry.source) ?? 0, entry.priority));
  }
  const sources = [...priorityBySource]
    .map(([source, sourcePriority]) => ({ source, priority: sourcePriority }))
    .sort((a, b) => b.priority - a.priority || a.source.localeCompare(b.source))
    .slice(0, prefetchLimit);
  const cache = new DurableArtworkCache();
  let cached = 0;
  let cacheFailures = 0;
  await runBounded(sources.map(({ source }) => async () => {
    try {
      await cache.get(source);
      cached += 1;
    } catch {
      cacheFailures += 1;
    }
  }), concurrency);

  const report = {
    event: "artwork-readiness-completed",
    pokemon: {
      candidates: pokemonCandidates.length,
      providerCards: pokemonResult.cards.length,
      resolved: Object.keys(repository.getArtworkResolutions(pokemonCandidates)).length,
    },
    onePiece: {
      candidates: onePieceCandidates.length,
      providerCards: onePieceCards.length,
      providerQueries: onePieceQueries.length,
      failedQueries: onePieceErrors,
      resolved: Object.keys(repository.getArtworkResolutions(onePieceCandidates)).length,
    },
    cache: { requested: sources.length, cached, failures: cacheFailures },
  };
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (pokemonResult.errorMessage || onePieceCards.length === 0) process.exitCode = 1;
} finally {
  repository.close();
}
