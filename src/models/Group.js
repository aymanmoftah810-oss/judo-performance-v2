/**
 * Group — training group/team. Players can optionally belong to one.
 * @typedef {Object} Group
 * @property {number} id
 * @property {string} name
 * @property {string} coach
 * @property {string} description
 * @property {boolean} active
 * @property {string} createdAt
 * @property {string} updatedAt
 */
export function createGroupData(data) {
  const now = new Date().toISOString();
  return {
    name: data.name ?? "",
    coach: data.coach ?? "",
    description: data.description ?? "",
    active: data.active ?? true,
    createdAt: now,
    updatedAt: now,
  };
}
