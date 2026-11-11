import { customType, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Text-backed JSON column. Serialization happens here in application code so
 * the value round-trips identically on PGlite and Postgres (pg-core's text
 * column does not apply the `json` mode driver mapping), and the stored shape
 * stays a plain text column, portable to the future desktop SQLite path
 * (architecture.md section 6).
 */
const jsonText = customType<{ data: unknown; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver(value: unknown): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): unknown {
    return JSON.parse(value);
  },
});

/**
 * Foundation example table. nexo is a single-user, local-first workspace, so
 * a key/value settings store is the minimal neutral starting point. Feature
 * tables (notes, tasks, reading list, ...) are added in later slices.
 *
 * The column types stay within Drizzle's portable subset (text ids generated
 * in application code, JSON as text) so the same schema can serve PGlite,
 * Postgres, and the future desktop SQLite path.
 */
export const settings = pgTable("settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  value: jsonText("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
