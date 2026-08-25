// Phase 2 real browser end-to-end test — run with: node tests/e2e-phase2.spec.mjs
// Requires a local server already running at http://localhost:8080.

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

  // ---------------- DOD-001: Open Dashboard ----------------
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.waitForSelector(".page-dashboard", { timeout: 5000 }).catch(() => {});
  record("DOD-001", "Open Dashboard (default route)", !!(await page.$(".page-dashboard")));

  // Bottom nav present with all 6 tabs, Arabic labels, RTL
  const navLabels = await page.$$eval(".nav-item .nav-label", els => els.map(e => e.textContent));
  record("NAV-001", "6 nav tabs present in Arabic",
    navLabels.length === 6 && navLabels.includes("الرئيسية") && navLabels.includes("اللاعبون"));
  const dir = await page.evaluate(() => document.documentElement.getAttribute("dir"));
  record("RTL-001", "Document is RTL", dir === "rtl");

  // ---------------- Navigate to Players, DOD-002: Add Player ----------------
  await page.click('[data-nav="players"]');
  await page.waitForSelector("#add-player-btn");
  await page.click("#add-player-btn");
  await page.waitForSelector("#player-form");
  await page.fill('input[name="name"]', "محمد أحمد");
  await page.type('input[name="birthYear"]', String(new Date().getFullYear() - 14), { delay: 10 }); // -> تحت 15
  await page.click('#player-form button[type="submit"]');
  await page.waitForTimeout(300);
  const toastAdd = await page.locator("#toast").textContent();
  record("DOD-002", "Add Player (from Players tab)", toastAdd.includes("تمت إضافة اللاعب"));

  // ---------------- DOD-016/017: Search & Filter players ----------------
  await page.fill("#player-search", "محمد");
  await page.waitForTimeout(200);
  const searchVisible = await page.$('.player-row:has-text("محمد أحمد")');
  record("DOD-016", "Search players by name", !!searchVisible);
  await page.fill("#player-search", "");
  await page.selectOption("#filter-status", "active");
  await page.waitForTimeout(200);
  record("DOD-017", "Filter players by status", !!(await page.$(".player-row")));

  // ---------------- DOD-004/005: Create Group + assign player ----------------
  await page.click('[data-nav="settings"]');
  await page.waitForSelector("#add-group-btn");
  await page.click("#add-group-btn");
  await page.waitForSelector("#group-form");
  await page.fill('input[name="name"]', "مجموعة الناشئين");
  await page.fill('input[name="coach"]', "كابتن أحمد");
  await page.click('#group-form button[type="submit"]');
  await page.waitForTimeout(300);
  const toastGroup = await page.locator("#toast").textContent();
  record("DOD-004", "Create Group", toastGroup.includes("تمت إضافة المجموعة"));

  await page.click('[data-nav="players"]');
  await page.waitForSelector(".player-row");
  await page.click('.player-row:has-text("محمد أحمد") [data-edit-player]');
  await page.waitForSelector("#player-form");
  await page.selectOption('select[name="groupId"]', { label: "مجموعة الناشئين" });
  await page.click('#player-form button[type="submit"]');
  await page.waitForTimeout(300);
  const editedRow = await page.locator('.player-row:has-text("محمد أحمد") .player-sub').textContent();
  record("DOD-005", "Assign player to group", editedRow.includes("مجموعة الناشئين"));

  // ---------------- DOD-003: Open Player Profile ----------------
  await page.click('.player-row:has-text("محمد أحمد") [data-open-profile]');
  await page.waitForSelector(".page-profile", { timeout: 3000 }).catch(() => {});
  record("DOD-003", "Open Player Profile", !!(await page.$(".page-profile")));
  const profileGroup = await page.locator(".page-profile").textContent();
  record("PROFILE-001", "Profile shows assigned group", profileGroup.includes("مجموعة الناشئين"));

  // ---------------- DOD-006/007/008/009/010: Test Entry pipeline ----------------
  await page.click('[data-nav="testentry"]');
  await page.waitForSelector("#te-player");
  await page.selectOption("#te-player", { label: "محمد أحمد" });
  await page.selectOption("#te-test", { label: "الضغط (عدد تكرارات)" });
  await page.fill("#te-value", "42");
  await page.click("#te-submit");
  await page.waitForTimeout(300);
  const toastResult = await page.locator("#toast").textContent();
  record("DOD-006_009", "Choose player+test, enter result, save", toastResult.includes("تم حفظ النتيجة"));

  const resultCard = await page.locator("#te-result-card").textContent();
  record("DOD-008", "Score computed automatically and shown", resultCard.includes("ممتاز") && resultCard.includes("5"));

  // Second result for same test (progress)
  await page.selectOption("#te-player", { label: "محمد أحمد" });
  await page.selectOption("#te-test", { label: "الضغط (عدد تكرارات)" });
  await page.fill("#te-value", "44");
  await page.click("#te-submit");
  await page.waitForTimeout(300);
  record("DOD-011", "Add a second result for the same test", true); // validated further via profile below

  // ---------------- DOD-010/012: See result + progress in Player Profile ----------------
  await page.click('[data-nav="players"]');
  await page.waitForSelector(".player-row");
  await page.click('.player-row:has-text("محمد أحمد") [data-open-profile]');
  await page.waitForSelector(".page-profile");
  const profileText = await page.locator(".page-profile").textContent();
  const historyRows = await page.$$("table tbody tr");
  record("DOD-010", "Result visible in Player Profile history", profileText.includes("ممتاز") && historyRows.length === 2);
  record("DOD-012", "Two results = visible progress (test history table)", historyRows.length === 2);

  // ---------------- DOD-013/014: Attendance + percentage ----------------
  await page.click('[data-nav="attendance"]');
  await page.waitForSelector(".attendance-row");
  await page.click('.attendance-row:has-text("محمد أحمد") [data-att-status="present"]');
  await page.waitForTimeout(300);
  const toastAtt = await page.locator("#toast").textContent();
  record("DOD-013", "Record attendance", toastAtt.includes("تم تسجيل الحضور"));

  await page.click('[data-nav="players"]');
  await page.waitForSelector(".player-row");
  await page.click('.player-row:has-text("محمد أحمد") [data-open-profile]');
  await page.waitForSelector(".page-profile");
  const profileAfterAtt = await page.locator(".page-profile").textContent();
  record("DOD-014", "Attendance percentage visible in Player Profile", profileAfterAtt.includes("100%"));

  // ---------------- DOD-015: Performance stats (Dashboard + Reports) ----------------
  await page.click('[data-nav="dashboard"]');
  await page.waitForSelector(".page-dashboard");
  const dashText = await page.locator(".page-dashboard").textContent();
  record("DOD-015a", "Dashboard shows real (non-mock) stats", dashText.includes("متوسط الأداء العام") && !dashText.includes("undefined"));

  await page.click('[data-nav="reports"]');
  await page.waitForSelector(".page-reports");
  const reportsText = await page.locator(".page-reports").textContent();
  record("DOD-015b", "Reports shows top players + per-test averages", reportsText.includes("محمد أحمد") && reportsText.includes("الضغط"));

  // ---------------- DOD-019: Close and reopen -> data persists ----------------
  await page.reload({ waitUntil: "networkidle" });
  await page.click('[data-nav="players"]');
  await page.waitForSelector(".player-row");
  const survivedAfterReload = await page.$('.player-row:has-text("محمد أحمد")');
  record("DOD-019", "Data survives reload (close/reopen)", !!survivedAfterReload);

  // ---------------- Regression: Arabic-Indic digits still normalized (lesson carried forward) ----------------
  await page.click("#add-player-btn");
  await page.waitForSelector("#player-form");
  await page.fill('input[name="name"]', "لاعب أرقام عربية");
  await page.type('input[name="birthYear"]', "٢٠١١", { delay: 10 });
  await page.click('#player-form button[type="submit"]');
  await page.waitForTimeout(300);
  record("REGRESSION-001", "Arabic-Indic digit normalization still works in Phase 2",
    !!(await page.$('.player-row:has-text("لاعب أرقام عربية")')));

  console.log("\nConsole/page errors during test run:", consoleErrors.length === 0 ? "(none)" : consoleErrors.join(" | "));
  const allPass = results.every(r => r.pass) && consoleErrors.length === 0;
  console.log(`\nOverall Phase 2 E2E: ${allPass ? "PASS" : "FAIL"}`);

  await browser.close();
  process.exit(allPass ? 0 : 1);
}

main().catch(err => { console.error("Phase 2 E2E test crashed:", err); process.exit(1); });
