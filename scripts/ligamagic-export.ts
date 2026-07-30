import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Locator,
  type Page,
  type Request,
  type Response,
} from "playwright-core";
import { readLigaMagicCsv } from "../lib/providers/ligamagic/Csv.ts";
import {
  buildLigaMagicSnapshot,
  sha256File,
  type LigaMagicSourceReceipt,
  type SanitizedNetworkEvent,
} from "../lib/providers/ligamagic/Snapshot.ts";

type Command = "profile" | "pilot" | "dry-run";

type LocalConfig = {
  exportUrl: string;
  configuredAt: string;
  debugPort: number;
};

type ExportControls = {
  collection: Locator;
  order: Locator;
  format: Locator;
  exportButton: Locator;
  collections: Array<{ label: string; advertisedCards: number }>;
  cardNumberOrderLabel: string;
  standardFormatLabel: string;
};

const command = process.argv[2] as Command | undefined;
function isCommand(value: string | undefined): value is Command {
  return value === "profile" || value === "pilot" || value === "dry-run";
}

if (!isCommand(command)) {
  throw new Error(
    "Usage: ligamagic-export.ts <profile|pilot|dry-run> [--url URL] [--collection LABEL]",
  );
}
const activeCommand: Command = command;

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const localRoot = resolve(
  process.env.PHRONESIS_LIGAMAGIC_ROOT ?? ".data/ligamagic",
);
const profileRoot = join(localRoot, "browser-profile");
const runsRoot = join(localRoot, "runs");
const configPath = join(localRoot, "config.json");
const DEFAULT_DEBUG_PORT = 9225;

function ensurePrivateDirectory(path: string): void {
  mkdirSync(path, { recursive: true, mode: 0o700 });
  if (lstatSync(path).isSymbolicLink())
    throw new Error(`${path} must not be a symlink.`);
  chmodSync(path, 0o700);
}

function validateExportUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !["ligamagic.com.br", "www.ligamagic.com.br"].includes(url.hostname) ||
    url.searchParams.get("view") !== "colecao/export"
  ) {
    throw new Error(
      "LigaMagic export URL must be the HTTPS collection-export page.",
    );
  }
  url.hash = "";
  return url.toString();
}

function writePrivateJson(path: string, value: unknown): void {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, path);
}

function loadConfig(): LocalConfig {
  const configuredUrl = argument("--url") ?? process.env.LIGAMAGIC_EXPORT_URL;
  const configuredPort = Number(
    argument("--debug-port") ?? process.env.LIGAMAGIC_DEBUG_PORT,
  );
  const debugPort = Number.isInteger(configuredPort)
    ? configuredPort
    : DEFAULT_DEBUG_PORT;
  if (debugPort < 1024 || debugPort > 65535) {
    throw new Error(
      "LigaMagic Chrome debug port must be between 1024 and 65535.",
    );
  }
  if (configuredUrl) {
    return {
      exportUrl: validateExportUrl(configuredUrl),
      configuredAt: new Date().toISOString(),
      debugPort,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    throw new Error(
      "LigaMagic profile is not configured. Run ligamagic:profile with --url first.",
    );
  }
  if (!parsed || typeof parsed !== "object" || !("exportUrl" in parsed)) {
    throw new Error("LigaMagic local profile configuration is invalid.");
  }
  return {
    exportUrl: validateExportUrl(String(parsed.exportUrl)),
    configuredAt:
      "configuredAt" in parsed && typeof parsed.configuredAt === "string"
        ? parsed.configuredAt
        : new Date(0).toISOString(),
    debugPort:
      "debugPort" in parsed &&
      typeof parsed.debugPort === "number" &&
      Number.isInteger(parsed.debugPort) &&
      parsed.debugPort >= 1024 &&
      parsed.debugPort <= 65535
        ? parsed.debugPort
        : DEFAULT_DEBUG_PORT,
  };
}

async function stopDedicatedChrome(debugPort: number): Promise<void> {
  const pattern = `remote-debugging-port=${debugPort}`;
  spawnSync("/usr/bin/pkill", ["-f", pattern], { stdio: "ignore" });
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const running =
      spawnSync("/usr/bin/pgrep", ["-f", pattern], { stdio: "ignore" })
        .status === 0;
    if (!running) break;
    await new Promise((resolveStopped) => setTimeout(resolveStopped, 300));
  }
  if (
    spawnSync("/usr/bin/pgrep", ["-f", pattern], { stdio: "ignore" }).status ===
    0
  ) {
    spawnSync("/usr/bin/pkill", ["-9", "-f", pattern], { stdio: "ignore" });
    await new Promise((resolveStopped) => setTimeout(resolveStopped, 500));
  }
  for (const lockName of [
    "SingletonLock",
    "SingletonCookie",
    "SingletonSocket",
  ]) {
    try {
      unlinkSync(join(profileRoot, lockName));
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !("code" in error) ||
        error.code !== "ENOENT"
      )
        throw error;
    }
  }
}

function launchPlainChrome(config: LocalConfig): void {
  const child = spawn(
    "/usr/bin/open",
    [
      "-na",
      "Google Chrome",
      "--args",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${config.debugPort}`,
      `--user-data-dir=${profileRoot}`,
      config.exportUrl,
    ],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
}

async function debugPortReady(debugPort: number): Promise<boolean> {
  try {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/version`, {
      signal: AbortSignal.timeout(1_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function relaunchAndAttach(config: LocalConfig): Promise<{
  browser: Browser;
  context: BrowserContext;
}> {
  await stopDedicatedChrome(config.debugPort);
  launchPlainChrome(config);
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline && !(await debugPortReady(config.debugPort))) {
    await new Promise((resolveReady) => setTimeout(resolveReady, 500));
  }
  if (!(await debugPortReady(config.debugPort))) {
    throw new Error(
      `Dedicated LigaMagic Chrome did not open on port ${config.debugPort}.`,
    );
  }
  const browser = await chromium.connectOverCDP(
    `http://127.0.0.1:${config.debugPort}`,
  );
  const context = browser.contexts()[0];
  if (!context) {
    await browser.close();
    throw new Error(
      "Dedicated LigaMagic Chrome did not expose its persistent browser context.",
    );
  }
  return { browser, context };
}

function normalizeLabel(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function parseAdvertisedCards(label: string): number | null {
  const match = normalizeLabel(label).match(/\(([\d.]+)\s+cards\)/i);
  if (!match) return null;
  const value = Number(match[1].replace(/\./g, ""));
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

async function optionLabels(select: Locator): Promise<string[]> {
  return (await select.locator("option").allTextContents()).map(normalizeLabel);
}

async function discoverControls(page: Page): Promise<ExportControls> {
  const selects = page.locator("select");
  let collection: Locator | null = null;
  let order: Locator | null = null;
  let format: Locator | null = null;
  let collections: Array<{ label: string; advertisedCards: number }> = [];
  let cardNumberOrderLabel = "";
  let standardFormatLabel = "";
  for (let index = 0; index < (await selects.count()); index += 1) {
    const candidate = selects.nth(index);
    const labels = await optionLabels(candidate);
    const candidateCollections = labels
      .map((label) => ({ label, advertisedCards: parseAdvertisedCards(label) }))
      .filter(
        (entry): entry is { label: string; advertisedCards: number } =>
          entry.advertisedCards !== null,
      );
    if (candidateCollections.length > collections.length) {
      collection = candidate;
      collections = candidateCollections;
    }
    const numberLabel = labels.find((label) => label === "Número do Card");
    if (numberLabel && !order) {
      order = candidate;
      cardNumberOrderLabel = numberLabel;
    }
    const standardLabel = labels.find(
      (label) => label === "Padrão LigaMagic CSV [Modelo para Coleções]",
    );
    if (standardLabel && !format) {
      format = candidate;
      standardFormatLabel = standardLabel;
    }
  }
  if (!collection || collections.length === 0 || !order || !format) {
    throw new Error(
      "REAUTHENTICATION_REQUIRED: authenticated LigaMagic export controls were not found.",
    );
  }
  const form = collection.locator("xpath=ancestor::form[1]");
  const scopedButtons = form.getByRole("button", { name: /^Exportar$/i });
  const exportButton =
    (await scopedButtons.count()) > 0
      ? scopedButtons.first()
      : page.getByRole("button", { name: /^Exportar$/i }).first();
  if ((await exportButton.count()) !== 1) {
    throw new Error(
      "LigaMagic collection export button could not be identified uniquely.",
    );
  }
  return {
    collection,
    order,
    format,
    exportButton,
    collections,
    cardNumberOrderLabel,
    standardFormatLabel,
  };
}

function sanitizeUrlEvent(
  phase: "request" | "response",
  request: Request,
  response?: Response,
): SanitizedNetworkEvent | null {
  const url = new URL(request.url());
  if (!["ligamagic.com.br", "www.ligamagic.com.br"].includes(url.hostname))
    return null;
  return {
    phase,
    method: request.method(),
    origin: url.origin,
    pathname: url.pathname,
    queryKeys: [...new Set([...url.searchParams.keys()])].sort(),
    resourceType: request.resourceType(),
    ...(response
      ? {
          status: response.status(),
          contentType: response.headers()["content-type"] ?? null,
          contentDisposition: response.headers()["content-disposition"] ?? null,
        }
      : {}),
  };
}

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function exportCollection(input: {
  page: Page;
  runDirectory: string;
  collectionLabel: string;
}): Promise<LigaMagicSourceReceipt> {
  const controls = await discoverControls(input.page);
  const collection = controls.collections.find(
    (entry) => entry.label === input.collectionLabel,
  );
  if (!collection)
    throw new Error(
      `LigaMagic collection disappeared: ${input.collectionLabel}.`,
    );
  await controls.collection.selectOption({ label: collection.label });
  await controls.order.selectOption({ label: controls.cardNumberOrderLabel });
  await controls.format.selectOption({ label: controls.standardFormatLabel });

  const networkEvents: SanitizedNetworkEvent[] = [];
  let capture = true;
  const onRequest = (request: Request) => {
    if (!capture) return;
    const event = sanitizeUrlEvent("request", request);
    if (event) networkEvents.push(event);
  };
  const onResponse = (response: Response) => {
    if (!capture) return;
    const event = sanitizeUrlEvent("response", response.request(), response);
    if (event) networkEvents.push(event);
  };
  input.page.on("request", onRequest);
  input.page.on("response", onResponse);
  const exportedAt = new Date().toISOString();
  try {
    const rawDirectory = join(input.runDirectory, "raw");
    ensurePrivateDirectory(rawDirectory);
    const filePath = join(rawDirectory, `${slug(collection.label)}.csv`);
    const downloadDirectory = join(
      input.runDirectory,
      `.download-${slug(collection.label)}`,
    );
    ensurePrivateDirectory(downloadDirectory);
    const cdp = await input.page.context().newCDPSession(input.page);
    await cdp.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadDirectory,
    });
    await controls.exportButton.click();
    const deadline = Date.now() + 120_000;
    let downloadedPath: string | null = null;
    let stableSize = -1;
    while (Date.now() < deadline) {
      const candidates = readdirSync(downloadDirectory).filter(
        (name) => !name.endsWith(".crdownload") && !name.endsWith(".tmp"),
      );
      if (candidates.length === 1) {
        const candidate = join(downloadDirectory, candidates[0]);
        const size = statSync(candidate).size;
        if (size > 0 && size === stableSize) {
          downloadedPath = candidate;
          break;
        }
        stableSize = size;
      }
      await input.page.waitForTimeout(1_000);
    }
    if (!downloadedPath) {
      throw new Error(
        `LigaMagic ${collection.label} download did not complete within 120 seconds.`,
      );
    }
    const suggestedFilename = basename(downloadedPath);
    renameSync(downloadedPath, filePath);
    rmSync(downloadDirectory, { recursive: true, force: true });
    capture = false;
    const file = lstatSync(filePath);
    if (!file.isFile() || file.isSymbolicLink() || file.size <= 256) {
      throw new Error(
        `LigaMagic ${collection.label} download is incomplete or unsafe.`,
      );
    }
    chmodSync(filePath, 0o600);
    const rows = readLigaMagicCsv(readFileSync(filePath));
    const actualQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
    if (actualQuantity !== collection.advertisedCards) {
      throw new Error(
        `LigaMagic ${collection.label} advertised ${collection.advertisedCards} cards but exported quantity ${actualQuantity} across ${rows.length} rows.`,
      );
    }
    const receipt: LigaMagicSourceReceipt = {
      collectionLabel: collection.label,
      advertisedCards: collection.advertisedCards,
      actualRows: rows.length,
      actualQuantity,
      exportedAt,
      filePath,
      bytes: file.size,
      sha256: sha256File(filePath),
      suggestedFilename,
      networkEvents: networkEvents.slice(0, 200),
    };
    writePrivateJson(
      join(input.runDirectory, `receipt-${slug(collection.label)}.json`),
      {
        featureId: "PHR-API-005",
        ...receipt,
        filePath: basename(receipt.filePath),
      },
    );
    return receipt;
  } finally {
    capture = false;
    input.page.off("request", onRequest);
    input.page.off("response", onResponse);
  }
}

function runId(prefix: string): string {
  return `${prefix}-${new Date().toISOString().replace(/[-:.]/g, "").replace("Z", "Z")}`;
}

async function main(): Promise<void> {
  ensurePrivateDirectory(localRoot);
  ensurePrivateDirectory(profileRoot);
  ensurePrivateDirectory(runsRoot);
  const config = loadConfig();
  if (activeCommand === "profile") {
    writePrivateJson(configPath, {
      exportUrl: config.exportUrl,
      configuredAt: new Date().toISOString(),
      debugPort: config.debugPort,
    } satisfies LocalConfig);
    await stopDedicatedChrome(config.debugPort);
    launchPlainChrome(config);
    process.stdout.write(
      `Ordinary Chrome opened on dedicated LigaMagic profile (port ${config.debugPort}). ` +
        "Phronesis has not attached automation. Sign in normally, open the collection export page, " +
        "and leave the session saved; then run ligamagic:pilot.\n",
    );
    return;
  }

  const { browser, context } = await relaunchAndAttach(config);
  const page = context.pages()[0] ?? (await context.newPage());
  page.setDefaultTimeout(30_000);
  try {
    await page.goto(config.exportUrl, { waitUntil: "domcontentloaded" });
    const controls = await discoverControls(page);
    const id = runId(activeCommand);
    const directory = join(runsRoot, id);
    ensurePrivateDirectory(directory);
    const startedAt = new Date().toISOString();

    if (activeCommand === "pilot") {
      const requested = argument("--collection");
      const collection = requested
        ? controls.collections.find((entry) => entry.label === requested)
        : controls.collections[0];
      if (!collection)
        throw new Error(
          `Requested LigaMagic collection was not found: ${requested}.`,
        );
      const receipt = await exportCollection({
        page,
        runDirectory: directory,
        collectionLabel: collection.label,
      });
      writePrivateJson(join(directory, "pilot-manifest.json"), {
        featureId: "PHR-API-005",
        runId: id,
        status: "PILOT_COMPLETE",
        startedAt,
        completedAt: new Date().toISOString(),
        collectionCount: controls.collections.length,
        receipt: { ...receipt, filePath: basename(receipt.filePath) },
      });
      process.stdout.write(
        `${JSON.stringify({ status: "PILOT_COMPLETE", runId: id, collection: receipt.collectionLabel, cards: receipt.actualQuantity, rows: receipt.actualRows, sha256: receipt.sha256 })}\n`,
      );
      return;
    }

    const receipts: LigaMagicSourceReceipt[] = [];
    for (const [index, collection] of controls.collections.entries()) {
      process.stdout.write(
        `[${index + 1}/${controls.collections.length}] Exporting ${collection.label}\n`,
      );
      receipts.push(
        await exportCollection({
          page,
          runDirectory: directory,
          collectionLabel: collection.label,
        }),
      );
      if (index + 1 < controls.collections.length)
        await page.waitForTimeout(2_500);
    }
    const completedAt = new Date().toISOString();
    const manifest = buildLigaMagicSnapshot({
      runId: id,
      outputDirectory: directory,
      startedAt,
      completedAt,
      sources: receipts,
    });
    process.stdout.write(`${JSON.stringify(manifest)}\n`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[ligamagic] ${message.replace(/[\r\n]+/g, " ")}\n`);
  process.exitCode = 1;
});
