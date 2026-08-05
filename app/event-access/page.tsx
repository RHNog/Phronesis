import { headers } from "next/headers";
import { redirect } from "next/navigation";
import EventAccessLogin from "@/components/auth/EventAccessLogin";
import { getEventAccessRepository } from "@/lib/auth/server";
import {
  eventAccessDestination,
  eventAccessToken,
} from "@/lib/auth/EventAccessSession";

export default async function EventAccessPage() {
  const token = eventAccessToken(await headers());
  const session = token
    ? getEventAccessRepository().resumeSession(token)
    : null;
  if (session) redirect(eventAccessDestination(session.grant.entitlements));

  return <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10 text-zinc-100"><section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8"><p className="text-xs font-semibold uppercase tracking-[.22em] text-cyan-300">Phronesis worker access</p><h1 className="mt-3 text-3xl font-semibold">Enter your workspace</h1><EventAccessLogin /></section></main>;
}
