import Link from "next/link";
import NavigationIcon from "@/components/ui/NavigationIcon";
import type { PrimaryNavigationId } from "@/lib/navigation/ProductNavigation";

type NavItemProps = {
  href: string;
  itemId: PrimaryNavigationId;
  label: string;
  isSelected?: boolean;
  compact?: boolean;
};

export default function NavItem({
  href,
  itemId,
  label,
  isSelected = false,
  compact = false,
}: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={isSelected ? "page" : undefined}
      title={compact ? label : undefined}
      className={`flex min-h-12 items-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zinc-950 ${compact ? "justify-center px-2" : "gap-3 px-4 py-3"} ${
        isSelected
          ? "bg-cyan-400 text-zinc-950"
          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
      }`}
    >
      <NavigationIcon itemId={itemId} className="h-5 w-5 flex-none" />
      <span className={compact ? "sr-only" : "truncate"}>{label}</span>
    </Link>
  );
}
