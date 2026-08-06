import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton";
import { getAuthRuntimeStatus } from "@/lib/auth/config";
import { getAuthorizationRepository, getAuthServer } from "@/lib/auth/server";

export default async function AccessPendingPage() {
  const status = getAuthRuntimeStatus();
  if (!status.readyForRequiredMode) redirect("/sign-in?callbackUrl=%2Faccess-pending");
  const session = await getAuthServer().api.getSession({ headers: await headers() });
  if (!session?.user.id) redirect("/sign-in?callbackUrl=%2Faccess-pending");
  const repository = getAuthorizationRepository();
  const membership = repository.getMembershipProfile(session.user.id);
  if (membership?.status === "ACTIVE") redirect("/");
  const request = repository.getAccessRequest(session.user.id);
  const rejected = request?.status === "REJECTED";

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-950 px-5 py-10 text-zinc-100">
      <section className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8" aria-labelledby="pending-access-title">
        <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${rejected ? "text-rose-300" : "text-amber-300"}`}>{rejected ? "Access not approved" : membership?.status === "DISABLED" ? "Account disabled" : "Owner approval required"}</p>
        <h1 id="pending-access-title" className="mt-3 text-3xl font-semibold tracking-tight">Your Phronesis account is ready</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Signed in as <span className="font-medium text-zinc-200">{session.user.name}</span> · {session.user.email}</p>
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm leading-6 text-zinc-300">
          {membership?.status === "DISABLED" ? <p>Your membership is disabled. Ask the Phronesis owner if access should be restored.</p> : rejected ? <p>The owner did not approve this request. Contact the owner before trying a different account.</p> : request?.status === "PENDING" ? <><p className="font-semibold text-white">No modules have been granted.</p><p className="mt-2 text-zinc-400">Ask the owner to open Settings → People and module access, verify your identity, and choose the modules you need.</p><p className="mt-2 text-xs text-zinc-600">Requested {new Date(request.requestedAt).toLocaleString()}</p></> : <p>Your identity is authenticated, but no access request is available. Ask the owner to review the account directory.</p>}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-cyan-200">Check access</Link>
          <SignOutButton className="min-h-11 rounded-lg border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-800" />
        </div>
      </section>
    </main>
  );
}
