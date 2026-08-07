import AppShell from "@/components/ui/AppShell";
import EventLedgerWorkspace from "@/features/events/EventLedgerWorkspace";
import { headers } from "next/headers";
import { accessSatisfies } from "@/lib/auth/domain";
import {
  authorizeHeaders,
  requirePageModule,
} from "@/lib/auth/requestAuthorization";
import { getPublicEventAccessOrigin } from "@/lib/auth/config";
import { getCaseSourceSheetUrl } from "@/lib/events/caseSourceConfig";

export default async function EventLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string | string[] }>;
}) {
  const authorization = await requirePageModule("EVENT_LEDGER", "VIEW");
  const requestHeaders = await headers();
  const params = await searchParams;
  const initialEventId =
    typeof params.eventId === "string" ? params.eventId : null;
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;
  const caseSourceAuthorization = await authorizeHeaders(
    requestHeaders,
    "INVENTORY",
    "OPERATE",
  );
  const eventTeamAuthorization = await authorizeHeaders(
    requestHeaders,
    "ADMINISTRATION",
    "ADMIN",
  );
  const canManageEventTeam = Boolean(
    eventTeamAuthorization.allowed && eventTeamAuthorization.membershipId,
  );
  const eventTeamSignInRequired =
    eventTeamAuthorization.reason === "AUTH_DISABLED" ||
    eventTeamAuthorization.reason === "UNAUTHENTICATED";
  const publicEventOrigin = getPublicEventAccessOrigin();

  return (
    <AppShell requiredModule="EVENT_LEDGER">
      <EventLedgerWorkspace
        canOperate={canOperate}
        canManageEventTeam={canManageEventTeam}
        eventTeamSignInRequired={eventTeamSignInRequired}
        publicEventLoginUrl={
          publicEventOrigin ? `${publicEventOrigin}/event-access` : null
        }
        caseSourceSheetUrl={
          caseSourceAuthorization.allowed ? getCaseSourceSheetUrl() : null
        }
        initialEventId={initialEventId}
      />
    </AppShell>
  );
}
