import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  SETTINGS_PANEL_IDS,
  SETTINGS_PANELS,
  normalizeSettingsPanel,
} from "../lib/settings/panels.ts";

test("settings panel identities are centralized and unknown links fall back safely", () => {
  assert.deepEqual(SETTINGS_PANEL_IDS, [
    "overview",
    "business",
    "regional",
    "providers",
    "people",
    "temporary",
  ]);
  assert.equal(new Set(SETTINGS_PANELS.map((panel) => panel.id)).size, 6);
  assert.equal(normalizeSettingsPanel("people"), "people");
  assert.equal(normalizeSettingsPanel("missing"), "overview");
  assert.equal(normalizeSettingsPanel(["providers"]), "overview");
});

test("settings is a direct-linkable responsive control center without stacked panels", () => {
  const page = readFileSync(
    new URL("../app/settings/page.tsx", import.meta.url),
    "utf8",
  );
  const workspace = readFileSync(
    new URL(
      "../features/settings/components/SettingsControlCenter.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(page, /SettingsControlCenter/);
  assert.match(page, /normalizeSettingsPanel/);
  assert.match(page, /searchParams: Promise/);
  assert.match(page, /requiredModule="ADMINISTRATION"/);
  assert.match(workspace, /SETTINGS_PANELS\.map/);
  assert.match(workspace, /Settings section/);
  assert.match(workspace, /Settings sections/);
  assert.match(workspace, /window\.history\.pushState/);
  assert.match(workspace, /popstate/);
  assert.match(workspace, /hidden=\{activePanel !== "business"\}/);
  assert.match(workspace, /hidden=\{activePanel !== "temporary"\}/);
  assert.match(workspace, /BusinessProfilesSettings/);
  assert.match(workspace, /RegionalCostProfileSettings/);
  assert.match(workspace, /ProviderConnections/);
  assert.match(workspace, /AccessManagement/);
  assert.match(workspace, /EventAccessManagement/);
  assert.match(workspace, /min-h-14/);
  assert.match(workspace, /lg:grid-cols-\[17rem_minmax\(0,1fr\)\]/);
});
