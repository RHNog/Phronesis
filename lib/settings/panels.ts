export const SETTINGS_PANEL_IDS = [
  "overview",
  "business",
  "regional",
  "providers",
  "people",
  "temporary",
] as const;

export type SettingsPanelId = (typeof SETTINGS_PANEL_IDS)[number];
export type SettingsPanelIcon = Exclude<SettingsPanelId, "overview"> | "overview";

export type SettingsPanelDefinition = {
  id: SettingsPanelId;
  title: string;
  shortTitle: string;
  description: string;
  category: "Control center" | "Business" | "Markets" | "Access";
  icon: SettingsPanelIcon;
};

export const SETTINGS_PANELS: readonly SettingsPanelDefinition[] = [
  {
    id: "overview",
    title: "Settings overview",
    shortTitle: "Overview",
    description: "Choose an administrative area and go directly to the work.",
    category: "Control center",
    icon: "overview",
  },
  {
    id: "business",
    title: "Business profiles",
    shortTitle: "Business profiles",
    description: "Costs, margins, and transaction assumptions used in recommendations.",
    category: "Business",
    icon: "business",
  },
  {
    id: "regional",
    title: "Regional economics",
    shortTitle: "Regional economics",
    description: "Official FX evidence, route costs, and cross-market decision targets.",
    category: "Markets",
    icon: "regional",
  },
  {
    id: "providers",
    title: "Provider connections",
    shortTitle: "Providers",
    description: "Provider health, activation requirements, and protected credentials.",
    category: "Markets",
    icon: "providers",
  },
  {
    id: "people",
    title: "People and module access",
    shortTitle: "People & access",
    description: "Approve trusted accounts and assign exact Phronesis modules.",
    category: "Access",
    icon: "people",
  },
  {
    id: "temporary",
    title: "Temporary worker access",
    shortTitle: "Temporary access",
    description: "Issue and revoke bounded task or event access for temporary workers.",
    category: "Access",
    icon: "temporary",
  },
] as const;

export function normalizeSettingsPanel(value: unknown): SettingsPanelId {
  return typeof value === "string" &&
    SETTINGS_PANEL_IDS.includes(value as SettingsPanelId)
    ? (value as SettingsPanelId)
    : "overview";
}
