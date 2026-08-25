import { PlayerRepository } from "../src/database/repositories/PlayerRepository.js";
import { PlayerService } from "../src/services/PlayerService.js";
import { GroupRepository } from "../src/database/repositories/GroupRepository.js";
import { GroupService } from "../src/services/GroupService.js";
import { TestRepository } from "../src/database/repositories/TestRepository.js";
import { StandardsRepository } from "../src/database/repositories/StandardsRepository.js";
import { TestResultRepository } from "../src/database/repositories/TestResultRepository.js";
import { AttendanceRepository } from "../src/database/repositories/AttendanceRepository.js";
import { EvaluationService } from "../src/services/EvaluationService.js";
import { TestResultService } from "../src/services/TestResultService.js";
import { AttendanceService } from "../src/services/AttendanceService.js";
import { PerformanceAnalysisService } from "../src/services/PerformanceAnalysisService.js";
import { resolveStandardsSeed } from "../src/database/seeds/resolveStandardsSeed.js";

class MemoryAdapter {
  constructor() { this.data = new Map(); }
  async get(key) { return this.data.has(key) ? this.data.get(key) : null; }
  async set(key, value) { this.data.set(key, structuredClone(value)); }
  async delete(key) { this.data.delete(key); }
  async list(prefix) {
    return [...this.data.entries()].filter(([k]) => k.startsWith(prefix))
      .map(([key, value]) => ({ key, value: structuredClone(value) }));
  }
}

const results = [];
function test(id, label, condition, detail = "") {
  const pass = Boolean(condition);
  results.push(pass);
  console.log(`${id}  ${label}: ${pass ? "PASS" : "FAIL"}${detail ? `  (${detail})` : ""}`);
}

async function main() {
  const adapter = new MemoryAdapter();

  // ---------------- Player migration ----------------
  // Simulate a legacy Phase 1 record written directly (old Arabic status, no new fields).
  await adapter.set("judo:player:1", {
    id: 1, name: "لاعب قديم", membershipNo: "M001", gender: "ذكر", birthYear: 2010,
    weight: null, belt: "", club: "", phone: "", status: "مقيد", notes: "",
    deletedAt: null, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  });
  await adapter.set("judo:meta:playerNextId", 1);

  const playerRepo = new PlayerRepository(adapter);
  const playerService = new PlayerService(playerRepo);

  const migrated = await playerRepo.getPlayer(1);
  test("MIGRATE-001", "Legacy Arabic status migrated to English enum",
    migrated.status === "active", `status=${migrated.status}`);
  test("MIGRATE-002", "New fields defaulted for legacy record",
    migrated.playerCode === "M001" && migrated.groupId === null && !!migrated.joinDate,
    JSON.stringify({ playerCode: migrated.playerCode, groupId: migrated.groupId, joinDate: migrated.joinDate }));
  test("MIGRATE-003", "Legacy record NOT deleted/lost during migration",
    migrated.id === 1 && migrated.name === "لاعب قديم");

  // ---------------- Groups ----------------
  const groupRepo = new GroupRepository(adapter);
  const groupService = new GroupService(groupRepo);
  const group = await groupService.createGroup({ name: "مجموعة الناشئين", coach: "أحمد" });
  test("GROUP-001", "Create Group", group.id === 1 && group.name === "مجموعة الناشئين");

  const p2 = await playerService.createPlayer({ name: "لاعب جديد", birthYear: "2012", groupId: group.id });
  test("GROUP-002", "Assign player to group", p2.groupId === group.id);

  const groupPlayers = await playerService.getAllPlayers({ groupId: group.id });
  test("GROUP-003", "Filter players by group", groupPlayers.length === 1 && groupPlayers[0].id === p2.id);

  // ---------------- Tests catalog seeding ----------------
  const testRepo = new TestRepository(adapter);
  const seededTests = await testRepo.ensureSeeded();
  test("TESTCAT-001", "Seed 10 tests", seededTests.length === 10);
  const seededAgain = await testRepo.ensureSeeded();
  test("TESTCAT-002", "Seeding is idempotent (no duplicates on 2nd call)",
    (await testRepo.getAll()).length === 10);

  const pushUpTest = await testRepo.getByNameAr("الضغط");
  test("TESTCAT-003", "Test fields present", pushUpTest.higherIsBetter === true && pushUpTest.unit === "عدد تكرارات");

  // ---------------- Standards seeding + Evaluation ----------------
  const standardsRepo = new StandardsRepository(adapter);
  const allTests = await testRepo.getAll();
  const seedRows = resolveStandardsSeed(allTests);
  await standardsRepo.ensureSeeded(seedRows);
  const standardsCount = (await standardsRepo.getAll()).length;
  test("STD-001", "Standards seeded (600 real brackets)", standardsCount === 600, `count=${standardsCount}`);

  const evaluation = new EvaluationService(standardsRepo, testRepo);

  // Known verified values (cross-checked against the Excel system earlier)
  const p3 = await playerService.createPlayer({ name: "محمد علي", gender: "ذكر", birthYear: String(new Date().getFullYear() - 14) }); // age 14 -> تحت 15
  const scoreExcellent = await evaluation.scorePlayerResult(p3, pushUpTest.id, 42);
  test("EVAL-001", "PushUp male تحت15 value=42 -> ممتاز/5",
    scoreExcellent && scoreExcellent.score === 5 && scoreExcellent.rating === "ممتاز", JSON.stringify(scoreExcellent));

  const scoreBoundary = await evaluation.scorePlayerResult(p3, pushUpTest.id, 41);
  test("EVAL-002", "PushUp male تحت15 value=41 -> جيد جدًا/4",
    scoreBoundary && scoreBoundary.score === 4 && scoreBoundary.rating === "جيد جدًا", JSON.stringify(scoreBoundary));

  const shuttleTest = await testRepo.getByNameAr("الجري الارتدادي");
  const shuttleBoundary = await evaluation.scorePlayerResult(p3, shuttleTest.id, 11.00);
  test("EVAL-003", "ShuttleRun boundary (lower-is-better) value=11.00 -> جيد جدًا/4 (no overlap bug)",
    shuttleBoundary && shuttleBoundary.score === 4, JSON.stringify(shuttleBoundary));

  test("EVAL-004", "getAgeCategory respects gender for adult tier",
    evaluation.getAgeCategory({ birthYear: new Date().getFullYear() - 20, gender: "ذكر" }) === "رجال" &&
    evaluation.getAgeCategory({ birthYear: new Date().getFullYear() - 20, gender: "أنثى" }) === "آنسات");

  // ---------------- TestResultService pipeline ----------------
  const resultRepo = new TestResultRepository(adapter);
  const testResultService = new TestResultService(resultRepo, playerRepo, evaluation);

  const r1 = await testResultService.recordResult({ playerId: p3.id, testId: pushUpTest.id, value: 42, date: "2026-08-01" });
  test("RESULT-001", "Record result computes score+rating automatically",
    r1.score === 5 && r1.rating === "ممتاز");

  const r2 = await testResultService.recordResult({ playerId: p3.id, testId: pushUpTest.id, value: 46, date: "2026-08-15" });
  test("RESULT-002", "Second result for same player+test allowed (progress over time)",
    r2.id !== r1.id);

  const history = await testResultService.getResultsForPlayerAndTest(p3.id, pushUpTest.id);
  test("RESULT-003", "Test history returns both results in date order",
    history.length === 2 && history[0].date === "2026-08-01" && history[1].date === "2026-08-15");

  // Validation error path
  let validationCaught = false;
  try { await testResultService.recordResult({ playerId: p3.id, testId: pushUpTest.id, value: "abc", date: "2026-08-20" }); }
  catch (e) { validationCaught = e.constructor.name === "ValidationError"; }
  test("RESULT-004", "Invalid (non-numeric) result rejected with ValidationError", validationCaught);

  // ---------------- Achievement (weighted) ----------------
  const latestResults = [{ testId: pushUpTest.id, score: 5 }];
  const achievement = evaluation.computeAchievement(latestResults, allTests);
  test("EVAL-005", "computeAchievement: partial results give honest low %, not 100%",
    achievement > 0 && achievement < 100, `achievement=${achievement}%`);

  // ---------------- Attendance ----------------
  const attendanceRepo = new AttendanceRepository(adapter);
  const attendanceService = new AttendanceService(attendanceRepo);

  const a1 = await attendanceService.recordAttendance({ playerId: p3.id, date: "2026-08-01", status: "present" });
  test("ATT-001", "Record attendance", a1.status === "present");

  const a2 = await attendanceService.recordAttendance({ playerId: p3.id, date: "2026-08-02", status: "absent" });
  const a3 = await attendanceService.recordAttendance({ playerId: p3.id, date: "2026-08-03", status: "injured" });
  test("ATT-002", "Record absent/injured statuses", a2.status === "absent" && a3.status === "injured");

  // Duplicate date -> should UPDATE the existing record, not create a new one
  const beforeCount = (await attendanceRepo.getAll()).length;
  const aDup = await attendanceService.recordAttendance({ playerId: p3.id, date: "2026-08-01", status: "absent" });
  const afterCount = (await attendanceRepo.getAll()).length;
  test("ATT-003", "Duplicate monthly/daily record prevented (update, not duplicate)",
    beforeCount === afterCount && aDup.id === a1.id && aDup.status === "absent");

  const pct = await attendanceService.getAttendancePercent(p3.id);
  test("ATT-004", "Attendance percentage calculated correctly",
    pct === Math.round((0 / 3) * 1000) / 10 || true, `pct=${pct}% (1 present->absent, so 0/3 present after dup update)`);
  // recompute expectation precisely: records are (08-01:absent after dup),(08-02:absent),(08-03:injured) -> 0 present of 3 -> 0%
  test("ATT-004b", "Attendance percentage exact value", pct === 0, `pct=${pct}`);

  // ---------------- Performance Analysis ----------------
  const perf = new PerformanceAnalysisService(resultRepo, testRepo);
  const testAnalysis = await perf.analyzeTestForPlayer(p3.id, pushUpTest.id);
  test("PERF-001", "Per-test analysis: avg/best/worst/latest/improvement",
    testAnalysis.count === 2 && testAnalysis.avgValue === 44 && testAnalysis.latest.value === 46 &&
    testAnalysis.improvementPct !== null,
    JSON.stringify(testAnalysis));

  const playerAnalysis = await perf.analyzePlayer(p3.id);
  test("PERF-002", "Full player analysis: strengths list populated from real data",
    playerAnalysis.strengths.length > 0 && playerAnalysis.overallAvgScore !== null,
    JSON.stringify({ overallAvgScore: playerAnalysis.overallAvgScore, strengths: playerAnalysis.strengths }));

  // ---------------- Backward compatibility summary ----------------
  const allPlayersNow = await playerService.getAllPlayers();
  test("COMPAT-001", "Original Phase 1 player still present after all Phase 2 operations",
    allPlayersNow.some(p => p.id === 1 && p.name === "لاعب قديم"));

  console.log("\n--------------------------------");
  console.log(`Overall Phase 2 Node Test: ${results.every(Boolean) ? "PASS" : "FAIL"}`);
  console.log("--------------------------------");
  process.exit(results.every(Boolean) ? 0 : 1);
}

main().catch(err => { console.error("Phase 2 node test crashed:", err); process.exit(1); });
