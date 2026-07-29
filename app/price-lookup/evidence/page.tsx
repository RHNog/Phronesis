import { notFound } from "next/navigation";
import AppShell from "@/components/ui/AppShell";
import PricingLookup from "@/features/pricing/components/PricingLookup";
import { pricingEvidenceResponse } from "@/lib/pricing/evidenceFixtures";

export const dynamic = "force-dynamic";

export default async function PricingLookupEvidencePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; zoom?: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.JARVIS_RUNTIME_EVIDENCE !== "1") {
    notFound();
  }
  const params = await searchParams;
  const scenario = params.scenario ?? "sealed";
  const zoomReflow = params.zoom === "200" || params.zoom === "400";
  const response = pricingEvidenceResponse(scenario);
  return (
    <AppShell commandPaletteContext="VendorWorkspace">
      <PricingLookup
        initialQuery={response.query}
        initialResponse={response}
        initialError={scenario === "error" ? "Pricing lookup is temporarily unavailable. Your search was preserved; try again." : null}
        initialLoading={scenario === "loading"}
        evidenceMode
        evidenceZoomReflow={zoomReflow}
      />
    </AppShell>
  );
}
