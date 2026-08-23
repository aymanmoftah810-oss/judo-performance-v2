/**
 * StorageAdapter — the ONLY contract that repositories are allowed to depend on.
 *
 * Every method is async (returns a Promise) even though LocalStorageAdapter's
 * underlying API (window.localStorage) is synchronous. This is intentional:
 * IndexedDBAdapter (Phase 2) is inherently async, and the whole point of this
 * interface is that PlayerRepository / PlayerService / the UI never need to
 * change when we swap the adapter underneath them.
 *
 * Keys are opaque strings. Values are plain JSON-serializable objects
 * (the adapter handles serialization internally — callers never touch
 * JSON.stringify/parse themselves).
 *
 * @interface StorageAdapter
 */
export class StorageAdapter {
  /**
   * @param {string} key
   * @returns {Promise<any|null>} the stored value, or null if not found
   */
  async get(key) { throw new Error("StorageAdapter.get() not implemented"); }

  /**
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async set(key, value) { throw new Error("StorageAdapter.set() not implemented"); }

  /**
   * @param {string} key
   * @returns {Promise<void>}
   */
  async delete(key) { throw new Error("StorageAdapter.delete() not implemented"); }

  /**
   * List all values whose key starts with `prefix`.
   * @param {string} prefix
   * @returns {Promise<{key:string, value:any}[]>}
   */
  async list(prefix) { throw new Error("StorageAdapter.list() not implemented"); }
}
