export type CertificateLookupResult = {
  providerId: "PSA";
  status: "VERIFIED" | "NOT_FOUND" | "INVALID";
  certificateNumber: string;
  message: string;
  grade: string | null;
  title: string | null;
  year: string | null;
  brand: string | null;
  subject: string | null;
  variety: string | null;
  labelType: string | null;
  specificationNumber: string | null;
  images: string[];
};

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function field(source: JsonRecord, names: readonly string[]): string | null {
  const entries = Object.entries(source);
  for (const name of names) {
    const entry = entries.find(([key]) => key.toLowerCase() === name.toLowerCase());
    if (entry && (typeof entry[1] === "string" || typeof entry[1] === "number")) {
      const value = String(entry[1]).trim();
      if (value) return value;
    }
  }
  return null;
}

function booleanField(source: JsonRecord, name: string): boolean | null {
  const entry = Object.entries(source).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return typeof entry?.[1] === "boolean" ? entry[1] : null;
}

function validPsaImage(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "psacard.com" || url.hostname.endsWith(".psacard.com"));
  } catch {
    return false;
  }
}

export function normalizePsaCertificateResponse(
  certificateNumber: string,
  value: unknown,
): CertificateLookupResult {
  const root = record(value) ?? {};
  const nested =
    record(root.PSACert) ?? record(root.Cert) ?? record(root.Data) ?? root;
  const isValidRequest = booleanField(root, "IsValidRequest");
  const message = field(root, ["ServerMessage", "Message"]) ?? "PSA returned no message.";
  if (isValidRequest === false) {
    return {
      providerId: "PSA",
      status: "INVALID",
      certificateNumber,
      message,
      grade: null,
      title: null,
      year: null,
      brand: null,
      subject: null,
      variety: null,
      labelType: null,
      specificationNumber: null,
      images: [],
    };
  }
  const grade = field(nested, ["CardGrade", "Grade", "GradeDescription"]);
  const year = field(nested, ["Year"]);
  const brand = field(nested, ["Brand"]);
  const subject = field(nested, ["Subject", "Player"]);
  const variety = field(nested, ["Variety", "VarietyPedigree"]);
  const labelType = field(nested, ["LabelType", "LabelTypeName"]);
  const specificationNumber = field(nested, ["SpecID", "SpecNo", "SpecificationNumber"]);
  const cert = field(nested, ["CertNumber", "CertNo", "CertificateNumber"]) ?? certificateNumber;
  const images = [
    field(nested, ["ImageURL", "ImageUrl", "FrontImageURL", "FrontImageUrl"]),
    field(nested, ["ReverseImageURL", "ReverseImageUrl", "BackImageURL", "BackImageUrl"]),
  ].filter((image): image is string => Boolean(image && validPsaImage(image)));
  const title = [year, brand, subject, variety].filter(Boolean).join(" · ") || null;
  const verified = Boolean(grade || title || specificationNumber) && !/no data found/i.test(message);
  return {
    providerId: "PSA",
    status: verified ? "VERIFIED" : "NOT_FOUND",
    certificateNumber: cert,
    message,
    grade,
    title,
    year,
    brand,
    subject,
    variety,
    labelType,
    specificationNumber,
    images,
  };
}

export class PsaCertificateLookup {
  constructor(
    private readonly token: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async lookup(certificateNumber: string): Promise<CertificateLookupResult> {
    if (!this.token.trim()) throw new Error("PSA certificate API is not configured.");
    const response = await this.fetcher(
      `https://api.psacard.com/publicapi/cert/GetByCertNumber/${encodeURIComponent(certificateNumber)}`,
      {
        headers: { Accept: "application/json", Authorization: `bearer ${this.token}` },
        redirect: "manual",
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (response.status === 204) {
      return normalizePsaCertificateResponse(certificateNumber, {
        IsValidRequest: false,
        ServerMessage: "Invalid certificate number.",
      });
    }
    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403 || response.status === 500
          ? "PSA certificate API rejected the configured credential."
          : `PSA certificate API returned ${response.status}.`,
      );
    }
    return normalizePsaCertificateResponse(certificateNumber, await response.json());
  }
}
