import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const PRICECHARTING_SCHEMA_VERSION = "pricecharting-price-guide-v3";
export const PRICECHARTING_RESOLVER_VERSION = "pokemon-en-v9";
export const PRICECHARTING_RESOLVER_VERSIONS = {
  "pokemon-en": PRICECHARTING_RESOLVER_VERSION,
  "magic-en": "magic-en-v2",
  "onepiece-en": "onepiece-en-v3",
} as const;
export type PriceChartingGameProfile = keyof typeof PRICECHARTING_RESOLVER_VERSIONS;
export const PRICECHARTING_HEADERS = [
  "id", "console-name", "product-name", "loose-price", "cib-price", "new-price",
  "graded-price", "box-only-price", "manual-only-price", "bgs-10-price",
  "condition-17-price", "condition-18-price", "gamestop-price", "gamestop-trade-price",
  "retail-loose-buy", "retail-loose-sell", "retail-cib-buy", "retail-cib-sell",
  "retail-new-buy", "retail-new-sell", "upc", "sales-volume", "genre", "tcg-id",
  "asin", "epid", "release-date",
] as const;

export type ResolutionState = "AUTO_ACCEPTED" | "REVIEW_REQUIRED" | "AMBIGUOUS" | "TARGET_COLLISION" | "UNMATCHED" | "QUARANTINED" | "UNSUPPORTED" | "SUPERSEDED";
type ProductType = "SINGLE" | "SEALED" | "UNSUPPORTED_COLLECTIBLE" | "UNRESOLVED";
type CsvRow = Record<(typeof PRICECHARTING_HEADERS)[number], string>;

export type PriceChartingCsvInspection = {
  expectedGameRows: number;
  rowCount: number;
};

export type PriceChartingImportReport = {
  receiptId: number;
  outcome: "DRY_RUN" | "APPLIED" | "ALREADY_IMPORTED";
  sourceHash: string;
  normalizedRecordHash: string;
  crosswalkFingerprint: string;
  observationFingerprint: string;
  sourceRows: number;
  staged: number;
  accepted: number;
  reviewRequired: number;
  ambiguous: number;
  collisions: number;
  unmatched: number;
  quarantined: number;
  unsupported: number;
  gradedAccepted: number;
  priorActiveReceipt: number | null;
  activeReceipt: number | null;
  countsByReason: Record<string, number>;
  countsByLanguage: Record<string, number>;
  countsByProductType: Record<string, number>;
  countsByMethod: Record<string, number>;
  countsByPriceField: Record<string, number>;
  distinctProviderIds: number;
  distinctTargetSkus: number;
  targetCollisionCount: number;
  phronesisSingleDenominator: number;
};

export type ImportedPriceChartingEvidence = {
  id: string;
  productName: string;
  catalogueName: string;
  prices: Record<string, number | null>;
  observedAt: string;
  sourceUrl: string;
  source: "IMPORTED";
};

function hash(value: string): string { return createHash("sha256").update(value).digest("hex"); }
function normalize(value: string): string { return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(pokemon|cards?|tcg)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " "); }
function normalizeSet(value: string): string {
  let normalized = normalize(value)
    .replace(/^(mee\d*|me\d*|sve\d*|sv\d*|swsh\d*|sm\d*|xy\d*|bw\d*|hgss\d*|ex)\s+/, "")
    .replace(/\b(expansion|series)\b/g, "")
    .replace(/\band\b/g, " ")
    .replace(/\bvs\b/g, " ")
    .replace(/\benergies\b/g, "energy")
    .replace(/\bpromos\b/g, "promo")
    .replace(/\s+/g, " ")
    .trim();
  if (/^(scarlet violet|sword shield|black white) base set$/.test(normalized)) normalized = normalized.replace(/ base set$/, "");
  if (normalized === "firered leafgreen") normalized = "fire red leaf green";
  return normalized;
}
function compactWords(value: string): string { return value.replace(/\s+/g, " ").trim(); }
function canonicalMagicSet(value: string): string {
  let normalized = normalize(value)
    .replace(/^(?:magic\s+)+/, "")
    .replace(/^universes beyond\s+/, "")
    .replace(/\bthe\b/g, " ")
    .replace(/\bmarvel s\b/g, "marvel")
    .replace(/\burzas\b/g, "urza s");
  normalized = compactWords(normalized);
  normalized = normalized
    .replace(/^secret lair drop$/, "secret lair drop series")
    .replace(/^mystery booster$/, "list reprints")
    .replace(/^brother s war$/, "brothers war")
    .replace(/^brother s war retro artifacts$/, "brothers war retro frame artifacts")
    .replace(/^30th anniversary$/, "30th anniversary edition")
    .replace(/ eternal$/, " eternal legal")
    .replace(/^ravnica$/, "ravnica city of guilds")
    .replace(/^multiverse legends$/, "march of machine multiverse legends")
    .replace(/^dragons maze$/, "dragon s maze")
    .replace(/^friday night$/, "friday night magic")
    .replace(/^revised$/, "revised edition")
    .replace(/^unlimited$/, "unlimited edition")
    .replace(/^alpha$/, "alpha edition")
    .replace(/^beta$/, "beta edition")
    .replace(/^4th edition$/, "fourth edition")
    .replace(/^5th edition$/, "fifth edition")
    .replace(/^6th edition$/, "classic sixth edition")
    .replace(/^time spiral timeshifted$/, "time spiral")
    .replace(/^masterpiece series /, "")
    .replace(/^duel decks? /, "")
    .replace(/^duel deck /, "");
  const mSet = normalized.match(/^m(10|11|12|13|14|15)$/);
  if (mSet) normalized = `20${mSet[1]} m${mSet[1]}`;
  const coreSet = normalized.match(/^core set 20(10|11|12|13|14|15)$/);
  if (coreSet) normalized = `20${coreSet[1]} m${coreSet[1]}`;
  if (/ art series$/.test(normalized)) normalized = `art series ${normalized.replace(/ art series$/, "")}`;
  if (/ commander$/.test(normalized)) normalized = `commander ${normalized.replace(/ commander$/, "")}`;
  normalized = normalized
    .replace(/^commander new capenna$/, "commander streets of new capenna")
    .replace(/^commander midnight hunt$/, "commander innistrad midnight hunt")
    .replace(/^commander brother s war$/, "commander brothers war")
    .replace(/lord of rings(?: tales of middle earth)?/g, "lord of rings");
  return compactWords(normalized);
}
function canonicalOnePieceSet(value: string): string {
  let normalized = normalize(value)
    .replace(/^(?:one piece (?:japanese )?)+/, "")
    .replace(/ cards?$/, "")
    .replace(/^the /, "")
    .replace(/^a /, "")
    .replace(/ one piece /g, " ")
    .replace(/^promo$/, "promotion")
    .replace(/^premium booster 2$/, "premium booster the best vol 2")
    .replace(/^premium booster$/, "premium booster the best")
    .replace(/^extra booster eb04$/, "adventure on kami s island")
    .replace(/^starter starter deck /, "starter deck ")
    .replace(/^starter deck 21 gear5$/, "starter deck ex gear 5")
    .replace(/^starter deck ex 30 /, "starter deck ex ");
  normalized = compactWords(normalized);
  if (/^starter deck \d+(?: .*)?$/.test(normalized)) normalized = normalized.match(/^starter deck \d+/)![0];
  return normalized;
}

function canonicalProfileName(gameProfile: PriceChartingGameProfile, value: string): string {
  const normalized = normalize(value);
  return gameProfile === "onepiece-en" ? normalized.replace(/\s+/g, "") : normalized;
}
function canonicalProfileSet(gameProfile: PriceChartingGameProfile, value: string): string {
  if (gameProfile === "magic-en") return canonicalMagicSet(value);
  if (gameProfile === "onepiece-en") return canonicalOnePieceSet(value);
  return normalizeSet(value);
}
function setCompatible(sourceValue: string, targetValue: string, sourceCollector: string | null, targetCollector: string | null, targetName: string, qualifiers: string[]): boolean {
  const source = normalizeSet(sourceValue); const target = normalizeSet(targetValue);
  if (source === target) return true;
  if (source === "base set" && target === "base set shadowless") return true;
  if (hasTerm(normalize(qualifiers.join(" ")), "prize pack") && hasTerm(target, "prize pack")) return true;
  if (source === "promo" && /\bpromo\b/.test(target)) return true;
  if (source === "hidden fates" && target === "hidden fates shiny vault" && collectorLookupKey(sourceCollector).startsWith("SV")) return true;
  const targetDenominator = (canonicalCollector(targetCollector) ?? "").split("/")[1] ?? "";
  if (source === "sun moon" && target === "base set" && targetDenominator === "149") return true;
  if (source === "xy" && target === "base set" && targetDenominator === "146") return true;
  if (source === "2022 battle academy" && target === "battle academy 2022") return true;
  if (source === "mcdonalds 2021" && target === "mcdonald s 25th anniversary promo") return true;
  const championship = source.match(/^world championships (\d{4})$/);
  if (championship && target === "world championship decks" && normalize(targetName).includes(championship[1])) return true;
  return false;
}
function documentedNameAlias(sourceValue: string, targetValue: string): boolean {
  const source = normalize(sourceValue); const target = normalize(targetValue);
  if (source === "nidoran" && (target === "nidoran m" || target === "nidoran f")) return true;
  if (source === "burmy" && /^burmy (plant|sandy|trash) cloak$/.test(target)) return true;
  if (source === "wormadam" && /^wormadam (plant|sandy|trash) cloak$/.test(target)) return true;
  if ((source === "porygon 2" && target === "porygon2") || (source === "porygon2" && target === "porygon 2")) return true;
  return false;
}
function hasTerm(value: string, term: string): boolean { return ` ${value} `.includes(` ${term} `); }
const KNOWN_PHYSICAL_QUALIFIERS = ["reverse", "holo", "foil", "staff", "stamped", "prerelease", "error", "shadowless", "1st", "first", "promo", "jumbo", "cosmos", "league", "regional", "championship", "cracked ice", "ice cracked", "poke ball", "master ball", "poster", "prize pack", "center", "play", "ditto", "alternate", "secret", "full art", "illustration", "rainbow", "gold", "shiny"];
function canonicalCollector(value: string | null): string | null {
  if (!value) return null;
  const match = value.trim().toUpperCase().match(/^([A-Z]*)(\d+)([A-Z]*)(?:\/(\d+))?$/);
  if (!match) return value.trim().toUpperCase().replace(/^0+(?=\d)/, "");
  return `${match[1]}${String(Number(match[2]))}${match[3]}${match[4] ? `/${Number(match[4])}` : ""}`;
}
function collectorCompatible(source: string | null, target: string | null): boolean {
  if (!source || !target) return source === target;
  const [sourceNumerator, sourceDenominator] = canonicalCollector(source)!.split("/");
  const [targetNumerator, targetDenominator] = canonicalCollector(target)!.split("/");
  return sourceNumerator === targetNumerator && (!sourceDenominator || !targetDenominator || sourceDenominator === targetDenominator);
}
function collectorLookupKey(value: string | null): string { return (canonicalCollector(value) ?? "").split("/")[0]; }
function localBaseName(value: string): string {
  return value.replace(/\s+-\s+[A-Za-z]*\d+[A-Za-z]*(?:\/\d+)?(?:\s.*)?$/i, "").replace(/\[[^\]]+\]|\([^)]+\)/g, " ").trim();
}
function parseCsv(csv: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  const text = csv.replace(/^\uFEFF/, "");
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field); field = ""; }
    else if (character === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += character;
  }
  if (quoted) throw new Error("PriceCharting CSV contains an unterminated quoted field.");
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows.filter((candidate) => candidate.some((value) => value !== ""));
}

export function inspectPriceChartingCsv(source: string, gameProfile: PriceChartingGameProfile): PriceChartingCsvInspection {
  const rows = parseCsv(source);
  const headers = rows.shift();
  if (!headers || headers.length !== PRICECHARTING_HEADERS.length || headers.some((value, index) => value !== PRICECHARTING_HEADERS[index])) {
    throw new Error(`PriceCharting schema drift: expected the approved ${PRICECHARTING_HEADERS.length}-column contract.`);
  }
  let expectedGameRows = 0;
  for (const values of rows) {
    if (values.length !== PRICECHARTING_HEADERS.length) throw new Error("PriceCharting CSV contains a shifted column count.");
    const row = Object.fromEntries(PRICECHARTING_HEADERS.map((header, position) => [header, values[position]])) as CsvRow;
    const evidence = `${row["console-name"]} ${row.genre}`.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (gameProfile === "magic-en" && hasTerm(evidence, "magic")) expectedGameRows += 1;
    else if (gameProfile === "onepiece-en" && evidence.includes("one piece")) expectedGameRows += 1;
    else if (gameProfile === "pokemon-en" && hasTerm(evidence, "pokemon")) expectedGameRows += 1;
  }
  if (rows.length === 0 || expectedGameRows / rows.length < 0.95) {
    throw new Error(`PriceCharting game-profile mismatch: ${gameProfile} evidence was found in only ${expectedGameRows} of ${rows.length} rows.`);
  }
  return { expectedGameRows, rowCount: rows.length };
}
function cents(value: string): number | null {
  if (!value.trim()) return null;
  const normalized = value.trim().replace(/^\$/, "").replaceAll(",", "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error(`Malformed currency value: ${value}`);
  const parsed = Math.round(Number(normalized) * (normalized.includes(".") ? 100 : 1));
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`Invalid currency value: ${value}`);
  return parsed;
}
function validDate(value: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0001-")) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : value;
}
function parseIdentity(row: CsvRow, gameProfile: PriceChartingGameProfile) {
  const onePiecePattern = /(?:^|\s)#?((?:OP|ST|EB|PRB|PBR|EX|DP)\d{2}-\d{3}|P-\d{3})\b/gi;
  const onePieceMatches = gameProfile === "onepiece-en" ? [...row["product-name"].matchAll(onePiecePattern)] : [];
  const numberMatch = gameProfile === "onepiece-en"
    ? onePieceMatches.at(-1)
    : row["product-name"].match(/(?:^|\s)#([A-Za-z]*\d+[A-Za-z]*(?:\/\d+)?)\b/);
  const qualifiers = [...row["product-name"].matchAll(/\[([^\]]+)\]|\(([^)]+)\)/g)].map((match) => normalize(match[1] ?? match[2]));
  const baseName = row["product-name"]
    .replace(gameProfile === "onepiece-en" ? onePiecePattern : /(?:^|\s)#[A-Za-z]*\d+[A-Za-z]*(?:\/\d+)?\b/g, " ")
    .replace(/\[[^\]]+\]|\([^)]+\)/g, " ").trim();
  return { baseName, collectorNumber: canonicalCollector(numberMatch?.[1] ?? null), qualifiers };
}
function classify(row: CsvRow, gameProfile: PriceChartingGameProfile): ProductType {
  const genre = row.genre.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const catalogue = row["console-name"].toLowerCase();
  if (/topps|kfc|burger king|marble|sticker|coin|figure/.test(catalogue)) return "UNSUPPORTED_COLLECTIBLE";
  if (!genre || /^\d+$/.test(genre)) return "UNRESOLVED";
  if (/sealed/.test(genre)) return "SEALED";
  if (gameProfile === "magic-en") return /magic card/.test(genre) ? "SINGLE" : "UNSUPPORTED_COLLECTIBLE";
  if (gameProfile === "onepiece-en") return /one piece.*card/.test(genre) ? "SINGLE" : "UNSUPPORTED_COLLECTIBLE";
  if (/card|pokemon/.test(genre)) return "SINGLE";
  return "UNSUPPORTED_COLLECTIBLE";
}
function variationCompatible(qualifiers: string[], targetVariant: string, targetName: string, targetSetName: string, sourceCollector: string | null): boolean {
  const source = normalize(qualifiers.join(" ")).replace(/\bice cracked\b/g, "cracked ice"); const target = normalize(`${targetVariant} ${targetName}`);
  const targetAnnotations = normalize([...targetName.matchAll(/\[([^\]]+)\]|\(([^)]+)\)/g)].map((match) => match[1] ?? match[2]).join(" "));
  const normalizedTargetVariant = normalize(targetVariant);
  const sourceNonHolo = hasTerm(source, "non holo"); const targetNonHolo = hasTerm(target, "non holo");
  const sourceReverse = source.includes("reverse"); const targetReverse = target.includes("reverse");
  const sourceHolo = !sourceNonHolo && (source.includes("holo") || source.includes("foil")); const targetHolo = !targetNonHolo && (target.includes("holo") || target.includes("foil"));
  const implicitShinyReverse = !sourceReverse && targetReverse && collectorLookupKey(sourceCollector).startsWith("SH") && hasTerm(target, "shiny");
  if (sourceReverse !== targetReverse && !implicitShinyReverse) return false;
  if (sourceNonHolo && targetHolo) return false;
  if (sourceHolo && !targetHolo) return false;
  if (!sourceHolo && targetReverse && !implicitShinyReverse) return false;
  const sourceShadowless = hasTerm(source, "shadowless");
  const targetShadowless = hasTerm(target, "shadowless") || hasTerm(normalizeSet(targetSetName), "shadowless");
  if (sourceShadowless !== targetShadowless) return false;
  const annotatedDistributionQualifiers = ["poke ball", "master ball", "poster", "prize pack", "center", "play", "ditto"];
  if (!annotatedDistributionQualifiers.every((term) => hasTerm(source, term) === (hasTerm(targetAnnotations, term) || hasTerm(normalizedTargetVariant, term) || (term === "prize pack" && hasTerm(normalizeSet(targetSetName), term))))) return false;
  const distributionQualifiers = ["staff", "stamped", "prerelease", "error", "1st", "first", "promo", "jumbo", "cosmos", "league", "regional", "championship", "cracked ice"];
  if (!distributionQualifiers.every((term) => hasTerm(source, term) === hasTerm(target, term))) return false;
  const collectorDerivedQualifiers = ["alternate", "secret", "full art", "illustration", "rainbow", "gold", "shiny"];
  return collectorDerivedQualifiers.every((term) => !hasTerm(source, term) || hasTerm(target, term));
}
type PriceChartingTarget = Record<string, unknown>;
type ResolutionCandidate = { target: PriceChartingTarget; method: string };

function targetAnnotations(targetName: string): string[] {
  return [...targetName.matchAll(/\[([^\]]+)\]|\(([^)]+)\)/g)]
    .map((match) => normalize(match[1] ?? match[2]))
    .filter((annotation) => annotation && !/^\d+$/.test(annotation) && !/^(?:op|st|eb|prb|pbr|ex|dp)\d{2} \d{3}$/.test(annotation));
}

function canonicalMagicTreatment(value: string): string {
  let treatment = normalize(value)
    .replace(/\bpre release\b/g, "prerelease")
    .replace(/\bfoil etched\b/g, "etched foil")
    .replace(/^alternate$/, "alternate art")
    .replace(/^extended$/, "extended art")
    .replace(/^retro$/, "retro frame")
    .replace(/^gold signature$/, "gold stamped signature");
  const finishQualified = /^(extended art|borderless|showcase|retro frame|promo|alternate art|full art|prerelease) foil$/.exec(treatment);
  if (finishQualified) treatment = finishQualified[1];
  return compactWords(treatment);
}

function magicVariationCompatible(qualifiers: string[], target: PriceChartingTarget, sourceHasCollector: boolean): boolean {
  const sourceTreatments = qualifiers.map(canonicalMagicTreatment).filter(Boolean);
  const sourceFoil = sourceTreatments.some((value) => value.includes("foil")) || qualifiers.some((value) => /foil/.test(value));
  const targetFoil = normalize(String(target.variant)).includes("foil");
  if (sourceFoil !== targetFoil) return false;
  const meaningful = sourceTreatments.filter((value) => value !== "foil");
  const annotations = targetAnnotations(String(target.name)).map(canonicalMagicTreatment);
  const targetText = normalize(`${annotations.join(" ")} ${target.variant} ${target.set_name}`);
  if (meaningful.length === 0) return sourceHasCollector || annotations.length === 0;
  return meaningful.every((treatment) => hasTerm(targetText, treatment) || targetText.includes(treatment));
}

function canonicalOnePieceQualifier(value: string): string {
  return compactWords(normalize(value)
    .replace(/\balt art\b/g, "alternate art")
    .replace(/\bpre release\b/g, "pre release")
    .replace(/\balternate art manga\b/g, "manga")
    .replace(/\bsp foil\b/g, "sp")
    .replace(/\bparallel foil\b/g, "parallel"));
}

function onePieceVariationCompatible(qualifiers: string[], target: PriceChartingTarget): boolean {
  const source = qualifiers.map(canonicalOnePieceQualifier).filter(Boolean);
  const annotations = targetAnnotations(String(target.name));
  const targetText = normalize(`${annotations.join(" ")} ${target.variant} ${target.set_name}`);
  const sourceText = normalize(source.join(" "));
  const sourceFoil = hasTerm(sourceText, "foil");
  const targetFoil = normalize(String(target.variant)).includes("foil");
  if (sourceFoil && !targetFoil) return false;

  const prb2 = /\bprb\s*0?2\b/.test(sourceText);
  const prb1 = /\bprb\s*0?1\b|\bprb01\b/.test(sourceText);
  const targetSet = canonicalOnePieceSet(String(target.set_name));
  if (prb2 && targetSet !== "premium booster the best vol 2") return false;
  if (prb1 && targetSet !== "premium booster the best") return false;

  const semanticSource = compactWords(sourceText
    .replace(/\bprb\s*0?[12]\b|\bprb0?[12]\b/g, " ")
    .replace(/\bholofoil\b|\bholo\b|\bfoil\b/g, " "));
  const meaningful = semanticSource ? [semanticSource] : [];
  if (meaningful.length === 0) {
    if (prb2 && sourceFoil) return hasTerm(targetText, "pirate foil");
    if ((prb1 || prb2) && annotations.length > 0) return hasTerm(targetText, "reprint");
    return annotations.length === 0;
  }
  return meaningful.every((qualifier) => {
    if (qualifier === "manga") return hasTerm(targetText, "manga");
    if (qualifier === "red alternate art") return hasTerm(targetText, "red super alternate art");
    if (qualifier === "special alternate art") return hasTerm(targetText, "super alternate art") && !hasTerm(targetText, "red");
    if (qualifier === "alternate art") return (hasTerm(targetText, "alternate art") || hasTerm(targetText, "parallel")) && !/\b(?:manga|super|red|wanted)\b/.test(targetText);
    if (qualifier === "full art") return hasTerm(targetText, "full art");
    if (qualifier === "jolly roger") return hasTerm(targetText, "jolly roger");
    if (qualifier === "textured") return hasTerm(targetText, "textured");
    if (qualifier === "sp") return hasTerm(targetText, "sp");
    if (qualifier.includes("pre release")) return hasTerm(targetText, "pre release");
    if (qualifier === "reprint") return hasTerm(targetText, "reprint");
    if (qualifier === "winner") return hasTerm(targetText, "winner");
    return targetText.includes(qualifier);
  });
}

function localGameBaseName(value: string): string {
  return value
    .replace(/\s+-\s+(?:(?:OP|ST|EB|PRB|PBR|EX|DP)\d{2}-\d{3}|P-\d{3})(?:\s.*)?$/i, " ")
    .replace(/\[[^\]]+\]|\([^)]+\)/g, " ")
    .trim();
}

function pushIndex(index: Map<string, PriceChartingTarget[]>, key: string, target: PriceChartingTarget): void {
  index.set(key, [...(index.get(key) ?? []), target]);
}

function buildProfileIndexes(gameProfile: PriceChartingGameProfile, products: PriceChartingTarget[]) {
  const bySetName = new Map<string, PriceChartingTarget[]>();
  const bySetNameCollector = new Map<string, PriceChartingTarget[]>();
  const byNameCollector = new Map<string, PriceChartingTarget[]>();
  for (const product of products) {
    const baseName = canonicalProfileName(gameProfile, gameProfile === "pokemon-en" ? localBaseName(String(product.name)) : localGameBaseName(String(product.name)));
    const setName = canonicalProfileSet(gameProfile, String(product.set_name));
    const collector = collectorLookupKey(product.collector_number ? String(product.collector_number) : null);
    pushIndex(bySetName, `${setName}|${baseName}`, product);
    pushIndex(bySetNameCollector, `${setName}|${baseName}|${collector}`, product);
    pushIndex(byNameCollector, `${baseName}|${collector}`, product);
  }
  return { bySetName, bySetNameCollector, byNameCollector };
}

function resolveMagicRecord(record: Record<string, unknown>, indexes: ReturnType<typeof buildProfileIndexes>): ResolutionCandidate[] {
  const setName = canonicalMagicSet(String(record.set_evidence));
  const baseName = normalize(String(record.base_name));
  const sourceCollector = record.collector_number ? String(record.collector_number) : null;
  const qualifiers = JSON.parse(String(record.qualifiers_json)) as string[];
  let candidates = indexes.bySetName.get(`${setName}|${baseName}`) ?? [];
  if (sourceCollector) candidates = candidates.filter((target) => collectorCompatible(sourceCollector, target.collector_number ? String(target.collector_number) : null));
  candidates = candidates.filter((target) => magicVariationCompatible(qualifiers, target, Boolean(sourceCollector)));
  if (candidates.length === 0 && qualifiers.some((qualifier) => /prerelease|pre release|promo|judge|launch/.test(qualifier))) {
    const collector = collectorLookupKey(sourceCollector);
    candidates = (indexes.byNameCollector.get(`${baseName}|${collector}`) ?? []).filter((target) => magicVariationCompatible(qualifiers, target, Boolean(sourceCollector)));
    return candidates.map((target) => ({ target, method: "DOCUMENTED_CROSS_SET_VARIANT_IDENTITY" }));
  }
  const exactSet = normalize(String(record.set_evidence)) === normalize(candidates[0]?.set_name ? String(candidates[0].set_name) : "");
  return candidates.map((target) => ({ target, method: exactSet ? "EXACT_PHYSICAL_IDENTITY" : "DOCUMENTED_SET_ALIAS_IDENTITY" }));
}

function resolveOnePieceRecord(record: Record<string, unknown>, indexes: ReturnType<typeof buildProfileIndexes>): ResolutionCandidate[] {
  const setName = canonicalOnePieceSet(String(record.set_evidence));
  const baseName = canonicalProfileName("onepiece-en", String(record.base_name));
  const sourceCollector = record.collector_number ? String(record.collector_number) : null;
  const collector = collectorLookupKey(sourceCollector);
  const qualifiers = JSON.parse(String(record.qualifiers_json)) as string[];
  const crossSetQualifier = qualifiers.some((qualifier) => /pre release|prerelease|promo|winner|judge|anniversary|championship|treasure|regionals|serial|sp(?: |$)|prb|reprint|best selection|event/.test(qualifier));
  const exactKey = `${setName}|${baseName}|${collector}`;
  let candidates = crossSetQualifier ? [] : indexes.bySetNameCollector.get(exactKey) ?? [];
  candidates = candidates.filter((target) => collectorCompatible(sourceCollector, target.collector_number ? String(target.collector_number) : null)).filter((target) => onePieceVariationCompatible(qualifiers, target));
  let method = normalize(String(record.set_evidence)) === normalize(candidates[0]?.set_name ? String(candidates[0].set_name) : "") ? "EXACT_PHYSICAL_IDENTITY" : "DOCUMENTED_SET_ALIAS_IDENTITY";
  if (candidates.length === 0 && sourceCollector) {
    candidates = (indexes.byNameCollector.get(`${baseName}|${collector}`) ?? [])
      .filter((target) => collectorCompatible(sourceCollector, target.collector_number ? String(target.collector_number) : null))
      .filter((target) => onePieceVariationCompatible(qualifiers, target));
    method = "DOCUMENTED_CROSS_SET_VARIANT_IDENTITY";
  }
  return candidates.map((target) => ({ target, method }));
}
function targetFingerprint(target: Record<string, unknown>): string {
  return hash(JSON.stringify([target.category_id, target.sku, target.name, target.set_name, target.collector_number, target.variant, target.language]));
}

export class PriceChartingBulkRepository {
  constructor(readonly database: DatabaseSync) { this.migrate(); }

  private migrate(): void {
    this.database.exec(`
      PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS provider_import_receipt (
        id INTEGER PRIMARY KEY, provider_id TEXT NOT NULL, dataset_kind TEXT NOT NULL, game_profile TEXT NOT NULL,
        schema_contract_version TEXT NOT NULL, resolver_version TEXT NOT NULL, source_hash TEXT NOT NULL,
        byte_count INTEGER NOT NULL, source_row_count INTEGER NOT NULL DEFAULT 0, source_modified_at TEXT,
        started_at TEXT NOT NULL, completed_at TEXT, application_version TEXT NOT NULL, outcome TEXT NOT NULL,
        normalized_record_hash TEXT, crosswalk_fingerprint TEXT, observation_fingerprint TEXT,
        immutable_path TEXT NOT NULL, report_path TEXT,
        UNIQUE(provider_id,dataset_kind,game_profile,source_hash,schema_contract_version)
      );
      CREATE TABLE IF NOT EXISTS provider_import_record (
        id INTEGER PRIMARY KEY, receipt_id INTEGER NOT NULL, provider_id TEXT NOT NULL, provider_product_id TEXT NOT NULL,
        source_row_number INTEGER NOT NULL, game_profile TEXT NOT NULL, language TEXT NOT NULL, product_type TEXT NOT NULL,
        catalogue_name TEXT NOT NULL, product_name TEXT NOT NULL, base_name TEXT NOT NULL, set_evidence TEXT NOT NULL,
        collector_number TEXT, qualifiers_json TEXT NOT NULL, tcg_id TEXT, upc TEXT, asin TEXT, epid TEXT,
        release_date TEXT, sales_volume INTEGER, identity_fingerprint TEXT NOT NULL, observation_fingerprint TEXT NOT NULL,
        values_json TEXT NOT NULL, validation_reason TEXT,
        UNIQUE(provider_id,provider_product_id,receipt_id), FOREIGN KEY(receipt_id) REFERENCES provider_import_receipt(id)
      );
      CREATE INDEX IF NOT EXISTS provider_record_receipt ON provider_import_record(receipt_id,product_type,language);
      CREATE TABLE IF NOT EXISTS provider_identity_candidate (
        id INTEGER PRIMARY KEY, receipt_id INTEGER NOT NULL, record_id INTEGER NOT NULL, provider_id TEXT NOT NULL,
        provider_product_id TEXT NOT NULL, target_category_id TEXT, target_sku TEXT, state TEXT NOT NULL,
        method TEXT, reason_code TEXT NOT NULL, source_identity_fingerprint TEXT NOT NULL, target_identity_fingerprint TEXT,
        FOREIGN KEY(receipt_id) REFERENCES provider_import_receipt(id), FOREIGN KEY(record_id) REFERENCES provider_import_record(id)
      );
      CREATE INDEX IF NOT EXISTS provider_candidate_receipt ON provider_identity_candidate(receipt_id,state,target_sku);
      CREATE TABLE IF NOT EXISTS provider_identity_mapping (
        id INTEGER PRIMARY KEY, receipt_id INTEGER NOT NULL, provider_id TEXT NOT NULL, provider_product_id TEXT NOT NULL,
        game_profile TEXT NOT NULL, target_category_id TEXT NOT NULL, target_sku TEXT NOT NULL, method TEXT NOT NULL,
        source_identity_fingerprint TEXT NOT NULL, target_identity_fingerprint TEXT NOT NULL, mapped_at TEXT NOT NULL,
        UNIQUE(receipt_id,provider_id,provider_product_id), UNIQUE(receipt_id,provider_id,target_category_id,target_sku),
        FOREIGN KEY(receipt_id) REFERENCES provider_import_receipt(id)
      );
      CREATE TABLE IF NOT EXISTS provider_market_observation (
        id INTEGER PRIMARY KEY, receipt_id INTEGER NOT NULL, mapping_id INTEGER NOT NULL, provider_id TEXT NOT NULL,
        provider_product_id TEXT NOT NULL, evidence_lane TEXT NOT NULL, value_cents INTEGER NOT NULL, currency TEXT NOT NULL,
        observed_at TEXT NOT NULL, UNIQUE(provider_id,provider_product_id,evidence_lane,observed_at,receipt_id),
        FOREIGN KEY(receipt_id) REFERENCES provider_import_receipt(id), FOREIGN KEY(mapping_id) REFERENCES provider_identity_mapping(id)
      );
      CREATE TABLE IF NOT EXISTS provider_import_metric (
        receipt_id INTEGER NOT NULL, metric_group TEXT NOT NULL, metric_key TEXT NOT NULL, metric_value INTEGER NOT NULL,
        PRIMARY KEY(receipt_id,metric_group,metric_key), FOREIGN KEY(receipt_id) REFERENCES provider_import_receipt(id)
      );
      CREATE TABLE IF NOT EXISTS provider_import_active_state (
        provider_id TEXT NOT NULL, dataset_kind TEXT NOT NULL, game_profile TEXT NOT NULL, active_receipt_id INTEGER NOT NULL,
        activated_at TEXT NOT NULL, PRIMARY KEY(provider_id,dataset_kind,game_profile),
        FOREIGN KEY(active_receipt_id) REFERENCES provider_import_receipt(id)
      );
    `);
  }

  getSummary(gameProfile: PriceChartingGameProfile = "pokemon-en") {
    const state = this.database.prepare(`SELECT r.id,r.outcome,r.completed_at,r.source_row_count FROM provider_import_active_state a JOIN provider_import_receipt r ON r.id=a.active_receipt_id WHERE a.provider_id='pricecharting' AND a.dataset_kind='price-guide' AND a.game_profile=?`).get(gameProfile) as Record<string, unknown> | undefined;
    const latest = this.database.prepare(`SELECT id,outcome,completed_at,source_row_count FROM provider_import_receipt WHERE provider_id='pricecharting' AND dataset_kind='price-guide' AND game_profile=? ORDER BY id DESC LIMIT 1`).get(gameProfile) as Record<string, unknown> | undefined;
    const reviewReceipt = state ?? latest;
    const review = reviewReceipt ? this.database.prepare(`SELECT COUNT(*) count FROM provider_identity_candidate WHERE receipt_id=? AND state IN ('REVIEW_REQUIRED','AMBIGUOUS','TARGET_COLLISION')`).get(Number(reviewReceipt.id)) as { count: number } : { count: 0 };
    return { gameProfile, activeReceiptId: state ? Number(state.id) : null, latestReceiptId: latest ? Number(latest.id) : null, importedAt: reviewReceipt?.completed_at ? String(reviewReceipt.completed_at) : null, sourceRows: reviewReceipt ? Number(reviewReceipt.source_row_count) : 0, reviewRequired: Number(review.count), status: state ? "CURRENT" : latest?.outcome === "DRY_RUN" ? "DRY_RUN" : latest?.outcome === "FAILED" ? "FAILED" : "NOT_IMPORTED" };
  }

  getSummaries() { return (Object.keys(PRICECHARTING_RESOLVER_VERSIONS) as PriceChartingGameProfile[]).map((gameProfile) => this.getSummary(gameProfile)); }

  getEvidence(categoryId: string, sku: string): ImportedPriceChartingEvidence[] {
    const rows = this.database.prepare(`
      SELECT r.provider_product_id,r.product_name,r.catalogue_name,r.values_json,receipt.completed_at
      FROM provider_import_active_state active
      JOIN provider_identity_mapping m ON m.receipt_id=active.active_receipt_id
      JOIN provider_import_record r ON r.receipt_id=m.receipt_id AND r.provider_product_id=m.provider_product_id AND r.provider_id=m.provider_id
      JOIN provider_import_receipt receipt ON receipt.id=active.active_receipt_id
      WHERE active.provider_id='pricecharting' AND active.dataset_kind='price-guide' AND active.game_profile=?
        AND m.target_category_id=? AND m.target_sku=?
    `).all(categoryId, categoryId, sku) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.provider_product_id), productName: String(row.product_name), catalogueName: String(row.catalogue_name),
      prices: JSON.parse(String(row.values_json)) as Record<string, number | null>, observedAt: String(row.completed_at), source: "IMPORTED" as const,
      sourceUrl: `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(String(row.product_name))}`,
    }));
  }
}

export function importPriceChartingCsv(options: { file: string; databasePath: string; receiptDirectory: string; gameProfile?: string; apply?: boolean; applicationVersion?: string }): PriceChartingImportReport {
  const requestedProfile = options.gameProfile ?? "pokemon-en";
  if (!(requestedProfile in PRICECHARTING_RESOLVER_VERSIONS)) throw new Error(`Unsupported PriceCharting game profile: ${requestedProfile}`);
  const gameProfile = requestedProfile as PriceChartingGameProfile;
  const resolverVersion = PRICECHARTING_RESOLVER_VERSIONS[gameProfile];
  const source = readFileSync(options.file, "utf8"); const sourceHash = hash(source); const metadata = statSync(options.file);
  inspectPriceChartingCsv(source, gameProfile);
  const rows = parseCsv(source); rows.shift();
  mkdirSync(options.receiptDirectory, { recursive: true });
  const immutablePath = join(options.receiptDirectory, `${sourceHash}-${basename(options.file)}`);
  if (immutablePath !== options.file) copyFileSync(options.file, immutablePath);
  const database = new DatabaseSync(options.databasePath); new PriceChartingBulkRepository(database);
  const now = new Date().toISOString();
  const existing = database.prepare(`SELECT id,outcome,report_path,resolver_version FROM provider_import_receipt WHERE provider_id='pricecharting' AND dataset_kind='price-guide' AND game_profile=? AND source_hash=? AND schema_contract_version=?`).get(gameProfile, sourceHash, PRICECHARTING_SCHEMA_VERSION) as Record<string, unknown> | undefined;
  let receiptId: number;
  if (existing) receiptId = Number(existing.id);
  else {
    const result = database.prepare(`INSERT INTO provider_import_receipt(provider_id,dataset_kind,game_profile,schema_contract_version,resolver_version,source_hash,byte_count,source_modified_at,started_at,application_version,outcome,immutable_path) VALUES('pricecharting','price-guide',?,?,?,?,?,?,?,?,'PROCESSING',?)`).run(gameProfile, PRICECHARTING_SCHEMA_VERSION, resolverVersion, sourceHash, metadata.size, metadata.mtime.toISOString(), now, options.applicationVersion ?? "0.1.0", immutablePath);
    receiptId = Number(result.lastInsertRowid);
  }
  const priorActive = database.prepare(`SELECT active_receipt_id FROM provider_import_active_state WHERE provider_id='pricecharting' AND dataset_kind='price-guide' AND game_profile=?`).get(gameProfile) as { active_receipt_id: number } | undefined;
  if (existing && existing.resolver_version === resolverVersion && (!options.apply || existing.outcome === "APPLIED")) {
    const report = existing.report_path ? JSON.parse(readFileSync(String(existing.report_path), "utf8")) as PriceChartingImportReport : null;
    database.close();
    if (report) return { ...report, outcome: "ALREADY_IMPORTED" };
  }
  if (!existing) {
    const insertRecord = database.prepare(`INSERT INTO provider_import_record(receipt_id,provider_id,provider_product_id,source_row_number,game_profile,language,product_type,catalogue_name,product_name,base_name,set_evidence,collector_number,qualifiers_json,tcg_id,upc,asin,epid,release_date,sales_volume,identity_fingerprint,observation_fingerprint,values_json,validation_reason) VALUES(?,'pricecharting',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    database.exec("BEGIN");
    try {
      rows.forEach((values, index) => {
        if (values.length !== PRICECHARTING_HEADERS.length) throw new Error(`Shifted column count at source row ${index + 2}.`);
        const row = Object.fromEntries(PRICECHARTING_HEADERS.map((header, position) => [header, values[position]])) as CsvRow;
        if (!/^\d+$/.test(row.id)) throw new Error(`Invalid PriceCharting ID at source row ${index + 2}.`);
        const identity = parseIdentity(row, gameProfile); const productType = classify(row, gameProfile);
        const language = /japanese|korean|chinese|german|french|spanish|italian|portuguese/.test(normalize(row["console-name"])) ? "NON_ENGLISH" : "ENGLISH";
        const priceMap = { Ungraded: cents(row["loose-price"]), "Grade 7/7.5": cents(row["cib-price"]), "Grade 8/8.5": cents(row["new-price"]), "Grade 9": cents(row["graded-price"]), "Grade 9.5": cents(row["box-only-price"]), "PSA 10": cents(row["manual-only-price"]), "BGS 10": cents(row["bgs-10-price"]), "CGC 10": cents(row["condition-17-price"]), "SGC 10": cents(row["condition-18-price"]), "Retail Loose Buy": cents(row["retail-loose-buy"]), "Retail Loose Sell": cents(row["retail-loose-sell"]), "Retail CIB Buy": cents(row["retail-cib-buy"]), "Retail CIB Sell": cents(row["retail-cib-sell"]), "Retail New Buy": cents(row["retail-new-buy"]), "Retail New Sell": cents(row["retail-new-sell"]) };
        const releaseDate = validDate(row["release-date"]); const validationReason = row["release-date"] && !releaseDate ? "INVALID_RELEASE_DATE" : productType === "UNRESOLVED" ? "UNKNOWN_GENRE" : null;
        const identityFingerprint = hash(JSON.stringify([normalize(identity.baseName), canonicalProfileSet(gameProfile, row["console-name"]), identity.collectorNumber, identity.qualifiers, language, productType]));
        insertRecord.run(receiptId, row.id, index + 2, gameProfile, language, productType, row["console-name"], row["product-name"], identity.baseName, row["console-name"], identity.collectorNumber, JSON.stringify(identity.qualifiers), row["tcg-id"] || null, row.upc || null, row.asin || null, row.epid || null, releaseDate, /^\d+$/.test(row["sales-volume"]) ? Number(row["sales-volume"]) : null, identityFingerprint, hash(JSON.stringify(priceMap)), JSON.stringify(priceMap), validationReason);
      });
      database.exec("COMMIT");
    } catch (error) { database.exec("ROLLBACK"); database.close(); throw error; }
  }
  database.prepare("DELETE FROM provider_identity_candidate WHERE receipt_id=?").run(receiptId);
  const records = database.prepare("SELECT * FROM provider_import_record WHERE receipt_id=? ORDER BY source_row_number").all(receiptId) as Array<Record<string, unknown>>;
  const products = database.prepare("SELECT category_id,sku,name,set_name,collector_number,variant,language,product_type FROM pricing_products WHERE category_id=?").all(gameProfile) as Array<Record<string, unknown>>;
  const profileIndexes = buildProfileIndexes(gameProfile, products);
  const indexes = new Map<string, Array<Record<string, unknown>>>();
  const setCollectorIndexes = new Map<string, Array<Record<string, unknown>>>();
  for (const product of products) {
    const key = `${normalize(localBaseName(String(product.name)))}|${collectorLookupKey(product.collector_number ? String(product.collector_number) : null)}`;
    indexes.set(key, [...(indexes.get(key) ?? []), product]);
    const setCollectorKey = `${normalizeSet(String(product.set_name))}|${collectorLookupKey(product.collector_number ? String(product.collector_number) : null)}`;
    setCollectorIndexes.set(setCollectorKey, [...(setCollectorIndexes.get(setCollectorKey) ?? []), product]);
  }
  const finishlessQualifiers = (record: Record<string, unknown>) => (JSON.parse(String(record.qualifiers_json)) as string[]).map((qualifier) => normalize(qualifier).replace(/\b(?:non|reverse) holo(?:foil)?\b|\bholofoil\b|\bholo\b|\bfoil\b|\breverse\b/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean).sort().join("+");
  const sourceFinishFamilyKey = (record: Record<string, unknown>) => `${normalizeSet(String(record.set_evidence))}|${normalize(String(record.base_name))}|${collectorLookupKey(record.collector_number ? String(record.collector_number) : null)}|${finishlessQualifiers(record)}`;
  const identitiesWithExplicitHolo = new Set(records.filter((record) => { const source = normalize((JSON.parse(String(record.qualifiers_json)) as string[]).join(" ")); return !hasTerm(source, "non holo") && (source.includes("holo") || source.includes("foil")) && !hasTerm(source, "reverse"); }).map(sourceFinishFamilyKey));
  const priorMappings = new Map<string, Record<string, unknown>>();
  const priorRows = database.prepare(`
    SELECT m.provider_product_id,m.source_identity_fingerprint,m.target_identity_fingerprint,p.*
    FROM provider_import_active_state a
    JOIN provider_identity_mapping m ON m.receipt_id=a.active_receipt_id
    JOIN pricing_products p ON p.category_id=m.target_category_id AND p.sku=m.target_sku
    WHERE a.provider_id='pricecharting' AND a.dataset_kind='price-guide' AND a.game_profile=?
  `).all(gameProfile) as Array<Record<string, unknown>>;
  for (const mapping of priorRows) priorMappings.set(String(mapping.provider_product_id), mapping);
  const resolutions: Array<{ record: Record<string, unknown>; state: ResolutionState; target?: Record<string, unknown>; method?: string; reason: string }> = [];
  for (const record of records) {
    if (record.validation_reason) { resolutions.push({ record, state: "QUARANTINED", reason: String(record.validation_reason) }); continue; }
    if (record.language !== "ENGLISH") { resolutions.push({ record, state: "UNSUPPORTED", reason: "NON_ENGLISH" }); continue; }
    if (record.product_type === "UNSUPPORTED_COLLECTIBLE") { resolutions.push({ record, state: "UNSUPPORTED", reason: "UNSUPPORTED_PRODUCT_TYPE" }); continue; }
    if (record.product_type === "SEALED") { resolutions.push({ record, state: "REVIEW_REQUIRED", reason: "SEALED_PROFILE_DEFERRED" }); continue; }
    const priorMapping = priorMappings.get(String(record.provider_product_id));
    if (priorMapping && priorMapping.source_identity_fingerprint === record.identity_fingerprint && priorMapping.target_identity_fingerprint === targetFingerprint(priorMapping)) {
      resolutions.push({ record, state: "AUTO_ACCEPTED", target: priorMapping, method: "EXISTING_ACCEPTED_PROVIDER_MAPPING", reason: "UNCHANGED_ACCEPTED_MAPPING" }); continue;
    }
    if (gameProfile !== "pokemon-en") {
      const candidates = gameProfile === "magic-en" ? resolveMagicRecord(record, profileIndexes) : resolveOnePieceRecord(record, profileIndexes);
      if (candidates.length === 1) resolutions.push({ record, state: "AUTO_ACCEPTED", target: candidates[0].target, method: candidates[0].method, reason: "UNIQUE_PHYSICAL_IDENTITY" });
      else if (candidates.length > 1) resolutions.push({ record, state: "AMBIGUOUS", reason: "MULTIPLE_TARGETS" });
      else resolutions.push({ record, state: "UNMATCHED", reason: "NO_EXACT_PHYSICAL_IDENTITY" });
      continue;
    }
    const key = `${normalize(String(record.base_name))}|${collectorLookupKey(record.collector_number ? String(record.collector_number) : null)}`;
    const sourceCollector = record.collector_number ? String(record.collector_number) : null; const sourceSet = String(record.set_evidence); const qualifiers = JSON.parse(String(record.qualifiers_json)) as string[];
    const candidates = (indexes.get(key) ?? []).filter((target) => collectorCompatible(sourceCollector, target.collector_number ? String(target.collector_number) : null)).filter((target) => setCompatible(sourceSet, String(target.set_name), sourceCollector, target.collector_number ? String(target.collector_number) : null, String(target.name), qualifiers)).filter((target) => variationCompatible(qualifiers, String(target.variant), String(target.name), String(target.set_name), sourceCollector));
    const aliasCandidates = candidates.length ? [] : (setCollectorIndexes.get(`${normalizeSet(sourceSet)}|${collectorLookupKey(sourceCollector)}`) ?? []).filter((target) => collectorCompatible(sourceCollector, target.collector_number ? String(target.collector_number) : null)).filter((target) => setCompatible(sourceSet, String(target.set_name), sourceCollector, target.collector_number ? String(target.collector_number) : null, String(target.name), qualifiers)).filter((target) => documentedNameAlias(String(record.base_name), localBaseName(String(target.name)))).filter((target) => variationCompatible(qualifiers, String(target.variant), String(target.name), String(target.set_name), sourceCollector));
    let resolvedCandidates = candidates.length ? candidates : aliasCandidates;
    const sourceVariation = normalize(qualifiers.join(" "));
    if (resolvedCandidates.length > 1 && !sourceVariation.includes("holo") && !sourceVariation.includes("foil") && !sourceVariation.includes("reverse") && identitiesWithExplicitHolo.has(sourceFinishFamilyKey(record))) {
      const nonHoloCandidates = resolvedCandidates.filter((target) => { const physical = normalize(`${target.variant} ${target.name}`); return hasTerm(physical, "non holo") || (!physical.includes("holo") && !physical.includes("foil")); });
      if (nonHoloCandidates.length === 1) resolvedCandidates = nonHoloCandidates;
    }
    if (resolvedCandidates.length > 1) {
      const identityQualifiers = qualifiers.filter((qualifier) => !KNOWN_PHYSICAL_QUALIFIERS.some((term) => hasTerm(qualifier.replace(/\bice cracked\b/g, "cracked ice"), term)));
      if (identityQualifiers.length) {
        const annotatedCandidates = resolvedCandidates.filter((target) => identityQualifiers.every((qualifier) => hasTerm(normalize(String(target.name)), qualifier)));
        if (annotatedCandidates.length === 1) resolvedCandidates = annotatedCandidates;
      }
    }
    if (resolvedCandidates.length === 1) resolutions.push({ record, state: "AUTO_ACCEPTED", target: resolvedCandidates[0], method: aliasCandidates.length ? "DOCUMENTED_NAME_ALIAS_IDENTITY" : normalize(String(record.set_evidence)) === normalize(String(resolvedCandidates[0].set_name)) ? "EXACT_PHYSICAL_IDENTITY" : "DOCUMENTED_SET_ALIAS_IDENTITY", reason: "UNIQUE_PHYSICAL_IDENTITY" });
    else if (resolvedCandidates.length > 1) resolutions.push({ record, state: "AMBIGUOUS", reason: "MULTIPLE_TARGETS" });
    else resolutions.push({ record, state: "UNMATCHED", reason: "NO_EXACT_PHYSICAL_IDENTITY" });
  }
  const byTarget = new Map<string, number>();
  for (const resolution of resolutions) if (resolution.state === "AUTO_ACCEPTED" && resolution.target) { const key = `${resolution.target.category_id}|${resolution.target.sku}`; byTarget.set(key, (byTarget.get(key) ?? 0) + 1); }
  for (const resolution of resolutions) if (resolution.state === "AUTO_ACCEPTED" && resolution.target && (byTarget.get(`${resolution.target.category_id}|${resolution.target.sku}`) ?? 0) > 1) { resolution.state = "TARGET_COLLISION"; resolution.reason = "MULTIPLE_PROVIDER_PRODUCTS_ONE_TARGET"; delete resolution.target; delete resolution.method; }
  const insertCandidate = database.prepare("INSERT INTO provider_identity_candidate(receipt_id,record_id,provider_id,provider_product_id,target_category_id,target_sku,state,method,reason_code,source_identity_fingerprint,target_identity_fingerprint) VALUES(?,?,'pricecharting',?,?,?,?,?,?,?,?)");
  database.exec("BEGIN");
  try { for (const resolution of resolutions) { const fingerprint = resolution.target ? targetFingerprint(resolution.target) : null; insertCandidate.run(receiptId, Number(resolution.record.id), String(resolution.record.provider_product_id), resolution.target ? String(resolution.target.category_id) : null, resolution.target ? String(resolution.target.sku) : null, resolution.state, resolution.method ?? null, resolution.reason, String(resolution.record.identity_fingerprint), fingerprint); } database.exec("COMMIT"); } catch (error) { database.exec("ROLLBACK"); database.close(); throw error; }
  const countsByReason: Record<string, number> = {}; for (const resolution of resolutions) countsByReason[resolution.reason] = (countsByReason[resolution.reason] ?? 0) + 1;
  const countsByLanguage: Record<string, number> = {}; const countsByProductType: Record<string, number> = {}; const countsByPriceField: Record<string, number> = {};
  for (const record of records) {
    const language = String(record.language); const productType = String(record.product_type);
    countsByLanguage[language] = (countsByLanguage[language] ?? 0) + 1; countsByProductType[productType] = (countsByProductType[productType] ?? 0) + 1;
    const values = JSON.parse(String(record.values_json)) as Record<string, number | null>;
    for (const [lane, value] of Object.entries(values)) if (value !== null) countsByPriceField[lane] = (countsByPriceField[lane] ?? 0) + 1;
  }
  const countsByMethod: Record<string, number> = {}; for (const resolution of resolutions) if (resolution.method) countsByMethod[resolution.method] = (countsByMethod[resolution.method] ?? 0) + 1;
  const count = (state: ResolutionState) => resolutions.filter((resolution) => resolution.state === state).length;
  const acceptedRows = resolutions.filter((resolution) => resolution.state === "AUTO_ACCEPTED");
  const normalizedRecordHash = hash(records.map((record) => `${record.provider_product_id}:${record.identity_fingerprint}:${record.observation_fingerprint}`).join("\n"));
  const crosswalkFingerprint = hash(acceptedRows.map((resolution) => `${resolution.record.provider_product_id}:${resolution.target?.category_id}:${resolution.target?.sku}:${resolution.method}`).sort().join("\n"));
  const observationFingerprint = hash(acceptedRows.map((resolution) => `${resolution.record.provider_product_id}:${resolution.record.observation_fingerprint}`).sort().join("\n"));
  if (options.apply) {
    if (records.length !== rows.length) { database.close(); throw new Error("Receipt row-count reconciliation failed before promotion."); }
    if (new Set(acceptedRows.map((resolution) => String(resolution.record.provider_product_id))).size !== acceptedRows.length || new Set(acceptedRows.map((resolution) => `${resolution.target?.category_id}|${resolution.target?.sku}`)).size !== acceptedRows.length) { database.close(); throw new Error("Accepted mapping uniqueness failed before promotion."); }
    database.exec("BEGIN IMMEDIATE");
    try {
      database.prepare("DELETE FROM provider_market_observation WHERE receipt_id=?").run(receiptId); database.prepare("DELETE FROM provider_identity_mapping WHERE receipt_id=?").run(receiptId);
      const insertMapping = database.prepare("INSERT INTO provider_identity_mapping(receipt_id,provider_id,provider_product_id,game_profile,target_category_id,target_sku,method,source_identity_fingerprint,target_identity_fingerprint,mapped_at) VALUES(?,'pricecharting',?,?,?,?,?,?,?,?)");
      const insertObservation = database.prepare("INSERT INTO provider_market_observation(receipt_id,mapping_id,provider_id,provider_product_id,evidence_lane,value_cents,currency,observed_at) VALUES(?,?,'pricecharting',?,?,?,'USD',?)");
      for (const resolution of acceptedRows) {
        const fingerprint = targetFingerprint(resolution.target!);
        const mapping = insertMapping.run(receiptId, String(resolution.record.provider_product_id), gameProfile, String(resolution.target?.category_id), String(resolution.target?.sku), resolution.method ?? "EXACT_PHYSICAL_IDENTITY", String(resolution.record.identity_fingerprint), fingerprint, now);
        const values = JSON.parse(String(resolution.record.values_json)) as Record<string, number | null>;
        for (const [lane, value] of Object.entries(values)) if (value !== null) insertObservation.run(receiptId, mapping.lastInsertRowid, String(resolution.record.provider_product_id), lane, value, now);
      }
      database.prepare("INSERT INTO provider_import_active_state(provider_id,dataset_kind,game_profile,active_receipt_id,activated_at) VALUES('pricecharting','price-guide',?,?,?) ON CONFLICT(provider_id,dataset_kind,game_profile) DO UPDATE SET active_receipt_id=excluded.active_receipt_id,activated_at=excluded.activated_at").run(gameProfile, receiptId, now);
      database.exec("COMMIT");
    } catch (error) { database.exec("ROLLBACK"); database.close(); throw error; }
  }
  const report: PriceChartingImportReport = { receiptId, outcome: options.apply ? "APPLIED" : "DRY_RUN", sourceHash, normalizedRecordHash, crosswalkFingerprint, observationFingerprint, sourceRows: rows.length, staged: records.length, accepted: count("AUTO_ACCEPTED"), reviewRequired: count("REVIEW_REQUIRED"), ambiguous: count("AMBIGUOUS"), collisions: count("TARGET_COLLISION"), unmatched: count("UNMATCHED"), quarantined: count("QUARANTINED"), unsupported: count("UNSUPPORTED"), gradedAccepted: acceptedRows.filter((resolution) => { const values = JSON.parse(String(resolution.record.values_json)) as Record<string, number | null>; return Object.entries(values).some(([lane, value]) => lane !== "Ungraded" && !lane.startsWith("Retail") && value !== null); }).length, priorActiveReceipt: priorActive ? Number(priorActive.active_receipt_id) : null, activeReceipt: options.apply ? receiptId : priorActive ? Number(priorActive.active_receipt_id) : null, countsByReason, countsByLanguage, countsByProductType, countsByMethod, countsByPriceField, distinctProviderIds: new Set(records.map((record) => String(record.provider_product_id))).size, distinctTargetSkus: new Set(acceptedRows.map((resolution) => `${resolution.target?.category_id}|${resolution.target?.sku}`)).size, targetCollisionCount: [...byTarget.values()].filter((value) => value > 1).length, phronesisSingleDenominator: products.filter((product) => product.product_type === "SINGLE").length };
  database.prepare("DELETE FROM provider_import_metric WHERE receipt_id=?").run(receiptId);
  const insertMetric = database.prepare("INSERT INTO provider_import_metric(receipt_id,metric_group,metric_key,metric_value) VALUES(?,?,?,?)");
  for (const [key, metricValue] of Object.entries({ sourceRows: report.sourceRows, staged: report.staged, accepted: report.accepted, reviewRequired: report.reviewRequired, ambiguous: report.ambiguous, collisions: report.collisions, unmatched: report.unmatched, quarantined: report.quarantined, unsupported: report.unsupported, gradedAccepted: report.gradedAccepted })) insertMetric.run(receiptId, "resolution", key, metricValue);
  for (const [reason, metricValue] of Object.entries(countsByReason)) insertMetric.run(receiptId, "reason", reason, metricValue);
  for (const [language, metricValue] of Object.entries(countsByLanguage)) insertMetric.run(receiptId, "language", language, metricValue);
  for (const [productType, metricValue] of Object.entries(countsByProductType)) insertMetric.run(receiptId, "product_type", productType, metricValue);
  for (const [method, metricValue] of Object.entries(countsByMethod)) insertMetric.run(receiptId, "method", method, metricValue);
  for (const [lane, metricValue] of Object.entries(countsByPriceField)) insertMetric.run(receiptId, "price_field", lane, metricValue);
  const reportPath = join(options.receiptDirectory, `${sourceHash}-${PRICECHARTING_SCHEMA_VERSION}-${resolverVersion}-report.json`); writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  database.prepare("UPDATE provider_import_receipt SET resolver_version=?,source_row_count=?,completed_at=?,outcome=?,normalized_record_hash=?,crosswalk_fingerprint=?,observation_fingerprint=?,report_path=? WHERE id=?").run(resolverVersion, rows.length, now, report.outcome, normalizedRecordHash, crosswalkFingerprint, observationFingerprint, reportPath, receiptId);
  database.close(); return report;
}

export function openPriceChartingBulkRepository(databasePath: string): { repository: PriceChartingBulkRepository; close: () => void } {
  mkdirSync(dirname(databasePath), { recursive: true }); const database = new DatabaseSync(databasePath);
  return { repository: new PriceChartingBulkRepository(database), close: () => database.close() };
}
