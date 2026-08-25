/**
 * Attendance — one attendance record for one player on one date.
 * @typedef {Object} Attendance
 * @property {number} id
 * @property {number} playerId
 * @property {string} date        ISO date (YYYY-MM-DD)
 * @property {"present"|"absent"|"injured"} status
 * @property {string} notes
 * @property {string} createdAt
 * @property {string} updatedAt
 */
export const ATTENDANCE_STATUSES = Object.freeze(["present", "absent", "injured"]);
export const ATTENDANCE_LABELS_AR = Object.freeze({ present: "حاضر", absent: "غائب", injured: "مصاب" });

export function createAttendanceData(data) {
  const now = new Date().toISOString();
  return {
    playerId: data.playerId,
    date: data.date ?? now.slice(0, 10),
    status: data.status ?? "present",
    notes: data.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
}
