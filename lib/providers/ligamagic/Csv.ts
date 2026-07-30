import { createHash } from "node:crypto";

export const LIGAMAGIC_CSV_CONTRACT_VERSION = "1";

export const LIGAMAGIC_CSV_HEADERS = [
  "Edicao (PTBR)",
  "Edicao (EN)",
  "Edicao (Sigla)",
  "Card (PT)",
  "Card (EN)",
  "Quantidade",
  "Qualidade (M NM SP MP HP D)",
  "Idioma (BR EN DE ES FR IT JP KO RU TW)",
  "Raridade (M R U C)",
  "Cor (W U B R G M A L)",
  "Extras",
  "Card #",
  "Comentario",
  "Compra - Menor Preco",
  "Compra - Preco Médio",
  "Compra - Maior Preco",
  "Venda - Menor Preco",
  "Venda - Preco Medio",
  "Venda - Maior Preco",
] as const;

export type LigaMagicHeader = (typeof LIGAMAGIC_CSV_HEADERS)[number];

export type LigaMagicPriceSummary = {
  consumerLowCentavos: number;
  consumerAverageCentavos: number;
  consumerHighCentavos: number;
  storeBuyLowCentavos: number;
  storeBuyAverageCentavos: number;
  storeBuyHighCentavos: number;
};

export type LigaMagicRow = LigaMagicPriceSummary & {
  identityKey: string;
  editionPtBr: string;
  editionEn: string;
  editionCode: string;
  cardPt: string;
  cardEn: string;
  quantity: number;
  condition: string;
  language: string;
  rarity: string;
  color: string;
  extras: string;
  collectorNumber: string;
  comment: string;
  sourceRowHash: string;
};

const windows1252 = new TextDecoder("windows-1252");

function utf8SequenceLength(bytes: Uint8Array, index: number): number {
  const first = bytes[index];
  if (first <= 0x7f) return 1;
  const second = bytes[index + 1];
  const third = bytes[index + 2];
  const fourth = bytes[index + 3];
  const continuation = (value: number | undefined) =>
    value !== undefined && value >= 0x80 && value <= 0xbf;
  if (first >= 0xc2 && first <= 0xdf && continuation(second)) return 2;
  if (
    first === 0xe0 &&
    second >= 0xa0 &&
    second <= 0xbf &&
    continuation(third)
  )
    return 3;
  if (
    ((first >= 0xe1 && first <= 0xec) ||
      (first >= 0xee && first <= 0xef)) &&
    continuation(second) &&
    continuation(third)
  )
    return 3;
  if (
    first === 0xed &&
    second >= 0x80 &&
    second <= 0x9f &&
    continuation(third)
  )
    return 3;
  if (
    first === 0xf0 &&
    second >= 0x90 &&
    second <= 0xbf &&
    continuation(third) &&
    continuation(fourth)
  )
    return 4;
  if (
    first >= 0xf1 &&
    first <= 0xf3 &&
    continuation(second) &&
    continuation(third) &&
    continuation(fourth)
  )
    return 4;
  if (
    first === 0xf4 &&
    second >= 0x80 &&
    second <= 0x8f &&
    continuation(third) &&
    continuation(fourth)
  )
    return 4;
  return 0;
}

export function decodeLigaMagicCsv(bytes: Uint8Array): string {
  const chunks: string[] = [];
  let validStart = 0;
  let index = 0;
  while (index < bytes.length) {
    const length = utf8SequenceLength(bytes, index);
    if (length > 0) {
      index += length;
      continue;
    }
    if (validStart < index) {
      chunks.push(Buffer.from(bytes.subarray(validStart, index)).toString("utf8"));
    }
    chunks.push(windows1252.decode(bytes.subarray(index, index + 1)));
    index += 1;
    validStart = index;
  }
  if (validStart < bytes.length) {
    chunks.push(Buffer.from(bytes.subarray(validStart)).toString("utf8"));
  }
  const decoded = chunks.join("").replace(/^\uFEFF/, "");
  if (decoded.includes("\uFFFD")) {
    throw new Error("LigaMagic CSV contains undecodable bytes.");
  }
  return decoded;
}

export function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      record.push(field);
      field = "";
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error("LigaMagic CSV ends inside a quoted field.");
  if (field.length > 0 || record.length > 0) {
    record.push(field);
    if (record.some((value) => value.length > 0)) records.push(record);
  }
  return records;
}

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim();
}

function parseNonNegativeInteger(value: string, label: string): number {
  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`LigaMagic ${label} must be a non-negative integer.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`LigaMagic ${label} is outside the safe integer range.`);
  }
  return parsed;
}

export function parseBrlCentavos(value: string, label: string): number {
  let normalized = value.trim().replace(/^R\$\s*/, "").replace(/\s+/g, "");
  if (!normalized) return 0;
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");
  const separator = Math.max(comma, dot);
  if (separator >= 0) {
    const decimals = normalized.length - separator - 1;
    if (decimals !== 2) {
      throw new Error(`LigaMagic ${label} must use two decimal places.`);
    }
    const integer = normalized
      .slice(0, separator)
      .replace(/[.,]/g, "");
    const fraction = normalized.slice(separator + 1);
    normalized = `${integer}.${fraction}`;
  }
  if (!/^\d+(?:\.\d{2})?$/.test(normalized)) {
    throw new Error(`LigaMagic ${label} is not a valid BRL amount.`);
  }
  const [integer, fraction = "00"] = normalized.split(".");
  const centavos = Number(integer) * 100 + Number(fraction);
  if (!Number.isSafeInteger(centavos) || centavos < 0) {
    throw new Error(`LigaMagic ${label} is outside the supported range.`);
  }
  return centavos;
}

function normalizedIdentityPart(value: string): string {
  return value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, " ");
}

export function ligaMagicIdentityKey(input: {
  editionEn: string;
  editionCode: string;
  cardEn: string;
  collectorNumber: string;
  extras: string;
  condition: string;
  language: string;
}): string {
  const identity = [
    input.editionEn,
    input.editionCode,
    input.cardEn,
    input.collectorNumber,
    input.extras,
    input.condition,
    input.language,
  ]
    .map(normalizedIdentityPart)
    .join("|");
  return createHash("sha256").update(identity).digest("hex");
}

function rowHash(values: readonly string[]): string {
  return createHash("sha256").update(JSON.stringify(values)).digest("hex");
}

export function readLigaMagicCsv(bytes: Uint8Array): LigaMagicRow[] {
  const records = parseCsvRecords(decodeLigaMagicCsv(bytes));
  if (records.length === 0) throw new Error("LigaMagic CSV is empty.");
  const headers = records[0].map(normalizeHeader);
  if (
    headers.length !== LIGAMAGIC_CSV_HEADERS.length ||
    headers.some((header, index) => header !== LIGAMAGIC_CSV_HEADERS[index])
  ) {
    throw new Error(
      `LigaMagic CSV schema drift: expected ${LIGAMAGIC_CSV_HEADERS.length} canonical columns.`,
    );
  }
  return records.slice(1).map((values, rowIndex) => {
    if (values.length !== headers.length) {
      throw new Error(
        `LigaMagic CSV row ${rowIndex + 2} has ${values.length} columns instead of ${headers.length}.`,
      );
    }
    const data = Object.fromEntries(
      headers.map((header, index) => [header, values[index].trim()]),
    ) as Record<LigaMagicHeader, string>;
    for (const required of [
      "Edicao (EN)",
      "Edicao (Sigla)",
      "Card (EN)",
      "Card #",
      "Qualidade (M NM SP MP HP D)",
      "Idioma (BR EN DE ES FR IT JP KO RU TW)",
    ] as const) {
      if (!data[required]) {
        throw new Error(`LigaMagic CSV row ${rowIndex + 2} is missing ${required}.`);
      }
    }
    const identity = {
      editionEn: data["Edicao (EN)"],
      editionCode: data["Edicao (Sigla)"],
      cardEn: data["Card (EN)"],
      collectorNumber: data["Card #"],
      extras: data.Extras,
      condition: data["Qualidade (M NM SP MP HP D)"],
      language: data["Idioma (BR EN DE ES FR IT JP KO RU TW)"],
    };
    return {
      ...identity,
      identityKey: ligaMagicIdentityKey(identity),
      editionPtBr: data["Edicao (PTBR)"],
      cardPt: data["Card (PT)"],
      quantity: parseNonNegativeInteger(data.Quantidade, "quantity"),
      rarity: data["Raridade (M R U C)"],
      color: data["Cor (W U B R G M A L)"],
      comment: data.Comentario,
      consumerLowCentavos: parseBrlCentavos(
        data["Compra - Menor Preco"],
        "consumer low price",
      ),
      consumerAverageCentavos: parseBrlCentavos(
        data["Compra - Preco Médio"],
        "consumer average price",
      ),
      consumerHighCentavos: parseBrlCentavos(
        data["Compra - Maior Preco"],
        "consumer high price",
      ),
      storeBuyLowCentavos: parseBrlCentavos(
        data["Venda - Menor Preco"],
        "store-buy low price",
      ),
      storeBuyAverageCentavos: parseBrlCentavos(
        data["Venda - Preco Medio"],
        "store-buy average price",
      ),
      storeBuyHighCentavos: parseBrlCentavos(
        data["Venda - Maior Preco"],
        "store-buy high price",
      ),
      sourceRowHash: rowHash(values),
    };
  });
}
