/**
 * Required auth settings. The app refuses to start unless all four are set
 * and non-empty. See .env.example for where each value comes from.
 */

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
  allowedEmail: string;
};

export class MissingAuthConfigError extends Error {
  readonly setting: AuthEnvName;

  constructor(setting: AuthEnvName) {
    super(
      `Missing required auth setting ${setting}. Set it in .env.local (see .env.example) and restart.`,
    );
    this.name = "MissingAuthConfigError";
    this.setting = setting;
  }
}

/**
 * Reads the required auth settings from `env`, throwing a
 * MissingAuthConfigError that names the first missing or empty setting.
 */
export function readAuthConfig(
  env: Record<string, string | undefined> = process.env,
): AuthConfig {
  const requireSetting = (name: AuthEnvName): string => {
    const raw = env[name]?.trim();
    if (!raw) {
      throw new MissingAuthConfigError(name);
    }
    return raw;
  };

  return {
    secret: requireSetting("BETTER_AUTH_SECRET"),
    googleClientId: requireSetting("GOOGLE_CLIENT_ID"),
    googleClientSecret: requireSetting("GOOGLE_CLIENT_SECRET"),
    allowedEmail: requireSetting("ALLOWED_EMAIL"),
  };
}
