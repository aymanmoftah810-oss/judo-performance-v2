/**
 * EventBus — minimal pub-sub so modules can react to changes without
 * importing each other directly. Example (future phases):
 *   PlayerService emits "player:changed" after any mutation;
 *   Dashboard module subscribes without knowing anything about Players.
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  on(eventName, handler) {
    if (!this._listeners.has(eventName)) this._listeners.set(eventName, new Set());
    this._listeners.get(eventName).add(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    this._listeners.get(eventName)?.delete(handler);
  }

  emit(eventName, payload) {
    this._listeners.get(eventName)?.forEach(handler => {
      try { handler(payload); }
      catch (err) { console.error(`[EventBus] listener for "${eventName}" threw:`, err); }
    });
  }
}

// Shared singleton for the whole app.
export const eventBus = new EventBus();
