// RecipeMate — Recipes List View (Modern filter system)
import { state, getProficiency } from '../app.js';
import { renderCard, escapeHtml } from '../components/recipeCard.js';

// Import filter function dynamically resolved at call time
// (circular dependency avoidance: state is imported from app.js,
//  and applyRecipeFilters is called via window.App.applyRecipeFilters)

export function renderRecipes() {
  const kw = state.searchKeyword || '';
  const allRecipes = [...state.recipes, ...state.customRecipes];

  let list;
  if (state.currentView === 'favorites') {
    list = allRecipes.filter(r => state.favorites.has(r.id));
  } else {
    list = allRecipes;
  }

  // Apply legacy keyword search
  if (kw) {
    list = list.filter(r =>
      r.title.toLowerCase().includes(kw.toLowerCase()) ||
      (r.tags || []).some(t => t.toLowerCase().includes(kw.toLowerCase())) ||
      (r.ingredients || []).some(i =>
        (typeof i === 'string' ? i : (i.name || '')).toLowerCase().includes(kw.toLowerCase())
      )
    );
  }

  // Apply modern multi-dimension filters
  if (state.recipeFilters && window.App?._applyFilters) {
    list = window.App._applyFilters(list, state.recipeFilters);
  }

  // Apply legacy quick filter (currentFilter) as override
  if (state.currentFilter === 'faved') {
    list = list.filter(r => state.favorites.has(r.id));
  }
  if (state.currentFilter === 'master') {
    list = list.filter(r => (state.proficiency[r.id]?.level || '新手') === '大师');
  }
  if (state.recipeFilters?.quick === 'recent') {
    list = list.filter(r => (state.cookedMap[r.id]?.count || 0) > 0)
      .sort((a, b) => new Date(state.cookedMap[b.id]?.last || 0) - new Date(state.cookedMap[a.id]?.last || 0));
  }
  if (state.recipeFilters?.quick === 'quick') {
    list = list.filter(r => (r.cook_time || 30) <= 30 && r.difficulty !== '困难');
  }
  if (state.recipeFilters?.quick === 'weekend') {
    list = list.filter(r => r.difficulty === '中等' || r.difficulty === '困难');
  }

  const label = state.currentView === 'favorites' ? '❤️ 收藏' : '📖 我的菜谱';
  const activeCount = getActiveFilterSummaryDisplay();
  const summaryText = activeCount.length > 0 ? ' · ' + activeCount.join(' · ') : '';

  return `
    <div class="top-bar">
      <span class="brand">🍳 RecipeMate</span>
      <span class="user" onclick="App.showSettings()">👤 ${state.session?.user?.email || ''} ›</span>
    </div>
    <div class="search-row">
      <span class="sicon">🔍</span>
      <input id="searchInput" placeholder="搜索菜名、食材、标签..." value="${escapeHtml(kw)}" oninput="App.handleSearchInput(this.value)">
      ${kw ? `<span class="sclear" onclick="App.clearSearch()">✕</span>` : ''}
    </div>
    <div class="row-btns">
      <button class="act-btn primary" onclick="App.createRecipe()">➕ 自建菜谱</button>
      <button class="act-btn" onclick="App.apiSearch()">🌐 在线海量搜索</button>
    </div>
    <!-- Quick filter scroll -->
    <div class="quick-filter-scroll">
      ${renderQuickFilterChip('全部', 'all')}
      ${renderQuickFilterChip('⭐ 已收藏', 'faved')}
      ${renderQuickFilterChip('🔥 最近做过', 'recent')}
      ${renderQuickFilterChip('⚡ 快速晚餐', 'quick')}
      ${renderQuickFilterChip('👫 二人食', 'duo')}
      ${renderQuickFilterChip('🍳 周末尝鲜', 'weekend')}
      <span class="filter-chip filter-more-btn" onclick="App.openRecipeFilterPanel()">⚙ 筛选${activeCount.length > 0 ? ' ' + activeCount.length : ''}</span>
    </div>
    <!-- Active filter summary -->
    ${activeCount.length > 0 ? `<div class="filter-summary">
      <span class="filter-summary-text">已筛选：${activeCount.join(' · ')}</span>
      <span class="filter-summary-reset" onclick="App.resetRecipeFilters()">重置</span>
    </div>` : ''}
    <div class="content">
      <div style="font-size:13px;color:#999;margin-bottom:10px">${label} · ${list.length} 道${summaryText}</div>
      ${list.length === 0
        ? renderEmptyState(kw, activeCount)
        : list.map(r => renderCard(r)).join('')
      }
    </div>
    ${renderNav(state.currentView)}`;
}

function renderQuickFilterChip(label, key) {
  const active = (state.recipeFilters?.quick || state.currentFilter) === key;
  return `<span class="filter-chip${active ? ' active' : ''}" onclick="App.setFilter('${key}')">${label}</span>`;
}

function renderEmptyState(kw, activeCount) {
  if (activeCount.length > 0) {
    return `<div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">没有找到符合条件的菜</div>
      <div class="empty-state-desc">试试减少筛选条件</div>
      <button class="btn btn-outline btn-sm" onclick="App.resetRecipeFilters()" style="margin-top:12px">🔄 重置筛选</button>
    </div>`;
  }
  if (kw) {
    return `<div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">没有找到"${escapeHtml(kw)}"</div>
      <div class="empty-state-desc">试试其他关键词，或使用在线搜索</div>
    </div>`;
  }
  if (state.currentView === 'favorites') {
    return `<div class="empty-state">
      <div class="empty-state-icon">❤️</div>
      <div class="empty-state-title">还没有收藏任何菜谱</div>
      <div class="empty-state-desc">先去搜索一道想学的菜吧</div>
      <button class="btn btn-outline btn-sm" onclick="App.navTo('recipes')" style="margin-top:12px">📖 浏览菜谱</button>
    </div>`;
  }
  return `<div class="empty-state">
    <div class="empty-state-icon">📖</div>
    <div class="empty-state-title">还没有菜谱</div>
    <div class="empty-state-desc">创建你的第一道菜谱或使用在线搜索</div>
  </div>`;
}

function getActiveFilterSummaryDisplay() {
  const f = state.recipeFilters;
  if (!f) return [];
  const parts = [];
  if (f.quick && f.quick !== 'all') {
    const labels = { faved: '已收藏', recent: '最近做过', quick: '快速晚餐', duo: '二人食', weekend: '周末尝鲜' };
    parts.push(labels[f.quick] || f.quick);
  }
  if (f.difficulty && f.difficulty !== 'all') parts.push(f.difficulty);
  if (f.time && f.time !== 'all') {
    parts.push(f.time === '15m' ? '15分钟内' : f.time === '30m' ? '30分钟内' : f.time === '60m' ? '60分钟内' : '周末慢慢做');
  }
  if (f.type && f.type.length > 0) parts.push(f.type[0] + (f.type.length > 1 ? ` +${f.type.length - 1}` : ''));
  if (f.cuisine && f.cuisine.length > 0) parts.push(f.cuisine[0] + (f.cuisine.length > 1 ? ` +${f.cuisine.length - 1}` : ''));
  if (f.scene && f.scene.length > 0) parts.push(f.scene[0] + (f.scene.length > 1 ? ` +${f.scene.length - 1}` : ''));
  return parts;
}

function renderNav(current) {
  return `<div class="nav">
    <button onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
    <button class="${current === 'recipes' || current === 'favorites' ? 'active' : ''}" onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
    <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
    <button class="${current === 'shop' ? 'active' : ''}" onclick="App.navTo('shop')"><span class="ico">🛒</span>清单</button>
  </div>`;
}
