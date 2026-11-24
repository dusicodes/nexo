import { runWithEndpointContext } from "@better-auth/core/context";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Runs the real Better Auth instance against an in-memory PGlite database.
 * createUser is the provisioning path a Google sign-in takes for a new
 * account, so this exercises user.validateUserInfo before any row is written.
 */

const ALLOWLIST = " Owner@Example.com , second@example.com ";
const NOT_AUTHORIZED = "This Google account is not authorized to sign in.";

type Auth = typeof import("@/lib/auth").auth;
type Db = ReturnType<typeof import("@/db/client").getDb>;

describe("sign-in allowlist against a real database", () => {
  let auth: Auth;
  let db: Db;
  let tables: typeof import("@/db/schema/auth");

  beforeAll(async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "integration-test-secret");
    vi.stubEnv("GOOGLE_CLIENT_ID", "integration-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "integration-client-secret");
    vi.stubEnv("ALLOWED_EMAIL", ALLOWLIST);
    vi.stubEnv("DATABASE_URL", "memory");
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3000");

    const { runMigrations } = await import("@/db/migrate");
    await runMigrations();

    const client = await import("@/db/client");
    db = client.getDb();
    tables = await import("@/db/schema/auth");
    ({ auth } = await import("@/lib/auth"));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  const provisionGoogleUser = async (email: string) => {
    const ctx = await auth.$context;
    return runWithEndpointContext(
      { context: ctx } as unknown as Parameters<typeof runWithEndpointContext>[0],
      () =>
        ctx.internalAdapter.createUser(
          { email, name: "Test User", emailVerified: true },
          { method: "oauth", oauth: { providerId: "google" } },
        ),
    );
  };

  const rowCounts = async () => ({
    users: (await db.select().from(tables.user)).length,
    accounts: (await db.select().from(tables.account)).length,
    sessions: (await db.select().from(tables.session)).length,
  });

  it("creates a user row for an allowlisted email", async () => {
    const created = await provisionGoogleUser("owner@example.com");

    expect(created.email).toBe("owner@example.com");
    expect((await rowCounts()).users).toBe(1);
  });

  it("creates a user row for a later address in a comma-separated list", async () => {
    const created = await provisionGoogleUser("SECOND@example.com");

    expect(created.email).toBe("second@example.com");
    expect((await rowCounts()).users).toBe(2);
  });

  it("rejects an email that is not on the allowlist and writes no rows", async () => {
    const before = await rowCounts();

    await expect(provisionGoogleUser("intruder@example.com")).rejects.toThrow(
      NOT_AUTHORIZED,
    );

    expect(await rowCounts()).toEqual(before);
  });
});
