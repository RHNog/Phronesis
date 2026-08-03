import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  acquireRegionalAcquisitionLock,
  classifyAcquisitionFailure,
  newYorkDateKey,
  providerCompletedToday,
  sanitizeAcquisitionMessage,
  type RegionalAcquisitionStatus,
} from "../lib/providers/liga/RecurringAcquisition.ts";
import { resolveLigaQuantityAuthority } from "../lib/providers/liga/QuantityAuthority.ts";

test("regional acquisition schedule and provider commands are explicit", () => {
  const launchAgent = readFileSync(
    new URL("../ops/launchd/com.phronesis.regional-acquisition.plist", import.meta.url),
    "utf8",
  );
  const packageJson = readFileSync(new URL("../package.json", import.meta.url), "utf8");
  const exportScript = readFileSync(
    new URL("../scripts/ligamagic-export.ts", import.meta.url),
    "utf8",
  );
  assert.match(launchAgent, /<key>Hour<\/key>\s*<integer>3<\/integer>/);
  assert.match(launchAgent, /<key>Minute<\/key>\s*<integer>0<\/integer>/);
  assert.match(launchAgent, /sync-regional-marketplaces\.ts/);
  assert.match(packageJson, /ligapokemon:profile/);
  assert.match(packageJson, /ligapokemon:pilot/);
  assert.match(packageJson, /regional:acquisition:status/);
  assert.match(exportScript, /Google Chrome\.app\/Contents\/MacOS\/Google Chrome/);
  assert.match(exportScript, /remote-debugging-address=127\.0\.0\.1/);
  assert.doesNotMatch(exportScript, /spawn\(\s*"\/usr\/bin\/open"/);
  assert.match(exportScript, /connectOverCDP/);
  assert.match(exportScript, /activeCommand === "pilot"/);
  assert.match(exportScript, /launchPlainChrome\(config\)/);
  assert.match(exportScript, /discoverControlsAfterStartup/);
  assert.match(exportScript, /pageMatchesExportUrl/);
  assert.match(exportScript, /writePrivateJson\(configPath, \{\s*\.\.\.config,/);
  assert.doesNotMatch(exportScript, /launchPersistentContext/);
  assert.doesNotMatch(exportScript, /headless: false/);
  assert.doesNotMatch(exportScript, /headless: true/);
});

test("regional acquisition lock rejects overlap and preserves stale lock evidence", () => {
  const root = mkdtempSync(join(tmpdir(), "phronesis-regional-lock-"));
  const now = new Date("2026-08-03T12:00:00.000Z");
  try {
    const first = acquireRegionalAcquisitionLock({ root, runId: "first", now });
    assert.throws(
      () => acquireRegionalAcquisitionLock({ root, runId: "second", now }),
      /ALREADY_RUNNING/,
    );
    first.release();

    writeFileSync(
      join(root, "acquisition.lock"),
      JSON.stringify({ pid: 999_999_999, runId: "crashed" }),
      { mode: 0o600 },
    );
    const recovered = acquireRegionalAcquisitionLock({ root, runId: "recovered", now });
    assert.match(readFileSync(recovered.lockPath, "utf8"), /recovered/);
    assert.equal(
      readFileSync(join(root, "stale-lock-20260803T120000000Z.json"), "utf8").includes("crashed"),
      true,
    );
    recovered.release();
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("same-day completion and messages are deterministic and sanitized", () => {
  const now = new Date("2026-08-03T18:00:00.000Z");
  const status: RegionalAcquisitionStatus = {
    featureId: "PHR-API-013",
    runId: "regional-test",
    status: "COMPLETE",
    localDate: newYorkDateKey(now),
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    providers: {
      ligamagic: {
        providerId: "ligamagic",
        status: "SUCCESS",
        startedAt: now.toISOString(),
        completedAt: now.toISOString(),
        snapshotRunId: "dry-run-test",
        promotionStatus: "SUCCESS",
        message: "complete",
      },
    },
  };
  assert.equal(providerCompletedToday(status, "ligamagic", now), true);
  assert.equal(providerCompletedToday(status, "ligapokemon", now), false);
  assert.equal(sanitizeAcquisitionMessage("first\nsecond\tthird"), "first second third");
  assert.equal(
    classifyAcquisitionFailure("REAUTHENTICATION_REQUIRED: sign in"),
    "REAUTHENTICATION_REQUIRED",
  );
  assert.equal(classifyAcquisitionFailure("LigaPokemon CSV schema drift"), "SCHEMA_DRIFT");
  assert.equal(
    classifyAcquisitionFailure(
      "LigaPokemon Lote 10 advertised 9704 cards but exported quantity 9700 across 9700 rows.",
    ),
    "SOURCE_COUNT_MISMATCH",
  );
  assert.equal(classifyAcquisitionFailure("download timed out"), "FAILED");
});

test("LigaPokemon Lote 10 uses only the exact Product Owner export authority", () => {
  assert.deepEqual(
    resolveLigaQuantityAuthority({
      providerId: "ligapokemon",
      collectionLabel: "Lote 10 (9.704 cards)",
      sourceAdvertisedCards: 9_704,
    }),
    {
      sourceAdvertisedCards: 9_704,
      authoritativeCards: 9_700,
      quantityAuthority: "PRODUCT_OWNER_EXPORT",
    },
  );
  assert.equal(
    resolveLigaQuantityAuthority({
      providerId: "ligapokemon",
      collectionLabel: "Lote 10 (9.705 cards)",
      sourceAdvertisedCards: 9_705,
    }).quantityAuthority,
    "SOURCE_LABEL",
  );
  assert.equal(
    resolveLigaQuantityAuthority({
      providerId: "ligamagic",
      collectionLabel: "Lote 10 (9.704 cards)",
      sourceAdvertisedCards: 9_704,
    }).quantityAuthority,
    "SOURCE_LABEL",
  );
});
