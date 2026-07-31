import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  navigationForModules,
  primaryNavigation,
  resolvePrimaryNavigation,
} from "../lib/navigation/ProductNavigation.ts";

test("primary navigation contains only operational product destinations", () => {
  assert.deepEqual(
    primaryNavigation.map(({ label, href }) => ({ label, href })),
    [
      { label: "Opportunities", href: "/" },
      { label: "Vendor Workspace", href: "/vendor" },
      { label: "Event Ledger", href: "/event-ledger" },
      { label: "Market Watch", href: "/watchlists" },
      { label: "Inventory", href: "/inventory" },
      { label: "Settings", href: "/settings" },
    ],
  );
  assert.equal(
    primaryNavigation.map(({ href }) => String(href)).includes("#"),
    false,
  );
  assert.equal(new Set(primaryNavigation.map(({ id }) => id)).size, 6);
});

test("contextual routes resolve to their owning product area", () => {
  assert.equal(resolvePrimaryNavigation("/")?.area, "Discover");
  assert.equal(
    resolvePrimaryNavigation("/opportunities/example")?.area,
    "Discover",
  );
  assert.equal(resolvePrimaryNavigation("/vendor")?.area, "Decide");
  assert.equal(resolvePrimaryNavigation("/evaluate")?.area, "Decide");
  assert.equal(resolvePrimaryNavigation("/event-ledger")?.area, "Manage");
  assert.equal(resolvePrimaryNavigation("/watchlists")?.area, "Monitor");
  assert.equal(resolvePrimaryNavigation("/inventory")?.area, "Manage");
  assert.equal(resolvePrimaryNavigation("/settings")?.area, "Administer");
});

test("unknown and developer routes do not select production navigation", () => {
  assert.equal(resolvePrimaryNavigation("/dev/identity"), undefined);
  assert.equal(resolvePrimaryNavigation("/dev/justtcg"), undefined);
  assert.equal(resolvePrimaryNavigation("/missing"), undefined);
});

test("module filtering preserves every authorized destination and no others", () => {
  assert.deepEqual(
    navigationForModules(["VENDOR_WORKSPACE"]).map(({ label, href }) => ({
      label,
      href,
    })),
    [
      { label: "Vendor Workspace", href: "/vendor" },
      { label: "Event Ledger", href: "/event-ledger" },
    ],
  );

  assert.deepEqual(
    navigationForModules(["INTELLIGENCE", "INVENTORY"]).map(
      ({ label, href }) => ({ label, href }),
    ),
    [
      { label: "Opportunities", href: "/" },
      { label: "Inventory", href: "/inventory" },
    ],
  );
});

test("the shared shell gives mobile navigation the server-filtered list", () => {
  const appShell = readFileSync(
    new URL("../components/ui/AppShell.tsx", import.meta.url),
    "utf8",
  );
  const topbar = readFileSync(
    new URL("../components/ui/Topbar.tsx", import.meta.url),
    "utf8",
  );
  const mobileNavigation = readFileSync(
    new URL("../components/ui/MobileNavigation.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    appShell,
    /<Topbar[\s\S]*navigationItems=\{navigationItems\}/,
  );
  assert.match(topbar, /<MobileNavigation navigationItems=\{navigationItems\}/);
  assert.doesNotMatch(mobileNavigation, /\bprimaryNavigation\b/);
  assert.match(mobileNavigation, /aria-label="Open navigation"/);
  assert.match(mobileNavigation, /aria-modal="true"/);
  assert.match(mobileNavigation, /aria-current=\{isSelected \? "page"/);
  assert.match(mobileNavigation, /event\.key === "Escape"/);
  assert.match(mobileNavigation, /document\.body\.style\.overflow = "hidden"/);
  assert.match(mobileNavigation, /matchMedia\("\(min-width: 768px\)"\)/);
  assert.match(mobileNavigation, /navigationItems\.map/);
});
