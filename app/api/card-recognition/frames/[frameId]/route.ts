import { readFile } from "node:fs/promises";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getCardRecognitionRepository } from "@/lib/cardRecognition/server";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ frameId: string }> }) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const { frameId } = await context.params;
    const object = getCardRecognitionRepository().frameObject(decodeURIComponent(frameId));
    return new Response(await readFile(object.path), { headers: { "content-type": object.mediaType, "cache-control": "private, max-age=31536000, immutable", etag: `"${object.sha256}"` } });
  } catch {
    return Response.json({ error: "Scan frame not found." }, { status: 404 });
  }
}
