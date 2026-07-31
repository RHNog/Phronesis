"use client";

import { useEffect, useState } from "react";

type ProviderState = {
  configured: boolean;
  enabled: boolean;
  providerId: string;
  status: string;
};

const PROVIDERS = [
  {
    id: "justtcg",
    label: "JustTCG",
    purpose: "Variant estimates and price history",
    keys: "JUSTTCG_API_KEY",
    enable: "PHRONESIS_JUSTTCG_WATCH_ENRICHMENT=ENABLED",
  },
  {
    id: "ebay-browse",
    label: "eBay Browse",
    purpose: "Current fixed-price listings",
    keys: "EBAY_CLIENT_ID + EBAY_CLIENT_SECRET",
    enable: "Enabled automatically when credentials are present",
  },
  {
    id: "cardtrader",
    label: "CardTrader",
    purpose: "Current marketplace products",
    keys: "CARDTRADER_API_TOKEN",
    enable: "Enabled automatically when credentials are present",
  },
] as const;

export default function ProviderConnections({ secureRegistrationReady }: { secureRegistrationReady: boolean }) {
  const [states, setStates] = useState<ProviderState[]>([]);

  useEffect(() => {
    let current = true;
    void fetch("/api/market/provider-health")
      .then((response) => response.json())
      .then((body: { providers?: ProviderState[] }) => {
        if (current) setStates(body.providers ?? []);
      })
      .catch(() => {
        if (current) setStates([]);
      });
    return () => { current = false; };
  }, []);

  return (
    <section aria-labelledby="provider-connections-title" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Market data</p>
          <h3 id="provider-connections-title" className="mt-2 text-xl font-semibold text-white">Provider connections</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Register, enable, and audit market providers here. Secret entry remains locked until secure owner login is active.</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${secureRegistrationReady ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-200"}`}>
          {secureRegistrationReady ? "Secure registration ready" : "Registration locked"}
        </span>
      </div>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {PROVIDERS.map((provider) => {
          const state = states.find((candidate) => candidate.providerId === provider.id);
          const status = state?.status ?? "CHECKING";
          return (
            <article key={provider.id} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-semibold text-zinc-100">{provider.label}</h4>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{provider.purpose}</p>
                </div>
                <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">{status.replaceAll("_", " ")}</span>
              </div>
              <dl className="mt-4 space-y-2 text-xs">
                <div><dt className="text-zinc-500">Registration</dt><dd className="mt-1 break-all font-mono text-zinc-300">{provider.keys}</dd></div>
                <div><dt className="text-zinc-500">Activation</dt><dd className="mt-1 break-words text-zinc-300">{provider.enable}</dd></div>
              </dl>
            </article>
          );
        })}
      </div>
      {!secureRegistrationReady ? (
        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm leading-6 text-amber-100">Complete the Employee login readiness checklist below first. Until then, provider secrets stay server-only in <code>.env.local</code> and are never exposed to this page.</p>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">The authenticated credential-vault form is the next provider slice; current credentials remain environment-backed and secret-free in this status view.</p>
      )}
    </section>
  );
}
