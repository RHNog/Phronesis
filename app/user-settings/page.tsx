import AppShell from "@/components/ui/AppShell";
import UserMarketSettingsWorkspace from "@/features/user-settings/UserMarketSettingsWorkspace";
import { requireActiveMemberPage } from "@/lib/auth/requestAuthorization";
import { getRegionalIntelligenceRepository } from "@/lib/regional/server";
import { getUserMarketSettingsRepository } from "@/lib/user-settings/server";

export default async function UserSettingsPage() {
  const identity = await requireActiveMemberPage();
  const settings = getUserMarketSettingsRepository().get(
    identity.workspaceId,
    identity.userId,
    getRegionalIntelligenceRepository().getProfile(),
  );
  return (
    <AppShell allowNoModules commandPaletteContext="General">
      <UserMarketSettingsWorkspace initialSettings={settings} />
    </AppShell>
  );
}
