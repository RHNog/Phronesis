import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createSnapshotPurchaseEvaluation } from "../features/vendor/components/SnapshotVendorWorkspace";
import { groupSearchMatchesByArtwork } from "../lib/pricing/domain";
import type { SearchMatch } from "../lib/pricing/types";

function pngDimensions(bytes: Buffer): { width: number; height: number } {
  assert.equal(bytes.subarray(1, 4).toString("ascii"), "PNG");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
}

function icoDimensions(bytes: Buffer): { width: number; height: number } {
  assert.equal(bytes.readUInt16LE(0), 0);
  assert.equal(bytes.readUInt16LE(2), 1);
  assert.equal(bytes.readUInt16LE(4), 1);
  return {
    width: bytes[6] || 256,
    height: bytes[7] || 256,
  };
}

const match: SearchMatch = {
  categoryId: "magic-en",
  sku: "tcg:test-card",
  productType: "SINGLE",
  name: "Test Card",
  setName: "Test Set",
  collectorNumber: "42",
  variant: "Normal",
  language: "English",
  imageUrl: null,
  score: 100,
  prices: {
    LIGHTLY_PLAYED: {
      marketPriceCents: 10_000,
      listingPriceCents: 9_500,
      shippingCents: 100,
      shippingSource: "EXPORTED",
      deliveredPriceCents: 9_600,
      snapshotDate: "2026-07-29T18:00:00.000Z",
      sourceSku: "12345",
      previousMarketPriceCents: 9_000,
      previousSnapshotDate: "2026-07-29T12:00:00.000Z",
    },
  },
  sealedPrice: null,
  previousMarketPriceCents: 9_000,
  previousSnapshotDate: "2026-07-29T12:00:00.000Z",
};

test("snapshot selection reuses the existing purchase evaluation and offer ladder", () => {
  const evaluation = createSnapshotPurchaseEvaluation({
    match,
    condition: "LIGHTLY_PLAYED",
    price: match.prices.LIGHTLY_PLAYED!,
    askingPrice: 50,
    businessProfileId: "convention-buying",
    strategyId: "custom",
  });
  assert.ok(evaluation);
  assert.equal(evaluation.status, "READY");
  if (evaluation.status === "READY") {
    assert.ok(
      ["BUY", "NEGOTIATE", "PASS"].includes(evaluation.decision.action),
    );
    assert.ok(
      evaluation.negotiationLadder.openingOffer <=
        evaluation.negotiationLadder.targetOffer,
    );
    assert.ok(
      evaluation.negotiationLadder.targetOffer <=
        evaluation.negotiationLadder.maximumBuyPrice,
    );
    assert.equal(evaluation.marketEstimate.providerId, "tcgplayer");
    assert.equal(evaluation.businessProfile.id, "convention-buying");
  }
});

test("TCG Direct Low takes precedence in purchase evaluation", () => {
  const evaluation = createSnapshotPurchaseEvaluation({ match, condition: "LIGHTLY_PLAYED", price: { ...match.prices.LIGHTLY_PLAYED!, directLowCents: 15_000 }, askingPrice: 50, businessProfileId: "convention-buying", strategyId: "custom" });
  assert.ok(evaluation && evaluation.status === "READY");
  if (evaluation?.status === "READY") {
    assert.equal(evaluation.marketEstimate.price, 150);
    assert.equal(evaluation.marketEstimate.source, "TCG Direct Low");
    assert.equal(evaluation.marketEstimate.priceType, "lowest_known");
  }
});

test("artwork-first grouping collapses finish-only products but preserves alternate artwork", () => {
  const foil = { ...match, sku: "tcg:test-card-foil", variant: "Foil" };
  const rainbow = {
    ...match,
    sku: "tcg:test-card-rainbow",
    name: "Test Card (0042) (Rainbow Foil)",
    variant: "Foil",
  };
  const borderless = {
    ...match,
    sku: "tcg:test-card-borderless",
    name: "Test Card (Borderless)",
    collectorNumber: "142",
    variant: "Foil",
  };
  const groups = groupSearchMatchesByArtwork([
    foil,
    match,
    rainbow,
    borderless,
  ]);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].variants.length, 3);
  assert.equal(groups[0].variants[0].variant, "Normal");
  assert.equal(groups[1].name, "Test Card (Borderless)");
});

test("Vendor Workspace is desktop-first, keyboard-operable, and mobile-adaptive without a second decision engine", () => {
  const component = readFileSync(
    new URL(
      "../features/vendor/components/SnapshotVendorWorkspace.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const route = readFileSync(
    new URL("../app/vendor/page.tsx", import.meta.url),
    "utf8",
  );
  const carousel = readFileSync(
    new URL("../components/cards/ProductArtworkCarousel.tsx", import.meta.url),
    "utf8",
  );
  assert.match(route, /SnapshotVendorWorkspace/);
  assert.match(carousel, /Previous packaging image/);
  assert.match(carousel, /Next packaging image/);
  assert.match(carousel, /aria-live="polite"/);
  assert.doesNotMatch(route, /Open price lookup/);
  assert.match(component, /data-vendor-primary-workflow/);
  assert.match(
    component,
    /xl:grid-cols-\[minmax\(360px,0\.85fr\)_minmax\(520px,1\.15fr\)\]/,
  );
  assert.match(component, /Selection locked for evaluation/);
  assert.match(component, /Search another card/);
  assert.match(component, /PriceChartingGradedArea/);
  assert.match(component, /data-combined-pricing-card/);
  assert.match(component, /TCGplayer \+ Liga pricing/);
  assert.match(component, /Primary reference · TCG Direct Low/);
  assert.match(component, /tcgDirectLowCents/);
  assert.equal(component.match(/<VendorCheckout/g)?.length, 1);
  assert.ok(
    component.indexOf("Catalogue results") <
      component.indexOf("<VendorCheckout"),
  );
  assert.ok(
    component.indexOf("<VendorCheckout") <
      component.indexOf("Snapshot evidence"),
  );
  assert.ok(
    component.indexOf("Snapshot evidence") <
      component.indexOf("Buying decision"),
  );
  assert.match(component, /refresh overdue/);
  assert.match(component, /catalogue.*overdue/);
  assert.match(component, /order-4/);
  assert.match(component, /api\/pricing\/search/);
  assert.match(component, /api\/pricing\/artwork/);
  assert.match(component, /CardThumbnailPreview/);
  assert.match(component, /Verify on TCGplayer/);
  assert.match(component, /tcgplayerVerificationUrl\(selectedMatch\)/);
  assert.match(component, /rel="noopener noreferrer"/);
  assert.match(component, /target="_blank"/);
  assert.match(component, /groupSearchMatchesByArtwork/);
  assert.match(component, /aria-label="Finish"/);
  assert.match(component, /Search every catalogue/);
  assert.doesNotMatch(component, />Game catalogue</);
  assert.match(component, /evaluatePurchase\(/);
  assert.match(component, /event\.key === "ArrowDown"/);
  assert.match(component, /event\.key === "Enter"/);
  assert.match(component, /event\.key === "Escape"/);
  assert.match(component, /min-h-11/);
  assert.match(component, /grid min-w-0 items-start gap-5/);
  assert.doesNotMatch(component, /function evaluatePurchase/);
  const statusRoute = readFileSync(
    new URL("../app/api/pricing/status/route.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(statusRoute, /sourcePath:/);
  assert.doesNotMatch(statusRoute, /sourceHash:/);
  const checkout = readFileSync(
    new URL(
      "../features/vendor/components/VendorCheckout.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(
    checkout,
    /xl:grid-cols-\[minmax\(220px,0\.72fr\)_minmax\(280px,1\.28fr\)\]/,
  );
  assert.match(checkout, /data-purchase-cart-rail/);
  assert.match(checkout, /cartRailRef\.current\?\.scrollIntoView/);
  assert.ok(checkout.indexOf("Recommended offer") < checkout.indexOf("Current purchase"));
  assert.match(checkout, /<details/);
  assert.match(checkout, /TCG Low/);
  assert.match(checkout, /TCG Market/);
  assert.match(checkout, /Walk away/);
  assert.doesNotMatch(component, /function OfferFirstSummary/);
  assert.equal(component.match(/<RegionalMarketPanel/g)?.length, 1);
  assert.equal(component.match(/<PriceChartingGradedArea/g)?.length, 1);
  assert.ok(
    component.indexOf("data-combined-pricing-card") <
      component.indexOf("<PriceChartingGradedArea"),
  );
  const buyingDecision = component.slice(
    component.indexOf('aria-labelledby="vendor-decision-heading"'),
  );
  assert.doesNotMatch(buyingDecision, /RegionalMarketPanel/);
  assert.doesNotMatch(buyingDecision, /GradingCertificateLookup/);

  const grading = readFileSync(
    new URL(
      "../features/vendor/components/PriceChartingGradedArea.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(grading, /data-grading-disclosure/);
  assert.match(grading, /Grading information/);
  assert.match(grading, /GradingCertificateLookup embedded/);
  assert.match(grading, /onToggle/);
  assert.doesNotMatch(grading, /data-grading-disclosure[^>]*open=/);
});

test("regional evidence visibly preserves its Liga provider provenance", () => {
  const panel = readFileSync(
    new URL(
      "../features/vendor/components/RegionalMarketPanel.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(panel, /evidence\.sourceProvider/);
  assert.match(panel, /exact printing/);
  assert.match(panel, /compatible Liga equivalent/);
  assert.match(panel, /excluded from Arbitrage/);
});

test("the full Phronesis logo stays in navigation while the dedicated mark owns app icons", () => {
  const brand = readFileSync(
    new URL("../components/ui/PhronesisBrand.tsx", import.meta.url),
    "utf8",
  );
  const sidebar = readFileSync(
    new URL("../components/ui/Sidebar.tsx", import.meta.url),
    "utf8",
  );
  const mobile = readFileSync(
    new URL("../components/ui/MobileNavigation.tsx", import.meta.url),
    "utf8",
  );
  assert.match(brand, /\/brand\/phronesis-logo\.png/);
  assert.match(brand, /Phronesis/);
  assert.match(sidebar, /PhronesisBrand/);
  assert.match(mobile, /PhronesisBrand compact/);
  const logo = readFileSync(
    new URL("../public/brand/phronesis-logo.png", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(logo).digest("hex"),
    "29062e6fb7657458e17f594290380e50670431c0116824393b922a460ca54984",
  );

  const canonicalIcon = readFileSync(
    new URL("../public/brand/phronesis-app-icon.png", import.meta.url),
  );
  const browserIcon = readFileSync(new URL("../app/icon.png", import.meta.url));
  const appleIcon = readFileSync(
    new URL("../app/apple-icon.png", import.meta.url),
  );
  const favicon = readFileSync(new URL("../app/favicon.ico", import.meta.url));

  assert.deepEqual(pngDimensions(canonicalIcon), { width: 1254, height: 1254 });
  assert.deepEqual(pngDimensions(browserIcon), { width: 512, height: 512 });
  assert.deepEqual(pngDimensions(appleIcon), { width: 180, height: 180 });
  assert.deepEqual(icoDimensions(favicon), { width: 32, height: 32 });
  assert.equal(
    createHash("sha256").update(canonicalIcon).digest("hex"),
    "0fc335597c0f7fbe7407d6d8faec0b1d084a12b8937ec052405820565b5e0dbb",
  );
  assert.equal(
    createHash("sha256").update(browserIcon).digest("hex"),
    "2bdc7e40c845234eac0d148f787c26ec03b8d7ea6ca5417602543d8bab1ee632",
  );
  assert.equal(
    createHash("sha256").update(appleIcon).digest("hex"),
    "5e149948b3a4b92fc0cd5694d831931f4703fdd453739134025887abe9b9bdfe",
  );
  assert.equal(
    createHash("sha256").update(favicon).digest("hex"),
    "4ed3a7ecdb376d54aec6bd5bb2054874f1c718a2733c3debfbb5f59deb7c237e",
  );
  assert.equal(existsSync(new URL("../app/icon.ts", import.meta.url)), false);
  assert.equal(existsSync(new URL("../app/apple-icon.ts", import.meta.url)), false);
});
