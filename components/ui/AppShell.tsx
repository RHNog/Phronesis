import type { ReactNode } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";
import type { CommandPaletteContext } from "@/components/search/CommandPaletteRouter";

type AppShellProps = {
  children: ReactNode;
  commandPaletteContext?: CommandPaletteContext;
};

export default function AppShell({
  children,
  commandPaletteContext = "General",
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar />

      {/* The right side contains the topbar and the current page content. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar context={commandPaletteContext} />
        <main className="flex flex-1 justify-center px-6 py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
