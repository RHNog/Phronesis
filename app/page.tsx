import DashboardHub from "@/components/dashboard/DashboardHub";
import AppShell from "@/components/ui/AppShell";
import { getVisibleModules } from "@/lib/auth/requestAuthorization";
import { navigationForModules } from "@/lib/navigation/ProductNavigation";

export default async function DashboardPage() {
  const tools = navigationForModules(await getVisibleModules()).filter(
    (item) => item.id !== "dashboard",
  );

  return (
    <AppShell>
      <DashboardHub tools={tools} />
    </AppShell>
  );
}
