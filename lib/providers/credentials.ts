import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getAuthDatabase } from "@/lib/auth/server";

export const providerCredentialFields = {
  justtcg: ["JUSTTCG_API_KEY"],
  "ebay-browse": ["EBAY_CLIENT_ID", "EBAY_CLIENT_SECRET"],
  cardtrader: ["CARDTRADER_API_TOKEN"],
  "pkmnprices-sealed": ["PKMNPRICES_API_KEY"],
  "psa-certificates": ["PSA_API_TOKEN"],
  pricecharting: ["PRICECHARTING_API_TOKEN"],
} as const;

export type ProviderCredentialId = keyof typeof providerCredentialFields;

function key() {
  const secret = process.env.PHRONESIS_PROVIDER_VAULT_SECRET?.trim() || process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) throw new Error("Provider vault encryption is not configured.");
  return createHash("sha256").update(`phronesis-provider-vault:${secret}`).digest();
}

function migrate() {
  getAuthDatabase().exec(`CREATE TABLE IF NOT EXISTS provider_credential (
    provider_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    ciphertext TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    PRIMARY KEY(provider_id, field_name)
  )`);
}

function allowed(providerId: string, field: string): providerId is ProviderCredentialId {
  return providerId in providerCredentialFields && (providerCredentialFields[providerId as ProviderCredentialId] as readonly string[]).includes(field);
}

export function getProviderCredential(providerId: ProviderCredentialId, field: string): string | undefined {
  const environmentValue = process.env[field]?.trim();
  if (environmentValue) return environmentValue;
  if (!allowed(providerId, field)) return undefined;
  migrate();
  const row = getAuthDatabase().prepare("SELECT ciphertext, iv, auth_tag FROM provider_credential WHERE provider_id = ? AND field_name = ?").get(providerId, field) as { ciphertext: string; iv: string; auth_tag: string } | undefined;
  if (!row) return undefined;
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(row.iv, "base64url"));
  decipher.setAuthTag(Buffer.from(row.auth_tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(row.ciphertext, "base64url")), decipher.final()]).toString("utf8");
}

export function providerCredentialStatus(providerId: ProviderCredentialId) {
  return providerCredentialFields[providerId].map((field) => ({ field, configured: Boolean(getProviderCredential(providerId, field)) }));
}

export function saveProviderCredentials(providerId: ProviderCredentialId, values: Record<string, string>) {
  migrate();
  const now = new Date().toISOString();
  const statement = getAuthDatabase().prepare(`INSERT INTO provider_credential(provider_id, field_name, ciphertext, iv, auth_tag, updated_at)
    VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(provider_id, field_name) DO UPDATE SET ciphertext=excluded.ciphertext, iv=excluded.iv, auth_tag=excluded.auth_tag, updated_at=excluded.updated_at`);
  for (const [field, raw] of Object.entries(values)) {
    if (!allowed(providerId, field)) throw new Error("Unsupported provider credential field.");
    const value = raw.trim();
    if (!value) continue;
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key(), iv);
    const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    statement.run(providerId, field, ciphertext.toString("base64url"), iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), now);
    process.env[field] = value;
  }
}

export function removeProviderCredentials(providerId: ProviderCredentialId) {
  migrate();
  getAuthDatabase().prepare("DELETE FROM provider_credential WHERE provider_id = ?").run(providerId);
  for (const field of providerCredentialFields[providerId]) delete process.env[field];
}
