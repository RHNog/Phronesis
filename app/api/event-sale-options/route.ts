import {
  authorizationErrorResponse,
  authorizeRequest,
} from "@/lib/auth/requestAuthorization";
import { normalizeEventStockText } from "@/lib/events/eventStock";
import type {
  EventSaleOption,
  EventSaleOptionsSnapshot,
} from "@/lib/events/displayCase";
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

function optionScore(option: EventSaleOption, normalizedQuery: string): number {
  if (!normalizedQuery) return option.expectedQuantity > 0 ? 1 : 0;
  const name = normalizeEventStockText(option.name);
  let score = 1;
  if (name === normalizedQuery) score += 100;
  else if (name.startsWith(normalizedQuery)) score += 70;
  else if (name.includes(normalizedQuery)) score += 50;
  if (option.source === "DISPLAY_CASE") score += 2;
  if (option.expectedQuantity > 0) score += 5;
  return score;
}

export async function GET(request: Request) {
  const authorization = await authorizeRequest(
    request,
    "VENDOR_WORKSPACE",
    "VIEW",
  );
  if (!authorization.allowed) return authorizationErrorResponse(authorization);
  const url = new URL(request.url);
  const eventId = url.searchParams.get("eventId");
  if (!eventId) {
    return Response.json({ error: "Event is required." }, { status: 400 });
  }
  const query = (url.searchParams.get("q") ?? "").slice(0, 200);
  try {
    const principal = principalFor(authorization);
    const ledger = getPurchaseLedgerRepository();
    const prepared = ledger.eventStock.getSnapshot(
      principal,
      eventId,
      query,
      10_000,
    );
    const eventFlips = ledger.displayCase.getSourceSnapshot(
      principal,
      eventId,
      query,
      10_000,
    );
    const options: EventSaleOption[] = [
      ...prepared.items
        .filter((item) => item.expectedQuantity > 0)
        .map((item) => ({
          id: `prepared:${item.id}`,
          source: "PREPARED_STOCK" as const,
          inventoryItemId: item.id,
          name: item.name,
          description: [item.name, item.variation, item.color]
            .filter(Boolean)
            .join(" · "),
          details:
            [item.variation, item.color].filter(Boolean).join(" · ") ||
            "Opening display stock",
          unitListPriceCents: item.unitPriceCents,
          expectedQuantity: item.expectedQuantity,
          color: item.color,
          variation: item.variation,
        })),
      ...eventFlips.items
        .filter((item) => item.expectedQuantity > 0)
        .map((item) => {
          const variation = [
            item.setName,
            item.collectorNumber ? `#${item.collectorNumber}` : null,
            item.variant,
            item.language,
          ]
            .filter(Boolean)
            .join(" · ");
          return {
            id: `case:${item.id}`,
            source: "DISPLAY_CASE" as const,
            caseItemId: item.id,
            name: item.name,
            description: [item.name, variation, item.condition]
              .filter(Boolean)
              .join(" · "),
            details: [variation, item.condition].filter(Boolean).join(" · "),
            unitListPriceCents: item.currentSalePriceCents,
            expectedQuantity: item.expectedQuantity,
            color: item.condition,
            variation: variation || null,
          };
        }),
    ];
    const normalizedQuery = normalizeEventStockText(query);
    options.sort(
      (first, second) =>
        optionScore(second, normalizedQuery) - optionScore(first, normalizedQuery) ||
        first.name.localeCompare(second.name) ||
        first.id.localeCompare(second.id),
    );
    const snapshot: EventSaleOptionsSnapshot = {
      eventId,
      query,
      options: options.slice(0, 40),
      resultCount: options.length,
      truncated: options.length > 40,
      summary: {
        preparedExpectedQuantity: prepared.summary.expectedQuantity,
        displayCaseExpectedQuantity: eventFlips.summary.expectedQuantity,
        totalExpectedQuantity:
          prepared.summary.expectedQuantity + eventFlips.summary.expectedQuantity,
      },
    };
    return Response.json({ snapshot });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Sale inventory options could not load.",
      },
      { status: 400 },
    );
  }
}
