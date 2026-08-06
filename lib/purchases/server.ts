import { getAuthDatabase } from "@/lib/auth/server";
import { PurchaseLedgerRepository } from "@/lib/purchases/PurchaseLedgerRepository";

let repository: PurchaseLedgerRepository | undefined;
export function getPurchaseLedgerRepository() {
  repository ??= new PurchaseLedgerRepository(getAuthDatabase());
  return repository;
}
