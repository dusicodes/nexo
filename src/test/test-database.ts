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

/**
 * Removes every Task, so a test starts from an empty Today. Open Tasks carry
 * over to later days (GLOSSARY.md, Carried-over Task), so tests that share a
 * database cannot stay apart by using different days. Test setup only: outside
 * tests, Tasks are read and written only through the Tasks module.
 */
export async function clearTasks() {
  const { getDb } = await import("@/db/client");
  const { tasks } = await import("@/db/schema");
  await getDb().delete(tasks);
}
