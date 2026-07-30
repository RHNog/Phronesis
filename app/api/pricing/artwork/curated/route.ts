import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { curatedArtworkUrl, getCuratedArtworkStore } from "@/lib/artwork/CuratedArtworkStore";
import { getPricingRepository } from "@/lib/pricing/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const categoryId = url.searchParams.get("category") ?? "";
  const sku = url.searchParams.get("sku") ?? "";
  try {
    const artwork = await getCuratedArtworkStore().get(categoryId, sku);
    return new Response(new Uint8Array(artwork.bytes).buffer, {
      headers: {
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Length": String(artwork.metadata.byteLength),
        "Content-Type": artwork.metadata.contentType,
        ETag: `"${artwork.metadata.contentSha256}"`,
      },
    });
  } catch {
    return new Response("Curated artwork unavailable.", { status: 404 });
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "ADMINISTRATION", "ADMIN");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  try {
    const form = await request.formData();
    const categoryId = String(form.get("category") ?? "");
    const sku = String(form.get("sku") ?? "");
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("Artwork file is required.");
    if (!getPricingRepository().findBySku(categoryId, sku)) throw new Error("Exact catalogue product was not found.");
    await getCuratedArtworkStore().put(categoryId, sku, new Uint8Array(await file.arrayBuffer()), file.type);
    return Response.json({ url: curatedArtworkUrl(categoryId, sku) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Artwork could not be stored." }, { status: 400 });
  }
}
