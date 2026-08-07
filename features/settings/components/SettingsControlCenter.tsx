"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AccessManagement from "@/components/auth/AccessManagement";
import EventAccessManagement from "@/components/auth/EventAccessManagement";
import ProviderConnections from "@/components/settings/ProviderConnections";
import BusinessProfilesSettings from "@/features/settings/components/BusinessProfilesSettings";
import RegionalCostProfileSettings from "@/features/settings/components/RegionalCostProfileSettings";
import {
  SETTINGS_PANELS,
  normalizeSettingsPanel,
  type SettingsPanelIcon,
  type SettingsPanelId,
} from "@/lib/settings/panels";

function PanelIcon({ icon }: { icon: SettingsPanelIcon }) {
  const paths: Record<SettingsPanelIcon, React.ReactNode> = {
    overview: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    business: <><path d="M4 20V8l8-4 8 4v12" /><path d="M8 20v-6h8v6M8 9h.01M12 9h.01M16 9h.01" /></>,
    regional: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>,
    providers: <><path d="M8 12a4 4 0 1 1 4 4H7a4 4 0 1 1 .6-7.96A6 6 0 0 1 19 10" /><path d="M12 12v8M9 17l3 3 3-3" /></>,
    people: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    temporary: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2M8 2l-2 2M16 2l2 2" /></>,
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[icon]}
    </svg>
  );
}

export default function SettingsControlCenter({
  initialPanel,
  secureRegistrationReady,
  restrictedPublicOrigin,
  caseSourceSheetUrl,
  publicLoginUrl,
}: {
  initialPanel: SettingsPanelId;
  secureRegistrationReady: boolean;
  restrictedPublicOrigin: string | null;
  caseSourceSheetUrl: string | null;
  publicLoginUrl: string | null;
}) {
  const [activePanel, setActivePanel] = useState(initialPanel);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const activeDefinition = useMemo(
    () =>
      SETTINGS_PANELS.find((panel) => panel.id === activePanel) ??
      SETTINGS_PANELS[0],
    [activePanel],
  );

  useEffect(() => {
    const restoreFromHistory = () => {
      const panel = normalizeSettingsPanel(
        new URL(window.location.href).searchParams.get("panel"),
      );
      setActivePanel(panel);
    };
    window.addEventListener("popstate", restoreFromHistory);
    return () => window.removeEventListener("popstate", restoreFromHistory);
  }, []);

  function selectPanel(panel: SettingsPanelId) {
    if (panel === activePanel) return;
    const url = new URL(window.location.href);
    url.searchParams.set("panel", panel);
    window.history.pushState(null, "", url);
    setActivePanel(panel);
    window.requestAnimationFrame(() => headingRef.current?.focus());
  }

  return (
    <div className="w-full max-w-[92rem] space-y-5">
      <header className="overflow-hidden rounded-2xl border border-zinc-800 bg-[radial-gradient(circle_at_top_right,rgba(8,145,178,0.18),transparent_40%),linear-gradient(135deg,rgba(24,24,27,0.96),rgba(9,9,11,0.96))] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
          Administration
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Settings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
              One control center for business policy, market infrastructure,
              providers, and access.
            </p>
          </div>
          <span className="rounded-full border border-cyan-900 bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-200">
            {SETTINGS_PANELS.length - 1} focused panels
          </span>
        </div>
      </header>

      <label className="block rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 text-xs font-medium text-zinc-400 lg:hidden">
        Settings section
        <select
          value={activePanel}
          onChange={(event) =>
            selectPanel(event.target.value as SettingsPanelId)
          }
          className="mt-2 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base font-semibold text-zinc-100 outline-none focus:border-cyan-400"
        >
          {SETTINGS_PANELS.map((panel) => (
            <option key={panel.id} value={panel.id}>
              {panel.shortTitle}
            </option>
          ))}
        </select>
      </label>

      <div className="grid items-start gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="sticky top-20 hidden max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900/65 p-2 lg:block">
          <nav aria-label="Settings sections" className="space-y-1">
            {SETTINGS_PANELS.map((panel) => {
              const selected = panel.id === activePanel;
              return (
                <button
                  key={panel.id}
                  type="button"
                  aria-current={selected ? "page" : undefined}
                  onClick={() => selectPanel(panel.id)}
                  className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-cyan-400 ${selected ? "bg-cyan-300 text-zinc-950 shadow-lg shadow-cyan-950/30" : "text-zinc-300 hover:bg-zinc-800 hover:text-white"}`}
                >
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${selected ? "border-cyan-500/40 bg-cyan-950/10" : "border-zinc-700 bg-zinc-950"}`}>
                    <PanelIcon icon={panel.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {panel.shortTitle}
                    </span>
                    <span className={`mt-0.5 block text-[11px] ${selected ? "text-zinc-800" : "text-zinc-500"}`}>
                      {panel.category}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 py-4 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
              {activeDefinition.category}
            </p>
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 text-2xl font-semibold text-white outline-none"
            >
              {activeDefinition.title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-400">
              {activeDefinition.description}
            </p>
          </div>

          <section
            id="settings-panel-overview"
            aria-labelledby="settings-overview-heading"
            hidden={activePanel !== "overview"}
          >
            <h3 id="settings-overview-heading" className="sr-only">
              Settings areas
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SETTINGS_PANELS.filter((panel) => panel.id !== "overview").map(
                (panel, index) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => selectPanel(panel.id)}
                    className="group min-h-40 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-800 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-700 bg-zinc-950 text-cyan-300 transition group-hover:border-cyan-800">
                        <PanelIcon icon={panel.icon} />
                      </span>
                      <span className="text-lg text-zinc-600 transition group-hover:translate-x-1 group-hover:text-cyan-300">
                        →
                      </span>
                    </span>
                    <span className="mt-4 block text-base font-semibold text-white">
                      {panel.title}
                    </span>
                    <span className="mt-2 block text-sm leading-5 text-zinc-400">
                      {panel.description}
                    </span>
                    <span className={`mt-4 block h-1 w-10 rounded-full ${index % 2 === 0 ? "bg-cyan-400" : "bg-violet-500"}`} />
                  </button>
                ),
              )}
            </div>
          </section>

          <div id="settings-panel-business" hidden={activePanel !== "business"}>
            <BusinessProfilesSettings />
          </div>
          <div id="settings-panel-regional" hidden={activePanel !== "regional"}>
            <RegionalCostProfileSettings />
          </div>
          <div id="settings-panel-providers" hidden={activePanel !== "providers"}>
            <ProviderConnections secureRegistrationReady={secureRegistrationReady} />
          </div>
          <div id="settings-panel-people" hidden={activePanel !== "people"}>
            <AccessManagement
              active={secureRegistrationReady}
              restrictedPublicOrigin={restrictedPublicOrigin}
              caseSourceSheetUrl={caseSourceSheetUrl}
            />
          </div>
          <div id="settings-panel-temporary" hidden={activePanel !== "temporary"}>
            <EventAccessManagement
              active={secureRegistrationReady}
              publicLoginUrl={publicLoginUrl}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
