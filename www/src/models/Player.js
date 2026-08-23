/**
 * Player — plain data model. No storage knowledge, no UI knowledge.
 *
 * Status is intentionally limited to 3 real membership states.
 * Deletion is a SEPARATE concern (deletedAt), not a 4th status value —
 * this keeps "is this player currently مقيد/حديث/متوقف" and
 * "has this player been removed" as two independent questions,
 * matching the SRS's soft-delete requirement.
 */
export const PLAYER_STATUSES = Object.freeze(["مقيد", "حديث", "متوقف"]);
export const GENDERS = Object.freeze(["ذكر", "أنثى"]);

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} membershipNo
 * @property {"ذكر"|"أنثى"} gender
 * @property {number} birthYear
 * @property {number|null} weight
 * @property {string} belt
 * @property {string} club
 * @property {string} phone
 * @property {"مقيد"|"حديث"|"متوقف"} status
 * @property {string} notes
 * @property {string|null} deletedAt   ISO timestamp, or null if active
 * @property {string} createdAt        ISO timestamp
 * @property {string} updatedAt        ISO timestamp
 */

/**
 * Build a new Player object with defaults filled in. Does NOT assign an id
 * (the Repository owns id assignment) and does NOT persist anything.
 * @param {Partial<Player>} data
 * @returns {Omit<Player,"id">}
 */
export function createPlayerData(data) {
  const now = new Date().toISOString();
  return {
    name: data.name ?? "",
    membershipNo: data.membershipNo ?? "",
    gender: data.gender ?? "ذكر",
    birthYear: data.birthYear ?? null,
    weight: data.weight ?? null,
    belt: data.belt ?? "",
    club: data.club ?? "",
    phone: data.phone ?? "",
    status: data.status ?? "مقيد",
    notes: data.notes ?? "",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isDeleted(player) {
  return !!player.deletedAt;
}
