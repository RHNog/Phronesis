export type PriceChartingEvidence = {
  id: string;
  productName: string;
  catalogueName: string;
  prices: Record<string, number | null>;
  observedAt: string;
  sourceUrl: string;
};

type RawProduct = Record<string, unknown>;
let requestBarrier = Promise.resolve();
let lastRequestAt = 0;
const cache = new Map<string, { expiresAt: number; value: PriceChartingEvidence[] }>();

function cents(value: unknown): number | null {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

async function globallyThrottled<T>(operation: () => Promise<T>): Promise<T> {
  const run = requestBarrier.then(async () => {
    const delay = Math.max(0, 1_050 - (Date.now() - lastRequestAt));
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    try { return await operation(); } finally { lastRequestAt = Date.now(); }
  });
  requestBarrier = run.then(() => undefined, () => undefined);
  return run;
}

export class PriceChartingClient {
  constructor(private readonly token: string, private readonly request: typeof fetch = fetch) {}

  private async get(path: string, parameters: Record<string, string>): Promise<RawProduct> {
    return globallyThrottled(async () => {
      const url = new URL(path, "https://www.pricecharting.com");
      url.searchParams.set("t", this.token);
      for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
      const response = await this.request(url, { cache: "no-store", headers: { accept: "application/json" } });
      if (!response.ok) throw new Error(`PriceCharting returned ${response.status}.`);
      const body = await response.json() as RawProduct;
      if (body.status !== "success") throw new Error(typeof body["error-message"] === "string" ? body["error-message"] : "PriceCharting lookup failed.");
      return body;
    });
  }

  async lookup(identity: { name: string; setName: string; collectorNumber: string | null }): Promise<PriceChartingEvidence[]> {
    const key = normalize(`${identity.name}|${identity.setName}|${identity.collectorNumber ?? ""}`);
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    const query = [identity.name, identity.collectorNumber ? `#${identity.collectorNumber}` : "", identity.setName].filter(Boolean).join(" ");
    const search = await this.get("/api/products", { q: query });
    const name = normalize(identity.name);
    const number = (normalize(identity.collectorNumber ?? "").split(" ")[0] ?? "").replace(/^0+/, "");
    const candidates = (Array.isArray(search.products) ? search.products : []).filter((candidate): candidate is RawProduct => Boolean(candidate && typeof candidate === "object")).filter((candidate) => {
      const product = normalize(String(candidate["product-name"] ?? ""));
      if (!product.includes(name)) return false;
      return !number || product.split(" ").some((token) => token.replace(/^0+/, "") === number);
    }).slice(0, 3);
    const evidence: PriceChartingEvidence[] = [];
    for (const candidate of candidates) {
      const id = String(candidate.id ?? "");
      if (!/^\d+$/.test(id)) continue;
      const item = await this.get("/api/product", { id });
      evidence.push({ id, productName: String(item["product-name"] ?? candidate["product-name"] ?? "Unknown product"), catalogueName: String(item["console-name"] ?? candidate["console-name"] ?? "Trading Cards"), observedAt: new Date().toISOString(), sourceUrl: `https://www.pricecharting.com/search-products?type=prices&q=${encodeURIComponent(String(item["product-name"] ?? identity.name))}`, prices: { Ungraded: cents(item["loose-price"]), "Grade 7/7.5": cents(item["cib-price"]), "Grade 8/8.5": cents(item["new-price"]), "Grade 9": cents(item["graded-price"]), "Grade 9.5": cents(item["box-only-price"]), "PSA 10": cents(item["manual-only-price"]), "BGS 10": cents(item["bgs-10-price"]), "CGC 10": cents(item["condition-17-price"]), "SGC 10": cents(item["condition-18-price"]) } });
    }
    cache.set(key, { expiresAt: Date.now() + 6 * 60 * 60 * 1000, value: evidence });
    return evidence;
  }
}
