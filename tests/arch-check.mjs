// Static architecture check — run with: node tests/arch-check.mjs
// Verifies that only LocalStorageAdapter.js is allowed to reference
// `localStorage` directly. Every other layer (Repository, Service, UI)
// must depend only on the StorageAdapter interface.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, "..", "src");

const ALLOWED_FILES = new Set([
  "LocalStorageAdapter.js", // Phase 1 concrete adapter - the only allowed exception
]);

function stripComments(code) {
  // Remove /* ... */ block comments and // line comments (good enough for
  // this codebase - no localStorage literal appears inside a string anywhere).
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

function walk(dir) {
  let files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files = files.concat(walk(full));
    else if (entry.endsWith(".js")) files.push(full);
  }
  return files;
}

function run() {
  const results = [];
  const files = walk(SRC);
  const offenders = [];

  for (const file of files) {
    const basename = file.split("/").pop();
    if (ALLOWED_FILES.has(basename)) continue;
    const content = stripComments(readFileSync(file, "utf-8"));
    if (/\blocalStorage\b/.test(content)) {
      offenders.push(file.replace(SRC, "src"));
    }
  }

  // ARCH-001: PlayerRepository depends only on the adapter interface (constructor injected),
  // not on any concrete storage API.
  const repoFile = files.find(f => f.endsWith("PlayerRepository.js"));
  const repoContent = stripComments(readFileSync(repoFile, "utf-8"));
  const arch001 = !/\blocalStorage\b/.test(repoContent) && /constructor\(adapter\)/.test(repoContent);
  results.push(["ARCH-001", "Repository separation", arch001]);

  // ARCH-002: PlayerService has zero references to localStorage/IndexedDB.
  const serviceFile = files.find(f => f.endsWith("PlayerService.js"));
  const serviceContent = stripComments(readFileSync(serviceFile, "utf-8"));
  const arch002 = !/\blocalStorage\b/.test(serviceContent) && !/indexedDB/i.test(serviceContent);
  results.push(["ARCH-002", "PlayerService independent from storage", arch002]);

  // ARCH-003: UI module (PlayersModule) has zero references to localStorage/IndexedDB.
  const uiFile = files.find(f => f.endsWith("PlayersModule.js"));
  const uiContent = stripComments(readFileSync(uiFile, "utf-8"));
  const arch003 = !/\blocalStorage\b/.test(uiContent) && !/indexedDB/i.test(uiContent);
  results.push(["ARCH-003", "UI independent from storage", arch003]);

  // Overall: no unexpected offenders anywhere in src/
  const noOffenders = offenders.length === 0;

  console.log("=== Architecture Static Check ===");
  for (const [id, label, pass] of results) {
    console.log(`${id}  ${label}: ${pass ? "PASS" : "FAIL"}`);
  }
  console.log(`Offending files (should be empty): ${offenders.length === 0 ? "(none)" : offenders.join(", ")}`);

  const allPass = results.every(r => r[2]) && noOffenders;
  console.log(`\nOverall: ${allPass ? "PASS" : "FAIL"}`);
  process.exit(allPass ? 0 : 1);
}

run();
