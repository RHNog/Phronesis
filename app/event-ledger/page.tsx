import AppShell from "@/components/ui/AppShell";
import EventLedgerWorkspace from "@/features/events/EventLedgerWorkspace";
import { headers } from "next/headers";
import { accessSatisfies } from "@/lib/auth/domain";
import {
  authorizeHeaders,
  requirePageModule,
} from "@/lib/auth/requestAuthorization";
import { getCaseSourceSheetUrl } from "@/lib/events/caseSourceConfig";

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
  const caseSourceAuthorization = await authorizeHeaders(
    await headers(),
    "INVENTORY",
    "OPERATE",
  );

  return (
    <AppShell requiredModule="EVENT_LEDGER">
      <EventLedgerWorkspace
        canOperate={canOperate}
        caseSourceSheetUrl={
          caseSourceAuthorization.allowed ? getCaseSourceSheetUrl() : null
        }
        initialEventId={initialEventId}
      />
    </AppShell>
  );
}
