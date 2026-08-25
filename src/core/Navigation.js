const NAV_ITEMS = [
  { route: "dashboard", label: "الرئيسية", icon: "🏠" },
  { route: "players", label: "اللاعبون", icon: "👥" },
  { route: "testentry", label: "الاختبارات", icon: "📝" },
  { route: "attendance", label: "الحضور", icon: "🗓️" },
  { route: "reports", label: "التقارير", icon: "📊" },
  { route: "settings", label: "الإعدادات", icon: "⚙️" },
];

/**
 * Navigation — renders the bottom nav bar and highlights the active tab.
 * Purely presentational; delegates actual navigation to Router.
 */
export function renderNavigation(router) {
  const el = document.getElementById("bottom-nav");
  if (!el) return;
  const current = router.currentRouteName();
  el.innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-item ${current === item.route ? "active" : ""}" data-nav="${item.route}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </button>
  `).join("");
  el.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => router.navigate(btn.dataset.nav));
  });
}

export { NAV_ITEMS };
