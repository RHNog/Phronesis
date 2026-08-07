"use client";

import { useEffect, useId, useMemo, useState } from "react";
import {
  MARKET_HISTORY_RANGES,
  type MarketHistoryProvider,
  type MarketHistoryRange,
  type MarketHistoryResponse,
  type MarketHistorySeries,
} from "@/lib/market/history";
import type { MarketProviderId } from "@/lib/market/providers";
import type { PricingCondition } from "@/lib/pricing/types";

const providerColor: Record<MarketProviderId, string> = {
  tcgplayer: "#67e8f9",
  ligamagic: "#6ee7b7",
  ligapokemon: "#6ee7b7",
  pricecharting: "#c4b5fd",
};

function money(valueMinor: number, currency: "USD" | "BRL") {
  return new Intl.NumberFormat(currency === "BRL" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(valueMinor / 100);
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "2-digit",
  }).format(new Date(value.includes("T") ? value : `${value}T00:00:00Z`));
}

function chartPath(series: MarketHistorySeries) {
  const width = 320;
  const height = 144;
  const paddingX = 14;
  const paddingY = 18;
  const points = series.points;
  if (points.length < 2) return null;
  const times = points.map((point) => Date.parse(point.observedAt));
  const values = points.map((point) => point.valueMinor);
  const minimumTime = Math.min(...times);
  const maximumTime = Math.max(...times);
  const minimumValue = Math.min(...values);
  const maximumValue = Math.max(...values);
  const timeSpan = maximumTime - minimumTime || 1;
  const valueSpan = maximumValue - minimumValue || 1;
  return points
    .map((point, index) => {
      const x =
        paddingX +
        ((Date.parse(point.observedAt) - minimumTime) / timeSpan) *
          (width - paddingX * 2);
      const y =
        height -
        paddingY -
        ((point.valueMinor - minimumValue) / valueSpan) *
          (height - paddingY * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function preferredSeries(provider: MarketHistoryProvider) {
  const priorities: Record<MarketProviderId, string[]> = {
    tcgplayer: ["direct-low", "market", "delivered-low"],
    ligamagic: ["consumer-average", "consumer-low", "store-buy-high"],
    ligapokemon: ["consumer-average", "consumer-low", "store-buy-high"],
    pricecharting: ["ungraded", "psa-10", "grade-9"],
  };
  return (
    priorities[provider.id]
      .map((id) => provider.series.find((series) => series.id === id))
      .find(Boolean) ?? provider.series[0]
  );
}

export default function ProviderPriceHistory({
  categoryId,
  sku,
  condition,
  enabledProviderIds,
  providerFilter,
  heading = "Price movement",
}: {
  categoryId: string;
  sku: string;
  condition: PricingCondition;
  enabledProviderIds: readonly MarketProviderId[];
  providerFilter?: readonly MarketProviderId[];
  heading?: string;
}) {
  const headingId = useId();
  const [range, setRange] = useState<MarketHistoryRange>("30D");
  const requestKey = `${categoryId}:${sku}:${condition}:${range}`;
  const [historyRequest, setHistoryRequest] = useState<{
    key: string;
    response?: MarketHistoryResponse;
    error: string;
  }>({ key: "", error: "" });
  const [providerId, setProviderId] = useState<MarketProviderId>();
  const [seriesId, setSeriesId] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();
    const parameters = new URLSearchParams({
      category: categoryId,
      sku,
      condition,
      range,
    });
    void fetch(`/api/market/history?${parameters}`, {
      signal: controller.signal,
    })
      .then(async (result) => {
        const body = (await result.json()) as MarketHistoryResponse & {
          error?: string;
        };
        if (!result.ok)
          throw new Error(body.error ?? "Price history is unavailable.");
        setHistoryRequest({ key: requestKey, response: body, error: "" });
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
        setHistoryRequest({
          key: requestKey,
          error:
            caught instanceof Error
              ? caught.message
              : "Price history is unavailable.",
        });
      });
    return () => controller.abort();
  }, [categoryId, sku, condition, range, requestKey]);

  const loading = historyRequest.key !== requestKey;
  const response = loading ? undefined : historyRequest.response;
  const error = loading ? "" : historyRequest.error;

  const providers = useMemo(() => {
    const allowed = new Set(enabledProviderIds);
    const filtered = providerFilter ? new Set(providerFilter) : null;
    return (response?.providers ?? []).filter(
      (provider) =>
        allowed.has(provider.id) && (!filtered || filtered.has(provider.id)),
    );
  }, [enabledProviderIds, providerFilter, response]);

  const provider =
    providers.find((candidate) => candidate.id === providerId) ?? providers[0];
  const series =
    provider?.series.find((candidate) => candidate.id === seriesId) ??
    (provider ? preferredSeries(provider) : undefined);
  const first = series?.points[0];
  const latest = series?.points.at(-1);
  const percentage =
    first && latest && first.valueMinor > 0 && first !== latest
      ? ((latest.valueMinor - first.valueMinor) / first.valueMinor) * 100
      : null;
  const path = series ? chartPath(series) : null;
  const color = provider ? providerColor[provider.id] : "#67e8f9";

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Retained provider evidence
          </p>
          <h4
            id={headingId}
            className="mt-1 text-sm font-semibold text-white"
          >
            {heading}
          </h4>
        </div>
        <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[11px] text-zinc-400">
          Local history only
        </span>
      </div>

      <div
        aria-label="History range"
        className="mt-4 grid grid-cols-4 gap-2"
        role="group"
      >
        {MARKET_HISTORY_RANGES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-pressed={range === candidate}
            onClick={() => setRange(candidate)}
            className={`min-h-11 rounded-lg border px-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
              range === candidate
                ? "border-cyan-300 bg-cyan-300 text-zinc-950"
                : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
            }`}
          >
            {candidate}
          </button>
        ))}
      </div>

      {providers.length > 1 ? (
        <div
          aria-label="History provider"
          className="mt-3 grid gap-2 sm:grid-cols-2"
          role="group"
        >
          {providers.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              aria-pressed={provider?.id === candidate.id}
              onClick={() => {
                setProviderId(candidate.id);
                setSeriesId(undefined);
              }}
              className={`min-h-11 rounded-lg border px-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-300 ${
                provider?.id === candidate.id
                  ? "border-white/50 bg-zinc-800 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
              }`}
            >
              {candidate.label}
            </button>
          ))}
        </div>
      ) : null}

      {provider && provider.series.length > 1 ? (
        <label className="mt-3 block text-xs font-medium text-zinc-400">
          Price series
          <select
            value={series?.id ?? ""}
            onChange={(event) => setSeriesId(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-sm text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            {provider.series.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {loading ? (
        <p role="status" className="mt-4 text-sm text-zinc-400">
          Loading retained observations…
        </p>
      ) : error ? (
        <p role="alert" className="mt-4 text-sm text-red-200">
          {error}
        </p>
      ) : !provider || !series || !latest ? (
        <p className="mt-4 rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">
          No observations in this range.
        </p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-500">
                {provider.label} · {series.label} · {provider.currency}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                {money(latest.valueMinor, provider.currency)}
              </p>
            </div>
            <p className="text-right text-xs text-zinc-400">
              {percentage === null
                ? "History begins here"
                : `${percentage >= 0 ? "Up" : "Down"} ${Math.abs(percentage).toFixed(1)}%`}
              <span className="mt-1 block text-zinc-600">
                {series.points.length} observation
                {series.points.length === 1 ? "" : "s"}
              </span>
            </p>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/60 p-2">
            <svg
              viewBox="0 0 320 144"
              className="h-auto w-full"
              role="img"
              aria-label={`${provider.label} ${series.label} history from ${shortDate(first?.observedAt ?? latest.observedAt)} to ${shortDate(latest.observedAt)}`}
            >
              <line x1="14" y1="126" x2="306" y2="126" stroke="#3f3f46" />
              {path ? (
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <circle cx="160" cy="72" r="6" fill={color} />
              )}
            </svg>
          </div>
          <div className="mt-2 flex justify-between gap-3 text-[11px] text-zinc-600">
            <span>{shortDate(first?.observedAt ?? latest.observedAt)}</span>
            <span>{shortDate(latest.observedAt)}</span>
          </div>
          {latest.matchQuality === "COMPATIBLE" ? (
            <p className="mt-3 text-xs text-amber-200">
              Latest Liga point is comparison evidence from a compatible
              equivalent, not an exact special-release identity.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
