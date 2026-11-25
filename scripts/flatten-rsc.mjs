// Next 16 static export writes segment prefetch payloads as nested folders
// (shop/__next.shop/__PAGE__.txt) while the client requests flat names
// (shop/__next.shop.__PAGE__.txt). Static hosts like GitHub Pages can't rewrite,
// so copy each nested payload to its flat name. Safe to re-run.
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = process.argv[2] ?? "out";
let copied = 0;

function filesUnder(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? filesUnder(p) : [p];
  });
}

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith("__next.")) {
      for (const f of filesUnder(p)) {
        const flat = join(dir, relative(dir, f).split(sep).join("."));
        if (!existsSync(flat)) {
          copyFileSync(f, flat);
          copied++;
        }
      }
    } else if (name !== "_next") {
      walk(p);
    }
  }
}

walk(OUT);
console.log(`flatten-rsc: ${copied} segment payloads copied`);
