import "server-only";
import { getAuthDatabase, getAuthorizationRepository } from "@/lib/auth/server";
import { UserMarketSettingsRepository } from "@/lib/user-settings/UserMarketSettingsRepository";

let repository: UserMarketSettingsRepository | undefined;

export function getUserMarketSettingsRepository(): UserMarketSettingsRepository {
  getAuthorizationRepository();
  repository ??= new UserMarketSettingsRepository(getAuthDatabase());
  return repository;
}
