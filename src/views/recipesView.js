// RecipeMate — Recipes List View
import { state, filterOptions, getProficiency } from '../app.js';
import { renderCard, escapeHtml } from '../components/recipeCard.js';

export function renderRecipes() {
  const kw = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const allRecipes = [...state.recipes, ...state.customRecipes];

  let list;
  if (state.currentView === 'favorites') {
    list = allRecipes.filter(r => state.favorites.has(r.id));
  } else {
    list = allRecipes;
  }

  // Apply filter
  if (state.currentFilter === '简单' || state.currentFilter === '中等' || state.currentFilter === '困难') {
    list = list.filter(r => r.difficulty === state.currentFilter);
  }
  if (state.currentFilter === 'faved') {
    list = list.filter(r => state.favorites.has(r.id));
  }
  if (state.currentFilter === 'master') {
    list = list.filter(r => (state.proficiency[r.id]?.level || '新手') === '大师');
  }

  // Apply keyword search
  if (kw) {
    list = list.filter(r =>
      r.title.toLowerCase().includes(kw) ||
      (r.tags || []).some(t => t.toLowerCase().includes(kw)) ||
      (r.ingredients || []).some(i =>
        (typeof i === 'string' ? i : (i.name || '')).toLowerCase().includes(kw)
      )
    );
  }

  const label = state.currentView === 'favorites' ? '❤️ 收藏' : '📖 我的菜谱';

  return `
    <div class="top-bar">
      <span class="brand">🍳 RecipeMate</span>
      <span class="user" onclick="App.showSettings()">👤 ${state.session?.user?.email || ''} ›</span>
    </div>
    <div class="search-row">
      <span class="sicon">🔍</span>
      <input id="searchInput" placeholder="搜索菜名、食材..." value="${escapeHtml(kw ? kw : '')}" oninput="App.render()">
      ${kw ? `<span class="sclear" onclick="document.getElementById('searchInput').value='';App.render()">✕</span>` : ''}
    </div>
    <div class="row-btns">
      <button class="act-btn primary" onclick="App.createRecipe()">➕ 自建菜谱</button>
      <button class="act-btn" onclick="App.apiSearch()">🌐 在线海量搜索</button>
    </div>
    <div class="filter-row">
      ${filterOptions.map(f =>
        `<span class="filter-chip${state.currentFilter === f.key ? ' active' : ''}" onclick="App.setFilter('${f.key}')">${f.label}</span>`
      ).join('')}
    </div>
    <div class="content">
      <div style="font-size:13px;color:#999;margin-bottom:10px">${label} · ${list.length} 道</div>
      ${list.length === 0
        ? `<div class="empty">${state.currentView === 'favorites' ? '还没有收藏 😢' : '没有找到匹配的菜'}</div>`
        : list.map(r => renderCard(r)).join('')
      }
    </div>
    ${renderNav(state.currentView)}`;
}

function renderNav(current) {
  return `<div class="nav">
    <button onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
    <button class="${current === 'recipes' || current === 'favorites' ? 'active' : ''}" onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
    <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
    <button class="${current === 'shop' ? 'active' : ''}" onclick="App.navTo('shop')"><span class="ico">🛒</span>清单</button>
  </div>`;
}
