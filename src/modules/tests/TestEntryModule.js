import { toast } from "../../utils/toast.js";
import { ValidationError } from "../../services/errors.js";

/**
 * TestEntryModule — coach picks player + test + date, enters value + notes,
 * system computes score/rating automatically and saves (per spec section 9).
 */
export class TestEntryModule {
  constructor({ playerService, testService, testResultService, evaluationService }) {
    this._playerService = playerService;
    this._testService = testService;
    this._testResultService = testResultService;
    this._evaluation = evaluationService;
    this._lastResult = null;
  }

  async render(container) {
    const players = await this._playerService.getAllPlayers();
    const tests = await this._testService.getActiveTests();

    container.innerHTML = `
      <div class="page-testentry">
        <div class="page-header"><h2>تسجيل اختبار</h2></div>

        <div class="card">
          <div class="field"><label>اللاعب *</label>
            <select id="te-player">
              <option value="">— اختر لاعب —</option>
              ${players.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>الاختبار *</label>
            <select id="te-test">
              <option value="">— اختر اختبار —</option>
              ${tests.map(t => `<option value="${t.id}">${escapeHtml(t.nameAr)} (${escapeHtml(t.unit)})</option>`).join("")}
            </select>
          </div>
          <div class="field"><label>التاريخ *</label>
            <input type="date" id="te-date" value="${new Date().toISOString().slice(0,10)}">
          </div>
          <div class="field"><label>النتيجة *</label>
            <input type="text" inputmode="decimal" data-numeric="dec" id="te-value" placeholder="أدخل الرقم">
          </div>
          <div class="field"><label>ملاحظات</label><textarea id="te-notes"></textarea></div>
          <button class="btn btn-block" id="te-submit">حفظ النتيجة</button>
        </div>

        <div id="te-result-card"></div>
      </div>
    `;

    wireNumericInputs(container);

    container.querySelector("#te-submit").addEventListener("click", async () => {
      const playerId = container.querySelector("#te-player").value;
      const testId = container.querySelector("#te-test").value;
      const date = container.querySelector("#te-date").value;
      const value = container.querySelector("#te-value").value;
      const notes = container.querySelector("#te-notes").value;

      if (!playerId) { toast("الرجاء اختيار اللاعب", { type: "error" }); return; }
      if (!testId) { toast("الرجاء اختيار الاختبار", { type: "error" }); return; }

      try {
        const result = await this._testResultService.recordResult({ playerId, testId, value, date, notes });
        toast("تم حفظ النتيجة");
        this._showResultCard(container, result, tests.find(t => t.id === Number(testId)));
        container.querySelector("#te-value").value = "";
        container.querySelector("#te-notes").value = "";
      } catch (err) {
        if (err instanceof ValidationError) toast(err.message, { type: "error" });
        else throw err;
      }
    });
  }

  _showResultCard(container, result, test) {
    const el = container.querySelector("#te-result-card");
    el.innerHTML = `
      <div class="card">
        <h3>نتيجة الحفظ</h3>
        <div class="kv"><span>الاختبار</span><b>${escapeHtml(test ? test.nameAr : "—")}</b></div>
        <div class="kv"><span>القيمة</span><b>${result.value}</b></div>
        <div class="kv"><span>الدرجة (Score)</span><b>${result.score ?? "—"}</b></div>
        <div class="kv"><span>التقييم (Rating)</span><b class="chip gold">${escapeHtml(result.rating || "—")}</b></div>
      </div>`;
  }
}

function wireNumericInputs(root) {
  root.querySelectorAll("[data-numeric]").forEach(inp => {
    inp.addEventListener("input", () => {
      const map = {"٠":"0","١":"1","٢":"2","٣":"3","٤":"4","٥":"5","٦":"6","٧":"7","٨":"8","٩":"9",
                    "۰":"0","۱":"1","۲":"2","۳":"3","۴":"4","۵":"5","۶":"6","۷":"7","۸":"8","۹":"9","٫":"."};
      const normalized = inp.value.replace(/[٠-٩۰-۹٫]/g, ch => map[ch] ?? ch).replace(/[^0-9.]/g, "");
      if (normalized !== inp.value) {
        const pos = inp.selectionStart;
        inp.value = normalized;
        try { inp.setSelectionRange(pos, pos); } catch {}
      }
    });
  });
}
function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
