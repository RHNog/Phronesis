import type { Card } from "@/types/card";
import type { BandaiOnePieceCardRecord } from "@/lib/providers/bandai/BandaiOnePieceTypes";

export function normalizeBandaiOnePieceCard(raw: BandaiOnePieceCardRecord): Card | null {
  if (!raw.assetId || !raw.cardNumber || !raw.imageUrl || !raw.name || !raw.setName) return null;
  const setCode = raw.setName.match(/\[([A-Z0-9-]+)\]/i)?.[1]?.replace(/-/g, "").toUpperCase();
  return {
    id: `bandai-onepiece:${setCode ?? "unknown"}:${raw.assetId}`,
    name: raw.name,
    game: "One Piece",
    set: raw.setName,
    setCode,
    number: raw.cardNumber,
    rarity: raw.rarity || "Unknown",
    finish: "Unknown",
    availableFinishes: ["Unknown"],
    imageUrl: raw.imageUrl,
    imageUrls: { small: raw.imageUrl, normal: raw.imageUrl, large: raw.imageUrl },
    imageFace: "single",
    imageSource: "card",
    language: "English",
    providerConfidence: 95,
    providerIdentity: { providerId: "bandai-onepiece", providerRecordId: raw.assetId },
    productFamily: raw.setName,
    typeLine: raw.cardType,
  };
}
