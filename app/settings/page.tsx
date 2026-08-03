import AppShell from "@/components/ui/AppShell";
import BusinessProfilesSettings from "@/features/settings/components/BusinessProfilesSettings";
import AccessManagement from "@/components/auth/AccessManagement";
import EventAccessManagement from "@/components/auth/EventAccessManagement";
import ProviderConnections from "@/components/settings/ProviderConnections";
import SealedArtworkReview from "@/components/settings/SealedArtworkReview";
import { getAuthRuntimeStatus } from "@/lib/auth/config";
import RegionalCostProfileSettings from "@/features/settings/components/RegionalCostProfileSettings";

export default function SettingsPage() {
  const authStatus = getAuthRuntimeStatus();
  return (
    <AppShell requiredModule="ADMINISTRATION">
      <div className="w-full space-y-6">
        <header>
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Settings
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Manage purchase profiles, regional economics, providers, and team
            access.
          </p>
        </header>

        <BusinessProfilesSettings />
        <RegionalCostProfileSettings />
        <ProviderConnections
          secureRegistrationReady={
            authStatus.mode !== "DISABLED" && authStatus.readyForRequiredMode
          }
        />
        <SealedArtworkReview />
        <AccessManagement
          active={
            authStatus.mode !== "DISABLED" && authStatus.readyForRequiredMode
          }
        />
        <EventAccessManagement
          active={authStatus.mode !== "DISABLED" && authStatus.readyForRequiredMode}
        />
      </div>
    </AppShell>
  );
}
