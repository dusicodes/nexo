import { describe, expect, it } from "vitest";
import { resolveDbTarget } from "@/db/client";

describe("resolveDbTarget", () => {
  it("connects to Postgres when DATABASE_URL is a postgres URL", () => {
    expect(resolveDbTarget({ DATABASE_URL: "postgres://u@127.0.0.1:54329/postgres" })).toEqual({
      kind: "postgres",
      url: "postgres://u@127.0.0.1:54329/postgres",
    });
  });

  it("uses a Postgres URL even inside the Next.js server", () => {
    expect(
      resolveDbTarget({ NEXT_RUNTIME: "nodejs", DATABASE_URL: "postgresql://h/db" }).kind,
    ).toBe("postgres");
  });

  it("opens file-backed PGlite outside Next.js (scripts)", () => {
    expect(resolveDbTarget({})).toEqual({ kind: "pglite", dataDir: ".data/nexo" });
    expect(resolveDbTarget({ LOCAL_DB_PATH: "/tmp/x" })).toEqual({
      kind: "pglite",
      dataDir: "/tmp/x",
    });
  });

  it("opens in-memory PGlite for DATABASE_URL=memory (tests)", () => {
    expect(resolveDbTarget({ DATABASE_URL: "memory" })).toEqual({
      kind: "pglite",
      dataDir: null,
    });
  });

  // Regression: each Next.js context opened its own PGlite on .data/nexo, and
  // the competing writers corrupted it ("Failed to get session" / Aborted()).
  it.each([{}, { DATABASE_URL: "" }, { DATABASE_URL: "memory" }])(
    "refuses in-process PGlite inside the Next.js server (%j)",
    (env) => {
      expect(() => resolveDbTarget({ NEXT_RUNTIME: "nodejs", ...env })).toThrow(
        /npm run dev/,
      );
    },
  );
});
