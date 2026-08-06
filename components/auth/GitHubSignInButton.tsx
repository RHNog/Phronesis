"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/client";

type GitHubSignInButtonProps = {
  callbackURL: string;
};

export default function GitHubSignInButton({ callbackURL }: GitHubSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.social({ provider: "github", callbackURL });
    if (result.error) {
      setError("GitHub sign-in could not start. Try again or contact the Phronesis owner.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={signIn}
        disabled={pending}
        className="min-h-11 w-full rounded-lg bg-cyan-300 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? "Opening GitHub…" : "Continue with GitHub"}
      </button>
      {error ? <p role="alert" className="text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
