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
  "ex firered leafgreen": "firered and leafgreen",
  "ex firered and leafgreen": "firered and leafgreen",
  "ex team magma vs team aqua": "team magma vs team aqua",
  "hgss promos": "hgss black star promos",
  "legendary treasures radiant collection": "legendary treasures",
  "mega evolution promo": "mep black star promos",
  "nintendo promos": "nintendo black star promos",
  "sm cosmic eclipse": "cosmic eclipse",
  "sm promos": "sm black star promos",
  "sm unbroken bonds": "unbroken bonds",
  "scarlet violet 151": "151",
  "scarlet and violet 151": "151",
  "scarlet violet": "scarlet and violet",
  "scarlet violet base set": "scarlet and violet",
  "scarlet and violet base set": "scarlet and violet",
  "scarlet violet promo cards": "svp black star promos",
  "scarlet violet promos": "svp black star promos",
  "scarlet and violet promo cards": "svp black star promos",
  "scarlet and violet promos": "svp black star promos",
  "shining fates shiny": "shining fates shiny vault",
  "sun moon": "sun and moon",
  "sun moon base set": "sun and moon",
  "sun and moon base set": "sun and moon",
  "sun moon promos": "sm black star promos",
  "sv scarlet violet base set": "scarlet and violet",
  "sword shield": "sword and shield",
  "sword shield base set": "sword and shield",
  "sword and shield base set": "sword and shield",
  "sword shield promo cards": "swsh black star promos",
  "sword shield promos": "swsh black star promos",
  "sword and shield promo cards": "swsh black star promos",
  "sword and shield promos": "swsh black star promos",
  "crown zenith galarian gallery": "galarian gallery",
  "wotc promo": "wizards black star promos",
  "xy base set": "xy",
  "xy promos": "xy black star promos",
};

const POKEMON_IDENTITY_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  apos: "'",
  quot: '"',
  nbsp: " ",
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  ndash: "-",
  mdash: "-",
};

/** Decode only presentation entities admitted by the local identity policy. */
export function decodePokemonIdentityText(value: string): string {
  return value
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (entity, hex, decimal) => {
      const codePoint = Number.parseInt(hex ?? decimal, hex ? 16 : 10);
      return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    })
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      POKEMON_IDENTITY_ENTITIES[name.toLowerCase()] ?? entity,
    );
}

function normalizePokemonPresentationText(value: string): string {
  return normalizeSearchText(
    decodePokemonIdentityText(value).replace(/&/g, " and "),
  );
}

export function pokemonSetIdentity(value: string): string {
  const set = normalizePokemonPresentationText(
    decodePokemonIdentityText(value)
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
    decodePokemonIdentityText(setName).normalize("NFKC").trim(),
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
  return normalizePokemonPresentationText(withoutRepeatedCollector);
}

const POKEMON_MATERIAL_TREATMENTS: ReadonlyArray<{
  identity: string;
  pattern: RegExp;
}> = [
  { identity: "black-triangle", pattern: /\bblack triangle\b/ },
  { identity: "build-battle", pattern: /\bbuild and battle\b/ },
  { identity: "code-included", pattern: /\bwith pokemon go code\b/ },
  { identity: "cosmos-holo", pattern: /\bcosmos holo\b/ },
  { identity: "cracked-ice", pattern: /\bcracked ice\b/ },
  { identity: "deck-exclusive", pattern: /\bdeck exclusive\b/ },
  { identity: "energy-symbol", pattern: /\benergy symbol pattern\b/ },
  { identity: "error", pattern: /\berror\b/ },
  { identity: "galaxy-holo", pattern: /\bgalaxy holo\b/ },
  { identity: "holo-bleed", pattern: /\bholo bleed\b/ },
  { identity: "jumbo", pattern: /\b(?:jumbo|oversized)\b/ },
  { identity: "league", pattern: /\bleague promo\b/ },
  { identity: "master-ball", pattern: /\bmaster ball pattern\b/ },
  { identity: "no-symbol", pattern: /\bno symbol\b/ },
  { identity: "poke-ball", pattern: /\bpoke ball pattern\b/ },
  { identity: "prerelease", pattern: /\bpre ?release\b/ },
  { identity: "shadowless", pattern: /\bshadowless\b/ },
  { identity: "staff", pattern: /\bstaff\b/ },
  { identity: "stamped", pattern: /\b(?:stamp|stamped)\b/ },
  { identity: "winner", pattern: /\bwinner\b/ },
  { identity: "world-championship", pattern: /\bworld championship\b/ },
  { identity: "w-stamp", pattern: /\bw stamp\b/ },
];

export function pokemonMaterialTreatmentIdentity(value: string): string {
  const normalized = normalizePokemonPresentationText(value);
  return POKEMON_MATERIAL_TREATMENTS.filter(({ pattern }) =>
    pattern.test(normalized),
  )
    .map(({ identity }) => identity)
    .sort()
    .join("|");
}

const STRUCTURAL_SET_DECORATIONS = new Set([
  "base",
  "cards",
  "collection",
  "expansion",
  "promo",
  "promos",
  "set",
  "special",
]);

export function pokemonSetLabelsStructurallyCompatible(
  left: string,
  right: string,
): boolean {
  const leftIdentity = pokemonSetIdentity(left);
  const rightIdentity = pokemonSetIdentity(right);
  if (!leftIdentity || !rightIdentity) return false;
  if (leftIdentity === rightIdentity) return true;
  const leftTokens = new Set(leftIdentity.split(" ").filter(Boolean));
  const rightTokens = new Set(rightIdentity.split(" ").filter(Boolean));
  const shared = [...leftTokens].filter((token) => rightTokens.has(token));
  if (shared.length < 2) return false;
  const difference = [
    ...[...leftTokens].filter((token) => !rightTokens.has(token)),
    ...[...rightTokens].filter((token) => !leftTokens.has(token)),
  ];
  return (
    difference.length > 0 &&
    difference.every((token) => STRUCTURAL_SET_DECORATIONS.has(token))
  );
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
