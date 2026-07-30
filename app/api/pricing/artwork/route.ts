import { NextResponse } from "next/server";
import { pricingLookupConfig } from "@/config/pricingLookup";
import { providerArtworkQuery, resolveOnePieceSnapshotArtwork, resolveSnapshotArtwork } from "@/lib/pricing/artwork";
import { getPricingRepository } from "@/lib/pricing/server";
import { ScryfallProvider } from "@/lib/providers/identity/ScryfallProvider";
import { TcgdexProvider } from "@/lib/providers/tcgdex/TcgdexProvider";
import { LorcastProvider } from "@/lib/providers/lorcast/LorcastProvider";
import { BandaiOnePieceProvider } from "@/lib/providers/bandai/BandaiOnePieceProvider";
import { durableArtworkUrls } from "@/lib/artwork/DurableArtworkCache";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";

export const runtime = "nodejs";

const scryfall = new ScryfallProvider();
const pokemon = new TcgdexProvider();
const lorcast = new LorcastProvider();
const onePiece = new BandaiOnePieceProvider();

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const categoryId = url.searchParams.get("category") ?? "magic-en";
  if (categoryId === "riftbound-en") {
    return NextResponse.json({ artwork: {}, status: "AUTHORIZATION_REQUIRED" });
  }
  if (!new Set(["magic-en", "pokemon-en", "onepiece-en", "lorcana-en"]).has(categoryId)) {
    return NextResponse.json({ artwork: {}, status: "NOT_SUPPORTED" });
  }
  if (query.length < pricingLookupConfig.minimumQueryLength) {
    return NextResponse.json({ artwork: {}, status: "NO_QUERY" });
  }
  try {
    const pricing = getPricingRepository().search(categoryId, query);
    const matches = [...pricing.singles, ...pricing.sealed];
    const providerQuery = providerArtworkQuery(categoryId, query, matches);
    const provider = categoryId === "magic-en"
      ? await scryfall.searchCardsWithDiagnostics(providerQuery)
      : categoryId === "pokemon-en"
        ? await pokemon.searchCardsWithDiagnostics(providerQuery)
        : categoryId === "onepiece-en"
          ? await onePiece.searchCardsWithDiagnostics(query)
          : await lorcast.searchCardsWithDiagnostics(providerQuery);
    if (provider.errorMessage) {
      return NextResponse.json({ artwork: {}, status: "UNAVAILABLE" });
    }
    const resolvedArtwork = categoryId === "onepiece-en"
      ? resolveOnePieceSnapshotArtwork(matches, provider.cards)
      : resolveSnapshotArtwork(matches, provider.cards);
    const artwork = Object.fromEntries(Object.entries(resolvedArtwork).map(([sku, urls]) => [sku, durableArtworkUrls(urls)]));
    return NextResponse.json(
      { artwork, status: "OPERATIONAL" },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch {
    return NextResponse.json({ artwork: {}, status: "UNAVAILABLE" });
  }
}
