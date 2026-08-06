import AppShell from "@/components/ui/AppShell";
import SnapshotVendorWorkspace from "@/features/vendor/components/SnapshotVendorWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function VendorPage() {
  const authorization = await requirePageModule("VENDOR_WORKSPACE", "VIEW");
  const canOperate = authorization.assignedAccess
    ? accessSatisfies(authorization.assignedAccess, "OPERATE")
    : false;

  return (
    <AppShell
      commandPaletteContext="VendorWorkspace"
      requiredModule="VENDOR_WORKSPACE"
    >
      <SnapshotVendorWorkspace canOperate={canOperate} />
    </AppShell>
  );
}
