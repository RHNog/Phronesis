import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hasCaseSourcePreparationAccess } from "../lib/auth/caseSourceAccess.ts";
import { getCaseSourceSheetUrl } from "../lib/events/caseSourceConfig.ts";

const sheetUrl =
  "https://docs.google.com/spreadsheets/d/1yqGJMvyL_zzMuDQPOdnLi0UUuyIF1-B3-9iwpkEUv50/edit";

test("Case Source configuration accepts only a private native Google Sheet URL", () => {
  assert.equal(
    getCaseSourceSheetUrl({ PHRONESIS_CASE_SOURCE_SHEET_URL: sheetUrl }),
    sheetUrl,
  );
  assert.equal(
    getCaseSourceSheetUrl({
      NEXT_PUBLIC_EVENT_INVENTORY_TEMPLATE_URL: sheetUrl,
    }),
    sheetUrl,
  );
  assert.equal(
    getCaseSourceSheetUrl({
      PHRONESIS_CASE_SOURCE_SHEET_URL:
        "https://docs.google.com/document/d/not-a-sheet/edit",
      NEXT_PUBLIC_EVENT_INVENTORY_TEMPLATE_URL: sheetUrl,
    }),
    null,
  );
  assert.equal(
    getCaseSourceSheetUrl({
      PHRONESIS_CASE_SOURCE_SHEET_URL:
        "https://docs.google.com.evil.example/spreadsheets/d/id/edit",
    }),
    null,
  );
  assert.equal(
    getCaseSourceSheetUrl({
      PHRONESIS_CASE_SOURCE_SHEET_URL:
        "http://docs.google.com/spreadsheets/d/id/edit",
    }),
    null,
  );
});

test("Case Source preparation eligibility requires active Inventory Operate", () => {
  assert.equal(
    hasCaseSourcePreparationAccess({
      status: "ACTIVE",
      entitlements: [{ module: "INVENTORY", access: "OPERATE" }],
    }),
    true,
  );
  assert.equal(
    hasCaseSourcePreparationAccess({
      status: "ACTIVE",
      entitlements: [{ module: "INVENTORY", access: "ADMIN" }],
    }),
    true,
  );
  assert.equal(
    hasCaseSourcePreparationAccess({
      status: "ACTIVE",
      entitlements: [{ module: "INVENTORY", access: "VIEW" }],
    }),
    false,
  );
  assert.equal(
    hasCaseSourcePreparationAccess({
      status: "DISABLED",
      entitlements: [{ module: "INVENTORY", access: "ADMIN" }],
    }),
    false,
  );
  assert.equal(
    hasCaseSourcePreparationAccess({
      status: "ACTIVE",
      entitlements: [{ module: "VENDOR_WORKSPACE", access: "OPERATE" }],
    }),
    false,
  );
});

test("Case Source Sheet disclosure stays server-side and operator-gated", () => {
  const displayPage = readFileSync(
    new URL("../app/display-case/page.tsx", import.meta.url),
    "utf8",
  );
  const eventPage = readFileSync(
    new URL("../app/event-ledger/page.tsx", import.meta.url),
    "utf8",
  );
  const displayWorkspace = readFileSync(
    new URL("../features/events/DisplayCaseWorkspace.tsx", import.meta.url),
    "utf8",
  );
  const inventoryControl = readFileSync(
    new URL("../features/events/EventInventoryControl.tsx", import.meta.url),
    "utf8",
  );
  const access = readFileSync(
    new URL("../components/auth/AccessManagement.tsx", import.meta.url),
    "utf8",
  );
  const roster = readFileSync(
    new URL(
      "../components/auth/CaseSourceAccessManagement.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const exampleEnvironment = readFileSync(
    new URL("../.env.example", import.meta.url),
    "utf8",
  );

  assert.match(
    displayPage,
    /caseSourceSheetUrl=\{canOperate \? getCaseSourceSheetUrl\(\) : null\}/,
  );
  assert.match(
    eventPage,
    /authorizeHeaders\([\s\S]*"INVENTORY",[\s\S]*"OPERATE"/,
  );
  assert.ok(
    displayWorkspace.indexOf("<CaseSourcePreparation") <
      displayWorkspace.indexOf("!event ?"),
  );
  assert.match(
    inventoryControl,
    /canOperate && caseSourceSheetUrl/,
  );
  assert.doesNotMatch(
    inventoryControl,
    /process\.env|NEXT_PUBLIC_EVENT_INVENTORY_TEMPLATE_URL/,
  );
  assert.match(access, /Case preparation only/);
  assert.match(access, /module === "INVENTORY" \? "OPERATE" : "NONE"/);
  assert.match(roster, /hasCaseSourcePreparationAccess/);
  assert.match(roster, /add that exact account email/);
  assert.match(roster, /never makes the Sheet public/);
  assert.match(exampleEnvironment, /PHRONESIS_CASE_SOURCE_SHEET_URL=/);
  assert.doesNotMatch(
    exampleEnvironment,
    /^NEXT_PUBLIC_EVENT_INVENTORY_TEMPLATE_URL=/m,
  );
});
