import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "node:fs";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePostgres } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Database connection strategy (see resolveDbTarget):
 *
 * - DATABASE_URL starts with postgres:// or postgresql:// -> connect to a
 *   Postgres server. `npm run dev` sets this: pglite-server owns the local
 *   PGlite directory (.data/nexo) and serves it over the Postgres protocol.
 * - otherwise -> PGlite opened in this process. Data persists in the directory
 *   given by LOCAL_DB_PATH (default `.data/nexo`, gitignored), or in memory
 *   with DATABASE_URL=memory. Only for single-context processes: scripts such
 *   as `npm run db:migrate`, and tests.
 *
 * The Next.js server loads this module in several isolated contexts (the
 * proxy, route handlers, and a rendering worker thread) that share no memory,
 * so each would open its own PGlite on the same directory. Two writers corrupt
 * it (PGlite then fails every query with "Aborted()"), so in-process PGlite is
 * refused inside Next.js.
 *
 * PGlite is Postgres compiled to WASM, so the schema and SQL stay
 * Postgres-shaped either way.
 */

export type NexoDb =
  | PgliteDatabase<typeof schema>
  | ReturnType<typeof drizzlePostgres<typeof schema>>;

export type DbKind = "pglite" | "postgres";

type DbHandle = { db: NexoDb; kind: DbKind };

export type DbTarget =
  | { kind: "postgres"; url: string }
  | { kind: "pglite"; dataDir: string | null };

const globalForDb = globalThis as unknown as { nexoDbHandle?: DbHandle };

function isPostgresUrl(url: string | undefined): url is string {
  return Boolean(url && /^postgres(ql)?:\/\//.test(url));
}

/** Decides where the database lives for this process's environment. */
export function resolveDbTarget(
  env: Record<string, string | undefined> = process.env,
): DbTarget {
  const url = env.DATABASE_URL;
  if (isPostgresUrl(url)) {
    return { kind: "postgres", url };
  }
  if (env.NEXT_RUNTIME) {
    throw new Error(
      "The Next.js server cannot open PGlite in-process: its contexts would " +
        "each open the database and corrupt it. Start the app with `npm run dev`, " +
        "which serves .data/nexo through pglite-server, or set DATABASE_URL to a " +
        "postgres:// URL.",
    );
  }
  return {
    kind: "pglite",
    dataDir: url === "memory" ? null : (env.LOCAL_DB_PATH ?? ".data/nexo"),
  };
}

function createDbHandle(): DbHandle {
  const target = resolveDbTarget();

  if (target.kind === "postgres") {
    // pglite-server multiplexes every connection onto one PGlite and queues
    // protocol messages as they arrive. node-postgres sends each query as one
    // write, so queries cannot interleave; postgres.js splits parse and bind
    // across writes and fails under concurrency ("bind message supplies N
    // parameters"). Each Next.js context opens its own pool: keep pools small
    // so their total stays under --max-connections in package.json.
    const pool = new Pool({ connectionString: target.url, max: 2 });
    return { db: drizzlePostgres(pool, { schema }), kind: "postgres" };
  }

  if (target.dataDir !== null) {
    mkdirSync(target.dataDir, { recursive: true });
  }
  const pglite =
    target.dataDir === null ? new PGlite() : new PGlite({ dataDir: target.dataDir });

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
