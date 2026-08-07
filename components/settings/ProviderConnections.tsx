"use client";

import { useEffect, useState } from "react";

type AcquisitionState = {
  lastCompletedAt: string | null;
  localDate: string | null;
  message: string;
  promotionStatus: "SUCCESS" | "FAILED" | "NOT_APPLICABLE";
  schedule: string;
  snapshotRunId: string | null;
};

type ProviderState = {
  acquisition?: AcquisitionState;
  bulkImports?: Array<{
    activeReceiptId: number | null;
    gameProfile: string;
    importedAt: string | null;
    latestReceiptId: number | null;
    reviewRequired: number;
    sourceRows: number;
    status: string;
  }>;
  configured: boolean;
  creditsUsed?: number;
  dailyBudget?: number;
  enabled: boolean;
  nextRelease?: string | null;
  productsResolved?: number;
  productsStored?: number;
  providerId: string;
  status: string;
};

type CredentialState = {
  fields: Array<{ configured: boolean; field: string }>;
  providerId: string;
};

type ProviderGroupId = "regional" | "market" | "specialized";

type ProviderDefinition = {
  activation: string;
  credentialFields?: readonly string[];
  group: ProviderGroupId;
  id: string;
  label: string;
  managedAcquisition?: boolean;
  purpose: string;
  registration: string;
};

const PROVIDER_GROUPS: ReadonlyArray<{
  description: string;
  id: ProviderGroupId;
  label: string;
}> = [
  {
    id: "regional",
    label: "Regional marketplaces",
    description: "Owner-authenticated Liga acquisition, snapshots, and regional promotion.",
  },
  {
    id: "market",
    label: "Market and valuation feeds",
    description: "Pricing, history, and active-listing evidence used by Phronesis decisions.",
  },
  {
    id: "specialized",
    label: "Specialized services",
    description: "Focused sealed-product and grading evidence services.",
  },
];

const PROVIDERS: readonly ProviderDefinition[] = [
  {
    id: "ligamagic",
    label: "LigaMagic",
    purpose: "Brazilian Magic collection exports and regional price evidence",
    group: "regional",
    registration: "Isolated owner-authenticated browser profile",
    activation: "Repository-managed daily acquisition",
    managedAcquisition: true,
  },
  {
    id: "ligapokemon",
    label: "LigaPokémon",
    purpose: "Brazilian Pokémon collection exports and regional price evidence",
    group: "regional",
    registration: "Isolated owner-authenticated browser profile",
    activation: "Repository-managed daily acquisition",
    managedAcquisition: true,
  },
  {
    id: "justtcg",
    label: "JustTCG",
    purpose: "Variant estimates and price history",
    group: "market",
    registration: "JUSTTCG_API_KEY",
    activation: "PHRONESIS_JUSTTCG_WATCH_ENRICHMENT=ENABLED",
    credentialFields: ["JUSTTCG_API_KEY"],
  },
  {
    id: "pricecharting",
    label: "PriceCharting",
    purpose: "Daily Magic and One Piece ungraded/graded snapshot evidence",
    group: "market",
    registration: "PRICECHARTING_API_TOKEN + PRICECHARTING_MAGIC_CSV_URL + PRICECHARTING_ONEPIECE_CSV_URL",
    activation: "Encrypted subscription downloads · daily sync · requests spaced by 10 minutes",
    credentialFields: [
      "PRICECHARTING_API_TOKEN",
      "PRICECHARTING_MAGIC_CSV_URL",
      "PRICECHARTING_ONEPIECE_CSV_URL",
    ],
  },
  {
    id: "ebay-browse",
    label: "eBay Browse",
    purpose: "Current fixed-price listings",
    group: "market",
    registration: "EBAY_CLIENT_ID + EBAY_CLIENT_SECRET",
    activation: "Enabled automatically when credentials are present",
    credentialFields: ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"],
  },
  {
    id: "cardtrader",
    label: "CardTrader",
    purpose: "Current marketplace products",
    group: "market",
    registration: "CARDTRADER_API_TOKEN",
    activation: "Enabled automatically when credentials are present",
    credentialFields: ["CARDTRADER_API_TOKEN"],
  },
  {
    id: "pkmnprices-sealed",
    label: "PkmnPrices Sealed",
    purpose: "Newest-release Pokémon sealed identities and artwork",
    group: "specialized",
    registration: "PKMNPRICES_API_KEY",
    activation: "100 sealed credits per UTC day · Pro/Business sealed access required",
    credentialFields: ["PKMNPRICES_API_KEY"],
  },
  {
    id: "psa-certificates",
    label: "PSA Certificates",
    purpose: "Official in-Phronesis slab certificate verification",
    group: "specialized",
    registration: "PSA_API_TOKEN",
    activation: "Enabled automatically when the official PSA bearer token is present",
    credentialFields: ["PSA_API_TOKEN"],
  },
];

async function loadProviderHealth(): Promise<ProviderState[]> {
  const response = await fetch("/api/market/provider-health", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Provider health returned ${response.status}.`);
  const body = await response.json() as { providers?: ProviderState[] };
  return body.providers ?? [];
}

function formatTimestamp(value: string | null): string {
  if (!value) return "No completed run";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function statusTone(status: string): string {
  if (["CURRENT", "READY", "SUCCESS", "SKIPPED_SAME_DAY"].includes(status)) {
    return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  }
  if (["CHECKING", "DISABLED", "NEVER_RUN", "NOT_CONFIGURED", "RUNNING", "STAGED"].includes(status)) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  }
  return "border-red-400/30 bg-red-400/10 text-red-200";
}

export default function ProviderConnections({
  secureRegistrationReady,
}: {
  secureRegistrationReady: boolean;
}) {
  const [states, setStates] = useState<ProviderState[]>([]);
  const [healthLoaded, setHealthLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [healthMessage, setHealthMessage] = useState("Loading provider status…");
  const [credentials, setCredentials] = useState<CredentialState[]>([]);
  const [openProvider, setOpenProvider] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [credentialMessage, setCredentialMessage] = useState("");

  async function refreshCredentials() {
    if (!secureRegistrationReady) return;
    const response = await fetch("/api/administration/provider-credentials");
    if (!response.ok) return;
    const body = await response.json() as { providers?: CredentialState[] };
    setCredentials(body.providers ?? []);
  }

  useEffect(() => {
    let current = true;
    void loadProviderHealth()
      .then((providers) => {
        if (!current) return;
        setStates(providers);
        setHealthLoaded(true);
        setHealthMessage("Provider status loaded.");
      })
      .catch(() => {
        if (!current) return;
        setStates([]);
        setHealthLoaded(true);
        setHealthMessage("Provider status is temporarily unavailable.");
      });
    return () => { current = false; };
  }, []);

  useEffect(() => {
    if (!secureRegistrationReady) return;
    let current = true;
    void fetch("/api/administration/provider-credentials")
      .then((response) => response.ok ? response.json() : null)
      .then((body: { providers?: CredentialState[] } | null) => {
        if (current && body) setCredentials(body.providers ?? []);
      });
    return () => { current = false; };
  }, [secureRegistrationReady]);

  async function refreshStatus() {
    setRefreshing(true);
    setHealthMessage("Refreshing provider status…");
    try {
      setStates(await loadProviderHealth());
      setHealthLoaded(true);
      setHealthMessage(`Provider status refreshed at ${new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(new Date())}.`);
    } catch {
      setStates([]);
      setHealthLoaded(true);
      setHealthMessage("Provider status could not be refreshed.");
    } finally {
      setRefreshing(false);
    }
  }

  async function save(providerId: string) {
    setCredentialMessage("Saving securely…");
    const response = await fetch("/api/administration/provider-credentials", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId, values: drafts[providerId] ?? {} }),
    });
    const body = await response.json() as { error?: string };
    if (!response.ok) {
      setCredentialMessage(body.error ?? "Credential registration failed.");
      return;
    }
    setDrafts((current) => ({ ...current, [providerId]: {} }));
    setCredentialMessage("Credentials saved. Secret values are no longer displayed.");
    await refreshCredentials();
    window.location.reload();
  }

  async function remove(providerId: string) {
    if (!window.confirm("Remove this provider's stored credentials?")) return;
    const response = await fetch(`/api/administration/provider-credentials?providerId=${encodeURIComponent(providerId)}`, {
      method: "DELETE",
    });
    setCredentialMessage(response.ok ? "Stored credentials removed." : "Credentials could not be removed.");
    await refreshCredentials();
  }

  function providerCard(provider: ProviderDefinition) {
    const state = states.find((candidate) => candidate.providerId === provider.id);
    const status = state?.status ?? (healthLoaded ? "UNAVAILABLE" : "CHECKING");
    return (
      <article key={provider.id} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="font-semibold text-zinc-100">{provider.label}</h5>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusTone(status)}`}>
            {status.replaceAll("_", " ")}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-zinc-500">{provider.purpose}</p>
        <dl className="mt-4 space-y-2 text-xs">
          <div>
            <dt className="text-zinc-500">Registration</dt>
            <dd className={`mt-1 break-words text-zinc-300 ${provider.credentialFields ? "font-mono" : ""}`}>{provider.registration}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Activation</dt>
            <dd className="mt-1 break-words text-zinc-300">{provider.activation}</dd>
          </div>
          {provider.managedAcquisition ? (
            <>
              <div><dt className="text-zinc-500">Profile</dt><dd className="mt-1 text-zinc-300">{state?.configured ? "Configured" : "Not configured"}</dd></div>
              <div><dt className="text-zinc-500">Schedule</dt><dd className="mt-1 text-zinc-300">{state?.acquisition?.schedule ?? "Daily at 03:00 America/New_York"}</dd></div>
              <div><dt className="text-zinc-500">Last completed</dt><dd className="mt-1 text-zinc-300">{formatTimestamp(state?.acquisition?.lastCompletedAt ?? null)}</dd></div>
              <div><dt className="text-zinc-500">Snapshot</dt><dd className="mt-1 break-all font-mono text-zinc-300">{state?.acquisition?.snapshotRunId ?? "None recorded"}</dd></div>
              <div><dt className="text-zinc-500">Promotion</dt><dd className="mt-1 text-zinc-300">{state?.acquisition?.promotionStatus.replaceAll("_", " ") ?? "NOT APPLICABLE"}</dd></div>
            </>
          ) : null}
          {provider.id === "pkmnprices-sealed" ? (
            <>
              <div><dt className="text-zinc-500">Today</dt><dd className="mt-1 text-zinc-300">{state?.creditsUsed ?? 0} / {state?.dailyBudget ?? 100} sealed credits</dd></div>
              <div><dt className="text-zinc-500">Local coverage</dt><dd className="mt-1 text-zinc-300">{state?.productsResolved ?? 0} exact matches · {state?.productsStored ?? 0} records</dd></div>
              {state?.nextRelease ? <div><dt className="text-zinc-500">Next release</dt><dd className="mt-1 text-zinc-300">{state.nextRelease}</dd></div> : null}
            </>
          ) : null}
          {provider.id === "pricecharting" && state?.bulkImports?.length ? state.bulkImports.map((bulkImport) => (
            <div key={bulkImport.gameProfile}>
              <dt className="text-zinc-500">{bulkImport.gameProfile === "magic-en" ? "Magic" : bulkImport.gameProfile === "onepiece-en" ? "One Piece" : "Pokémon"} snapshot</dt>
              <dd className="mt-1 text-zinc-300">{bulkImport.status.replaceAll("_", " ")} · {bulkImport.sourceRows.toLocaleString()} rows · {bulkImport.reviewRequired.toLocaleString()} review</dd>
            </div>
          )) : null}
        </dl>
        {provider.managedAcquisition ? (
          <p className="mt-4 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs leading-5 text-zinc-300">
            {state?.acquisition?.message ?? "Loading the latest private acquisition receipt…"}
          </p>
        ) : null}
        {secureRegistrationReady && provider.credentialFields ? (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <button
              type="button"
              aria-expanded={openProvider === provider.id}
              onClick={() => setOpenProvider((current) => current === provider.id ? null : provider.id)}
              className="min-h-11 w-full rounded-lg border border-cyan-800 px-3 text-sm font-semibold text-cyan-200 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              {openProvider === provider.id ? "Close setup" : "Configure provider"}
            </button>
            {openProvider === provider.id ? (
              <div className="mt-3 space-y-3">
                {provider.credentialFields.map((field) => {
                  const configured = credentials.find((item) => item.providerId === provider.id)?.fields.find((item) => item.field === field)?.configured;
                  return (
                    <label key={field} className="block text-xs font-medium text-zinc-300">
                      {field}{configured ? " · configured" : ""}
                      <input
                        type="password"
                        autoComplete="off"
                        value={drafts[provider.id]?.[field] ?? ""}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [provider.id]: { ...current[provider.id], [field]: event.target.value },
                        }))}
                        placeholder={configured ? "Enter a replacement value" : "Paste secret value"}
                        className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                      />
                    </label>
                  );
                })}
                <div className="flex gap-2">
                  <button type="button" onClick={() => void save(provider.id)} disabled={!Object.values(drafts[provider.id] ?? {}).some((value) => value.trim())} className="min-h-11 flex-1 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-zinc-950 disabled:opacity-40">Save securely</button>
                  <button type="button" onClick={() => void remove(provider.id)} className="min-h-11 rounded-lg border border-red-900 px-3 text-sm text-red-200">Remove</button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <section aria-labelledby="provider-connections-title" className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Market infrastructure</p>
          <h3 id="provider-connections-title" className="mt-2 text-xl font-semibold text-white">Provider connections</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">Review regional acquisition and market-provider health here. Credential entry remains locked until secure owner login is active.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${secureRegistrationReady ? "border-emerald-400/30 text-emerald-300" : "border-amber-400/30 text-amber-200"}`}>
            {secureRegistrationReady ? "Secure registration ready" : "Registration locked"}
          </span>
          <button type="button" onClick={() => void refreshStatus()} disabled={refreshing} className="min-h-11 rounded-lg border border-zinc-700 px-4 text-sm font-semibold text-zinc-200 hover:border-cyan-400 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:opacity-50">
            {refreshing ? "Refreshing…" : "Refresh status"}
          </button>
        </div>
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-cyan-200">{healthMessage}</p>

      <div className="mt-6 space-y-8">
        {PROVIDER_GROUPS.map((group) => (
          <section key={group.id} aria-labelledby={`provider-group-${group.id}`}>
            <div>
              <h4 id={`provider-group-${group.id}`} className="text-base font-semibold text-zinc-100">{group.label}</h4>
              <p className="mt-1 text-sm leading-6 text-zinc-500">{group.description}</p>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {PROVIDERS.filter((provider) => provider.group === group.id).map(providerCard)}
            </div>
          </section>
        ))}
      </div>

      {!secureRegistrationReady ? (
        <p className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm leading-6 text-amber-100">Complete permanent owner login first. Until then, credential-backed provider secrets remain server-only and never cross this page. Liga acquisition health remains read-only.</p>
      ) : (
        <p className="mt-6 text-sm text-zinc-400">Open a credential-backed provider card to register or replace encrypted server-side credentials. Liga authentication remains in its isolated local browser profile.</p>
      )}
      {credentialMessage ? <p role="status" className="mt-3 text-sm text-cyan-200">{credentialMessage}</p> : null}
    </section>
  );
}
