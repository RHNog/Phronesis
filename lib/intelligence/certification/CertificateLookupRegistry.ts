export const certificateLookupProviderIds = [
  "PSA",
  "BECKETT",
  "TAG",
  "CGC",
  "SGC",
] as const;

export type CertificateLookupProviderId =
  (typeof certificateLookupProviderIds)[number];

export type CertificateLookupCapability = "NATIVE_API" | "OFFICIAL_API_REQUIRED";

export type CertificateLookupProvider = {
  id: CertificateLookupProviderId;
  label: string;
  capability: CertificateLookupCapability;
  certificateHint: string;
  note: string;
};

export const certificateLookupProviders: readonly CertificateLookupProvider[] = [
  {
    id: "PSA",
    label: "PSA",
    capability: "NATIVE_API",
    certificateHint: "Digits from the PSA label",
    note: "Official PSA Public API",
  },
  {
    id: "BECKETT",
    label: "Beckett · BGS/BVG/BCCG",
    capability: "OFFICIAL_API_REQUIRED",
    certificateHint: "BGS, BVG, or BCCG certificate",
    note: "Official web lookup exists; no documented public API",
  },
  {
    id: "TAG",
    label: "TAG",
    capability: "OFFICIAL_API_REQUIRED",
    certificateHint: "8-digit TAG certificate",
    note: "Official DIG lookup exists; no documented public API",
  },
  {
    id: "CGC",
    label: "CGC Cards",
    capability: "OFFICIAL_API_REQUIRED",
    certificateHint: "Digits from the CGC label",
    note: "Official rate-limited web lookup exists; no documented public API",
  },
  {
    id: "SGC",
    label: "SGC",
    capability: "OFFICIAL_API_REQUIRED",
    certificateHint: "7 digits or XXXXXXX-XXX",
    note: "Official web lookup exists; no documented public API",
  },
];

export function normalizeCertificateNumber(
  providerId: CertificateLookupProviderId,
  value: string,
): string | null {
  const compact = value.trim().replace(/\s+/g, "").toUpperCase();
  if (providerId === "TAG") return /^\d{8}$/.test(compact) ? compact : null;
  if (providerId === "SGC") {
    return /^(?:\d{7}|[A-Z0-9]{7}-[A-Z0-9]{3})$/.test(compact)
      ? compact
      : null;
  }
  return /^\d{6,14}$/.test(compact) ? compact : null;
}

export function certificateLookupProvider(
  value: string,
): CertificateLookupProvider | null {
  return (
    certificateLookupProviders.find((provider) => provider.id === value) ?? null
  );
}
