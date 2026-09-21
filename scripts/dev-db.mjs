// Development fallback only. CI and production use native PostgreSQL.
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { mkdir } from "node:fs/promises";
await mkdir(".local", { recursive: true });
const database = await PGlite.create(".local/postgres");
const server = new PGLiteSocketServer({
  db: database,
  host: "127.0.0.1",
  port: 54329,
});
await server.start();
console.log(
  "Development PostgreSQL socket ready on 127.0.0.1:54329 (no password, loopback only).",
);
async function close() {
  await server.stop();
  await database.close();
  process.exit(0);
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
