import { normalizeSearchText } from "@/lib/pricing/domain";

/**
 * TCGplayer, TCGdex, and LigaPokemon occasionally publish different labels for
 * the same English set. Equivalences stay explicit: containment or fuzzy set
 * matching can silently collapse a different physical printing.
 */
export const POKEMON_SET_ALIASES: Readonly<Record<string, string>> = {
  "black and white promos": "bw black star promos",
  "diamond and pearl promos": "dp black star promos",
  "diamond pearl promos": "dp black star promos",
  "ex emerald": "emerald",
  "ex firered leafgreen": "firered leafgreen",
  "ex team magma vs team aqua": "team magma vs team aqua",
  "hgss promos": "hgss black star promos",
  "legendary treasures radiant collection": "legendary treasures",
  "mega evolution promo": "mep black star promos",
  "nintendo promos": "nintendo black star promos",
  "sm cosmic eclipse": "cosmic eclipse",
  "sm promos": "sm black star promos",
  "sm unbroken bonds": "unbroken bonds",
  "scarlet violet 151": "151",
  "scarlet violet base set": "scarlet violet",
  "scarlet violet promo cards": "svp black star promos",
  "scarlet violet promos": "svp black star promos",
  "shining fates shiny": "shining fates shiny vault",
  "sun moon base set": "sun moon",
  "sun moon promos": "sm black star promos",
  "sv scarlet violet base set": "scarlet violet",
  "sword shield base set": "sword shield",
  "sword shield promo cards": "swsh black star promos",
  "sword shield promos": "swsh black star promos",
  "crown zenith galarian gallery": "galarian gallery",
  "wotc promo": "wizards black star promos",
  "xy base set": "xy",
  "xy promos": "xy black star promos",
};

export function pokemonSetIdentity(value: string): string {
  const set = normalizeSearchText(
    value
      .replace(/^\s*(?:SV|SWSH|SM|XY|BW|ME)\d{0,4}(?:\.[A-Z0-9]+)?\s*:\s*/i, "")
      .replace(/\s+\([A-Z0-9-]+\)\s*$/, ""),
  );
  const eraNeutralSet = set.replace(/^(?:ex|sm|xy)\s+/, "");
  const aliasedSet =
    POKEMON_SET_ALIASES[set] ??
    POKEMON_SET_ALIASES[eraNeutralSet] ??
    eraNeutralSet;
  return aliasedSet.replace(/^(?:ex|sm|xy)\s+/, "");
}

export function ligaPokemonEnglishSetScope(setName: string): boolean {
  return !/\((?:JP|JPN|JA|JAPANESE|JAPONES|JAPON[EÊ]S|CN|CHN|CHINESE|CHINES|CHIN[EÊ]S|KR|KO|KOREAN|COREANO|COREAN|FR|FRENCH|FRANCES|FRANC[EÊ]S|DE|GERMAN|ALEMAO|ALEM[AÃ]O|ES|SPANISH|ESPANHOL|IT|ITALIAN|ITALIANO|PT|PORTUGUESE|PORTUGUES|PORTUGU[EÊ]S)\)\s*$/i.test(
    setName.normalize("NFKC").trim(),
  );
}

export function pokemonCollectorIdentity(
  value: string | null | undefined,
): string | null {
  const numerator = (value ?? "")
    .normalize("NFKC")
    .trim()
    .toUpperCase()
    .split("/")[0]
    .replace(/\s+/g, "");
  if (!numerator) return null;
  const match = numerator.match(/^([A-Z]*)(\d+)([A-Z]*)$/);
  return match ? `${match[1]}${Number(match[2])}${match[3]}` : numerator;
}

export function pokemonCardNameIdentity(input: {
  name: string;
  collectorNumber: string | null | undefined;
}): string {
  const expectedCollector = pokemonCollectorIdentity(input.collectorNumber);
  const suffix = input.name.match(
    /\s+-\s+([A-Z]*\d+[A-Z]*)(?:\/\d+[A-Z]*)?\s*$/i,
  );
  const suffixCollector = suffix ? pokemonCollectorIdentity(suffix[1]) : null;
  const withoutRepeatedCollector =
    suffix && expectedCollector && suffixCollector === expectedCollector
      ? input.name.slice(0, suffix.index)
      : input.name;
  return normalizeSearchText(withoutRepeatedCollector);
}

export type LigaPokemonExactVariant =
  "Normal" | "Holofoil" | "Reverse Holofoil";

export function ligaPokemonExactVariant(
  extras: string,
): LigaPokemonExactVariant | null {
  if (extras === "") return "Normal";
  if (extras === "Foil") return "Holofoil";
  if (extras === "Reverse Foil") return "Reverse Holofoil";
  return null;
}

export function pokemonCrossMarketIdentityKey(input: {
  name: string;
  setName: string;
  collectorNumber: string | null | undefined;
  variant: string;
}): string | null {
  const collectorNumber = pokemonCollectorIdentity(input.collectorNumber);
  const name = pokemonCardNameIdentity({
    name: input.name,
    collectorNumber: input.collectorNumber,
  });
  const setName = pokemonSetIdentity(input.setName);
  if (!name || !setName || !collectorNumber || !input.variant.trim()) {
    return null;
  }
  return [name, setName, collectorNumber, input.variant.trim()].join("|");
}
