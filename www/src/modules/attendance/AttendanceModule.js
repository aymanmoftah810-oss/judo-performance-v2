import { toast } from "../../utils/toast.js";
import { ValidationError } from "../../services/errors.js";

export class AttendanceModule {
  constructor({ playerService, attendanceService }) {
    this._playerService = playerService;
    this._attendanceService = attendanceService;
    this._selectedDate = new Date().toISOString().slice(0, 10);
  }

  async render(container) {
    const players = await this._playerService.getAllPlayers({ status: "active" });
    const todayRecords = await this._attendanceService.getForDate(this._selectedDate);
    const recordByPlayer = new Map(todayRecords.map(r => [r.playerId, r]));

    container.innerHTML = `
      <div class="page-attendance">
        <div class="page-header"><h2>الحضور</h2></div>

        <div class="card">
          <div class="field" style="margin-bottom:0;"><label>التاريخ</label>
            <input type="date" id="att-date" value="${this._selectedDate}">
          </div>
        </div>

        <div class="card">
          ${players.length === 0 ? `<div class="muted">لا يوجد لاعبون نشطون</div>` : `
          <div class="attendance-list">
            ${players.map(p => {
              const rec = recordByPlayer.get(p.id);
              const status = rec ? rec.status : "";
              return `
              <div class="attendance-row" data-player-id="${p.id}">
                <div class="player-name">${escapeHtml(p.name)}</div>
                <div class="att-buttons">
                  <button class="att-btn ${status==="present"?"active present":""}" data-att-status="present">حاضر</button>
                  <button class="att-btn ${status==="absent"?"active absent":""}" data-att-status="absent">غائب</button>
                  <button class="att-btn ${status==="injured"?"active injured":""}" data-att-status="injured">مصاب</button>
                </div>
              </div>`;
            }).join("")}
          </div>`}
        </div>
      </div>
    `;

    container.querySelector("#att-date").addEventListener("change", e => {
      this._selectedDate = e.target.value;
      this.render(container);
    });

    container.querySelectorAll(".attendance-row").forEach(row => {
      const playerId = row.dataset.playerId;
      row.querySelectorAll("[data-att-status]").forEach(btn => {
        btn.addEventListener("click", async () => {
          try {
            await this._attendanceService.recordAttendance({
              playerId, date: this._selectedDate, status: btn.dataset.attStatus,
            });
            toast("تم تسجيل الحضور");
            this.render(container);
          } catch (err) {
            if (err instanceof ValidationError) toast(err.message, { type: "error" });
            else throw err;
          }
        });
      });
    });
  }
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
