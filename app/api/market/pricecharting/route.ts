import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getProviderCredential } from "@/lib/providers/credentials";
import { PriceChartingClient } from "@/lib/providers/pricecharting/PriceChartingClient";
import { getPriceChartingBulkRepository } from "@/lib/providers/pricecharting/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!auth.allowed) return authorizationErrorResponse(auth);
  const token = getProviderCredential("pricecharting", "PRICECHARTING_API_TOKEN");
  const url = new URL(request.url);
  const name = url.searchParams.get("name")?.trim() ?? "";
  const setName = url.searchParams.get("set")?.trim() ?? "";
  const collectorNumber = url.searchParams.get("number")?.trim() || null;
  const categoryId = url.searchParams.get("category")?.trim() ?? "";
  const sku = url.searchParams.get("sku")?.trim() ?? "";
  if (name.length < 2 || name.length > 160 || setName.length > 160 || (collectorNumber?.length ?? 0) > 40) return Response.json({ error: "A bounded card identity is required." }, { status: 400 });
  const imported = categoryId && sku ? getPriceChartingBulkRepository().getEvidence(categoryId, sku) : [];
  if (imported.length) return Response.json({ status: "READY", evidence: imported, evidenceSource: "IMPORTED" });
  if (!token) return Response.json({ status: "NOT_CONFIGURED", evidence: [], evidenceSource: "NONE" });
  try {
    const evidence = await new PriceChartingClient(token).lookup({ name, setName, collectorNumber });
    return Response.json({ status: evidence.length ? "READY" : "NO_MATCH", evidence, evidenceSource: "LIVE" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "PriceCharting lookup failed." }, { status: 502 });
  }
}
