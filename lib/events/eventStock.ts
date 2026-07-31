import { createHash } from "node:crypto";

export const EVENT_STOCK_CONTRACT_VERSION = "1";
export const EVENT_STOCK_HEADERS = [
  "Item Name",
  "Price",
  "Quantity",
  "Color",
  "Variation",
] as const;

export type EventStockCsvRow = {
  sourceRow: number;
  name: string;
  unitPriceCents: number;
  openingQuantity: number;
  color: string | null;
  variation: string | null;
  normalizedSearch: string;
  normalizedIdentity: string;
};

export type ParsedEventStockCsv = {
  sourceHash: string;
  rows: EventStockCsvRow[];
  totalQuantity: number;
};

export type EventStockImport = {
  id: string;
  eventId: string;
  sourceName: string;
  sourceHash: string;
  contractVersion: string;
  rowCount: number;
  totalQuantity: number;
  importedByUserId: string;
  importedAt: string;
};

export type EventStockItem = {
  id: string;
  eventId: string;
  sourceRow: number;
  name: string;
  unitPriceCents: number;
  openingQuantity: number;
  color: string | null;
  variation: string | null;
  soldQuantity: number;
  expectedQuantity: number;
  countedQuantity: number | null;
  countVariance: number | null;
  lastCountedAt: string | null;
};

export type EventStockSummary = {
  optionCount: number;
  openingQuantity: number;
  soldQuantity: number;
  expectedQuantity: number;
  countedOptionCount: number;
  countedQuantity: number;
  varianceQuantity: number;
  untrackedSaleUnits: number;
};

export type EventStockSnapshot = {
  eventId: string;
  manifest: EventStockImport | null;
  summary: EventStockSummary;
  items: EventStockItem[];
  query: string;
  resultCount: number;
  truncated: boolean;
};

export type EventStockSoldReportRow = {
  soldAt: string;
  ledgerEntryId: string;
  paymentMethod: string;
  saleTotalCents: number;
  itemName: string;
  quantity: number;
  unitListPriceCents: number | null;
  color: string | null;
  variation: string | null;
  reversed: boolean;
};

export type EventStockLeftoverReportRow = Pick<
  EventStockItem,
  | "name"
  | "unitPriceCents"
  | "openingQuantity"
  | "color"
  | "variation"
  | "soldQuantity"
  | "expectedQuantity"
  | "countedQuantity"
  | "countVariance"
>;

const maximumCsvBytes = 2 * 1024 * 1024;
const maximumRows = 10_000;

export function normalizeEventStockText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCsvRecords(input: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field === "") {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && input[index + 1] === "\n") index += 1;
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("Event Inventory CSV ends inside a quoted field.");
  if (field !== "" || record.length) {
    record.push(field);
    records.push(record);
  }
  return records;
}

function cleanText(
  value: string,
  label: string,
  maximumLength: number,
  required: boolean,
): string | null {
  const text = value.trim().replace(/\s+/g, " ");
  if (!text) {
    if (required) throw new Error(`${label} is required.`);
    return null;
  }
  if (text.length > maximumLength) {
    throw new Error(`${label} cannot exceed ${maximumLength} characters.`);
  }
  return text;
}

export function parseEventStockPrice(value: string): number {
  let normalized = value
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/^\$\s*/, "")
    .replace(/\s+/g, "");
  if (!normalized || /[^0-9,.-]/.test(normalized) || normalized.startsWith("-")) {
    throw new Error("Price must be a non-negative amount.");
  }
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");
  const decimalIndex = Math.max(comma, dot);
  if (comma >= 0 && dot >= 0) {
    const decimal = decimalIndex === comma ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    normalized = normalized.replaceAll(thousands, "").replace(decimal, ".");
  } else if (decimalIndex >= 0) {
    const separator = normalized[decimalIndex];
    const fractionLength = normalized.length - decimalIndex - 1;
    const appearances = normalized.split(separator).length - 1;
    if (appearances > 1 || fractionLength === 3) {
      normalized = normalized.replaceAll(separator, "");
    } else {
      normalized = normalized.replace(separator, ".");
    }
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Price must contain at most two decimal places.");
  }
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(cents) || cents < 0) {
    throw new Error("Price is outside the supported range.");
  }
  return cents;
}

export function parseEventStockCsv(csv: string): ParsedEventStockCsv {
  if (Buffer.byteLength(csv, "utf8") > maximumCsvBytes) {
    throw new Error("Event Inventory CSV cannot exceed 2 MiB.");
  }
  const records = parseCsvRecords(csv);
  if (!records.length) throw new Error("Event Inventory CSV is empty.");
  const headers = records[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "").trim() : header.trim(),
  );
  if (
    headers.length !== EVENT_STOCK_HEADERS.length ||
    headers.some((header, index) => header !== EVENT_STOCK_HEADERS[index])
  ) {
    throw new Error(
      `Event Inventory headers must be exactly: ${EVENT_STOCK_HEADERS.join(", ")}.`,
    );
  }
  const data = records
    .slice(1)
    .map((values, index) => ({ values, sourceRow: index + 2 }))
    .filter(({ values }) => values.some((value) => value.trim()));
  if (!data.length) throw new Error("Event Inventory CSV has no item rows.");
  if (data.length > maximumRows) {
    throw new Error(`Event Inventory CSV cannot exceed ${maximumRows} item rows.`);
  }
  const identities = new Map<string, number>();
  let totalQuantity = 0;
  const rows = data.map(({ values, sourceRow }) => {
    if (values.length !== EVENT_STOCK_HEADERS.length) {
      throw new Error(
        `Event Inventory row ${sourceRow} has ${values.length} columns instead of ${EVENT_STOCK_HEADERS.length}.`,
      );
    }
    const name = cleanText(values[0], `Row ${sourceRow} Item Name`, 160, true)!;
    const unitPriceCents = parseEventStockPrice(values[1]);
    const quantity = Number(values[2].trim());
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
      throw new Error(
        `Row ${sourceRow} Quantity must be a whole number from 1 to 1,000,000.`,
      );
    }
    const color = cleanText(values[3], `Row ${sourceRow} Color`, 80, false);
    const variation = cleanText(
      values[4],
      `Row ${sourceRow} Variation`,
      120,
      false,
    );
    const normalizedIdentity = [
      normalizeEventStockText(name),
      String(unitPriceCents),
      normalizeEventStockText(color ?? ""),
      normalizeEventStockText(variation ?? ""),
    ].join("|");
    const duplicateRow = identities.get(normalizedIdentity);
    if (duplicateRow) {
      throw new Error(
        `Rows ${duplicateRow} and ${sourceRow} describe the same option. Consolidate their Quantity in the Sheet.`,
      );
    }
    identities.set(normalizedIdentity, sourceRow);
    totalQuantity += quantity;
    if (!Number.isSafeInteger(totalQuantity)) {
      throw new Error("Event Inventory total quantity is outside the supported range.");
    }
    return {
      sourceRow,
      name,
      unitPriceCents,
      openingQuantity: quantity,
      color,
      variation,
      normalizedIdentity,
      normalizedSearch: normalizeEventStockText(
        `${name} ${color ?? ""} ${variation ?? ""} ${unitPriceCents} ${(unitPriceCents / 100).toFixed(2)}`,
      ),
    };
  });
  return {
    sourceHash: createHash("sha256").update(csv).digest("hex"),
    rows,
    totalQuantity,
  };
}

function csvCell(value: string | number | null): string {
  const text = value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function eventStockReportCsv(
  report: "sold" | "leftover",
  rows: EventStockSoldReportRow[] | EventStockLeftoverReportRow[],
): string {
  if (report === "sold") {
    const sold = rows as EventStockSoldReportRow[];
    return [
      [
        "Sold At",
        "Ledger Entry",
        "Payment Method",
        "Whole Sale Total",
        "Item Name",
        "Quantity",
        "Imported Unit List Price",
        "Color",
        "Variation",
        "Reversed",
      ],
      ...sold.map((row) => [
        row.soldAt,
        row.ledgerEntryId,
        row.paymentMethod,
        (row.saleTotalCents / 100).toFixed(2),
        row.itemName,
        row.quantity,
        row.unitListPriceCents === null
          ? ""
          : (row.unitListPriceCents / 100).toFixed(2),
        row.color,
        row.variation,
        row.reversed ? "Yes" : "No",
      ]),
    ]
      .map((record) => record.map(csvCell).join(","))
      .join("\n");
  }
  const leftover = rows as EventStockLeftoverReportRow[];
  return [
    [
      "Item Name",
      "Imported Unit List Price",
      "Color",
      "Variation",
      "Opening Quantity",
      "Sold Quantity",
      "Expected Leftover",
      "Physical Count",
      "Variance",
    ],
    ...leftover.map((row) => [
      row.name,
      (row.unitPriceCents / 100).toFixed(2),
      row.color,
      row.variation,
      row.openingQuantity,
      row.soldQuantity,
      row.expectedQuantity,
      row.countedQuantity,
      row.countVariance,
    ]),
  ]
    .map((record) => record.map(csvCell).join(","))
    .join("\n");
}
