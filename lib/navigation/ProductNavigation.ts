import type { PhronesisModule } from "@/lib/auth/domain";

export type ProductArea =
  "Home" | "Discover" | "Decide" | "Monitor" | "Manage" | "Administer";

export type PrimaryNavigationItem = {
  id:
    | "dashboard"
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
  description: string;
  module: PhronesisModule | null;
  matches: readonly string[];
};

export const primaryNavigation = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/",
    area: "Home",
    description: "Open every Phronesis tool available to your workspace.",
    module: null,
    matches: ["/"],
  },
  {
    id: "opportunities",
    label: "Opportunities",
    href: "/opportunities",
    area: "Discover",
    description: "Compare market signals and review actionable opportunities.",
    module: "INTELLIGENCE",
    matches: ["/opportunities"],
  },
  {
    id: "vendor-workspace",
    label: "Vendor Workspace",
    href: "/vendor",
    area: "Decide",
    description: "Search catalogues, price cards, and run event buying workflows.",
    module: "VENDOR_WORKSPACE",
    matches: ["/vendor", "/evaluate", "/price-lookup"],
  },
  {
    id: "event-ledger",
    label: "Event Ledger",
    href: "/event-ledger",
    area: "Manage",
    description: "Record event cash, purchases, sales, and closeout evidence.",
    module: "EVENT_LEDGER",
    matches: ["/event-ledger"],
  },
  {
    id: "event-flip",
    label: "Event Flip",
    href: "/event-flip",
    area: "Manage",
    description: "Prioritize acquired inventory for event resale decisions.",
    module: "EVENT_FLIP",
    matches: ["/event-flip"],
  },
  {
    id: "display-case",
    label: "Display Case",
    href: "/display-case",
    area: "Manage",
    description: "Control reserved showcase inventory and display movements.",
    module: "INVENTORY",
    matches: ["/display-case"],
  },
  {
    id: "market-watch",
    label: "Market Watch",
    href: "/watchlists",
    area: "Monitor",
    description: "Track exact products, targets, history, and price changes.",
    module: "MARKET_WATCH",
    matches: ["/watchlists"],
  },
  {
    id: "inventory",
    label: "General Inventory",
    href: "/inventory",
    area: "Manage",
    description: "Review owned quantities, cost basis, locations, and disposition.",
    module: "INVENTORY",
    matches: ["/inventory"],
  },
  {
    id: "artwork-review",
    label: "Artwork Review",
    href: "/artwork-review",
    area: "Administer",
    description: "Resolve catalogue artwork exceptions with auditable evidence.",
    module: "ARTWORK_REVIEW",
    matches: ["/artwork-review"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    area: "Administer",
    description: "Manage providers, access, modules, and workspace configuration.",
    module: "ADMINISTRATION",
    matches: ["/settings"],
  },
] as const satisfies readonly PrimaryNavigationItem[];

export type PrimaryNavigationId = (typeof primaryNavigation)[number]["id"];

export function navigationForModules(
  modules: readonly PhronesisModule[],
): readonly PrimaryNavigationItem[] {
  const allowed = new Set(modules);
  return primaryNavigation.filter(
    (item) => item.module === null || allowed.has(item.module),
  );
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
