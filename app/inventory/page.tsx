import AppShell from "@/components/ui/AppShell";
import InventoryWorkspace from "@/features/inventory/InventoryWorkspace";

export default function InventoryPage() {
  return (
    <AppShell requiredModule="INVENTORY">
      <InventoryWorkspace />
    </AppShell>
  );
}
