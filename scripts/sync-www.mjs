// scripts/sync-www.mjs — copies src/, styles/, index.html into www/,
// which is what Capacitor packages into the Android app (webDir: "www"
// in capacitor.config.json). Keeps the two copies from silently drifting
// apart. Run this before `npx cap sync android` whenever src/ changes.
import { cpSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function resync(relPath) {
  const src = join(root, relPath);
  const dest = join(root, "www", relPath);
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  if (!existsSync(dirname(dest))) mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest, { recursive: true });
  console.log(`synced ${relPath} -> www/${relPath}`);
}

resync("src");
resync("styles");
resync("index.html");
console.log("www/ is now in sync with source.");
