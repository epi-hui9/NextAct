#!/usr/bin/env node
/**
 * Fails CI when banned copy appears in active product paths.
 * Banned: case-insensitive "quiet", and U+2014 em dash.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const ROOTS = [
  "src",
  "public",
  "tests/integration",
  "tests/e2e",
  "docs/01-product",
  "docs/02-architecture",
];
const EXTS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".css",
  ".md",
  ".json",
  ".html",
  ".svg",
]);

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
    if (name === "node_modules" || name === ".git" || name === "99-archive") continue;
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
  if (/quiet/i.test(text)) quiet.push(file);
  if (text.includes("\u2014")) em.push(file);
}

if (quiet.length || em.length) {
  if (quiet.length) {
    console.error("Banned word 'quiet' found in:");
    for (const f of quiet) console.error(" -", f);
  }
  if (em.length) {
    console.error("Banned em dash (U+2014) found in:");
    for (const f of em) console.error(" -", f);
  }
  process.exit(1);
}
console.log(`banned-copy ok (${files.length} files scanned)`);
