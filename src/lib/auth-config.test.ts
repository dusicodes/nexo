import { describe, expect, it } from "vitest";
import {
  MissingAuthConfigError,
  REQUIRED_AUTH_ENV,
  readAuthConfig,
} from "@/lib/auth-config";

const complete = {
  BETTER_AUTH_SECRET: "secret-value",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  ALLOWED_EMAIL: "owner@example.com",
};

describe("readAuthConfig", () => {
  it("returns the four settings when all are set", () => {
    expect(readAuthConfig(complete)).toEqual({
      secret: "secret-value",
      googleClientId: "client-id",
      googleClientSecret: "client-secret",
      allowedEmail: "owner@example.com",
    });
  });

  it.each(REQUIRED_AUTH_ENV)("throws naming %s when it is missing", (name) => {
    const env: Record<string, string | undefined> = { ...complete };
    delete env[name];

    expect(() => readAuthConfig(env)).toThrow(MissingAuthConfigError);
    expect(() => readAuthConfig(env)).toThrow(name);
  });

  it.each(REQUIRED_AUTH_ENV)("throws naming %s when it is empty", (name) => {
    const env = { ...complete, [name]: "" };

    expect(() => readAuthConfig(env)).toThrow(MissingAuthConfigError);
    expect(() => readAuthConfig(env)).toThrow(name);
  });

  it.each(REQUIRED_AUTH_ENV)(
    "throws naming %s when it is only whitespace",
    (name) => {
      const env = { ...complete, [name]: "   " };

      expect(() => readAuthConfig(env)).toThrow(name);
    },
  );
});
