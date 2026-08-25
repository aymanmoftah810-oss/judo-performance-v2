import { toast } from "../../utils/toast.js";
import { ValidationError } from "../../services/errors.js";
import { TestService } from "../../services/TestService.js";

/**
 * SettingsModule — houses Group management (spec section 13 describes
 * Groups as a system, but section 14's Navigation list has no separate
 * "Groups" tab — so group management lives here, reachable from the
 * Settings tab, exactly matching the 6-tab navigation given).
 */
export class SettingsModule {
  constructor({ groupService, testService, standardsRepo }) {
    this._groupService = groupService;
    this._testService = testService;
    this._standardsRepo = standardsRepo;
  }

  async render(container) {
    const groups = await this._groupService.getAllGroups();
    const tests = await this._testService.getAllTests();
    const allStandards = await this._standardsRepo.getAll();

    container.innerHTML = `
      <div class="page-settings">
        <div class="page-header"><h2>الإعدادات</h2></div>

        <div class="card">
          <h3>المجموعات</h3>
          <div class="mini-list">
            ${groups.length === 0 ? `<div class="muted">لا توجد مجموعات بعد</div>` : groups.map(g => `
              <div class="mini-row">
                <span>${escapeHtml(g.name)}</span>
                <span class="chip ${g.active ? "" : "warn"}">${g.active ? "نشطة" : "غير نشطة"}</span>
              </div>`).join("")}
          </div>
          <button class="btn btn-block" id="add-group-btn" style="margin-top:10px;">+ إضافة مجموعة</button>
        </div>

        <div class="card">
          <h3>الاختبارات المتاحة</h3>
          <div class="mini-list">
            ${tests.map(t => `
              <div class="mini-row">
                <span>${escapeHtml(t.nameAr)}</span>
                <button class="chip-btn ${t.active ? "" : "warn"}" data-toggle-test="${t.id}">${t.active ? "مفعّل" : "معطّل"}</button>
              </div>`).join("")}
          </div>
          <div class="muted" style="margin-top:8px;">معايير التقييم (Standards) مُخزّنة كبيانات منفصلة عن الكود (${allStandards.length} معيار مُحمّل)، وليست ثابتة داخل محرك التقييم.</div>
        </div>

        <div id="settings-modal-anchor"></div>
      </div>
    `;

    container.querySelector("#add-group-btn").addEventListener("click", () => this._openGroupForm(container));
    container.querySelectorAll("[data-toggle-test]").forEach(btn => {
      btn.addEventListener("click", async () => {
        await this._testService.toggleActive(btn.dataset.toggleTest);
        toast("تم تحديث حالة الاختبار");
        this.render(container);
      });
    });
  }

  _openGroupForm(container) {
    const modalRoot = document.getElementById("modal-root");
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal">
          <div class="modal-head"><h3>إضافة مجموعة</h3><button class="modal-close" id="modal-close">✕</button></div>
          <form id="group-form">
            <div class="field"><label>اسم المجموعة *</label><input type="text" name="name"></div>
            <div class="field"><label>المدرب</label><input type="text" name="coach"></div>
            <div class="field"><label>وصف</label><textarea name="description"></textarea></div>
            <button type="submit" class="btn btn-block">حفظ</button>
          </form>
        </div>
      </div>`;
    modalRoot.querySelector("#modal-backdrop").addEventListener("click", e => { if (e.target.id === "modal-backdrop") modalRoot.innerHTML = ""; });
    modalRoot.querySelector("#modal-close").addEventListener("click", () => { modalRoot.innerHTML = ""; });
    modalRoot.querySelector("#group-form").addEventListener("submit", async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target).entries());
      try {
        await this._groupService.createGroup(data);
        toast("تمت إضافة المجموعة");
        modalRoot.innerHTML = "";
        this.render(container);
      } catch (err) {
        if (err instanceof ValidationError) toast(err.message, { type: "error" });
        else throw err;
      }
    });
  }
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
