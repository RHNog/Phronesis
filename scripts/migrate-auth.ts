import { getMigrations } from "better-auth/db/migration";
import { getAuthDatabase, createAuthServer, getAuthorizationRepository } from "@/lib/auth/server";

const database = getAuthDatabase();
const repository = getAuthorizationRepository();
repository.migrate();
const auth = createAuthServer(database, repository);
const migrations = await getMigrations(auth.options);
await migrations.runMigrations();
console.log(`Phronesis identity database is current (${migrations.toBeCreated.length} tables created, ${migrations.toBeAdded.length} columns added).`);
