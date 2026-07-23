import AppShell from "@/components/ui/AppShell";
import BusinessProfilesSettings from "@/features/settings/components/BusinessProfilesSettings";

export default function SettingsPage() {
  return (
    <AppShell>
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
      </div>
    </AppShell>
  );
}
