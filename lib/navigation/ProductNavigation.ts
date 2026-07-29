export type ProductArea = "Discover" | "Decide" | "Monitor" | "Administer";

export type PrimaryNavigationItem = {
  id: "opportunities" | "vendor-workspace" | "market-watch" | "settings";
  label: string;
  href: string;
  area: ProductArea;
  matches: readonly string[];
};

export const primaryNavigation = [
  {
    id: "opportunities",
    label: "Opportunities",
    href: "/",
    area: "Discover",
    matches: ["/", "/opportunities"],
  },
  {
    id: "vendor-workspace",
    label: "Vendor Workspace",
    href: "/vendor",
    area: "Decide",
  matches: ["/vendor", "/evaluate", "/price-lookup"],
  },
  {
    id: "market-watch",
    label: "Market Watch",
    href: "/watchlists",
    area: "Monitor",
    matches: ["/watchlists"],
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    area: "Administer",
    matches: ["/settings"],
  },
] as const satisfies readonly PrimaryNavigationItem[];

export type PrimaryNavigationId = (typeof primaryNavigation)[number]["id"];

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
