import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import type { RegionalCostProfile } from "@/lib/regional/domain";
import { getRegionalIntelligenceRepository } from "@/lib/regional/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "INTELLIGENCE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  return Response.json({
    profile: getRegionalIntelligenceRepository().getProfile(),
  });
}

export async function PATCH(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "INTELLIGENCE",
    "ADMIN",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const profile = (await request.json()) as RegionalCostProfile;
    return Response.json({
      profile: getRegionalIntelligenceRepository().updateProfile(profile),
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Regional profile could not be saved.",
      },
      { status: 400 },
    );
  }
}
