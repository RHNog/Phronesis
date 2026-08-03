import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DurableArtworkCache, isApprovedArtworkSource } from "../lib/artwork/DurableArtworkCache";
import { PricingRepository, type ArtworkWarmCandidate } from "../lib/pricing/repository";
import { PokefilesArtworkSource, resolvePokefilesArtwork } from "../lib/providers/community/PokefilesArtworkSource";
import { PtcgAssetsArtworkSource, resolvePtcgAssetsArtwork } from "../lib/providers/community/PtcgAssetsArtworkSource";
import type { CardImageUrls } from "../types/card";

const maximumPrefetch = 5_000;
const maximumConcurrency = 8;
const communityCacheMaximumBytes = 16 * 1024 * 1024;

function integerArgument(name: string, fallback: number, maximum: number): number {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const parsed = Number.parseInt(process.argv[index + 1] ?? "", 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > maximum) {
    throw new Error(`${name} must be an integer from 0 through ${maximum}.`);
  }
  return parsed;
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : "Unknown community artwork source failure.";
}

async function runBounded(tasks: Array<() => Promise<void>>, concurrency: number): Promise<void> {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (next < tasks.length) {
      const index = next;
      next += 1;
      await tasks[index]();
    }
  }));
}

function coverage(repository: PricingRepository, candidates: ArtworkWarmCandidate[]) {
  const resolved = Object.keys(repository.getArtworkResolutions(candidates)).length;
  return {
    candidates: candidates.length,
    resolved,
    percent: candidates.length ? Number(((resolved / candidates.length) * 100).toFixed(2)) : 100,
  };
}

function preferredSource(urls: CardImageUrls): string | null {
  return urls.small ?? urls.normal ?? urls.large ?? urls.artCrop ?? null;
}

async function tcgdexFallback(source: string): Promise<CardImageUrls | null> {
  const sourceUrl = new URL(source);
  if (sourceUrl.hostname !== "images.pokemontcg.io") return null;
  const path = sourceUrl.pathname.match(/^\/([^/]+)\/([^/_]+)(?:_hires)?\.png$/i);
  if (!path) return null;
  const providerId = `${decodeURIComponent(path[1])}-${decodeURIComponent(path[2])}`;
  const response = await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(providerId)}`, {
    headers: { Accept: "application/json", "User-Agent": "Phronesis/0.1 community artwork fallback" },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;
  const record = await response.json() as { id?: unknown; image?: unknown };
  if (record.id !== providerId || typeof record.image !== "string") return null;
  const base = record.image.replace(/\/$/, "");
  const urls = { small: `${base}/low.webp`, normal: `${base}/high.webp`, large: `${base}/high.webp` };
  return Object.values(urls).every(isApprovedArtworkSource) ? urls : null;
}

async function writeAuditReport(root: string, report: Record<string, unknown>): Promise<string> {
  const runs = join(root, "runs");
  await mkdir(runs, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runPath = join(runs, `${stamp}.json`);
  const latestPath = join(root, "latest.json");
  const body = `${JSON.stringify(report, null, 2)}\n`;
  const suffix = randomUUID();
  const temporaryRun = `${runPath}.${suffix}.tmp`;
  const temporaryLatest = `${latestPath}.${suffix}.tmp`;
  await Promise.all([
    writeFile(temporaryRun, body, { encoding: "utf8", flag: "wx" }),
    writeFile(temporaryLatest, body, { encoding: "utf8", flag: "wx" }),
  ]);
  await rename(temporaryRun, runPath);
  await rename(temporaryLatest, latestPath);
  return runPath;
}

const dryRun = process.argv.includes("--dry-run");
const prefetchLimit = integerArgument("--prefetch", 1_500, maximumPrefetch);
const concurrency = integerArgument("--concurrency", 4, maximumConcurrency) || 1;
const databasePath = process.env.PHRONESIS_PRICING_DB_PATH ?? join(process.cwd(), ".data", "pricing-lookup.sqlite");
const reportRoot = process.env.PHRONESIS_COMMUNITY_ARTWORK_REPORT_PATH ?? join(process.cwd(), ".data", "community-artwork");
const repository = new PricingRepository(databasePath);

try {
  const singles = repository.listArtworkCandidates("pokemon-en", "SINGLE");
  const sealed = repository.listArtworkCandidates("pokemon-en", "SEALED");
  const before = { singles: coverage(repository, singles), sealed: coverage(repository, sealed) };
  process.stdout.write(`${JSON.stringify({
    event: "community-artwork-gap-fill-started",
    databasePath,
    dryRun,
    prefetchLimit,
    concurrency,
    before,
  })}\n`);

  const [pokefilesResult, ptcgAssetsResult] = await Promise.allSettled([
    new PokefilesArtworkSource({
      anonKey: process.env.POKEFILES_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.POKEFILES_SUPABASE_URL,
    }).snapshot(),
    new PtcgAssetsArtworkSource().snapshot(),
  ]);

  let pokefilesArtwork: Record<string, CardImageUrls> = {};
  let pokefilesStored = 0;
  let pokefilesReport: Record<string, unknown>;
  if (pokefilesResult.status === "fulfilled") {
    pokefilesArtwork = resolvePokefilesArtwork(singles, pokefilesResult.value.cards);
    if (!dryRun) {
      pokefilesStored = repository.saveMissingArtworkResolutions(singles, pokefilesArtwork, "pokefiles");
    }
    pokefilesReport = {
      status: "OPERATIONAL",
      sourceCards: pokefilesResult.value.sourceCardCount,
      usableCards: pokefilesResult.value.cards.length,
      sets: pokefilesResult.value.setCount,
      syncedAt: pokefilesResult.value.syncedAt,
      upstreamHosts: pokefilesResult.value.upstreamHosts,
      exactCandidates: Object.keys(pokefilesArtwork).length,
      storedMappings: pokefilesStored,
    };
  } else {
    pokefilesReport = { status: "FAILED", error: errorMessage(pokefilesResult.reason) };
  }

  let ptcgArtwork: Record<string, CardImageUrls> = {};
  let ptcgStored = 0;
  let ptcgReport: Record<string, unknown>;
  if (ptcgAssetsResult.status === "fulfilled") {
    const resolved = resolvePtcgAssetsArtwork(
      sealed,
      ptcgAssetsResult.value,
      pokefilesResult.status === "fulfilled" ? pokefilesResult.value.cards : [],
    );
    ptcgArtwork = resolved.artwork;
    if (!dryRun) {
      ptcgStored = repository.saveMissingArtworkResolutions(sealed, ptcgArtwork, "ptcg-assets");
    }
    ptcgReport = {
      status: "OPERATIONAL",
      commitSha: ptcgAssetsResult.value.commitSha,
      sourceFiles: ptcgAssetsResult.value.sourceFileCount,
      eligibleAssets: ptcgAssetsResult.value.assets.length,
      sourceSets: ptcgAssetsResult.value.sets.length,
      exactCandidates: resolved.exact,
      storedMappings: ptcgStored,
      ambiguous: resolved.ambiguous.length,
      unmatched: resolved.unmatched.length,
      acceptedMatches: resolved.accepted,
      ambiguitySamples: resolved.ambiguous.slice(0, 30),
      unmatchedSamples: resolved.unmatched.slice(0, 30),
    };
  } else {
    ptcgReport = { status: "FAILED", error: errorMessage(ptcgAssetsResult.reason) };
  }

  const cacheSources = new Map<string, number>();
  const sourceSkus = new Map<string, string[]>();
  const priority = new Map([...singles, ...sealed].map((candidate) => [candidate.sku, candidate.artworkPriorityCents]));
  const activeArtwork = dryRun
    ? { ...pokefilesArtwork, ...ptcgArtwork }
    : repository.getArtworkResolutions([...singles, ...sealed]);
  for (const [sku, urls] of Object.entries(activeArtwork)) {
    const source = preferredSource(urls);
    if (!source || !isApprovedArtworkSource(source)) continue;
    cacheSources.set(source, Math.max(cacheSources.get(source) ?? 0, priority.get(sku) ?? 0));
    sourceSkus.set(source, [...(sourceSkus.get(source) ?? []), sku]);
  }
  const selectedSources = [...cacheSources.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, dryRun ? 0 : prefetchLimit)
    .map(([source]) => source);
  let cached = 0;
  let cacheFailures = 0;
  let fallbackMappings = 0;
  const cacheFailureSamples: Array<{ source: string; error: string }> = [];
  const cache = new DurableArtworkCache({ maximumBytes: communityCacheMaximumBytes });
  const candidatesBySku = new Map([...singles, ...sealed].map((candidate) => [candidate.sku, candidate]));
  await runBounded(selectedSources.map((source) => async () => {
    try {
      await cache.get(source);
      cached += 1;
    } catch (error) {
      try {
        const fallback = await tcgdexFallback(source);
        if (fallback) {
          await cache.get(preferredSource(fallback)!);
          const fallbackMatches = (sourceSkus.get(source) ?? [])
            .map((sku) => candidatesBySku.get(sku))
            .filter((candidate): candidate is ArtworkWarmCandidate => Boolean(candidate));
          const fallbackArtwork = Object.fromEntries(fallbackMatches.map((candidate) => [candidate.sku, fallback]));
          fallbackMappings += repository.saveArtworkResolutions(fallbackMatches, fallbackArtwork, "tcgdex-fallback");
          cached += 1;
          return;
        }
      } catch {
        // The original verified cache failure remains the actionable audit result.
      }
      cacheFailures += 1;
      if (cacheFailureSamples.length < 30) cacheFailureSamples.push({ source, error: errorMessage(error) });
    }
  }), concurrency);

  const after = { singles: coverage(repository, singles), sealed: coverage(repository, sealed) };
  const report = {
    featureId: "PHR-API-004",
    event: "community-artwork-gap-fill-completed",
    completedAt: new Date().toISOString(),
    dryRun,
    databasePath,
    before,
    after,
    sources: { pokefiles: pokefilesReport, ptcgAssets: ptcgReport },
    cache: {
      requested: selectedSources.length,
      cached,
      failures: cacheFailures,
      fallbackMappings,
      maximumBytes: communityCacheMaximumBytes,
      failureSamples: cacheFailureSamples,
    },
  };
  const reportPath = await writeAuditReport(reportRoot, report);
  process.stdout.write(`${JSON.stringify({ ...report, reportPath })}\n`);
  if (pokefilesResult.status === "rejected" || ptcgAssetsResult.status === "rejected" || cacheFailures > 0) {
    process.exitCode = 1;
  }
} finally {
  repository.close();
}
