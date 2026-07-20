#!/usr/bin/env node
/**
 * Fails CI when banned copy appears in active product paths.
 * Banned: case-insensitive "quiet", and U+2014 em dash.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const ROOTS = ["app", "components", "lib", "hooks", "public", "tests", "e2e", "prompt.md"];
const EXTS = new Set([".ts", ".tsx", ".js", ".mjs", ".css", ".md", ".json", ".html", ".svg"]);

function walk(entry, out = []) {
  const full = join(ROOT, entry);
  let st;
  try {
    st = statSync(full);
  } catch {
    return out;
  }
  if (st.isFile()) {
    out.push(full);
    return out;
  }
  if (!st.isDirectory()) return out;
  for (const name of readdirSync(full)) {
    if (name === "node_modules" || name === ".git") continue;
    walk(join(entry, name), out);
  }
  return out;
}

const files = [];
for (const r of ROOTS) walk(r, files);

const quiet = [];
const em = [];
for (const file of files) {
  const ext = extname(file);
  if (ext && !EXTS.has(ext) && !file.endsWith("sw.js")) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const rel = file.slice(ROOT.length + 1);
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (/\bquiet\b/i.test(line)) quiet.push(`${rel}:${i + 1}:${line.trim().slice(0, 120)}`);
    if (line.includes("\u2014")) em.push(`${rel}:${i + 1}:${line.trim().slice(0, 120)}`);
  });
}

const sw = readFileSync(join(ROOT, "public/sw.js"), "utf8");
const installMatch = sw.match(
  /addEventListener\(\s*["']install["']\s*,\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\}\)/,
);
const installBody = installMatch?.[1] ?? "";
const installCallsSkip = /skipWaiting\s*\(/.test(installBody);

let failed = false;
if (quiet.length) {
  console.error("Banned word 'quiet' found:\n" + quiet.join("\n"));
  failed = true;
}
if (em.length) {
  console.error("Banned em dash (U+2014) found:\n" + em.join("\n"));
  failed = true;
}
if (installCallsSkip) {
  console.error("Service worker install handler must not call skipWaiting().");
  failed = true;
}

if (failed) process.exit(1);
console.log("banned-copy scan: ok");
