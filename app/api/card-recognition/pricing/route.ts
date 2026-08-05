import { NextResponse } from "next/server";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { SqliteRecognitionCatalogue } from "@/lib/cardRecognition/sqliteCatalogue";
import { operationalPricingDatabasePath } from "@/lib/pricing/databasePath";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("category") ?? "";
  const sku = url.searchParams.get("sku") ?? "";
  const condition = url.searchParams.get("condition") ?? "";
  if (!categoryId || !sku || !condition) return NextResponse.json({ error: "Category, SKU, and condition are required." }, { status: 400 });
  const catalogue = new SqliteRecognitionCatalogue(operationalPricingDatabasePath());
  try {
    const snapshot = catalogue.priceSnapshot(categoryId, sku, condition);
    return snapshot ? NextResponse.json({ snapshot }) : NextResponse.json({ error: "No current price evidence exists for this exact condition." }, { status: 404 });
  } finally { catalogue.close(); }
}
