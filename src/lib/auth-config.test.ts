import { describe, expect, it } from "vitest";
import {
  MissingAuthConfigError,
  REQUIRED_AUTH_ENV,
  readAuthConfig,
} from "@/lib/auth-config";

const completeEnv = {
  BETTER_AUTH_SECRET: "secret-value",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  ALLOWED_EMAIL: "owner@example.com",
};

describe("readAuthConfig", () => {
  it("returns the four settings when all are set", () => {
    expect(readAuthConfig(completeEnv)).toEqual({
      secret: "secret-value",
      googleClientId: "client-id",
      googleClientSecret: "client-secret",
      allowlist: new Set(["owner@example.com"]),
    });
  });

  it.each(REQUIRED_AUTH_ENV)("throws naming %s when it is missing", (name) => {
    const env: Record<string, string | undefined> = { ...completeEnv };
    delete env[name];

    expect(() => readAuthConfig(env)).toThrow(MissingAuthConfigError);
    expect(() => readAuthConfig(env)).toThrow(name);
  });

  it.each(REQUIRED_AUTH_ENV)("throws naming %s when it is empty", (name) => {
    const env = { ...completeEnv, [name]: "" };

    expect(() => readAuthConfig(env)).toThrow(MissingAuthConfigError);
    expect(() => readAuthConfig(env)).toThrow(name);
  });

  it.each(REQUIRED_AUTH_ENV)(
    "throws naming %s when it is only whitespace",
    (name) => {
      const env = { ...completeEnv, [name]: "   " };

      expect(() => readAuthConfig(env)).toThrow(name);
    },
  );

  it("returns values as written, without trimming them", () => {
    const config = readAuthConfig({ ...completeEnv, BETTER_AUTH_SECRET: " s3cret " });

    expect(config.secret).toBe(" s3cret ");
  });

  it("throws naming ALLOWED_EMAIL when it lists no addresses", () => {
    const env = { ...completeEnv, ALLOWED_EMAIL: " , ," };

    expect(() => readAuthConfig(env)).toThrow(MissingAuthConfigError);
    expect(() => readAuthConfig(env)).toThrow("ALLOWED_EMAIL");
  });
});
