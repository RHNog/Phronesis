import { authorizationErrorResponse, authorizeIdentityRequired } from "@/lib/auth/requestAuthorization";
import { getAuthorizationRepository } from "@/lib/auth/server";
import {
  MODULE_ACCESS_LEVELS,
  PHRONESIS_MODULES,
  type ModuleEntitlement,
} from "@/lib/auth/domain";

function parseEntitlements(value: unknown): ModuleEntitlement[] | null {
  if (!value || typeof value !== "object") return null;
  const entries = (value as Record<string, unknown>).entitlements;
  if (!Array.isArray(entries)) return null;
  const entitlements: ModuleEntitlement[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as Record<string, unknown>;
    if (!PHRONESIS_MODULES.includes(candidate.module as ModuleEntitlement["module"])) return null;
    if (!MODULE_ACCESS_LEVELS.includes(candidate.access as ModuleEntitlement["access"])) return null;
    entitlements.push({
      module: candidate.module as ModuleEntitlement["module"],
      access: candidate.access as ModuleEntitlement["access"],
    });
  }
  return entitlements;
}

export async function PUT(request: Request, context: RouteContext<"/api/administration/memberships/[id]/entitlements">) {
  const authorization = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!authorization.allowed || !authorization.userId) return authorizationErrorResponse(authorization);
  const entitlements = parseEntitlements(await request.json().catch(() => null));
  if (!entitlements) return Response.json({ error: "Invalid entitlement request." }, { status: 400 });
  const { id } = await context.params;
  try {
    getAuthorizationRepository().setEntitlements({
      actorUserId: authorization.userId,
      membershipId: id,
      entitlements,
    });
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Entitlements could not be updated." },
      { status: 400 },
    );
  }
}
