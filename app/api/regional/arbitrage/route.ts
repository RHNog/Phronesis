import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import type { ArbitrageDirection } from "@/lib/regional/domain";
import {
  getRegionalIntelligenceRepository,
  getRegionalProfileWithOfficialFx,
} from "@/lib/regional/server";
import type { RegionalCostProfile } from "@/lib/regional/domain";
import { getUserMarketSettingsRepository } from "@/lib/user-settings/server";

function effectiveProfile(
  authorization: Awaited<ReturnType<typeof authorizeRequest>>,
  workspaceProfile: RegionalCostProfile,
): RegionalCostProfile {
  return authorization.userId &&
    authorization.workspaceId &&
    authorization.membershipId
    ? getUserMarketSettingsRepository().get(
        authorization.workspaceId,
        authorization.userId,
        workspaceProfile,
      ).effectiveCostProfile
    : workspaceProfile;
}

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "INTELLIGENCE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const limit = Math.min(
    200,
    Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 50)),
  );
  const profile = effectiveProfile(
    authorization,
    await getRegionalProfileWithOfficialFx(),
  );
  return Response.json({
    candidates: getRegionalIntelligenceRepository().listCandidates(
      limit,
      profile,
    ),
  });
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "INTELLIGENCE",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const body = (await request.json()) as {
      categoryId: string;
      sku: string;
      direction: ArbitrageDirection;
      executablePrice: number;
      quantity: number;
      counterpartyLabel: string;
      observedAt: string;
      notes?: string;
    };
    if (body.direction !== "US_TO_BRAZIL" && body.direction !== "BRAZIL_TO_US")
      throw new Error("A supported arbitrage direction is required.");
    const profile = effectiveProfile(
      authorization,
      await getRegionalProfileWithOfficialFx(),
    );
    const verificationId =
      getRegionalIntelligenceRepository().verifyAvailability({
        ...body,
        notes: body.notes ?? "",
      }, profile);
    return Response.json({ verificationId }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Availability could not be verified.",
      },
      { status: 400 },
    );
  }
}
