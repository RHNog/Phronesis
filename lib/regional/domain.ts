import { normalizeSearchText } from "@/lib/pricing/domain";

export type CrossMarketMatchStatus =
  "MATCHED" | "UNMATCHED" | "AMBIGUOUS" | "UNSUPPORTED_VARIANT";

export type ArbitrageDirection = "US_TO_BRAZIL" | "BRAZIL_TO_US";
export type ArbitrageState =
  | "INDICATIVE"
  | "IDENTITY_VERIFIED"
  | "COSTED"
  | "AVAILABILITY_VERIFIED"
  | "ACTIONABLE"
  | "STALE"
  | "REJECTED";

export type RegionalMarketEvidence = {
  sourceProvider: "LigaMagic" | "LigaPokemon";
  ligaIdentityKey: string;
  categoryId: string;
  sku: string;
  cardName: string;
  editionName: string;
  editionCode: string;
  collectorNumber: string;
  variant: string;
  observedAt: string;
  consumerLowCentavos: number | null;
  consumerAverageCentavos: number | null;
  consumerHighCentavos: number | null;
  storeBuyLowCentavos: number | null;
  storeBuyAverageCentavos: number | null;
  storeBuyHighCentavos: number | null;
};

export type RegionalCostProfile = {
  brlPerUsd: number | null;
  brlPerUsdBuy: number | null;
  brlPerUsdSell: number | null;
  fxObservedAt: string | null;
  fxFetchedAt: string | null;
  fxLastAttemptAt: string | null;
  fxSource: string | null;
  fxLastError: string | null;
  usToBrazilFixedBrl: number | null;
  usToBrazilPercent: number | null;
  usToBrazilMinAcquisitionUsd: number | null;
  usToBrazilMaxAcquisitionUsd: number | null;
  usToBrazilMinGrossProceedsBrl: number | null;
  usToBrazilMinGrossSpreadBrl: number | null;
  usToBrazilMinNetProfitBrl: number | null;
  usToBrazilMinProfitMarginPercent: number | null;
  usToBrazilMinRoiPercent: number | null;
  brazilToUsFixedUsd: number | null;
  brazilToUsPercent: number | null;
  brazilToUsMinAcquisitionBrl: number | null;
  brazilToUsMaxAcquisitionBrl: number | null;
  brazilToUsMinGrossProceedsUsd: number | null;
  brazilToUsMinGrossSpreadUsd: number | null;
  brazilToUsMinNetProfitUsd: number | null;
  brazilToUsMinProfitMarginPercent: number | null;
  brazilToUsMinRoiPercent: number | null;
  maxEvidenceAgeHours: number | null;
  updatedAt: string | null;
};

export type ArbitrageCalculation = {
  state: ArbitrageState;
  blocker: string | null;
  grossProceeds: number | null;
  grossSpread: number | null;
  totalCost: number | null;
  netProfit: number | null;
  profitMarginPercent: number | null;
  roiPercent: number | null;
  meetsTargets: boolean | null;
  targetBlockers: string[];
};

export function normalizeCollectorNumber(value: string): string {
  const normalized = value.normalize("NFKC").trim().toLowerCase();
  if (!normalized) return "";
  const numerator = normalized.split("/")[0].trim();
  return numerator.replace(/^0+(?=\d)/, "").replace(/[^a-z0-9]+/g, "");
}

export function normalizeRegionalVariant(
  value: string,
): "Normal" | "Foil" | null {
  const normalized = normalizeSearchText(value);
  if (
    !normalized ||
    normalized === "regular" ||
    normalized === "normal" ||
    normalized === "nonfoil"
  ) {
    return "Normal";
  }
  if (normalized === "foil") return "Foil";
  return null;
}

export function normalizeCrossMarketCardName(
  value: string,
  collectorNumber: string,
  edition = "",
): string {
  let cardName = value.normalize("NFKC").trim();
  const collector = normalizeCollectorNumber(collectorNumber);
  const terminalMetadata = cardName.match(/(?:\s*\([^)]+\))+\s*$/);
  if (collector && terminalMetadata?.index !== undefined) {
    const metadata = terminalMetadata[0].replace(
      /\s*\((?:#\s*)?([^)]+)\)/g,
      (annotation, value: string) =>
        normalizeCollectorNumber(value) === collector ? "" : annotation,
    );
    cardName = `${cardName.slice(0, terminalMetadata.index)}${metadata}`.trim();
  }
  const historicalMarker = historicalCardNameMarker(edition);
  const markerAnnotation = cardName.match(/\s*\(([A-Z]{2})\)\s*$/i);
  if (
    historicalMarker &&
    markerAnnotation?.[1].toLowerCase() === historicalMarker
  )
    cardName = cardName.slice(0, markerAnnotation.index).trim();
  return normalizeSearchText(cardName);
}

export function crossMarketIdentityKey(input: {
  name: string;
  edition: string;
  collectorNumber: string;
  variant: string;
}): string | null {
  const collector = normalizeCollectorNumber(input.collectorNumber);
  const variant = normalizeRegionalVariant(input.variant);
  if (!collector || !variant) return null;
  return [
    normalizeCrossMarketCardName(
      input.name,
      input.collectorNumber,
      input.edition,
    ),
    normalizeSearchText(input.edition),
    collector,
    variant.toLowerCase(),
  ].join("|");
}

export function crossMarketNameEditionVariantKey(input: {
  name: string;
  edition: string;
  variant: string;
  collectorNumber?: string;
}): string | null {
  const name = normalizeCrossMarketCardName(
    input.name,
    input.collectorNumber ?? "",
    input.edition,
  );
  const edition = normalizeSearchText(input.edition);
  const variant = normalizeRegionalVariant(input.variant);
  if (!name || !edition || !variant) return null;
  return [name, edition, variant.toLowerCase()].join("|");
}

export function crossMarketAnchorKey(input: {
  name: string;
  collectorNumber: string;
  variant: string;
}): string | null {
  const collector = normalizeCollectorNumber(input.collectorNumber);
  const variant = normalizeRegionalVariant(input.variant);
  if (!collector || !variant) return null;
  return [
    normalizeCrossMarketCardName(input.name, input.collectorNumber),
    collector,
    variant.toLowerCase(),
  ].join("|");
}

export function permitsPreExodusCollectorFallback(edition: string): boolean {
  return preExodusEditions.has(normalizeSearchText(edition));
}

export function isHistoricallyImpossibleFoilEdition(edition: string): boolean {
  const baseEdition = edition.replace(/\s+\((?:BB|Black Border)\)$/i, "");
  return prePremiumFoilEditions.has(normalizeSearchText(baseEdition));
}

export function isArtSeriesEdition(edition: string): boolean {
  return normalizeSearchText(edition).includes("art series");
}

export function isArtSeriesFoilShell(
  edition: string,
  variant: string,
): boolean {
  return isArtSeriesEdition(edition) && normalizeRegionalVariant(variant) === "Foil";
}

export function isFoilOnlyTreatmentNormalShell(
  edition: string,
  variant: string,
): boolean {
  if (normalizeRegionalVariant(variant) !== "Normal") return false;
  return /(?:foil etched|gilded foil|surge foil|ripple foil|galaxy foil|textured foil|halo foil|mana foil|fract(?:ure|ured) foil|first[- ]place)/i.test(
    edition.normalize("NFKC"),
  );
}

export function doubleSidedTokenCollectorPair(value: string): string | null {
  const identity = tokenCollectorIdentity(value);
  return identity?.includes("|") ? identity : null;
}

export function tokenCollectorIdentity(value: string): string | null {
  const numbers = [...value.matchAll(/\d+/g)].map((match) =>
    String(Number(match[0])),
  );
  if (numbers.length < 1 || numbers.length > 2) return null;
  return numbers.sort((left, right) => Number(left) - Number(right)).join("|");
}

export function tokenBaseEdition(edition: string): string | null {
  const match = edition.match(/^(.*?) \(Tokens\)$/i);
  return match ? match[1].trim() : null;
}

export function tokenNameIdentity(value: string): string | null {
  const withoutProductLabel = value
    .normalize("NFKC")
    .replace(/\s+(?:double[- ]sided\s+)?token\s*$/i, "")
    .trim();
  const faces = withoutProductLabel
    .split(/\s*\/\/\s*/)
    .map((face) =>
      normalizeSearchText(
        face
          .replace(/\s*\((?:#\s*)?\d+\)\s*/g, " ")
          .replace(/\b(?:\d+|\*|x)\s*\/\s*(?:\d+|\*|x)\b/gi, " "),
      ),
    )
    .filter(Boolean);
  if (faces.length < 1 || faces.length > 2) return null;
  return faces.sort().join("|");
}

export function genericVariantBaseEdition(edition: string): string | null {
  const match = edition.match(/^(.*?) \(Variants\)$/);
  return match ? match[1].trim() : null;
}

export function variantProductNameCompatible(input: {
  sourceName: string;
  sourceCollectorNumber: string;
  sourceEdition: string;
  targetName: string;
  targetCollectorNumber: string;
  targetEdition: string;
}): boolean {
  const source = normalizeCrossMarketCardName(
    input.sourceName,
    input.sourceCollectorNumber,
    input.sourceEdition,
  );
  const exactTarget = normalizeCrossMarketCardName(
    input.targetName,
    input.targetCollectorNumber,
    input.targetEdition,
  );
  if (source === exactTarget) return true;
  let targetBase = input.targetName.normalize("NFKC").trim();
  while (/\s*\([^)]+\)\s*$/.test(targetBase)) {
    targetBase = targetBase.replace(/\s*\([^)]+\)\s*$/, "").trim();
    if (
      normalizeCrossMarketCardName(
        targetBase,
        input.targetCollectorNumber,
        input.targetEdition,
      ) === source
    )
      return true;
  }
  return false;
}

export function documentedTreatmentProductNameCompatible(input: {
  sourceName: string;
  sourceCollectorNumber: string;
  sourceEdition: string;
  targetName: string;
  targetCollectorNumber: string;
  targetEdition: string;
}): boolean {
  const source = normalizeCrossMarketCardName(
    input.sourceName,
    input.sourceCollectorNumber,
    input.sourceEdition,
  );
  let targetBase = input.targetName.normalize("NFKC").trim();
  let treatmentRemoved = false;
  while (true) {
    const annotation = targetBase.match(/\s*\(([^)]+)\)\s*$/);
    if (!annotation) break;
    const value = annotation[1];
    if (
      normalizeCollectorNumber(value) ===
      normalizeCollectorNumber(input.targetCollectorNumber)
    ) {
      targetBase = targetBase.slice(0, annotation.index).trim();
      continue;
    }
    if (!documentedProductTreatmentLabels.has(normalizeSearchText(value)))
      break;
    treatmentRemoved = true;
    targetBase = targetBase.slice(0, annotation.index).trim();
  }
  return (
    treatmentRemoved &&
    normalizeCrossMarketCardName(
      targetBase,
      input.targetCollectorNumber,
      input.targetEdition,
    ) === source
  );
}

export function collectorSuffixBase(value: string): string | null {
  const match = normalizeCollectorNumber(value).match(/^(\d+)[a-z]$/);
  return match?.[1] ?? null;
}

export function collectorSuffixProductNameCompatible(input: {
  sourceName: string;
  sourceCollectorNumber: string;
  sourceEdition: string;
  targetName: string;
  targetCollectorNumber: string;
  targetEdition: string;
}): boolean {
  const sourceCollector = collectorSuffixBase(input.sourceCollectorNumber);
  if (
    !sourceCollector ||
    sourceCollector !== normalizeCollectorNumber(input.targetCollectorNumber)
  )
    return false;
  return (
    normalizeCrossMarketCardName(
      input.sourceName,
      input.sourceCollectorNumber,
      input.sourceEdition,
    ) ===
    normalizeCrossMarketCardName(
      input.targetName,
      input.targetCollectorNumber,
      input.targetEdition,
    )
  );
}

export function artSeriesCollectorIdentity(value: string): string | null {
  const normalized = normalizeCollectorNumber(value);
  const suffixed = collectorSuffixBase(value);
  return suffixed ?? (/^\d+$/.test(normalized) ? normalized : null);
}

export function artSeriesProductNameCompatible(input: {
  sourceName: string;
  targetName: string;
}): boolean {
  const sourceMatch = input.sourceName.normalize("NFKC").trim().match(
    /^(.*?)\s*\(((Art|Stat) Card)(?:\s+(with Signature|com Assinatura))?\)\s*$/i,
  );
  if (!sourceMatch || sourceMatch[3].toLowerCase() !== "art") return false;
  const sourceSignature = Boolean(sourceMatch[4]);
  const sourceBase = normalizeSearchText(
    sourceMatch[1].replace(/\s+#\d+\s*$/i, "").trim(),
  );

  let targetBase = input.targetName.normalize("NFKC").trim();
  const signatureAnnotation = targetBase.match(
    /\s*\((Gold-Stamped[^)]*)\)\s*$/i,
  );
  const targetSignature = Boolean(signatureAnnotation);
  if (sourceSignature !== targetSignature) return false;
  if (signatureAnnotation)
    targetBase = targetBase.slice(0, signatureAnnotation.index).trim();
  targetBase = targetBase.replace(/\s*\(\d+\s*\/\s*\d+\)\s*$/i, "").trim();
  if (!/\s+Art Card\s*$/i.test(targetBase)) return false;
  targetBase = targetBase.replace(/\s+Art Card\s*$/i, "").trim();
  while (true) {
    const annotation = targetBase.match(/\s*\(([^)]+)\)\s*$/);
    if (!annotation) break;
    const normalized = normalizeSearchText(annotation[1]);
    if (
      normalized !== "showcase" &&
      normalized !== "borderless" &&
      !/^\d+(?:\s+\d+)?$/.test(normalized) &&
      !/^\d+\s+\d+$/.test(normalized)
    )
      break;
    targetBase = targetBase.slice(0, annotation.index).trim();
  }
  return normalizeSearchText(targetBase) === sourceBase;
}

export function explicitHistoricalEditionTarget(
  edition: string,
): string | null {
  return historicalEditionTargets.get(normalizeSearchText(edition)) ?? null;
}

export type ExplicitCatalogueTarget = {
  edition: string;
  nameSuffix: string | null;
};

export type EditionTreatmentIdentity = {
  baseEdition: string;
  targetCardName: string;
  treatment: string;
};

export function editionTreatmentIdentity(
  edition: string,
  cardName: string,
): EditionTreatmentIdentity | null {
  const match = edition.match(/^(.*?) \(([^)]+)\)$/);
  if (!match) return null;
  const treatment = editionTreatmentNameParts.get(
    normalizeSearchText(match[2]),
  );
  if (!treatment) return null;
  return {
    baseEdition: match[1].trim(),
    targetCardName: `${cardName}${treatment
      .map((part) => ` (${part})`)
      .join("")}`,
    treatment: treatment.join(" + "),
  };
}

export function documentedEditionTreatmentBase(
  edition: string,
): string | null {
  const match = edition.match(/^(.*?) \(([^)]+)\)$/);
  if (!match) return null;
  const treatments = match[2]
    .split(/\s*\/\s*/)
    .map((value) => normalizeSearchText(value));
  return treatments.length > 0 &&
    treatments.every((value) => editionTreatmentNameParts.has(value))
    ? match[1].trim()
    : null;
}

export function explicitCatalogueTarget(
  edition: string,
): ExplicitCatalogueTarget | null {
  return catalogueTargets.get(normalizeSearchText(edition)) ?? null;
}

function historicalCardNameMarker(edition: string): string | null {
  const normalized = normalizeSearchText(edition);
  if (normalized === "collector s edition") return "ce";
  if (
    normalized === "international edition" ||
    normalized === "international collectors edition"
  )
    return "ie";
  return null;
}

const historicalEditionTargets = new Map([
  ["limited edition alpha", "Alpha Edition"],
  ["limited edition beta", "Beta Edition"],
  ["international collectors edition", "International Edition"],
]);

const catalogueTargets = new Map<string, ExplicitCatalogueTarget>([
  ["prerelease events", { edition: "Prerelease Cards", nameSuffix: null }],
  ["magic player rewards", { edition: "Magic Player Rewards", nameSuffix: null }],
  ["pro tour promos", { edition: "Pro Tour Promos", nameSuffix: null }],
  ["friday night magic", { edition: "FNM Promos", nameSuffix: null }],
  ["media inserts en", { edition: "Media Promos", nameSuffix: null }],
  ["judge gift program", { edition: "Judge Promos", nameSuffix: null }],
  ["arena league", { edition: "Arena Promos", nameSuffix: null }],
  [
    "magic game day cards",
    { edition: "Game Day & Store Championship Promos", nameSuffix: null },
  ],
  ["wpn gateway", { edition: "WPN & Gateway Promos", nameSuffix: null }],
  ["the list", { edition: "The List Reprints", nameSuffix: null }],
  [
    "final fantasy commander through the ages",
    { edition: "FINAL FANTASY: Through the Ages", nameSuffix: "Showcase" },
  ],
  [
    "mystery booster 2 future sight",
    { edition: "Mystery Booster 2", nameSuffix: "Future Sight" },
  ],
  [
    "mystery booster 2 white border",
    { edition: "Mystery Booster 2", nameSuffix: "White Border" },
  ],
  [
    "mystery booster 2 playtest card",
    { edition: "Mystery Booster 2 Playtest Cards", nameSuffix: null },
  ],
  [
    "mystery booster convention edition",
    {
      edition: "Mystery Booster: Convention Edition Exclusives",
      nameSuffix: "No PW Symbol",
    },
  ],
  [
    "mystery booster playtest cards",
    {
      edition: "Mystery Booster: Convention Edition Exclusives",
      nameSuffix: null,
    },
  ],
]);

const editionTreatmentNameParts = new Map<string, string[]>([
  ["borderless", ["Borderless"]],
  ["bordeless mana foil", ["Borderless", "Mana Foil"]],
  ["borderless anime", ["Anime Borderless"]],
  ["borderless clan", ["Borderless"]],
  ["borderless field notes", ["Borderless"]],
  ["borderless first place", ["Borderless", "First-Place Foil"]],
  ["borderless frame break", ["Borderless"]],
  ["borderless hildebrandt brothers", ["Borderless"]],
  ["borderless ichor", ["Showcase"]],
  ["borderless lands", ["Borderless"]],
  ["borderless lands surge foil", ["Borderless", "Surge Foil"]],
  ["borderless legend", ["Borderless"]],
  ["borderless manga", ["Borderless"]],
  ["borderless pose", ["Borderless"]],
  ["borderless pose surge foil", ["Borderless", "Surge Foil"]],
  ["borderless profile", ["Borderless"]],
  ["borderless profile ripple foil", ["Borderless", "Ripple Foil"]],
  ["borderless reversible shock lands", ["Borderless"]],
  ["borderless scene", ["Borderless"]],
  ["borderless scene surge foil", ["Borderless", "Surge Foil"]],
  ["borderless surge foil", ["Borderless", "Surge Foil"]],
  ["borderless vault boy", ["Borderless"]],
  ["borderless woodblock", ["Borderless"]],
  ["bordeless", ["Borderless"]],
  ["bordeless scene", ["Borderless"]],
  ["bordeless vault boy", ["Borderless"]],
  ["bordeless vault boy surge foil", ["Borderless", "Surge Foil"]],
  ["anime", ["Anime"]],
  ["dossier", ["Showcase"]],
  ["double exposure", ["Showcase"]],
  ["draconic frame", ["Showcase"]],
  ["elemental frame", ["Showcase"]],
  ["extended art", ["Extended Art"]],
  ["surge foil", ["Surge Foil"]],
  ["extended art surge foil", ["Extended Art", "Surge Foil"]],
  ["fable frame", ["Showcase"]],
  ["first place", ["First-Place Foil"]],
  ["foil etched", ["Foil Etched"]],
  ["gilded foil", ["Gilded Foil"]],
  ["galaxy foil borderless", ["Borderless", "Galaxy Foil"]],
  ["galaxy foil showcase", ["Showcase", "Galaxy Foil"]],
  ["golden age", ["Showcase"]],
  ["retro frame", ["Retro Frame"]],
  ["galaxy foil", ["Galaxy Foil"]],
  ["ghostfire", ["Showcase"]],
  ["ghostfire halo foil", ["Showcase", "Halo Foil"]],
  ["showcase scrolls", ["Showcase Scrolls"]],
  ["showcase", ["Showcase"]],
  ["showcase pip boy", ["Showcase"]],
  ["showcase pip boy surge foil", ["Showcase", "Surge Foil"]],
  ["showcase ring", ["Showcase"]],
  ["showcase ring surge foil", ["Showcase", "Surge Foil"]],
  ["showcase woodland", ["Showcase"]],
  ["old frame", ["Retro Frame"]],
  ["halo foil", ["Halo Foil"]],
  ["invisible ink", ["Showcase", "Invisible Ink"]],
  ["japan showcase", ["Showcase"]],
  ["japan showcase fracture foil", ["Showcase", "Fracture Foil"]],
  ["japan showcase fractured foil", ["Showcase", "Fracture Foil"]],
  ["japanese", ["JP Alternate Art"]],
  ["memory corridor", ["Showcase"]],
  ["memory corridor textured foil", ["Showcase", "Textured Foil"]],
  ["paranormal frame", ["Showcase"]],
  ["phyrexian language", ["Phyrexian"]],
  ["ripple foil", ["Ripple Foil"]],
  ["rulebook", ["Showcase"]],
  ["scene box", ["Borderless"]],
  ["scene card", ["Borderless"]],
  ["scene cards", ["Borderless"]],
  ["schematic", ["Schematic"]],
  ["sewer frame", ["Showcase"]],
  ["sketch", ["Showcase"]],
  ["source material", ["Borderless"]],
  ["realms and relics surge foil", ["Borderless", "Surge Foil"]],
  ["stained glass", ["Showcase"]],
  ["tardis showcase", ["Showcase"]],
  ["textured foil", ["Textured Foil"]],
  ["vault frame", ["Showcase"]],
  ["viewport lands galaxy foil", ["Borderless", "Galaxy Foil"]],
  ["celestial lands galaxy foil", ["Borderless", "Galaxy Foil"]],
]);

const documentedProductTreatmentLabels = new Set(
  [...editionTreatmentNameParts.values()]
    .flat()
    .map((value) => normalizeSearchText(value)),
);

const preExodusEditions = new Set([
  "limited edition alpha",
  "limited edition beta",
  "unlimited edition",
  "arabian nights",
  "antiquities",
  "revised edition",
  "legends",
  "the dark",
  "fallen empires",
  "fourth edition",
  "ice age",
  "chronicles",
  "homelands",
  "alliances",
  "mirage",
  "visions",
  "fifth edition",
  "weatherlight",
  "tempest",
  "stronghold",
  "portal",
]);

const prePremiumFoilEditions = new Set([
  ...preExodusEditions,
  "collector s edition",
  "international edition",
  "international collectors edition",
  "renaissance",
  "rinascimento",
  "exodus",
  "portal second age",
  "unglued",
  "urza s saga",
  "anthologies",
]);

export function editionAliasCompatible(source: string, target: string): boolean {
  const sourceQualifiers = materialEditionQualifiers(source);
  const targetQualifiers = materialEditionQualifiers(target);
  if (
    [...sourceQualifiers].some((qualifier) => !targetQualifiers.has(qualifier)) ||
    [...targetQualifiers].some((qualifier) => !sourceQualifiers.has(qualifier))
  )
    return false;
  if (sourceQualifiers.has("anthology-volume-2")) return true;
  const sourceTokens = editionTokens(source);
  const targetTokens = editionTokens(target);
  if (!sourceTokens.size || !targetTokens.size) return false;
  let shared = 0;
  for (const token of sourceTokens) if (targetTokens.has(token)) shared += 1;
  if (shared / Math.min(sourceTokens.size, targetTokens.size) < 0.75)
    return false;
  const sourceOnly = [...sourceTokens].filter((token) => !targetTokens.has(token));
  const targetOnly = [...targetTokens].filter((token) => !sourceTokens.has(token));
  if (
    sourceQualifiers.has("remastered-context") &&
    (sourceOnly.length > 0 || targetOnly.length > 0)
  )
    return false;
  if (sourceOnly.length > 0 && targetOnly.length > 0) {
    const combined = `${normalizeSearchText(source)} ${normalizeSearchText(target)}`;
    if (!(combined.includes("hachette") && combined.includes("salvat")))
      return false;
  }
  return true;
}

function materialEditionQualifiers(value: string): Set<string> {
  const normalized = normalizeSearchText(value);
  const qualifiers = new Set<string>();
  const languages = [
    "japanese", "portuguese", "spanish", "german", "french", "italian",
    "korean", "chinese", "russian",
  ];
  for (const language of languages) {
    if (normalized.includes(language)) qualifiers.add(`language:${language}`);
  }
  if (/(?:^|\s)jp(?:\s|$)/.test(normalized))
    qualifiers.add("language:japanese");
  const contexts: Array<[string, RegExp]> = [
    [
      "promo-context",
      /\bpromo\b|\bpromos\b|\bprerelease\b|\bstore championship\b|\bgame day\b|\bchamps\b|\bwizards play network\b|\bwpn\b|\bugin s fate\b/,
    ],
    ["commander-context", /\bcommander\b/],
    ["remastered-context", /\bremastered\b/],
    ["anthology-context", /\banthology\b/],
    ["anthology-volume-2", /\bcommander anthology 2018\b|\banthology volume ii\b|\banthology volume 2\b/],
    ["art-series-context", /\bart series\b/],
    ["ampersand-treatment", /\bampersand\b/],
    ["serialized-context", /\bserialized\b/],
    ["pool-parallel-context", /\bpool par\b|\bpool parallel\b/],
    ["alternate-foil-context", /\balternate foils?\b/],
    ["token-context", /\btokens?\b/],
    ["planechase-context", /\bplanechase\b|\bplanes\b/],
    ["black-border-context", /\bblack border\b|\bbb\b/],
    ["explorers-product-context", /\bexplorers of ixalan\b/],
    ["eternal-legality-context", /\beternal\b|\beternal legal\b/],
    [
      "digital-only-context",
      /\balchemy\b|\bhistoric horizons\b|\bpioneer masters\b|\bvintage masters\b/,
    ],
  ];
  for (const [qualifier, pattern] of contexts)
    if (pattern.test(normalized)) qualifiers.add(qualifier);
  const treatments = [
    "retro frame", "borderless", "extended art", "showcase", "etched",
    "textured", "surge foil", "galaxy foil", "anime",
  ];
  const parenthetical = [...value.matchAll(/\(([^)]+)\)/g)]
    .map((match) => normalizeSearchText(match[1]))
    .join(" ");
  for (const treatment of treatments) {
    if (parenthetical.includes(treatment))
      qualifiers.add(`treatment:${treatment}`);
  }
  return qualifiers;
}

function editionTokens(value: string): Set<string> {
  const ignored = new Set([
    "a", "an", "and", "the", "of", "set", "edition", "series", "card", "cards",
    "promo", "promos", "pack", "art", "commander", "collection", "starter", "beginner",
    "box", "variant", "variants", "normal", "foil", "etched", "retro", "frame", "borderless",
    "showcase", "surge", "galaxy", "japanese", "anime", "token", "tokens", "plane", "planes",
    "planechase", "acorn", "silver", "scroll", "oil", "slick", "raised", "viewport", "land", "lands",
    "universes", "universe", "beyond",
  ]);
  const ordinals: Record<string, string> = {
    "7th": "seventh",
    "8th": "eighth",
    "9th": "ninth",
    "10th": "tenth",
  };
  const tokens = normalizeSearchText(value).split(" ").map((token) => ordinals[token] ?? token);
  return new Set(tokens
    .filter((token) => token && !ignored.has(token))
    .map((token) => token.length > 4 && token.endsWith("s") ? token.slice(0, -1) : token));
}

export function calculateArbitrage(input: {
  direction: ArbitrageDirection;
  profile: RegionalCostProfile;
  usPriceUsd: number | null;
  brazilPriceBrl: number | null;
  identityVerified: boolean;
  sourcesFresh: boolean;
  availabilityVerified: boolean;
}): ArbitrageCalculation {
  if (!input.identityVerified)
    return blocked(
      "INDICATIVE",
      "Exact cross-market identity is not verified.",
    );
  if (!input.sourcesFresh)
    return blocked("STALE", "One or more market observations are stale.");
  if (!positive(input.usPriceUsd) || !positive(input.brazilPriceBrl)) {
    return blocked("IDENTITY_VERIFIED", "Both regional prices are required.");
  }
  const exchangeRate =
    input.direction === "US_TO_BRAZIL"
      ? (input.profile.brlPerUsdSell ?? input.profile.brlPerUsd)
      : (input.profile.brlPerUsdBuy ?? input.profile.brlPerUsd);
  if (!positive(exchangeRate) || !input.profile.fxObservedAt) {
    return blocked(
      "IDENTITY_VERIFIED",
      "A timestamped BRL/USD observation is required.",
    );
  }
  const officialPtax = input.profile.fxSource?.startsWith(
    "Banco Central do Brasil PTAX",
  );
  const maximumAge = officialPtax ? 7 * 86_400_000 : 48 * 3_600_000;
  if (Date.now() - Date.parse(input.profile.fxObservedAt) > maximumAge) {
    return blocked(
      "STALE",
      officialPtax
        ? "The latest official PTAX close is older than seven days."
        : "The BRL/USD observation is older than 48 hours.",
    );
  }

  let grossProceeds: number;
  let acquisitionInProceedsCurrency: number;
  let totalCost: number;
  if (input.direction === "US_TO_BRAZIL") {
    if (
      !nonNegative(input.profile.usToBrazilFixedBrl) ||
      !nonNegative(input.profile.usToBrazilPercent)
    ) {
      return blocked("IDENTITY_VERIFIED", "US-to-Brazil costs are incomplete.");
    }
    grossProceeds = input.brazilPriceBrl;
    const acquisitionBrl = input.usPriceUsd * exchangeRate;
    acquisitionInProceedsCurrency = acquisitionBrl;
    totalCost =
      acquisitionBrl * (1 + input.profile.usToBrazilPercent / 100) +
      input.profile.usToBrazilFixedBrl;
  } else {
    if (
      !nonNegative(input.profile.brazilToUsFixedUsd) ||
      !nonNegative(input.profile.brazilToUsPercent)
    ) {
      return blocked("IDENTITY_VERIFIED", "Brazil-to-US costs are incomplete.");
    }
    grossProceeds = input.usPriceUsd;
    const acquisitionUsd = input.brazilPriceBrl / exchangeRate;
    acquisitionInProceedsCurrency = acquisitionUsd;
    totalCost =
      acquisitionUsd * (1 + input.profile.brazilToUsPercent / 100) +
      input.profile.brazilToUsFixedUsd;
  }
  const grossSpread = grossProceeds - acquisitionInProceedsCurrency;
  const netProfit = grossProceeds - totalCost;
  const profitMarginPercent =
    grossProceeds > 0 ? (netProfit / grossProceeds) * 100 : null;
  const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : null;
  const targetBlockers = targetMisses({
    direction: input.direction,
    profile: input.profile,
    acquisitionValue:
      input.direction === "US_TO_BRAZIL"
        ? input.usPriceUsd
        : input.brazilPriceBrl,
    grossProceeds,
    grossSpread,
    netProfit,
    profitMarginPercent,
    roiPercent,
  });
  const meetsTargets = targetBlockers.length === 0;
  const actionable =
    input.availabilityVerified && netProfit > 0 && meetsTargets;
  return {
    state: actionable
      ? "ACTIONABLE"
      : input.availabilityVerified && (netProfit <= 0 || !meetsTargets)
        ? "REJECTED"
        : "COSTED",
    blocker: input.availabilityVerified
      ? netProfit > 0
        ? meetsTargets
          ? null
          : `Configured targets missed: ${targetBlockers.join("; ")}.`
        : "Verified economics do not produce a positive net profit."
      : meetsTargets
        ? "Verify an executable acquisition price and quantity before action."
        : `Indicative economics miss configured targets: ${targetBlockers.join("; ")}.`,
    grossProceeds: round(grossProceeds),
    grossSpread: round(grossSpread),
    totalCost: round(totalCost),
    netProfit: round(netProfit),
    profitMarginPercent:
      profitMarginPercent === null ? null : round(profitMarginPercent),
    roiPercent: roiPercent === null ? null : round(roiPercent),
    meetsTargets,
    targetBlockers,
  };
}

function targetMisses(input: {
  direction: ArbitrageDirection;
  profile: RegionalCostProfile;
  acquisitionValue: number;
  grossProceeds: number;
  grossSpread: number;
  netProfit: number;
  profitMarginPercent: number | null;
  roiPercent: number | null;
}): string[] {
  const misses: string[] = [];
  const minimum = (value: number | null, actual: number, label: string) => {
    if (value !== null && actual < value) misses.push(`${label} below ${value}`);
  };
  const maximum = (value: number | null, actual: number, label: string) => {
    if (value !== null && actual > value) misses.push(`${label} above ${value}`);
  };
  if (input.direction === "US_TO_BRAZIL") {
    minimum(
      input.profile.usToBrazilMinAcquisitionUsd,
      input.acquisitionValue,
      "acquisition USD",
    );
    maximum(
      input.profile.usToBrazilMaxAcquisitionUsd,
      input.acquisitionValue,
      "acquisition USD",
    );
    minimum(
      input.profile.usToBrazilMinGrossProceedsBrl,
      input.grossProceeds,
      "gross BRL",
    );
    minimum(
      input.profile.usToBrazilMinGrossSpreadBrl,
      input.grossSpread,
      "gross spread BRL",
    );
    minimum(
      input.profile.usToBrazilMinNetProfitBrl,
      input.netProfit,
      "net profit BRL",
    );
    if (input.profitMarginPercent !== null)
      minimum(
        input.profile.usToBrazilMinProfitMarginPercent,
        input.profitMarginPercent,
        "profit margin %",
      );
    if (input.roiPercent !== null)
      minimum(
        input.profile.usToBrazilMinRoiPercent,
        input.roiPercent,
        "ROI %",
      );
  } else {
    minimum(
      input.profile.brazilToUsMinAcquisitionBrl,
      input.acquisitionValue,
      "acquisition BRL",
    );
    maximum(
      input.profile.brazilToUsMaxAcquisitionBrl,
      input.acquisitionValue,
      "acquisition BRL",
    );
    minimum(
      input.profile.brazilToUsMinGrossProceedsUsd,
      input.grossProceeds,
      "gross USD",
    );
    minimum(
      input.profile.brazilToUsMinGrossSpreadUsd,
      input.grossSpread,
      "gross spread USD",
    );
    minimum(
      input.profile.brazilToUsMinNetProfitUsd,
      input.netProfit,
      "net profit USD",
    );
    if (input.profitMarginPercent !== null)
      minimum(
        input.profile.brazilToUsMinProfitMarginPercent,
        input.profitMarginPercent,
        "profit margin %",
      );
    if (input.roiPercent !== null)
      minimum(
        input.profile.brazilToUsMinRoiPercent,
        input.roiPercent,
        "ROI %",
      );
  }
  return misses;
}

function positive(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

function nonNegative(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0;
}

function blocked(state: ArbitrageState, blocker: string): ArbitrageCalculation {
  return {
    state,
    blocker,
    grossProceeds: null,
    grossSpread: null,
    totalCost: null,
    netProfit: null,
    profitMarginPercent: null,
    roiPercent: null,
    meetsTargets: null,
    targetBlockers: [],
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
