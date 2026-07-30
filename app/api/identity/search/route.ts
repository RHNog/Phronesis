import { NextResponse } from "next/server";
import { IdentityOrchestrator } from "@/lib/engines/identity/IdentityOrchestrator";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const response = await new IdentityOrchestrator().search(query);

  return NextResponse.json({
    intent: response.intent,
    message: response.message,
    orchestrationDiagnostics: response.orchestrationDiagnostics,
    results: response.results,
    status: response.status,
  });
}
