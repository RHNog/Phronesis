import type { ReactNode } from "react";
import Sidebar from "@/components/ui/Sidebar";
import Topbar from "@/components/ui/Topbar";
import type { CommandPaletteContext } from "@/components/search/CommandPaletteRouter";
import type { ModuleAccessLevel, PhronesisModule } from "@/lib/auth/domain";
import { getVisibleModules, requirePageModule } from "@/lib/auth/requestAuthorization";
import { navigationForModules } from "@/lib/navigation/ProductNavigation";

type AppShellProps = {
  children: ReactNode;
  commandPaletteContext?: CommandPaletteContext;
  requiredModule: PhronesisModule;
  requiredAccess?: ModuleAccessLevel;
};

export default async function AppShell({
  children,
  commandPaletteContext = "General",
  requiredModule,
  requiredAccess = "VIEW",
}: AppShellProps) {
  await requirePageModule(requiredModule, requiredAccess);
  const navigationItems = navigationForModules(await getVisibleModules());
  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">
      <Sidebar navigationItems={navigationItems} />

      {/* The right side contains the topbar and the current page content. */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar context={commandPaletteContext} />
        <main className="flex flex-1 justify-center px-4 py-6 md:px-6 md:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
