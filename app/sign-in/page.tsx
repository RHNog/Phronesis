import GitHubSignInButton from "@/components/auth/GitHubSignInButton";
import EmailSignInForm from "@/components/auth/EmailSignInForm";
import { getAuthRuntimeStatus } from "@/lib/auth/config";
import EventAccessLogin from "@/components/auth/EventAccessLogin";
import Link from "next/link";
import { headers } from "next/headers";

function safeCallback(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const status = getAuthRuntimeStatus();
  const callbackURL = safeCallback((await searchParams).callbackUrl);
  const restrictedPublic = (await headers()).get("x-phronesis-restricted-public") === "1";
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10 text-zinc-100">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8" aria-labelledby="sign-in-title">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Phronesis account</p>
        <h1 id="sign-in-title" className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          Sign in with your permanent account. Module access is assigned separately by the Phronesis owner.
        </p>
        <div className="mt-6">
          {status.readyForRequiredMode ? (
            <div className="space-y-5">
              <EmailSignInForm callbackURL={callbackURL} />
              <p className="text-center text-sm text-zinc-400">Need an account? <Link href="/sign-up" className="font-semibold text-cyan-300 hover:text-cyan-200">Create one</Link></p>
              {status.githubConfigured ? <><div className="flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-zinc-800" /><span className="text-xs uppercase tracking-wider text-zinc-600">or</span><span className="h-px flex-1 bg-zinc-800" /></div><GitHubSignInButton callbackURL={callbackURL} /></> : null}
            </div>
          ) : (
            <p role="status" className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">
              Private sign-in is not configured on this instance yet. Existing tailnet review remains available only while compatibility mode is enabled.
            </p>
          )}
        </div>
        {restrictedPublic ? null : <EventAccessLogin callbackURL={callbackURL} />}
      </section>
    </main>
  );
}
