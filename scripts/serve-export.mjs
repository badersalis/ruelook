// Serve ./out under a base path (default /ruelook), mirroring GitHub Pages, for local e2e.
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";

const ROOT = join(process.cwd(), "out");
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "/ruelook";
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".txt": "text/plain; charset=utf-8", ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json", ".ico": "image/x-icon" };

createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  if (!url.pathname.startsWith(BASE)) { res.writeHead(404).end(); return; }
  let p = normalize(join(ROOT, decodeURIComponent(url.pathname.slice(BASE.length))));
  if (!p.startsWith(ROOT)) { res.writeHead(403).end(); return; }
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!existsSync(p)) { res.writeHead(404, { "content-type": TYPES[".html"] }); createReadStream(join(ROOT, "404.html")).pipe(res); return; }
  res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" });
  createReadStream(p).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log(`serving out/ at http://127.0.0.1:${PORT}${BASE}/`));
