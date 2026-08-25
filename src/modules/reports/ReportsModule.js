export class ReportsModule {
  constructor({ playerService, testService, testResultService, performanceService }) {
    this._playerService = playerService;
    this._testService = testService;
    this._testResultService = testResultService;
    this._performance = performanceService;
  }

  async render(container) {
    const players = await this._playerService.getAllPlayers();
    const allResults = await this._testResultService.getAllResults();
    const tests = await this._testService.getAllTests();

    const perPlayer = [];
    for (const p of players) {
      const analysis = await this._performance.analyzePlayer(p.id);
      if (analysis.overallAvgScore != null) perPlayer.push({ player: p, avgScore: analysis.overallAvgScore });
    }
    perPlayer.sort((a, b) => b.avgScore - a.avgScore);
    const top5 = perPlayer.slice(0, 5);

    const testAverages = tests.map(t => {
      const results = allResults.filter(r => r.testId === t.id && r.score != null);
      const avg = results.length ? Math.round((results.reduce((s, r) => s + r.score, 0) / results.length) * 10) / 10 : null;
      return { test: t, avg, count: results.length };
    }).filter(r => r.count > 0);

    container.innerHTML = `
      <div class="page-reports">
        <div class="page-header"><h2>التقارير</h2></div>

        <div class="card">
          <h3>🏆 أفضل 5 لاعبين (حسب متوسط الأداء)</h3>
          ${top5.length === 0 ? `<div class="muted">لا توجد بيانات كافية بعد</div>` : `
          <div class="mini-list">
            ${top5.map((r, i) => `
              <div class="mini-row">
                <span>${i + 1}. ${escapeHtml(r.player.name)}</span>
                <span class="chip gold">${r.avgScore}/5</span>
              </div>`).join("")}
          </div>`}
        </div>

        <div class="card">
          <h3>📊 متوسط كل اختبار (كل اللاعبين)</h3>
          ${testAverages.length === 0 ? `<div class="muted">لا توجد نتائج بعد</div>` : `
          <div class="mini-list">
            ${testAverages.map(r => `
              <div class="mini-row">
                <span>${escapeHtml(r.test.nameAr)}</span>
                <span class="chip">${r.avg}/5 (${r.count} نتيجة)</span>
              </div>`).join("")}
          </div>`}
        </div>
      </div>
    `;
  }
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
