import Link from "next/link";
import NavigationIcon from "@/components/ui/NavigationIcon";
import PhronesisMark from "@/components/ui/PhronesisMark";
import type { PrimaryNavigationItem } from "@/lib/navigation/ProductNavigation";

export default function DashboardHub({
  tools,
}: {
  tools: readonly PrimaryNavigationItem[];
}) {
  return (
    <div className="w-full max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/70 shadow-2xl shadow-black/20">
        <div className="relative px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div
            aria-hidden="true"
            className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_65%)]"
          />
          <div className="relative max-w-3xl">
            <div className="flex items-center gap-4">
              <PhronesisMark size={56} priority className="shadow-lg shadow-black/30" />
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Phronesis workspace
              </p>
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Dashboard
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
              Your authorized tools, gathered in one place. Choose a workspace to
              move from market evidence to an operational decision.
            </p>
            <div className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 text-sm text-cyan-100">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-cyan-300 px-1.5 font-semibold text-zinc-950">
                {tools.length}
              </span>
              <span>{tools.length === 1 ? "authorized tool" : "authorized tools"}</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="dashboard-tools-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Workspace access
            </p>
            <h2 id="dashboard-tools-title" className="mt-2 text-2xl font-semibold text-white">
              Your tools
            </h2>
          </div>
          <p className="text-sm text-zinc-500">Access is filtered by your assigned role.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex min-h-56 flex-col rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 transition duration-200 hover:border-cyan-400/60 hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-4 focus:ring-offset-zinc-950"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950 text-cyan-300 transition group-hover:border-cyan-400/50 group-hover:text-cyan-200">
                  <NavigationIcon itemId={tool.id} className="h-6 w-6" />
                </span>
                <span className="text-xl text-zinc-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" aria-hidden="true">
                  →
                </span>
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                {tool.area}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{tool.label}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
