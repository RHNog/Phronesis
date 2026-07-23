import assert from "node:assert/strict";
import test from "node:test";
import {
  primaryNavigation,
  resolvePrimaryNavigation,
} from "../lib/navigation/ProductNavigation.ts";

test("primary navigation contains only operational product destinations", () => {
  assert.deepEqual(
    primaryNavigation.map(({ label, href }) => ({ label, href })),
    [
      { label: "Opportunities", href: "/" },
      { label: "Vendor Workspace", href: "/vendor" },
      { label: "Market Watch", href: "/watchlists" },
      { label: "Settings", href: "/settings" },
    ],
  );
  assert.equal(
    primaryNavigation.map(({ href }) => String(href)).includes("#"),
    false,
  );
  assert.equal(new Set(primaryNavigation.map(({ id }) => id)).size, 4);
});

test("contextual routes resolve to their owning product area", () => {
  assert.equal(resolvePrimaryNavigation("/")?.area, "Discover");
  assert.equal(
    resolvePrimaryNavigation("/opportunities/example")?.area,
    "Discover",
  );
  assert.equal(resolvePrimaryNavigation("/vendor")?.area, "Decide");
  assert.equal(resolvePrimaryNavigation("/evaluate")?.area, "Decide");
  assert.equal(resolvePrimaryNavigation("/watchlists")?.area, "Monitor");
  assert.equal(resolvePrimaryNavigation("/settings")?.area, "Administer");
});

test("unknown and developer routes do not select production navigation", () => {
  assert.equal(resolvePrimaryNavigation("/dev/identity"), undefined);
  assert.equal(resolvePrimaryNavigation("/dev/justtcg"), undefined);
  assert.equal(resolvePrimaryNavigation("/missing"), undefined);
});
