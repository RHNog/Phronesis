import assert from "node:assert/strict";
import test from "node:test";
import { AuthorizationRepository } from "../lib/auth/AuthorizationRepository.ts";
import { MARKET_PROVIDER_IDS } from "../lib/market/providers.ts";
import type { RegionalCostProfile } from "../lib/regional/domain.ts";
import { UserMarketSettingsRepository } from "../lib/user-settings/UserMarketSettingsRepository.ts";

const workspaceProfile: RegionalCostProfile = {
  brlPerUsd: 5.4,
  brlPerUsdBuy: 5.35,
  brlPerUsdSell: 5.45,
  fxObservedAt: "2026-08-07T12:00:00.000Z",
  fxFetchedAt: "2026-08-07T12:05:00.000Z",
  fxLastAttemptAt: "2026-08-07T12:05:00.000Z",
  fxSource: "BCB PTAX",
  fxLastError: null,
  usToBrazilFixedBrl: 10,
  usToBrazilPercent: 15,
  usToBrazilMinAcquisitionUsd: null,
  usToBrazilMaxAcquisitionUsd: null,
  usToBrazilMinGrossProceedsBrl: null,
  usToBrazilMinGrossSpreadBrl: null,
  usToBrazilMinNetProfitBrl: 25,
  usToBrazilMinProfitMarginPercent: null,
  usToBrazilMinRoiPercent: null,
  brazilToUsFixedUsd: 4,
  brazilToUsPercent: 12,
  brazilToUsMinAcquisitionBrl: null,
  brazilToUsMaxAcquisitionBrl: null,
  brazilToUsMinGrossProceedsUsd: null,
  brazilToUsMinGrossSpreadUsd: null,
  brazilToUsMinNetProfitUsd: null,
  brazilToUsMinProfitMarginPercent: null,
  brazilToUsMinRoiPercent: null,
  maxEvidenceAgeHours: 168,
  updatedAt: "2026-08-07T12:05:00.000Z",
};

test("active members receive all providers by default and private cost overlays", () => {
  const authorization = new AuthorizationRepository();
  authorization.createInvitation({ email: "owner@example.com", role: "OWNER" });
  authorization.provisionInvitedUser("owner@example.com", "owner");
  authorization.createInvitation({
    actorUserId: "owner",
    email: "buyer@example.com",
    role: "OPERATOR",
  });
  const buyer = authorization.provisionInvitedUser(
    "buyer@example.com",
    "buyer",
  );
  const profile = authorization.getMembershipProfile("buyer");
  assert.ok(profile);
  const settings = new UserMarketSettingsRepository(authorization.database);

  const defaults = settings.get(profile.workspaceId, "buyer", workspaceProfile);
  assert.deepEqual(defaults.enabledProviderIds, MARKET_PROVIDER_IDS);
  assert.deepEqual(
    defaults.providers.find((provider) => provider.id === "ligapokemon")
      ?.categoryIds,
    ["pokemon-en"],
  );
  assert.deepEqual(defaults.workspaceCostProfile, workspaceProfile);
  assert.equal(defaults.effectiveCostProfile.usToBrazilFixedBrl, 10);

  const updated = settings.update({
    workspaceId: profile.workspaceId,
    userId: "buyer",
    enabledProviderIds: ["tcgplayer", "ligapokemon"],
    costOverrides: {
      usToBrazilFixedBrl: 0,
      usToBrazilPercent: 8.5,
      brazilToUsFixedUsd: 7,
    },
    workspaceProfile,
  });
  assert.deepEqual(updated.enabledProviderIds, ["tcgplayer", "ligapokemon"]);
  assert.equal(updated.costOverrides.usToBrazilFixedBrl, 0);
  assert.equal(updated.effectiveCostProfile.usToBrazilFixedBrl, 0);
  assert.equal(updated.effectiveCostProfile.usToBrazilPercent, 8.5);
  assert.equal(updated.effectiveCostProfile.usToBrazilMinNetProfitBrl, 25);
  assert.equal(updated.effectiveCostProfile.brlPerUsdSell, 5.45);
  assert.equal(
    authorization.database
      .prepare(
        `SELECT COUNT(*) count FROM phronesis_authorization_audit
         WHERE action='USER_MARKET_SETTINGS_UPDATED' AND actor_user_id='buyer'`,
      )
      .get()?.count,
    1,
  );
  assert.throws(
    () =>
      settings.update({
        workspaceId: profile.workspaceId,
        userId: "buyer",
        enabledProviderIds: [],
        costOverrides: {},
        workspaceProfile,
      }),
    /at least one market provider/i,
  );
  assert.throws(
    () =>
      settings.update({
        workspaceId: profile.workspaceId,
        userId: "buyer",
        enabledProviderIds: ["tcgplayer"],
        costOverrides: {
          usToBrazilMinAcquisitionUsd: 100,
          usToBrazilMaxAcquisitionUsd: 50,
        },
        workspaceProfile,
      }),
    /minimum cannot exceed/i,
  );
  assert.throws(
    () =>
      settings.update({
        workspaceId: profile.workspaceId,
        userId: "buyer",
        enabledProviderIds: ["tcgplayer"],
        costOverrides: { maxEvidenceAgeHours: 0 },
        workspaceProfile,
      }),
    /positive number/i,
  );

  authorization.disableMembership("owner", buyer.id);
  assert.throws(
    () => settings.get(profile.workspaceId, "buyer", workspaceProfile),
    /active permanent membership/i,
  );
  authorization.close();
});

test("personal settings surface remains distinct from Administration", async () => {
  const topbar = await import("node:fs").then(({ readFileSync }) =>
    readFileSync(new URL("../components/ui/Topbar.tsx", import.meta.url), "utf8"),
  );
  const page = await import("node:fs").then(({ readFileSync }) =>
    readFileSync(new URL("../app/user-settings/page.tsx", import.meta.url), "utf8"),
  );
  const gateway = await import("node:fs").then(({ readFileSync }) =>
    readFileSync(
      new URL("../scripts/restricted-access-gateway.mjs", import.meta.url),
      "utf8",
    ),
  );
  const vendor = await import("node:fs").then(({ readFileSync }) =>
    readFileSync(
      new URL(
        "../features/vendor/components/SnapshotVendorWorkspace.tsx",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  assert.match(topbar, /href="\/user-settings"/);
  assert.match(topbar, /Administration settings/);
  assert.match(page, /requireActiveMemberPage/);
  assert.doesNotMatch(gateway, /"\/user-settings"/);
  assert.match(gateway, /"\/settings"/);
  assert.match(vendor, /showReference=\{tcgplayerEnabled\}/);
  assert.match(vendor, /showReference \? money\(reference\.cents\) : "Select"/);
});
