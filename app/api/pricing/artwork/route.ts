import { NextResponse } from "next/server";
import { pricingLookupConfig } from "@/config/pricingLookup";
import { providerArtworkQueries, resolveOnePieceSnapshotArtwork, resolveSnapshotArtwork } from "@/lib/pricing/artwork";
import { getPricingRepository } from "@/lib/pricing/server";
import { ScryfallProvider } from "@/lib/providers/identity/ScryfallProvider";
import { TcgdexProvider } from "@/lib/providers/tcgdex/TcgdexProvider";
import { LorcastProvider } from "@/lib/providers/lorcast/LorcastProvider";
import { BandaiOnePieceProvider } from "@/lib/providers/bandai/BandaiOnePieceProvider";
import { durableArtworkUrls } from "@/lib/artwork/DurableArtworkCache";
import { authorizationErrorResponse, authorizeRequest } from "@/lib/auth/requestAuthorization";
import { curatedArtworkUrl, getCuratedArtworkStore } from "@/lib/artwork/CuratedArtworkStore";

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
    const repository = getPricingRepository();
    const pricing = repository.search(categoryId, query);
    const matches = [...pricing.singles, ...pricing.sealed];
    const persistedArtwork = repository.getArtworkResolutions(matches);
    const artworkProvenance = repository.getArtworkResolutionProvenance(matches);
    const localArtwork: Record<string, { normal: string }> = {};
    await Promise.all(matches.map(async (match) => {
      if (match.imageUrl) localArtwork[match.sku] = { normal: match.imageUrl };
      if (await getCuratedArtworkStore().has(match.categoryId, match.sku)) {
        localArtwork[match.sku] = { normal: curatedArtworkUrl(match.categoryId, match.sku) };
      }
    }));
    const unresolvedMatches = matches.filter((match) =>
      match.productType === "SINGLE" && !persistedArtwork[match.sku] && !localArtwork[match.sku]
    );
    const queries = providerArtworkQueries(categoryId, query, unresolvedMatches);
    const providers = await Promise.all(queries.map((providerQuery) => categoryId === "magic-en"
      ? scryfall.searchCardsWithDiagnostics(providerQuery)
      : categoryId === "pokemon-en"
        ? pokemon.searchCardsWithDiagnostics(providerQuery)
        : categoryId === "onepiece-en"
          ? onePiece.searchCardsWithDiagnostics(providerQuery)
          : lorcast.searchCardsWithDiagnostics(providerQuery)));
    const cards = [...new Map(providers.flatMap((provider) => provider.cards).map((card) => [card.id, card])).values()];
    const resolvedArtwork = categoryId === "onepiece-en"
      ? resolveOnePieceSnapshotArtwork(unresolvedMatches, cards)
      : resolveSnapshotArtwork(unresolvedMatches, cards);
    if (Object.keys(resolvedArtwork).length) {
      repository.saveArtworkResolutions(
        unresolvedMatches,
        resolvedArtwork,
        categoryId === "magic-en" ? "scryfall" : categoryId === "pokemon-en" ? "tcgdex" : categoryId === "onepiece-en" ? "bandai-onepiece" : "lorcast",
      );
    }
    const rawProviderArtwork = { ...persistedArtwork, ...resolvedArtwork };
    const providerArtwork = Object.fromEntries(Object.entries(rawProviderArtwork).map(([sku, urls]) => [sku, durableArtworkUrls(urls)]));
    const artwork = { ...providerArtwork, ...localArtwork };
    const providerReachable = providers.some((provider) => !provider.errorMessage);
    return NextResponse.json(
      { artwork, artworkProvenance, status: Object.keys(artwork).length ? "OPERATIONAL" : providerReachable || queries.length === 0 ? "NO_MATCH" : "UNAVAILABLE" },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch {
    return NextResponse.json({ artwork: {}, status: "UNAVAILABLE" });
  }
}
