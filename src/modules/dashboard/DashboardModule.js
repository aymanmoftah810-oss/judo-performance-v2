import { statusLabelAr } from "../../models/Player.js";

/**
 * DashboardModule — every number here is computed live from the
 * repositories/services. No mock/placeholder data anywhere.
 */
export class DashboardModule {
  constructor({ playerService, testResultService, attendanceService, router }) {
    this._playerService = playerService;
    this._testResultService = testResultService;
    this._attendanceService = attendanceService;
    this._router = router;
  }

  async render(container) {
    const players = await this._playerService.getAllPlayers();
    const activePlayers = players.filter(p => p.status === "active");
    const newPlayers = players.filter(p => p.status === "new");
    const allResults = await this._testResultService.getAllResults();

    const today = new Date().toISOString().slice(0, 10);
    const attendanceToday = await this._attendanceService.getForDate(today);
    const presentToday = attendanceToday.filter(a => a.status === "present").length;

    const scored = allResults.filter(r => r.score != null);
    const avgScore = scored.length ? Math.round((scored.reduce((s, r) => s + r.score, 0) / scored.length) * 10) / 10 : null;

    const recentPlayers = [...players].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);
    const recentResults = [...allResults].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 5);
    const playerById = new Map(players.map(p => [p.id, p]));

    container.innerHTML = `
      <div class="page-dashboard">
        <div class="page-header"><h2>الرئيسية</h2><div class="muted">نظرة عامة</div></div>

        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-value">${players.length}</div><div class="kpi-label">إجمالي اللاعبين</div></div>
          <div class="kpi-card"><div class="kpi-value">${activePlayers.length}</div><div class="kpi-label">لاعبون نشطون</div></div>
          <div class="kpi-card"><div class="kpi-value">${newPlayers.length}</div><div class="kpi-label">لاعبون جدد</div></div>
          <div class="kpi-card"><div class="kpi-value">${allResults.length}</div><div class="kpi-label">اختبارات مسجّلة</div></div>
          <div class="kpi-card"><div class="kpi-value">${avgScore ?? "—"}</div><div class="kpi-label">متوسط الأداء العام</div></div>
          <div class="kpi-card"><div class="kpi-value">${presentToday}</div><div class="kpi-label">حضور اليوم</div></div>
        </div>

        <div class="card">
          <h3>آخر اللاعبين المضافين</h3>
          ${recentPlayers.length === 0 ? `<div class="muted">لا يوجد لاعبون بعد</div>` : `
          <div class="mini-list">
            ${recentPlayers.map(p => `
              <div class="mini-row" data-goto-player="${p.id}">
                <span>${escapeHtml(p.name)}</span>
                <span class="chip">${escapeHtml(statusLabelAr(p.status))}</span>
              </div>`).join("")}
          </div>`}
        </div>

        <div class="card">
          <h3>آخر نتائج الاختبارات</h3>
          ${recentResults.length === 0 ? `<div class="muted">لا توجد نتائج بعد</div>` : `
          <div class="mini-list">
            ${recentResults.map(r => {
              const p = playerById.get(r.playerId);
              return `<div class="mini-row">
                <span>${escapeHtml(p ? p.name : "—")}</span>
                <span class="chip gold">${escapeHtml(r.rating || "—")}</span>
              </div>`;
            }).join("")}
          </div>`}
        </div>
      </div>
    `;

    container.querySelectorAll("[data-goto-player]").forEach(el => {
      el.addEventListener("click", () => this._router.navigate("player", el.dataset.gotoPlayer));
    });
  }
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
