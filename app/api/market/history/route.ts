import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  getMarketHistoryRepository,
} from "@/lib/market/server";
import { isMarketHistoryRange } from "@/lib/market/history";
import { conditionLadder, type PricingCondition } from "@/lib/pricing/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "VIEW",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("category")?.trim() ?? "";
  const sku = url.searchParams.get("sku")?.trim() ?? "";
  const condition = url.searchParams.get("condition")?.trim() ?? "";
  const range = url.searchParams.get("range")?.trim() ?? "30D";
  if (
    categoryId.length < 2 ||
    categoryId.length > 40 ||
    sku.length < 1 ||
    sku.length > 160 ||
    !conditionLadder.includes(condition as PricingCondition) ||
    !isMarketHistoryRange(range)
  ) {
    return Response.json(
      { error: "A bounded category, SKU, condition, and history range are required." },
      { status: 400 },
    );
  }
  return Response.json(
    getMarketHistoryRepository().history({
      categoryId,
      sku,
      condition: condition as PricingCondition,
      range,
    }),
  );
}
