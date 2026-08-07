"use client";

import { useEffect, useState } from "react";
import type { RegionalMarketEvidence } from "@/lib/regional/domain";

function brl(centavos: number | null): string {
  if (centavos === null) return "Unavailable";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

function providerLabel(categoryId: string): "LigaMagic" | "LigaPokémon" {
  return categoryId === "pokemon-en" ? "LigaPokémon" : "LigaMagic";
}

export default function RegionalMarketPanel({
  categoryId,
  sku,
}: {
  categoryId: string;
  sku: string;
}) {
  const [evidence, setEvidence] = useState<
    RegionalMarketEvidence | null | undefined
  >(undefined);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      `/api/regional/evidence?categoryId=${encodeURIComponent(categoryId)}&sku=${encodeURIComponent(sku)}`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Regional evidence unavailable.");
        const body = (await response.json()) as {
          evidence: RegionalMarketEvidence | null;
        };
        setEvidence(body.evidence);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === "AbortError"))
          setEvidence(null);
      });
    return () => controller.abort();
  }, [categoryId, sku]);

  if (evidence === undefined)
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-500">
        Loading {providerLabel(categoryId)} evidence…
      </section>
    );
  if (!evidence)
    return (
      <section className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/70 p-4">
        <p className="text-sm font-semibold text-zinc-300">
          {providerLabel(categoryId)} evidence not reconciled
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          This exact printing remains unmatched or quarantined. Phronesis will
          not substitute another variation.
        </p>
      </section>
    );
  return (
    <section
      aria-label="Brazil market evidence"
      className="rounded-xl border border-emerald-900 bg-emerald-950/20 p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
            {evidence.providerLabel} · exact match
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Observed {new Date(evidence.observedAt).toLocaleString()}
          </p>
          <p className="mt-1 break-all font-mono text-[10px] text-zinc-600">
            Snapshot {evidence.sourceRunId}
          </p>
        </div>
        <span className="rounded bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300">
          {evidence.editionCode} · #{evidence.collectorNumber} ·{" "}
          {evidence.variant}
        </span>
      </div>
      {evidence.condition || evidence.language ? (
        <p className="mt-3 text-xs text-zinc-500">
          Source material: {evidence.condition ?? "Condition not supplied"} ·{" "}
          {evidence.language ?? "Language not supplied"}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <div className="rounded-lg bg-zinc-950 p-3">
          <p className="text-xs text-zinc-500">Retail evidence (Compra)</p>
          <p className="mt-1 text-xl font-semibold text-white">
            {brl(evidence.consumerAverageCentavos)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Low {brl(evidence.consumerLowCentavos)} · High{" "}
            {brl(evidence.consumerHighCentavos)}
          </p>
        </div>
        <div className="rounded-lg bg-zinc-950 p-3">
          <p className="text-xs text-zinc-500">Dealer-buy benchmark (Venda)</p>
          <p className="mt-1 text-xl font-semibold text-cyan-200">
            {brl(
              evidence.storeBuyHighCentavos ?? evidence.storeBuyAverageCentavos,
            )}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Benchmark only — verify a real offer.
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="rounded bg-zinc-950 p-2">
          <p className="text-zinc-500">Quick sale</p>
          <p className="mt-1 font-semibold text-zinc-100">
            {brl(evidence.consumerLowCentavos)}
          </p>
        </div>
        <div className="rounded bg-zinc-950 p-2">
          <p className="text-zinc-500">Market</p>
          <p className="mt-1 font-semibold text-emerald-200">
            {brl(evidence.consumerAverageCentavos)}
          </p>
        </div>
        <div className="rounded bg-zinc-950 p-2">
          <p className="text-zinc-500">Patient</p>
          <p className="mt-1 font-semibold text-zinc-100">
            {brl(evidence.consumerHighCentavos)}
          </p>
        </div>
      </div>
    </section>
  );
}
