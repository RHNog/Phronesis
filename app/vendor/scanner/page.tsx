import AppShell from "@/components/ui/AppShell";
import ScannerToOfferWorkspace from "@/features/vendor/components/ScannerToOfferWorkspace";
import { accessSatisfies } from "@/lib/auth/domain";
import { requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function ScannerToOfferPage() {
  const authorization = await requirePageModule("VENDOR_WORKSPACE", "VIEW");
  const canOperate = authorization.assignedAccess ? accessSatisfies(authorization.assignedAccess, "OPERATE") : false;
  return <AppShell commandPaletteContext="VendorWorkspace" requiredModule="VENDOR_WORKSPACE"><ScannerToOfferWorkspace canOperate={canOperate} /></AppShell>;
}
