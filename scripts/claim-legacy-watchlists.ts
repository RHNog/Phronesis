import { getAuthDatabase, getAuthorizationRepository } from "@/lib/auth/server";
import { getWatchlistRepository } from "@/lib/watchlist/server";

const email = process.argv[2]?.trim().toLowerCase();
if (!email)
  throw new Error(
    "Usage: npm run watchlists:claim-legacy -- owner@example.com",
  );
const database = getAuthDatabase();
const user = database
  .prepare('SELECT id FROM "user" WHERE lower(email) = ? LIMIT 1')
  .get(email) as { id?: string } | undefined;
if (!user?.id)
  throw new Error("No provisioned Phronesis identity matches that email.");
const membership = getAuthorizationRepository().getMembershipProfile(user.id);
if (!membership || membership.status !== "ACTIVE")
  throw new Error("The target identity has no active Phronesis membership.");
const copied = getWatchlistRepository().claimLegacyEntries({
  ownerUserId: user.id,
  workspaceId: membership.workspaceId,
});
console.log(
  `Legacy Market Watch claim complete: ${copied} memberships copied; the rollback source was retained.`,
);
