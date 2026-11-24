/**
 * Required auth settings. The app refuses to start unless all four are set
 * and non-empty. See .env.example for where each value comes from.
 */

import { type Allowlist, parseAllowlist } from "./auth-allowlist";

export const REQUIRED_AUTH_ENV = [
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ALLOWED_EMAIL",
] as const;

export type AuthEnvName = (typeof REQUIRED_AUTH_ENV)[number];

export type AuthConfig = {
  secret: string;
  googleClientId: string;
  googleClientSecret: string;
  allowlist: Allowlist;
};

export class MissingAuthConfigError extends Error {
  constructor(setting: AuthEnvName) {
    super(
      `Missing required auth setting ${setting}. Set it in .env.local (see .env.example) and restart.`,
    );
    this.name = "MissingAuthConfigError";
  }
}

/**
 * Reads the required auth settings from `env`, throwing a
 * MissingAuthConfigError that names the first missing or blank setting.
 * Values are returned as written; only the blank check ignores whitespace.
 * ALLOWED_EMAIL also counts as missing when it lists no addresses.
 */
export function readAuthConfig(
  env: Record<string, string | undefined> = process.env,
): AuthConfig {
  const requireSetting = (name: AuthEnvName): string => {
    const value = env[name];
    if (!value?.trim()) {
      throw new MissingAuthConfigError(name);
    }
    return value;
  };

  const allowlist = parseAllowlist(requireSetting("ALLOWED_EMAIL"));
  if (allowlist.size === 0) {
    throw new MissingAuthConfigError("ALLOWED_EMAIL");
  }

  return {
    secret: requireSetting("BETTER_AUTH_SECRET"),
    googleClientId: requireSetting("GOOGLE_CLIENT_ID"),
    googleClientSecret: requireSetting("GOOGLE_CLIENT_SECRET"),
    allowlist,
  };
}
