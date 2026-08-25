import { createAttendanceData, ATTENDANCE_STATUSES } from "../models/Attendance.js";
import { eventBus } from "../core/EventBus.js";
import { ValidationError } from "./errors.js";
export { ValidationError };

function validate(data) {
  if (!data.playerId) throw new ValidationError("الرجاء اختيار اللاعب");
  const status = data.status || "present";
  if (!ATTENDANCE_STATUSES.includes(status)) throw new ValidationError("حالة الحضور غير صحيحة");
  return {
    playerId: Number(data.playerId),
    date: data.date || new Date().toISOString().slice(0, 10),
    status,
    notes: (data.notes || "").trim(),
  };
}

/**
 * AttendanceService — one record per (player, date). Prevents duplicate
 * records for the same player on the same date (per spec ATT-005) by
 * updating the existing record instead of creating a second one.
 */
export class AttendanceService {
  /** @param {import("../database/repositories/AttendanceRepository.js").AttendanceRepository} repo */
  constructor(repo) {
    this._repo = repo;
  }

  async recordAttendance(rawData) {
    const clean = validate(rawData);
    const existing = await this._repo.findByPlayerAndDate(clean.playerId, clean.date);
    let record;
    if (existing) {
      record = await this._repo.update(existing.id, { ...clean, updatedAt: new Date().toISOString() });
    } else {
      record = await this._repo.create(createAttendanceData(clean));
    }
    eventBus.emit("attendance:changed", record);
    return record;
  }

  async getForPlayer(playerId) {
    return this._repo.findByPlayer(Number(playerId));
  }

  async getForDate(date) {
    return this._repo.findByDate(date);
  }

  /** Percentage of "present" among all recorded days for this player. */
  async getAttendancePercent(playerId) {
    const records = await this.getForPlayer(playerId);
    if (records.length === 0) return null;
    const present = records.filter(r => r.status === "present").length;
    return Math.round((present / records.length) * 1000) / 10;
  }
}
