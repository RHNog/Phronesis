import AppShell from "@/components/ui/AppShell";
import InventoryWorkspace from "@/features/inventory/InventoryWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function InventoryPage() {
  const authorization = await requirePageModule("INVENTORY", "VIEW");
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;
  return (
    <AppShell requiredModule="INVENTORY">
      <InventoryWorkspace canOperate={canOperate} />
    </AppShell>
  );
}
