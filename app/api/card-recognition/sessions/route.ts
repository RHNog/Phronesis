import { NextResponse } from "next/server";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getCardRecognitionRepository } from "@/lib/cardRecognition/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  return NextResponse.json({ sessions: getCardRecognitionRepository().listSessions() });
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "OPERATE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const input = await request.json() as { label?: unknown };
    const label = typeof input.label === "string" ? input.label.trim().slice(0, 120) : "";
    const repository = getCardRecognitionRepository();
    const id = repository.createSession(label || "Scanner intake");
    return NextResponse.json({ session: repository.sessionSummary(id) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A scan session could not be created." }, { status: 400 });
  }
}
