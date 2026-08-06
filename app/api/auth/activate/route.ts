import { createHash } from "node:crypto";
import { getAuthorizationRepository } from "@/lib/auth/server";

export const runtime = "nodejs";

function requestBucket(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identity = forwarded || request.headers.get("x-real-ip") || "private-local";
  return createHash("sha256").update(identity).digest("hex");
}

export async function POST(request: Request) {
  const repository = getAuthorizationRepository();
  const bucket = requestBucket(request);
  try {
    repository.assertActivationRateLimit(bucket);
    const body = await request.json().catch(() => null) as { code?: unknown } | null;
    if (!body || typeof body.code !== "string") throw new Error("Activation code is required.");
    const invitation = repository.redeemActivationCode(body.code);
    repository.recordActivationAttempt(bucket, true);
    return Response.json({ email: invitation.email, expiresAt: invitation.expiresAt });
  } catch (error) {
    repository.recordActivationAttempt(bucket, false);
    return Response.json(
      { error: error instanceof Error ? error.message : "Activation failed." },
      { status: 400 },
    );
  }
}
