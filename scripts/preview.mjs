// Dependency-free local storefront preview. Never serves secrets or server code.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = resolve(root, "pages-assets");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
};
const server = createServer(async (request, response) => {
  try {
    if (!["GET", "HEAD"].includes(request.method)) {
      response.writeHead(405);
      response.end();
      return;
    }
    const path = decodeURIComponent(
      new URL(request.url, "http://127.0.0.1").pathname,
    );
    const file =
      path === "/" || path === "/index.html"
        ? resolve(root, "index.html")
        : resolve(root, "." + path);
    if (
      file !== resolve(root, "index.html") &&
      file !== resolve(root, "account.html") &&
      !file.startsWith(assets + sep)
    ) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    const data = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : data);
  } catch {
    response.writeHead(404);
    response.end("Not found");
  }
});
server.on("error", () => {
  console.error(
    "Preview could not start. Check whether port 5173 is already in use.",
  );
  process.exit(1);
});
server.listen(5173, "127.0.0.1", () => {
  console.log(
    "HIGP storefront preview: http://127.0.0.1:5173\nKeep this window open. Press Ctrl+C to stop.\nOnline accounts require the separately hosted secure app.",
  );
  if (process.argv.includes("--open") && process.platform === "win32") {
    const child = spawn(
      "cmd.exe",
      ["/c", "start", "", "http://127.0.0.1:5173"],
      { stdio: "ignore" },
    );
    child.on("error", () =>
      console.log("Open the preview URL in your browser."),
    );
  }
});
