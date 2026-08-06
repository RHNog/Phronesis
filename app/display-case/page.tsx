import AppShell from "@/components/ui/AppShell";
import DisplayCaseWorkspace from "@/features/events/DisplayCaseWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function DisplayCasePage() {
  const authorization = await requirePageModule("INVENTORY", "VIEW");
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;
  return (
    <AppShell requiredModule="INVENTORY">
      <DisplayCaseWorkspace canOperate={canOperate} />
    </AppShell>
  );
}
