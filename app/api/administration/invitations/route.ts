import { authorizationErrorResponse, authorizeIdentityRequired } from "@/lib/auth/requestAuthorization";
import { getAuthorizationRepository } from "@/lib/auth/server";
import {
  MEMBERSHIP_ROLES,
  MODULE_ACCESS_LEVELS,
  PHRONESIS_MODULES,
  type MembershipRole,
  type ModuleEntitlement,
} from "@/lib/auth/domain";

function parseInvitationBody(value: unknown): {
  email: string;
  role: MembershipRole;
  entitlements?: ModuleEntitlement[];
} | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (typeof body.email !== "string" || !MEMBERSHIP_ROLES.includes(body.role as MembershipRole)) return null;
  if (body.entitlements === undefined) return { email: body.email, role: body.role as MembershipRole };
  if (!Array.isArray(body.entitlements)) return null;
  const entitlements: ModuleEntitlement[] = [];
  for (const entry of body.entitlements) {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as Record<string, unknown>;
    if (!PHRONESIS_MODULES.includes(candidate.module as ModuleEntitlement["module"])) return null;
    if (!MODULE_ACCESS_LEVELS.includes(candidate.access as ModuleEntitlement["access"])) return null;
    entitlements.push({
      module: candidate.module as ModuleEntitlement["module"],
      access: candidate.access as ModuleEntitlement["access"],
    });
  }
  return { email: body.email, role: body.role as MembershipRole, entitlements };
}

export async function POST(request: Request) {
  const authorization = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!authorization.allowed || !authorization.userId || !authorization.workspaceId) {
    return authorizationErrorResponse(authorization);
  }
  const body = parseInvitationBody(await request.json().catch(() => null));
  if (!body) return Response.json({ error: "Invalid invitation request." }, { status: 400 });
  try {
    const invitation = getAuthorizationRepository().createInvitation({
      ...body,
      actorUserId: authorization.userId,
      requireActivation: true,
      workspaceId: authorization.workspaceId,
    });
    return Response.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      entitlements: invitation.entitlements,
      expiresAt: invitation.expiresAt,
      activationCode: invitation.activationCode,
    }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invitation could not be created." },
      { status: 400 },
    );
  }
}
