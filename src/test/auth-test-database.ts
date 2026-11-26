import { beforeAll, vi } from "vitest";
import { useTestDatabase } from "./test-database";

/**
 * Shared setup for tests that run the real Better Auth instance: stubs the
 * four required auth settings and gives the test file an in-memory PGlite
 * database with the migrations applied (useTestDatabase). Call it at the top
 * of a describe block, before any beforeAll that imports @/lib/auth.
 */
export function useAuthTestDatabase({
  allowedEmail = "owner@example.com",
  baseURL = "http://localhost:3000",
}: { allowedEmail?: string; baseURL?: string } = {}) {
  beforeAll(() => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client-id");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv("ALLOWED_EMAIL", allowedEmail);
    vi.stubEnv("BETTER_AUTH_URL", baseURL);
  });

  useTestDatabase();
}
