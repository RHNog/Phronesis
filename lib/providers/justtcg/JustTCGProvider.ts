import { JustTCG, type GetCardsParams } from "justtcg-js";
import { JustTCGAdapter } from "@/lib/providers/justtcg/JustTCGAdapter";
import {
  createJustTCGConnectionStatus,
  type JustTCGInspectionResult,
  type JustTCGRequestTraceEntry,
} from "@/lib/providers/justtcg/JustTCGDiagnostics";
import {
  normalizeJustTCGContext,
  type JustTCGKnownCardContext,
  type JustTCGNormalizedResponse,
  type JustTCGRawCardResponse,
} from "@/lib/providers/justtcg/JustTCGNormalizer";
import { ProviderClient } from "@/lib/providers/sdk/ProviderClient";
import { createProviderDiagnostics } from "@/lib/providers/sdk/ProviderDiagnostics";
import type { ProviderResult } from "@/lib/providers/sdk/ProviderResult";
import { createReplayDiagnostics } from "@/lib/providers/replay/ReplayDiagnostics";
import { ReplayProvider, type ReplayDecision } from "@/lib/providers/replay/ReplayProvider";
import { ReplayRecorder } from "@/lib/providers/replay/ReplayRecorder";
import type { ReplayIdentityInput } from "@/lib/providers/replay/ReplayRegistry";
import type { MarketSnapshot } from "@/types/marketSnapshot";
import type { MarketPrice } from "@/types/marketPrice";

type JustTCGSdkClient = InstanceType<typeof JustTCG>;
type FetchFunction = typeof globalThis.fetch;

const JUSTTCG_REQUEST_TIMEOUT_MS = 30_000;
const JUSTTCG_CARDS_ENDPOINT = "https://api.justtcg.com/v1/cards";

export class JustTCGProvider {
  readonly id = "justtcg";
  readonly name = "JustTCG";
  private readonly adapter = new JustTCGAdapter();
  private lastProviderRequestError: unknown = null;
  private lastProviderRequestTrace: JustTCGRequestTraceEntry[] = [];
  private lastReplayDecision: ReplayDecision<
    JustTCGRawCardResponse,
    JustTCGNormalizedResponse
  > | null = null;
  private readonly replayProvider = new ReplayProvider<
    JustTCGRawCardResponse,
    JustTCGNormalizedResponse
  >();
  private readonly replayRecorder = new ReplayRecorder<
    JustTCGRawCardResponse,
    JustTCGNormalizedResponse
  >();
  private lastRawProviderResponse: JustTCGRawCardResponse | null = null;

  constructor(
    private readonly clientFactory = () =>
      process.env.JUSTTCG_API_KEY
        ? new JustTCG({ apiKey: process.env.JUSTTCG_API_KEY })
        : new JustTCG(),
  ) {}

  createClient(): JustTCGSdkClient {
    return this.clientFactory();
  }

  async fetchKnownCard(
    context?: JustTCGKnownCardContext,
  ): Promise<JustTCGRawCardResponse> {
    const trace = createJustTCGRequestTracer();
    this.lastProviderRequestError = null;
    this.lastProviderRequestTrace = trace.entries;
    this.lastRawProviderResponse = null;
    trace.mark("Provider instantiated", {
      providerId: this.id,
      providerName: this.name,
    });

    const normalizedContext = normalizeJustTCGContext(context);
    const requestParameters: GetCardsParams = {
      game: normalizedContext.game,
      query: normalizedContext.cardName,
      limit: normalizedContext.limit,
      include_price_history: normalizedContext.includePriceHistory,
      priceHistoryDuration: normalizedContext.priceHistoryDuration,
      include_statistics: ["7d", "30d", "90d", "allTime"],
    };
    const replayIdentity = createJustTCGReplayIdentity(normalizedContext);
    const replayDecision = this.replayProvider.prepare({
      game: normalizedContext.game,
      identity: replayIdentity,
      provider: this.id,
    });
    this.lastReplayDecision = replayDecision;

    if (replayDecision.useFixture && replayDecision.fixture) {
      trace.mark("Replay fixture loaded", {
        fixtureAgeMs: replayDecision.session.fixtureAgeMs,
        fixturePath: replayDecision.session.fixturePath,
        mode: replayDecision.mode,
        quotaSaved: replayDecision.session.quotaSaved,
      });
      trace.mark("Live request skipped", {
        mode: replayDecision.mode,
        reason: "Replay fixture available.",
      });
      trace.mark("Provider returned", {
        cardCount: replayDecision.fixture.fixture.raw.data.length,
        source: "fixture",
      });
      this.lastRawProviderResponse = replayDecision.fixture.fixture.raw;
      return replayDecision.fixture.fixture.raw;
    }

    if (replayDecision.mode === "REPLAY") {
      const error = new Error(
        `${replayDecision.session.matchReason ?? "Replay observation missing."} ${replayDecision.location.path}`,
      );
      const classified = classifyJustTCGProviderError(error, trace.entries);
      this.lastProviderRequestError = classified;
      trace.mark("Provider error", classified);
      throw error;
    }

    let client: JustTCGSdkClient;
    try {
      client = this.createClient();
      trace.mark("SDK instantiated", {
        sdkPackage: "justtcg-js",
        sdkVersion: "0.2.1",
      });
    } catch (error) {
      const classified = classifyJustTCGProviderError(error, trace.entries);
      this.lastProviderRequestError = classified;
      trace.mark("Provider error", classified);
      throw error;
    }

    trace.mark("Request starting", {
      timeoutMs: JUSTTCG_REQUEST_TIMEOUT_MS,
    });
    trace.mark("Endpoint being called", {
      endpoint: JUSTTCG_CARDS_ENDPOINT,
      method: "GET",
      sdkMethod: "client.v1.cards.get",
    });
    trace.mark("Request parameters", requestParameters);

    const restoreFetch = installJustTCGFetchDiagnostics(trace);

    try {
      const raw = await withJustTCGTimeout(
        client.v1.cards.get(requestParameters),
        JUSTTCG_REQUEST_TIMEOUT_MS,
      );
      trace.mark("Provider returned", {
        cardCount: raw.data.length,
        hasPagination: Boolean(raw.pagination),
        hasUsage: Boolean(raw.usage),
      });
      this.lastRawProviderResponse = raw;
      return raw;
    } catch (error) {
      const classified = classifyJustTCGProviderError(error, trace.entries);
      this.lastProviderRequestError = classified;
      trace.mark("Provider error", classified);
      throw error;
    } finally {
      restoreFetch();
    }
  }

  getLastProviderRequestTrace(): JustTCGRequestTraceEntry[] {
    return this.lastProviderRequestTrace;
  }

  getLastProviderRequestError(): unknown {
    return this.lastProviderRequestError;
  }

  getReplayDiagnostics() {
    return createReplayDiagnostics(this.lastReplayDecision?.session ?? null);
  }

  markProviderRequestTrace(stage: string, details?: unknown) {
    const trace = createJustTCGRequestTracer(this.lastProviderRequestTrace);
    trace.mark(stage, details);
  }

  async normalizeKnownCardForInspection(
    raw: JustTCGRawCardResponse,
    context?: JustTCGKnownCardContext,
  ): Promise<JustTCGNormalizedResponse> {
    this.markProviderRequestTrace("Normalization starting", {
      rawCardCount: raw.data.length,
    });
    const normalized = this.adapter.normalize(raw, context);
    this.markProviderRequestTrace("Normalization completed", {
      normalizedCardCount: normalized.cards.length,
      normalizedVariantCount: normalized.cards.reduce(
        (count, card) => count + card.variants.length,
        0,
      ),
    });
    this.recordReplayFixtureIfNeeded(raw, normalized, context);
    return normalized;
  }

  private recordReplayFixtureIfNeeded(
    raw: JustTCGRawCardResponse,
    normalized: JustTCGNormalizedResponse,
    context?: JustTCGKnownCardContext,
  ) {
    const replayDecision = this.lastReplayDecision;

    if (!replayDecision?.recordAfterLive) {
      return;
    }

    const normalizedContext = normalizeJustTCGContext(context);
    const locations = createJustTCGReplayRecords(raw, normalized, normalizedContext)
      .map((record) => this.replayRecorder.record({
        game: normalizedContext.game,
        identity: record.identity,
        normalized: record.normalized,
        provider: this.id,
        providerVersion: this.adapter.metadata.version,
        raw: record.raw,
        sdkVersion: this.adapter.metadata.version,
      }));
    const location = locations[0] ?? replayDecision.location;

    replayDecision.session.fixtureLoaded = true;
    replayDecision.session.fixturePath = location.path;
    replayDecision.session.liveRequestSkipped = false;
    replayDecision.session.quotaSaved = false;
    replayDecision.session.recordedAt = new Date().toISOString();
    replayDecision.session.recordedFrom = "LIVE_PROVIDER";
    replayDecision.session.sdkVersion = this.adapter.metadata.version;
    replayDecision.session.status = "RECORDED";
    this.markProviderRequestTrace("Replay fixture recorded", {
      fixturePath: location.path,
      mode: replayDecision.mode,
    });
  }

  async executeKnownCard(
    context?: JustTCGKnownCardContext,
  ): Promise<ProviderResult<JustTCGNormalizedResponse>> {
    const client = new ProviderClient<
      JustTCGRawCardResponse,
      JustTCGNormalizedResponse,
      JustTCGKnownCardContext
    >(this.adapter, undefined, {
      fetchRaw: (requestContext) => this.fetchKnownCard(requestContext),
    });

    const normalizedContext = normalizeJustTCGContext(context);
    const result = await client.execute(normalizedContext);

    if (result.data && this.lastRawProviderResponse) {
      this.recordReplayFixtureIfNeeded(
        this.lastRawProviderResponse,
        result.data,
        normalizedContext,
      );
    }

    return result;
  }

  async getMarketSnapshot(input: {
    cardName: string;
    collectorNumber?: string;
    condition?: string;
    finish?: string;
    game?: string;
    language?: string;
    printing?: string;
    printingId: string;
    variantId: string;
  }): Promise<MarketSnapshot> {
    const result = await this.executeKnownCard({
      cardName: input.cardName,
      collectorNumber: input.collectorNumber,
      condition: input.condition,
      finish: input.finish ?? finishFromVariantId(input.variantId),
      game: normalizeGameName(input.game),
      language: input.language,
      printing: input.printing ?? input.printingId,
      printingId: input.printingId,
      providerProductIdentifier: input.printingId,
      providerVariantIdentifier: input.variantId,
      variantId: input.variantId,
    });
    const normalized = result.data;
    const card = normalized?.cards.find(
      (item) => item.name.toLowerCase() === input.cardName.toLowerCase(),
    ) ?? normalized?.cards[0];
    const rawObservations = createRawObservations(normalized);
    const prices = card
      ? createVariantValuationPrices({
          card,
          requestedCondition: input.condition,
          requestedFinish: input.finish ?? finishFromVariantId(input.variantId),
          requestedLanguage: input.language,
          printingId: input.printingId,
        })
      : [];

    if (!card || prices.length === 0) {
      return {
        printingId: input.printingId,
        variantId: input.variantId,
        prices: [],
        providerId: this.id,
        updatedAt: new Date().toISOString(),
        sourceLabel: "Variant Valuation",
        identityEvidence: createIdentityEvidence(card),
        rawObservations,
        durationMs: result.diagnostics.durationMs,
        errorMessage:
          result.errorMessage ??
          "JustTCG variant valuation observations are unavailable for the selected asset.",
        priceMissing: true,
      };
    }

    return {
      printingId: input.printingId,
      variantId: input.variantId,
      prices,
      providerId: this.id,
      updatedAt: new Date().toISOString(),
      sourceLabel: "Variant Valuation",
      identityEvidence: createIdentityEvidence(card),
      rawObservations,
      durationMs: result.diagnostics.durationMs,
      priceMissing: false,
    };
  }

  async inspectKnownCardForDevelopment(
    context?: JustTCGKnownCardContext,
  ): Promise<JustTCGInspectionResult> {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("JustTCG inspection is only available in development.");
    }

    const startedAt = Date.now();

    try {
      const raw = await this.fetchKnownCard(context);
      const validationMessages = this.adapter.validate(raw);
      const normalized = await this.normalizeKnownCardForInspection(raw, context);
      const diagnostics = createProviderDiagnostics({
        cacheStatus: "BYPASS",
        coverage: this.adapter.getCoverage(context),
        durationMs: Date.now() - startedAt,
        evidence: this.adapter.mapEvidence(normalized),
        health: {
          checkedAt: new Date().toISOString(),
          latencyMs: Date.now() - startedAt,
          message: "JustTCG SDK authenticated and returned a known-card response.",
          retryable: true,
          status: "HEALTHY",
        },
        metadata: this.adapter.metadata,
        normalized: true,
        validationMessages,
      });
      const providerResultStatus = validationMessages.length
        ? "PARTIAL" as const
        : "SUCCESS" as const;
      const status = createJustTCGConnectionStatus({ normalized });

      return {
        authenticationStatus: status.authenticationStatus,
        connectionStatus: status.connectionStatus,
        diagnostics,
        normalized,
        providerRequestError: this.getLastProviderRequestError(),
        providerRequestTrace: this.getLastProviderRequestTrace(),
        providerResultStatus,
        rawSdkResponse: raw,
        replayDiagnostics: this.getReplayDiagnostics(),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown JustTCG error.";
      const diagnostics = createProviderDiagnostics({
        cacheStatus: "BYPASS",
        coverage: this.adapter.getCoverage(context),
        durationMs: Date.now() - startedAt,
        evidence: this.adapter.mapEvidence(null),
        health: {
          checkedAt: new Date().toISOString(),
          latencyMs: Date.now() - startedAt,
          message,
          retryable: true,
          status: "UNAVAILABLE",
        },
        metadata: this.adapter.metadata,
        validationMessages: [message],
      });
      const status = createJustTCGConnectionStatus({
        errorMessage: message,
        normalized: null,
      });

      return {
        authenticationStatus: status.authenticationStatus,
        connectionStatus: status.connectionStatus,
        diagnostics,
        normalized: null,
        providerRequestError: this.getLastProviderRequestError() ?? serializeError(error),
        providerRequestTrace: this.getLastProviderRequestTrace(),
        providerResultStatus: "FAILED",
        rawSdkResponse: null,
        replayDiagnostics: this.getReplayDiagnostics(),
      };
    }
  }
}

class ProviderTimeout extends Error {
  readonly code = "ProviderTimeout";

  constructor(timeoutMs: number) {
    super(`ProviderTimeout: JustTCG request exceeded ${timeoutMs}ms.`);
    this.name = "ProviderTimeout";
  }
}

function createJustTCGRequestTracer(existingEntries?: JustTCGRequestTraceEntry[]) {
  const entries = existingEntries ?? [];
  const firstEntryAt = entries[0]?.timestamp
    ? Date.parse(entries[0].timestamp)
    : Date.now();
  const lastEntryAt = entries.at(-1)?.timestamp
    ? Date.parse(entries.at(-1)!.timestamp)
    : firstEntryAt;
  const startedAt = Number.isNaN(firstEntryAt) ? Date.now() : firstEntryAt;
  let previousAt = Number.isNaN(lastEntryAt) ? startedAt : lastEntryAt;

  return {
    entries,
    mark(stage: string, details?: unknown) {
      const now = Date.now();
      const entry = {
        details: snapshotTraceDetails(details),
        durationSincePreviousMs: now - previousAt,
        durationSinceStartMs: now - startedAt,
        stage,
        timestamp: new Date(now).toISOString(),
      };
      entries.push(entry);
      previousAt = now;
      console.info("[JustTCGProvider]", JSON.stringify(entry));
    },
  };
}

function snapshotTraceDetails(details: unknown) {
  if (details === undefined) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(details)) as unknown;
  } catch {
    return details;
  }
}

function installJustTCGFetchDiagnostics(trace: ReturnType<typeof createJustTCGRequestTracer>) {
  const originalFetch = globalThis.fetch as FetchFunction;

  globalThis.fetch = (async (input, init) => {
    const request = new Request(input, init);
    trace.mark("HTTP request initiated", {
      method: request.method,
      url: request.url,
    });

    try {
      const response = await originalFetch(input, init);
      trace.mark("HTTP response received", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });
      trace.mark("Response status", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
      });
      trace.mark("Response headers (safe only)", getSafeResponseHeaders(response.headers));

      const safeBody = await readSafeResponseBody(response);
      trace.mark("Response body (safe)", safeBody);

      return response;
    } catch (error) {
      trace.mark("HTTP request failed", classifyNetworkError(error));
      throw error;
    }
  }) as FetchFunction;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function withJustTCGTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new ProviderTimeout(timeoutMs)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function getSafeResponseHeaders(headers: Headers) {
  const safeHeaderNames = [
    "content-type",
    "date",
    "retry-after",
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
    "x-ratelimit-reset",
    "x-request-id",
  ];

  return safeHeaderNames.reduce<Record<string, string>>((safeHeaders, name) => {
    const value = headers.get(name);
    if (value) {
      safeHeaders[name] = value;
    }
    return safeHeaders;
  }, {});
}

async function readSafeResponseBody(response: Response) {
  try {
    const text = await response.clone().text();
    const truncated = text.length > 4_000;
    const body = truncated ? `${text.slice(0, 4_000)}... [truncated]` : text;

    return {
      body: parseJsonIfPossible(body),
      truncated,
    };
  } catch (error) {
    return {
      bodyReadError: serializeError(error),
    };
  }
}

function parseJsonIfPossible(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function classifyJustTCGProviderError(
  error: unknown,
  trace: JustTCGRequestTraceEntry[],
) {
  const serialized = serializeError(error);
  const latestResponseStatus = [...trace]
    .reverse()
    .find((entry) => entry.stage === "Response status")?.details;
  const latestResponseBody = [...trace]
    .reverse()
    .find((entry) => entry.stage === "Response body (safe)")?.details;
  const status = getStatusFromTraceDetails(latestResponseStatus);
  const providerBody = getProviderBody(latestResponseBody);
  const message = getErrorMessage(error);

  return {
    authenticationFailure:
      status === 401 || message.toLowerCase().includes("api key is missing"),
    authorizationFailure: status === 403,
    connectionFailure: isConnectionFailure(error),
    dnsFailure: isDnsFailure(error),
    endpointMismatch: status === 404,
    httpStatus: status,
    providerErrorCode: getProviderErrorCode(providerBody),
    providerErrorMessage: getProviderErrorMessage(providerBody) ?? message,
    rateLimiting: status === 429,
    sdkError: serialized,
    timeout: error instanceof ProviderTimeout,
  };
}

function classifyNetworkError(error: unknown) {
  return {
    connectionFailure: isConnectionFailure(error),
    dnsFailure: isDnsFailure(error),
    sdkError: serializeError(error),
  };
}

function isDnsFailure(error: unknown) {
  return getCauseCode(error) === "ENOTFOUND" || getCauseCode(error) === "EAI_AGAIN";
}

function isConnectionFailure(error: unknown) {
  const code = getCauseCode(error);
  return Boolean(
    code &&
      ["ECONNRESET", "ECONNREFUSED", "ENETUNREACH", "ETIMEDOUT"].includes(code),
  );
}

function getCauseCode(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "cause" in error &&
    error.cause &&
    typeof error.cause === "object" &&
    "code" in error.cause
  ) {
    return String(error.cause.code);
  }

  return null;
}

function getStatusFromTraceDetails(details: unknown) {
  if (details && typeof details === "object" && "status" in details) {
    return Number(details.status);
  }

  return null;
}

function getProviderBody(details: unknown) {
  if (
    details &&
    typeof details === "object" &&
    "body" in details &&
    details.body &&
    typeof details.body === "object"
  ) {
    return details.body as Record<string, unknown>;
  }

  return null;
}

function getProviderErrorCode(body: Record<string, unknown> | null) {
  return typeof body?.code === "string" ? body.code : null;
}

function getProviderErrorMessage(body: Record<string, unknown> | null) {
  return typeof body?.error === "string" ? body.error : null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown JustTCG error.";
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      cause: serializeCause(error.cause),
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return error;
}

function serializeCause(cause: unknown) {
  if (!cause || typeof cause !== "object") {
    return cause;
  }

  return Object.fromEntries(
    Object.entries(cause).map(([key, value]) => [key, String(value)]),
  );
}

function createRawObservations(
  normalized: JustTCGNormalizedResponse | null | undefined,
) {
  return [
    ...(normalized?.providerMetadata.rawObservations ?? []),
    ...(normalized?.cards.flatMap((card) => [
      ...card.rawObservations,
      ...card.variants.flatMap((variant) => variant.rawObservations),
    ]) ?? []),
  ];
}

function createIdentityEvidence(
  card: JustTCGNormalizedResponse["cards"][number] | undefined,
) {
  return {
    canonicalName: card?.name ?? null,
    collectorNumber: card?.number ?? null,
    condition: null,
    finish: null,
    game: card?.game ?? null,
    language: null,
    productIdentifier:
      card?.identifiers.tcgplayerId ??
      card?.cardUuid ??
      null,
    providerTimestamp: card ? new Date().toISOString() : null,
  };
}

function createJustTCGReplayIdentity(
  context: Required<JustTCGKnownCardContext>,
): ReplayIdentityInput {
  const variantId = context.providerVariantIdentifier !== "unknown"
    ? context.providerVariantIdentifier
    : context.variantId;
  const productId = context.providerProductIdentifier !== "unknown"
    ? context.providerProductIdentifier
    : context.printingId;

  return {
    assetIdentity: context.cardName,
    collectorNumber: context.collectorNumber,
    condition: context.condition,
    finish: context.finish,
    language: context.language,
    printing: context.printing !== "unknown" ? context.printing : productId,
    providerProductIdentifier: productId,
    providerVariantIdentifier: variantId,
  };
}

function createJustTCGReplayRecords(
  raw: JustTCGRawCardResponse,
  normalized: JustTCGNormalizedResponse,
  context: Required<JustTCGKnownCardContext>,
) {
  return normalized.cards.flatMap((card, cardIndex) => {
    const rawCard = raw.data[cardIndex];

    if (!rawCard) {
      return [];
    }

    return card.variants.map((variant, variantIndex) => {
      const rawVariant = rawCard.variants[variantIndex];
      const scopedRaw = {
        ...raw,
        data: [
          {
            ...rawCard,
            variants: rawVariant ? [rawVariant] : [],
          },
        ],
      };
      const scopedNormalized = {
        ...normalized,
        cards: [
          {
            ...card,
            variants: [variant],
          },
        ],
      };
      const productIdentifier = context.providerProductIdentifier !== "unknown"
        ? context.providerProductIdentifier
        : context.printingId !== "unknown"
          ? context.printingId
          : card.identifiers.scryfallId ?? card.cardUuid;
      const variantIdentifier = context.providerVariantIdentifier !== "unknown"
        ? context.providerVariantIdentifier
        : context.variantId !== "unknown"
          ? context.variantId
          : `${productIdentifier}:${variant.printing.toLowerCase() === "foil" ? "foil" : "nonfoil"}`;

      return {
        identity: {
          assetIdentity: card.name,
          collectorNumber: card.number ?? context.collectorNumber,
          condition: variant.condition,
          finish: variant.printing,
          language: variant.language ?? context.language,
          printing: context.printing !== "unknown"
            ? context.printing
            : card.setName ?? card.setId ?? productIdentifier,
          providerProductIdentifier: productIdentifier,
          providerVariantIdentifier: variantIdentifier,
        },
        normalized: scopedNormalized,
        raw: scopedRaw,
      };
    });
  });
}

function normalizeGameName(game?: string) {
  if (!game || game.toLowerCase() === "magic") {
    return "Magic: The Gathering";
  }

  return game;
}

function finishFromVariantId(variantId: string | undefined) {
  if (!variantId) {
    return "Normal";
  }

  const suffix = variantId.split(":").at(-1)?.toLowerCase();

  if (suffix === "foil") {
    return "Foil";
  }

  if (suffix === "nonfoil" || suffix === "normal") {
    return "Normal";
  }

  return "Normal";
}

function createVariantValuationPrices(input: {
  card: JustTCGNormalizedResponse["cards"][number];
  requestedCondition?: string;
  requestedFinish?: string;
  requestedLanguage?: string;
  printingId: string;
}): MarketPrice[] {
  return input.card.variants
    .filter((variant) =>
      identityValueMatches(variant.condition, input.requestedCondition) &&
      identityValueMatches(variant.printing, input.requestedFinish) &&
      identityValueMatches(variant.language, input.requestedLanguage)
    )
    .filter((variant) => variant.currentPriceUsd !== null)
    .map((variant) => ({
      id: `justtcg:${input.printingId}:${variant.variantId}:variant-valuation`,
      cardId: input.printingId,
      printingId: input.printingId,
      variantId: `${input.printingId}:${variant.variantId}`,
      providerId: "justtcg",
      source: "Variant Valuation",
      currency: "USD",
      finish: variant.printing,
      price: variant.currentPriceUsd ?? 0,
      priceType: "variant_valuation",
      updatedAt: variant.lastUpdatedAt ?? new Date().toISOString(),
      confidence: 0,
      condition: variant.condition,
      conditionSpecific: true,
    }));
}

function identityValueMatches(actual: string | null, expected: string | undefined) {
  if (!expected) {
    return true;
  }

  return normalizeComparableIdentityValue(actual ?? "") ===
    normalizeComparableIdentityValue(expected);
}

function normalizeComparableIdentityValue(value: string) {
  const normalized = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    "lightly played": "lp",
    "near mint": "nm",
    "non-foil": "normal",
    "nonfoil": "normal",
  };

  return aliases[normalized] ?? normalized;
}
