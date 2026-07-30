"use client";

import { useEffect, useState } from "react";
import type { RegionalCostProfile } from "@/lib/regional/domain";

const empty: RegionalCostProfile = {
  brlPerUsd: null,
  fxObservedAt: null,
  fxSource: null,
  usToBrazilFixedBrl: null,
  usToBrazilPercent: null,
  brazilToUsFixedUsd: null,
  brazilToUsPercent: null,
  updatedAt: null,
};
const number = (value: string) => (value.trim() === "" ? null : Number(value));

export default function RegionalCostProfileSettings() {
  const [profile, setProfile] = useState(empty);
  const [message, setMessage] = useState("Loading…");
  useEffect(() => {
    void fetch("/api/regional/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error("Regional profile unavailable.");
        return r.json();
      })
      .then((b: { profile: RegionalCostProfile }) => {
        setProfile(b.profile);
        setMessage("");
      })
      .catch((e) =>
        setMessage(
          e instanceof Error ? e.message : "Regional profile unavailable.",
        ),
      );
  }, []);
  const field = (
    key: keyof RegionalCostProfile,
    label: string,
    step = "0.01",
  ) => (
    <label className="text-xs text-zinc-400">
      {label}
      <input
        type="number"
        min="0"
        step={step}
        value={profile[key] === null ? "" : String(profile[key])}
        onChange={(e) =>
          setProfile((p) => ({ ...p, [key]: number(e.target.value) }))
        }
        className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
      />
    </label>
  );
  async function save() {
    setMessage("Saving…");
    const response = await fetch("/api/regional/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    const body = (await response.json()) as {
      profile?: RegionalCostProfile;
      error?: string;
    };
    if (!response.ok || !body.profile) {
      setMessage(body.error ?? "Could not save regional profile.");
      return;
    }
    setProfile(body.profile);
    setMessage("Regional economics saved.");
  }
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      <h2 className="text-lg font-semibold text-white">Regional economics</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Timestamped FX and direction-specific costs. Empty inputs keep arbitrage
        indicative.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {field("brlPerUsd", "BRL per USD", "0.0001")}
        <label className="text-xs text-zinc-400">
          FX observed at
          <input
            type="datetime-local"
            value={profile.fxObservedAt?.slice(0, 16) ?? ""}
            onChange={(e) =>
              setProfile((p) => ({
                ...p,
                fxObservedAt: e.target.value
                  ? new Date(e.target.value).toISOString()
                  : null,
              }))
            }
            className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
          />
        </label>
        <label className="text-xs text-zinc-400">
          FX source label
          <input
            value={profile.fxSource ?? ""}
            onChange={(e) =>
              setProfile((p) => ({ ...p, fxSource: e.target.value || null }))
            }
            className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
          />
        </label>
        {field("usToBrazilFixedBrl", "US → Brazil fixed cost (BRL)")}
        {field("usToBrazilPercent", "US → Brazil variable cost (%)")}
        {field("brazilToUsFixedUsd", "Brazil → US fixed cost (USD)")}
        {field("brazilToUsPercent", "Brazil → US variable cost (%)")}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          className="min-h-11 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-zinc-950"
        >
          Save regional economics
        </button>
        <p role="status" className="text-xs text-zinc-400">
          {message}
        </p>
      </div>
    </section>
  );
}
