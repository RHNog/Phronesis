import AppShell from "@/components/ui/AppShell";
import SnapshotVendorWorkspace from "@/features/vendor/components/SnapshotVendorWorkspace";

export default function VendorPage() {
  return (
    <AppShell commandPaletteContext="VendorWorkspace">
      <SnapshotVendorWorkspace />
    </AppShell>
  );
}
