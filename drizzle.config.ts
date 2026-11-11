import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// drizzle-kit generate only needs the schema; DATABASE_URL is used by
// db:migrate / db:studio against a real Postgres server.
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://postgres:postgres@localhost:5432/nexo",
  },
});
