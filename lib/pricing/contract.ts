import type {
  NormalizedPricingRow,
  PricingCondition,
  ProductType,
} from "./types.ts";

export type PricingSemanticField =
  | "sku"
  | "productType"
  | "name"
  | "setName"
  | "collectorNumber"
  | "variant"
  | "language"
  | "condition"
  | "marketPrice"
  | "listingPrice"
  | "shipping"
  | "snapshotDate"
  | "imageUrl";

export type PricingExportContract = {
  contractVersion: string;
  sourceSchemaVersion: string;
  status: "AUTHORITATIVE" | "TEST_ONLY";
  headers: string[];
  fields: Record<PricingSemanticField, string>;
  values: {
    productTypes: Record<string, ProductType>;
    conditions: Record<string, PricingCondition>;
  };
};

export class PricingContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingContractError";
  }
}

function parseCsvRecords(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (quoted) throw new PricingContractError("Malformed CSV: unterminated quoted value.");
  if (value.length || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((cell) => cell.length > 0));
}

function parseMoney(value: string, field: string, rowNumber: number): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\$?\d+(?:\.\d{1,2})?$/.test(trimmed)) {
    throw new PricingContractError(`Row ${rowNumber}: ${field} is not a valid non-negative currency value.`);
  }
  return Math.round(Number(trimmed.replace("$", "")) * 100);
}

function isoDate(value: string, rowNumber: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new PricingContractError(`Row ${rowNumber}: snapshot date must be YYYY-MM-DD.`);
  }
  return value;
}

export function validateContract(contract: PricingExportContract): void {
  if (!contract.contractVersion || !contract.sourceSchemaVersion) {
    throw new PricingContractError("Contract and source schema versions are required.");
  }
  if (new Set(contract.headers).size !== contract.headers.length) {
    throw new PricingContractError("Schema contract contains duplicate headers.");
  }
  for (const [semantic, header] of Object.entries(contract.fields)) {
    if (!contract.headers.includes(header)) {
      throw new PricingContractError(`Semantic field ${semantic} maps to missing header ${header}.`);
    }
  }
}

export function parsePricingExport(
  csv: string,
  contract: PricingExportContract,
  categoryId: string,
): NormalizedPricingRow[] {
  validateContract(contract);
  const records = parseCsvRecords(csv);
  if (!records.length) throw new PricingContractError("Export is empty.");
  const actualHeaders = records[0];
  if (
    actualHeaders.length !== contract.headers.length ||
    actualHeaders.some((header, index) => header !== contract.headers[index])
  ) {
    throw new PricingContractError(
      `Schema drift detected. Expected [${contract.headers.join(", ")}], received [${actualHeaders.join(", ")}]. No data was imported.`,
    );
  }
  const indexByHeader = new Map(actualHeaders.map((header, index) => [header, index]));
  const read = (record: string[], semantic: PricingSemanticField) =>
    record[indexByHeader.get(contract.fields[semantic]) ?? -1]?.trim() ?? "";

  return records.slice(1).map((record, index) => {
    const rowNumber = index + 2;
    if (record.length !== actualHeaders.length) {
      throw new PricingContractError(`Row ${rowNumber}: expected ${actualHeaders.length} columns, received ${record.length}.`);
    }
    const sku = read(record, "sku");
    const productType = contract.values.productTypes[read(record, "productType")];
    const name = read(record, "name");
    const conditionText = read(record, "condition");
    const condition = conditionText ? contract.values.conditions[conditionText] : null;
    if (!sku || !name || !productType) {
      throw new PricingContractError(`Row ${rowNumber}: SKU, product name, and recognized product type are required.`);
    }
    if (productType === "SINGLE" && !condition) {
      throw new PricingContractError(`Row ${rowNumber}: a single requires a recognized condition.`);
    }
    if (productType === "SEALED" && conditionText) {
      throw new PricingContractError(`Row ${rowNumber}: sealed products cannot have a condition.`);
    }
    const listingPriceCents = parseMoney(read(record, "listingPrice"), "listing price", rowNumber);
    const shippingCents = parseMoney(read(record, "shipping"), "shipping", rowNumber);
    return {
      categoryId,
      sku,
      productType,
      name,
      setName: read(record, "setName"),
      collectorNumber: read(record, "collectorNumber") || null,
      variant: read(record, "variant"),
      language: read(record, "language"),
      condition,
      marketPriceCents: parseMoney(read(record, "marketPrice"), "market price", rowNumber),
      listingPriceCents,
      shippingCents,
      shippingSource: shippingCents === null ? "UNKNOWN" : "EXPORTED",
      snapshotDate: isoDate(read(record, "snapshotDate"), rowNumber),
      imageUrl: read(record, "imageUrl") || null,
    };
  });
}
