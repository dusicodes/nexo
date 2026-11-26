import { Client } from "pg";

/**
 * Runs one SQL statement against the running dev database and prints the rows:
 * `npm run dev:sql -- "select title, planned_day from tasks"`.
 *
 * It connects through pglite-server, which `npm run dev` starts as the sole
 * owner of .data/nexo, so it is safe while the dev server runs (opening
 * .data/nexo directly would corrupt it). For checking states the page cannot
 * create, such as Tasks planned for earlier days; development only.
 */
const DEV_DATABASE_URL = "postgresql://postgres:postgres@localhost:54329/postgres";

async function main() {
  const sql = process.argv.slice(2).join(" ").trim();
  if (sql === "") {
    console.error('Usage: npm run dev:sql -- "<one SQL statement>"');
    process.exit(2);
  }
  const client = new Client({ connectionString: DEV_DATABASE_URL });
  try {
    await client.connect();
  } catch {
    console.error("No dev database on localhost:54329. Start it with `npm run dev`.");
    process.exit(1);
  }
  try {
    const result = await client.query(sql);
    if (result.rows.length > 0) {
      console.table(result.rows);
    }
    console.log(`${result.command} ${result.rowCount ?? 0}`);
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
