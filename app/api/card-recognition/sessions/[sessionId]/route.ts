import { NextResponse } from "next/server";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getCardRecognitionRepository } from "@/lib/cardRecognition/server";
import { SqliteRecognitionCatalogue } from "@/lib/cardRecognition/sqliteCatalogue";
import { operationalPricingDatabasePath } from "@/lib/pricing/databasePath";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const { sessionId } = await context.params;
    const repository = getCardRecognitionRepository();
    return NextResponse.json({ session: repository.sessionSummary(sessionId), items: repository.sessionItems(sessionId), offer: repository.offerDraft(sessionId), offerSummary: repository.offerSummary(sessionId) });
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
    if (!machineCandidate.catalogueIdentity || machineCandidate.catalogueIdentity.variant.localeCompare(batchMaterial.finish, undefined, { sensitivity: "base" }) !== 0) throw new Error("selected candidate does not match the configured batch finish");
    const pricing = new SqliteRecognitionCatalogue(operationalPricingDatabasePath());
    let verifiedSnapshot;
    try { verifiedSnapshot = pricing.priceSnapshot(machineCandidate.categoryId, machineCandidate.sku, batchMaterial.conditionCode); }
    finally { pricing.close(); }
    if (!verifiedSnapshot || verifiedSnapshot.priceSnapshotId !== String(input.priceSnapshotId ?? "") || verifiedSnapshot.priceSnapshotAt !== String(input.priceSnapshotAt ?? "")) throw new Error("price snapshot binding is stale or invalid");
    const decision = repository.resolveRegion({
      sessionId,
      regionId,
      canonicalPrintingId,
      condition: batchMaterial.conditionCode,
      finish: batchMaterial.finish,
      quantity: Number(input.quantity),
      priceSnapshotId: String(input.priceSnapshotId ?? ""),
      priceSnapshotAt: String(input.priceSnapshotAt ?? ""),
      buyingPresetId: String(input.buyingPresetId ?? ""),
      offerCents: Number(input.offerCents),
      currency: String(input.currency ?? "USD"),
      resolvedBy: authorization.userId ?? "compatibility-owner",
    });
    return NextResponse.json({ decision });
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
