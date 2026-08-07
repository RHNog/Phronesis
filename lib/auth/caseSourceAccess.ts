import {
  accessSatisfies,
  type ModuleEntitlement,
} from "@/lib/auth/domain";

export type CaseSourceMember = {
  status: "ACTIVE" | "DISABLED";
  entitlements: readonly ModuleEntitlement[];
};

export function hasCaseSourcePreparationAccess(
  member: CaseSourceMember,
): boolean {
  const inventory = member.entitlements.find(
    (entitlement) => entitlement.module === "INVENTORY",
  );
  return Boolean(
    member.status === "ACTIVE" &&
      inventory &&
      accessSatisfies(inventory.access, "OPERATE"),
  );
}
