import { toast } from "../../utils/toast.js";
import { ValidationError } from "../../services/errors.js";
import { PLAYER_STATUSES, STATUS_LABELS_AR, GENDERS, statusLabelAr } from "../../models/Player.js";

/**
 * PlayersModule — UI layer for the Players screen. Depends ONLY on
 * PlayerService + GroupService (both injected) + Router — it never touches
 * localStorage/IndexedDB, and never imports a Repository or Adapter
 * directly. This is what ARCH-003 verifies.
 */
export class PlayersModule {
  /**
   * @param {import("../../services/PlayerService.js").PlayerService} playerService
   * @param {import("../../services/GroupService.js").GroupService} groupService
   * @param {import("../../core/Router.js").Router} router
   */
  constructor(playerService, groupService, router) {
    this._service = playerService;
    this._groupService = groupService;
    this._router = router;
    this._searchQuery = "";
    this._statusFilter = "";
    this._groupFilter = "";
    this._sortBy = "name";
  }

  /** @param {HTMLElement} container */
  async render(container) {
    const groups = await this._groupService.getAllGroups();
    const opts = {
      status: this._statusFilter || undefined,
      groupId: this._groupFilter ? Number(this._groupFilter) : undefined,
      sortBy: this._sortBy,
    };
    const players = this._searchQuery
      ? await this._service.searchPlayers(this._searchQuery, opts)
      : await this._service.getAllPlayers(opts);
    const groupById = new Map(groups.map(g => [g.id, g]));

    container.innerHTML = `
      <div class="page-players">
        <div class="page-header">
          <h2>اللاعبون</h2>
          <div class="muted">${players.length} لاعب</div>
        </div>

        <input type="text" id="player-search" class="search-input"
               placeholder="ابحث بالاسم أو رقم العضوية أو الكود أو الهاتف..." value="${escapeHtml(this._searchQuery)}">

        <div class="filter-row">
          <select id="filter-status">
            <option value="">كل الحالات</option>
            ${PLAYER_STATUSES.map(s => `<option value="${s}" ${this._statusFilter===s?"selected":""}>${STATUS_LABELS_AR[s]}</option>`).join("")}
          </select>
          <select id="filter-group">
            <option value="">كل المجموعات</option>
            ${groups.map(g => `<option value="${g.id}" ${String(this._groupFilter)===String(g.id)?"selected":""}>${escapeHtml(g.name)}</option>`).join("")}
          </select>
          <select id="sort-by">
            <option value="name" ${this._sortBy==="name"?"selected":""}>ترتيب: الاسم</option>
            <option value="joinDate" ${this._sortBy==="joinDate"?"selected":""}>ترتيب: تاريخ الانضمام</option>
            <option value="birthYear" ${this._sortBy==="birthYear"?"selected":""}>ترتيب: سنة الميلاد</option>
          </select>
        </div>

        <button class="btn btn-gold btn-block" id="add-player-btn">+ إضافة لاعب جديد</button>

        <div class="player-list">
          ${players.length === 0
            ? `<div class="empty-state">لا يوجد لاعبون مطابقون. اضغط "إضافة لاعب جديد" للبدء.</div>`
            : players.map(p => this._playerRowHtml(p, groupById)).join("")}
        </div>
      </div>
    `;

    this._wire(container, groups);
  }

  _playerRowHtml(p, groupById) {
    const group = p.groupId ? groupById.get(p.groupId) : null;
    return `
      <div class="player-row" data-player-id="${p.id}">
        <div class="player-row-main" data-open-profile="${p.id}">
          <div class="avatar">${escapeHtml((p.name || "?").trim()[0] || "?")}</div>
          <div>
            <div class="player-name">${escapeHtml(p.name)}</div>
            <div class="player-sub muted">${escapeHtml(p.gender)} · ${p.birthYear ?? "—"} · ${escapeHtml(statusLabelAr(p.status))}${group ? " · " + escapeHtml(group.name) : ""}</div>
          </div>
        </div>
        <div class="player-row-actions">
          <button class="btn btn-ghost btn-sm" data-edit-player="${p.id}">تعديل</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-delete-player="${p.id}">حذف</button>
        </div>
      </div>`;
  }

  _wire(container, groups) {
    const searchInput = container.querySelector("#player-search");
    searchInput.addEventListener("input", e => {
      this._searchQuery = e.target.value;
      this.render(container);
    });
    if (document.activeElement !== searchInput && this._searchQuery) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }

    container.querySelector("#filter-status").addEventListener("change", e => { this._statusFilter = e.target.value; this.render(container); });
    container.querySelector("#filter-group").addEventListener("change", e => { this._groupFilter = e.target.value; this.render(container); });
    container.querySelector("#sort-by").addEventListener("change", e => { this._sortBy = e.target.value; this.render(container); });

    container.querySelector("#add-player-btn").addEventListener("click", () => {
      this._openForm(container, null, groups);
    });

    container.querySelectorAll("[data-open-profile]").forEach(el => {
      el.addEventListener("click", () => this._router.navigate("player", el.dataset.openProfile));
    });

    container.querySelectorAll("[data-edit-player]").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.editPlayer);
        const player = await this._service.getPlayer(id);
        this._openForm(container, player, groups);
      });
    });

    container.querySelectorAll("[data-delete-player]").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.deletePlayer);
        if (!confirm("هل تريد حذف هذا اللاعب؟ (يمكن استرجاعه لاحقًا من قِبل الإدارة)")) return;
        await this._service.softDeletePlayer(id);
        toast("تم حذف اللاعب");
        this.render(container);
      });
    });
  }

  _openForm(container, existing, groups) {
    const isEdit = !!existing;
    const p = existing || { name:"", membershipNo:"", playerCode:"", gender:"ذكر", birthYear:"", weight:"", belt:"", club:"", address:"", phone:"", status:"active", groupId:"", notes:"" };

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
                <select name="status">${PLAYER_STATUSES.map(s=>`<option value="${s}" ${s===p.status?"selected":""}>${STATUS_LABELS_AR[s]}</option>`).join("")}</select>
              </div>
              <div class="field"><label>المجموعة</label>
                <select name="groupId">
                  <option value="">— بدون —</option>
                  ${groups.map(g=>`<option value="${g.id}" ${String(g.id)===String(p.groupId)?"selected":""}>${escapeHtml(g.name)}</option>`).join("")}
                </select>
              </div>
            </div>
            <div class="grid2">
              <div class="field"><label>العنوان</label><input type="text" name="address" value="${escapeHtml(p.address)}"></div>
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
