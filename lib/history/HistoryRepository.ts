import type { EvaluationSnapshot } from "@/types/EvaluationSnapshot";

const storageKey = "Phronesis:EvaluationHistory";

function cloneSnapshot(snapshot: EvaluationSnapshot): EvaluationSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as EvaluationSnapshot;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) {
    return value;
  }

  Object.values(value as Record<string, unknown>).forEach((child) => {
    deepFreeze(child);
  });

  return Object.freeze(value);
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export class HistoryRepository {
  private snapshots: EvaluationSnapshot[] = [];

  all() {
    return this.readAll().map((snapshot) => deepFreeze(cloneSnapshot(snapshot)));
  }

  append(snapshot: EvaluationSnapshot) {
    const immutableSnapshot = deepFreeze(cloneSnapshot(snapshot));
    const snapshots = [...this.readAll(), immutableSnapshot];

    this.snapshots = snapshots.map(cloneSnapshot);
    this.persist();

    return immutableSnapshot;
  }

  clear() {
    this.snapshots = [];

    if (canUseLocalStorage()) {
      window.localStorage.removeItem(storageKey);
    }
  }

  private persist() {
    if (!canUseLocalStorage()) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(this.snapshots));
  }

  private readAll() {
    if (!canUseLocalStorage()) {
      return this.snapshots;
    }

    const stored = window.localStorage.getItem(storageKey);

    if (!stored) {
      return this.snapshots;
    }

    try {
      this.snapshots = JSON.parse(stored) as EvaluationSnapshot[];
    } catch {
      this.snapshots = [];
    }

    return this.snapshots;
  }
}

export const evaluationHistoryRepository = new HistoryRepository();
