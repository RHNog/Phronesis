"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const router = useRouter();
  const selectedItem = resolvePrimaryNavigation(pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [preferenceReady, setPreferenceReady] = useState(false);
  const navigationChordRef = useRef(false);
  const navigationChordTimeoutRef = useRef<number | null>(null);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => !current);
  }, []);

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

  useEffect(() => {
    function isStandaloneWebApp(): boolean {
      const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
      return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
    }

    function isEditableTarget(target: EventTarget | null): boolean {
      return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
    }

    function clearNavigationChord() {
      navigationChordRef.current = false;
      if (navigationChordTimeoutRef.current !== null) {
        window.clearTimeout(navigationChordTimeoutRef.current);
        navigationChordTimeoutRef.current = null;
      }
    }

    function handleWebAppShortcut(event: KeyboardEvent) {
      if (!isStandaloneWebApp() || isEditableTarget(event.target)) {
        clearNavigationChord();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleCollapsed();
        return;
      }
      const unmodified = !event.metaKey && !event.ctrlKey && !event.altKey;
      if (unmodified && event.key.toLowerCase() === "g") {
        event.preventDefault();
        clearNavigationChord();
        navigationChordRef.current = true;
        navigationChordTimeoutRef.current = window.setTimeout(clearNavigationChord, 1500);
        return;
      }
      if (!navigationChordRef.current || !unmodified) return;
      clearNavigationChord();
      const toolDestinations = navigationItems.filter((item) => item.href !== "/");
      const toolShortcut = /^Digit([1-9])$/.exec(event.code);
      const destination = event.key.toLowerCase() === "d"
        ? "/"
        : toolShortcut
          ? toolDestinations[Number(toolShortcut[1]) - 1]?.href
          : undefined;
      if (!destination) return;
      event.preventDefault();
      router.push(destination);
    }

    window.addEventListener("keydown", handleWebAppShortcut);
    return () => {
      window.removeEventListener("keydown", handleWebAppShortcut);
      clearNavigationChord();
    };
  }, [navigationItems, router, toggleCollapsed]);

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={`sticky top-0 hidden h-dvh max-h-dvh min-h-0 flex-none flex-col overflow-hidden border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-[width] duration-200 md:flex ${collapsed ? "w-20" : "w-[260px]"}`}
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
            aria-keyshortcuts="Meta+B Control+B"
            aria-expanded="true"
            title="Collapse sidebar (⌘B / Ctrl+B in the installed app)"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            onClick={() => setCollapsed(true)}
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <button
          type="button"
          aria-label="Expand sidebar"
          aria-keyshortcuts="Meta+B Control+B"
          aria-expanded="false"
          title="Expand sidebar (⌘B / Ctrl+B in the installed app)"
          className="flex min-h-14 w-full flex-none flex-col items-center justify-center gap-0.5 border-b border-zinc-800 text-zinc-300 transition hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-400"
          onClick={() => setCollapsed(false)}
        >
          <span className="text-xl leading-none" aria-hidden="true">›</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide">Expand</span>
        </button>
      ) : null}

      <nav aria-label="Primary navigation" className={`min-h-0 flex-1 overflow-y-auto overscroll-contain py-5 ${collapsed ? "px-3" : "px-4"}`}>
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

    </aside>
  );
}
