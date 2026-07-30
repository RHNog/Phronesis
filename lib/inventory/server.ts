import "server-only";

import { getAuthDatabase } from "@/lib/auth/server";
import { InventoryRepository } from "@/lib/inventory/InventoryRepository";

let repository: InventoryRepository | undefined;

export function getInventoryRepository() {
  repository ??= new InventoryRepository(getAuthDatabase());
  return repository;
}
