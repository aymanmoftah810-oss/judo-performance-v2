/**
 * Store — reserved for future cross-module UI state (e.g. "currently
 * selected season" shared between Dashboard/Attendance/Reports).
 *
 * Not used in Phase 1: the Players module is self-contained and gets
 * everything it needs from PlayerService directly. This file exists now
 * so the project folder structure matches the full planned architecture;
 * it will be implemented for real when a later phase actually needs
 * state shared across more than one module.
 */
export class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._listeners = new Set();
  }
  getState() { return this._state; }
  setState(patch) {
    this._state = { ...this._state, ...patch };
    this._listeners.forEach(fn => fn(this._state));
  }
  subscribe(fn) { this._listeners.add(fn); return () => this._listeners.delete(fn); }
}
