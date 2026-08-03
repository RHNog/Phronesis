import SealedArtworkReview from "@/components/settings/SealedArtworkReview";
import AppShell from "@/components/ui/AppShell";

export default function ArtworkReviewPage() {
  return (
    <AppShell requiredModule="ADMINISTRATION">
      <div className="w-full space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
            Temporary administration workspace
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Artwork Review
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Review unresolved sealed-product images without mixing operational
            artwork decisions into permanent Settings.
          </p>
        </header>
        <SealedArtworkReview />
      </div>
    </AppShell>
  );
}
