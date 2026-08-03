import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { getDurableArtworkCache, isApprovedArtworkSource } from "@/lib/artwork/DurableArtworkCache";
import { getPricingRepository } from "@/lib/pricing/server";
import type { ArtworkReviewState } from "@/lib/pricing/repository";
import {
  runAssistedSealedArtworkRecovery,
  stageSealedArtworkReview,
} from "@/lib/providers/community/SealedArtworkReview";

export const runtime = "nodejs";

const states = new Set<ArtworkReviewState>(["PENDING", "ACCEPTED", "REJECTED"]);

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "ADMINISTRATION", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "";
  if (source) {
    if (source.length > 2_048 || !isApprovedArtworkSource(source)) return new Response("Invalid artwork source.", { status: 400 });
    try {
      const artwork = await getDurableArtworkCache().get(source);
      return new Response(new Uint8Array(artwork.bytes).buffer, {
        headers: {
          "Cache-Control": "private, max-age=31536000, immutable",
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
  const requestedState = (url.searchParams.get("state") ?? "PENDING").toUpperCase() as ArtworkReviewState;
  const state = states.has(requestedState) ? requestedState : "PENDING";
  const queue = getPricingRepository().getArtworkReviewQueue({
    categoryId: "pokemon-en",
    state,
    query: url.searchParams.get("q") ?? "",
    limit: Number(url.searchParams.get("limit") ?? 8),
    offset: Number(url.searchParams.get("offset") ?? 0),
  });
  return Response.json(queue, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "ADMINISTRATION", "ADMIN");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action.toUpperCase() : "";
  try {
    if (action === "REFRESH") {
      return Response.json(await stageSealedArtworkReview(getPricingRepository()), {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    if (action === "ASSIST") {
      return Response.json(await runAssistedSealedArtworkRecovery(getPricingRepository(), { dryRun: false }), {
        headers: { "Cache-Control": "private, no-store" },
      });
    }
    if (!new Set(["ACCEPT", "REJECT", "RESTORE", "UNDO"]).has(action)) {
      throw new Error("Unsupported artwork review action.");
    }
    const categoryId = String(body?.categoryId ?? "");
    const sku = String(body?.sku ?? "");
    const sourceUrl = String(body?.sourceUrl ?? "");
    if (categoryId !== "pokemon-en" || !sku || !isApprovedArtworkSource(sourceUrl)) {
      throw new Error("A valid Pokémon sealed candidate is required.");
    }
    getPricingRepository().decideArtworkReview({
      action: action as "ACCEPT" | "REJECT" | "RESTORE" | "UNDO",
      categoryId,
      sku,
      sourceUrl,
      actorUserId: authorization.userId ?? "legacy-local-owner",
      note: typeof body?.note === "string" ? body.note : undefined,
    });
    return Response.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Artwork review could not be recorded." },
      { status: 400 },
    );
  }
}
