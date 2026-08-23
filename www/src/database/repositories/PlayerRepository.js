import { createPlayerData } from "../../models/Player.js";

const PLAYER_PREFIX = "judo:player:";
const NEXT_ID_KEY = "judo:meta:playerNextId";

/**
 * PlayerRepository — the ONLY place that knows the storage KEY SCHEME
 * for players. It depends exclusively on the StorageAdapter interface
 * (constructor-injected) — it has ZERO knowledge of whether that adapter
 * is backed by localStorage, IndexedDB, or anything else.
 *
 * Storage layout (per SRS explicit requirement — NOT one big blob):
 *   judo:player:1          -> { id:1, name:"...", ... }
 *   judo:player:2          -> { id:2, name:"...", ... }
 *   judo:meta:playerNextId -> 3   (auto-increment counter)
 *
 * This per-record layout is what makes the Phase 2 swap to IndexedDB
 * natural: each key becomes one IndexedDB record, no restructuring needed.
 */
export class PlayerRepository {
  /** @param {import("../adapters/StorageAdapter.js").StorageAdapter} adapter */
  constructor(adapter) {
    this._adapter = adapter;
  }

  async _nextId() {
    const current = (await this._adapter.get(NEXT_ID_KEY)) ?? 0;
    const next = current + 1;
    await this._adapter.set(NEXT_ID_KEY, next);
    return next;
  }

  /**
   * @param {Partial<import("../../models/Player.js").Player>} data
   * @returns {Promise<import("../../models/Player.js").Player>}
   */
  async createPlayer(data) {
    const id = await this._nextId();
    const player = { id, ...createPlayerData(data) };
    await this._adapter.set(PLAYER_PREFIX + id, player);
    return player;
  }

  /** @returns {Promise<import("../../models/Player.js").Player|null>} */
  async getPlayer(id) {
    return this._adapter.get(PLAYER_PREFIX + id);
  }

  /**
   * @param {{includeDeleted?: boolean}} [opts]
   * @returns {Promise<import("../../models/Player.js").Player[]>}
   */
  async getAllPlayers(opts = {}) {
    const rows = await this._adapter.list(PLAYER_PREFIX);
    let players = rows.map(r => r.value).filter(Boolean);
    if (!opts.includeDeleted) players = players.filter(p => !p.deletedAt);
    players.sort((a, b) => a.id - b.id);
    return players;
  }

  /**
   * @param {number} id
   * @param {Partial<import("../../models/Player.js").Player>} patch
   * @returns {Promise<import("../../models/Player.js").Player>}
   */
  async updatePlayer(id, patch) {
    const existing = await this.getPlayer(id);
    if (!existing) throw new Error(`Player ${id} not found`);
    const updated = { ...existing, ...patch, id: existing.id, updatedAt: new Date().toISOString() };
    await this._adapter.set(PLAYER_PREFIX + id, updated);
    return updated;
  }

  /** @param {number} id */
  async softDeletePlayer(id) {
    return this.updatePlayer(id, { deletedAt: new Date().toISOString() });
  }

  /**
   * Case-insensitive search across name / membershipNo / phone.
   * @param {string} query
   * @param {{includeDeleted?: boolean}} [opts]
   */
  async searchPlayers(query, opts = {}) {
    const all = await this.getAllPlayers(opts);
    const q = (query || "").trim().toLowerCase();
    if (!q) return all;
    return all.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.membershipNo || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q)
    );
  }
}
