export type BandaiOnePieceErrorKind = "MALFORMED_QUERY" | "NETWORK_FAILURE" | "NO_MATCH" | "PROVIDER_OFFLINE" | "RATE_LIMITED";

export type BandaiOnePieceCardRecord = {
  assetId: string;
  cardNumber: string;
  cardType: string;
  imageUrl: string;
  name: string;
  rarity: string;
  setName: string;
};
