export type LigaQuantityAuthority =
  | "SOURCE_LABEL"
  | "PRODUCT_OWNER_EXPORT";

export type ResolvedLigaQuantityAuthority = {
  sourceAdvertisedCards: number;
  authoritativeCards: number;
  quantityAuthority: LigaQuantityAuthority;
};

const ligaPokemonOwnerAuthorities = new Map<
  string,
  { sourceAdvertisedCards: number; authoritativeCards: number }
>([
  [
    "Lote 10 (9.704 cards)",
    { sourceAdvertisedCards: 9_704, authoritativeCards: 9_700 },
  ],
  [
    "Lote 4 (9.870 cards)",
    { sourceAdvertisedCards: 9_870, authoritativeCards: 9_868 },
  ],
  [
    "Lote RF 3 (9.983 cards)",
    { sourceAdvertisedCards: 9_983, authoritativeCards: 9_982 },
  ],
  [
    "Lote RF 6 (7.681 cards)",
    { sourceAdvertisedCards: 7_681, authoritativeCards: 7_679 },
  ],
]);

export function resolveLigaQuantityAuthority(input: {
  providerId: "ligamagic" | "ligapokemon";
  collectionLabel: string;
  sourceAdvertisedCards: number;
}): ResolvedLigaQuantityAuthority {
  const approved =
    input.providerId === "ligapokemon"
      ? ligaPokemonOwnerAuthorities.get(input.collectionLabel)
      : undefined;
  if (
    approved &&
    approved.sourceAdvertisedCards === input.sourceAdvertisedCards
  ) {
    return {
      ...approved,
      quantityAuthority: "PRODUCT_OWNER_EXPORT",
    };
  }
  return {
    sourceAdvertisedCards: input.sourceAdvertisedCards,
    authoritativeCards: input.sourceAdvertisedCards,
    quantityAuthority: "SOURCE_LABEL",
  };
}
