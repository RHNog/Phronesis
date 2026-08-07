import AppShell from "@/components/ui/AppShell";
import SnapshotVendorWorkspace from "@/features/vendor/components/SnapshotVendorWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";
import { MARKET_PROVIDER_IDS } from "@/lib/market/providers";
import { getRegionalIntelligenceRepository } from "@/lib/regional/server";
import { getUserMarketSettingsRepository } from "@/lib/user-settings/server";

export default async function VendorPage() {
  const authorization = await requirePageModule("VENDOR_WORKSPACE", "VIEW");
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;
  const enabledProviderIds =
    authorization.userId &&
    authorization.workspaceId &&
    authorization.membershipId
      ? getUserMarketSettingsRepository().get(
          authorization.workspaceId,
          authorization.userId,
          getRegionalIntelligenceRepository().getProfile(),
        ).enabledProviderIds
      : MARKET_PROVIDER_IDS;

  return (
    <AppShell
      commandPaletteContext="VendorWorkspace"
      requiredModule="VENDOR_WORKSPACE"
    >
      <SnapshotVendorWorkspace
        canOperate={canOperate}
        enabledProviderIds={enabledProviderIds}
      />
    </AppShell>
  );
}
