import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
      { label: "Dashboard", href: "/" },
      { label: "Opportunities", href: "/opportunities" },
      { label: "Vendor Workspace", href: "/vendor" },
      { label: "Event Ledger", href: "/event-ledger" },
      { label: "Event Flip", href: "/event-flip" },
      { label: "Display Case", href: "/display-case" },
      { label: "Market Watch", href: "/watchlists" },
      { label: "General Inventory", href: "/inventory" },
      { label: "Artwork Review", href: "/artwork-review" },
      { label: "Settings", href: "/settings" },
    ],
  );
  assert.equal(
    primaryNavigation.map(({ href }) => String(href)).includes("#"),
    false,
  );
  assert.equal(new Set(primaryNavigation.map(({ id }) => id)).size, 10);
});

test("contextual routes resolve to their owning product area", () => {
  assert.equal(resolvePrimaryNavigation("/")?.area, "Home");
  assert.equal(resolvePrimaryNavigation("/opportunities")?.area, "Discover");
  assert.equal(
    resolvePrimaryNavigation("/opportunities/example")?.area,
    "Discover",
  );
  assert.equal(resolvePrimaryNavigation("/vendor")?.area, "Decide");
  assert.equal(resolvePrimaryNavigation("/evaluate")?.area, "Decide");
  assert.equal(resolvePrimaryNavigation("/event-ledger")?.area, "Manage");
  assert.equal(resolvePrimaryNavigation("/event-flip")?.area, "Manage");
  assert.equal(resolvePrimaryNavigation("/display-case")?.area, "Manage");
  assert.equal(resolvePrimaryNavigation("/watchlists")?.area, "Monitor");
  assert.equal(resolvePrimaryNavigation("/inventory")?.area, "Manage");
  assert.equal(resolvePrimaryNavigation("/settings")?.area, "Administer");
  assert.equal(resolvePrimaryNavigation("/artwork-review")?.area, "Administer");
});

test("unknown and developer routes do not select production navigation", () => {
  assert.equal(resolvePrimaryNavigation("/dev/identity"), undefined);
  assert.equal(resolvePrimaryNavigation("/dev/justtcg"), undefined);
  assert.equal(resolvePrimaryNavigation("/missing"), undefined);
});

test("module filtering preserves every authorized destination and no others", () => {
  assert.deepEqual(
    navigationForModules(["VENDOR_WORKSPACE", "EVENT_LEDGER"]).map(({ label, href }) => ({
      label,
      href,
    })),
    [
      { label: "Dashboard", href: "/" },
      { label: "Vendor Workspace", href: "/vendor" },
      { label: "Event Ledger", href: "/event-ledger" },
    ],
  );

  assert.deepEqual(
    navigationForModules(["INTELLIGENCE", "EVENT_FLIP", "INVENTORY"]).map(
      ({ label, href }) => ({ label, href }),
    ),
    [
      { label: "Dashboard", href: "/" },
      { label: "Opportunities", href: "/opportunities" },
      { label: "Event Flip", href: "/event-flip" },
      { label: "Display Case", href: "/display-case" },
      { label: "General Inventory", href: "/inventory" },
    ],
  );

  assert.deepEqual(
    navigationForModules(["ARTWORK_REVIEW"]).map(({ label, href }) => ({ label, href })),
    [
      { label: "Dashboard", href: "/" },
      { label: "Artwork Review", href: "/artwork-review" },
    ],
  );
});

test("dashboard is the shared authenticated hub and opportunities has its own route", () => {
  const dashboard = readFileSync(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  const opportunities = readFileSync(
    new URL("../app/opportunities/page.tsx", import.meta.url),
    "utf8",
  );
  const dashboardHub = readFileSync(
    new URL("../components/dashboard/DashboardHub.tsx", import.meta.url),
    "utf8",
  );

  assert.match(dashboard, /<AppShell>/);
  assert.match(dashboard, /item\.id !== "dashboard"/);
  assert.match(opportunities, /requiredModule="INTELLIGENCE"/);
  assert.match(dashboardHub, /tools\.map/);
  assert.match(dashboardHub, /Access is filtered by your assigned role/);
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
  assert.match(mobileNavigation, /app-safe-area-panel/);
  assert.match(mobileNavigation, /createPortal/);
  assert.match(mobileNavigation, /document\.body/);
});

test("desktop sidebar exposes persistent accessible collapse controls", () => {
  const sidebar = readFileSync(
    new URL("../components/ui/Sidebar.tsx", import.meta.url),
    "utf8",
  );
  const shell = readFileSync(
    new URL("../components/ui/AppShell.tsx", import.meta.url),
    "utf8",
  );
  const topbar = readFileSync(
    new URL("../components/ui/Topbar.tsx", import.meta.url),
    "utf8",
  );
  const layout = readFileSync(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const globals = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const commandPalette = readFileSync(
    new URL("../components/search/CommandPalette.tsx", import.meta.url),
    "utf8",
  );

  assert.match(sidebar, /phronesis\.sidebar\.collapsed/);
  assert.match(sidebar, /aria-label="Collapse sidebar"/);
  assert.match(sidebar, /aria-label="Expand sidebar"/);
  assert.match(sidebar, /data-collapsed=/);
  assert.match(sidebar, /h-dvh max-h-dvh min-h-0/);
  assert.match(sidebar, /min-h-0 flex-1 overflow-y-auto overscroll-contain/);
  assert.match(sidebar, /display-mode: standalone/);
  assert.match(sidebar, /Meta\+B Control\+B/);
  assert.match(sidebar, /isEditableTarget/);
  assert.match(sidebar, /navigationChordRef/);
  assert.match(sidebar, /window\.setTimeout\(clearNavigationChord, 1500\)/);
  assert.match(sidebar, /\^Digit\(\[1-9\]\)\$/);
  assert.match(sidebar, /event\.key\.toLowerCase\(\) === "d"/);
  assert.match(sidebar, /toolDestinations/);
  assert.match(sidebar, />Expand</);
  assert.match(shell, /min-h-dvh/);
  assert.match(shell, /overflow-x-clip/);
  assert.match(topbar, /aria-label="Keyboard shortcuts"/);
  assert.match(topbar, /app-topbar/);
  assert.match(topbar, /app-safe-area-overlay/);
  assert.match(topbar, /aria-label="Open Settings"/);
  assert.match(topbar, /href="\/settings"/);
  assert.match(topbar, /role="dialog" aria-modal="true"/);
  assert.match(topbar, /Navigation shortcuts are active only in the installed app/);
  assert.match(topbar, /G then D/);
  assert.match(topbar, /G then \{index \+ 1\}/);
  assert.match(layout, /viewportFit: "cover"/);
  assert.match(globals, /color-scheme: dark/);
  assert.match(globals, /scrollbar-color: #3f3f46 var\(--background\)/);
  assert.match(globals, /::-webkit-scrollbar-track/);
  assert.match(globals, /@media \(display-mode: standalone\)/);
  assert.match(globals, /overscroll-behavior: none/);
  assert.match(
    globals,
    /height: calc\(4rem \+ env\(safe-area-inset-top\)\)/,
  );
  assert.match(globals, /padding-top: env\(safe-area-inset-top\)/);
  assert.match(globals, /app-command-palette-safe/);
  assert.match(commandPalette, /app-command-palette-safe/);
});

test("the shared shell uses the approved Phronesis brand assets", () => {
  const sidebar = readFileSync(
    new URL("../components/ui/Sidebar.tsx", import.meta.url),
    "utf8",
  );
  const mobileNavigation = readFileSync(
    new URL("../components/ui/MobileNavigation.tsx", import.meta.url),
    "utf8",
  );
  const mark = readFileSync(
    new URL("../components/ui/PhronesisMark.tsx", import.meta.url),
    "utf8",
  );
  const layout = readFileSync(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );
  const manifest = readFileSync(
    new URL("../app/manifest.ts", import.meta.url),
    "utf8",
  );
  const sha256 = (path: string) =>
    createHash("sha256")
      .update(readFileSync(new URL(path, import.meta.url)))
      .digest("hex");
  const pngSize = (path: string) => {
    const bytes = readFileSync(new URL(path, import.meta.url));
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  };

  assert.match(sidebar, /<PhronesisMark size=\{36\} priority/);
  assert.match(mobileNavigation, /<PhronesisMark size=\{38\}/);
  assert.match(mark, /src="\/brand\/phronesis-app-icon\.png"/);
  assert.match(layout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(layout, /appleWebApp:/);
  assert.match(layout, /themeColor: "#09090b"/);
  assert.match(manifest, /start_url: "\/"/);
  assert.match(manifest, /scope: "\/"/);
  assert.match(manifest, /display: "standalone"/);
  assert.doesNotMatch(manifest, /https?:\/\//);
  assert.doesNotMatch(manifest, /tailaa2d39|localhost|9444/);
  assert.equal(
    sha256("../app/favicon.ico"),
    "4ed3a7ecdb376d54aec6bd5bb2054874f1c718a2733c3debfbb5f59deb7c237e",
  );
  assert.equal(
    sha256("../app/apple-icon.png"),
    "5e149948b3a4b92fc0cd5694d831931f4703fdd453739134025887abe9b9bdfe",
  );
  assert.equal(
    sha256("../public/brand/phronesis-app-icon.png"),
    "0fc335597c0f7fbe7407d6d8faec0b1d084a12b8937ec052405820565b5e0dbb",
  );
  assert.deepEqual(pngSize("../public/brand/phronesis-app-icon-192.png"), {
    width: 192,
    height: 192,
  });
  assert.deepEqual(pngSize("../public/brand/phronesis-app-icon-512.png"), {
    width: 512,
    height: 512,
  });
  assert.equal(
    sha256("../app/icon.png"),
    sha256("../public/brand/phronesis-app-icon-512.png"),
  );
});
