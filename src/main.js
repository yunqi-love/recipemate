// RecipeMate v4 — Main Entry Point
// All public functions are exposed on window.App for HTML onclick handlers.

import { state, updateProficiency } from './app.js';
import { getAIProvider, getAIKey, getAIUrl, getAIModel, saveAISettings } from './config/aiProviders.js';
import { supabase } from './services/supabaseClient.js';
import { toast } from './components/toast.js';

// Services
import { aiNormalizeRecipe, aiRecommend } from './services/aiClient.js';
import { searchAllSources, getSourceRecipeDetail } from './services/recipeSources/index.js';
import { searchProjKitchenByTags } from './services/recipeSources/projKitchenSource.js';

// Stores
import { checkAuth, handleAuth, handleLogout } from './stores/authStore.js';
import {
  loadAllData, getAllRecipes, getRecipeById,
  saveCustomRecipe, updateCustomRecipe, deleteCustomRecipe,
  toggleFav, uploadImage
} from './stores/recipeStore.js';
import { doMarkCooked, incrementCooked, decreaseCooked, getJournalForRecipe } from './stores/userStateStore.js';
import { addToShoppingList, toggleShopItem, removeShopItem, clearShopItems } from './stores/shoppingStore.js';

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
}

// ── Navigation ──
function navTo(view) {
  state.currentView = view;
  state.currentFilter = 'all';
  state.currentDetailId = null;
  state.parentView = null;
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
  render();
}

function setFilter(key) {
  state.currentFilter = key;
  render();
}

function goBack() {
  state.currentDetailId = null;
  state.currentView = state.parentView || 'recipes';
  state.parentView = null;
  render();
  requestAnimationFrame(() => window.scrollTo({ top: state.savedScrollY || 0, behavior: 'instant' }));
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
  const srcLabel = source === 'projkitchen' ? '🥘 ProjKitchen（中文菜谱）' : '🌐 TheMealDB（英文菜谱）';

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

function showApiDetail(id) {
  const r = (state.apiResults || []).find(x => x.id === id);
  if (!r) return;

  state.currentDetailId = id;
  state.currentDetailIsApi = true;
  if (!state.parentView) state.parentView = state.currentView;
  state.apiDetailCache[id] = r;

  // Temporarily add to recipes so showDetail can find it
  state.recipes.push({ ...r, id, isApi: true });
  showDetail(id, true);
  state.recipes.pop();
}

// ── AI Save to My Recipes ──
async function aiSaveRecipe(id) {
  const r = state.apiDetailCache[id] || getRecipeById(id);
  if (!r) { toast('❌ 菜谱数据丢失，请重新搜索'); return; }

  toast('🤖 AI 正在重构菜谱（约15秒）...');
  const data = await aiNormalizeRecipe(r);

  const saveData = data || {
    title: r.title,
    desc: r.description || '',
    diff: r.difficulty || '中等',
    time: r.cook_time || 30,
    img: r.image_url || null,
    ing: r.ingredients || [],
    steps: r.steps || [],
    tags: r.tags || []
  };

  if (!data) {
    toast('⚠️ AI 未响应，保存原始菜谱（可后续手动编辑）');
  }

  await saveCustomRecipe(saveData, null);
  state.currentView = 'recipes';
  render();
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
function showTodayEat() {
  renderTodayEatModal();
}

async function doTodayRecommend(useAI) {
  const selectedTags = [];
  document.querySelectorAll('.te-chip.selected').forEach(el => {
    selectedTags.push(el.dataset.tag);
  });

  const servings = document.getElementById('teServings')?.value || '2';
  const avoid = document.getElementById('teAvoid')?.value?.trim() || '';

  document.getElementById('todayEatModal')?.remove();

  const app = document.getElementById('app');
  app.innerHTML = `<div class="content">
    <div class="back-btn" onclick="App.navTo('home')">‹ 返回首页</div>
    <div class="section-title">🎲 今天吃什么？</div>
    <div class="loading">${useAI ? '🤖 AI 正在为你推荐...' : '📖 正在从菜谱库挑选...'}</div>
  </div>`;

  let results = [];

  if (useAI) {
    // Try AI recommendation
    const conditions = `${servings}人份，${selectedTags.length ? '想吃' + selectedTags.join('、') : '不限类型'}，${avoid ? '忌口：' + avoid : '无忌口'}`;
    const aiResults = await aiRecommend(conditions);

    if (aiResults && aiResults.length > 0) {
      // Map AI results to recipe-like objects
      results = aiResults.map((x, i) => ({
        id: 'ai_rec_' + Date.now() + '_' + i,
        title: x.title || x.菜名 || '',
        description: x.reason || x.推荐理由 || '',
        difficulty: x.difficulty || x.难度 || '中等',
        cook_time: x.cook_time || x.耗时 || 30,
        image_url: null,
        ingredients: [],
        steps: [],
        tags: x.tags || x.标签 || [],
        isApi: true,
        isAi: true,
        source: 'ai_recommend'
      }));
    } else {
      // Fallback: search Proj Kitchen for matching recipes
      const tagList = selectedTags.length > 0 ? selectedTags : ['家常菜', '快手菜'];
      results = await searchProjKitchenByTags(tagList);
      results = results.slice(0, 3);
    }
  } else {
    // Pick from Proj Kitchen by tags or random
    const tagList = selectedTags.length > 0 ? selectedTags : ['家常菜'];
    results = await searchProjKitchenByTags(tagList);
    results = results.slice(0, 3);
  }

  state.todayResults = results;
  state.apiResults = results;
  results.forEach(r => { state.apiDetailCache[r.id] = r; });

  const srcLabel = useAI ? '🤖 AI 推荐' : '📖 菜谱库挑选';

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
        <div class="card-desc">${esc(r.description || '')}</div>
        <div class="card-meta">
          <span class="badge ${diffCls}">${esc(r.difficulty || '中等')}</span>
          <span style="font-size:12px;color:#999">⏱ ${r.cook_time || 20}分钟</span>
          ${(r.tags || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        </div>
      </div>
    </div>`;
  });

  html += '</div>';
  app.innerHTML = html;
}

function showTodayDetail(id) {
  const r = (state.todayResults || state.apiResults || []).find(x => x.id === id);
  if (!r) return;

  state.currentDetailId = id;
  state.currentDetailIsApi = true;
  if (!state.parentView) state.parentView = state.currentView;
  state.apiDetailCache[id] = r;

  state.recipes.push({ ...r, id, isApi: true });
  showDetail(id, true);
  state.recipes.pop();
}

function toggleTodayTag(el) {
  el.classList.toggle('selected');
}

// ── Settings ──
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
  // API Search
  apiSearch, showApiDetail,
  // AI Save
  aiSaveRecipe,
  // Settings
  showSettings, updateSetForm, saveSettings: doSaveSettings,
  testAI: doTestAI,
  // Today's Eat
  showTodayEat, doTodayRecommend, showTodayDetail, toggleTodayTag
};

window.App = App;

// ── Initialize ──
async function init() {
  await checkAuth();
  if (state.session) {
    await loadAllData();
  }
  render();
}

init();
