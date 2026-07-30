import { getDurableArtworkCache, isApprovedArtworkSource } from "@/lib/artwork/DurableArtworkCache";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("source") ?? "";
  if (!source || source.length > 2_048 || !isApprovedArtworkSource(source)) {
    return new Response("Invalid artwork source.", { status: 400 });
  }
  try {
    const artwork = await getDurableArtworkCache().get(source);
    return new Response(new Uint8Array(artwork.bytes).buffer, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(artwork.metadata.byteLength),
        "Content-Type": artwork.metadata.contentType,
        ETag: `"${artwork.metadata.contentSha256}"`,
        "X-Phronesis-Artwork-Source": artwork.metadata.sourceHost,
      },
    });
  } catch {
    return new Response("Artwork unavailable.", { status: 502 });
  }
}
