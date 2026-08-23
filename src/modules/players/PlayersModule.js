import { toast } from "../../utils/toast.js";
import { ValidationError } from "../../services/PlayerService.js";
import { PLAYER_STATUSES, GENDERS } from "../../models/Player.js";

/**
 * PlayersModule — UI layer for the Players screen. Depends ONLY on a
 * PlayerService instance (constructor injection) — it never touches
 * localStorage/IndexedDB, and never imports a Repository or Adapter
 * directly. This is what ARCH-003 verifies.
 */
export class PlayersModule {
  /** @param {import("../../services/PlayerService.js").PlayerService} playerService */
  constructor(playerService) {
    this._service = playerService;
    this._searchQuery = "";
  }

  /** @param {HTMLElement} container */
  async render(container) {
    const players = this._searchQuery
      ? await this._service.searchPlayers(this._searchQuery)
      : await this._service.getAllPlayers();

    container.innerHTML = `
      <div class="page-players">
        <div class="page-header">
          <h2>اللاعبون</h2>
          <div class="muted">${players.length} لاعب</div>
        </div>

        <input type="text" id="player-search" class="search-input"
               placeholder="ابحث بالاسم أو رقم العضوية أو الهاتف..." value="${escapeHtml(this._searchQuery)}">

        <button class="btn btn-gold btn-block" id="add-player-btn">+ إضافة لاعب جديد</button>

        <div class="player-list">
          ${players.length === 0
            ? `<div class="empty-state">لا يوجد لاعبون بعد. اضغط "إضافة لاعب جديد" للبدء.</div>`
            : players.map(p => this._playerRowHtml(p)).join("")}
        </div>
      </div>
    `;

    this._wire(container);
  }

  _playerRowHtml(p) {
    return `
      <div class="player-row" data-player-id="${p.id}">
        <div class="player-row-main">
          <div class="avatar">${escapeHtml((p.name || "?").trim()[0] || "?")}</div>
          <div>
            <div class="player-name">${escapeHtml(p.name)}</div>
            <div class="player-sub muted">${escapeHtml(p.gender)} · ${p.birthYear ?? "—"} · ${escapeHtml(p.status)}</div>
          </div>
        </div>
        <div class="player-row-actions">
          <button class="btn btn-ghost btn-sm" data-edit-player="${p.id}">تعديل</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-delete-player="${p.id}">حذف</button>
        </div>
      </div>`;
  }

  _wire(container) {
    const searchInput = container.querySelector("#player-search");
    searchInput.addEventListener("input", e => {
      this._searchQuery = e.target.value;
      this.render(container);
    });
    // Restore focus + caret to the search box after re-render (typing UX)
    if (document.activeElement !== searchInput && this._searchQuery) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }

    container.querySelector("#add-player-btn").addEventListener("click", () => {
      this._openForm(container, null);
    });

    container.querySelectorAll("[data-edit-player]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.editPlayer);
        const player = await this._service.getPlayer(id);
        this._openForm(container, player);
      });
    });

    container.querySelectorAll("[data-delete-player]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.dataset.deletePlayer);
        if (!confirm("هل تريد حذف هذا اللاعب؟ (يمكن استرجاعه لاحقًا من قِبل الإدارة)")) return;
        await this._service.softDeletePlayer(id);
        toast("تم حذف اللاعب");
        this.render(container);
      });
    });
  }

  _openForm(container, existing) {
    const isEdit = !!existing;
    const p = existing || { name:"", membershipNo:"", gender:"ذكر", birthYear:"", weight:"", belt:"", club:"", phone:"", status:"مقيد", notes:"" };

    const modalRoot = document.getElementById("modal-root");
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="modal-backdrop">
        <div class="modal">
          <div class="modal-head">
            <h3>${isEdit ? "تعديل بيانات لاعب" : "إضافة لاعب جديد"}</h3>
            <button class="modal-close" id="modal-close">✕</button>
          </div>
          <form id="player-form">
            <div class="field"><label>الاسم الكامل *</label><input type="text" name="name" value="${escapeHtml(p.name)}"></div>
            <div class="grid2">
              <div class="field"><label>النوع *</label>
                <select name="gender">${GENDERS.map(g=>`<option ${g===p.gender?"selected":""}>${g}</option>`).join("")}</select>
              </div>
              <div class="field"><label>رقم العضوية</label><input type="text" name="membershipNo" value="${escapeHtml(p.membershipNo)}"></div>
            </div>
            <div class="grid2">
              <div class="field"><label>سنة الميلاد *</label>
                <input type="text" inputmode="numeric" data-numeric="int" name="birthYear" value="${escapeHtml(String(p.birthYear ?? ""))}" placeholder="مثال: 2012">
              </div>
              <div class="field"><label>الوزن (كجم)</label>
                <input type="text" inputmode="decimal" data-numeric="dec" name="weight" value="${escapeHtml(String(p.weight ?? ""))}">
              </div>
            </div>
            <div class="grid2">
              <div class="field"><label>الحزام</label><input type="text" name="belt" value="${escapeHtml(p.belt)}"></div>
              <div class="field"><label>النادي</label><input type="text" name="club" value="${escapeHtml(p.club)}"></div>
            </div>
            <div class="grid2">
              <div class="field"><label>الحالة</label>
                <select name="status">${PLAYER_STATUSES.map(s=>`<option ${s===p.status?"selected":""}>${s}</option>`).join("")}</select>
              </div>
              <div class="field"><label>رقم الهاتف</label><input type="text" name="phone" value="${escapeHtml(p.phone)}"></div>
            </div>
            <div class="field"><label>ملاحظات</label><textarea name="notes">${escapeHtml(p.notes)}</textarea></div>
            <button type="submit" class="btn btn-block">${isEdit ? "حفظ التعديلات" : "إضافة اللاعب"}</button>
          </form>
        </div>
      </div>`;

    modalRoot.querySelector("#modal-backdrop").addEventListener("click", e => {
      if (e.target.id === "modal-backdrop") modalRoot.innerHTML = "";
    });
    modalRoot.querySelector("#modal-close").addEventListener("click", () => { modalRoot.innerHTML = ""; });

    wireNumericInputs(modalRoot);

    modalRoot.querySelector("#player-form").addEventListener("submit", async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      try {
        if (isEdit) {
          await this._service.updatePlayer(existing.id, data);
          toast("تم حفظ التعديلات");
        } else {
          await this._service.createPlayer(data);
          toast("تمت إضافة اللاعب");
        }
        modalRoot.innerHTML = "";
        this.render(container);
      } catch (err) {
        if (err instanceof ValidationError) toast(err.message, { type: "error" });
        else throw err;
      }
    });
  }
}

/** Normalize Arabic-Indic digits live as the user types (see utils/normalizeDigits.js for why). */
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
