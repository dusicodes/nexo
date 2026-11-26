import { afterAll, beforeAll, vi } from "vitest";

/**
 * Points the database at in-memory PGlite and applies the real migrations.
 * Call it at the top of a describe block, before any beforeAll that imports
 * code using the database. Each test file gets its own database, because
 * Vitest isolates modules per file.
 */
export function useTestDatabase() {
  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", "memory");

    const { runMigrations } = await import("@/db/migrate");
    await runMigrations();
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });
}
