import type { PrimaryNavigationId } from "@/lib/navigation/ProductNavigation";

type NavigationIconProps = {
  itemId: PrimaryNavigationId;
  className?: string;
};

const iconPaths: Record<PrimaryNavigationId, readonly string[]> = {
  dashboard: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  opportunities: ["M4 18 10 12l4 4 6-9", "M15 7h5v5"],
  "vendor-workspace": ["M4 9h16", "M5 9l1-5h12l1 5", "M6 9v11h12V9", "M9 20v-6h6v6"],
  "event-ledger": ["M6 3h12v18H6z", "M9 8h6", "M9 12h6", "M9 16h4"],
  "event-flip": ["M7 7h10l-3-3", "m17 17H7l3 3", "M17 7a5 5 0 0 1 0 10", "M7 17a5 5 0 0 1 0-10"],
  "display-case": ["M4 6h16v14H4z", "M8 6V4h8v2", "M4 11h16", "M12 11v9"],
  "market-watch": ["M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z", "M12 9v3l2 2"],
  inventory: ["M4 7 12 3l8 4-8 4z", "M4 7v10l8 4 8-4V7", "M12 11v10"],
  "artwork-review": ["M4 5h16v14H4z", "m7 15 3-3 2 2 3-4 3 5", "M9 9h.01", "M18 18l3 3"],
  settings: ["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", "M4 12H2", "M22 12h-2", "M12 4V2", "M12 22v-2", "m5.7-5.7 1.4 1.4", "m4.9 4.9 1.4 1.4", "m6.4 0-1.4 1.4", "m4.9-4.9-1.4 1.4"],
};

export default function NavigationIcon({
  itemId,
  className = "h-5 w-5",
}: NavigationIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
    >
      {iconPaths[itemId].map((path) => (
        <path
          key={path}
          d={path}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      ))}
    </svg>
  );
}
