import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";
import { pricingLookupConfig } from "../config/pricingLookup";
import {
  captureCompletedCatalogues,
  defaultPricingToolRoot,
  pendingCapturedCatalogueCount,
} from "../lib/pricing/tcgplayerObserver";

const once = process.argv.includes("--once");
const toolRoot =
  process.env.PHRONESIS_PRICING_TOOL_ROOT ?? defaultPricingToolRoot();
const archiveRoot =
  process.env.PHRONESIS_PRICING_ARCHIVE_ROOT ??
  resolve(".data/pricing-catalogues");
const importerPath = resolve("scripts/import-pricing-catalogues.ts");
const loaderPath = resolve("tests/register-test-hooks.mjs");
let running = false;
let importer: ChildProcess | null = null;

function startImporterIfNeeded(): void {
  if (importer || pendingCapturedCatalogueCount(archiveRoot) === 0) return;
  importer = spawn(
    process.execPath,
    ["--import", loaderPath, importerPath],
    { cwd: process.cwd(), env: process.env, stdio: "inherit" },
  );
  importer.once("exit", (code, signal) => {
    importer = null;
    if (code && code !== 0) {
      process.stderr.write(
        `[pricing-import] importer exited with ${code}; captured catalogues remain durable for review or retry.\n`,
      );
    } else if (signal) {
      process.stderr.write(
        `[pricing-import] importer stopped by ${signal}; interrupted receipts will recover on the next drain.\n`,
      );
    }
  });
}

function capture(): void {
  if (running) return;
  running = true;
  try {
    const attempts = captureCompletedCatalogues({
      archiveRoot,
      toolRoot,
    });
    for (const attempt of attempts) {
      process.stdout.write(`${JSON.stringify(attempt)}\n`);
    }
    startImporterIfNeeded();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(
      `[pricing-capture] ${message.replace(/[\r\n]+/g, " ").slice(0, 800)}\n`,
    );
  } finally {
    running = false;
  }
}

capture();
if (!once) {
  const timer = setInterval(
    capture,
    pricingLookupConfig.observerPollMilliseconds,
  );
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      clearInterval(timer);
      if (importer && !importer.killed) importer.kill(signal);
      process.exit(0);
    });
  }
}
