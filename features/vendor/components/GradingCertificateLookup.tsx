"use client";

import { useState } from "react";
import {
  certificateLookupProviders,
  type CertificateLookupProviderId,
} from "@/lib/intelligence/certification/CertificateLookupRegistry";

type LookupResponse = {
  providerId?: string;
  status?: string;
  certificateNumber?: string;
  message?: string;
  grade?: string | null;
  title?: string | null;
  labelType?: string | null;
  specificationNumber?: string | null;
  error?: string;
};

export default function GradingCertificateLookup() {
  const [providerId, setProviderId] = useState<CertificateLookupProviderId>("PSA");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<LookupResponse | null>(null);
  const provider = certificateLookupProviders.find((candidate) => candidate.id === providerId)!;

  async function lookup() {
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/grading/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, certificateNumber }),
      });
      const body = (await response.json().catch(() => ({}))) as LookupResponse;
      setResult(response.ok ? body : { ...body, status: "ERROR", message: body.error ?? body.message });
    } catch {
      setResult({ status: "ERROR", message: "Certificate lookup could not reach Phronesis." });
    } finally {
      setPending(false);
    }
  }

  return (
    <details className="rounded-xl border border-zinc-800 bg-zinc-900/70">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-300">
        <span>Certificate lookup</span>
        <span className="text-xs font-medium text-zinc-500">PSA native · other graders registered</span>
      </summary>
      <div className="border-t border-zinc-800 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <label className="text-xs font-medium text-zinc-400">
            Grader
            <select
              value={providerId}
              onChange={(event) => {
                setProviderId(event.target.value as CertificateLookupProviderId);
                setResult(null);
              }}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              {certificateLookupProviders.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>{candidate.label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-400">
            Certificate number
            <input
              value={certificateNumber}
              onChange={(event) => setCertificateNumber(event.target.value)}
              placeholder={provider.certificateHint}
              autoComplete="off"
              inputMode={providerId === "SGC" ? "text" : "numeric"}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-sm text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-zinc-500">{provider.note}</p>
        <button
          type="button"
          disabled={pending || !certificateNumber.trim()}
          onClick={() => void lookup()}
          className="mt-3 min-h-11 w-full rounded-lg border border-cyan-700 bg-cyan-950/40 px-4 text-sm font-semibold text-cyan-200 disabled:opacity-50"
        >
          {pending ? "Checking official source…" : "Check certificate inside Phronesis"}
        </button>
        {result ? (
          <div role="status" className={`mt-3 rounded-lg border p-3 text-sm ${result.status === "VERIFIED" ? "border-emerald-700 bg-emerald-950/25 text-emerald-100" : "border-amber-800 bg-amber-950/25 text-amber-100"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{result.status?.replaceAll("_", " ")}</p>
              {result.certificateNumber ? <p className="font-mono text-xs">#{result.certificateNumber}</p> : null}
            </div>
            {result.title ? <p className="mt-2 font-semibold text-white">{result.title}</p> : null}
            {result.grade ? <p className="mt-1">Grade {result.grade}{result.labelType ? ` · ${result.labelType}` : ""}</p> : null}
            {result.specificationNumber ? <p className="mt-1 text-xs">PSA specification {result.specificationNumber}</p> : null}
            {result.message ? <p className="mt-2 text-xs leading-5 opacity-80">{result.message}</p> : null}
          </div>
        ) : null}
      </div>
    </details>
  );
}
