/**
 * PerformanceAnalysisService — computes the exact metrics listed in the
 * spec (section 11): average result, average score, best/worst result,
 * latest result, improvement%, strengths, weaknesses. All from real
 * TestResult data — never mock data.
 */
export class PerformanceAnalysisService {
  /**
   * @param {import("../database/repositories/TestResultRepository.js").TestResultRepository} resultRepo
   * @param {import("../database/repositories/TestRepository.js").TestRepository} testRepo
   */
  constructor(resultRepo, testRepo) {
    this._resultRepo = resultRepo;
    this._testRepo = testRepo;
  }

  /** Per-test summary for one player: avg value, avg score, best, worst, latest, improvement%. */
  async analyzeTestForPlayer(playerId, testId) {
    const results = await this._resultRepo.findByPlayerAndTest(Number(playerId), Number(testId));
    if (results.length === 0) return null;

    const values = results.map(r => r.value);
    const scores = results.filter(r => r.score != null).map(r => r.score);
    const sorted = [...results].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id - b.id));
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];

    const avgValue = round1(values.reduce((s, v) => s + v, 0) / values.length);
    const avgScore = scores.length ? round1(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
    const best = results.reduce((a, b) => (a.score ?? -Infinity) >= (b.score ?? -Infinity) ? a : b);
    const worst = results.reduce((a, b) => (a.score ?? Infinity) <= (b.score ?? Infinity) ? a : b);
    const improvementPct = first.value ? round1(((latest.value - first.value) / Math.abs(first.value)) * 100) : null;

    return { count: results.length, avgValue, avgScore, best, worst, latest, first, improvementPct };
  }

  /** Full-player summary across every test: overall avg score + strengths/weaknesses (by test). */
  async analyzePlayer(playerId) {
    const tests = await this._testRepo.getAll();
    const perTest = [];
    for (const test of tests) {
      const summary = await this.analyzeTestForPlayer(playerId, test.id);
      if (summary) perTest.push({ test, ...summary });
    }
    if (perTest.length === 0) return { perTest: [], overallAvgScore: null, strengths: [], weaknesses: [] };

    const scored = perTest.filter(p => p.avgScore != null);
    const overallAvgScore = scored.length
      ? round1(scored.reduce((s, p) => s + p.avgScore, 0) / scored.length)
      : null;

    const bySorted = [...scored].sort((a, b) => b.avgScore - a.avgScore);
    const strengths = bySorted.slice(0, 3).map(p => p.test.nameAr);
    const weaknesses = bySorted.slice(-3).reverse().map(p => p.test.nameAr);

    return { perTest, overallAvgScore, strengths, weaknesses };
  }
}

function round1(n) { return Math.round(n * 10) / 10; }
