import {
  activeMemberErrorResponse,
  authorizeActiveMemberHeaders,
} from "@/lib/auth/requestAuthorization";
import { getRegionalIntelligenceRepository } from "@/lib/regional/server";
import type { PersonalCostField } from "@/lib/user-settings/domain";
import { getUserMarketSettingsRepository } from "@/lib/user-settings/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeActiveMemberHeaders(request.headers);
  if (!authorization.allowed) return activeMemberErrorResponse(authorization);
  const { userId, workspaceId } = authorization.identity;
  return Response.json({
    settings: getUserMarketSettingsRepository().get(
      workspaceId,
      userId,
      getRegionalIntelligenceRepository().getProfile(),
    ),
  });
}

export async function PATCH(request: Request) {
  const authorization = await authorizeActiveMemberHeaders(request.headers);
  if (!authorization.allowed) return activeMemberErrorResponse(authorization);
  try {
    const body = (await request.json()) as {
      enabledProviderIds?: unknown;
      costOverrides?: Partial<Record<PersonalCostField, unknown>>;
    };
    if (!Array.isArray(body.enabledProviderIds)) {
      throw new Error("Select at least one market provider.");
    }
    if (
      !body.costOverrides ||
      typeof body.costOverrides !== "object" ||
      Array.isArray(body.costOverrides)
    ) {
      throw new Error("A personal cost structure is required.");
    }
    const { userId, workspaceId } = authorization.identity;
    return Response.json({
      settings: getUserMarketSettingsRepository().update({
        workspaceId,
        userId,
        enabledProviderIds: body.enabledProviderIds,
        costOverrides: body.costOverrides,
        workspaceProfile: getRegionalIntelligenceRepository().getProfile(),
      }),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Personal settings could not be saved.",
      },
      { status: 400 },
    );
  }
}
