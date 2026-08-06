import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { betterAuth } from "better-auth";
import { AuthorizationRepository } from "@/lib/auth/AuthorizationRepository";
import { EventAccessRepository } from "@/lib/auth/EventAccessRepository";
import { getAuthDatabasePath, getAuthRuntimeStatus, getRestrictedPublicOrigin } from "@/lib/auth/config";

let database: DatabaseSync | undefined;
let authorizationRepository: AuthorizationRepository | undefined;
let authServer: ReturnType<typeof createAuthServer> | undefined;
let eventAccessRepository: EventAccessRepository | undefined;

export function getAuthDatabase(): DatabaseSync {
  if (!database) {
    const databasePath = getAuthDatabasePath();
    mkdirSync(dirname(databasePath), { recursive: true });
    database = new DatabaseSync(databasePath);
    database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  }
  return database;
}

export function getAuthorizationRepository(): AuthorizationRepository {
  authorizationRepository ??= new AuthorizationRepository(getAuthDatabase());
  return authorizationRepository;
}

export function getEventAccessRepository(): EventAccessRepository {
  eventAccessRepository ??= new EventAccessRepository(getAuthDatabase());
  return eventAccessRepository;
}

export function createAuthServer(
  authDatabase = getAuthDatabase(),
  repository = getAuthorizationRepository(),
) {
  const status = getAuthRuntimeStatus();
  const github = status.githubConfigured
    ? {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
          scope: ["user:email"],
        },
      }
    : {};

  return betterAuth({
    appName: "Phronesis",
    database: authDatabase,
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: [getRestrictedPublicOrigin()].filter((origin): origin is string => Boolean(origin)),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      autoSignIn: true,
      requireEmailVerification: false,
    },
    account: {
      accountLinking: {
        disableImplicitLinking: true,
      },
    },
    socialProviders: github,
    rateLimit: { enabled: true },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (repository.findPendingInvitation(user.email)) {
              repository.provisionInvitedUser(user.email, user.id);
              return;
            }
            repository.requestAccess({ userId: user.id, email: user.email, name: user.name });
          },
        },
      },
    },
  });
}

export function getAuthServer(): ReturnType<typeof createAuthServer> {
  authServer ??= createAuthServer();
  return authServer;
}
