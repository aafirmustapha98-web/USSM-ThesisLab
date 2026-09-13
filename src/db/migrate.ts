import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL n'est pas défini.");
  const sql = postgres(url, { max: 1 });
  await migrate(drizzle(sql), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await sql.end();
  console.log("Base prête.");
}

main().catch((e) => { console.error(e); process.exit(1); });
