export const PHRONESIS_MODULES = [
  "VENDOR_WORKSPACE",
  "EVENT_LEDGER",
  "EVENT_FLIP",
  "MARKET_WATCH",
  "INVENTORY",
  "PRICING_OPERATIONS",
  "INTELLIGENCE",
  "ARTWORK_REVIEW",
  "ADMINISTRATION",
] as const;

export type PhronesisModule = (typeof PHRONESIS_MODULES)[number];

export const MEMBERSHIP_ROLES = ["OWNER", "ADMIN", "OPERATOR", "VIEWER"] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MODULE_ACCESS_LEVELS = ["VIEW", "OPERATE", "ADMIN"] as const;
export type ModuleAccessLevel = (typeof MODULE_ACCESS_LEVELS)[number];

export type ModuleEntitlement = {
  module: PhronesisModule;
  access: ModuleAccessLevel;
};

export type AccountSummary = {
  name: string;
  email: string;
};

export type AuthorizationDecision = {
  allowed: boolean;
  reason:
    | "AUTHORIZED"
    | "AUTH_DISABLED"
    | "AUTH_NOT_CONFIGURED"
    | "UNAUTHENTICATED"
    | "NO_ACTIVE_MEMBERSHIP"
    | "MODULE_NOT_ASSIGNED"
    | "INSUFFICIENT_ACCESS";
  userId: string | null;
  workspaceId: string | null;
  membershipId: string | null;
  role: MembershipRole | null;
  module: PhronesisModule;
  requiredAccess: ModuleAccessLevel;
  assignedAccess: ModuleAccessLevel | null;
};

export const ALL_MODULE_ENTITLEMENTS: readonly ModuleEntitlement[] = PHRONESIS_MODULES.map(
  (module) => ({ module, access: "ADMIN" as const }),
);

export function defaultEntitlementsForRole(role: MembershipRole): readonly ModuleEntitlement[] {
  switch (role) {
    case "OWNER":
    case "ADMIN":
      return ALL_MODULE_ENTITLEMENTS;
    case "OPERATOR":
      return [
        { module: "VENDOR_WORKSPACE", access: "OPERATE" },
        { module: "EVENT_LEDGER", access: "OPERATE" },
        { module: "EVENT_FLIP", access: "OPERATE" },
        { module: "MARKET_WATCH", access: "OPERATE" },
        { module: "INVENTORY", access: "OPERATE" },
        { module: "PRICING_OPERATIONS", access: "VIEW" },
        { module: "INTELLIGENCE", access: "VIEW" },
      ];
    case "VIEWER":
      return [
        { module: "VENDOR_WORKSPACE", access: "VIEW" },
        { module: "EVENT_LEDGER", access: "VIEW" },
        { module: "EVENT_FLIP", access: "VIEW" },
        { module: "MARKET_WATCH", access: "VIEW" },
        { module: "INVENTORY", access: "VIEW" },
        { module: "INTELLIGENCE", access: "VIEW" },
      ];
  }
}

export function accessSatisfies(
  assigned: ModuleAccessLevel,
  required: ModuleAccessLevel,
): boolean {
  const rank: Record<ModuleAccessLevel, number> = { VIEW: 1, OPERATE: 2, ADMIN: 3 };
  return rank[assigned] >= rank[required];
}
