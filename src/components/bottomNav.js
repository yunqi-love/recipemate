// RecipeMate — Unified Bottom Navigation
// Single source of truth: all pages use this same 5-tab nav.
// NEVER add hand-written <div class="nav"> anywhere else.

const TABS = [
  { view: 'home',        ico: '🏠', label: '首页' },
  { view: 'recipes',     ico: '📖', label: '菜谱' },
  { view: 'favorites',   ico: '❤️', label: '收藏' },
  { view: 'weeklyMenu',  ico: '📅', label: '周计划' },
  { view: 'shop',        ico: '🛒', label: '清单' }
];

/**
 * Render unified bottom nav. Call this ONCE at the bottom of every main page.
 * @param {string} current — the current view key (e.g. 'home', 'recipes', …)
 */
export function renderBottomNav(current) {
  return `<div class="nav">
    ${TABS.map(t => {
      const isActive = current === t.view;
      return `<button class="${isActive ? 'active' : ''}" onclick="App.navTo('${t.view}')">
        <span class="ico">${t.ico}</span>${t.label}
      </button>`;
    }).join('')}
  </div>`;
}
