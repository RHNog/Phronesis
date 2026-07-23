import Link from "next/link";

type NavItemProps = {
  href: string;
  label: string;
  isSelected?: boolean;
};

export default function NavItem({
  href,
  label,
  isSelected = false,
}: NavItemProps) {
  return (
    <Link
      href={href}
      aria-current={isSelected ? "page" : undefined}
      className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
        isSelected
          ? "bg-cyan-400 text-zinc-950"
          : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
