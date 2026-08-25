// Real browser end-to-end test — run with: node tests/e2e-players.spec.mjs
// Requires a local server already running at http://localhost:8080
// (this script does NOT start the server itself).

import { chromium } from "playwright";

const BASE_URL = "http://localhost:8080";
const results = [];

function record(id, label, pass, detail = "") {
  results.push({ id, label, pass });
  console.log(`${id}  ${label}: ${pass ? "PASS" : "FAIL"}${detail ? "  (" + detail + ")" : ""}`);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("pageerror", err => consoleErrors.push(err.message));

  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  // Phase 2 changed the default landing route to Dashboard (per spec) -
  // navigate to Players explicitly, same as a real user would via the nav bar.
  const playersNavBtn = await page.$('[data-nav="players"]');
  if (playersNavBtn) {
    await playersNavBtn.click();
  } else {
    await page.goto(BASE_URL + "#/players", { waitUntil: "networkidle" });
  }

  // Sanity: modules actually loaded (no CORS/module errors on first paint)
  await page.waitForSelector("#add-player-btn", { timeout: 5000 }).catch(() => {});
  const hasAddBtn = await page.$("#add-player-btn");
  record("BOOT-001", "App boots, ES modules load, Players screen renders", !!hasAddBtn);

  // ---------------- PLAYER-001: Add Player ----------------
  await page.click("#add-player-btn");
  await page.waitForSelector("#player-form");
  await page.fill('input[name="name"]', "محمد علي");
  await page.type('input[name="birthYear"]', "2012", { delay: 10 });
  await page.click('#player-form button[type="submit"]');
  await page.waitForTimeout(300);

  const toastText1 = await page.locator("#toast").textContent();
  const rowAfterAdd = await page.$('.player-row[data-player-id="1"]');
  const p1 = { savedToast: toastText1.includes("تمت إضافة اللاعب"), idGenerated: !!rowAfterAdd, appearsInList: !!rowAfterAdd };
  record("PLAYER-001", "Add Player", p1.savedToast && p1.idGenerated && p1.appearsInList,
    JSON.stringify(p1));

  // ---------------- Arabic-Indic digit regression check (lesson from v1) ----------------
  await page.click("#add-player-btn");
  await page.waitForSelector("#player-form");
  await page.fill('input[name="name"]', "لاعب بأرقام عربية");
  await page.type('input[name="birthYear"]', "٢٠١٠", { delay: 10 }); // Arabic-Indic digits
  await page.click('#player-form button[type="submit"]');
  await page.waitForTimeout(300);
  const row2 = await page.$('.player-row[data-player-id="2"]');
  record("PLAYER-001b", "Add Player with Arabic-Indic digits (regression)", !!row2);

  // ---------------- PLAYER-002: Edit Player ----------------
  await page.click('[data-edit-player="1"]');
  await page.waitForSelector("#player-form");
  await page.fill('input[name="belt"]', "أخضر");
  await page.click('#player-form button[type="submit"]');
  await page.waitForTimeout(300);
  const toastText2 = await page.locator("#toast").textContent();
  const row1Sub = await page.locator('.player-row[data-player-id="1"] .player-sub').textContent();
  const p2 = { savedToast: toastText2.includes("تم حفظ التعديلات") };
  record("PLAYER-002", "Edit Player", p2.savedToast, JSON.stringify(p2));

  // ---------------- PLAYER-003: Delete Player (soft) ----------------
  page.once("dialog", d => d.accept());
  await page.click('[data-delete-player="2"]');
  await page.waitForTimeout(300);
  const rowGoneFromActive = !(await page.$('.player-row[data-player-id="2"]'));
  record("PLAYER-003", "Delete Player (soft, hidden from active list)", rowGoneFromActive);

  // ---------------- ARCH-004: Player CRUD (composite, already exercised above) ----------------
  record("ARCH-004", "Player CRUD", p1.savedToast && p2.savedToast && rowGoneFromActive);

  // ---------------- ARCH-005 / PERSIST-001: reload persistence ----------------
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const survivedRow1 = await page.$('.player-row[data-player-id="1"]');
  const stillGoneRow2 = !(await page.$('.player-row[data-player-id="2"]'));
  record("ARCH-005", "Save/reload persistence", !!survivedRow1 && stillGoneRow2);

  // ---------------- Search sanity check ----------------
  await page.fill("#player-search", "محمد");
  await page.waitForTimeout(200);
  const searchResult = await page.$('.player-row[data-player-id="1"]');
  record("SEARCH-001", "Search by name", !!searchResult);

  console.log("\nConsole/page errors during test run:", consoleErrors.length === 0 ? "(none)" : consoleErrors.join(" | "));

  const allPass = results.every(r => r.pass) && consoleErrors.length === 0;
  console.log(`\nOverall E2E: ${allPass ? "PASS" : "FAIL"}`);

  await browser.close();
  process.exit(allPass ? 0 : 1);
}

main().catch(err => { console.error("E2E test crashed:", err); process.exit(1); });
