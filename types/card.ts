import type { IdentityRelationship } from "@/types/identityRelationship";
import type { PrintingVariant } from "@/types/printingVariant";
import type { IdentityCompleteness, IdentityMappingAudit } from "@/types/identityCompleteness";
import type { IdentityTreatment } from "@/types/identityTreatment";
import type {
  GameplayIdentity,
  MarketIdentity,
  PhysicalFinish,
  PhysicalVariantIdentity,
  PrintingDesignFacet,
  PrintingIdentity,
  ProviderAlias,
} from "@/types/identityOntology";

export interface CardImageUrls {
  artCrop?: string;
  large?: string;
  normal?: string;
  small?: string;
}

export interface CardFaceImage {
  imageUrls: CardImageUrls;
  name?: string;
}

export interface Card {
  id: string;
  name: string;
  game: "Magic" | "Pokemon" | "One Piece" | "Lorcana" | "Riftbound" | "Flesh and Blood";
  set: string;
  setCode?: string;
  number: string;
  rarity: string;
  finish: string;
  availableFinishes?: string[];
  canonicalIdentity?: string;
  cardTypes?: string[];
  classifications?: string[];
  frame?: string;
  frameEffects?: string[];
  cardFaces?: CardFaceImage[];
  hasCardFaces?: boolean;
  imageFace?: "front" | "single";
  imageSource?: "card" | "card_faces" | "fallback";
  imageUrl: string;
  imageUrls?: CardImageUrls;
  identityRelationship?: IdentityRelationship;
  identityCompleteness?: IdentityCompleteness;
  identityMappingAudit?: IdentityMappingAudit;
  ink?: string;
  language?: string;
  layout?: string;
  legalities?: Record<string, string>;
  gameplayAttributes?: Record<string, boolean | number | string | null | string[]>;
  gameplayIdentity?: GameplayIdentity;
  gameplayIdentityId?: string;
  gameplayProviderAlias?: ProviderAlias;
  rulesText?: string;
  productFamily?: string;
  providerConfidence?: number;
  providerIdentity?: {
    providerId: string;
    providerRecordId: string;
  };
  providerSetId?: string;
  promoTypes?: string[];
  illustrators?: string[];
  publicationDate?: string;
  printingDesignFacets?: PrintingDesignFacet[];
  printingIdentity?: PrintingIdentity;
  physicalFinish?: PhysicalFinish;
  physicalVariants?: PhysicalVariantIdentity[];
  marketIdentities?: MarketIdentity[];
  releaseYear?: string;
  selectedFinish?: string;
  sourceGames?: string[];
  treatment?: string;
  treatmentDetails?: IdentityTreatment;
  tcgplayerId?: number;
  typeLine?: string;
  version?: string;
  subtitle?: string;
  component?: string;
  finishVariants?: PrintingVariant[];
}
