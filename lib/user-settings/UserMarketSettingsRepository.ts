import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  MARKET_PROVIDER_IDS,
  MARKET_PROVIDERS,
  isMarketProviderId,
  type MarketProviderId,
} from "@/lib/market/providers";
import {
  validateRegionalCostProfile,
  type RegionalCostProfile,
} from "@/lib/regional/domain";
import {
  PERSONAL_COST_FIELDS,
  effectiveRegionalCostProfile,
  emptyPersonalCostOverrides,
  type PersonalCostField,
  type PersonalCostOverrides,
  type UserMarketSettings,
} from "@/lib/user-settings/domain";

type SqlRow = Record<string, string | number | null>;

const costColumns: Record<PersonalCostField, string> = {
  usToBrazilFixedBrl: "us_to_brazil_fixed_brl",
  usToBrazilPercent: "us_to_brazil_percent",
  usToBrazilMinAcquisitionUsd: "us_to_brazil_min_acquisition_usd",
  usToBrazilMaxAcquisitionUsd: "us_to_brazil_max_acquisition_usd",
  usToBrazilMinGrossProceedsBrl: "us_to_brazil_min_gross_proceeds_brl",
  usToBrazilMinGrossSpreadBrl: "us_to_brazil_min_gross_spread_brl",
  usToBrazilMinNetProfitBrl: "us_to_brazil_min_net_profit_brl",
  usToBrazilMinProfitMarginPercent:
    "us_to_brazil_min_profit_margin_percent",
  usToBrazilMinRoiPercent: "us_to_brazil_min_roi_percent",
  brazilToUsFixedUsd: "brazil_to_us_fixed_usd",
  brazilToUsPercent: "brazil_to_us_percent",
  brazilToUsMinAcquisitionBrl: "brazil_to_us_min_acquisition_brl",
  brazilToUsMaxAcquisitionBrl: "brazil_to_us_max_acquisition_brl",
  brazilToUsMinGrossProceedsUsd: "brazil_to_us_min_gross_proceeds_usd",
  brazilToUsMinGrossSpreadUsd: "brazil_to_us_min_gross_spread_usd",
  brazilToUsMinNetProfitUsd: "brazil_to_us_min_net_profit_usd",
  brazilToUsMinProfitMarginPercent:
    "brazil_to_us_min_profit_margin_percent",
  brazilToUsMinRoiPercent: "brazil_to_us_min_roi_percent",
  maxEvidenceAgeHours: "max_evidence_age_hours",
};

function assertActiveMembership(
  database: DatabaseSync,
  workspaceId: string,
  userId: string,
): void {
  const membership = database
    .prepare(
      `SELECT 1 FROM phronesis_membership
       WHERE workspace_id = ? AND user_id = ? AND status = 'ACTIVE'`,
    )
    .get(workspaceId, userId);
  if (!membership) throw new Error("An active permanent membership is required.");
}

function normalizeOverrides(
  input: Partial<Record<PersonalCostField, unknown>>,
): PersonalCostOverrides {
  const overrides = emptyPersonalCostOverrides();
  for (const field of PERSONAL_COST_FIELDS) {
    const value = input[field];
    if (value === undefined || value === null || value === "") {
      overrides[field] = null;
      continue;
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a non-negative number or null.`);
    }
    overrides[field] = value;
  }
  return overrides;
}

function normalizeProviderIds(values: readonly unknown[]): MarketProviderId[] {
  const providerIds = [...new Set(values)];
  if (!providerIds.length) throw new Error("Select at least one market provider.");
  if (!providerIds.every(isMarketProviderId)) {
    throw new Error("One or more market providers are unavailable.");
  }
  return MARKET_PROVIDER_IDS.filter((providerId) =>
    providerIds.includes(providerId),
  );
}

export class UserMarketSettingsRepository {
  constructor(readonly database: DatabaseSync) {
    this.migrate();
  }

  migrate(): void {
    const costDefinitions = PERSONAL_COST_FIELDS.map(
      (field) => `${costColumns[field]} REAL`,
    ).join(",\n        ");
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS phronesis_user_market_provider (
        workspace_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        enabled INTEGER NOT NULL CHECK(enabled IN (0, 1)),
        updated_at TEXT NOT NULL,
        PRIMARY KEY(workspace_id, user_id, provider_id),
        FOREIGN KEY(workspace_id, user_id)
          REFERENCES phronesis_membership(workspace_id, user_id)
          ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS phronesis_user_market_provider_user
        ON phronesis_user_market_provider(user_id, workspace_id);
      CREATE TABLE IF NOT EXISTS phronesis_user_cost_profile (
        workspace_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        ${costDefinitions},
        updated_at TEXT NOT NULL,
        PRIMARY KEY(workspace_id, user_id),
        FOREIGN KEY(workspace_id, user_id)
          REFERENCES phronesis_membership(workspace_id, user_id)
          ON DELETE CASCADE
      );
    `);
  }

  get(
    workspaceId: string,
    userId: string,
    workspaceProfile: RegionalCostProfile,
  ): UserMarketSettings {
    assertActiveMembership(this.database, workspaceId, userId);
    const providerRows = this.database
      .prepare(
        `SELECT provider_id, enabled, updated_at
         FROM phronesis_user_market_provider
         WHERE workspace_id = ? AND user_id = ?`,
      )
      .all(workspaceId, userId) as SqlRow[];
    const providerState = new Map(
      providerRows.map((row) => [String(row.provider_id), Boolean(row.enabled)]),
    );
    const providers = MARKET_PROVIDERS.map((provider) => ({
      id: provider.id,
      label: provider.label,
      description: provider.description,
      categoryIds: [...provider.categoryIds],
      enabled: providerState.get(provider.id) ?? true,
      included: true as const,
    }));
    const costRow = this.database
      .prepare(
        `SELECT * FROM phronesis_user_cost_profile
         WHERE workspace_id = ? AND user_id = ?`,
      )
      .get(workspaceId, userId) as SqlRow | undefined;
    const costOverrides = emptyPersonalCostOverrides();
    if (costRow) {
      for (const field of PERSONAL_COST_FIELDS) {
        const value = costRow[costColumns[field]];
        costOverrides[field] = value === null ? null : Number(value);
      }
    }
    const updatedAt = [
      ...providerRows.map((row) => String(row.updated_at)),
      costRow?.updated_at ? String(costRow.updated_at) : null,
    ]
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;
    return {
      providers,
      enabledProviderIds: providers
        .filter((provider) => provider.enabled)
        .map((provider) => provider.id),
      costOverrides,
      workspaceCostProfile: { ...workspaceProfile },
      effectiveCostProfile: effectiveRegionalCostProfile(
        workspaceProfile,
        costOverrides,
      ),
      updatedAt,
    };
  }

  update(input: {
    workspaceId: string;
    userId: string;
    enabledProviderIds: readonly unknown[];
    costOverrides: Partial<Record<PersonalCostField, unknown>>;
    workspaceProfile: RegionalCostProfile;
  }): UserMarketSettings {
    assertActiveMembership(this.database, input.workspaceId, input.userId);
    const providerIds = normalizeProviderIds(input.enabledProviderIds);
    const overrides = normalizeOverrides(input.costOverrides);
    validateRegionalCostProfile(
      effectiveRegionalCostProfile(input.workspaceProfile, overrides),
    );
    const now = new Date().toISOString();
    const columns = PERSONAL_COST_FIELDS.map((field) => costColumns[field]);
    const insertColumns = ["workspace_id", "user_id", ...columns, "updated_at"];
    const updateColumns = [...columns, "updated_at"];
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const saveProvider = this.database.prepare(
        `INSERT INTO phronesis_user_market_provider(
          workspace_id, user_id, provider_id, enabled, updated_at
        ) VALUES(?, ?, ?, ?, ?)
        ON CONFLICT(workspace_id, user_id, provider_id) DO UPDATE SET
          enabled = excluded.enabled,
          updated_at = excluded.updated_at`,
      );
      for (const providerId of MARKET_PROVIDER_IDS) {
        saveProvider.run(
          input.workspaceId,
          input.userId,
          providerId,
          providerIds.includes(providerId) ? 1 : 0,
          now,
        );
      }
      this.database
        .prepare(
          `INSERT INTO phronesis_user_cost_profile(${insertColumns.join(", ")})
           VALUES(${insertColumns.map(() => "?").join(", ")})
           ON CONFLICT(workspace_id, user_id) DO UPDATE SET
             ${updateColumns
               .map((column) => `${column} = excluded.${column}`)
               .join(", ")}`,
        )
        .run(
          input.workspaceId,
          input.userId,
          ...PERSONAL_COST_FIELDS.map((field) => overrides[field]),
          now,
        );
      this.database
        .prepare(
          `INSERT INTO phronesis_authorization_audit(
            id, workspace_id, actor_user_id, action, resource_type,
            resource_id, details_json, created_at
          ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          randomUUID(),
          input.workspaceId,
          input.userId,
          "USER_MARKET_SETTINGS_UPDATED",
          "USER_MARKET_SETTINGS",
          input.userId,
          JSON.stringify({
            enabledProviderIds: providerIds,
            overriddenCostFields: PERSONAL_COST_FIELDS.filter(
              (field) => overrides[field] !== null,
            ),
          }),
          now,
        );
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
    return this.get(
      input.workspaceId,
      input.userId,
      input.workspaceProfile,
    );
  }
}
