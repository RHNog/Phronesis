import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  OPERATIONAL_PRICING_DATABASE_RELATIVE_PATH,
  operationalPricingDatabasePath,
} from "../lib/pricing/databasePath.ts";

test("operational pricing database has one default and preserves explicit overrides", () => {
  const root = "/tmp/phronesis-operational-test";
  assert.equal(
    operationalPricingDatabasePath(root),
    resolve(root, OPERATIONAL_PRICING_DATABASE_RELATIVE_PATH),
  );
  assert.equal(
    operationalPricingDatabasePath(root, "   "),
    resolve(root, OPERATIONAL_PRICING_DATABASE_RELATIVE_PATH),
  );
  assert.equal(
    operationalPricingDatabasePath(root, ".data/explicit.sqlite"),
    resolve(root, ".data/explicit.sqlite"),
  );
  assert.equal(
    operationalPricingDatabasePath(root, "/var/tmp/explicit.sqlite"),
    "/var/tmp/explicit.sqlite",
  );
});

test("new Magic catalogue imports trigger regional reconciliation through the shared database", () => {
  const watcher = readFileSync(
    new URL("../scripts/watch-pricing-catalogues.ts", import.meta.url),
    "utf8",
  );
  const privateAgent = readFileSync(
    new URL("../ops/launchd/com.phronesis.private-review.plist", import.meta.url),
    "utf8",
  );
  assert.match(watcher, /verifiedCategories\.has\("magic-en"\)/);
  assert.match(watcher, /rebuildRegionalCrosswalk\(\{ databasePath \}\)/);
  assert.match(privateAgent, /scripts\/start-phronesis\.mjs/);
  assert.match(privateAgent, /\.data\/mobile-review\.sqlite/);
});
