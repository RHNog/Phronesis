import ActivationForm from "@/components/auth/ActivationForm";

export default function ActivatePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 py-10 text-zinc-100">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl sm:p-8" aria-labelledby="activate-title">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Private employee access</p>
        <h1 id="activate-title" className="mt-3 text-3xl font-semibold tracking-tight">Activate Phronesis</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Enter the single-use code supplied by the Phronesis owner. The code activates your invitation; it is not your permanent password.</p>
        <ActivationForm />
      </section>
    </main>
  );
}
