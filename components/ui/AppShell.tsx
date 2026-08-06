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
  requiredModule?: PhronesisModule;
  requiredAccess?: ModuleAccessLevel;
};

export default async function AppShell({
  children,
  commandPaletteContext = "General",
  requiredModule,
  requiredAccess = "VIEW",
}: AppShellProps) {
  if (requiredModule) {
    await requirePageModule(requiredModule, requiredAccess);
  }
  const visibleModules = await getVisibleModules();
  if (!requiredModule && visibleModules.length === 0) {
    await requirePageModule("INTELLIGENCE", "VIEW");
  }
  const navigationItems = navigationForModules(visibleModules);
  return (
    <div className="flex min-h-dvh w-full min-w-0 overflow-x-clip bg-zinc-950 text-white">
      <Sidebar navigationItems={navigationItems} />

      {/* The right side contains the topbar and the current page content. */}
      <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-clip">
        <Topbar
          context={commandPaletteContext}
          navigationItems={navigationItems}
        />
        <main className="flex min-w-0 flex-1 justify-center overflow-x-clip px-4 py-6 [padding-right:max(1rem,env(safe-area-inset-right))] md:px-6 md:py-10 md:[padding-right:max(1.5rem,env(safe-area-inset-right))]">
          {children}
        </main>
      </div>
    </div>
  );
}
