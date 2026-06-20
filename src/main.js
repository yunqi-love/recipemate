// RecipeMate v4 — Main Entry Point
// All public functions are exposed on window.App for HTML onclick handlers.

import { state, updateProficiency } from './app.js';
import { getAIProvider, getAIKey, getAIUrl, getAIModel, saveAISettings } from './config/aiProviders.js';
import { supabase } from './services/supabaseClient.js';
import { toast } from './components/toast.js';

// Services
import { aiNormalizeRecipe, aiRecommend } from './services/aiClient.js';
import { searchAllSources, getSourceRecipeDetail } from './services/recipeSources/index.js';
import {
  searchLocalChineseRecipes, searchLocalByTags,
  getRandomLocalRecipes, getLocalRecipeById,
  loadLocalChineseRecipes, getLocalRecipeCount
} from './services/recipeSources/localChineseRecipeSource.js';

// Stores
import { checkAuth, handleAuth, handleLogout } from './stores/authStore.js';
import {
  loadAllData, getAllRecipes, getRecipeById,
  saveCustomRecipe, updateCustomRecipe, deleteCustomRecipe,
  toggleFav, uploadImage
} from './stores/recipeStore.js';
import { doMarkCooked, incrementCooked, decreaseCooked, getJournalForRecipe, deleteCookingJournal } from './stores/userStateStore.js';
import { addToShoppingList, toggleShopItem, removeShopItem, clearShopItems, clearCheckedShopItems, groupShoppingItemsByRecipe } from './stores/shoppingStore.js';

// Views
import { renderAuth } from './views/authView.js';
import { renderHome, renderNav, renderTodayEatModal } from './views/homeView.js';
import { renderRecipes } from './views/recipesView.js';
import { showDetail, renderCookModal } from './views/detailView.js';
import { renderShop } from './views/shopView.js';
import { showSettings, updateSetForm, doTestAI } from './views/settingsView.js';

// ── Main Render ──
function render() {
  const app = document.getElementById('app');
  if (!app) return;

  // Clear any open modals
  document.querySelectorAll('#cookModal').forEach(e => e.remove());

  if (!state.session) {
    app.innerHTML = renderAuth();
    return;
  }

  if (state.currentView === 'detail' || state.currentView === 'customForm') return;

  if (state.currentView === 'shop') {
    app.innerHTML = renderShop();
    return;
  }

  if (state.currentView === 'home') {
    app.innerHTML = renderHome();
    return;
  }

  // Recipes / Favorites view
  app.innerHTML = renderRecipes();
  // Restore search input state after DOM replacement
  requestAnimationFrame(() => restoreSearchFocus());
}

// ── Navigation ──
function navTo(view) {
  state.currentView = view;
  state.currentFilter = 'all';
  state.currentDetailId = null;
  state.parentView = null;
  // Only clear search when going to home/shop, keep for recipes/favorites
  if (view !== 'recipes' && view !== 'favorites') {
    state.searchKeyword = '';
  }
  render();
}

function setFilter(key) {
  state.currentFilter = key;
  state.recipeFilters.quick = key === 'all' ? 'all' :
    key === 'faved' ? 'faved' :
    key === 'recent' ? 'recent' :
    key === 'quick' ? 'quick' :
    key === 'weekend' ? 'weekend' : key;
  render();
}

// ── Search Input Handler (debounced, won't dismiss keyboard) ──
function handleSearchInput(value) {
  state.searchKeyword = value || '';
  // Save cursor position
  const si = document.getElementById('searchInput');
  if (si) {
    state.searchInputFocused = document.activeElement === si;
    state.searchInputSelStart = si.selectionStart || 0;
    state.searchInputSelEnd = si.selectionEnd || 0;
  }
  // Debounce render — only re-render after user stops typing for 300ms
  clearTimeout(state.searchDebounceTimer);
  state.searchDebounceTimer = setTimeout(() => {
    // Only update results area, not full page — but for now re-render
    renderSearchResults();
  }, 300);
}

function clearSearch() {
  state.searchKeyword = '';
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
  render();
  setTimeout(() => {
    const si2 = document.getElementById('searchInput');
    if (si2) si2.focus();
  }, 50);
}

function renderSearchResults() {
  // Only re-render if we're on the recipes view
  if (state.currentView !== 'recipes' && state.currentView !== 'favorites') return;
  render();
}

// Helper: restore search input focus after full render
function restoreSearchFocus() {
  const si = document.getElementById('searchInput');
  if (si && state.searchInputFocused) {
    si.focus();
    si.setSelectionRange(state.searchInputSelStart, state.searchInputSelEnd);
  }
}

function goBack() {
  state.currentDetailId = null;
  state.currentView = state.parentView || 'recipes';
  state.parentView = null;
  render();
  requestAnimationFrame(() => window.scrollTo({ top: state.savedScrollY || 0, behavior: 'instant' }));
}

// ── Recipe Filter Panel ──
function openRecipeFilterPanel() {
  state.showFilterPanel = true;
  renderFilterSheet();
}

function closeRecipeFilterPanel() {
  state.showFilterPanel = false;
  document.getElementById('filterSheet')?.remove();
}

function renderFilterSheet() {
  document.getElementById('filterSheet')?.remove();
  const f = state.recipeFilters;
  const activeCount = getActiveFilterCount(f);

  const html = `<div class="modal-overlay filter-overlay" id="filterSheet" onclick="if(event.target===this)App.closeRecipeFilterPanel()">
    <div class="filter-sheet">
      <div class="filter-sheet-header">
        <span class="filter-sheet-title">筛选 · ${activeCount > 0 ? activeCount + '项' : '全部'}</span>
        <span class="filter-sheet-close" onclick="App.closeRecipeFilterPanel()">✕</span>
      </div>
      <div class="filter-sheet-body">
        ${renderFilterSection('难度', 'difficulty', ['all','简单','中等','困难','大师级'], ['全部','简单','中等','困难','大师级'], f.difficulty, true)}
        ${renderFilterSection('时间', 'time', ['all','15m','30m','60m','weekend'], ['全部','15分钟内','30分钟内','60分钟内','适合周末慢慢做'], f.time, true)}
        ${renderFilterSectionMulti('菜品类型', 'type', ['荤菜','素菜','主食','汤与粥','甜品','饮品','早餐','水产'], ['荤菜','素菜','主食','汤羹','甜品','饮品','早餐','水产'], f.type)}
        ${renderFilterSectionMulti('场景', 'scene', ['工作日晚餐','二人食','一人食','带饭便当','周末改善','招待朋友','清冰箱'], f.scene)}
        ${renderFilterSectionMulti('菜系/口味', 'cuisine', ['家常菜','川菜','粤菜','鲁菜','湘菜','江浙菜','东北菜','清淡','下饭菜','减脂','快手菜'], f.cuisine)}
        ${renderFilterSection('我的状态', 'userStatus', ['all','faved','cooked','notCooked','recent7','longTime','master'], ['全部','已收藏','做过','没做过','最近7天做过','很久没做','大师级'], f.userStatus, true)}
        ${renderFilterSection('排序', 'sort', ['default','recent','cooked','mostCooked','fastest','easiest','favedFirst'], ['默认推荐','最近保存','最近做过','做过次数最多','时间最短','难度从低到高','收藏优先'], f.sort, true)}
      </div>
      <div class="filter-sheet-footer">
        <button class="btn btn-outline" onclick="App.resetRecipeFilters()" style="flex:1">🔄 重置</button>
        <button class="btn btn-primary" onclick="App.closeRecipeFilterPanel()" style="flex:2">✅ 完成</button>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function renderFilterSection(label, group, keys, labels, current, isSingle) {
  const items = keys.map((k, i) => {
    const active = isSingle ? current === k : (Array.isArray(current) && current.includes(k));
    return `<span class="filter-chip${active ? ' active' : ''}" onclick="App.setRecipeFilter('${group}','${k}',${isSingle})">${labels[i] || k}</span>`;
  }).join('');
  return `<div class="filter-section"><div class="filter-section-title">${label}</div><div class="filter-section-chips">${items}</div></div>`;
}

function renderFilterSectionMulti(label, group, keys, labels, current) {
  const useLabels = labels || keys;
  const items = keys.map((k, i) => {
    const active = Array.isArray(current) && current.includes(k);
    return `<span class="filter-chip${active ? ' active' : ''}" onclick="App.setRecipeFilter('${group}','${k}',false)">${useLabels[i] || k}</span>`;
  }).join('');
  return `<div class="filter-section"><div class="filter-section-title">${label}</div><div class="filter-section-chips">${items}</div></div>`;
}

function setRecipeFilter(group, value, isSingle) {
  if (!state.recipeFilters) state.recipeFilters = {};
  if (isSingle) {
    state.recipeFilters[group] = value;
  } else {
    // Multi-select: toggle
    const arr = state.recipeFilters[group] || [];
    const idx = arr.indexOf(value);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(value);
    state.recipeFilters[group] = arr;
  }
  // Re-render the filter sheet in place
  renderFilterSheet();
  // Apply filters and update recipe list
  render();
  requestAnimationFrame(() => restoreSearchFocus());
}

function resetRecipeFilters() {
  state.recipeFilters = {
    quick: 'all',
    difficulty: 'all',
    time: 'all',
    type: [],
    scene: [],
    cuisine: [],
    userStatus: 'all',
    sort: 'default'
  };
  state.currentFilter = 'all';
  renderFilterSheet();
  render();
  requestAnimationFrame(() => restoreSearchFocus());
  toast('✅ 已重置筛选');
}

function getActiveFilterCount(f) {
  let count = 0;
  if (f.difficulty && f.difficulty !== 'all') count++;
  if (f.time && f.time !== 'all') count++;
  if (f.type && f.type.length > 0) count++;
  if (f.scene && f.scene.length > 0) count++;
  if (f.cuisine && f.cuisine.length > 0) count++;
  if (f.userStatus && f.userStatus !== 'all') count++;
  if (f.sort && f.sort !== 'default') count++;
  return count;
}

function applyRecipeFilters(recipes, filters) {
  if (!filters) return recipes;

  let list = recipes;

  // Quick filters (top bar shortcuts)
  if (filters.quick === 'faved') {
    list = list.filter(r => state.favorites.has(r.id));
  } else if (filters.quick === 'recent') {
    list = list.filter(r => (state.cookedMap[r.id]?.count || 0) > 0)
      .sort((a, b) => new Date(state.cookedMap[b.id]?.last || 0) - new Date(state.cookedMap[a.id]?.last || 0));
  } else if (filters.quick === 'quick') {
    list = list.filter(r => r.cook_time <= 30 && r.difficulty !== '困难');
  } else if (filters.quick === 'weekend') {
    list = list.filter(r => r.difficulty === '中等' || r.difficulty === '困难');
  } else if (filters.quick === 'duo') {
    list = list; // all recipes for duo
  }

  // Difficulty
  if (filters.difficulty && filters.difficulty !== 'all') {
    if (filters.difficulty === '大师级') {
      list = list.filter(r => (state.proficiency[r.id]?.level || '新手') === '大师');
    } else {
      list = list.filter(r => r.difficulty === filters.difficulty);
    }
  }

  // Time
  if (filters.time && filters.time !== 'all') {
    const maxTime = filters.time === '15m' ? 15 : filters.time === '30m' ? 30 : filters.time === '60m' ? 60 : Infinity;
    if (maxTime < Infinity) {
      list = list.filter(r => (r.cook_time || 30) <= maxTime);
    }
    // 'weekend' = no time limit, keep all
  }

  // Type (multi-select)
  if (filters.type && filters.type.length > 0) {
    list = list.filter(r => {
      const cat = r.category || '';
      const tags = r.tags || [];
      return filters.type.some(t =>
        cat === t || tags.includes(t) || r.title.includes(t)
      );
    });
  }

  // Scene (multi-select)
  if (filters.scene && filters.scene.length > 0) {
    list = list.filter(r => {
      const tags = r.tags || [];
      const title = r.title || '';
      const ing = (r.ingredients || []).map(i => (typeof i === 'string' ? i : i.name || ''));
      return filters.scene.some(s => {
        if (s === '工作日晚餐') return r.cook_time <= 30 && r.difficulty !== '困难';
        if (s === '二人食') return true; // most recipes work for 2
        if (s === '一人食') return true;
        if (s === '带饭便当') return tags.includes('下饭菜') || tags.includes('快手菜');
        if (s === '周末改善') return r.difficulty !== '简单' || (r.cook_time || 20) >= 30;
        if (s === '招待朋友') return r.difficulty === '中等' || r.difficulty === '困难';
        if (s === '清冰箱') return ing.length <= 5;
        return false;
      });
    });
  }

  // Cuisine/taste (multi-select)
  if (filters.cuisine && filters.cuisine.length > 0) {
    list = list.filter(r => {
      const tags = r.tags || [];
      const cat = r.category || '';
      return filters.cuisine.some(c =>
        tags.includes(c) || cat === c
      );
    });
  }

  // User status
  if (filters.userStatus && filters.userStatus !== 'all') {
    switch (filters.userStatus) {
      case 'faved':
        list = list.filter(r => state.favorites.has(r.id));
        break;
      case 'cooked':
        list = list.filter(r => (state.cookedMap[r.id]?.count || 0) > 0);
        break;
      case 'notCooked':
        list = list.filter(r => (state.cookedMap[r.id]?.count || 0) === 0);
        break;
      case 'recent7':
        const weekAgo = new Date(Date.now() - 7 * 86400000);
        list = list.filter(r => {
          const last = state.cookedMap[r.id]?.last;
          return last && new Date(last) >= weekAgo;
        });
        break;
      case 'longTime':
        const monthAgo = new Date(Date.now() - 30 * 86400000);
        list = list.filter(r => {
          const last = state.cookedMap[r.id]?.last;
          return last && new Date(last) < monthAgo;
        });
        break;
      case 'master':
        list = list.filter(r => (state.proficiency[r.id]?.level || '新手') === '大师');
        break;
    }
  }

  // Sort
  if (filters.sort && filters.sort !== 'default') {
    switch (filters.sort) {
      case 'recent':
        list = list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        break;
      case 'cooked':
        list = list.sort((a, b) => new Date(state.cookedMap[b.id]?.last || 0) - new Date(state.cookedMap[a.id]?.last || 0));
        break;
      case 'mostCooked':
        list = list.sort((a, b) => (state.cookedMap[b.id]?.count || 0) - (state.cookedMap[a.id]?.count || 0));
        break;
      case 'fastest':
        list = list.sort((a, b) => (a.cook_time || 30) - (b.cook_time || 30));
        break;
      case 'easiest':
        const diffOrder = { '简单': 0, '中等': 1, '困难': 2 };
        list = list.sort((a, b) => (diffOrder[a.difficulty] || 1) - (diffOrder[b.difficulty] || 1));
        break;
      case 'favedFirst':
        list = list.sort((a, b) => (state.favorites.has(b.id) ? 1 : 0) - (state.favorites.has(a.id) ? 1 : 0));
        break;
    }
  }

  return list;
}

function getActiveFilterSummary(filters) {
  const parts = [];
  if (filters.difficulty && filters.difficulty !== 'all') parts.push(filters.difficulty);
  if (filters.time && filters.time !== 'all') {
    parts.push(filters.time === '15m' ? '15分钟内' : filters.time === '30m' ? '30分钟内' : filters.time === '60m' ? '60分钟内' : '周末菜');
  }
  if (filters.type && filters.type.length > 0) parts.push(...filters.type);
  if (filters.cuisine && filters.cuisine.length > 0) parts.push(...filters.cuisine.slice(0, 2));
  return parts;
}

// ── UX Helpers ──
function getMasteryLabel(recipeId) {
  const count = (state.cookedMap[recipeId]?.count || 0);
  if (count >= 6) return { label: '拿手菜', emoji: '⭐', cls: 'mastery-gold' };
  if (count >= 3) return { label: '逐渐熟练', emoji: '🔥', cls: 'mastery-silver' };
  if (count >= 1) return { label: '刚开始练', emoji: '🌱', cls: 'mastery-bronze' };
  return { label: '还没做过', emoji: '📖', cls: 'mastery-new' };
}

function getRecentCookedRecipes(limit = 3) {
  const all = [...state.recipes, ...state.customRecipes];
  return all
    .filter(r => (state.cookedMap[r.id]?.count || 0) > 0)
    .sort((a, b) => new Date(state.cookedMap[b.id]?.last || 0) - new Date(state.cookedMap[a.id]?.last || 0))
    .slice(0, limit);
}

function getWeeklySuggestions() {
  const all = [...state.recipes, ...state.customRecipes];
  if (all.length === 0) return [];

  const suggestions = [];

  // 1 quick dish (<=20 min)
  const quickOnes = all.filter(r => (r.cook_time || 30) <= 20 && r.difficulty !== '困难');
  if (quickOnes.length > 0) {
    suggestions.push({
      ...quickOnes.sort(() => Math.random() - 0.5)[0],
      suggestionTag: '快手菜',
      suggestionReason: '工作日晚餐，20分钟内搞定'
    });
  }

  // 1 veggie dish
  const veggie = all.filter(r => {
    const tags = (r.tags || []).map(t => t.toLowerCase());
    const cat = (r.category || '').toLowerCase();
    return tags.includes('素菜') || cat.includes('素') || cat.includes('蔬');
  });
  if (veggie.length > 0) {
    suggestions.push({
      ...veggie.sort(() => Math.random() - 0.5)[0],
      suggestionTag: '蔬菜',
      suggestionReason: '补充维生素，荤素搭配更健康'
    });
  }

  // 1 protein dish
  const protein = all.filter(r => {
    const cat = (r.category || '');
    const tags = (r.tags || []);
    return cat === '荤菜' || cat === '水产' || tags.includes('荤菜');
  });
  if (protein.length > 0) {
    suggestions.push({
      ...protein.sort(() => Math.random() - 0.5)[0],
      suggestionTag: '蛋白质',
      suggestionReason: '优质蛋白，满足营养需求'
    });
  }

  // 1 weekend dish (medium/hard, >30 min)
  const weekend = all.filter(r => (r.difficulty === '中等' || r.difficulty === '困难') && (r.cook_time || 20) >= 30);
  if (weekend.length > 0) {
    suggestions.push({
      ...weekend.sort(() => Math.random() - 0.5)[0],
      suggestionTag: '周末菜',
      suggestionReason: '周末慢慢做，享受烹饪乐趣'
    });
  }

  return suggestions;
}

// ── Cooking Journal Delete ──
async function deleteJournalEntry(journalId) {
  if (!confirm('确定删除这条打卡记录吗？删除后不可恢复。')) return;
  await deleteCookingJournal(journalId);
  // Re-show detail if we're on a detail page
  if (state.currentDetailId) {
    const r = getRecipeById(state.currentDetailId);
    if (r) showDetail(state.currentDetailId, r.isApi || false);
  }
}

// ── Shopping List: Clear Checked ──
async function doClearCheckedShop() {
  await clearCheckedShopItems();
  if (state.currentView === 'shop') render();
}

// ── Quick Scenario Filter ──
function applyQuickScenarioFilter(scene) {
  state.recipeFilters.quick = scene;
  state.currentView = 'recipes';
  state.currentFilter = scene;
  state.searchKeyword = '';
  render();
}

// ── Favorites ──
async function favClick(id) {
  await toggleFav(id);
  if (state.currentDetailId) {
    showDetail(state.currentDetailId, state.currentDetailIsApi || false);
  } else if (state.currentView === 'home') {
    render();
  } else {
    render();
  }
}

// ── Shopping ──
async function shopClick(id) {
  const r = getRecipeById(id);
  if (r) await addToShoppingList(r);
}

async function toggleShop(id) {
  await toggleShopItem(id);
  render();
}

async function removeShop(id) {
  await removeShopItem(id);
  render();
}

async function clearShop() {
  if (!confirm('确定清空？')) return;
  await clearShopItems();
  render();
}

// ── Cooking ──
function cookWithJournal(rid) {
  document.body.insertAdjacentHTML('beforeend', renderCookModal(rid));
  const uploadEl = document.getElementById('cookUpload');
  if (uploadEl) uploadEl.onclick = () => document.getElementById('cookPhoto').click();
}

function previewCookPhoto() {
  const f = document.getElementById('cookPhoto').files[0];
  if (!f) return;
  state.cookPhotoFile = f;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('cookPreview');
    if (img) { img.src = e.target.result; img.style.display = 'block'; }
  };
  reader.readAsDataURL(f);
}

async function quickCook(rid) {
  document.getElementById('cookModal')?.remove();
  await doMarkCooked(rid, null, null);
  // Re-show detail
  const r = getRecipeById(rid);
  if (r) showDetail(rid, r.isApi || false);
}

async function confirmCook(rid) {
  const notesEl = document.getElementById('cookNotes');
  const notes = notesEl ? notesEl.value.trim() : '';
  let photoUrl = null;
  if (state.cookPhotoFile) {
    photoUrl = await uploadImage(state.cookPhotoFile);
  }
  document.getElementById('cookModal')?.remove();
  await doMarkCooked(rid, photoUrl, notes || null);
  const r = getRecipeById(rid);
  if (r) showDetail(rid, r.isApi || false);
}

// ── Cooked Count ──
function adjustCount(rid) {
  const r = getRecipeById(rid);
  if (r) showDetail(rid, r.isApi || false);
}

async function doIncrementCooked(rid) {
  await incrementCooked(rid);
  const r = getRecipeById(rid);
  if (r) showDetail(rid, r.isApi || false);
}

async function doDecreaseCooked(rid) {
  await decreaseCooked(rid);
  const r = getRecipeById(rid);
  if (r) showDetail(rid, r.isApi || false);
}

// ── Auth ──
function toggleAuth() {
  state.authMode = state.authMode === 'signup' ? 'login' : 'signup';
  render();
}

async function doAuth() {
  const email = document.getElementById('authEmail')?.value?.trim();
  const pass = document.getElementById('authPass')?.value;
  if (!email || !pass) { toast('请填写邮箱和密码'); return; }

  const isLogin = state.authMode !== 'signup';
  const success = await handleAuth(email, pass, isLogin);

  if (success) {
    await loadAllData();
    state.currentView = 'home';
    toast('✅ 登录成功');
  }
  render();
}

// ── API Search ──
async function apiSearch() {
  const kw = document.getElementById('searchInput')?.value?.trim();
  if (!kw) { toast('请先在搜索框输入关键词'); return; }

  const app = document.getElementById('app');
  app.innerHTML = `<div class="content">
    <div class="back-btn" onclick="App.navTo('recipes')">‹ 返回</div>
    <div class="section-title">🌐 搜索: "${esc(kw)}"</div>
    <div class="loading">🔍 正在搜索中文菜谱库...</div>
  </div>`;

  const { results, source } = await searchAllSources(kw);

  if (results.length === 0) {
    app.innerHTML = `<div class="content">
      <div class="back-btn" onclick="App.navTo('recipes')">‹ 返回</div>
      <div class="section-title">🌐 搜索: "${esc(kw)}"</div>
      <div class="empty">没有找到 😢<br>试试其他关键词，或到设置里配置 AI Key 后使用 AI 智能搜索</div>
    </div>`;
    return;
  }

  state.apiResults = results;
  const srcLabel = source === 'local_chinese' ? '🏠 本地中文菜谱' :
    source === 'projkitchen' ? '🥘 ProjKitchen（中文补充）' :
    source === 'themealdb' ? '🌐 TheMealDB（英文兜底）' : '🌐 在线';

  let html = `<div class="content">
    <div class="back-btn" onclick="App.navTo('recipes')">‹ 返回</div>
    <div class="section-title">${srcLabel}: "${esc(kw)}" · ${results.length} 个</div>`;

  results.forEach(r => {
    html += `<div class="recipe-card" onclick="App.showApiDetail('${r.id}')">
      ${r.image_url ? `<img class="card-img" src="${r.image_url}" loading="lazy">` : ''}
      <div class="api-badge">${srcLabel}</div>
      <div class="card-body">
        <div class="card-row"><span class="card-title">${esc(r.title)}</span></div>
        <div class="card-desc">${esc(r.description || '')}</div>
        <div class="card-meta">
          <span class="badge ${r.difficulty === '简单' ? 'badge-easy' : r.difficulty === '困难' ? 'badge-hard' : 'badge-medium'}">${esc(r.difficulty || '中等')}</span>
          <span style="font-size:12px;color:#999">⏱ ${r.cook_time || 20}分钟</span>
          ${(r.tags || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>
      </div>
    </div>`;
  });

  html += '</div>';
  app.innerHTML = html;
}

async function showApiDetail(id) {
  // Show loading first
  const app = document.getElementById('app');
  app.innerHTML = `<div class="content">
    <div class="back-btn" onclick="App.goBack()">‹ 返回</div>
    <div class="loading">🔍 正在加载菜谱详情...</div>
  </div>`;

  state.currentDetailId = id;
  state.currentDetailIsApi = true;
  if (!state.parentView) state.parentView = state.currentView;

  // 1. Check cache first
  const cached = state.apiDetailCache[id];
  if (cached && cached.ingredients && cached.ingredients.length > 0 && cached.steps && cached.steps.length > 0) {
    // Cache has complete data — use directly
  } else {
    // 2. Try to get full detail from source
    const full = await getSourceRecipeDetail(id);

    if (full && full.ingredients && full.ingredients.length > 0) {
      state.apiDetailCache[id] = full;
    } else {
      // 3. Fallback: use list data from apiResults
      const listItem = (state.apiResults || []).find(x => x.id === id);
      if (listItem) {
        state.apiDetailCache[id] = listItem;
      } else {
        // 4. Last resort: try local Chinese source by id/title
        const local = await getLocalRecipeById(id);
        if (local) {
          state.apiDetailCache[id] = local;
        } else {
          app.innerHTML = `<div class="content">
            <div class="back-btn" onclick="App.goBack()">‹ 返回</div>
            <div class="empty">😢 无法加载菜谱详情<br>请返回重试或使用其他数据源</div>
          </div>`;
          return;
        }
      }
    }
  }

  // Ensure the recipe object is in state.recipes for showDetail to find it
  const detail = state.apiDetailCache[id];
  const existing = state.recipes.find(x => x.id === id);
  if (!existing) {
    state.recipes.push({ ...detail, id, isApi: true });
    showDetail(id, true);
    state.recipes.pop();
  } else {
    showDetail(id, true);
  }
}

// ── AI Save to My Recipes ──
async function aiSaveRecipe(id) {
  // 1. Get full recipe — try multiple sources
  let r = getRecipeById(id);

  // 2. Check if data is complete
  const hasIngredients = r && Array.isArray(r.ingredients) && r.ingredients.length > 0;
  const hasSteps = r && Array.isArray(r.steps) && r.steps.length > 0;
  const hasTitle = r && r.title && r.title.trim().length > 0;

  if (!hasTitle || !hasIngredients || !hasSteps) {
    // Try to enrich from detail API / local source
    toast('🔍 正在获取完整菜谱数据...');
    const full = await getSourceRecipeDetail(id);

    if (full && full.ingredients && full.ingredients.length > 0 && full.steps && full.steps.length > 0) {
      r = { ...r, ingredients: full.ingredients, steps: full.steps, description: full.description || r.description };
      state.apiDetailCache[id] = r;
    } else if (r && r.title) {
      // Data is still incomplete — ask user
      const proceed = confirm(
        `当前菜谱"${r.title}"的原始数据不完整：\n` +
        `食材：${hasIngredients ? r.ingredients.length + '种' : '缺失'}\n` +
        `步骤：${hasSteps ? r.steps.length + '步' : '缺失'}\n\n` +
        `是否让 AI 根据菜名和分类补全？\n` +
        `（AI 会尝试生成合理的食材和步骤，但可能不完全准确）`
      );
      if (!proceed) {
        toast('⚠️ 已取消，请手动编辑菜谱补充食材和步骤');
        return;
      }
    } else {
      toast('❌ 菜谱数据丢失，请重新搜索');
      return;
    }
  }

  // 3. Guard: data must be complete at this point
  if (!r.title || (!Array.isArray(r.ingredients) || r.ingredients.length === 0) && !confirm('食材列表为空，确定继续？')) {
    toast('⚠️ 已取消保存');
    return;
  }

  // 4. Check if data already has complete ingredients and steps
  const ingComplete = Array.isArray(r.ingredients) && r.ingredients.length > 0;
  const stepsComplete = Array.isArray(r.steps) && r.steps.length > 0;

  if (ingComplete && stepsComplete) {
    // AI's role: rewrite into RecipeMate standard format (not invent from scratch)
    toast('🤖 AI 正在重写成标准格式（约15秒）...');
  } else {
    // AI needs to supplement
    toast('🤖 AI 正在补全菜谱（约15秒）...');
  }

  const data = await aiNormalizeRecipe(r);

  // 5. Build save data — must not have empty ingredients/steps
  const saveData = data ? {
    title: data.title || r.title,
    desc: data.description || r.description || '',
    diff: data.difficulty || r.difficulty || '中等',
    time: data.cook_time || r.cook_time || 30,
    img: data.image_url || r.image_url || null,
    ing: (data.ingredients && data.ingredients.length > 0) ? data.ingredients : r.ingredients || [],
    steps: (data.steps && data.steps.length > 0) ? data.steps : r.steps || [],
    tags: (data.tags && data.tags.length > 0) ? data.tags : r.tags || []
  } : {
    title: r.title,
    desc: r.description || '',
    diff: r.difficulty || '中等',
    time: r.cook_time || 30,
    img: r.image_url || null,
    ing: r.ingredients || [],
    steps: r.steps || [],
    tags: r.tags || []
  };

  // 6. Final validation — reject empty data
  if (!saveData.title) {
    toast('❌ 菜名为空，保存失败');
    return;
  }
  if (!saveData.ing || saveData.ing.length === 0) {
    toast('❌ 食材列表为空，保存失败。请手动编辑菜谱补充食材。');
    return;
  }
  if (!saveData.steps || saveData.steps.length === 0) {
    toast('❌ 步骤列表为空，保存失败。请手动编辑菜谱补充步骤。');
    return;
  }

  if (!data) {
    toast('⚠️ AI 未响应，已保存原始菜谱数据（可后续手动编辑）');
  }

  await saveCustomRecipe(saveData, null);
  state.currentView = 'recipes';
  render();
}

// ── Save API Recipe Directly to My Recipes (no AI) ──
async function saveApiRecipeToMyRecipes(id) {
  // 1. Get full recipe — priority: apiDetailCache > source detail > apiResults > getRecipeById
  let r = state.apiDetailCache[id];

  if (!r || !r.title || !Array.isArray(r.ingredients) || !Array.isArray(r.steps)) {
    // Try source detail API
    const full = await getSourceRecipeDetail(id);
    if (full) {
      r = full;
      state.apiDetailCache[id] = r;
    }
  }

  if (!r || !r.title) {
    // Fallback to apiResults
    r = (state.apiResults || []).find(x => x.id === id);
  }

  if (!r || !r.title) {
    // Last resort: getRecipeById
    r = getRecipeById(id);
  }

  if (!r || !r.title) {
    toast('❌ 菜谱数据丢失，请重新搜索');
    return;
  }

  // 2. Validate ingredients and steps
  const ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];
  const steps = Array.isArray(r.steps) ? r.steps : [];

  if (ingredients.length === 0 || steps.length === 0) {
    toast('⚠️ 当前菜谱缺少食材或步骤，不能直接保存。请先补充或使用编辑功能。');
    return;
  }

  // 3. Check for duplicate title
  const existed = state.customRecipes.find(x =>
    x.title === (r.title || '') || x.title === (r.name || '')
  );
  if (existed) {
    const ok = confirm(`我的菜谱中已经有《${existed.title}》，是否仍然再保存一份？`);
    if (!ok) {
      toast('已取消保存');
      return;
    }
  }

  // 4. Build save data
  const saveData = {
    title: r.title || r.name || '',
    desc: r.description || r.desc || '',
    diff: r.difficulty || r.diff || '中等',
    time: r.cook_time || r.cookTime || r.time || 30,
    img: r.image_url || r.img || null,
    ing: ingredients,
    steps: steps,
    tags: r.tags || []
  };

  // 5. Save
  const saved = await saveCustomRecipe(saveData, null);
  if (saved) {
    toast('✅ 已保存到我的菜谱');
    await loadAllData();
    state.currentView = 'recipes';
    render();
  } else {
    toast('❌ 保存失败，请稍后重试');
  }
}

// ── Custom Recipe Form ──
function createRecipe() {
  state.currentView = 'customForm';
  state.formDirty = false;
  state.recipeImgFile = null;

  document.getElementById('app').innerHTML = `
    <div class="content">
      <div class="back-btn" onclick="App.customBack()">‹ 返回</div>
      <div class="section-title" style="font-size:20px">➕ 创建自定义菜谱</div>
      <div class="auth-box" style="max-width:100%;margin:12px 0;box-shadow:none">
        <div class="upload-area" id="recipeImgUpload"><p>📷 点击上传菜品图片</p><input type="file" accept="image/*" id="recipeImg" style="display:none" onchange="App.previewRecipeImg()"></div>
        <img id="recipeImgPreview" class="preview-img" style="display:none">
        <label class="form-label">菜名 *</label><input id="rTitle" placeholder="例如：糖醋排骨">
        <label class="form-label">简介</label><input id="rDesc" placeholder="简单描述一下这道菜...">
        <div class="form-row">
          <div><label class="form-label">难度</label><select id="rDiff" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD"><option>简单</option><option selected>中等</option><option>困难</option></select></div>
          <div><label class="form-label">耗时(分钟)</label><input id="rTime" type="number" value="20" min="1"></div>
        </div>
        <label class="form-label">食材（一行一个，格式：食材名 — 用量）</label><textarea id="rIng" rows="4" placeholder="番茄 — 中等大小 2 个&#10;鸡蛋 — 3 个&#10;盐 — 小半勺"></textarea>
        <label class="form-label">步骤（一行一个）</label><textarea id="rSteps" rows="5" placeholder="1. 处理食材：番茄洗净切块&#10;2. 热锅倒油，大火烧热&#10;3. 下番茄翻炒2分钟至出汁"></textarea>
        <label class="form-label">标签（逗号分隔）</label><input id="rTags" placeholder="家常菜,快手菜,下饭菜">
        <button class="btn btn-primary btn-block" onclick="App.submitCustom()" style="margin-top:12px">💾 保存菜谱</button>
      </div>
    </div>`;

  const upload = document.getElementById('recipeImgUpload');
  if (upload) upload.onclick = () => document.getElementById('recipeImg').click();

  // Track form changes
  document.querySelectorAll('#rTitle,#rDesc,#rIng,#rSteps,#rTags').forEach(el => {
    el.oninput = () => { state.formDirty = true; };
  });
  const diffEl = document.getElementById('rDiff');
  const timeEl = document.getElementById('rTime');
  if (diffEl) diffEl.onchange = () => { state.formDirty = true; };
  if (timeEl) timeEl.oninput = () => { state.formDirty = true; };
}

function previewRecipeImg() {
  const f = document.getElementById('recipeImg').files[0];
  if (!f) return;
  state.recipeImgFile = f;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('recipeImgPreview');
    if (img) { img.src = e.target.result; img.style.display = 'block'; }
  };
  reader.readAsDataURL(f);
}

function customBack() {
  if (state.formDirty) {
    if (confirm('有未保存的内容，是否保存？')) { submitCustom(); return; }
    else if (!confirm('确定放弃修改吗？')) return;
  }
  state.formDirty = false;
  state.recipeImgFile = null;
  state.currentView = 'recipes';
  render();
}

async function submitCustom() {
  const title = document.getElementById('rTitle')?.value?.trim();
  if (!title) { toast('请输入菜名'); return; }

  let imgUrl = null;
  if (state.recipeImgFile) imgUrl = await uploadImage(state.recipeImgFile);

  const ingText = document.getElementById('rIng')?.value?.trim() || '';
  const ingredients = ingText
    ? ingText.split('\n').filter(Boolean).map(line => {
        const [nam, ...rest] = line.split('—');
        return { name: (nam || line).trim(), amount: rest.join('—').trim() };
      })
    : [];

  const stepsText = document.getElementById('rSteps')?.value?.trim() || '';
  const stepsArr = stepsText
    ? stepsText.split('\n').filter(Boolean).map((line, i) => {
        const m = line.match(/^(\d+)\.?\s*(.+)/);
        return { num: m ? parseInt(m[1]) : i + 1, text: m ? m[2] : line, detail: '' };
      })
    : [];

  const tags = (document.getElementById('rTags')?.value || '')
    .split(/[,，]/).map(t => t.trim()).filter(Boolean);

  await saveCustomRecipe({
    title,
    desc: document.getElementById('rDesc')?.value?.trim() || '',
    diff: document.getElementById('rDiff')?.value || '中等',
    time: document.getElementById('rTime')?.value || '20',
    img: imgUrl,
    ing: ingredients,
    steps: stepsArr,
    tags
  });

  state.formDirty = false;
  state.recipeImgFile = null;
  state.currentView = 'recipes';
  render();
}

// ── Edit Custom Recipe ──
async function editCustomRecipe(id) {
  let r = state.customRecipes.find(x => x.id === id) || state.recipes.find(x => x.id === id);

  if (!r || (r.isApi && !state.customRecipes.some(x => x.id === id))) {
    const cached = state.apiDetailCache[id];
    if (cached) r = cached;
  }

  if (!r) { toast('❌ 菜谱数据丢失，请重新搜索'); return; }

  const isCustom = state.customRecipes.some(x => x.id === id);

  // For API/non-custom recipes: AI normalize and save
  if (!isCustom || r.isApi) {
    const ing = r.ingredients || [];
    const steps = r.steps || [];
    let data = {
      title: r.title,
      desc: r.description || '',
      diff: r.difficulty || '中等',
      time: r.cook_time || 30,
      img: r.image_url,
      ing,
      steps,
      tags: r.tags || []
    };

    if (r.isApi) {
      const enriched = await aiNormalizeRecipe(r);
      if (enriched) {
        data = {
          title: enriched.title,
          desc: enriched.description || '',
          diff: enriched.difficulty || '中等',
          time: enriched.cook_time || 30,
          img: enriched.image_url,
          ing: enriched.ingredients,
          steps: enriched.steps,
          tags: enriched.tags
        };
      }
    }

    const overrideId = !isCustom && !r.isApi ? r.id : null;
    await saveCustomRecipe(data, overrideId);
    return;
  }

  // Edit existing custom recipe
  const ingText = (r.ingredients || [])
    .map(i => typeof i === 'string' ? i : `${i.name} — ${i.amount || ''}`).join('\n');
  const stepsText = (r.steps || [])
    .map(s => `${s.num}. ${s.text || s}`).join('\n');

  state.currentView = 'customForm';
  state.formDirty = false;

  document.getElementById('app').innerHTML = `
    <div class="content">
      <div class="back-btn" onclick="App.customBack()">‹ 返回</div>
      <div class="section-title" style="font-size:20px">✏️ 编辑菜谱</div>
      <div class="auth-box" style="max-width:100%;margin:12px 0;box-shadow:none">
        <div class="upload-area" id="recipeImgUpload">
          <p>📷 更换图片</p>
          ${r.image_url ? `<img src="${r.image_url}" style="max-width:100%;max-height:120px;border-radius:8px;margin-top:8px">` : ''}
          <input type="file" accept="image/*" id="recipeImg" style="display:none" onchange="App.previewRecipeImg()">
        </div>
        <img id="recipeImgPreview" class="preview-img" style="display:none">
        <label class="form-label">菜名 *</label>
        <input id="rTitle" value="${esc(r.title)}">
        <label class="form-label">简介</label>
        <input id="rDesc" value="${esc(r.description || '')}">
        <div class="form-row">
          <div>
            <label class="form-label">难度</label>
            <select id="rDiff" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD">
              <option ${r.difficulty === '简单' ? 'selected' : ''}>简单</option>
              <option ${r.difficulty === '中等' ? 'selected' : ''}>中等</option>
              <option ${r.difficulty === '困难' ? 'selected' : ''}>困难</option>
            </select>
          </div>
          <div>
            <label class="form-label">耗时(分钟)</label>
            <input id="rTime" type="number" value="${r.cook_time || 20}" min="1">
          </div>
        </div>
        <label class="form-label">食材</label>
        <textarea id="rIng" rows="4">${esc(ingText)}</textarea>
        <label class="form-label">步骤</label>
        <textarea id="rSteps" rows="5">${esc(stepsText)}</textarea>
        <label class="form-label">标签</label>
        <input id="rTags" value="${esc((r.tags || []).join(', '))}">
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="App.updateCustom('${id}')">💾 保存修改</button>
          <button class="btn btn-outline" style="border-color:#F44336;color:#F44336" onclick="App.deleteCustom('${id}')">🗑 删除</button>
        </div>
      </div>
    </div>`;

  const upload = document.getElementById('recipeImgUpload');
  if (upload) upload.onclick = () => document.getElementById('recipeImg').click();

  document.querySelectorAll('#rTitle,#rDesc,#rIng,#rSteps,#rTags').forEach(el => {
    el.oninput = () => { state.formDirty = true; };
  });
  const diffEl = document.getElementById('rDiff');
  const timeEl = document.getElementById('rTime');
  if (diffEl) diffEl.onchange = () => { state.formDirty = true; };
  if (timeEl) timeEl.oninput = () => { state.formDirty = true; };
}

async function updateCustom(id) {
  const title = document.getElementById('rTitle')?.value?.trim();
  if (!title) { toast('请输入菜名'); return; }

  let imgUrl = (state.customRecipes.find(x => x.id === id) || {}).image_url || null;
  if (state.recipeImgFile) imgUrl = await uploadImage(state.recipeImgFile);

  const ingText = document.getElementById('rIng')?.value?.trim() || '';
  const ingredients = ingText
    ? ingText.split('\n').filter(Boolean).map(line => {
        const [nam, ...rest] = line.split('—');
        return { name: (nam || line).trim(), amount: rest.join('—').trim() };
      })
    : [];

  const stepsText = document.getElementById('rSteps')?.value?.trim() || '';
  const stepsArr = stepsText
    ? stepsText.split('\n').filter(Boolean).map((line, i) => {
        const m = line.match(/^(\d+)\.?\s*(.+)/);
        return { num: m ? parseInt(m[1]) : i + 1, text: m ? m[2] : line, detail: '' };
      })
    : [];

  const tags = (document.getElementById('rTags')?.value || '')
    .split(/[,，]/).map(t => t.trim()).filter(Boolean);

  await updateCustomRecipe(id, {
    title,
    description: document.getElementById('rDesc')?.value?.trim() || '',
    difficulty: document.getElementById('rDiff')?.value || '中等',
    cook_time: parseInt(document.getElementById('rTime')?.value) || 20,
    image_url: imgUrl,
    ingredients,
    steps: stepsArr,
    tags
  });

  state.formDirty = false;
  state.recipeImgFile = null;
  state.currentView = 'recipes';
  render();
}

async function deleteCustom(id) {
  if (!confirm('确定删除这条菜谱？此操作不可撤销。')) return;
  await deleteCustomRecipe(id);
  state.currentView = 'recipes';
  render();
}

async function deleteCustomRecipeDetail(id) {
  if (!confirm('确定删除这条菜谱？打卡记录会保留。')) return;
  await deleteCustomRecipe(id);
  state.currentDetailId = null;
  state.currentView = 'recipes';
  render();
}

// ── Today's Eat ──
function updateTodayOptions() {
  if (!state.todayOptions) state.todayOptions = { types: [], servings: '2', avoid: '' };
  const servingsEl = document.getElementById('teServings');
  const avoidEl = document.getElementById('teAvoid');
  if (servingsEl) state.todayOptions.servings = servingsEl.value;
  if (avoidEl) state.todayOptions.avoid = avoidEl.value.trim();
}
function showTodayEat() {
  renderTodayEatModal();
}

async function doTodayRecommend(useAI) {
  // Read from state, not DOM
  const selectedTags = state.todayOptions?.types || [];
  const servings = state.todayOptions?.servings || '2';
  const avoid = (state.todayOptions?.avoid || '').trim();

  document.getElementById('todayEatModal')?.remove();

  const app = document.getElementById('app');
  app.innerHTML = `<div class="content">
    <div class="back-btn" onclick="App.navTo('home')">‹ 返回首页</div>
    <div class="section-title">🎲 今天吃什么？</div>
    <div class="loading">${useAI ? '🤖 AI 正在为你推荐...' : '📖 正在从菜谱库挑选...'}</div>
  </div>`;

  let results = [];

  // Pre-load local recipes for candidate filtering
  await loadLocalChineseRecipes();

  // Helper: filter by tags (OR match), exclude avoid ingredients
  function filterLocal(tagList, avoidStr) {
    return searchLocalByTags(tagList.length > 0 ? tagList : ['家常菜'])
      .then(pool => {
        // Exclude by avoid ingredients
        if (avoidStr) {
          const avoidWords = avoidStr.split(/[,，\s]+/).map(w => w.trim().toLowerCase()).filter(Boolean);
          if (avoidWords.length > 0) {
            pool = pool.filter(r =>
              !avoidWords.some(aw =>
                (r.ingredients || []).some(i =>
                  (i.name || '').toLowerCase().includes(aw)
                )
              )
            );
          }
        }
        return pool;
      });
  }

  if (useAI) {
    // 1. Get candidate pool from local Chinese recipes (10-20 items)
    const candidatePool = await filterLocal(selectedTags, avoid);
    const candidates = candidatePool.sort(() => Math.random() - 0.5).slice(0, 20);

    if (candidates.length === 0) {
      toast('⚠️ 没有符合条件的菜谱，请调整偏好');
      app.innerHTML = `<div class="content">
        <div class="back-btn" onclick="App.navTo('home')">‹ 返回首页</div>
        <div class="empty">暂时没有符合条件的菜谱 😢<br>试试调整偏好或减少忌口</div>
      </div>`;
      return;
    }

    // 2. Build AI prompt with real candidates
    const tagDesc = selectedTags.length > 0 ? '想吃类型：' + selectedTags.join('、') : '不限类型';
    const avoidDesc = avoid ? '忌口/过敏：' + avoid : '无忌口';
    const candidateList = candidates.map(c => ({
      id: c.id,
      title: c.title,
      category: c.category || '',
      tags: (c.tags || []).slice(0, 3),
      difficulty: c.difficulty,
      cook_time: c.cook_time,
      ingredients: (c.ingredients || []).map(i => i.name)
    }));

    // 3. Ask AI to pick 3 from candidates
    let aiResults = null;
    try {
      aiResults = await aiRecommend(JSON.stringify({
        servings: `${servings}人份`,
        preferences: tagDesc,
        avoid: avoidDesc,
        candidates: candidateList
      }));
    } catch (e) {
      console.warn('AI recommend failed:', e.message);
    }

    // 4. Process AI results
    if (aiResults && Array.isArray(aiResults) && aiResults.length > 0) {
      // Map AI-selected titles back to full local recipes
      results = aiResults.map(ai => {
        const match = candidates.find(c =>
          c.id === ai.id || c.title === ai.title || c.title === ai.菜名
        );
        if (match) {
          return {
            ...match,
            description: ai.reason || ai.推荐理由 || match.description,
            isApi: false,
            isAi: true,
            aiReason: ai.reason || ai.推荐理由 || ''
          };
        }
        // Fallback: AI gave a title not in candidates — use first candidate
        return { ...candidates[0], isApi: false, isAi: true, aiReason: ai.reason || '' };
      });
    } else {
      // 5. AI failed — fallback to local random
      results = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
      toast('⚠️ AI 推荐失败，已使用本地菜谱库随机推荐');
    }
  } else {
    // Non-AI: pick from local Chinese recipes
    const pool = await filterLocal(selectedTags, avoid);
    results = pool.sort(() => Math.random() - 0.5).slice(0, 3);

    // Add recommendation reasons
    results = results.map(r => {
      const matchedTags = [];
      if (selectedTags.length > 0) {
        selectedTags.forEach(t => {
          if ((r.tags || []).includes(t) || (r.category || '') === t || r.title.includes(t)) {
            matchedTags.push(t);
          }
        });
      }
      const reasons = [];
      if (matchedTags.length > 0) reasons.push(`匹配了标签：${matchedTags.join('、')}`);
      if (r.cook_time <= 15) reasons.push('快手菜，适合忙碌时');
      if (r.difficulty === '简单') reasons.push('简单易做');

      return {
        ...r,
        description: reasons.join(' · ') || r.description,
        isApi: false,
        isAi: false
      };
    });
  }

  state.todayResults = results;
  state.apiResults = results;
  results.forEach(r => { state.apiDetailCache[r.id] = r; });

  const srcLabel = useAI ? '🤖 AI 推荐（基于本地菜谱库）' : '📖 本地菜谱库挑选';

  let html = `<div class="content">
    <div class="back-btn" onclick="App.navTo('home')">‹ 返回首页</div>
    <div class="section-title">${srcLabel} · ${results.length} 道</div>`;

  if (results.length === 0) {
    html += '<div class="empty">暂时没有符合条件的菜谱 😢<br>试试调整偏好或使用 AI 推荐</div>';
  }

  results.forEach(r => {
    const diffCls = r.difficulty === '简单' ? 'badge-easy' : r.difficulty === '困难' ? 'badge-hard' : 'badge-medium';
    html += `<div class="recipe-card" onclick="App.showTodayDetail('${r.id}')">
      ${r.image_url ? `<img class="card-img" src="${r.image_url}" loading="lazy">` : ''}
      <div class="api-badge">${srcLabel}</div>
      <div class="card-body">
        <div class="card-row"><span class="card-title">${esc(r.title)}</span></div>
        <div class="card-desc">${esc(r.description || r.aiReason || '')}</div>
        <div class="card-meta">
          <span class="badge ${diffCls}">${esc(r.difficulty || '中等')}</span>
          <span style="font-size:12px;color:#999">⏱ ${r.cook_time || 20}分钟</span>
          <span style="font-size:12px;color:#999">🥬 ${(r.ingredients || []).length}种食材</span>
          ${(r.tags || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>
      </div>
    </div>`;
  });

  html += '</div>';
  app.innerHTML = html;
}

function showTodayDetail(id) {
  // Try to get full recipe detail — show loading, then navigate
  (async () => {
    const full = await getSourceRecipeDetail(id);
    const cached = state.apiDetailCache[id];
    const r = full || (state.todayResults || state.apiResults || []).find(x => x.id === id) || cached;

    if (!r) {
      toast('❌ 无法加载菜谱详情');
      return;
    }

    state.currentDetailId = id;
    state.currentDetailIsApi = true;
    if (!state.parentView) state.parentView = state.currentView;
    state.apiDetailCache[id] = r;

    const existing = state.recipes.find(x => x.id === id);
    if (!existing) {
      state.recipes.push({ ...r, id, isApi: true });
      showDetail(id, true);
      state.recipes.pop();
    } else {
      showDetail(id, true);
    }
  })();
}

function toggleTodayTag(el) {
  const tag = el.dataset.tag;
  if (!tag) return;

  // Toggle in state
  if (!state.todayOptions) {
    state.todayOptions = { types: [], servings: '2', avoid: '' };
  }
  const idx = state.todayOptions.types.indexOf(tag);
  if (idx >= 0) {
    state.todayOptions.types.splice(idx, 1);
    el.classList.remove('selected');
  } else {
    state.todayOptions.types.push(tag);
    el.classList.add('selected');
  }

  // Update the status text
  const statusEl = document.getElementById('teSelectedStatus');
  if (statusEl) {
    const types = state.todayOptions.types;
    statusEl.textContent = types.length > 0
      ? '已选择：' + types.join('、')
      : '未选择类型，将随机推荐';
  }
}

// ── Settings ──
function toggleEnglishFallback(val) {
  state.allowEnglishFallback = val === true;
  toast(val ? '✅ 已启用英文菜谱兜底' : '❌ 已关闭英文菜谱兜底（仅用中文）');
}

function doSaveSettings() {
  const p = document.getElementById('aiProvider');
  const u = document.getElementById('aiUrl');
  const m = document.getElementById('aiModel');
  const k = document.getElementById('apiKeyInput');

  if (!p || !k) { toast('❌ 设置面板异常，请重新打开'); return; }

  saveAISettings(p.value, u.value, m.value, k.value);
  document.getElementById('settingsModal')?.remove();
  toast('✅ 已保存，Key: ' + (k.value ? '已设置' : '未设置'));
}

// ── Utility ──
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Expose all public functions on window.App ──
const App = {
  // Render & Navigation
  render, navTo, setFilter, goBack,
  // Auth
  doAuth, toggleAuth, handleLogout,
  // Recipes
  createRecipe, submitCustom, customBack,
  editCustomRecipe, updateCustom, deleteCustom,
  deleteCustomRecipe: deleteCustomRecipeDetail,
  previewRecipeImg,
  // Detail & Favorites
  showDetail, favClick, adjustCount,
  // Cooking
  cookWithJournal, quickCook, confirmCook, previewCookPhoto,
  incrementCooked: doIncrementCooked, decreaseCooked: doDecreaseCooked,
  // Shopping
  shopClick, toggleShop, removeShop, clearShop,
  doClearCheckedShop,
  // API Search
  apiSearch, showApiDetail,
  handleSearchInput, clearSearch,
  // AI Save
  aiSaveRecipe,
  saveApiRecipeToMyRecipes,
  // Settings
  showSettings, updateSetForm, saveSettings: doSaveSettings,
  testAI: doTestAI,
  toggleEnglishFallback,
  // Today's Eat
  showTodayEat, doTodayRecommend, showTodayDetail, toggleTodayTag, updateTodayOptions,
  // Filter Panel
  openRecipeFilterPanel, closeRecipeFilterPanel, setRecipeFilter, resetRecipeFilters,
  applyQuickScenarioFilter,
  // Journal
  deleteJournalEntry,
  // UX Helpers
  getMasteryLabel, getRecentCookedRecipes, getWeeklySuggestions
};

window.App = App;
// Expose filter functions for recipesView.js to use without circular imports
App._applyFilters = applyRecipeFilters;
App._getActiveFilterSummary = getActiveFilterSummary;

// ── Initialize ──
async function init() {
  // Preload local Chinese recipes in background for fast search
  getLocalRecipeCount().then(n => { state.debugLocalRecipeCount = n; });

  await checkAuth();
  if (state.session) {
    await loadAllData();
  }
  render();
}

init();
