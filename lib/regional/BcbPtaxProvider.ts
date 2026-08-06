const PTAX_ODATA_ROOT =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";
const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type Fetcher = (
  input: string | URL,
  init?: { signal?: AbortSignal; headers?: Record<string, string> },
) => Promise<FetchResponse>;

export type OfficialPtaxQuote = {
  buyBrlPerUsd: number;
  sellBrlPerUsd: number;
  observedAt: string;
  fetchedAt: string;
  source: string;
};

export class BcbPtaxProvider {
  constructor(
    private readonly fetcher: Fetcher = fetch,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async latestClosingQuote(): Promise<OfficialPtaxQuote> {
    const now = this.clock();
    const { start, end } = queryPeriod(now);
    const path =
      `${PTAX_ODATA_ROOT}/CotacaoDolarPeriodo` +
      `(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)`;
    const url = new URL(path);
    url.searchParams.set("@dataInicial", `'${start}'`);
    url.searchParams.set("@dataFinalCotacao", `'${end}'`);
    url.searchParams.set("$format", "json");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await this.fetcher(url, {
        signal: controller.signal,
        headers: { accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(`BCB PTAX returned HTTP ${response.status}.`);
      const records = parseResponse(await response.json());
      const latest = records
        .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
        .at(-1);
      if (!latest) throw new Error("BCB PTAX returned no closing quotation.");
      return {
        ...latest,
        fetchedAt: now.toISOString(),
        source: "Banco Central do Brasil PTAX — closing bulletin",
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

function parseResponse(
  value: unknown,
): Array<Omit<OfficialPtaxQuote, "fetchedAt" | "source">> {
  if (!value || typeof value !== "object" || !("value" in value))
    throw new Error("BCB PTAX response has an invalid envelope.");
  const rows = (value as { value?: unknown }).value;
  if (!Array.isArray(rows))
    throw new Error("BCB PTAX response has an invalid quotation list.");
  return rows.map((row) => {
    if (!row || typeof row !== "object")
      throw new Error("BCB PTAX returned an invalid quotation.");
    const candidate = row as Record<string, unknown>;
    const buyBrlPerUsd = Number(candidate.cotacaoCompra);
    const sellBrlPerUsd = Number(candidate.cotacaoVenda);
    const observedAt = brasiliaTimestamp(
      String(candidate.dataHoraCotacao ?? ""),
    );
    if (
      !Number.isFinite(buyBrlPerUsd) ||
      !Number.isFinite(sellBrlPerUsd) ||
      buyBrlPerUsd <= 0 ||
      sellBrlPerUsd <= 0 ||
      buyBrlPerUsd > sellBrlPerUsd
    )
      throw new Error("BCB PTAX returned invalid buy/sell quotations.");
    return { buyBrlPerUsd, sellBrlPerUsd, observedAt };
  });
}

function brasiliaTimestamp(value: string): string {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/,
  );
  if (!match) throw new Error("BCB PTAX returned an invalid observation time.");
  const milliseconds = (match[7] ?? "").padEnd(3, "0").slice(0, 3);
  const date = new Date(
    `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}.${milliseconds}-03:00`,
  );
  if (Number.isNaN(date.getTime()))
    throw new Error("BCB PTAX returned an invalid observation time.");
  return date.toISOString();
}

function queryPeriod(now: Date): { start: string; end: string } {
  const end = calendarParts(now);
  const anchor = new Date(Date.UTC(end.year, end.month - 1, end.day, 12));
  anchor.setUTCDate(anchor.getUTCDate() - 8);
  const start = calendarParts(anchor);
  return {
    start: `${pad(start.month)}-${pad(start.day)}-${start.year}`,
    end: `${pad(end.month)}-${pad(end.day)}-${end.year}`,
  };
}

function calendarParts(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BRASILIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
