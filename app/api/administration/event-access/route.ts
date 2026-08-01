import { authorizationErrorResponse, authorizeIdentityRequired } from "@/lib/auth/requestAuthorization";
import { getAuthDatabase, getEventAccessRepository } from "@/lib/auth/server";
import type { ModuleEntitlement } from "@/lib/auth/domain";

export async function GET(request: Request) {
  const auth = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!auth.allowed || !auth.workspaceId) return authorizationErrorResponse(auth);
  const event = getAuthDatabase().prepare("SELECT id,name,event_date FROM phronesis_purchase_event WHERE workspace_id=? AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1").get(auth.workspaceId);
  return Response.json({ event: event ?? null, grants: getEventAccessRepository().listGrants(auth.workspaceId) });
}

export async function POST(request: Request) {
  const auth = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!auth.allowed || !auth.workspaceId || !auth.userId) return authorizationErrorResponse(auth);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.eventId !== "string" || typeof body.workerLabel !== "string" || !Array.isArray(body.entitlements)) return Response.json({ error: "Invalid event access request." }, { status: 400 });
  try {
    const grant = getEventAccessRepository().createGrant({ workspaceId: auth.workspaceId, eventId: body.eventId, workerLabel: body.workerLabel, durationHours: Number(body.durationHours), entitlements: body.entitlements as ModuleEntitlement[], actorUserId: auth.userId });
    return Response.json(grant, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Event access could not be created." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const auth = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!auth.allowed || !auth.workspaceId || !auth.userId) return authorizationErrorResponse(auth);
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Grant id is required." }, { status: 400 });
  return Response.json({ revoked: getEventAccessRepository().revoke(auth.workspaceId, id, auth.userId) });
}
