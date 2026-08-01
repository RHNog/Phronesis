import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { PricingExportContract } from "../lib/pricing/contract";
import { parsePricingExport, PricingContractError } from "../lib/pricing/contract";
import { askingPriceSpread, deliveredPriceFor, nearestPricedCondition, queryClearlyTargetsSingle } from "../lib/pricing/domain";
import { PricingRepository } from "../lib/pricing/repository";
import { createPricingSearchPlan } from "../lib/pricing/searchPlan";
import { pricingEvidenceResponse } from "../lib/pricing/evidenceFixtures";

const headers = ["sku_col", "kind_col", "name_col", "set_col", "number_col", "variant_col", "language_col", "condition_col", "market_col", "listing_col", "shipping_col", "date_col", "image_col"];
const contract: PricingExportContract = {
  contractVersion: "fixture-v1",
  sourceSchemaVersion: "sanitized-test-only",
  status: "TEST_ONLY",
  headers,
  fields: {
    sku: "sku_col", productType: "kind_col", name: "name_col", setName: "set_col",
    collectorNumber: "number_col", variant: "variant_col", language: "language_col",
    condition: "condition_col", marketPrice: "market_col", listingPrice: "listing_col",
    shipping: "shipping_col", snapshotDate: "date_col", imageUrl: "image_col",
  },
  values: {
    productTypes: { Card: "SINGLE", Box: "SEALED" },
    conditions: { NM: "NEAR_MINT", LP: "LIGHTLY_PLAYED", MP: "MODERATELY_PLAYED", HP: "HEAVILY_PLAYED", DMG: "DAMAGED" },
  },
};

function csv(date: string, charizardMarket = "100.00", charizardListing = "95.00") {
  return [
    headers.join(","),
    `sv3-199-holo,Card,Charizard ex,Scarlet & Violet 151,199/165,Special Illustration Rare,English,LP,${charizardMarket},${charizardListing},1.00,${date},`,
    `sv3-199-reverse,Card,Charizard ex,Scarlet & Violet 151,199/165,Reverse Holo,English,LP,40.00,38.00,,${date},`,
    `sv3-199-holo,Card,Charizard ex,Scarlet & Violet 151,199/165,Special Illustration Rare,English,NM,120.00,115.00,1.00,${date},`,
    `sv3-box,Box,Scarlet & Violet 151 Booster Bundle,Scarlet & Violet 151,,,English,,45.00,42.00,,${date},`,
    `sv3-etb,Box,Scarlet & Violet 151 Elite Trainer Box,Scarlet & Violet 151,,,English,,90.00,85.00,8.00,${date},`,
  ].join("\n");
}

test("strict contract rejects schema drift before normalization", () => {
  const altered = csv("2026-07-20").replace("shipping_col", "postage_col");
  assert.throws(() => parsePricingExport(altered, contract, "pokemon-en"), (error: unknown) => error instanceof PricingContractError && /Schema drift detected/.test(error.message));
});

test("schema drift writes no partial data", () => {
  const repository = new PricingRepository();
  const authoritative = { ...contract, status: "AUTHORITATIVE" as const };
  const altered = csv("2026-07-20").replace("shipping_col", "postage_col");
  assert.throws(() => repository.importCsv("pokemon-en", altered, authoritative), /No data was imported/);
  assert.equal(repository.database.prepare("SELECT count(*) AS count FROM pricing_products").get()?.count, 0);
  assert.equal(repository.database.prepare("SELECT count(*) AS count FROM pricing_imports").get()?.count, 0);
  repository.close();
});

test("production import refuses a test-only schema contract", () => {
  const repository = new PricingRepository();
  assert.throws(() => repository.importCsv("pokemon-en", csv("2026-07-20"), contract), /AUTHORITATIVE/);
  assert.equal(repository.database.prepare("SELECT count(*) AS count FROM pricing_products").get()?.count, 0);
  repository.close();
});

test("import is idempotent and stores history only on price change", () => {
  const repository = new PricingRepository();
  const first = repository.importTestCsv("pokemon-en", csv("2026-07-20"), contract);
  assert.equal(first.snapshotsInserted, 5);
  const repeated = repository.importTestCsv("pokemon-en", csv("2026-07-20"), contract);
  assert.equal(repeated.status, "ALREADY_IMPORTED");
  const unchanged = repository.importTestCsv("pokemon-en", csv("2026-07-21"), contract);
  assert.equal(unchanged.snapshotsInserted, 0);
  const changed = repository.importTestCsv("pokemon-en", csv("2026-07-28", "110.00", "105.00"), contract);
  assert.equal(changed.snapshotsInserted, 1);
  assert.equal(repository.database.prepare("SELECT count(*) AS count FROM pricing_history").get()?.count, 6);
  const result = repository.search("pokemon-en", "Charizard 199/165", new Date("2026-07-28T12:00:00Z"));
  assert.equal(result.sealed.length, 0);
  assert.equal(result.singles.length, 2);
  assert.equal(result.singles[0].previousMarketPriceCents, 10_000);
  assert.equal(result.singles[0].previousSnapshotDate, "2026-07-20");
  repository.close();
});

test("verified artwork mappings persist by complete identity and warm candidates retain value priority", () => {
  const repository = new PricingRepository();
  repository.importTestCsv("pokemon-en", csv("2026-07-28"), contract);
  const match = repository.findBySku("pokemon-en", "sv3-199-holo");
  assert.ok(match);
  assert.equal(repository.saveArtworkResolutions([match], {
    [match.sku]: { small: "https://assets.tcgdex.net/en/sv/sv03.5/199/low.webp" },
  }, "tcgdex"), 1);
  assert.equal(repository.getArtworkResolutions([match])[match.sku].small, "https://assets.tcgdex.net/en/sv/sv03.5/199/low.webp");
  assert.equal(repository.listArtworkCandidates("pokemon-en")[0].artworkPriorityCents, 12_000);

  const changedIdentity = { ...match, collectorNumber: "200/165" };
  assert.deepEqual(repository.getArtworkResolutions([changedIdentity]), {});
  assert.equal(repository.replaceArtworkResolutions([match], {}, "tcgdex"), 0);
  assert.deepEqual(repository.getArtworkResolutions([match]), {});
  repository.close();
});

test("sealed search is relevance-gated, grouped, and never ordered by price", () => {
  const repository = new PricingRepository();
  repository.importTestCsv("pokemon-en", csv("2026-07-28"), contract);
  const result = repository.search("pokemon-en", "Scarlet Violet 151", new Date("2026-07-28T12:00:00Z"));
  assert.deepEqual(result.sealed.map((match) => match.name), ["Scarlet & Violet 151 Booster Bundle", "Scarlet & Violet 151 Elite Trainer Box"]);
  assert.ok(result.singles.length > 0);
  assert.equal(result.sealed[0].sealedPrice?.deliveredPriceCents, null);
  assert.equal(result.sealed[0].sealedPrice?.shippingSource, "UNKNOWN");
  assert.equal(result.sealed[1].sealedPrice?.deliveredPriceCents, 9_300);
  repository.close();
});

test("missing condition remains missing and nearest grade is explicitly separate", () => {
  const repository = new PricingRepository();
  repository.importTestCsv("pokemon-en", csv("2026-07-28"), contract);
  const match = repository.search("pokemon-en", "Charizard", new Date("2026-07-28T12:00:00Z")).singles.find((item) => item.sku === "sv3-199-holo");
  assert.ok(match);
  assert.equal(match.prices.MODERATELY_PLAYED, undefined);
  assert.equal(nearestPricedCondition(match.prices, "MODERATELY_PLAYED")?.condition, "LIGHTLY_PLAYED");
  repository.close();
});

test("shipping, query intent, and asking spread follow bounded rules", () => {
  assert.deepEqual(deliveredPriceFor("SINGLE", 1_000, null), { deliveredPriceCents: 1_127, shippingCents: 127, shippingSource: "ASSUMED" });
  assert.deepEqual(deliveredPriceFor("SEALED", 1_000, null), { deliveredPriceCents: null, shippingCents: null, shippingSource: "UNKNOWN" });
  assert.equal(queryClearlyTargetsSingle("Charizard 199/165 reverse holo"), true);
  assert.equal(queryClearlyTargetsSingle("Scarlet Violet 151"), false);
  assert.equal(askingPriceSpread(1_500, 1_800).mode, "ABSOLUTE");
  assert.equal(askingPriceSpread(9_000, 10_000).mode, "PERCENTAGE");
});

test("catalogue query planning understands bounded Pokémon set-code shorthand", () => {
  const shorthand = createPricingSearchPlan("Charizard v sh03");
  assert.equal(shorthand.interpretations[0]?.canonical, "SWSH03");
  assert.match(shorthand.ftsQuery, /"sh03"\*/);
  assert.match(shorthand.ftsQuery, /"swsh03"\*/);
  assert.ok(shorthand.tokens.every((token) => token.alternatives.length <= 6));
  assert.equal(createPricingSearchPlan("sh").interpretations.length, 0);

  const repository = new PricingRepository();
  const aliasCsv = [
    headers.join(","),
    "swsh03-charizard-v,Card,Charizard V,SWSH03: Darkness Ablaze,019/189,Holofoil,English,LP,7.26,7.00,1.00,2026-07-31,",
    "swsh09-charizard-v,Card,Charizard V,SWSH09: Brilliant Stars,017/172,Holofoil,English,LP,6.00,5.50,1.00,2026-07-31,",
  ].join("\n");
  repository.importTestCsv("pokemon-en", aliasCsv, contract);
  const result = repository.search("pokemon-en", "Charizard v sh03");
  assert.equal(result.singles[0]?.setName, "SWSH03: Darkness Ablaze");
  assert.equal(
    result.interpretations?.[0]?.message,
    "Understood SH03 as SWSH03",
  );
  repository.close();
});

test("inactive or unknown category is distinct from no match in loaded category", () => {
  const repository = new PricingRepository();
  const unavailable = repository.search("pokemon-ja", "Pikachu");
  assert.equal(unavailable.category.loaded, false);
  assert.equal(unavailable.category.label, "pokemon-ja");
  repository.importTestCsv("pokemon-en", csv("2026-07-28"), contract);
  const missing = repository.search("pokemon-en", "Mewtwo");
  assert.equal(missing.category.loaded, true);
  assert.equal(missing.singles.length, 0);
  repository.close();
});

test("web evidence target declares explicit reduced-motion and increased-contrast behavior", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const preflight = readFileSync(new URL("./jarvis_runtime_evidence.py", import.meta.url), "utf8");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /@media \(prefers-contrast: more\)/);
  assert.match(preflight, /web-host\/probe\/reduced-motion\.json/);
  assert.match(preflight, /web-host\/probe\/increased-contrast\.json/);
  assert.match(preflight, /"contrast": \{"surface": "web"/);
});

test("browser zoom reflows both field controls so decision content remains unobscured", () => {
  const component = readFileSync(new URL("../features/pricing/components/PricingLookup.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const preflight = readFileSync(new URL("./jarvis_runtime_evidence.py", import.meta.url), "utf8");
  assert.match(component, /devicePixelRatio >= 1\.5 && window\.screen\.width \/ window\.innerWidth >= 1\.5/);
  assert.match(component, /data-browser-zoom-reflow/);
  assert.match(component, /data-evidence-zoom-reflow/);
  assert.match(component, /data-pricing-search-panel/);
  assert.match(component, /data-pricing-search-reflow/);
  assert.match(component, /zoomReflow \? "" : "sticky top-0/);
  assert.match(component, /data-pricing-condition-panel/);
  assert.match(component, /data-pricing-condition-reflow/);
  assert.match(component, /zoomReflow \? "" : "sticky/);
  assert.match(component, /data-pricing-result-identity/);
  assert.match(component, /data-pricing-result-sku=\{match\.sku\}/);
  assert.match(component, /data-pricing-result-product-type=\{match\.productType\}/);
  assert.match(component, /data-pricing-result-name=\{match\.name\}/);
  assert.match(component, /data-pricing-result-printing=/);
  assert.match(component, /data-pricing-product-type/);
  assert.match(component, /data-pricing-product-name/);
  assert.match(component, /data-pricing-printing-identity/);
  assert.match(css, /data-browser-zoom-reflow="true"[\s\S]*?\.pricing-condition-panel[\s\S]*?position: static/);
  assert.match(css, /data-evidence-zoom-reflow="true"[\s\S]*?\.pricing-condition-panel[\s\S]*?position: static/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) and \(max-width: 48rem\)[\s\S]*?\.pricing-condition-panel[\s\S]*?position: static/);
  assert.match(css, /data-browser-zoom-reflow="true"[\s\S]*?\.pricing-search-panel[\s\S]*?position: static/);
  assert.match(css, /data-evidence-zoom-reflow="true"[\s\S]*?\.pricing-search-panel[\s\S]*?position: static/);
  assert.match(css, /@media \(hover: hover\) and \(pointer: fine\) and \(max-width: 48rem\)[\s\S]*?\.pricing-search-panel[\s\S]*?position: static/);
  assert.match(css, /data-pricing-result-identity[\s\S]*?min-width: 0;[\s\S]*?max-width: 100%/);
  assert.match(css, /data-pricing-product-name[\s\S]*?data-pricing-printing-identity[\s\S]*?overflow-wrap: anywhere/);
  assert.match(preflight, /evidence\?scenario=sealed&zoom=200/);
  assert.match(preflight, /evidence\?scenario=sealed&zoom=400/);
  assert.match(preflight, /web-host\/probe\/zoom-200\.json/);
  assert.match(preflight, /web-host\/probe\/zoom-400\.json/);
  assert.match(preflight, /desktop fine-pointer zoom viewport/);
  assert.match(preflight, /neither obscures result product type, name, or identity text/);
  assert.match(preflight, /"condition_panel_computed_position": "static"/);
  assert.match(preflight, /"search_panel_sticky_class": False/);
  assert.match(preflight, /"search_panel_reflow_attribute": "true"/);
  assert.match(preflight, /"search_panel_computed_position": "static"/);
  assert.match(preflight, /"search_panel_identity_intersections": 0/);
  assert.match(preflight, /"condition_panel_identity_intersections": 0/);
  assert.match(preflight, /"horizontal_overflow_css_px": 0/);
  assert.match(preflight, /def zoom_result_schema/);
  assert.match(preflight, /"identities": "\[data-pricing-result-identity\]\[data-pricing-result-sku\]"/);
  assert.match(preflight, /"minimum_items": 1/);
  assert.match(preflight, /"field_bounds": \{/);
  assert.match(preflight, /"identity_selector": "must equal a visible_identities selector"/);
  assert.match(preflight, /"type": "array with exactly two entries per visible identity"/);
  assert.match(preflight, /"either control is absent, null, hidden, or matches other than exactly one element"/);
  assert.match(preflight, /"visible_identities is empty or any identity value, selector, or bound is null\/empty"/);
});

test("runtime evidence requires clean reading order and stable control names", () => {
  const component = readFileSync(new URL("../features/pricing/components/PricingLookup.tsx", import.meta.url), "utf8");
  const preflight = readFileSync(new URL("./jarvis_runtime_evidence.py", import.meta.url), "utf8");
  assert.match(component, /aria-label="Search card, set, collector number, or sealed product"/);
  assert.match(component, /aria-label="Singles condition"/);
  assert.match(component, /aria-label=\{resultAccessibilityLabel\(match, price, condition\)\}/);
  assert.match(component, /aria-label=\{resultAccessibilityLabel\(match, match\.sealedPrice\)\}/);
  assert.match(component, /<section[\s\S]*?aria-labelledby="pricing-lookup-heading"/);
  assert.match(component, /<h1 id="pricing-lookup-heading"/);
  assert.match(preflight, /"capture_root": "\.pricing-lookup"/);
  assert.match(preflight, /Accessibility\.enable on the page-target session/);
  assert.match(preflight, /Accessibility\.getFullAXTree on the page-target session/);
  assert.match(preflight, /locate the labelled Price lookup region by the resolved \.pricing-lookup backendNodeId/);
  assert.match(preflight, /same page-target CDP session that navigated the evidence URL/);
  assert.match(preflight, /"capture_root_match_count": 1/);
  assert.match(preflight, /"capture_root_backend_node_id": "non-null backendNodeId/);
  assert.match(preflight, /"capture_api": "Accessibility\.getFullAXTree"/);
  assert.match(preflight, /"accessibility_enabled": True/);
  assert.match(preflight, /"scoped_root_role": "region"/);
  assert.match(preflight, /"scoped_root_name": "Price lookup"/);
  assert.match(preflight, /reconstruct depth-first order from AXNode childIds/);
  assert.match(preflight, /"first_spoken_node": \{"role": "region", "name": "Price lookup"\}/);
  assert.match(preflight, /full tree has no node whose backendDOMNodeId matches/);
  assert.match(preflight, /the first derived spoken node is not the Price lookup region/);
  assert.match(preflight, /"excluded_node_roles": \["StaticText", "InlineTextBox"\]/);
  assert.match(preflight, /"excluded_runtime_content": \["Open Next\.js Dev Tools", "Next\.js Dev Tools"\]/);
  assert.match(preflight, /raw StaticText or InlineTextBox descendants duplicate an exposed parent/);
  assert.match(preflight, /either required named control is absent or has a different accessible name/);
  assert.match(preflight, /"required_result_content": \[/);
  assert.match(preflight, /any visible result lacks one intelligible semantic node naming its product type/);
  assert.match(preflight, /PhronesisEvidenceUITests\/testVoiceOverProducesRealUtterances/);
  assert.match(preflight, /"required_voiceover_artifact": \{/);
  assert.match(preflight, /a printing identity or other required phrase is truncated/);
});

test("runtime evidence disables development chrome and keeps stale dates coherent", () => {
  const nextConfig = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  assert.match(
    nextConfig,
    /devIndicators:\s*process\.env\.JARVIS_RUNTIME_EVIDENCE === "1" \? false : undefined/,
  );

  const stale = pricingEvidenceResponse("stale");
  assert.equal(stale.category.stale, true);
  assert.equal(stale.category.snapshotDate, "2026-07-01");
  const displayedSnapshotDates = stale.singles.flatMap((match) =>
    Object.values(match.prices).map((price) => price.snapshotDate),
  );
  assert.ok(displayedSnapshotDates.length > 0);
  assert.deepEqual(new Set(displayedSnapshotDates), new Set(["2026-07-01"]));
  assert.ok(stale.singles.every((match) => match.previousSnapshotDate === null));
});

test("native VoiceOver evidence requires the complete decision flow without combined-card truncation", () => {
  const view = readFileSync(new URL("../ios/PhronesisEvidence/PricingLookupEvidenceView.swift", import.meta.url), "utf8");
  const uiTests = readFileSync(new URL("../ios/PhronesisEvidenceUITests/PhronesisEvidenceUITests.swift", import.meta.url), "utf8");
  assert.match(view, /\.accessibilityElement\(children: \.contain\)/);
  assert.doesNotMatch(view, /\.accessibilityElement\(children: \.combine\)/);
  assert.doesNotMatch(view, /\.accessibilityLabel\("\\\(kind\),/);
  assert.match(view, /decisionFact\("No history yet", field: "History"\)/);
  assert.match(view, /decisionFact\("Snapshot Jul 28", field: "Snapshot date"\)/);
  assert.match(view, /\.accessibilityLabel\("\\\(spokenName\)\. \\\(field\)\. \\\(value\)"\)/);
  assert.match(uiTests, /for _ in 0\.\.<64/);
  assert.match(uiTests, /requiredResultDecisionFacts/);
  for (const resultName of [
    "151 Booster Bundle",
    "151 Elite Trainer Box",
    "Charizard ex",
    "Charizard",
  ]) {
    assert.match(uiTests, new RegExp(resultName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  for (const phrase of ["Special Illustration Rare", "Reverse Holo", "delivered", "listing", "shipping", "No history yet", "Snapshot Jul 28"]) {
    assert.match(uiTests, new RegExp(phrase));
  }
});

test("compact native evidence scrolls the sealed expander with a targeted gesture", () => {
  const nativeView = readFileSync(new URL("../ios/PhronesisEvidence/PricingLookupEvidenceView.swift", import.meta.url), "utf8");
  const uiTests = readFileSync(new URL("../ios/PhronesisEvidenceUITests/PhronesisEvidenceUITests.swift", import.meta.url), "utf8");
  assert.match(uiTests, /let scrollView = app\.scrollViews\.firstMatch/);
  assert.match(uiTests, /scrollView\.coordinate\(/);
  assert.match(uiTests, /dragStart\.press\(forDuration: 0\.2, thenDragTo: dragEnd\)/);
  assert.match(uiTests, /CGVector\(dx: 0\.5, dy: 0\.72\)/);
  assert.match(uiTests, /CGVector\(dx: 0\.5, dy: 0\.32\)/);
  assert.match(nativeView, /frame\(maxWidth: \.infinity, minHeight: 44, alignment: \.leading\)/);
  assert.doesNotMatch(uiTests, /scrollView\.swipeUp\(velocity: \.slow\)/);
});

test("native sealed disclosure re-resolves accessibility state after layout mutation", () => {
  const nativeView = readFileSync(new URL("../ios/PhronesisEvidence/PricingLookupEvidenceView.swift", import.meta.url), "utf8");
  const uiTests = readFileSync(new URL("../ios/PhronesisEvidenceUITests/PhronesisEvidenceUITests.swift", import.meta.url), "utf8");
  assert.match(nativeView, /expanded\.toggle\(\)/);
  assert.match(nativeView, /Show fewer sealed products/);
  assert.match(nativeView, /accessibilityValue\(expanded \? "expanded" : "collapsed"\)/);
  assert.match(uiTests, /waitForSealedExpansion\(in: app\)/);
  assert.match(uiTests, /scrollToHittable\("sealed-expander", in: app\)/);
  assert.match(uiTests, /let currentExpander = app\.buttons\["sealed-expander"\]/);
  assert.match(uiTests, /XCTAssertEqual\(currentExpander\.value as\? String, "collapsed"\)/);
  assert.match(uiTests, /currentExpander\.tap\(\)/);
  assert.match(uiTests, /let currentExpander = app\.buttons\["sealed-expander"\]/);
  assert.match(uiTests, /currentExpander\.value as\? String == "expanded"/);
  assert.doesNotMatch(uiTests, /let expander = app\.buttons\["sealed-expander"\]/);
  assert.doesNotMatch(uiTests, /evaluatedWith: expander/);
});
