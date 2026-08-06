import AppShell from "@/components/ui/AppShell";
import EventLedgerWorkspace from "@/features/events/EventLedgerWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function EventLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string | string[] }>;
}) {
  const authorization = await requirePageModule("EVENT_LEDGER", "VIEW");
  const params = await searchParams;
  const initialEventId =
    typeof params.eventId === "string" ? params.eventId : null;
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;

  return (
    <AppShell requiredModule="EVENT_LEDGER">
      <EventLedgerWorkspace
        canOperate={canOperate}
        initialEventId={initialEventId}
      />
    </AppShell>
  );
}
