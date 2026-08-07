import AppShell from "@/components/ui/AppShell";
import ScannerToOfferWorkspace from "@/features/vendor/components/ScannerToOfferWorkspace";
import { headers } from "next/headers";
import { accessSatisfies } from "@/lib/auth/domain";
import { authorizeHeaders, requirePageModule } from "@/lib/auth/requestAuthorization";

export default async function ScannerToOfferPage() {
  const authorization = await requirePageModule("VENDOR_WORKSPACE", "VIEW");
  const canOperate = authorization.assignedAccess ? accessSatisfies(authorization.assignedAccess, "OPERATE") : false;
  const administration = await authorizeHeaders(await headers(), "ADMINISTRATION", "ADMIN");
  return <AppShell commandPaletteContext="VendorWorkspace" requiredModule="VENDOR_WORKSPACE"><ScannerToOfferWorkspace
    canOperate={canOperate}
    canManageAppliances={administration.allowed && Boolean(administration.membershipId)}
  /></AppShell>;
}
