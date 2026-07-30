import { createHash } from "node:crypto";
import { closeSync, openSync, readSync } from "node:fs";
import { StringDecoder } from "node:string_decoder";
import { PricingContractError } from "@/lib/pricing/contract";
import type {
  NormalizedPricingRow,
  PricingCondition,
  ProductType,
} from "@/lib/pricing/types";

export const TCGPLAYER_CATALOG_CONTRACT_VERSION = "tcgplayer-catalog-v1";
export const TCGPLAYER_CATALOG_SCHEMA_VERSION = "tcgplayer-16-column-2026-07";

export const TCGPLAYER_CATALOG_HEADERS = [
  "TCGplayer Id",
  "Product Line",
  "Set Name",
  "Product Name",
  "Title",
  "Number",
  "Rarity",
  "Condition",
  "TCG Market Price",
  "TCG Direct Low",
  "TCG Low Price With Shipping",
  "TCG Low Price",
  "Total Quantity",
  "Add to Quantity",
  "TCG Marketplace Price",
  "Photo URL",
] as const;

export const tcgplayerCatalogSources = {
  "magic-en": { game: "magic", productLine: "Magic" },
  "pokemon-en": { game: "pokemon", productLine: "Pokemon" },
  "onepiece-en": { game: "onepiece", productLine: "One Piece Card Game" },
  "riftbound-en": { game: "riftbound", productLine: "Riftbound League of Legends Trading Card Game" },
  "lorcana-en": { game: "lorcana", productLine: "Lorcana TCG" },
} as const;

const knownProductLines: ReadonlySet<string> = new Set(
  Object.values(tcgplayerCatalogSources).map((source) => source.productLine),
);

export type TcgplayerCategoryId = keyof typeof tcgplayerCatalogSources;

const grades: Array<[string, PricingCondition]> = [
  ["Moderately Played", "MODERATELY_PLAYED"],
  ["Lightly Played", "LIGHTLY_PLAYED"],
  ["Heavily Played", "HEAVILY_PLAYED"],
  ["Near Mint", "NEAR_MINT"],
  ["Damaged", "DAMAGED"],
];

function* csvRecords(filePath: string): Generator<string[]> {
  const descriptor = openSync(filePath, "r");
  const decoder = new StringDecoder("utf8");
  const buffer = Buffer.allocUnsafe(128 * 1024);
  let row: string[] = [];
  let value = "";
  let quoted = false;
  let pendingQuote = false;

  function* consume(text: string): Generator<string[]> {
    for (const character of text) {
      if (pendingQuote) {
        if (character === '"') {
          value += '"';
          pendingQuote = false;
          continue;
        }
        quoted = false;
        pendingQuote = false;
      }
      if (quoted) {
        if (character === '"') pendingQuote = true;
        else value += character;
      } else if (character === '"') {
        quoted = true;
      } else if (character === ",") {
        row.push(value);
        value = "";
      } else if (character === "\n") {
        row.push(value.endsWith("\r") ? value.slice(0, -1) : value);
        const complete = row;
        row = [];
        value = "";
        yield complete;
      } else {
        value += character;
      }
    }
  }

  try {
    let bytesRead = 0;
    while ((bytesRead = readSync(descriptor, buffer, 0, buffer.length, null)) > 0) {
      yield* consume(decoder.write(buffer.subarray(0, bytesRead)));
    }
    yield* consume(decoder.end());
    if (pendingQuote) {
      quoted = false;
      pendingQuote = false;
    }
    if (quoted) throw new PricingContractError("Malformed catalogue CSV: unterminated quoted value.");
    if (value.length > 0 || row.length > 0) {
      row.push(value.endsWith("\r") ? value.slice(0, -1) : value);
      yield row;
    }
  } finally {
    closeSync(descriptor);
  }
}

function parseMoney(value: string, field: string, rowNumber: number): number | null {
  const normalized = value.trim();
  if (!normalized) return null;
  if (!/^\$?\d+(?:\.\d{1,4})?$/.test(normalized)) {
    throw new PricingContractError(`Row ${rowNumber}: ${field} is not a valid non-negative catalogue currency value.`);
  }
  return Math.round(Number(normalized.replace("$", "")) * 100);
}

function conditionParts(value: string, rowNumber: number): {
  condition: PricingCondition | null;
  productType: ProductType;
  variant: string;
  language: string;
} {
  const normalized = value.trim();
  if (normalized === "Unopened") {
    return { condition: null, productType: "SEALED", variant: "Sealed", language: "English" };
  }
  const grade = grades.find(([label]) => normalized === label || normalized.startsWith(`${label} `));
  if (!grade) throw new PricingContractError(`Row ${rowNumber}: unsupported TCGplayer condition ${JSON.stringify(normalized)}.`);
  let remainder = normalized.slice(grade[0].length).trim();
  let language = "English";
  const languageBoundary = remainder.indexOf(" - ");
  if (remainder.startsWith("- ")) {
    language = remainder.slice(2).trim();
    remainder = "";
  } else if (languageBoundary >= 0) {
    language = remainder.slice(languageBoundary + 3).trim();
    remainder = remainder.slice(0, languageBoundary).trim();
  }
  if (!language) throw new PricingContractError(`Row ${rowNumber}: condition language suffix is empty.`);
  return {
    condition: grade[1],
    productType: "SINGLE",
    variant: remainder || "Normal",
    language,
  };
}

function productKey(input: {
  categoryId: string;
  setName: string;
  name: string;
  collectorNumber: string;
  variant: string;
  language: string;
  title: string;
}): string {
  const identity = [
    input.categoryId,
    input.setName,
    input.name,
    input.collectorNumber,
    input.variant,
    input.language,
    input.title,
  ].map((value) => value.normalize("NFKC").trim().toLowerCase()).join("\0");
  return `tcg:${createHash("sha256").update(identity).digest("hex").slice(0, 24)}`;
}

export function* readTcgplayerCatalog(
  filePath: string,
  categoryId: TcgplayerCategoryId,
  snapshotDate: string,
): Generator<NormalizedPricingRow> {
  const source = tcgplayerCatalogSources[categoryId];
  let rowNumber = 0;
  let headers: string[] | null = null;

  for (const record of csvRecords(filePath)) {
    rowNumber += 1;
    if (rowNumber === 1) {
      headers = record;
      if (headers[0]?.startsWith("\uFEFF")) headers[0] = headers[0].slice(1);
      if (
        headers.length !== TCGPLAYER_CATALOG_HEADERS.length ||
        headers.some((header, index) => header !== TCGPLAYER_CATALOG_HEADERS[index])
      ) {
        throw new PricingContractError(
          `TCGplayer catalogue schema drift. Expected [${TCGPLAYER_CATALOG_HEADERS.join(", ")}], received [${headers.join(", ")}].`,
        );
      }
      continue;
    }
    if (!headers || record.length !== headers.length) {
      throw new PricingContractError(`Row ${rowNumber}: expected ${TCGPLAYER_CATALOG_HEADERS.length} columns, received ${record.length}.`);
    }
    const values = Object.fromEntries(headers.map((header, index) => [header, record[index]?.trim() ?? ""]));
    const productLine = values["Product Line"];
    if (productLine !== source.productLine) {
      if (knownProductLines.has(productLine)) continue;
      throw new PricingContractError(`Row ${rowNumber}: expected a configured product line, received ${productLine || "empty"}.`);
    }
    const sourceSku = values["TCGplayer Id"];
    const productName = values["Product Name"];
    const title = values.Title;
    const name = title || productName;
    const setName = values["Set Name"];
    if (!sourceSku || !name || !setName) {
      throw new PricingContractError(`Row ${rowNumber}: TCGplayer ID, product name, and set name are required.`);
    }
    const condition = conditionParts(values.Condition, rowNumber);
    const marketPriceCents = parseMoney(values["TCG Market Price"], "market price", rowNumber);
    const listingPriceCents = parseMoney(values["TCG Low Price"], "low price", rowNumber);
    const deliveredLowCents = parseMoney(values["TCG Low Price With Shipping"], "low price with shipping", rowNumber);
    const shippingCents = listingPriceCents !== null && deliveredLowCents !== null && deliveredLowCents >= listingPriceCents
      ? deliveredLowCents - listingPriceCents
      : null;
    const collectorNumber = values.Number || null;
    const sku = productKey({
      categoryId,
      setName,
      name,
      collectorNumber: collectorNumber ?? "",
      variant: condition.variant,
      language: condition.language,
      title,
    });
    yield {
      categoryId,
      sku,
      sourceSku,
      productType: condition.productType,
      name,
      setName,
      collectorNumber,
      variant: condition.variant,
      language: condition.language,
      condition: condition.condition,
      marketPriceCents,
      listingPriceCents,
      shippingCents,
      shippingSource: shippingCents === null ? "UNKNOWN" : "EXPORTED",
      exportedDeliveredPriceCents: deliveredLowCents,
      snapshotDate,
      imageUrl: values["Photo URL"] || null,
    };
  }
  if (rowNumber <= 1) throw new PricingContractError("TCGplayer catalogue contains no data rows.");
}
