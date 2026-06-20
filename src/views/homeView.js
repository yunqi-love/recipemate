// RecipeMate — Home View (with "Today's Eat" feature)
import { state } from '../app.js';
import { renderCard } from '../components/recipeCard.js';

export function renderHome() {
  const all = [...state.recipes, ...state.customRecipes];

  // Carousel: favorited + most cooked
  const featured = all
    .filter(r => state.favorites.has(r.id) || (state.cookedMap[r.id]?.count || 0) > 0)
    .sort((a, b) => (state.cookedMap[b.id]?.count || 0) - (state.cookedMap[a.id]?.count || 0))
    .slice(0, 5);
  if (featured.length === 0) featured.push(...all.slice(0, 3));

  // Random seasonal picks
  const seasonal = all
    .filter(r => r.difficulty === '中等')
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // Recent custom recipes
  const recent = all.filter(r => r.user_id).slice(0, 4);

  return `
    <div class="top-bar">
      <span class="brand">🍳 RecipeMate</span>
      <span class="user" onclick="App.showSettings()">👤 ${state.session?.user?.email || ''} ›</span>
    </div>
    <div class="hero">
      <h1>今天吃什么？</h1>
      <p>${all.length} 道菜谱 · ${state.favorites.size} 收藏 · ${Object.keys(state.cookedMap).length} 做过</p>
      <button class="btn btn-outline btn-sm"
        style="margin-top:12px;color:#fff;border-color:rgba(255,255,255,.5);flex:none"
        onclick="App.showTodayEat()">🎲 今天吃什么</button>
    </div>
    ${featured.length > 0 ? `
    <div style="padding:12px 16px 0">
      <div class="section-title" style="margin-top:0">🌟 你常做的</div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch">
        ${featured.map(r => `
          <div class="recipe-card" style="min-width:200px;max-width:200px;flex-shrink:0" onclick="App.showDetail('${r.id}',false)">
            ${r.image_url ? `<img class="card-img" src="${r.image_url}" alt="${esc(r.title)}" loading="lazy" style="height:120px">` : ''}
            <div class="card-body">
              <div class="card-title" style="font-size:15px">${esc(r.title)}</div>
              <div class="card-meta"><span style="font-size:11px;color:#999">👨‍🍳 ${state.cookedMap[r.id]?.count || 0}次</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : ''}
    ${seasonal.length > 0 ? `
    <div style="padding:8px 16px 0">
      <div class="section-title">🌸 换个口味试试</div>
      ${seasonal.map(r => renderCard(r)).join('')}
    </div>` : ''}
    ${recent.length > 0 ? `
    <div style="padding:8px 16px 0">
      <div class="section-title">🆕 最近自建</div>
      ${recent.map(r => renderCard(r)).join('')}
    </div>` : ''}
    <div style="text-align:center;padding:10px;margin-bottom:80px">
      <button class="btn btn-outline btn-sm" onclick="App.navTo('recipes')" style="flex:none;padding:10px 30px">📖 浏览全部菜谱</button>
    </div>
    ${renderNav('home')}`;
}

export function renderNav(current) {
  return `<div class="nav">
    <button class="${current === 'home' ? 'active' : ''}" onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
    <button class="${current === 'recipes' || current === 'favorites' ? 'active' : ''}" onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
    <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
    <button class="${current === 'shop' ? 'active' : ''}" onclick="App.navTo('shop')"><span class="ico">🛒</span>清单</button>
  </div>`;
}

/**
 * Render the "Today's Eat" modal with conditions.
 * Uses state.todayOptions for persistence.
 */
export function renderTodayEatModal() {
  // Initialize todayOptions if needed
  if (!state.todayOptions) {
    state.todayOptions = { types: [], servings: '2', avoid: '' };
  }

  const types = state.todayOptions.types || [];
  const servings = state.todayOptions.servings || '2';
  const avoid = state.todayOptions.avoid || '';

  const TAG_LIST = ['家常菜', '快手菜', '下饭菜', '减脂', '早餐', '晚餐', '川菜', '素菜', '荤菜', '汤与粥'];

  const html = `<div class="modal-overlay" id="todayEatModal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <h3>🎲 今天吃什么？</h3>
      <p style="font-size:12px;color:#999;text-align:center;margin-bottom:16px">选择你的偏好，我来推荐</p>

      <label class="form-label">用餐人数</label>
      <select id="teServings" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD;margin-bottom:12px;font-size:14px" onchange="App.updateTodayOptions()">
        <option value="1" ${servings === '1' ? 'selected' : ''}>1人</option>
        <option value="2" ${servings === '2' ? 'selected' : ''}>2人</option>
        <option value="3" ${servings === '3' ? 'selected' : ''}>3人</option>
        <option value="4" ${servings === '4' ? 'selected' : ''}>4人+</option>
      </select>

      <label class="form-label">忌口 / 过敏</label>
      <input id="teAvoid" placeholder="例如：海鲜、花生、牛奶（可留空）" value="${escAttr(avoid)}" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD;margin-bottom:12px;font-size:14px" onchange="App.updateTodayOptions()">

      <label class="form-label">想吃类型（可多选）</label>
      <div id="teSelectedStatus" style="font-size:12px;color:#FF6B35;margin-bottom:8px;font-weight:600">${types.length > 0 ? '已选择：' + types.join('、') : '未选择类型，将随机推荐'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px" id="teTypes">
        ${TAG_LIST.map(t => {
          const isSelected = types.includes(t);
          return `<span class="filter-chip te-chip${isSelected ? ' selected' : ''}" data-tag="${t}" onclick="App.toggleTodayTag(this)">${t}</span>`;
        }).join('')}
      </div>

      <label class="form-label">或让 AI 推荐</label>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="App.doTodayRecommend(true)" style="flex:1">🤖 AI 智能推荐</button>
        <button class="btn btn-outline" onclick="App.doTodayRecommend(false)" style="flex:1">📖 从菜谱库挑选</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:8px;color:#999" onclick="document.getElementById('todayEatModal')?.remove()">取消</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
