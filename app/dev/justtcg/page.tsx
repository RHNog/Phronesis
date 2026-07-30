import { notFound } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import { JustTCGProvider } from "@/lib/providers/justtcg/JustTCGProvider";
import type { JustTCGKnownCardContext } from "@/lib/providers/justtcg/JustTCGNormalizer";

type JustTCGDeveloperPageProps = {
  searchParams: Promise<{
    card?: string;
    game?: string;
  }>;
};

function JsonPanel({ title, value }: { title: string; value: unknown }) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      <pre className="mt-4 max-h-[520px] overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function StatusValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3">
      <dt className="text-xs uppercase text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-zinc-100">{value}</dd>
    </div>
  );
}

export default async function JustTCGDeveloperPage({
  searchParams,
}: JustTCGDeveloperPageProps) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  const params = await searchParams;
  const context: JustTCGKnownCardContext = {
    cardName: params.card ?? "Mox Opal",
    game: params.game ?? "Magic: The Gathering",
  };
  const provider = new JustTCGProvider();
  const inspection = await provider.inspectKnownCardForDevelopment(context);

  return (
    <AppShell requiredModule="ADMINISTRATION">
      <div className="w-full space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
            Developer-only temporary tool
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            JustTCG SDK Inspection
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Connectivity validation for the official JustTCG SDK provider adapter.
          </p>
        </header>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">
            Connection Status
          </h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusValue
              label="Authentication"
              value={inspection.authenticationStatus}
            />
            <StatusValue
              label="Connection"
              value={inspection.connectionStatus}
            />
            <StatusValue
              label="Provider Result"
              value={inspection.providerResultStatus}
            />
            <StatusValue
              label="Latency"
              value={`${inspection.diagnostics.durationMs}ms`}
            />
          </dl>
        </section>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">
            Replay Status
          </h3>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusValue
              label="Replay Mode"
              value={inspection.replayDiagnostics?.mode ?? "LIVE"}
            />
            <StatusValue
              label="Fixture Loaded"
              value={inspection.replayDiagnostics?.fixtureLoaded ? "YES" : "NO"}
            />
            <StatusValue
              label="Fixture Age"
              value={inspection.replayDiagnostics?.fixtureAge ?? "N/A"}
            />
            <StatusValue
              label="Recorded From"
              value={inspection.replayDiagnostics?.recordedFrom ?? "N/A"}
            />
            <StatusValue
              label="Provider"
              value={inspection.replayDiagnostics?.provider ?? "justtcg"}
            />
            <StatusValue
              label="SDK Version"
              value={inspection.replayDiagnostics?.sdkVersion ?? "N/A"}
            />
            <StatusValue
              label="Live Skipped"
              value={inspection.replayDiagnostics?.liveRequestSkipped ? "YES" : "NO"}
            />
            <StatusValue
              label="Quota Saved"
              value={inspection.replayDiagnostics?.quotaSaved ? "YES" : "NO"}
            />
          </dl>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <JsonPanel title="Raw SDK Response" value={inspection.rawSdkResponse} />
          <JsonPanel title="Normalized Response" value={inspection.normalized} />
        </div>

        <JsonPanel title="Provider Diagnostics" value={inspection.diagnostics} />
        <JsonPanel
          title="Replay Diagnostics"
          value={inspection.replayDiagnostics}
        />
        <JsonPanel
          title="Provider Request Trace"
          value={inspection.providerRequestTrace}
        />
        <JsonPanel
          title="Provider Request Error"
          value={inspection.providerRequestError}
        />
      </div>
    </AppShell>
  );
}
