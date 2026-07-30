import AppShell from "@/components/ui/AppShell";
import BusinessProfilesSettings from "@/features/settings/components/BusinessProfilesSettings";
import AccessManagement from "@/components/auth/AccessManagement";
import ProviderConnections from "@/components/settings/ProviderConnections";
import { getAuthRuntimeStatus } from "@/lib/auth/config";

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
            Manage Business Profiles used by purchase evaluation.
          </p>
        </header>

        <BusinessProfilesSettings />
        <ProviderConnections secureRegistrationReady={authStatus.mode !== "DISABLED" && authStatus.readyForRequiredMode} />
        <AccessManagement active={authStatus.mode !== "DISABLED" && authStatus.readyForRequiredMode} />
      </div>
    </AppShell>
  );
}
