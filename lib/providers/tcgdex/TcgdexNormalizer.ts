import type { Card } from "@/types/card";
import type { TcgdexCardBrief } from "@/lib/providers/tcgdex/TcgdexTypes";

export function normalizeTcgdexCard(raw: TcgdexCardBrief, setName: string): Card | null {
  if (!raw.id || !raw.name || raw.localId === undefined || !setName) return null;
  const imageUrls = raw.image ? {
    small: `${raw.image}/low.webp`,
    normal: `${raw.image}/high.webp`,
    large: `${raw.image}/high.webp`,
  } : undefined;
  return {
    id: raw.id,
    name: raw.name,
    game: "Pokemon",
    set: setName,
    number: String(raw.localId),
    rarity: "Unknown",
    finish: "Unknown",
    availableFinishes: ["Unknown"],
    imageUrl: imageUrls?.small ?? "",
    imageUrls,
    imageFace: "single",
    imageSource: imageUrls?.small ? "card" : "fallback",
    language: "English",
    providerConfidence: 92,
    providerIdentity: {
      providerId: "tcgdex",
      providerRecordId: raw.id,
    },
    productFamily: setName,
  };
}
