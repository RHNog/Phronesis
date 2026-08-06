"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import NavItem from "@/components/ui/NavItem";
import PhronesisMark from "@/components/ui/PhronesisMark";
import {
  primaryNavigation,
  resolvePrimaryNavigation,
  type PrimaryNavigationItem,
} from "@/lib/navigation/ProductNavigation";

export default function Sidebar({
  navigationItems = primaryNavigation,
}: {
  navigationItems?: readonly PrimaryNavigationItem[];
}) {
  const pathname = usePathname();
  const selectedItem = resolvePrimaryNavigation(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [preferenceReady, setPreferenceReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setCollapsed(
          window.localStorage.getItem("phronesis.sidebar.collapsed") === "true",
        );
      } catch {
        // Storage is an enhancement; navigation stays expanded when unavailable.
      }
      setPreferenceReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!preferenceReady) return;
    try {
      window.localStorage.setItem(
        "phronesis.sidebar.collapsed",
        String(collapsed),
      );
    } catch {
      // Keep the in-memory preference when persistence is unavailable.
    }
  }, [collapsed, preferenceReady]);

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={`hidden min-h-screen flex-none flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-[width] duration-200 md:flex ${collapsed ? "w-20" : "w-[260px]"}`}
    >
      <div className={`flex min-h-16 items-center border-b border-zinc-800 ${collapsed ? "justify-center px-2" : "gap-3 px-4"}`}>
        <Link
          href="/"
          aria-label="Phronesis Dashboard"
          className={`flex min-w-0 items-center rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zinc-950 ${collapsed ? "justify-center" : "flex-1 gap-3"}`}
        >
          <PhronesisMark size={36} priority />
          <span className={collapsed ? "sr-only" : "truncate text-lg font-semibold tracking-tight"}>
            Phronesis
          </span>
        </Link>
        {!collapsed ? (
          <button
            type="button"
            aria-label="Collapse sidebar"
            aria-expanded="true"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            onClick={() => setCollapsed(true)}
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : null}
      </div>

      <nav aria-label="Primary navigation" className={`flex-1 py-5 ${collapsed ? "px-3" : "px-4"}`}>
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <NavItem
                href={item.href}
                itemId={item.id}
                label={item.label}
                isSelected={item.id === selectedItem?.id}
                compact={collapsed}
              />
            </li>
          ))}
        </ul>
      </nav>

      {collapsed ? (
        <div className="border-t border-zinc-800 p-3">
          <button
            type="button"
            aria-label="Expand sidebar"
            aria-expanded="false"
            className="flex h-12 w-full items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            onClick={() => setCollapsed(false)}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      ) : null}
    </aside>
  );
}
