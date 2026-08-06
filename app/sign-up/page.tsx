import Link from "next/link";
import SignUpForm from "@/components/auth/SignUpForm";
import { getAuthRuntimeStatus } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const status = getAuthRuntimeStatus();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-5 py-10 text-zinc-100">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8" aria-labelledby="sign-up-title">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Trusted Phronesis access</p>
        <h1 id="sign-up-title" className="mt-3 text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Registration creates your identity only. The Phronesis owner must recognize you, approve the request, and assign your modules before you can enter the workspace.</p>
        {status.readyForRequiredMode ? <SignUpForm /> : <p role="status" className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-100">Account registration is not configured on this Phronesis instance yet.</p>}
        <p className="mt-6 text-center text-sm text-zinc-400">Already registered? <Link href="/sign-in" className="font-semibold text-cyan-300 hover:text-cyan-200">Sign in</Link></p>
      </section>
    </main>
  );
}
