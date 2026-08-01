import AppShell from "@/components/ui/AppShell";
import EventFlipWorkspace from "@/features/events/EventFlipWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function EventFlipPage() {
  const authorization = await requirePageModule("INVENTORY", "VIEW");
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;
  return (
    <AppShell requiredModule="INVENTORY">
      <EventFlipWorkspace canOperate={canOperate} />
    </AppShell>
  );
}
