import { NextResponse } from "next/server";
import { bearerToken } from "@/lib/cardRecognition/scannerAppliance";
import { getScannerApplianceRepository } from "@/lib/cardRecognition/server";

export const runtime = "nodejs";
const maximumRequestBytes = 16_384;

function authenticationFailure(): Response {
  return NextResponse.json({ error: "Scanner appliance authentication failed." }, { status: 401, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const repository = getScannerApplianceRepository();
  let applianceId: string;
  try {
    applianceId = repository.authenticate(bearerToken(request)).applianceId;
  } catch {
    return authenticationFailure();
  }
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > maximumRequestBytes) throw new Error("scanner poll request is too large");
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > maximumRequestBytes) throw new Error("scanner poll request is too large");
    const input = JSON.parse(body) as Record<string, unknown>;
    const appliance = repository.heartbeat({
      applianceId,
      driverReady: input.driverReady === true,
      capabilities: input.capabilities,
      lastError: input.lastError,
      agentVersion: input.agentVersion,
    });
    const command = repository.poll({
      applianceId,
      currentCommandId: typeof input.currentCommandId === "string" ? input.currentCommandId : null,
    });
    return NextResponse.json({ appliance, command }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scanner poll failed." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
