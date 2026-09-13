import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data", "ussm.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis as unknown as { __ussmDb?: ReturnType<typeof drizzle> };

function create() {
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

export const db = globalForDb.__ussmDb ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.__ussmDb = db;

export * from "./schema";
