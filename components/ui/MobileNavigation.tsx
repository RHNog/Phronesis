"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  resolvePrimaryNavigation,
  type PrimaryNavigationItem,
} from "@/lib/navigation/ProductNavigation";

type MobileNavigationProps = {
  navigationItems: readonly PrimaryNavigationItem[];
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function MobileNavigation({
  navigationItems,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const selectedItem = resolvePrimaryNavigation(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const closeNavigation = useCallback((restoreFocus = true) => {
    setIsOpen(false);
    if (restoreFocus) {
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 768px)");
    function closeAtDesktopWidth(event: MediaQueryListEvent) {
      if (event.matches) {
        setIsOpen(false);
      }
    }

    desktopViewport.addEventListener("change", closeAtDesktopWidth);
    return () =>
      desktopViewport.removeEventListener("change", closeAtDesktopWidth);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = requestAnimationFrame(() => closeRef.current?.focus());

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeNavigation();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (
        event.shiftKey &&
        (document.activeElement === firstElement ||
          !panelRef.current.contains(document.activeElement))
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeNavigation, isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-controls="mobile-primary-navigation"
        aria-expanded={isOpen}
        aria-label="Open navigation"
        className="flex h-11 w-11 flex-none items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-zinc-200 transition hover:border-zinc-700 hover:text-white focus:border-cyan-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300 md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M4 7h16M4 12h16M4 17h16"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[60] bg-black/75 md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeNavigation();
            }
          }}
        >
          <section
            ref={panelRef}
            id="mobile-primary-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            className="flex h-full w-[min(21rem,calc(100vw-3rem))] flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl shadow-black"
          >
            <div className="flex min-h-16 items-center justify-between border-b border-zinc-800 px-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
                  Workspace
                </p>
                <h2
                  id="mobile-navigation-title"
                  className="text-lg font-semibold tracking-tight text-white"
                >
                  Phronesis
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Close navigation"
                className="flex h-11 w-11 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 text-2xl leading-none text-zinc-300 transition hover:border-zinc-700 hover:text-white focus:border-cyan-300 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-cyan-300"
                onClick={() => closeNavigation()}
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <nav
              aria-label="Mobile primary navigation"
              className="flex-1 overflow-y-auto px-3 py-5"
            >
              {navigationItems.length > 0 ? (
                <ul className="space-y-2">
                  {navigationItems.map((item) => {
                    const isSelected = item.id === selectedItem?.id;
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          aria-current={isSelected ? "page" : undefined}
                          className={`flex min-h-[52px] items-center justify-between gap-4 rounded-md px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                            isSelected
                              ? "bg-cyan-400 text-zinc-950"
                              : "text-zinc-200 hover:bg-zinc-900 hover:text-white"
                          }`}
                          onClick={() => closeNavigation(false)}
                        >
                          <span className="text-sm font-semibold">
                            {item.label}
                          </span>
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${
                              isSelected ? "text-zinc-800" : "text-zinc-500"
                            }`}
                          >
                            {item.area}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-zinc-400">
                  No workspaces are available for this account.
                </p>
              )}
            </nav>
          </section>
        </div>
      ) : null}
    </>
  );
}
