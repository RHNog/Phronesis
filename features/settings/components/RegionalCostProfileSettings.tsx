"use client";

import { useEffect, useState } from "react";
import type { RegionalCostProfile } from "@/lib/regional/domain";

const empty: RegionalCostProfile = {
  brlPerUsd: null,
  brlPerUsdBuy: null,
  brlPerUsdSell: null,
  fxObservedAt: null,
  fxFetchedAt: null,
  fxLastAttemptAt: null,
  fxSource: null,
  fxLastError: null,
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
  async function refreshFx() {
    setMessage("Checking Banco Central do Brasil…");
    const response = await fetch("/api/regional/profile", { method: "POST" });
    const body = (await response.json()) as {
      profile?: RegionalCostProfile;
      error?: string;
    };
    if (!response.ok || !body.profile) {
      setMessage(body.error ?? "Official FX could not be refreshed.");
      return;
    }
    setProfile(body.profile);
    setMessage(
      body.profile.fxLastError
        ? body.profile.fxLastError
        : "Official PTAX closing rate refreshed.",
    );
  }
  const formatRate = (value: number | null) =>
    value === null
      ? "Unavailable"
      : `R$ ${new Intl.NumberFormat("pt-BR", {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        }).format(value)}`;
  const formatTime = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(value))
      : "Not yet available";
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
      <h2 className="text-lg font-semibold text-white">Regional economics</h2>
      <p className="mt-2 text-sm text-zinc-400">
        Official BCB PTAX exchange evidence and direction-specific operating
        costs. Empty cost inputs keep arbitrage indicative.
      </p>
      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
              Official PTAX closing bulletin
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {profile.fxSource ?? "Banco Central quote not loaded"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshFx()}
            className="min-h-11 rounded-lg border border-cyan-700 px-4 text-sm font-semibold text-cyan-200"
          >
            Refresh official FX
          </button>
        </div>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">BCB buy</dt>
            <dd className="mt-1 text-lg font-semibold text-white">
              {formatRate(profile.brlPerUsdBuy)}
            </dd>
            <p className="text-xs text-zinc-500">Brazil → US costing</p>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">BCB sell</dt>
            <dd className="mt-1 text-lg font-semibold text-white">
              {formatRate(profile.brlPerUsdSell)}
            </dd>
            <p className="text-xs text-zinc-500">US → Brazil costing</p>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Official observation</dt>
            <dd className="mt-1 text-sm text-zinc-200">
              {formatTime(profile.fxObservedAt)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Last checked</dt>
            <dd className="mt-1 text-sm text-zinc-200">
              {formatTime(profile.fxLastAttemptAt)}
            </dd>
          </div>
        </dl>
        {profile.fxLastError ? (
          <p className="mt-3 rounded-lg border border-amber-900/80 bg-amber-950/40 p-3 text-xs text-amber-200">
            {profile.fxLastError} Last-good official values are retained.
          </p>
        ) : null}
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
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
