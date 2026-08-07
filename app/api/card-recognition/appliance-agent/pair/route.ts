import { NextResponse } from "next/server";
import { getScannerApplianceRepository } from "@/lib/cardRecognition/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 16_384) throw new Error("pairing request is too large");
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 16_384) throw new Error("pairing request is too large");
    const input = JSON.parse(body) as Record<string, unknown>;
    const result = getScannerApplianceRepository().redeemPairing({
      code: String(input.code ?? ""),
      label: String(input.label ?? ""),
      platform: input.platform,
      adapter: input.adapter,
      agentVersion: String(input.agentVersion ?? ""),
      capabilities: input.capabilities,
    });
    return NextResponse.json(result, { status: 201, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Pairing code is invalid or expired." }, { status: 400, headers: { "cache-control": "no-store" } });
  }
}
