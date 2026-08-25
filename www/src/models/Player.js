/**
 * Player — plain data model. No storage knowledge, no UI knowledge.
 *
 * PHASE 2 CHANGES (see PHASE2 report for full reasoning):
 *
 * - Status values changed from Arabic (مقيد/حديث/متوقف) to the English
 *   canonical enum requested by the Phase 2 spec (active/new/suspended).
 *   Existing records with the old Arabic values are migrated automatically
 *   and losslessly by PlayerRepository on read (see _normalize() there) —
 *   no data is lost, nothing needs to run manually.
 *   STATUS_LABELS_AR below maps canonical -> Arabic label for display,
 *   so the UI stays 100% Arabic while the stored/code-facing value is
 *   the stable English enum requested by the spec.
 *
 * - Added: playerCode, address, joinDate, groupId (all new, backward compatible
 *   - existing records get sensible defaults filled in automatically, nothing
 *   is deleted or renamed).
 *
 * - Deliberately NOT added: `fullName`, `birthDate`, stored `age`.
 *   `fullName` would just duplicate the existing `name` field under a new
 *   name — kept `name` as the single source of truth to avoid two fields
 *   that must always match (a self-inflicted drift bug waiting to happen).
 *   `birthDate` / full date-of-birth is explicitly excluded by an earlier,
 *   repeatedly-confirmed hard requirement: age is computed from birth YEAR
 *   only (currentYear - birthYear), never from a full date. Adding a
 *   birthDate field would invite exactly the drift this rule exists to
 *   prevent. `age` is exposed as a computed helper (getAge below), not a
 *   stored field, so it can never go stale.
 */
export const PLAYER_STATUSES = Object.freeze(["active", "new", "suspended"]);
export const STATUS_LABELS_AR = Object.freeze({ active: "مقيد", new: "حديث", suspended: "متوقف" });
export const GENDERS = Object.freeze(["ذكر", "أنثى"]);

// Legacy Arabic status values (Phase 1) -> new canonical English values.
export const LEGACY_STATUS_MAP = Object.freeze({ "مقيد": "active", "حديث": "new", "متوقف": "suspended" });

/**
 * @typedef {Object} Player
 * @property {number} id
 * @property {string} name
 * @property {string} membershipNo
 * @property {string} playerCode        new in Phase 2 (defaults from membershipNo)
 * @property {"ذكر"|"أنثى"} gender
 * @property {number} birthYear
 * @property {number|null} weight
 * @property {string} belt
 * @property {string} club
 * @property {string} address           new in Phase 2
 * @property {string} phone
 * @property {"active"|"new"|"suspended"} status
 * @property {number|null} groupId      new in Phase 2, references Group.id
 * @property {string} joinDate          new in Phase 2, ISO date (YYYY-MM-DD)
 * @property {string} notes
 * @property {string|null} deletedAt    ISO timestamp, or null if active
 * @property {string} createdAt         ISO timestamp
 * @property {string} updatedAt         ISO timestamp
 */

/**
 * Build a new Player object with defaults filled in. Does NOT assign an id
 * (the Repository owns id assignment) and does NOT persist anything.
 * @param {Partial<Player>} data
 * @returns {Omit<Player,"id">}
 */
export function createPlayerData(data) {
  const now = new Date().toISOString();
  const membershipNo = data.membershipNo ?? "";
  return {
    name: data.name ?? "",
    membershipNo,
    playerCode: data.playerCode ?? membershipNo,
    gender: data.gender ?? "ذكر",
    birthYear: data.birthYear ?? null,
    weight: data.weight ?? null,
    belt: data.belt ?? "",
    club: data.club ?? "",
    address: data.address ?? "",
    phone: data.phone ?? "",
    status: data.status ?? "active",
    groupId: data.groupId ?? null,
    joinDate: data.joinDate ?? now.slice(0, 10),
    notes: data.notes ?? "",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function isDeleted(player) {
  return !!player.deletedAt;
}

/** Age computed from birth year only (hard requirement - never use a full birth date). */
export function getAge(player) {
  if (!player.birthYear) return null;
  return new Date().getFullYear() - Number(player.birthYear);
}

export function statusLabelAr(status) {
  return STATUS_LABELS_AR[status] || status;
}
