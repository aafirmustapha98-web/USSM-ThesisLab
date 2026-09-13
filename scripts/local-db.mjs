/**
 * Postgres jetable pour le développement local — aucune installation requise.
 * PGlite est un vrai Postgres compilé en WebAssembly ; pglite-socket l'expose
 * sur un port en parlant le protocole Postgres, donc l'application utilise
 * exactement le même pilote qu'en production.
 */
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const dir = process.env.LOCAL_DB_DIR ?? "./.localdb";
const port = Number(process.env.LOCAL_DB_PORT ?? 54321);

const pg = await PGlite.create({ dataDir: dir });
const server = new PGLiteSocketServer({ db: pg, port, host: "127.0.0.1" });
await server.start();

console.log(`Postgres local prêt sur le port ${port} (données dans ${dir})`);
console.log(`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${port}/postgres`);

const stop = async () => { await server.stop(); await pg.close(); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
