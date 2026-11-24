import { afterAll, beforeAll, vi } from "vitest";

/**
 * Shared setup for tests that run the real Better Auth instance: stubs the
 * four required auth settings, points the database at in-memory PGlite, and
 * applies the migrations. Call it at the top of a describe block, before any
 * beforeAll that imports @/lib/auth.
 */
export function useAuthTestDatabase({
  allowedEmail = "owner@example.com",
  baseURL = "http://localhost:3000",
}: { allowedEmail?: string; baseURL?: string } = {}) {
  beforeAll(async () => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("ALLOWED_EMAIL", allowedEmail);
    vi.stubEnv("DATABASE_URL", "memory");
    vi.stubEnv("BETTER_AUTH_URL", baseURL);

    const { runMigrations } = await import("@/db/migrate");
    await runMigrations();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });
}
