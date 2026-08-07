import AppShell from "@/components/ui/AppShell";
import SettingsControlCenter from "@/features/settings/components/SettingsControlCenter";
import { getAuthRuntimeStatus, getPublicEventAccessOrigin } from "@/lib/auth/config";
import { normalizeSettingsPanel } from "@/lib/settings/panels";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ panel?: string | string[] }>;
}) {
  const authStatus = getAuthRuntimeStatus();
  const publicEventOrigin = getPublicEventAccessOrigin();
  const params = await searchParams;
  const initialPanel = normalizeSettingsPanel(
    typeof params.panel === "string" ? params.panel : null,
  );
  const secureRegistrationReady =
    authStatus.mode !== "DISABLED" && authStatus.readyForRequiredMode;
  return (
    <AppShell requiredModule="ADMINISTRATION">
      <SettingsControlCenter
        initialPanel={initialPanel}
        secureRegistrationReady={secureRegistrationReady}
        publicLoginUrl={
          publicEventOrigin ? `${publicEventOrigin}/event-access` : null
        }
      />
    </AppShell>
  );
}
