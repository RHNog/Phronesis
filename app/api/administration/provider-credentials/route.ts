import { authorizationErrorResponse, authorizeIdentityRequired } from "@/lib/auth/requestAuthorization";
import { providerCredentialFields, providerCredentialStatus, removeProviderCredentials, saveProviderCredentials, type ProviderCredentialId } from "@/lib/providers/credentials";

export const runtime = "nodejs";

function providerId(value: unknown): ProviderCredentialId | null {
  return typeof value === "string" && value in providerCredentialFields ? value as ProviderCredentialId : null;
}

export async function GET(request: Request) {
  const auth = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!auth.allowed) return authorizationErrorResponse(auth);
  return Response.json({ providers: Object.keys(providerCredentialFields).map((id) => ({ providerId: id, fields: providerCredentialStatus(id as ProviderCredentialId) })) });
}

export async function PUT(request: Request) {
  const auth = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!auth.allowed) return authorizationErrorResponse(auth);
  const body = await request.json() as { providerId?: unknown; values?: unknown };
  const id = providerId(body.providerId);
  if (!id || !body.values || typeof body.values !== "object" || Array.isArray(body.values)) return Response.json({ error: "Invalid provider credential request." }, { status: 400 });
  try {
    saveProviderCredentials(id, body.values as Record<string, string>);
    return Response.json({ providerId: id, fields: providerCredentialStatus(id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Credential registration failed." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = await authorizeIdentityRequired(request, "ADMINISTRATION", "ADMIN");
  if (!auth.allowed) return authorizationErrorResponse(auth);
  const id = providerId(new URL(request.url).searchParams.get("providerId"));
  if (!id) return Response.json({ error: "Invalid provider." }, { status: 400 });
  removeProviderCredentials(id);
  return Response.json({ providerId: id, fields: providerCredentialStatus(id) });
}
