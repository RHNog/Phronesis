import { authorizationErrorResponse, authorizeIdentityRequired } from "@/lib/auth/requestAuthorization";
import { getAuthorizationRepository } from "@/lib/auth/server";

export async function GET(request: Request) {
  const authorization = await authorizeIdentityRequired(request, "ADMINISTRATION", "VIEW");
  if (!authorization.allowed || !authorization.userId) return authorizationErrorResponse(authorization);
  return Response.json({ memberships: getAuthorizationRepository().listMemberships(authorization.userId) });
}
