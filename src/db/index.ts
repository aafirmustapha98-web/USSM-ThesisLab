import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as { __ussmDb?: Db };

/**
 * `prepare: false` is required behind a transaction-mode pooler (Neon's pooled
 * endpoint, pgbouncer). `max: 1` keeps a serverless instance from opening one
 * connection per request.
 */
function create(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL n'est pas défini.\n" +
        "  • En ligne : colle la chaîne de connexion Neon dans les variables d'environnement.\n" +
        "  • En local : lance `npm run db:local`, puis reporte l'URL affichée dans .env.local.",
    );
  }
  const sql = postgres(url, { prepare: false, max: 1, idle_timeout: 20 });
  return drizzle(sql, { schema });
}

function resolve(): Db {
  if (!globalForDb.__ussmDb) globalForDb.__ussmDb = create();
  return globalForDb.__ussmDb;
}

/**
 * Connexion paresseuse : rien ne s'ouvre à l'import. Le build de Next évalue
 * les modules sans variables d'environnement, et une position ouverte ne doit
 * pas dépendre de l'ordre d'import.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const instance = resolve() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export * from "./schema";
