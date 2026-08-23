import { StorageAdapter } from "./StorageAdapter.js";

/**
 * LocalStorageAdapter — Phase 1 storage backend.
 *
 * This is the ONLY file in the entire project allowed to reference
 * `window.localStorage` directly. Repositories, Services, and UI modules
 * must never touch localStorage / IndexedDB themselves — they only know
 * the StorageAdapter interface (get/set/delete/list).
 *
 * In Phase 2 this file is replaced by IndexedDBAdapter.js, which implements
 * the exact same interface. Nothing outside /src/database/adapters/ changes.
 */
export class LocalStorageAdapter extends StorageAdapter {
  async get(key) {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    try { return JSON.parse(raw); }
    catch { return null; }
  }

  async set(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  async delete(key) {
    window.localStorage.removeItem(key);
  }

  async list(prefix) {
    const out = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const value = await this.get(key);
        out.push({ key, value });
      }
    }
    return out;
  }
}
