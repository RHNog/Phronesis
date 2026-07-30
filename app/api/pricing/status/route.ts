import { NextResponse } from "next/server";
import { pricingLookupConfig } from "@/config/pricingLookup";
import { getPricingRepository } from "@/lib/pricing/server";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const repository = getPricingRepository();
    const syncByCategory = new Map(repository.getSyncStates().map((state) => [state.categoryId, state]));
    return NextResponse.json({
      categories: pricingLookupConfig.categories.filter((category) => category.active).map((category) => ({
        ...category,
        sync: (() => {
          const state = syncByCategory.get(category.id);
          if (!state) return null;
          return {
            categoryId: state.categoryId,
            status: state.status,
            checkpointAt: state.checkpointAt,
            startedAt: state.startedAt,
            completedAt: state.completedAt,
            rowsRead: state.rowsRead,
            productsUpserted: state.productsUpserted,
            snapshotsInserted: state.snapshotsInserted,
            lastError: state.lastError,
          };
        })(),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Pricing status is temporarily unavailable." }, { status: 500 });
  }
}
