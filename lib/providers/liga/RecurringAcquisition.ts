import {
  chmodSync,
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

export type LigaProviderId = "ligamagic" | "ligapokemon";
export type LigaProviderRunStatus =
  | "SUCCESS"
  | "FAILED"
  | "REAUTHENTICATION_REQUIRED"
  | "SCHEMA_DRIFT"
  | "SOURCE_COUNT_MISMATCH"
  | "NOT_CONFIGURED"
  | "SKIPPED_SAME_DAY";

export type LigaProviderOutcome = {
  providerId: LigaProviderId;
  status: LigaProviderRunStatus;
  startedAt: string;
  completedAt: string;
  snapshotRunId: string | null;
  promotionStatus: "SUCCESS" | "FAILED" | "NOT_APPLICABLE";
  message: string;
};

export type RegionalAcquisitionStatus = {
  featureId: "PHR-API-013";
  runId: string;
  status: "RUNNING" | "COMPLETE" | "PARTIAL_FAILURE";
  localDate: string;
  startedAt: string;
  completedAt: string | null;
  providers: Partial<Record<LigaProviderId, LigaProviderOutcome>>;
};

type LockReceipt = {
  featureId: "PHR-API-013";
  pid: number;
  runId: string;
  startedAt: string;
};

export function sanitizeAcquisitionMessage(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value);
  return message.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 800);
}

export function classifyAcquisitionFailure(
  message: string,
): Extract<
  LigaProviderRunStatus,
  "FAILED" | "REAUTHENTICATION_REQUIRED" | "SCHEMA_DRIFT" | "SOURCE_COUNT_MISMATCH"
> {
  if (/REAUTHENTICATION_REQUIRED/i.test(message)) return "REAUTHENTICATION_REQUIRED";
  if (/schema drift/i.test(message)) return "SCHEMA_DRIFT";
  if (/advertised \d+ cards but exported quantity \d+/i.test(message)) {
    return "SOURCE_COUNT_MISMATCH";
  }
  return "FAILED";
}

export function newYorkDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function providerCompletedToday(
  status: RegionalAcquisitionStatus | null,
  providerId: LigaProviderId,
  now: Date,
): boolean {
  const outcome = status?.providers[providerId];
  return (
    status?.localDate === newYorkDateKey(now) &&
    outcome?.status === "SUCCESS" &&
    outcome.promotionStatus !== "FAILED"
  );
}

export function readRegionalAcquisitionStatus(
  statusPath: string,
): RegionalAcquisitionStatus | null {
  try {
    const value = JSON.parse(readFileSync(statusPath, "utf8")) as RegionalAcquisitionStatus;
    if (value?.featureId !== "PHR-API-013") return null;
    for (const outcome of Object.values(value.providers ?? {})) {
      if (outcome?.status === "FAILED") {
        outcome.status = classifyAcquisitionFailure(outcome.message);
      }
    }
    return value;
  } catch {
    return null;
  }
}

export function writeRegionalAcquisitionStatus(
  statusPath: string,
  value: RegionalAcquisitionStatus,
): void {
  const temporary = `${statusPath}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  renameSync(temporary, statusPath);
}

function processIsRunning(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EPERM"
    );
  }
}

export function ensurePrivateAcquisitionDirectory(root: string): void {
  mkdirSync(root, { recursive: true, mode: 0o700 });
  if (lstatSync(root).isSymbolicLink()) {
    throw new Error("Regional acquisition root must not be a symlink.");
  }
  chmodSync(root, 0o700);
}

export function acquireRegionalAcquisitionLock(input: {
  root: string;
  runId: string;
  now: Date;
  pid?: number;
}): { lockPath: string; release: () => void } {
  ensurePrivateAcquisitionDirectory(input.root);
  const lockPath = join(input.root, "acquisition.lock");
  const receipt: LockReceipt = {
    featureId: "PHR-API-013",
    pid: input.pid ?? process.pid,
    runId: input.runId,
    startedAt: input.now.toISOString(),
  };

  if (existsSync(lockPath)) {
    let current: Partial<LockReceipt> = {};
    try {
      current = JSON.parse(readFileSync(lockPath, "utf8")) as Partial<LockReceipt>;
    } catch {
      // An unreadable lock is retained as evidence and treated as occupied.
    }
    if (typeof current.pid !== "number" || processIsRunning(current.pid)) {
      throw new Error(
        `ALREADY_RUNNING: regional acquisition lock is owned by ${current.runId ?? "an unknown run"}.`,
      );
    }
    const stalePath = join(
      input.root,
      `stale-lock-${input.now.toISOString().replace(/[-:.]/g, "")}.json`,
    );
    renameSync(lockPath, stalePath);
  }

  let descriptor: number;
  try {
    descriptor = openSync(lockPath, "wx", 0o600);
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "EEXIST"
    ) {
      throw new Error("ALREADY_RUNNING: regional acquisition lock was acquired concurrently.");
    }
    throw error;
  }
  writeFileSync(descriptor, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  closeSync(descriptor);
  let released = false;
  return {
    lockPath,
    release: () => {
      if (released) return;
      released = true;
      try {
        unlinkSync(lockPath);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          (error as NodeJS.ErrnoException).code !== "ENOENT"
        ) {
          throw error;
        }
      }
    },
  };
}
