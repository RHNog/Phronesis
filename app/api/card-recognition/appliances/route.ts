import { NextResponse } from "next/server";
import {
  authorizationErrorResponse,
  authorizeIdentityRequired,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import { getCardRecognitionRepository, getScannerApplianceRepository } from "@/lib/cardRecognition/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  return NextResponse.json(
    { appliances: getScannerApplianceRepository().listAppliances() },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  try {
    const input = await request.json() as Record<string, unknown>;
    const action = String(input.action ?? "").trim().toUpperCase();
    const repository = getScannerApplianceRepository();
    if (action === "CREATE_PAIRING" || action === "REVOKE") {
      const authorization = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
      if (!authorization.allowed) return authorizationErrorResponse(authorization);
      if (!authorization.userId || !authorization.membershipId) {
        return NextResponse.json({ error: "A permanent administrator membership is required." }, { status: 403 });
      }
      if (action === "CREATE_PAIRING") {
        return NextResponse.json({ pairing: repository.createPairing(authorization.userId) }, { status: 201, headers: { "cache-control": "no-store" } });
      }
      const appliance = repository.revoke(String(input.applianceId ?? ""));
      return NextResponse.json({ appliance });
    }
    const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "OPERATE");
    if (!authorization.allowed) return authorizationErrorResponse(authorization);
    const createdByUserId = authorization.userId ?? "compatibility-owner";
    const applianceId = String(input.applianceId ?? "");
    const sessionId = String(input.sessionId ?? "");
    if (action === "START") {
      return NextResponse.json({ command: repository.queueStart({ applianceId, sessionId, createdByUserId }) }, { status: 201 });
    }
    if (action === "CANCEL") {
      const command = repository.queueCancel({ applianceId, sessionId, createdByUserId });
      const session = getCardRecognitionRepository().cancelSession(sessionId);
      return NextResponse.json({ command, session }, { status: 201 });
    }
    return NextResponse.json({ error: "Scanner appliance action is unsupported." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scanner appliance action failed." }, { status: 400 });
  }
}
