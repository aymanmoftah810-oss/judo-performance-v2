/**
 * Router — minimal hash-based router. Phase 1 only registered one route
 * ("players"); Phase 2 adds more routes plus support for a single path
 * parameter (e.g. "#/player/5") for deep-linkable screens like Player
 * Profile, without changing how existing routes are registered/rendered.
 */
export class Router {
  constructor() {
    /** @type {Map<string, (container: HTMLElement, param?: string) => void|Promise<void>>} */
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
    const [route, param] = hash.split("/");
    return { route: route || this._defaultRoute, param };
  }

  async _render() {
    const { route, param } = this._currentRoute();
    const renderFn = this._routes.get(route);
    if (!this._container) return;
    if (!renderFn) {
      this._container.innerHTML = `<div class="empty-route">الصفحة غير موجودة: ${route}</div>`;
      return;
    }
    await renderFn(this._container, param);
  }

  navigate(routeName, param) {
    window.location.hash = "/" + routeName + (param !== undefined ? "/" + param : "");
  }

  currentRouteName() {
    return this._currentRoute().route;
  }
}
