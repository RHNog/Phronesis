import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  readRegionalAcquisitionStatus,
  sanitizeAcquisitionMessage,
  type LigaProviderId,
  type LigaProviderRunStatus,
} from "./RecurringAcquisition";

export type LigaProviderHealthStatus = LigaProviderRunStatus | "NEVER_RUN" | "RUNNING";

export type LigaProviderHealth = {
  acquisition: {
    lastCompletedAt: string | null;
    localDate: string | null;
    message: string;
    promotionStatus: "SUCCESS" | "FAILED" | "NOT_APPLICABLE";
    schedule: "Daily at 03:00 America/New_York";
    snapshotRunId: string | null;
  };
  configured: boolean;
  enabled: boolean;
  providerId: LigaProviderId;
  status: LigaProviderHealthStatus;
};

type RegionalProviderEnvironment = Record<string, string | undefined>;

const PROVIDERS: readonly LigaProviderId[] = ["ligamagic", "ligapokemon"];

function publicHealthMessage(value: unknown): string {
  return sanitizeAcquisitionMessage(value)
    .replace(/(?:file:\/\/)?\/(?:Users|Volumes|private|var|tmp)\/\S+/gi, "[private path]")
    .replace(/[A-Z]:\\[^\s]+/gi, "[private path]");
}

function acquisitionRoot(environment: RegionalProviderEnvironment): string {
  return resolve(
    /* turbopackIgnore: true */
    environment.PHRONESIS_REGIONAL_ACQUISITION_ROOT ??
      ".data/regional-acquisition",
  );
}

function providerRoot(
  providerId: LigaProviderId,
  root: string,
  environment: RegionalProviderEnvironment,
): string {
  const key = `PHRONESIS_${providerId.toUpperCase()}_ROOT`;
  return resolve(
    /* turbopackIgnore: true */
    environment[key] ?? resolve(root, "..", providerId),
  );
}

export function getLigaProviderHealth(
  environment: RegionalProviderEnvironment = process.env,
): LigaProviderHealth[] {
  const root = acquisitionRoot(environment);
  const receipt = readRegionalAcquisitionStatus(resolve(root, "status.json"));

  return PROVIDERS.map((providerId) => {
    const configured = existsSync(
      resolve(providerRoot(providerId, root, environment), "config.json"),
    );
    const outcome = receipt?.providers[providerId];
    const status: LigaProviderHealthStatus = outcome?.status ??
      (receipt?.status === "RUNNING"
        ? "RUNNING"
        : configured
          ? "NEVER_RUN"
          : "NOT_CONFIGURED");

    return {
      acquisition: {
        lastCompletedAt: outcome?.completedAt ?? null,
        localDate: receipt?.localDate ?? null,
        message: outcome
          ? publicHealthMessage(outcome.message)
          : configured
            ? "No acquisition outcome is recorded yet."
            : "Complete the owner-authenticated local profile and pilot.",
        promotionStatus: outcome?.promotionStatus ?? "NOT_APPLICABLE",
        schedule: "Daily at 03:00 America/New_York",
        snapshotRunId: outcome?.snapshotRunId ?? null,
      },
      configured,
      enabled: configured,
      providerId,
      status,
    };
  });
}
