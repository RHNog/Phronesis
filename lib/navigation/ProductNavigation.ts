import type { PhronesisModule } from "@/lib/auth/domain";

export type ProductArea =
  "Discover" | "Decide" | "Monitor" | "Manage" | "Administer";

export type PrimaryNavigationItem = {
  id:
    | "opportunities"
    | "vendor-workspace"
    | "event-ledger"
    | "event-flip"
    | "display-case"
    | "market-watch"
    | "inventory"
    | "artwork-review"
    | "settings";
  label: string;
  href: string;
  area: ProductArea;
  module: PhronesisModule;
  matches: readonly string[];
};

export const primaryNavigation = [
  {
    id: "opportunities",
    label: "Opportunities",
    href: "/",
    area: "Discover",
    module: "INTELLIGENCE",
    matches: ["/", "/opportunities"],
  },
  {
    id: "vendor-workspace",
    label: "Vendor Workspace",
    href: "/vendor",
    area: "Decide",
    module: "VENDOR_WORKSPACE",
    matches: ["/vendor", "/evaluate", "/price-lookup"],
  },
  {
    id: "event-ledger",
    label: "Event Ledger",
    href: "/event-ledger",
    area: "Manage",
    module: "EVENT_LEDGER",
    matches: ["/event-ledger"],
  },
  {
    id: "event-flip",
    label: "Event Flip",
    href: "/event-flip",
    area: "Manage",
    module: "EVENT_FLIP",
    matches: ["/event-flip"],
  },
  {
    id: "display-case",
    label: "Display Case",
    href: "/display-case",
    area: "Manage",
    module: "INVENTORY",
    matches: ["/display-case"],
  },
  {
    id: "market-watch",
    label: "Market Watch",
    href: "/watchlists",
    area: "Monitor",
    module: "MARKET_WATCH",
    matches: ["/watchlists"],
  },
  {
    id: "inventory",
    label: "General Inventory",
    href: "/inventory",
    area: "Manage",
    module: "INVENTORY",
    matches: ["/inventory"],
  },
  {
    id: "artwork-review",
    label: "Artwork Review",
    href: "/artwork-review",
    area: "Administer",
    module: "ADMINISTRATION",
    matches: ["/artwork-review"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    area: "Administer",
    module: "ADMINISTRATION",
    matches: ["/settings"],
  },
] as const satisfies readonly PrimaryNavigationItem[];

export type PrimaryNavigationId = (typeof primaryNavigation)[number]["id"];

export function navigationForModules(
  modules: readonly PhronesisModule[],
): readonly PrimaryNavigationItem[] {
  const allowed = new Set(modules);
  return primaryNavigation.filter((item) => allowed.has(item.module));
}

function matchesRoute(pathname: string, route: string): boolean {
  if (route === "/") {
    return pathname === route;
  }

  return pathname === route || pathname.startsWith(`${route}/`);
}

export function resolvePrimaryNavigation(
  pathname: string,
): PrimaryNavigationItem | undefined {
  return primaryNavigation.find((item) =>
    item.matches.some((route) => matchesRoute(pathname, route)),
  );
}
