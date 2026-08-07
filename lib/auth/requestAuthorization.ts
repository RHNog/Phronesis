import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuthMode, getAuthRuntimeStatus } from "@/lib/auth/config";
import type {
  AccountSummary,
  AuthorizationDecision,
  ModuleAccessLevel,
  PhronesisModule,
} from "@/lib/auth/domain";
import { PHRONESIS_MODULES } from "@/lib/auth/domain";
import { EVENT_ACCESS_COOKIE } from "@/lib/auth/constants";
import { getAuthorizationRepository, getAuthServer, getEventAccessRepository } from "@/lib/auth/server";

export type ActiveMemberIdentity = {
  userId: string;
  workspaceId: string;
  membershipId: string;
  role: NonNullable<AuthorizationDecision["role"]>;
  name: string;
  email: string;
};

export type ActiveMemberDecision =
  | { allowed: true; reason: "AUTHORIZED"; identity: ActiveMemberIdentity }
  | {
      allowed: false;
      reason:
        | "AUTH_NOT_CONFIGURED"
        | "UNAUTHENTICATED"
        | "NO_ACTIVE_MEMBERSHIP";
      identity: null;
    };

function cookieValue(headers: Headers, name: string): string | null {
  const match = headers.get("cookie")?.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function isPublicEventIngress(requestHeaders: Headers): boolean {
  return requestHeaders.get("x-phronesis-public-event") === "1";
}

function isRestrictedPublicIngress(requestHeaders: Headers): boolean {
  return requestHeaders.get("x-phronesis-restricted-public") === "1";
}

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
  if (isRestrictedPublicIngress(requestHeaders)) {
    const status = getAuthRuntimeStatus();
    if (!status.readyForRequiredMode) {
      return deniedDecision(module, requiredAccess, "AUTH_NOT_CONFIGURED");
    }
    const session = await getAuthServer().api.getSession({ headers: requestHeaders });
    if (!session?.user.id) return deniedDecision(module, requiredAccess, "UNAUTHENTICATED");
    return getAuthorizationRepository().authorize(session.user.id, module, requiredAccess);
  }
  if (isPublicEventIngress(requestHeaders)) {
    const eventToken = cookieValue(requestHeaders, EVENT_ACCESS_COOKIE);
    if (eventToken) {
      const eventDecision = getEventAccessRepository().authorize(eventToken, module, requiredAccess);
      if (eventDecision) return eventDecision;
    }
    return deniedDecision(module, requiredAccess, "UNAUTHENTICATED");
  }
  const status = getAuthRuntimeStatus();
  if (status.mode === "DISABLED") return compatibilityDecision(module, requiredAccess);
  if (!status.readyForRequiredMode) {
    return status.mode === "OPTIONAL"
      ? compatibilityDecision(module, requiredAccess)
      : deniedDecision(module, requiredAccess, "AUTH_NOT_CONFIGURED");
  }
  const session = await getAuthServer().api.getSession({ headers: requestHeaders });
  if (session?.user.id) return getAuthorizationRepository().authorize(session.user.id, module, requiredAccess);
  const eventToken = cookieValue(requestHeaders, EVENT_ACCESS_COOKIE);
  if (eventToken) {
    const eventDecision = getEventAccessRepository().authorize(eventToken, module, requiredAccess);
    if (eventDecision) return eventDecision;
  }
  if (!session?.user.id) {
    return status.mode === "OPTIONAL"
      ? compatibilityDecision(module, requiredAccess)
      : deniedDecision(module, requiredAccess, "UNAUTHENTICATED");
  }
  return deniedDecision(module, requiredAccess, "UNAUTHENTICATED");
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

export async function authorizeActiveMemberHeaders(
  requestHeaders: Headers,
): Promise<ActiveMemberDecision> {
  const status = getAuthRuntimeStatus();
  if (!status.readyForRequiredMode) {
    return {
      allowed: false,
      reason: "AUTH_NOT_CONFIGURED",
      identity: null,
    };
  }
  const session = await getAuthServer().api.getSession({
    headers: requestHeaders,
  });
  if (!session?.user.id) {
    return { allowed: false, reason: "UNAUTHENTICATED", identity: null };
  }
  const profile = getAuthorizationRepository().getMembershipProfile(
    session.user.id,
  );
  if (!profile || profile.status !== "ACTIVE") {
    return {
      allowed: false,
      reason: "NO_ACTIVE_MEMBERSHIP",
      identity: null,
    };
  }
  return {
    allowed: true,
    reason: "AUTHORIZED",
    identity: {
      userId: session.user.id,
      workspaceId: profile.workspaceId,
      membershipId: profile.id,
      role: profile.role,
      name: session.user.name,
      email: session.user.email,
    },
  };
}

export function activeMemberErrorResponse(
  decision: Exclude<ActiveMemberDecision, { allowed: true }>,
): Response {
  const status = decision.reason === "UNAUTHENTICATED" ? 401 : 403;
  return Response.json(
    {
      error:
        status === 401
          ? "Authentication required."
          : "An active permanent membership is required.",
      reason: decision.reason,
    },
    { status },
  );
}

export async function requireActiveMemberPage(): Promise<ActiveMemberIdentity> {
  const decision = await authorizeActiveMemberHeaders(await headers());
  if (!decision.allowed) {
    redirect(
      decision.reason === "NO_ACTIVE_MEMBERSHIP"
        ? "/access-pending"
        : "/sign-in",
    );
  }
  return decision.identity;
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
      : decision.reason === "NO_ACTIVE_MEMBERSHIP"
        ? "/access-pending"
        : "/access-denied";
    redirect(destination);
  }
  return decision;
}

export async function getAccountSummary(): Promise<AccountSummary | null> {
  const status = getAuthRuntimeStatus();
  if (!status.readyForRequiredMode) return null;
  const session = await getAuthServer().api.getSession({ headers: await headers() });
  if (!session?.user.id) return null;
  return { name: session.user.name, email: session.user.email };
}

export async function getVisibleModules(): Promise<readonly PhronesisModule[]> {
  const requestHeaders = await headers();
  if (isRestrictedPublicIngress(requestHeaders)) {
    const status = getAuthRuntimeStatus();
    if (!status.readyForRequiredMode) return [];
    const session = await getAuthServer().api.getSession({ headers: requestHeaders });
    if (!session?.user.id) return [];
    const profile = getAuthorizationRepository().getMembershipProfile(session.user.id);
    if (!profile || profile.status !== "ACTIVE") return [];
    return profile.entitlements.map((entitlement) => entitlement.module);
  }
  if (isPublicEventIngress(requestHeaders)) {
    const eventToken = cookieValue(requestHeaders, EVENT_ACCESS_COOKIE);
    if (!eventToken) return [];
    return PHRONESIS_MODULES.filter((module) =>
      getEventAccessRepository().authorize(eventToken, module, "VIEW")?.allowed,
    );
  }
  const mode = getAuthMode();
  const status = getAuthRuntimeStatus();
  if (mode === "DISABLED" || (mode === "OPTIONAL" && !status.readyForRequiredMode)) {
    return PHRONESIS_MODULES;
  }
  if (!status.readyForRequiredMode) return [];
  const session = await getAuthServer().api.getSession({ headers: requestHeaders });
  if (!session?.user.id) {
    const eventToken = cookieValue(requestHeaders, EVENT_ACCESS_COOKIE);
    if (eventToken) {
      return PHRONESIS_MODULES.filter((module) =>
        getEventAccessRepository().authorize(eventToken, module, "VIEW")?.allowed,
      );
    }
    return mode === "OPTIONAL" ? PHRONESIS_MODULES : [];
  }
  const profile = getAuthorizationRepository().getMembershipProfile(session.user.id);
  if (!profile || profile.status !== "ACTIVE") return [];
  return profile.entitlements.map((entitlement) => entitlement.module);
}
