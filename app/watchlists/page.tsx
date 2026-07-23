import AppShell from "@/components/ui/AppShell";
import WatchlistWorkspace from "@/features/watchlist/WatchlistWorkspace";

export default function WatchlistsPage() {
  return (
    <AppShell commandPaletteContext="MarketWatch">
      <WatchlistWorkspace />
    </AppShell>
  );
}
