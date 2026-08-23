/**
 * Router — minimal hash-based router. Phase 1 only registers one route
 * ("players"), but the mechanism supports adding more routes/modules in
 * later phases without changing this file's shape.
 */
export class Router {
  constructor() {
    /** @type {Map<string, (container: HTMLElement) => void|Promise<void>>} */
    this._routes = new Map();
    this._container = null;
    this._defaultRoute = null;
    window.addEventListener("hashchange", () => this._render());
  }

  register(routeName, renderFn, { isDefault = false } = {}) {
    this._routes.set(routeName, renderFn);
    if (isDefault) this._defaultRoute = routeName;
  }

  mount(container) {
    this._container = container;
    this._render();
  }

  _currentRoute() {
    const hash = window.location.hash.replace(/^#\/?/, "");
    return hash || this._defaultRoute;
  }

  async _render() {
    const route = this._currentRoute();
    const renderFn = this._routes.get(route);
    if (!this._container) return;
    if (!renderFn) {
      this._container.innerHTML = `<div class="empty-route">الصفحة غير موجودة: ${route}</div>`;
      return;
    }
    await renderFn(this._container);
  }

  navigate(routeName) {
    window.location.hash = "/" + routeName;
  }
}
