import { join } from "node:path";

export type AuthMode = "DISABLED" | "OPTIONAL" | "REQUIRED";

export type AuthRuntimeStatus = {
  mode: AuthMode;
  databasePath: string;
  baseUrlConfigured: boolean;
  secretConfigured: boolean;
  githubConfigured: boolean;
  readyForRequiredMode: boolean;
};

type AuthEnvironment = Readonly<Record<string, string | undefined>>;

export function getAuthMode(environment: AuthEnvironment = process.env): AuthMode {
  const value = environment.PHRONESIS_AUTH_MODE?.trim().toUpperCase();
  if (value === "OPTIONAL" || value === "REQUIRED") return value;
  return "DISABLED";
}

export function getAuthDatabasePath(environment: AuthEnvironment = process.env): string {
  return environment.PHRONESIS_AUTH_DB_PATH ?? join(process.cwd(), ".data", "phronesis-auth.sqlite");
}

export function getPublicEventAccessOrigin(environment: AuthEnvironment = process.env): string | null {
  const value = environment.PHRONESIS_PUBLIC_EVENT_ORIGIN?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || (url.pathname !== "/" && url.pathname !== "")) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getAuthRuntimeStatus(environment: AuthEnvironment = process.env): AuthRuntimeStatus {
  const baseUrlConfigured = Boolean(environment.BETTER_AUTH_URL?.trim());
  const secretConfigured = Boolean(environment.BETTER_AUTH_SECRET?.trim());
  const githubConfigured = Boolean(
    environment.GITHUB_CLIENT_ID?.trim() && environment.GITHUB_CLIENT_SECRET?.trim(),
  );
  return {
    mode: getAuthMode(environment),
    databasePath: getAuthDatabasePath(environment),
    baseUrlConfigured,
    secretConfigured,
    githubConfigured,
    readyForRequiredMode: baseUrlConfigured && secretConfigured && githubConfigured,
  };
}
