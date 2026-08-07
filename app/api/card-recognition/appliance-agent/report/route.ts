import { NextResponse } from "next/server";
import { bearerToken } from "@/lib/cardRecognition/scannerAppliance";
import { getCardRecognitionRepository, getScannerApplianceRepository } from "@/lib/cardRecognition/server";

export const runtime = "nodejs";
const maximumRequestBytes = 16_384;

export async function POST(request: Request) {
  const repository = getScannerApplianceRepository();
  let applianceId: string;
  try {
    applianceId = repository.authenticate(bearerToken(request)).applianceId;
  } catch {
    return NextResponse.json({ error: "Scanner appliance authentication failed." }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > maximumRequestBytes) throw new Error("scanner report request is too large");
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > maximumRequestBytes) throw new Error("scanner report request is too large");
    const input = JSON.parse(body) as Record<string, unknown>;
    const outcome = String(input.outcome ?? "").toUpperCase();
    if (!new Set(["RUNNING", "SUCCEEDED", "FAILED"]).has(outcome)) throw new Error("scanner command outcome is invalid");
    const command = repository.report({
      applianceId,
      commandId: String(input.commandId ?? ""),
      outcome: outcome as "RUNNING" | "SUCCEEDED" | "FAILED",
      error: input.error,
      result: input.result,
    });
    if (outcome !== "RUNNING" && command.kind === "START") {
      getCardRecognitionRepository().reconcileSessionState(command.sessionId);
    }
    return NextResponse.json({ command }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scanner command report failed." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
