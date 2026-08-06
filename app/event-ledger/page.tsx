import AppShell from "@/components/ui/AppShell";
import EventLedgerWorkspace from "@/features/events/EventLedgerWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function EventLedgerPage() {
  const authorization = await requirePageModule("EVENT_LEDGER", "VIEW");
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;

  return (
    <AppShell requiredModule="EVENT_LEDGER">
      <EventLedgerWorkspace canOperate={canOperate} />
    </AppShell>
  );
}
