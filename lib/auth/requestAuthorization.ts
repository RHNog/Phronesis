import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthMode, getAuthRuntimeStatus } from "@/lib/auth/config";
import type {
  AuthorizationDecision,
  ModuleAccessLevel,
  PhronesisModule,
} from "@/lib/auth/domain";
import { PHRONESIS_MODULES } from "@/lib/auth/domain";
import { getAuthorizationRepository, getAuthServer } from "@/lib/auth/server";

function compatibilityDecision(
  module: PhronesisModule,
  requiredAccess: ModuleAccessLevel,
): AuthorizationDecision {
  return {
    allowed: true,
    reason: "AUTH_DISABLED",
    userId: null,
    workspaceId: null,
    membershipId: null,
    role: null,
    module,
    requiredAccess,
    assignedAccess: "ADMIN",
  };
}

function deniedDecision(
  module: PhronesisModule,
  requiredAccess: ModuleAccessLevel,
  reason: "AUTH_NOT_CONFIGURED" | "UNAUTHENTICATED",
): AuthorizationDecision {
  return {
    allowed: false,
    reason,
    userId: null,
    workspaceId: null,
    membershipId: null,
    role: null,
    module,
    requiredAccess,
    assignedAccess: null,
  };
}

export async function authorizeHeaders(
  requestHeaders: Headers,
  module: PhronesisModule,
  requiredAccess: ModuleAccessLevel,
): Promise<AuthorizationDecision> {
  const status = getAuthRuntimeStatus();
  if (status.mode === "DISABLED") return compatibilityDecision(module, requiredAccess);
  if (!status.readyForRequiredMode) {
    return status.mode === "OPTIONAL"
      ? compatibilityDecision(module, requiredAccess)
      : deniedDecision(module, requiredAccess, "AUTH_NOT_CONFIGURED");
  }
  const session = await getAuthServer().api.getSession({ headers: requestHeaders });
  if (!session?.user.id) {
    return status.mode === "OPTIONAL"
      ? compatibilityDecision(module, requiredAccess)
      : deniedDecision(module, requiredAccess, "UNAUTHENTICATED");
  }
  return getAuthorizationRepository().authorize(session.user.id, module, requiredAccess);
}

export async function authorizeRequest(
  request: Request,
  module: PhronesisModule,
  requiredAccess: ModuleAccessLevel = "VIEW",
): Promise<AuthorizationDecision> {
  return authorizeHeaders(request.headers, module, requiredAccess);
}

export async function authorizeIdentityRequired(
  request: Request,
  module: PhronesisModule,
  requiredAccess: ModuleAccessLevel,
): Promise<AuthorizationDecision> {
  const status = getAuthRuntimeStatus();
  if (!status.readyForRequiredMode) {
    return deniedDecision(module, requiredAccess, "AUTH_NOT_CONFIGURED");
  }
  const session = await getAuthServer().api.getSession({ headers: request.headers });
  if (!session?.user.id) return deniedDecision(module, requiredAccess, "UNAUTHENTICATED");
  return getAuthorizationRepository().authorize(session.user.id, module, requiredAccess);
}

export function authorizationErrorResponse(decision: AuthorizationDecision): Response {
  const status = decision.reason === "UNAUTHENTICATED" ? 401 : 403;
  return Response.json(
    {
      error: status === 401 ? "Authentication required." : "Access denied.",
      reason: decision.reason,
      module: decision.module,
      requiredAccess: decision.requiredAccess,
    },
    { status },
  );
}

export async function requirePageModule(
  module: PhronesisModule,
  requiredAccess: ModuleAccessLevel = "VIEW",
): Promise<AuthorizationDecision> {
  const decision = await authorizeHeaders(await headers(), module, requiredAccess);
  if (!decision.allowed) {
    const destination = decision.reason === "UNAUTHENTICATED" || decision.reason === "AUTH_NOT_CONFIGURED"
      ? "/sign-in"
      : "/access-denied";
    redirect(destination);
  }
  return decision;
}

export async function getVisibleModules(): Promise<readonly PhronesisModule[]> {
  const mode = getAuthMode();
  const status = getAuthRuntimeStatus();
  if (mode === "DISABLED" || (mode === "OPTIONAL" && !status.readyForRequiredMode)) {
    return PHRONESIS_MODULES;
  }
  if (!status.readyForRequiredMode) return [];
  const session = await getAuthServer().api.getSession({ headers: await headers() });
  if (!session?.user.id) return mode === "OPTIONAL" ? PHRONESIS_MODULES : [];
  const profile = getAuthorizationRepository().getMembershipProfile(session.user.id);
  if (!profile || profile.status !== "ACTIVE") return [];
  return profile.entitlements.map((entitlement) => entitlement.module);
}
