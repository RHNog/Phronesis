import { NextResponse } from "next/server";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getCardRecognitionRepository } from "@/lib/cardRecognition/server";
import { SqliteRecognitionCatalogue, summarizeRecognitionValuation, TCG_LOW_80_PRESET_ID } from "@/lib/cardRecognition/sqliteCatalogue";
import { operationalPricingDatabasePath } from "@/lib/pricing/databasePath";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const { sessionId } = await context.params;
    const repository = getCardRecognitionRepository();
    const offer = repository.offerDraft(sessionId);
    const pricing = new SqliteRecognitionCatalogue(operationalPricingDatabasePath());
    try {
      return NextResponse.json({ session: repository.sessionSummary(sessionId), items: repository.sessionItems(sessionId), offer, offerSummary: repository.offerSummary(sessionId), valuationSummary: summarizeRecognitionValuation(offer, pricing) });
    } finally { pricing.close(); }
  } catch {
    return NextResponse.json({ error: "Scan session not found." }, { status: 404 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const { sessionId } = await context.params;
    const input = await request.json() as Record<string, unknown>;
    const repository = getCardRecognitionRepository();
    const batchMaterial = repository.sessionSummary(sessionId).batchMaterial;
    if (!batchMaterial) throw new Error("batch condition and finish must be configured before resolution");
    const regionId = String(input.regionId ?? "");
    const canonicalPrintingId = String(input.canonicalPrintingId ?? "");
    const machineCandidate = repository.sessionItems(sessionId).find((item) => item.regionId === regionId)?.decision?.candidates.find((candidate) => candidate.canonicalPrintingId === canonicalPrintingId);
    if (!machineCandidate) throw new Error("selected candidate was not produced by recognition");
    if (!machineCandidate.catalogueIdentity) throw new Error("selected candidate lacks exact catalogue material identity");
    const condition = String(input.condition ?? "");
    const finish = String(input.finish ?? "");
    if (machineCandidate.catalogueIdentity.variant.localeCompare(finish, undefined, { sensitivity: "base" }) !== 0) throw new Error("selected finish must match the exact catalogue variant");
    const buyingPresetId = String(input.buyingPresetId ?? "");
    if (buyingPresetId !== TCG_LOW_80_PRESET_ID) throw new Error("buying preset is unsupported");
    const pricing = new SqliteRecognitionCatalogue(operationalPricingDatabasePath());
    let valuation;
    try { valuation = pricing.valuationSnapshot(machineCandidate.categoryId, machineCandidate.sku, condition); }
    finally { pricing.close(); }
    if (!valuation || valuation.priceSnapshotId !== String(input.priceSnapshotId ?? "") || valuation.priceSnapshotAt !== String(input.priceSnapshotAt ?? "")) throw new Error("price snapshot binding is stale or invalid");
    if (valuation.suggestedOfferCents === null) throw new Error("TCG Low is unavailable for the selected card and condition");
    const decision = repository.resolveRegion({
      sessionId,
      regionId,
      canonicalPrintingId,
      condition,
      finish,
      quantity: Number(input.quantity),
      priceSnapshotId: String(input.priceSnapshotId ?? ""),
      priceSnapshotAt: String(input.priceSnapshotAt ?? ""),
      buyingPresetId,
      offerCents: valuation.suggestedOfferCents,
      currency: "USD",
      resolvedBy: authorization.userId ?? "compatibility-owner",
    });
    return NextResponse.json({ decision, valuation });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Recognition exception could not be resolved." }, { status: 400 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const { sessionId } = await context.params;
    const input = await request.json() as Record<string, unknown>;
    const session = getCardRecognitionRepository().setSessionMaterial({
      sessionId,
      conditionCode: String(input.conditionCode ?? ""),
      finish: String(input.finish ?? ""),
      configuredBy: authorization.userId ?? "compatibility-owner",
    });
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Batch material could not be configured." }, { status: 400 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const { sessionId } = await context.params;
    const session = getCardRecognitionRepository().cancelSession(sessionId);
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scan session could not be cancelled." }, { status: 400 });
  }
}
