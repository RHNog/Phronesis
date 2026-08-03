import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PricingRepository } from "../lib/pricing/repository";
import {
  selectAssistedSealedArtwork,
  stageSealedArtworkReview,
} from "../lib/providers/community/SealedArtworkReview";
import type { PtcgAssetsSnapshot } from "../lib/providers/community/PtcgAssetsArtworkSource";

const sha = "a".repeat(40);
const source = (path: string) => `https://raw.githubusercontent.com/1niceroli/ptcg-assets/${sha}/${path}`;

function insertSealed(repository: PricingRepository, sku: string, name: string, setName = "Base Set") {
  repository.database.prepare(`
    INSERT INTO pricing_products(category_id,sku,product_type,name,set_name,collector_number,variant,language,image_url)
    VALUES('pokemon-en',?,'SEALED',?,?,NULL,'Sealed','English',NULL)
  `).run(sku, name, setName);
  return repository.findBySku("pokemon-en", sku)!;
}

test("sealed review staging is metadata-only, deterministic, and idempotent", async () => {
  const repository = new PricingRepository();
  insertSealed(repository, "pack", "Base Set Booster Pack");
  const snapshot: PtcgAssetsSnapshot = {
    commitSha: sha,
    sourceFileCount: 2,
    sets: [{ id: "base1", name: "Base Set", ptcgoCode: "BS", series: "Base" }],
    assets: ["charizard", "venusaur"].map((name) => ({
      bytes: 100,
      descriptors: [name],
      path: `base1/packshots/${name}.png`,
      productClass: "BOOSTER_PACK" as const,
      setId: "base1",
      sourceUrl: source(`base1/packshots/${name}.png`),
    })),
  };
  const fakeSource = { snapshot: async () => snapshot };
  const first = await stageSealedArtworkReview(repository, fakeSource);
  const second = await stageSealedArtworkReview(repository, fakeSource);
  assert.equal(first.reviewProducts, 1);
  assert.equal(first.reviewCandidates, 2);
  assert.equal(second.reviewCandidates, 2);
  assert.equal(repository.database.prepare("SELECT COUNT(*) AS count FROM pricing_artwork_review_candidates").get()!.count, 2);
  assert.equal(repository.getArtworkReviewQueue().summary.pending, 1);
  repository.close();
});

test("owner representative approval is labelled, audited, exact-safe, and reversible", () => {
  const repository = new PricingRepository();
  const exact = insertSealed(repository, "box", "Base Set Booster Box");
  const review = insertSealed(repository, "pack", "Base Set Booster Pack");
  repository.saveArtworkResolutions([exact], { box: { normal: source("base1/display.png") } }, "ptcg-assets");
  repository.stageArtworkReviewCandidates("pokemon-en", "ptcg-assets", sha, [review], [{
    sku: "pack",
    sourcePath: "base1/packshots/charizard.png",
    sourceUrl: source("base1/packshots/charizard.png"),
    productClass: "BOOSTER_PACK",
    reason: "DESCRIPTOR_NOT_UNIQUE",
    rank: 0,
  }]);

  let queue = repository.getArtworkReviewQueue();
  assert.deepEqual(queue.summary, { exact: 1, representative: 0, ownerRepresentative: 0, assistedRepresentative: 0, visible: 1, totalSealed: 2, pending: 1, accepted: 0, rejected: 0 });
  repository.decideArtworkReview({ action: "ACCEPT", categoryId: "pokemon-en", sku: "pack", sourceUrl: source("base1/packshots/charizard.png"), actorUserId: "owner" });
  queue = repository.getArtworkReviewQueue({ state: "ACCEPTED" });
  assert.equal(queue.summary.exact, 1);
  assert.equal(queue.summary.representative, 1);
  assert.equal(queue.summary.visible, 2);
  assert.equal(queue.items[0].candidates[0].state, "ACCEPTED");
  assert.equal(repository.getArtworkResolutionProvenance([review]).pack.label, "Owner-approved representative image");
  assert.equal(repository.database.prepare("SELECT COUNT(*) AS count FROM pricing_artwork_review_events").get()!.count, 1);

  repository.decideArtworkReview({ action: "UNDO", categoryId: "pokemon-en", sku: "pack", sourceUrl: source("base1/packshots/charizard.png"), actorUserId: "owner" });
  queue = repository.getArtworkReviewQueue();
  assert.equal(queue.summary.representative, 0);
  assert.equal(queue.summary.pending, 1);
  assert.equal(repository.getArtworkResolutions([review]).pack, undefined);
  assert.equal(repository.database.prepare("SELECT COUNT(*) AS count FROM pricing_artwork_review_events").get()!.count, 2);
  repository.close();
});

test("assisted representative policy accepts only conservative set-class evidence", () => {
  const repository = new PricingRepository();
  const genericPack = insertSealed(repository, "generic-pack", "Base Set Booster Pack");
  const artworkPack = insertSealed(repository, "art-pack", "Base Set Booster Pack [Charizard Artwork]");
  const bundle = insertSealed(repository, "bundle", "Base Set Booster Bundle");
  const exclusiveEtb = insertSealed(repository, "exclusive-etb", "Base Set Pokemon Center Elite Trainer Box (Exclusive)");
  const mixedTin = insertSealed(repository, "mixed-tin", "Collector Tin [Pikachu]", "Miscellaneous Cards & Products");
  const candidate = (sku: string, path: string, productClass: string, reason = "DESCRIPTOR_NOT_UNIQUE", rank = 0) => ({
    sku,
    sourcePath: path,
    sourceUrl: source(path),
    productClass,
    reason,
    rank,
  });
  const selected = selectAssistedSealedArtwork(
    [genericPack, artworkPack, bundle, exclusiveEtb, mixedTin],
    [
      candidate("generic-pack", "base1/packshots/charizard.png", "BOOSTER_PACK", "DESCRIPTOR_NOT_UNIQUE", 0),
      candidate("generic-pack", "base1/packshots/venusaur.png", "BOOSTER_PACK", "DESCRIPTOR_NOT_UNIQUE", 1),
      candidate("art-pack", "base1/packshots/charizard.png", "BOOSTER_PACK"),
      candidate("bundle", "base1/booster-bundle.png", "BOOSTER_BUNDLE"),
      candidate("exclusive-etb", "base1/elite-trainer-box.png", "ELITE_TRAINER_BOX"),
      candidate("mixed-tin", "mixed/tins/pikachu.png", "TIN", "MIXED_PRODUCT_FILENAME_NOT_EXACT"),
    ],
  );
  assert.deepEqual(selected.decisions.map((decision) => decision.sku), ["generic-pack", "bundle"]);
  assert.equal(selected.skippedByReason.VALUE_SENSITIVE_OR_COMPOSITE_VARIANT, 2);
  assert.equal(selected.skippedByReason.MIXED_PRODUCT_GUESS, 1);
  repository.close();
});

test("assisted representative application is labelled, audited, idempotent, and owner reversible", () => {
  const repository = new PricingRepository();
  const pack = insertSealed(repository, "pack", "Base Set Booster Pack");
  const candidate = {
    sku: "pack",
    sourcePath: "base1/packshots/charizard.png",
    sourceUrl: source("base1/packshots/charizard.png"),
    productClass: "BOOSTER_PACK",
    reason: "DESCRIPTOR_NOT_UNIQUE",
    rank: 0,
  };
  repository.stageArtworkReviewCandidates("pokemon-en", "ptcg-assets", sha, [pack], [candidate]);
  const input = {
    categoryId: "pokemon-en",
    sku: "pack",
    sourceUrl: candidate.sourceUrl,
    policyVersion: "v1",
    rationale: "Exact set and compatible class.",
  };
  assert.equal(repository.applyAssistedArtworkReview(input), "APPLIED");
  assert.equal(repository.applyAssistedArtworkReview(input), "ALREADY_APPLIED");
  assert.equal(repository.getArtworkResolutionProvenance([pack]).pack.label, "Phronesis-assisted representative image");
  assert.equal(repository.getArtworkReviewQueue({ state: "ACCEPTED" }).summary.assistedRepresentative, 1);
  assert.equal(repository.database.prepare("SELECT COUNT(*) AS count FROM pricing_artwork_review_events").get()!.count, 1);
  repository.decideArtworkReview({ action: "UNDO", categoryId: "pokemon-en", sku: "pack", sourceUrl: candidate.sourceUrl, actorUserId: "owner" });
  assert.equal(repository.getArtworkReviewQueue().summary.representative, 0);
  repository.close();
});

test("review reject and restore survive restaging while exact artwork blocks approval", async () => {
  const repository = new PricingRepository();
  const review = insertSealed(repository, "pack", "Base Set Booster Pack");
  const candidate = {
    sku: "pack",
    sourcePath: "base1/packshots/charizard.png",
    sourceUrl: source("base1/packshots/charizard.png"),
    productClass: "BOOSTER_PACK",
    reason: "DESCRIPTOR_NOT_UNIQUE",
    rank: 0,
  };
  repository.stageArtworkReviewCandidates("pokemon-en", "ptcg-assets", sha, [review], [candidate]);
  repository.decideArtworkReview({ action: "REJECT", categoryId: "pokemon-en", sku: "pack", sourceUrl: candidate.sourceUrl, actorUserId: "owner" });
  repository.stageArtworkReviewCandidates("pokemon-en", "ptcg-assets", sha, [review], [candidate]);
  assert.equal(repository.getArtworkReviewQueue({ state: "REJECTED" }).items.length, 1);
  repository.decideArtworkReview({ action: "RESTORE", categoryId: "pokemon-en", sku: "pack", sourceUrl: candidate.sourceUrl, actorUserId: "owner" });
  assert.equal(repository.getArtworkReviewQueue().items.length, 1);

  repository.saveArtworkResolutions([review], { pack: { normal: source("base1/packshots/verified.png") } }, "verified-provider");
  assert.throws(() => repository.decideArtworkReview({ action: "ACCEPT", categoryId: "pokemon-en", sku: "pack", sourceUrl: candidate.sourceUrl, actorUserId: "owner" }), /exact artwork resolution/i);
  assert.equal((repository.database.prepare("SELECT provider_id FROM pricing_artwork_resolutions WHERE sku='pack'").get() as { provider_id: string }).provider_id, "verified-provider");
  repository.close();
});

test("Settings and Vendor Workspace expose the governed review and representative label", () => {
  const settings = readFileSync(new URL("../app/settings/page.tsx", import.meta.url), "utf8");
  const panel = readFileSync(new URL("../components/settings/SealedArtworkReview.tsx", import.meta.url), "utf8");
  const vendor = readFileSync(new URL("../features/vendor/components/SnapshotVendorWorkspace.tsx", import.meta.url), "utf8");
  assert.match(settings, /SealedArtworkReview/);
  assert.match(panel, /Approve representative/);
  assert.match(panel, /Refresh candidates/);
  assert.match(panel, /Run safe recovery/);
  assert.match(panel, /Undo approval/);
  assert.match(vendor, /packaging may vary/);
  assert.match(vendor, /response\?\.sealed/);
});
