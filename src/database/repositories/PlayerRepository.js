import { createPlayerData, LEGACY_STATUS_MAP, PLAYER_STATUSES } from "../../models/Player.js";

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
 *
 * PHASE 2: _normalize() below lazily migrates any Phase 1 record on every
 * read — old Arabic status values (مقيد/حديث/متوقف) become the new
 * canonical English enum, and any Phase 2 field missing from an old record
 * (playerCode, address, joinDate, groupId) gets a sensible default. This is
 * idempotent (already-migrated records pass through unchanged) and requires
 * no explicit migration step or schema-version bookkeeping — existing
 * players are never lost or altered destructively.
 */
export class PlayerRepository {
  /** @param {import("../adapters/StorageAdapter.js").StorageAdapter} adapter */
  constructor(adapter) {
    this._adapter = adapter;
  }

  /** Lazily upgrade a Phase 1 (or older Phase 2) record to the current shape. */
  _normalize(player) {
    if (!player) return player;
    let status = player.status;
    if (LEGACY_STATUS_MAP[status]) status = LEGACY_STATUS_MAP[status];
    if (!PLAYER_STATUSES.includes(status)) status = "active";
    return {
      ...player,
      status,
      playerCode: player.playerCode ?? player.membershipNo ?? "",
      address: player.address ?? "",
      joinDate: player.joinDate ?? (player.createdAt ? player.createdAt.slice(0, 10) : ""),
      groupId: player.groupId ?? null,
    };
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
    return this._normalize(await this._adapter.get(PLAYER_PREFIX + id));
  }

  /**
   * @param {{includeDeleted?: boolean, status?: string, groupId?: number}} [opts]
   * @returns {Promise<import("../../models/Player.js").Player[]>}
   */
  async getAllPlayers(opts = {}) {
    const rows = await this._adapter.list(PLAYER_PREFIX);
    let players = rows.map(r => this._normalize(r.value)).filter(Boolean);
    if (!opts.includeDeleted) players = players.filter(p => !p.deletedAt);
    if (opts.status) players = players.filter(p => p.status === opts.status);
    if (opts.groupId !== undefined) players = players.filter(p => p.groupId === opts.groupId);
    players.sort((a, b) => a.id - b.id);
    return players;
  }

  /**
   * @param {number} id
   * @param {Partial<import("../../models/Player.js").Player>} patch
   * @returns {Promise<import("../../models/Player.js").Player>}
   */
  async updatePlayer(id, patch) {
    const existing = await this._adapter.get(PLAYER_PREFIX + id);
    if (!existing) throw new Error(`Player ${id} not found`);
    const updated = { ...this._normalize(existing), ...patch, id: existing.id, updatedAt: new Date().toISOString() };
    await this._adapter.set(PLAYER_PREFIX + id, updated);
    return updated;
  }

  /** @param {number} id */
  async softDeletePlayer(id) {
    return this.updatePlayer(id, { deletedAt: new Date().toISOString() });
  }

  /**
   * Case-insensitive search across name / membershipNo / playerCode / phone.
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
      (p.playerCode || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q)
    );
  }
}
