import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const PRICECHARTING_SCHEMA_VERSION = "pricecharting-price-guide-v3";
export const PRICECHARTING_RESOLVER_VERSION = "pokemon-en-v9";
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
function parseIdentity(row: CsvRow) {
  const numberMatch = row["product-name"].match(/(?:^|\s)#([A-Za-z]*\d+[A-Za-z]*(?:\/\d+)?)\b/);
  const qualifiers = [...row["product-name"].matchAll(/\[([^\]]+)\]|\(([^)]+)\)/g)].map((match) => normalize(match[1] ?? match[2]));
  const baseName = row["product-name"].replace(/(?:^|\s)#[A-Za-z]*\d+[A-Za-z]*(?:\/\d+)?\b/g, " ").replace(/\[[^\]]+\]|\([^)]+\)/g, " ").trim();
  return { baseName, collectorNumber: canonicalCollector(numberMatch?.[1] ?? null), qualifiers };
}
function classify(row: CsvRow): ProductType {
  const genre = row.genre.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const catalogue = row["console-name"].toLowerCase();
  if (/topps|kfc|burger king|marble|sticker|coin|figure/.test(catalogue)) return "UNSUPPORTED_COLLECTIBLE";
  if (!genre || /^\d+$/.test(genre)) return "UNRESOLVED";
  if (/sealed/.test(genre)) return "SEALED";
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

  getSummary() {
    const state = this.database.prepare(`SELECT r.id,r.outcome,r.completed_at,r.source_row_count FROM provider_import_active_state a JOIN provider_import_receipt r ON r.id=a.active_receipt_id WHERE a.provider_id='pricecharting' AND a.dataset_kind='price-guide' AND a.game_profile='pokemon-en'`).get() as Record<string, unknown> | undefined;
    const latest = this.database.prepare(`SELECT id,outcome,completed_at,source_row_count FROM provider_import_receipt WHERE provider_id='pricecharting' AND dataset_kind='price-guide' AND game_profile='pokemon-en' ORDER BY id DESC LIMIT 1`).get() as Record<string, unknown> | undefined;
    const reviewReceipt = state ?? latest;
    const review = reviewReceipt ? this.database.prepare(`SELECT COUNT(*) count FROM provider_identity_candidate WHERE receipt_id=? AND state IN ('REVIEW_REQUIRED','AMBIGUOUS','TARGET_COLLISION')`).get(Number(reviewReceipt.id)) as { count: number } : { count: 0 };
    return { activeReceiptId: state ? Number(state.id) : null, latestReceiptId: latest ? Number(latest.id) : null, importedAt: reviewReceipt?.completed_at ? String(reviewReceipt.completed_at) : null, sourceRows: reviewReceipt ? Number(reviewReceipt.source_row_count) : 0, reviewRequired: Number(review.count), status: state ? "CURRENT" : latest?.outcome === "DRY_RUN" ? "DRY_RUN" : latest?.outcome === "FAILED" ? "FAILED" : "NOT_IMPORTED" };
  }

  getEvidence(categoryId: string, sku: string): ImportedPriceChartingEvidence[] {
    const rows = this.database.prepare(`
      SELECT r.provider_product_id,r.product_name,r.catalogue_name,r.values_json,receipt.completed_at
      FROM provider_import_active_state active
      JOIN provider_identity_mapping m ON m.receipt_id=active.active_receipt_id
      JOIN provider_import_record r ON r.receipt_id=m.receipt_id AND r.provider_product_id=m.provider_product_id AND r.provider_id=m.provider_id
      JOIN provider_import_receipt receipt ON receipt.id=active.active_receipt_id
      WHERE active.provider_id='pricecharting' AND active.dataset_kind='price-guide' AND active.game_profile='pokemon-en'
        AND m.target_category_id=? AND m.target_sku=?
    `).all(categoryId, sku) as Array<Record<string, unknown>>;
    return rows.map((row) => ({
      id: String(row.provider_product_id), productName: String(row.product_name), catalogueName: String(row.catalogue_name),
      prices: JSON.parse(String(row.values_json)) as Record<string, number | null>, observedAt: String(row.completed_at), source: "IMPORTED" as const,
      sourceUrl: `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(String(row.product_name))}`,
    }));
  }
}

export function importPriceChartingCsv(options: { file: string; databasePath: string; receiptDirectory: string; gameProfile?: string; apply?: boolean; applicationVersion?: string }): PriceChartingImportReport {
  const gameProfile = options.gameProfile ?? "pokemon-en";
  if (gameProfile !== "pokemon-en") throw new Error(`Unsupported PriceCharting game profile: ${gameProfile}`);
  const source = readFileSync(options.file, "utf8"); const sourceHash = hash(source); const metadata = statSync(options.file);
  const rows = parseCsv(source); const headers = rows.shift();
  if (!headers || headers.length !== PRICECHARTING_HEADERS.length || headers.some((value, index) => value !== PRICECHARTING_HEADERS[index])) throw new Error(`PriceCharting schema drift: expected the approved ${PRICECHARTING_HEADERS.length}-column contract.`);
  mkdirSync(options.receiptDirectory, { recursive: true });
  const immutablePath = join(options.receiptDirectory, `${sourceHash}-${basename(options.file)}`);
  if (immutablePath !== options.file) copyFileSync(options.file, immutablePath);
  const database = new DatabaseSync(options.databasePath); new PriceChartingBulkRepository(database);
  const now = new Date().toISOString();
  const existing = database.prepare(`SELECT id,outcome,report_path,resolver_version FROM provider_import_receipt WHERE provider_id='pricecharting' AND dataset_kind='price-guide' AND game_profile=? AND source_hash=? AND schema_contract_version=?`).get(gameProfile, sourceHash, PRICECHARTING_SCHEMA_VERSION) as Record<string, unknown> | undefined;
  let receiptId: number;
  if (existing) receiptId = Number(existing.id);
  else {
    const result = database.prepare(`INSERT INTO provider_import_receipt(provider_id,dataset_kind,game_profile,schema_contract_version,resolver_version,source_hash,byte_count,source_modified_at,started_at,application_version,outcome,immutable_path) VALUES('pricecharting','price-guide',?,?,?,?,?,?,?,?,'PROCESSING',?)`).run(gameProfile, PRICECHARTING_SCHEMA_VERSION, PRICECHARTING_RESOLVER_VERSION, sourceHash, metadata.size, metadata.mtime.toISOString(), now, options.applicationVersion ?? "0.1.0", immutablePath);
    receiptId = Number(result.lastInsertRowid);
  }
  const priorActive = database.prepare(`SELECT active_receipt_id FROM provider_import_active_state WHERE provider_id='pricecharting' AND dataset_kind='price-guide' AND game_profile=?`).get(gameProfile) as { active_receipt_id: number } | undefined;
  if (existing && existing.resolver_version === PRICECHARTING_RESOLVER_VERSION && (!options.apply || existing.outcome === "APPLIED")) {
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
        const identity = parseIdentity(row); const productType = classify(row);
        const language = /japanese|korean|chinese|german|french|spanish|italian|portuguese/.test(normalize(row["console-name"])) ? "NON_ENGLISH" : "ENGLISH";
        const priceMap = { Ungraded: cents(row["loose-price"]), "Grade 7/7.5": cents(row["cib-price"]), "Grade 8/8.5": cents(row["new-price"]), "Grade 9": cents(row["graded-price"]), "Grade 9.5": cents(row["box-only-price"]), "PSA 10": cents(row["manual-only-price"]), "BGS 10": cents(row["bgs-10-price"]), "CGC 10": cents(row["condition-17-price"]), "SGC 10": cents(row["condition-18-price"]), "Retail Loose Buy": cents(row["retail-loose-buy"]), "Retail Loose Sell": cents(row["retail-loose-sell"]), "Retail CIB Buy": cents(row["retail-cib-buy"]), "Retail CIB Sell": cents(row["retail-cib-sell"]), "Retail New Buy": cents(row["retail-new-buy"]), "Retail New Sell": cents(row["retail-new-sell"]) };
        const releaseDate = validDate(row["release-date"]); const validationReason = row["release-date"] && !releaseDate ? "INVALID_RELEASE_DATE" : productType === "UNRESOLVED" ? "UNKNOWN_GENRE" : null;
        const identityFingerprint = hash(JSON.stringify([normalize(identity.baseName), normalizeSet(row["console-name"]), identity.collectorNumber, identity.qualifiers, language, productType]));
        insertRecord.run(receiptId, row.id, index + 2, gameProfile, language, productType, row["console-name"], row["product-name"], identity.baseName, row["console-name"], identity.collectorNumber, JSON.stringify(identity.qualifiers), row["tcg-id"] || null, row.upc || null, row.asin || null, row.epid || null, releaseDate, /^\d+$/.test(row["sales-volume"]) ? Number(row["sales-volume"]) : null, identityFingerprint, hash(JSON.stringify(priceMap)), JSON.stringify(priceMap), validationReason);
      });
      database.exec("COMMIT");
    } catch (error) { database.exec("ROLLBACK"); database.close(); throw error; }
  }
  database.prepare("DELETE FROM provider_identity_candidate WHERE receipt_id=?").run(receiptId);
  const records = database.prepare("SELECT * FROM provider_import_record WHERE receipt_id=? ORDER BY source_row_number").all(receiptId) as Array<Record<string, unknown>>;
  const products = database.prepare("SELECT category_id,sku,name,set_name,collector_number,variant,language,product_type FROM pricing_products WHERE category_id='pokemon-en'").all() as Array<Record<string, unknown>>;
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
  const reportPath = join(options.receiptDirectory, `${sourceHash}-${PRICECHARTING_SCHEMA_VERSION}-${PRICECHARTING_RESOLVER_VERSION}-report.json`); writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  database.prepare("UPDATE provider_import_receipt SET resolver_version=?,source_row_count=?,completed_at=?,outcome=?,normalized_record_hash=?,crosswalk_fingerprint=?,observation_fingerprint=?,report_path=? WHERE id=?").run(PRICECHARTING_RESOLVER_VERSION, rows.length, now, report.outcome, normalizedRecordHash, crosswalkFingerprint, observationFingerprint, reportPath, receiptId);
  database.close(); return report;
}

export function openPriceChartingBulkRepository(databasePath: string): { repository: PriceChartingBulkRepository; close: () => void } {
  mkdirSync(dirname(databasePath), { recursive: true }); const database = new DatabaseSync(databasePath);
  return { repository: new PriceChartingBulkRepository(database), close: () => database.close() };
}
