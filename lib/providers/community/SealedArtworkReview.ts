import type {
  ArtworkReviewCandidateInput,
  PricingRepository,
} from "@/lib/pricing/repository";
import type { SearchMatch } from "@/lib/pricing/types";
import {
  classifySealedProduct,
  PtcgAssetsArtworkSource,
  resolvePtcgAssetsArtwork,
} from "@/lib/providers/community/PtcgAssetsArtworkSource";

export type SealedArtworkReviewStageResult = {
  commitSha: string;
  durationMs: number;
  eligibleAssets: number;
  exactCandidates: number;
  reviewProducts: number;
  reviewCandidates: number;
  stagedRows: number;
  unmatched: number;
};

export const assistedSealedArtworkPolicyVersion = "v1";

export type AssistedSealedArtworkDecision = {
  sku: string;
  sourcePath: string;
  sourceUrl: string;
  rationale: string;
};

export type AssistedSealedArtworkResult = SealedArtworkReviewStageResult & {
  policyVersion: string;
  dryRun: boolean;
  eligible: number;
  applied: number;
  alreadyApplied: number;
  blockedByReview: number;
  blockedByResolution: number;
  skipped: number;
  skippedByReason: Record<string, number>;
};

const singleCandidateClasses = new Set([
  "BOOSTER_BOX",
  "BOOSTER_BUNDLE",
  "BOOSTER_PACK",
  "ELITE_TRAINER_BOX",
]);
const valueSensitiveProduct = /(?:\[[^\]]+\]|\b(?:1st|first) edition\b|\b(?:unlimited|shadowless|case|carton|half|18 pack|set of|pokemon center|exclusive|plus|sleeved|art set|wrapper)\b)/i;

function reviewPreparation(
  sealed: SearchMatch[],
  snapshot: Awaited<ReturnType<PtcgAssetsArtworkSource["snapshot"]>>,
) {
  const resolved = resolvePtcgAssetsArtwork(sealed, snapshot);
  const byPath = new Map(snapshot.assets.map((asset) => [asset.path, asset]));
  const candidates = resolved.ambiguous.flatMap((item) => item.candidates.flatMap((sourcePath, rank) => {
    const asset = byPath.get(sourcePath);
    return asset ? [{
      sku: item.sku,
      sourcePath,
      sourceUrl: asset.sourceUrl,
      productClass: classifySealedProduct(item.name),
      reason: item.reason,
      rank,
    }] : [];
  }));
  return { resolved, candidates };
}

export function selectAssistedSealedArtwork(
  sealed: readonly SearchMatch[],
  candidates: readonly ArtworkReviewCandidateInput[],
): { decisions: AssistedSealedArtworkDecision[]; skippedByReason: Record<string, number> } {
  const matches = new Map(sealed.map((match) => [match.sku, match]));
  const grouped = new Map<string, ArtworkReviewCandidateInput[]>();
  for (const candidate of candidates) {
    grouped.set(candidate.sku, [...(grouped.get(candidate.sku) ?? []), candidate]);
  }
  const decisions: AssistedSealedArtworkDecision[] = [];
  const skippedByReason: Record<string, number> = {};
  const skip = (reason: string) => { skippedByReason[reason] = (skippedByReason[reason] ?? 0) + 1; };
  for (const [sku, options] of grouped) {
    const match = matches.get(sku);
    const ordered = [...options].sort((a, b) => a.rank - b.rank || a.sourcePath.localeCompare(b.sourcePath));
    const candidate = ordered[0];
    if (!match || !candidate) {
      skip("MISSING_CATALOGUE_IDENTITY");
      continue;
    }
    if (candidate.reason !== "DESCRIPTOR_NOT_UNIQUE") {
      skip(candidate.reason === "MIXED_PRODUCT_FILENAME_NOT_EXACT" ? "MIXED_PRODUCT_GUESS" : "NON_UNIQUE_DESCRIPTOR_EVIDENCE");
      continue;
    }
    if (valueSensitiveProduct.test(match.name)) {
      skip("VALUE_SENSITIVE_OR_COMPOSITE_VARIANT");
      continue;
    }
    const singleSourceRepresentative = ordered.length === 1 && singleCandidateClasses.has(candidate.productClass);
    const genericWrapperRepresentative = ordered.length > 1 && candidate.productClass === "BOOSTER_PACK";
    if (!singleSourceRepresentative && !genericWrapperRepresentative) {
      skip("PACKAGE_VARIANT_REQUIRES_REVIEW");
      continue;
    }
    decisions.push({
      sku,
      sourcePath: candidate.sourcePath,
      sourceUrl: candidate.sourceUrl,
      rationale: genericWrapperRepresentative
        ? "Exact catalogue set and booster-pack class; deterministic wrapper used only as representative packaging."
        : "Exact catalogue set and product class with one community source candidate; used only as representative packaging.",
    });
  }
  return { decisions, skippedByReason };
}

export async function stageSealedArtworkReview(
  repository: PricingRepository,
  source: Pick<PtcgAssetsArtworkSource, "snapshot"> = new PtcgAssetsArtworkSource(),
): Promise<SealedArtworkReviewStageResult> {
  const started = performance.now();
  const sealed = repository.listArtworkCandidates("pokemon-en", "SEALED");
  const snapshot = await source.snapshot();
  const { resolved, candidates } = reviewPreparation(sealed, snapshot);
  const stagedRows = repository.stageArtworkReviewCandidates(
    "pokemon-en",
    "ptcg-assets",
    snapshot.commitSha,
    sealed,
    candidates,
  );
  return {
    commitSha: snapshot.commitSha,
    durationMs: Math.round(performance.now() - started),
    eligibleAssets: snapshot.assets.length,
    exactCandidates: resolved.exact,
    reviewProducts: resolved.ambiguous.length,
    reviewCandidates: candidates.length,
    stagedRows,
    unmatched: resolved.unmatched.length,
  };
}

export async function runAssistedSealedArtworkRecovery(
  repository: PricingRepository,
  options: {
    dryRun?: boolean;
    source?: Pick<PtcgAssetsArtworkSource, "snapshot">;
  } = {},
): Promise<AssistedSealedArtworkResult> {
  const started = performance.now();
  const dryRun = options.dryRun ?? true;
  const sealed = repository.listArtworkCandidates("pokemon-en", "SEALED");
  const snapshot = await (options.source ?? new PtcgAssetsArtworkSource()).snapshot();
  const { resolved, candidates } = reviewPreparation(sealed, snapshot);
  const stagedRows = repository.stageArtworkReviewCandidates(
    "pokemon-en",
    "ptcg-assets",
    snapshot.commitSha,
    sealed,
    candidates,
  );
  const selected = selectAssistedSealedArtwork(sealed, candidates);
  const counts = {
    applied: 0,
    alreadyApplied: 0,
    blockedByReview: 0,
    blockedByResolution: 0,
  };
  if (!dryRun) {
    for (const decision of selected.decisions) {
      const result = repository.applyAssistedArtworkReview({
        categoryId: "pokemon-en",
        sku: decision.sku,
        sourceUrl: decision.sourceUrl,
        policyVersion: assistedSealedArtworkPolicyVersion,
        rationale: decision.rationale,
      });
      if (result === "APPLIED") counts.applied += 1;
      else if (result === "ALREADY_APPLIED") counts.alreadyApplied += 1;
      else if (result === "BLOCKED_BY_REVIEW") counts.blockedByReview += 1;
      else counts.blockedByResolution += 1;
    }
  }
  return {
    commitSha: snapshot.commitSha,
    durationMs: Math.round(performance.now() - started),
    eligibleAssets: snapshot.assets.length,
    exactCandidates: resolved.exact,
    reviewProducts: resolved.ambiguous.length,
    reviewCandidates: candidates.length,
    stagedRows,
    unmatched: resolved.unmatched.length,
    policyVersion: assistedSealedArtworkPolicyVersion,
    dryRun,
    eligible: selected.decisions.length,
    ...counts,
    skipped: resolved.ambiguous.length - selected.decisions.length,
    skippedByReason: selected.skippedByReason,
  };
}
