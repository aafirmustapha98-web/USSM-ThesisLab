/** Démarre un Postgres jetable, applique les migrations, déroule le workflow. */
import { spawn } from "node:child_process";
import { rmSync } from "node:fs";
import net from "node:net";

const DIR = "./.smokedb";
const PORT = 54329;
const URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`;

rmSync(DIR, { recursive: true, force: true });

const server = spawn(process.execPath, ["scripts/local-db.mjs"], {
  env: { ...process.env, LOCAL_DB_DIR: DIR, LOCAL_DB_PORT: String(PORT) },
  stdio: ["ignore", "ignore", "inherit"],
});

const waitForPort = async () => {
  for (let i = 0; i < 60; i++) {
    const ok = await new Promise((res) => {
      const s = net.connect(PORT, "127.0.0.1");
      s.on("connect", () => { s.end(); res(true); });
      s.on("error", () => res(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("Postgres local n'a pas démarré");
};

const run = (args) =>
  new Promise((res, rej) => {
    const p = spawn("npx", args, { env: { ...process.env, DATABASE_URL: URL }, stdio: "inherit" });
    p.on("exit", (c) => (c === 0 ? res() : rej(new Error(`${args.join(" ")} → code ${c}`))));
  });

try {
  await waitForPort();
  await run(["tsx", "src/db/migrate.ts"]);
  await run(["tsx", "scripts/smoke-workflow.ts"]);
} finally {
  server.kill("SIGTERM");
  rmSync(DIR, { recursive: true, force: true });
}
