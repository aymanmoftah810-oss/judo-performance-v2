/**
 * BaseRepository — generic per-record CRUD over a StorageAdapter, using the
 * same key-per-record scheme as PlayerRepository (never one big blob):
 *   <prefix>1, <prefix>2, ...   and   judo:meta:<entityName>NextId
 *
 * New Phase 2 entities (Group, Test, TestResult, Standard, Attendance)
 * extend this instead of duplicating the same boilerplate 5 times.
 * PlayerRepository (Phase 1, already tested and working) is intentionally
 * left untouched/independent rather than retrofitted onto this base class,
 * per the "don't touch working Phase 1 code without need" instruction.
 */
export class BaseRepository {
  /**
   * @param {import("../adapters/StorageAdapter.js").StorageAdapter} adapter
   * @param {string} entityName  e.g. "group" -> keys "judo:group:N"
   */
  constructor(adapter, entityName) {
    this._adapter = adapter;
    this._prefix = `judo:${entityName}:`;
    this._nextIdKey = `judo:meta:${entityName}NextId`;
  }

  async _nextId() {
    const current = (await this._adapter.get(this._nextIdKey)) ?? 0;
    const next = current + 1;
    await this._adapter.set(this._nextIdKey, next);
    return next;
  }

  async create(data) {
    const id = await this._nextId();
    const record = { id, ...data };
    await this._adapter.set(this._prefix + id, record);
    return record;
  }

  async get(id) {
    return this._adapter.get(this._prefix + id);
  }

  async getAll() {
    const rows = await this._adapter.list(this._prefix);
    return rows.map(r => r.value).filter(Boolean).sort((a, b) => a.id - b.id);
  }

  async update(id, patch) {
    const existing = await this.get(id);
    if (!existing) throw new Error(`${this._prefix}${id} not found`);
    const updated = { ...existing, ...patch, id: existing.id };
    if ("updatedAt" in existing) updated.updatedAt = new Date().toISOString();
    await this._adapter.set(this._prefix + id, updated);
    return updated;
  }

  async delete(id) {
    await this._adapter.delete(this._prefix + id);
  }

  /** Seed the store from `seedRows` ONLY if it is currently empty (first run). */
  async seedIfEmpty(seedRows) {
    const existing = await this.getAll();
    if (existing.length > 0) return existing;
    const created = [];
    for (const row of seedRows) created.push(await this.create(row));
    return created;
  }
}
