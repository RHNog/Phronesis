import { NextResponse } from "next/server";
import { bearerToken, scannerApplianceMaxFrameBytes } from "@/lib/cardRecognition/scannerAppliance";
import { getCardRecognitionRepository, getScannerApplianceRepository } from "@/lib/cardRecognition/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isSafeInteger(contentLength) || contentLength < 1 || contentLength > scannerApplianceMaxFrameBytes) {
      return NextResponse.json({ error: "Frame byte length is outside the allowed range." }, { status: 413 });
    }
    const repository = getScannerApplianceRepository();
    const identity = repository.authenticate(bearerToken(request));
    const bytes = new Uint8Array(await request.arrayBuffer());
    const result = repository.ingestFrontFrame({
      recognition: getCardRecognitionRepository(),
      applianceId: identity.applianceId,
      commandId: request.headers.get("x-phronesis-command-id") ?? "",
      sequence: Number(request.headers.get("x-phronesis-frame-sequence") ?? ""),
      mediaType: (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase(),
      bytes,
      declaredSha256: request.headers.get("x-phronesis-sha256") ?? "",
      capturedAt: request.headers.get("x-phronesis-captured-at") ?? "",
    });
    return NextResponse.json(result, { status: result.status === "IMPORTED" ? 201 : 200, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scanner frame upload failed.";
    const status = message.includes("authentication") ? 401 : message.includes("byte length") ? 413 : 400;
    return NextResponse.json({ error: message }, { status, headers: { "cache-control": "no-store" } });
  }
}
