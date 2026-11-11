import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "node:fs";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Database connection strategy:
 *
 * - DATABASE_URL starts with postgres:// or postgresql:// -> connect to a
 *   Postgres server (production-shaped path, also usable in dev).
 * - otherwise -> PGlite, the local-first default. Data persists in the
 *   directory given by LOCAL_DB_PATH (default `.data/nexo`, gitignored).
 *   Set DATABASE_URL=memory for a throwaway in-memory database.
 *
 * PGlite is Postgres compiled to WASM, so the schema and SQL stay
 * Postgres-shaped either way.
 */

export type NexoDb =
  | PgliteDatabase<typeof schema>
  | ReturnType<typeof drizzlePostgres<typeof schema>>;

export type DbKind = "pglite" | "postgres";

type DbHandle = { db: NexoDb; kind: DbKind };

const globalForDb = globalThis as unknown as { nexoDbHandle?: DbHandle };

function isPostgresUrl(url: string | undefined): url is string {
  return Boolean(url && /^postgres(ql)?:\/\//.test(url));
}

function createDbHandle(): DbHandle {
  const url = process.env.DATABASE_URL;

  if (isPostgresUrl(url)) {
    const client = postgres(url, { max: 10 });
    return { db: drizzlePostgres(client, { schema }), kind: "postgres" };
  }

  const dataDir = process.env.LOCAL_DB_PATH ?? ".data/nexo";
  if (url !== "memory") {
    mkdirSync(dataDir, { recursive: true });
  }
  const pglite = url === "memory" ? new PGlite() : new PGlite({ dataDir });

  return { db: drizzle(pglite, { schema }), kind: "pglite" };
}

function getHandle(): DbHandle {
  if (!globalForDb.nexoDbHandle) {
    globalForDb.nexoDbHandle = createDbHandle();
  }
  return globalForDb.nexoDbHandle;
}

export function getDb(): NexoDb {
  return getHandle().db;
}

export function getDbKind(): DbKind {
  return getHandle().kind;
}
