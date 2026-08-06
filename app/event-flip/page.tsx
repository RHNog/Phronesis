import AppShell from "@/components/ui/AppShell";
import EventFlipWorkspace from "@/features/events/EventFlipWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function EventFlipPage() {
  const authorization = await requirePageModule("EVENT_FLIP", "VIEW");
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;
  return (
    <AppShell requiredModule="EVENT_FLIP">
      <EventFlipWorkspace canOperate={canOperate} />
    </AppShell>
  );
}
