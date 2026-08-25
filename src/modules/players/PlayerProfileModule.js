import { statusLabelAr, getAge } from "../../models/Player.js";

export class PlayerProfileModule {
  constructor({ playerService, groupService, testResultService, testService, attendanceService, evaluationService, performanceService, router }) {
    this._playerService = playerService;
    this._groupService = groupService;
    this._testResultService = testResultService;
    this._testService = testService;
    this._attendanceService = attendanceService;
    this._evaluation = evaluationService;
    this._performance = performanceService;
    this._router = router;
  }

  async render(container, playerIdParam) {
    const playerId = Number(playerIdParam);
    const player = await this._playerService.getPlayer(playerId);
    if (!player) {
      container.innerHTML = `<div class="empty-route">لاعب غير موجود</div>`;
      return;
    }

    const group = player.groupId ? await this._groupService.getGroup(player.groupId) : null;
    const results = await this._testResultService.getResultsForPlayer(playerId);
    const attendanceRecords = await this._attendanceService.getForPlayer(playerId);
    const attendancePct = await this._attendanceService.getAttendancePercent(playerId);
    const analysis = await this._performance.analyzePlayer(playerId);
    const tests = await this._testService.getAllTests();
    const testById = new Map(tests.map(t => [t.id, t]));

    const age = getAge(player);
    const ageCategory = this._evaluation.getAgeCategory(player);
    const lastResult = [...results].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
    const lastAttendance = [...attendanceRecords].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];

    container.innerHTML = `
      <div class="page-profile">
        <button class="btn btn-ghost btn-sm" id="back-btn">→ رجوع</button>

        <div class="card profile-head">
          <div class="avatar avatar-lg">${escapeHtml((player.name || "?").trim()[0] || "?")}</div>
          <div>
            <h2>${escapeHtml(player.name)}</h2>
            <div class="muted">${escapeHtml(player.gender)} · ${age ?? "—"} سنة · ${escapeHtml(ageCategory || "—")}</div>
            <span class="chip">${escapeHtml(statusLabelAr(player.status))}</span>
          </div>
        </div>

        <div class="card">
          <h3>البيانات الأساسية</h3>
          <div class="kv"><span>المجموعة</span><b>${group ? escapeHtml(group.name) : "—"}</b></div>
          <div class="kv"><span>تاريخ الانضمام</span><b>${escapeHtml(player.joinDate || "—")}</b></div>
          <div class="kv"><span>الحزام</span><b>${escapeHtml(player.belt || "—")}</b></div>
          <div class="kv"><span>النادي</span><b>${escapeHtml(player.club || "—")}</b></div>
          <div class="kv"><span>الهاتف</span><b>${escapeHtml(player.phone || "—")}</b></div>
          <div class="kv"><span>العنوان</span><b>${escapeHtml(player.address || "—")}</b></div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-value">${results.length}</div><div class="kpi-label">عدد الاختبارات</div></div>
          <div class="kpi-card"><div class="kpi-value">${analysis.overallAvgScore ?? "—"}</div><div class="kpi-label">متوسط الأداء</div></div>
          <div class="kpi-card"><div class="kpi-value">${attendancePct ?? "—"}${attendancePct != null ? "%" : ""}</div><div class="kpi-label">نسبة الحضور</div></div>
          <div class="kpi-card"><div class="kpi-value">${lastResult ? escapeHtml(lastResult.rating || "—") : "—"}</div><div class="kpi-label">آخر اختبار</div></div>
        </div>

        ${analysis.strengths.length ? `
        <div class="card">
          <h3>نقاط القوة والضعف</h3>
          <div class="kv"><span>نقاط القوة</span><b>${analysis.strengths.map(escapeHtml).join("، ")}</b></div>
          <div class="kv"><span>نقاط الضعف</span><b>${analysis.weaknesses.map(escapeHtml).join("، ")}</b></div>
        </div>` : ""}

        <div class="card">
          <h3>سجل الاختبارات</h3>
          ${results.length === 0 ? `<div class="muted">لا توجد نتائج مسجّلة بعد</div>` : `
          <div class="tablewrap">
            <table>
              <thead><tr><th>الاختبار</th><th>النتيجة</th><th>الدرجة</th><th>التاريخ</th></tr></thead>
              <tbody>
                ${[...results].sort((a,b)=> (b.date||"").localeCompare(a.date||"")).map(r => `
                  <tr>
                    <td>${escapeHtml(testById.get(r.testId)?.nameAr || "—")}</td>
                    <td>${r.value}</td>
                    <td><span class="chip gold">${escapeHtml(r.rating || "—")}</span></td>
                    <td>${escapeHtml(r.date)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
          </div>`}
        </div>

        <div class="card">
          <h3>سجل الحضور</h3>
          ${attendanceRecords.length === 0 ? `<div class="muted">لا يوجد سجل حضور بعد</div>` : `
          <div class="mini-list">
            ${[...attendanceRecords].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,10).map(a => `
              <div class="mini-row">
                <span>${escapeHtml(a.date)}</span>
                <span class="chip ${a.status === "present" ? "" : a.status === "injured" ? "danger" : "warn"}">${escapeHtml(attendanceLabel(a.status))}</span>
              </div>`).join("")}
          </div>
          <div class="muted" style="margin-top:8px;">آخر تسجيل حضور: ${lastAttendance ? escapeHtml(lastAttendance.date) : "—"}</div>`}
        </div>
      </div>
    `;

    container.querySelector("#back-btn").addEventListener("click", () => this._router.navigate("players"));
  }
}

function attendanceLabel(status) {
  return { present: "حاضر", absent: "غائب", injured: "مصاب" }[status] || status;
}
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
