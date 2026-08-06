import {
  decodeLigaCsv,
  readLigaCsvWithContract,
  type LigaMagicRow,
} from "../ligamagic/Csv.ts";

export const LIGAPOKEMON_CSV_CONTRACT_VERSION = "2-authenticated-20-column";
export const LIGAPOKEMON_CSV_HEADERS = [
  "Edicao (PTBR)",
  "Edicao (EN)",
  "Edicao (Sigla)",
  "Card (PT)",
  "Card (EN)",
  "Quantidade",
  "Qualidade (M NM SP MP HP D)",
  "Idioma (BR EN DE ES FR IT JP KO RU TW)",
  "Raridade (C I U R H E X U P A L S)",
  "Cor (C D O E Y F R G L M P W)",
  "Extras",
  "Card #",
  "Comentario",
  "# Cards na Edicao",
  "Compra - Menor Preco",
  "Compra - Preco Médio",
  "Compra - Maior Preco",
  "Venda - Menor Preco",
  "Venda - Preco Medio",
  "Venda - Maior Preco",
] as const;
export type LigaPokemonRow = LigaMagicRow;

export function decodeLigaPokemonCsv(bytes: Uint8Array): string {
  return decodeLigaCsv(bytes, "LigaPokemon");
}

export function readLigaPokemonCsv(bytes: Uint8Array): LigaPokemonRow[] {
  return readLigaCsvWithContract(bytes, {
    providerLabel: "LigaPokemon",
    headers: LIGAPOKEMON_CSV_HEADERS,
    rarityHeader: "Raridade (C I U R H E X U P A L S)",
    colorHeader: "Cor (C D O E Y F R G L M P W)",
  });
}
