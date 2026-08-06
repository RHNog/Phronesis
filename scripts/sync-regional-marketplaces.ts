import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { operationalPricingDatabasePath } from "../lib/pricing/databasePath.ts";
import {
  acquireRegionalAcquisitionLock,
  classifyAcquisitionFailure,
  ensurePrivateAcquisitionDirectory,
  newYorkDateKey,
  providerCompletedToday,
  readRegionalAcquisitionStatus,
  sanitizeAcquisitionMessage,
  writeRegionalAcquisitionStatus,
  type LigaProviderId,
  type LigaProviderOutcome,
  type RegionalAcquisitionStatus,
} from "../lib/providers/liga/RecurringAcquisition.ts";

type Command = "once" | "status";

const command = (process.argv[2] ?? "once") as Command;
if (command !== "once" && command !== "status") {
  throw new Error("Usage: sync-regional-marketplaces.ts <once|status> [--force]");
}

const force = process.argv.includes("--force");
const root = resolve(
  process.env.PHRONESIS_REGIONAL_ACQUISITION_ROOT ?? ".data/regional-acquisition",
);
const statusPath = resolve(root, "status.json");
const providerRoot = (providerId: LigaProviderId) =>
  resolve(process.env[`PHRONESIS_${providerId.toUpperCase()}_ROOT`] ?? `.data/${providerId}`);

function childEnvironment(): NodeJS.ProcessEnv {
  return {
    ...process.env,
    PHRONESIS_PRICING_DB_PATH: operationalPricingDatabasePath(),
  };
}

function runChild(args: string[]): { ok: boolean; stdout: string; message: string } {
  const result = spawnSync(process.execPath, args, {
    cwd: process.cwd(),
    env: childEnvironment(),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  const stdout = result.stdout?.trim() ?? "";
  const detail = result.error ?? result.stderr ?? `child exited ${result.status ?? "without status"}`;
  return {
    ok: result.status === 0 && !result.error,
    stdout,
    message: sanitizeAcquisitionMessage(detail),
  };
}

function snapshotReceipt(stdout: string): { runId: string | null; status: string | null } {
  const lines = stdout.split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as { runId?: unknown; status?: unknown };
      if (typeof parsed.runId === "string") {
        return {
          runId: parsed.runId,
          status: typeof parsed.status === "string" ? parsed.status : null,
        };
      }
    } catch {
      // Progress lines precede the final JSON manifest.
    }
  }
  return { runId: null, status: null };
}

function providerIsConfigured(providerId: LigaProviderId): boolean {
  const configPath = resolve(providerRoot(providerId), "config.json");
  if (!existsSync(configPath)) return false;
  if (providerId === "ligamagic") return true;
  try {
    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      pilotVerifiedAt?: unknown;
    };
    return typeof config.pilotVerifiedAt === "string";
  } catch {
    return false;
  }
}

function skipOutcome(providerId: LigaProviderId, now: Date): LigaProviderOutcome {
  return {
    providerId,
    status: "SKIPPED_SAME_DAY",
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    snapshotRunId: null,
    promotionStatus: "NOT_APPLICABLE",
    message: "A verified provider run already completed today.",
  };
}

function notConfiguredOutcome(providerId: LigaProviderId, now: Date): LigaProviderOutcome {
  return {
    providerId,
    status: "NOT_CONFIGURED",
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    snapshotRunId: null,
    promotionStatus: "NOT_APPLICABLE",
    message: `Run ${providerId}:profile and ${providerId}:pilot after owner authentication.`,
  };
}

function acquireProvider(providerId: LigaProviderId, now: Date): LigaProviderOutcome {
  const startedAt = now.toISOString();
  const acquired = runChild([
    "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
    "scripts/ligamagic-export.ts",
    "dry-run",
    "--provider",
    providerId,
  ]);
  const completedAt = new Date().toISOString();
  if (!acquired.ok) {
    return {
      providerId,
      status: classifyAcquisitionFailure(acquired.message),
      startedAt,
      completedAt,
      snapshotRunId: null,
      promotionStatus: "NOT_APPLICABLE",
      message: acquired.message || `${providerId} acquisition failed.`,
    };
  }

  const receipt = snapshotReceipt(acquired.stdout);
  if (receipt.status !== "DRY_RUN_COMPLETE") {
    return {
      providerId,
      status: "FAILED",
      startedAt,
      completedAt,
      snapshotRunId: receipt.runId,
      promotionStatus: "NOT_APPLICABLE",
      message:
        receipt.status === "DRY_RUN_REVIEW_REQUIRED"
          ? "Snapshot has conflicting duplicate evidence and requires review."
          : "Acquisition did not return a complete verified snapshot receipt.",
    };
  }
  const reconciled = runChild([
    "--import",
    "./tests/register-test-hooks.mjs",
    providerId === "ligapokemon"
      ? "scripts/build-pokemon-regional-crosswalk.ts"
      : "scripts/build-regional-crosswalk.ts",
  ]);
  return {
    providerId,
    status: reconciled.ok ? "SUCCESS" : "FAILED",
    startedAt,
    completedAt: new Date().toISOString(),
    snapshotRunId: receipt.runId,
    promotionStatus: reconciled.ok ? "SUCCESS" : "FAILED",
    message: reconciled.ok
      ? providerId === "ligapokemon"
        ? "Snapshot verified and the Pokémon regional crosswalk was rebuilt; Arbitrage exposure remains separately gated."
        : "Snapshot verified and the Magic regional crosswalk was rebuilt."
      : reconciled.message ||
        "Snapshot completed but regional reconciliation failed.",
  };
}

function main(): void {
  ensurePrivateAcquisitionDirectory(root);
  const previous = readRegionalAcquisitionStatus(statusPath);
  if (command === "status") {
    process.stdout.write(`${JSON.stringify(previous ?? { status: "NEVER_RUN" }, null, 2)}\n`);
    return;
  }

  const now = new Date();
  const runId = `regional-${now.toISOString().replace(/[-:.]/g, "")}`;
  const lock = acquireRegionalAcquisitionLock({ root, runId, now });
  let finalStatus: RegionalAcquisitionStatus | null = null;
  try {
    const status: RegionalAcquisitionStatus = {
      featureId: "PHR-API-013",
      runId,
      status: "RUNNING",
      localDate: newYorkDateKey(now),
      startedAt: now.toISOString(),
      completedAt: null,
      providers: {},
    };
    writeRegionalAcquisitionStatus(statusPath, status);

    for (const providerId of ["ligamagic", "ligapokemon"] as const) {
      if (!force && providerCompletedToday(previous, providerId, now)) {
        status.providers[providerId] = skipOutcome(providerId, new Date());
      } else if (!providerIsConfigured(providerId)) {
        status.providers[providerId] = notConfiguredOutcome(providerId, new Date());
      } else {
        status.providers[providerId] = acquireProvider(providerId, new Date());
      }
      writeRegionalAcquisitionStatus(statusPath, status);
    }

    const hardFailure = Object.values(status.providers).some(
      (outcome) =>
        outcome &&
        [
          "FAILED",
          "REAUTHENTICATION_REQUIRED",
          "SCHEMA_DRIFT",
          "SOURCE_COUNT_MISMATCH",
        ].includes(outcome.status),
    );
    status.status = hardFailure ? "PARTIAL_FAILURE" : "COMPLETE";
    status.completedAt = new Date().toISOString();
    writeRegionalAcquisitionStatus(statusPath, status);
    finalStatus = status;
    process.stdout.write(`${JSON.stringify(status)}\n`);
    if (hardFailure) process.exitCode = 1;
  } finally {
    lock.release();
  }

  if (!finalStatus) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`[regional-acquisition] ${sanitizeAcquisitionMessage(error)}\n`);
  process.exitCode = 1;
}
