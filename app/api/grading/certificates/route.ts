import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import { getProviderCredential } from "@/lib/providers/credentials";
import {
  certificateLookupProvider,
  normalizeCertificateNumber,
} from "@/lib/intelligence/certification/CertificateLookupRegistry";
import { PsaCertificateLookup } from "@/lib/intelligence/certification/PsaCertificateLookup";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "VENDOR_WORKSPACE", "VIEW");
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const body = (await request.json().catch(() => null)) as
    | { providerId?: unknown; certificateNumber?: unknown }
    | null;
  const provider = certificateLookupProvider(
    typeof body?.providerId === "string" ? body.providerId : "",
  );
  if (!provider) return Response.json({ error: "Choose a supported grader." }, { status: 400 });
  const certificateNumber = normalizeCertificateNumber(
    provider.id,
    typeof body?.certificateNumber === "string" ? body.certificateNumber : "",
  );
  if (!certificateNumber) {
    return Response.json({ error: `Enter a valid ${provider.label} certificate number.` }, { status: 400 });
  }
  if (provider.capability !== "NATIVE_API") {
    return Response.json({
      providerId: provider.id,
      status: "OFFICIAL_API_REQUIRED",
      certificateNumber,
      message: `${provider.label} has an official lookup, but no documented public API is approved for an embedded Phronesis lookup. No automated request was made.`,
    });
  }
  const token = getProviderCredential("psa-certificates", "PSA_API_TOKEN");
  if (!token) {
    return Response.json({
      providerId: "PSA",
      status: "NOT_CONFIGURED",
      certificateNumber,
      message: "Register PSA_API_TOKEN in the server environment to enable official in-Phronesis verification.",
    });
  }
  try {
    return Response.json(await new PsaCertificateLookup(token).lookup(certificateNumber));
  } catch (error) {
    return Response.json(
      {
        providerId: "PSA",
        status: "UNAVAILABLE",
        certificateNumber,
        message: error instanceof Error ? error.message : "PSA lookup is temporarily unavailable.",
      },
      { status: 502 },
    );
  }
}
