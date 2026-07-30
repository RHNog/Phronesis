"use client";

import { useEffect, useState } from "react";

export default function ActivationForm() {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"IDLE" | "PENDING" | "READY">("IDLE");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const value = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("code");
    if (value) queueMicrotask(() => setCode(value));
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  async function activate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("PENDING");
    setMessage(null);
    const response = await fetch("/api/auth/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const body = await response.json().catch(() => ({})) as { email?: string; error?: string };
    if (!response.ok) {
      setStatus("IDLE");
      setMessage(body.error ?? "Activation failed.");
      return;
    }
    setCode("");
    setStatus("READY");
    setMessage(`Access activated for ${body.email}. Continue with the invited GitHub identity.`);
  }

  return (
    <form onSubmit={activate} className="mt-6 space-y-4">
      <label className="block text-sm text-zinc-300">One-time employee code
        <input autoComplete="one-time-code" autoFocus required value={code} onChange={(event) => setCode(event.target.value)} className="mt-2 min-h-12 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 font-mono text-zinc-100" />
      </label>
      <button disabled={status === "PENDING" || status === "READY"} type="submit" className="min-h-11 w-full rounded-lg bg-cyan-300 px-4 font-semibold text-zinc-950 disabled:opacity-60">
        {status === "PENDING" ? "Activating…" : status === "READY" ? "Activated" : "Activate access"}
      </button>
      {message ? <p role="status" className="text-sm leading-6 text-zinc-300">{message}</p> : null}
      {status === "READY" ? <a href="/sign-in" className="block min-h-11 rounded-lg border border-zinc-700 px-4 py-3 text-center font-semibold text-cyan-300">Continue to sign in</a> : null}
    </form>
  );
}
