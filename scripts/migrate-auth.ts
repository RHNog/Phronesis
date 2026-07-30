import { getMigrations } from "better-auth/db/migration";
import {
  getAuthDatabase,
  createAuthServer,
  getAuthorizationRepository,
} from "@/lib/auth/server";
import { MarketEvidenceRepository } from "@/lib/market/MarketEvidenceRepository";
import { WatchlistRepository } from "@/lib/watchlist/WatchlistRepository";

const database = getAuthDatabase();
const repository = getAuthorizationRepository();
repository.migrate();
new WatchlistRepository(database).migrate();
new MarketEvidenceRepository(database).migrate();
const auth = createAuthServer(database, repository);
const migrations = await getMigrations(auth.options);
await migrations.runMigrations();
console.log(
  `Phronesis identity and watchlist database is current (${migrations.toBeCreated.length} identity tables created, ${migrations.toBeAdded.length} identity columns added).`,
);
