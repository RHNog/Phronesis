"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import CommandPalette from "@/components/search/CommandPalette";
import type { CommandPaletteContext } from "@/components/search/CommandPaletteRouter";
import MobileNavigation from "@/components/ui/MobileNavigation";
import SignOutButton from "@/components/auth/SignOutButton";
import type { AccountSummary } from "@/lib/auth/domain";
import type { PrimaryNavigationItem } from "@/lib/navigation/ProductNavigation";

type TopbarProps = {
  context: CommandPaletteContext;
  navigationItems: readonly PrimaryNavigationItem[];
  account: AccountSummary | null;
};

function initials(account: AccountSummary): string {
  const parts = account.name.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) || account.email.slice(0, 2)).toUpperCase();
}

export default function Topbar({ context, navigationItems, account }: TopbarProps) {
  const [open, setOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const shortcutCloseRef = useRef<HTMLButtonElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const toolShortcuts = navigationItems.filter((item) => item.href !== "/").slice(0, 9);
  const settingsAssigned = navigationItems.some((item) => item.href === "/settings");

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        return;
      }
      const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
      const standalone = window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
      const editable = event.target instanceof Element && Boolean(event.target.closest("input, textarea, select, [contenteditable='true']"));
      if (standalone && !editable && event.key === "?" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!shortcutsOpen) return;
    const frame = window.requestAnimationFrame(() => shortcutCloseRef.current?.focus());
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setShortcutsOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [shortcutsOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    function close(event: MouseEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof MouseEvent && accountRef.current?.contains(event.target as Node)) return;
      setAccountOpen(false);
    }
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", close);
    };
  }, [accountOpen]);

  return (
    <>
      <header className="app-topbar sticky top-0 z-40 flex flex-none items-center gap-2 border-b border-zinc-800 bg-zinc-950/95 px-3 [padding-left:max(.75rem,env(safe-area-inset-left))] pr-[max(.75rem,env(safe-area-inset-right))] backdrop-blur md:px-6 md:[padding-left:max(1.5rem,env(safe-area-inset-left))] md:pr-[max(1.5rem,env(safe-area-inset-right))]">
        <MobileNavigation navigationItems={navigationItems} />
        <button
          aria-label="Search Phronesis"
          className="flex h-11 min-w-0 flex-1 items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 px-3 text-left text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-300 focus:border-cyan-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300 md:max-w-md md:px-4"
          onClick={() => setOpen(true)}
          type="button"
        >
          <span className="truncate">Search anything…</span>
          <kbd className="ml-3 hidden rounded border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-400 lg:inline">
            ⌘K / Ctrl+K
          </kbd>
        </button>

        <button
          type="button"
          aria-label="Keyboard shortcuts"
          aria-haspopup="dialog"
          aria-expanded={shortcutsOpen}
          title="Keyboard shortcuts (?)"
          className="ml-auto flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-sm font-semibold text-zinc-300 transition hover:border-zinc-700 hover:text-white focus:border-cyan-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300"
          onClick={() => setShortcutsOpen(true)}
        >
          <span aria-hidden="true">?</span>
        </button>
        {account ? (
          <div ref={accountRef} className="relative">
            <button
              type="button"
              aria-label="Open account menu"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              title={account.email}
              onClick={() => setAccountOpen((current) => !current)}
              className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-transparent bg-zinc-800 text-sm font-semibold text-zinc-200 focus:border-cyan-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300"
            >
              {initials(account)}
            </button>
            {accountOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[3.25rem] z-50 w-72 rounded-xl border border-zinc-700 bg-zinc-950 p-3 shadow-2xl shadow-black"
              >
                <div className="border-b border-zinc-800 px-2 pb-3">
                  <p className="truncate text-sm font-semibold text-white">
                    {account.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {account.email}
                  </p>
                </div>
                <div className="mt-2 grid gap-1">
                  <Link
                    role="menuitem"
                    href="/user-settings"
                    onClick={() => setAccountOpen(false)}
                    className="flex min-h-11 items-center rounded-lg px-3 text-sm text-zinc-200 hover:bg-zinc-900"
                  >
                    My settings
                  </Link>
                  {settingsAssigned ? (
                    <Link
                      role="menuitem"
                      href="/settings"
                      onClick={() => setAccountOpen(false)}
                      className="flex min-h-11 items-center rounded-lg px-3 text-sm text-zinc-200 hover:bg-zinc-900"
                    >
                      Administration settings
                    </Link>
                  ) : null}
                  <SignOutButton className="min-h-11 rounded-lg px-3 text-left text-sm text-zinc-200 hover:bg-zinc-900" />
                </div>
              </div>
            ) : null}
          </div>
        ) : settingsAssigned ? (
          <Link
            href="/settings"
            aria-label="Open Settings"
            title="Settings"
            className="flex h-11 w-11 flex-none items-center justify-center rounded-full border border-transparent bg-zinc-800 text-sm font-semibold text-zinc-200 focus:border-cyan-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300"
          >
            PT
          </Link>
        ) : null}
      </header>
      {shortcutsOpen ? (
        <div
          className="app-safe-area-overlay fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShortcutsOpen(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="shortcut-help-title" className="max-h-[min(42rem,calc(100dvh-2rem))] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl shadow-black sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-300">Installed WebApp</p><h2 id="shortcut-help-title" className="mt-1 text-xl font-semibold text-white">Keyboard shortcuts</h2></div>
              <button ref={shortcutCloseRef} type="button" aria-label="Close keyboard shortcuts" onClick={() => setShortcutsOpen(false)} className="flex h-11 w-11 flex-none items-center justify-center rounded-lg border border-zinc-700 text-xl text-zinc-300 hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-400">×</button>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">Navigation shortcuts are active only in the installed app, so normal browser shortcuts remain untouched.</p>
            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5"><dt>Search Phronesis</dt><dd><kbd className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">⌘/Ctrl K</kbd></dd></div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5"><dt>Toggle sidebar</dt><dd><kbd className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">⌘/Ctrl B</kbd></dd></div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5"><dt>Dashboard</dt><dd><kbd className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">G then D</kbd></dd></div>
              {toolShortcuts.map((item, index) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5"><dt className="min-w-0 truncate">{item.label}</dt><dd><kbd className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">G then {index + 1}</kbd></dd></div>)}
              <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5"><dt>Shortcut help</dt><dd><kbd className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">?</kbd></dd></div>
              <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2.5"><dt>Close dialog</dt><dd><kbd className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs">Esc</kbd></dd></div>
            </dl>
          </section>
        </div>
      ) : null}
      <CommandPalette
        context={context}
        onClose={() => setOpen(false)}
        open={open}
      />
    </>
  );
}
