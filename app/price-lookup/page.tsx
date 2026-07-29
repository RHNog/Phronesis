import AppShell from "@/components/ui/AppShell";
import PricingLookup from "@/features/pricing/components/PricingLookup";

export default function PriceLookupPage() {
  return (
    <AppShell commandPaletteContext="VendorWorkspace">
      <PricingLookup />
    </AppShell>
  );
}
