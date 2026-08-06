"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function EmailSignInForm({ callbackURL }: { callbackURL: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({ email, password, callbackURL });
    if (result.error) {
      setError("Email or password is incorrect, or this account is unavailable.");
      setPending(false);
      return;
    }
    window.location.assign(callbackURL);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-medium text-zinc-300" htmlFor="account-email">
        Email
        <input id="account-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30" />
      </label>
      <label className="block text-sm font-medium text-zinc-300" htmlFor="account-password">
        Password
        <input id="account-password" required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30" />
      </label>
      <button type="submit" disabled={pending} className="min-h-11 w-full rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-70">
        {pending ? "Signing in…" : "Sign in"}
      </button>
      {error ? <p role="alert" className="text-sm leading-6 text-rose-300">{error}</p> : null}
    </form>
  );
}
