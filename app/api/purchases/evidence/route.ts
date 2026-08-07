import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import {
  getPurchaseEvidenceStore,
  purchaseEvidenceUrl,
} from "@/lib/purchases/PurchaseEvidenceStore";
import type { PurchasePrincipal } from "@/lib/purchases/domain";
import { getPurchaseLedgerRepository } from "@/lib/purchases/server";
import { watchlistPrincipalFromAuthorization } from "@/lib/watchlist/server";

export const runtime = "nodejs";

function principalFor(
  authorization: Parameters<typeof watchlistPrincipalFromAuthorization>[0],
): PurchasePrincipal {
  const principal = watchlistPrincipalFromAuthorization(authorization);
  return {
    workspaceId: principal.workspaceId,
    operatorUserId: principal.ownerUserId,
  };
}

export async function GET(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "VIEW",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = principalFor(authorization);
  const evidenceId = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  const ledger = getPurchaseLedgerRepository();
  if (!ledger.canReadEvidenceImage(principal.workspaceId, evidenceId)) {
    return new Response("Purchase photo unavailable.", { status: 404 });
  }
  try {
    const stored = await getPurchaseEvidenceStore().get(evidenceId);
    return new Response(new Uint8Array(stored.bytes).buffer, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Length": String(stored.metadata.byteLength),
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Type": stored.metadata.contentType,
        ETag: `"${stored.metadata.contentSha256}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Purchase photo unavailable.", { status: 404 });
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = principalFor(authorization);
  const ledger = getPurchaseLedgerRepository();
  const store = getPurchaseEvidenceStore();
  let storedId: string | null = null;
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > 9 * 1024 * 1024) {
      return Response.json(
        { error: "Purchase photo upload is too large." },
        { status: 413 },
      );
    }
    const form = await request.formData();
    const lineId = String(form.get("lineId") ?? "").trim();
    const file = form.get("file");
    if (!lineId || !ledger.getCartLine(principal, lineId)) {
      throw new Error("Cart line was not found.");
    }
    if (!(file instanceof File)) {
      throw new Error("Purchase photo is required.");
    }
    const evidenceImage = await store.put(
      new Uint8Array(await file.arrayBuffer()),
      file.type,
    );
    storedId = evidenceImage.id;
    const result = ledger.attachEvidenceImage(
      principal,
      lineId,
      evidenceImage,
    );
    if (result.previous) {
      await store.delete(result.previous.id).catch(() => undefined);
    }
    return Response.json(
      {
        line: result.line,
        url: purchaseEvidenceUrl(evidenceImage.id),
      },
      { status: 201 },
    );
  } catch (error) {
    if (storedId) await store.delete(storedId).catch(() => undefined);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Purchase photo could not be stored.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "OPERATE",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const principal = principalFor(authorization);
  const lineId = new URL(request.url).searchParams.get("lineId")?.trim() ?? "";
  try {
    const result = getPurchaseLedgerRepository().removeEvidenceImage(
      principal,
      lineId,
    );
    if (result.removed) {
      await getPurchaseEvidenceStore()
        .delete(result.removed.id)
        .catch(() => undefined);
    }
    return Response.json({ line: result.line, removed: Boolean(result.removed) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Purchase photo could not be removed.",
      },
      { status: 400 },
    );
  }
}
