"use client";

import { useMemo, useState } from "react";
import type { MarketProviderId } from "@/lib/market/providers";
import type { RegionalCostProfile } from "@/lib/regional/domain";
import {
  PERSONAL_COST_FIELDS,
  type PersonalCostField,
  type PersonalCostOverrides,
  type UserMarketSettings,
} from "@/lib/user-settings/domain";

type DirectionField = {
  field: PersonalCostField;
  label: string;
  suffix: string;
};

const usToBrazilFields: DirectionField[] = [
  { field: "usToBrazilFixedBrl", label: "Fixed landed cost", suffix: "BRL" },
  { field: "usToBrazilPercent", label: "Variable landed cost", suffix: "%" },
  { field: "usToBrazilMinAcquisitionUsd", label: "Minimum acquisition", suffix: "USD" },
  { field: "usToBrazilMaxAcquisitionUsd", label: "Maximum acquisition", suffix: "USD" },
  { field: "usToBrazilMinGrossProceedsBrl", label: "Minimum gross proceeds", suffix: "BRL" },
  { field: "usToBrazilMinGrossSpreadBrl", label: "Minimum gross spread", suffix: "BRL" },
  { field: "usToBrazilMinNetProfitBrl", label: "Minimum net profit", suffix: "BRL" },
  { field: "usToBrazilMinProfitMarginPercent", label: "Minimum profit margin", suffix: "%" },
  { field: "usToBrazilMinRoiPercent", label: "Minimum ROI", suffix: "%" },
];

const brazilToUsFields: DirectionField[] = [
  { field: "brazilToUsFixedUsd", label: "Fixed landed cost", suffix: "USD" },
  { field: "brazilToUsPercent", label: "Variable landed cost", suffix: "%" },
  { field: "brazilToUsMinAcquisitionBrl", label: "Minimum acquisition", suffix: "BRL" },
  { field: "brazilToUsMaxAcquisitionBrl", label: "Maximum acquisition", suffix: "BRL" },
  { field: "brazilToUsMinGrossProceedsUsd", label: "Minimum gross proceeds", suffix: "USD" },
  { field: "brazilToUsMinGrossSpreadUsd", label: "Minimum gross spread", suffix: "USD" },
  { field: "brazilToUsMinNetProfitUsd", label: "Minimum net profit", suffix: "USD" },
  { field: "brazilToUsMinProfitMarginPercent", label: "Minimum profit margin", suffix: "%" },
  { field: "brazilToUsMinRoiPercent", label: "Minimum ROI", suffix: "%" },
];

const categoryLabels: Record<string, string> = {
  "magic-en": "Magic",
  "pokemon-en": "Pokémon",
  "onepiece-en": "One Piece",
  "lorcana-en": "Lorcana",
};

function effectiveValue(
  profile: RegionalCostProfile,
  field: PersonalCostField,
): string {
  const value = profile[field];
  return value === null ? "No workspace default" : `Workspace: ${value}`;
}

function CostDirection({
  title,
  subtitle,
  fields,
  overrides,
  effectiveProfile,
  onChange,
}: {
  title: string;
  subtitle: string;
  fields: DirectionField[];
  overrides: PersonalCostOverrides;
  effectiveProfile: RegionalCostProfile;
  onChange: (field: PersonalCostField, value: number | null) => void;
}) {
  return (
    <fieldset className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <legend className="px-1 text-base font-semibold text-white">{title}</legend>
      <p className="text-xs leading-5 text-zinc-500">{subtitle}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map(({ field, label, suffix }) => (
          <label key={field} className="text-xs font-medium text-zinc-300">
            {label}
            <span className="ml-1 text-zinc-600">({suffix})</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={overrides[field] ?? ""}
              placeholder={effectiveValue(effectiveProfile, field)}
              onChange={(event) =>
                onChange(
                  field,
                  event.target.value === "" ? null : Number(event.target.value),
                )
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-white placeholder:text-zinc-600 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function UserMarketSettingsWorkspace({
  initialSettings,
}: {
  initialSettings: UserMarketSettings;
}) {
  const [section, setSection] = useState<"providers" | "economics">(
    "providers",
  );
  const [settings, setSettings] = useState(initialSettings);
  const [enabledProviderIds, setEnabledProviderIds] = useState<
    MarketProviderId[]
  >(initialSettings.enabledProviderIds);
  const [costOverrides, setCostOverrides] = useState(
    initialSettings.costOverrides,
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(
    () =>
      JSON.stringify(enabledProviderIds) !==
        JSON.stringify(settings.enabledProviderIds) ||
      PERSONAL_COST_FIELDS.some(
        (field) => costOverrides[field] !== settings.costOverrides[field],
      ),
    [costOverrides, enabledProviderIds, settings],
  );

  function toggleProvider(providerId: MarketProviderId) {
    setEnabledProviderIds((current) =>
      current.includes(providerId)
        ? current.filter((candidate) => candidate !== providerId)
        : [...current, providerId],
    );
    setMessage("");
  }

  async function save() {
    if (!enabledProviderIds.length) {
      setSection("providers");
      setMessage("Select at least one market provider.");
      return;
    }
    setSaving(true);
    setMessage("Saving your settings…");
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabledProviderIds, costOverrides }),
      });
      const body = (await response.json()) as {
        settings?: UserMarketSettings;
        error?: string;
      };
      if (!response.ok || !body.settings) {
        throw new Error(body.error ?? "Personal settings could not be saved.");
      }
      setSettings(body.settings);
      setEnabledProviderIds(body.settings.enabledProviderIds);
      setCostOverrides(body.settings.costOverrides);
      setMessage("Your market settings are saved.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Personal settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="w-full max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Your market workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            My settings
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
            Choose the evidence you work with and tailor regional economics to
            your operation. These choices affect only your account.
          </p>
        </div>
        <span className="rounded-full border border-emerald-900 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-200">
          All providers included for now
        </span>
      </div>

      <div
        role="tablist"
        aria-label="My settings sections"
        className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={section === "providers"}
          onClick={() => setSection("providers")}
          className={`min-h-11 rounded-lg px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 ${section === "providers" ? "bg-cyan-300 text-zinc-950" : "text-zinc-300 hover:bg-zinc-800"}`}
        >
          Market providers
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={section === "economics"}
          onClick={() => setSection("economics")}
          className={`min-h-11 rounded-lg px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 ${section === "economics" ? "bg-cyan-300 text-zinc-950" : "text-zinc-300 hover:bg-zinc-800"}`}
        >
          Cost structure
        </button>
      </div>

      {section === "providers" ? (
        <section role="tabpanel" className="mt-4 grid gap-3 md:grid-cols-2">
          {settings.providers.map((provider) => {
            const enabled = enabledProviderIds.includes(provider.id);
            return (
              <label
                key={provider.id}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${enabled ? "border-cyan-700 bg-cyan-950/20" : "border-zinc-800 bg-zinc-900/60"}`}
              >
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleProvider(provider.id)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-cyan-300"
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">
                      {provider.label}
                    </span>
                    <span className="rounded-full border border-emerald-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">
                      Included
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-zinc-400">
                    {provider.description}
                  </span>
                  <span className="mt-2 block text-xs text-zinc-500">
                    {provider.categoryIds
                      .map(
                        (categoryId) =>
                          categoryLabels[categoryId] ?? categoryId,
                      )
                      .join(" · ")}
                  </span>
                </span>
              </label>
            );
          })}
        </section>
      ) : (
        <section role="tabpanel" className="mt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm leading-6 text-zinc-400">
            Leave a field empty to inherit the current workspace value. Your
            overrides never change official exchange-rate evidence or another
            user&apos;s decisions.
          </div>
          <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
            <CostDirection
              title="US → Brazil"
              subtitle="Acquire in USD and model the Brazilian exit in BRL."
              fields={usToBrazilFields}
              overrides={costOverrides}
              effectiveProfile={settings.workspaceCostProfile}
              onChange={(field, value) =>
                setCostOverrides((current) => ({ ...current, [field]: value }))
              }
            />
            <CostDirection
              title="Brazil → US"
              subtitle="Acquire in BRL and model the United States exit in USD."
              fields={brazilToUsFields}
              overrides={costOverrides}
              effectiveProfile={settings.workspaceCostProfile}
              onChange={(field, value) =>
                setCostOverrides((current) => ({ ...current, [field]: value }))
              }
            />
          </div>
          <label className="mt-4 block max-w-md rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs font-medium text-zinc-300">
            Maximum evidence age (hours)
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={costOverrides.maxEvidenceAgeHours ?? ""}
              placeholder={effectiveValue(
                settings.workspaceCostProfile,
                "maxEvidenceAgeHours",
              )}
              onChange={(event) =>
                setCostOverrides((current) => ({
                  ...current,
                  maxEvidenceAgeHours:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                }))
              }
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-base text-white placeholder:text-zinc-600 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            />
          </label>
          <button
            type="button"
            onClick={() =>
              setCostOverrides(
                Object.fromEntries(
                  PERSONAL_COST_FIELDS.map((field) => [field, null]),
                ) as PersonalCostOverrides,
              )
            }
            className="mt-3 min-h-11 rounded-lg px-3 text-sm font-semibold text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            Use workspace defaults for every field
          </button>
        </section>
      )}

      <div className="sticky bottom-3 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 shadow-2xl shadow-black backdrop-blur [margin-bottom:max(.75rem,env(safe-area-inset-bottom))]">
        <p
          role="status"
          aria-live="polite"
          className={`min-w-0 flex-1 text-sm ${message.includes("saved") ? "text-emerald-300" : "text-zinc-400"}`}
        >
          {message || (dirty ? "Unsaved changes" : "Settings are up to date")}
        </p>
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={() => void save()}
          className="min-h-11 rounded-lg bg-cyan-300 px-5 text-sm font-semibold text-zinc-950 hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save my settings"}
        </button>
      </div>
    </div>
  );
}
