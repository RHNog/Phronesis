import { getAuthRuntimeStatus } from "@/lib/auth/config";
import { getAuthServer } from "@/lib/auth/server";

export const runtime = "nodejs";

async function handle(request: Request): Promise<Response> {
  const status = getAuthRuntimeStatus();
  if (!status.readyForRequiredMode) {
    return Response.json(
      { error: "Private authentication is not configured on this Phronesis instance." },
      { status: 503 },
    );
  }
  return getAuthServer().handler(request);
}

export const GET = handle;
export const POST = handle;
