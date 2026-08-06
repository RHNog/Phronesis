import { authorizationErrorResponse, authorizeIdentityRequired } from "@/lib/auth/requestAuthorization";
import { getAuthorizationRepository } from "@/lib/auth/server";
import {
  MEMBERSHIP_ROLES,
  MODULE_ACCESS_LEVELS,
  PHRONESIS_MODULES,
  type MembershipRole,
  type ModuleEntitlement,
} from "@/lib/auth/domain";

type ApprovalBody = {
  action: "APPROVE";
  requestId: string;
  role: Exclude<MembershipRole, "OWNER">;
  entitlements: ModuleEntitlement[];
};

type RejectionBody = {
  action: "REJECT";
  requestId: string;
};

function parseBody(value: unknown): ApprovalBody | RejectionBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (typeof body.requestId !== "string" || !body.requestId.trim()) return null;
  if (body.action === "REJECT") return { action: "REJECT", requestId: body.requestId };
  if (body.action !== "APPROVE" || !MEMBERSHIP_ROLES.includes(body.role as MembershipRole) || body.role === "OWNER" || !Array.isArray(body.entitlements)) return null;
  const entitlements: ModuleEntitlement[] = [];
  for (const entry of body.entitlements) {
    if (!entry || typeof entry !== "object") return null;
    const candidate = entry as Record<string, unknown>;
    if (!PHRONESIS_MODULES.includes(candidate.module as ModuleEntitlement["module"]) || !MODULE_ACCESS_LEVELS.includes(candidate.access as ModuleEntitlement["access"])) return null;
    entitlements.push({
      module: candidate.module as ModuleEntitlement["module"],
      access: candidate.access as ModuleEntitlement["access"],
    });
  }
  if (!entitlements.length) return null;
  return {
    action: "APPROVE",
    requestId: body.requestId,
    role: body.role as Exclude<MembershipRole, "OWNER">,
    entitlements,
  };
}

export async function GET(request: Request) {
  const authorization = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!authorization.allowed || !authorization.userId) return authorizationErrorResponse(authorization);
  try {
    return Response.json({ requests: getAuthorizationRepository().listAccessRequests(authorization.userId) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Access requests could not be loaded." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!authorization.allowed || !authorization.userId) return authorizationErrorResponse(authorization);
  const body = parseBody(await request.json().catch(() => null));
  if (!body) return Response.json({ error: "Invalid access-request decision." }, { status: 400 });
  try {
    if (body.action === "REJECT") {
      getAuthorizationRepository().rejectAccessRequest({
        actorUserId: authorization.userId,
        requestId: body.requestId,
      });
      return Response.json({ success: true });
    }
    const membership = getAuthorizationRepository().approveAccessRequest({
      actorUserId: authorization.userId,
      requestId: body.requestId,
      role: body.role,
      entitlements: body.entitlements,
    });
    return Response.json({ membership });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Access request could not be decided." }, { status: 400 });
  }
}
