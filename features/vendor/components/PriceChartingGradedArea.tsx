"use client";

import { useEffect, useState } from "react";
import GradingCertificateLookup from "@/features/vendor/components/GradingCertificateLookup";
import type { SearchMatch } from "@/lib/pricing/types";
import type { PriceChartingEvidence } from "@/lib/providers/pricecharting/PriceChartingClient";

function money(cents: number | null) {
  return cents === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cents / 100);
}

export default function PriceChartingGradedArea({
  match,
}: {
  match: SearchMatch;
}) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState("IDLE");
  const [evidence, setEvidence] = useState<PriceChartingEvidence[]>([]);
  const [error, setError] = useState("");
  const [evidenceSource, setEvidenceSource] = useState<
    "IMPORTED" | "LIVE" | "NONE"
  >("NONE");

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    const parameters = new URLSearchParams({
      name: match.name,
      set: match.setName,
      number: match.collectorNumber ?? "",
      category: match.categoryId,
      sku: match.sku,
    });
    void fetch(`/api/market/pricecharting?${parameters}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = (await response.json()) as {
          status?: string;
          evidence?: PriceChartingEvidence[];
          evidenceSource?: "IMPORTED" | "LIVE" | "NONE";
          error?: string;
        };
        if (!response.ok)
          throw new Error(body.error ?? "PriceCharting lookup failed.");
        setStatus(body.status ?? "NO_MATCH");
        setEvidence(body.evidence ?? []);
        setEvidenceSource(body.evidenceSource ?? "NONE");
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError")
          return;
        setError(caught instanceof Error ? caught.message : "Lookup failed.");
        setStatus("ERROR");
      });
    return () => controller.abort();
  }, [
    expanded,
    match.categoryId,
    match.sku,
    match.name,
    match.setName,
    match.collectorNumber,
  ]);

  return (
    <details
      data-grading-disclosure
      className="mt-3 rounded-xl border border-violet-900/70 bg-violet-950/20"
      onToggle={(event) => {
        const nextExpanded = event.currentTarget.open;
        if (nextExpanded) {
          setStatus("LOADING");
          setEvidence([]);
          setEvidenceSource("NONE");
          setError("");
        }
        setExpanded(nextExpanded);
      }}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-300">
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
            Optional evidence
          </span>
          <span className="mt-1 block text-sm font-semibold text-white">
            Grading information
          </span>
        </span>
        <span className="shrink-0 text-xs font-medium text-violet-200">
          {expanded ? "Collapse" : "Expand"}
        </span>
      </summary>
      {expanded ? (
        <div className="border-t border-violet-900/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-300">
                PriceCharting
              </p>
              <h3 className="mt-1 text-sm font-semibold text-white">
                Graded price guide
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">
              {evidenceSource === "IMPORTED"
                ? "Imported daily guide"
                : evidenceSource === "LIVE"
                  ? "Live verification"
                  : "Current guide"}
            </span>
          </div>
          {status === "LOADING" ? (
            <p className="mt-3 text-sm text-zinc-400">
              Loading graded evidence…
            </p>
          ) : null}
          {status === "NOT_CONFIGURED" ? (
            <p className="mt-3 text-sm text-amber-200">
              Configure PriceCharting in Settings to load graded values here.
            </p>
          ) : null}
          {status === "NO_MATCH" ? (
            <p className="mt-3 text-sm text-zinc-400">
              No sufficiently specific provider candidate was found. Phronesis
              did not infer a match.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          {evidence.map((item) => (
            <details
              key={item.id}
              className="mt-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3"
              open={evidence.length === 1}
            >
              <summary className="cursor-pointer text-sm font-semibold text-zinc-100">
                {item.productName}{" "}
                <span className="font-normal text-zinc-500">
                  · {item.catalogueName}
                </span>
              </summary>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {Object.entries(item.prices).map(([grade, value]) => (
                  <div key={grade} className="rounded-md bg-zinc-900 p-2">
                    <p className="text-[10px] text-zinc-500">{grade}</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums text-violet-200">
                      {money(value)}
                    </p>
                  </div>
                ))}
              </div>
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-violet-300"
              >
                Verify on PriceCharting ↗
              </a>
            </details>
          ))}
          <p className="mt-3 text-[11px] leading-5 text-zinc-500">
            Candidate evidence remains separate until set, number, and variation
            are verified. It never overwrites TCGplayer or Liga raw-card pricing.
          </p>
          <GradingCertificateLookup embedded />
        </div>
      ) : null}
    </details>
  );
}
