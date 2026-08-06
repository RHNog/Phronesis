"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export default function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Enter the name the Phronesis owner will recognize.");
      return;
    }
    if (password.length < 12) {
      setError("Use at least 12 characters for your password.");
      return;
    }
    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }
    setPending(true);
    const result = await authClient.signUp.email({
      name: name.trim(),
      email,
      password,
      callbackURL: "/access-pending",
    });
    if (result.error) {
      setError("The account could not be created. If you already registered, return to sign in.");
      setPending(false);
      return;
    }
    window.location.assign("/access-pending");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-zinc-300" htmlFor="registration-name">
        Your name
        <input id="registration-name" required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30" />
      </label>
      <label className="block text-sm font-medium text-zinc-300" htmlFor="registration-email">
        Email
        <input id="registration-email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30" />
      </label>
      <label className="block text-sm font-medium text-zinc-300" htmlFor="registration-password">
        Password
        <input id="registration-password" required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-describedby="registration-password-help" className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30" />
        <span id="registration-password-help" className="mt-1 block text-xs leading-5 text-zinc-500">At least 12 characters. Use a unique password you do not use elsewhere.</span>
      </label>
      <label className="block text-sm font-medium text-zinc-300" htmlFor="registration-password-confirmation">
        Confirm password
        <input id="registration-password-confirmation" required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 text-base text-white focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30" />
      </label>
      <button type="submit" disabled={pending} className="min-h-12 w-full rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-70">
        {pending ? "Creating account…" : "Create account"}
      </button>
      {error ? <p role="alert" className="text-sm leading-6 text-rose-300">{error}</p> : null}
    </form>
  );
}
