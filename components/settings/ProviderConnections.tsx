"use client";

import { useEffect, useState } from "react";

type ProviderState = {
  configured: boolean;
  creditsUsed?: number;
  dailyBudget?: number;
  enabled: boolean;
  nextRelease?: string | null;
  productsResolved?: number;
  productsStored?: number;
  providerId: string;
  status: string;
  bulkImport?: { activeReceiptId: number | null; latestReceiptId: number | null; importedAt: string | null; sourceRows: number; reviewRequired: number; status: string };
};

type CredentialState = { providerId: string; fields: Array<{ field: string; configured: boolean }> };

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
  {
    id: "pkmnprices-sealed",
    label: "PkmnPrices Sealed",
    purpose: "Newest-release Pokémon sealed identities and artwork",
    keys: "PKMNPRICES_API_KEY",
    enable: "100 sealed credits per UTC day · Pro/Business sealed access required",
  },
  {
    id: "psa-certificates",
    label: "PSA Certificates",
    purpose: "Official in-Phronesis slab certificate verification",
    keys: "PSA_API_TOKEN",
    enable: "Enabled automatically when the official PSA bearer token is present",
  },
  {
    id: "pricecharting",
    label: "PriceCharting",
    purpose: "Ungraded and graded card price guide evidence",
    keys: "PRICECHARTING_API_TOKEN",
    enable: "Paid PriceCharting API subscription required · one request per second maximum",
  },
] as const;

export default function ProviderConnections({ secureRegistrationReady }: { secureRegistrationReady: boolean }) {
  const [states, setStates] = useState<ProviderState[]>([]);
  const [credentials, setCredentials] = useState<CredentialState[]>([]);
  const [openProvider, setOpenProvider] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [message, setMessage] = useState("");

  async function refreshCredentials() {
    if (!secureRegistrationReady) return;
    const response = await fetch("/api/administration/provider-credentials");
    if (!response.ok) return;
    const body = await response.json() as { providers?: CredentialState[] };
    setCredentials(body.providers ?? []);
  }

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

  useEffect(() => {
    if (!secureRegistrationReady) return;
    let current = true;
    void fetch("/api/administration/provider-credentials")
      .then((response) => response.ok ? response.json() : null)
      .then((body: { providers?: CredentialState[] } | null) => { if (current && body) setCredentials(body.providers ?? []); });
    return () => { current = false; };
  }, [secureRegistrationReady]);

  async function save(providerId: string) {
    setMessage("Saving securely…");
    const response = await fetch("/api/administration/provider-credentials", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ providerId, values: drafts[providerId] ?? {} }) });
    const body = await response.json() as { error?: string };
    if (!response.ok) return setMessage(body.error ?? "Credential registration failed.");
    setDrafts((current) => ({ ...current, [providerId]: {} }));
    setMessage("Credentials saved. Secret values are no longer displayed.");
    await refreshCredentials();
    window.location.reload();
  }

  async function remove(providerId: string) {
    if (!window.confirm("Remove this provider's stored credentials?")) return;
    const response = await fetch(`/api/administration/provider-credentials?providerId=${encodeURIComponent(providerId)}`, { method: "DELETE" });
    setMessage(response.ok ? "Stored credentials removed." : "Credentials could not be removed.");
    await refreshCredentials();
  }

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
      <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
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
                {provider.id === "pkmnprices-sealed" ? (
                  <>
                    <div><dt className="text-zinc-500">Today</dt><dd className="mt-1 text-zinc-300">{state?.creditsUsed ?? 0} / {state?.dailyBudget ?? 100} sealed credits</dd></div>
                    <div><dt className="text-zinc-500">Local coverage</dt><dd className="mt-1 text-zinc-300">{state?.productsResolved ?? 0} exact matches · {state?.productsStored ?? 0} records</dd></div>
                    {state?.nextRelease ? <div><dt className="text-zinc-500">Next release</dt><dd className="mt-1 text-zinc-300">{state.nextRelease}</dd></div> : null}
                  </>
                ) : null}
                {provider.id === "pricecharting" && state?.bulkImport ? (
                  <>
                    <div><dt className="text-zinc-500">Bulk evidence</dt><dd className="mt-1 text-zinc-300">{state.bulkImport.status.replaceAll("_", " ")} · {state.bulkImport.sourceRows.toLocaleString()} source rows</dd></div>
                    <div><dt className="text-zinc-500">Identity review</dt><dd className="mt-1 text-zinc-300">{state.bulkImport.reviewRequired.toLocaleString()} records require review</dd></div>
                    {state.bulkImport.importedAt ? <div><dt className="text-zinc-500">Last activated</dt><dd className="mt-1 text-zinc-300">{new Date(state.bulkImport.importedAt).toLocaleString()}</dd></div> : null}
                  </>
                ) : null}
              </dl>
              {secureRegistrationReady ? (
                <div className="mt-4 border-t border-zinc-800 pt-4">
                  <button type="button" aria-expanded={openProvider === provider.id} onClick={() => setOpenProvider((current) => current === provider.id ? null : provider.id)} className="min-h-11 w-full rounded-lg border border-cyan-800 px-3 text-sm font-semibold text-cyan-200 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300">
                    {openProvider === provider.id ? "Close setup" : "Configure provider"}
                  </button>
                  {openProvider === provider.id ? (
                    <div className="mt-3 space-y-3">
                      {provider.keys.split(" + ").map((field) => {
                        const configured = credentials.find((item) => item.providerId === provider.id)?.fields.find((item) => item.field === field)?.configured;
                        return <label key={field} className="block text-xs font-medium text-zinc-300">{field}{configured ? " · configured" : ""}<input type="password" autoComplete="off" value={drafts[provider.id]?.[field] ?? ""} onChange={(event) => setDrafts((current) => ({ ...current, [provider.id]: { ...current[provider.id], [field]: event.target.value } }))} placeholder={configured ? "Enter a replacement value" : "Paste secret value"} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300" /></label>;
                      })}
                      <div className="flex gap-2"><button type="button" onClick={() => void save(provider.id)} disabled={!Object.values(drafts[provider.id] ?? {}).some((value) => value.trim())} className="min-h-11 flex-1 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-zinc-950 disabled:opacity-40">Save securely</button><button type="button" onClick={() => void remove(provider.id)} className="min-h-11 rounded-lg border border-red-900 px-3 text-sm text-red-200">Remove</button></div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      {!secureRegistrationReady ? (
        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm leading-6 text-amber-100">Complete the Employee login readiness checklist below first. Until then, provider secrets stay server-only in <code>.env.local</code> and are never exposed to this page.</p>
      ) : (
        <p className="mt-4 text-sm text-zinc-400">Open any provider card to register or replace its encrypted server-side credentials. Stored values are never returned to this page.</p>
      )}
      {message ? <p role="status" className="mt-3 text-sm text-cyan-200">{message}</p> : null}
    </section>
  );
}
