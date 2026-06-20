// RecipeMate — Home View v2 ("Tonight's Decision Center")
import { state } from '../app.js';
import { renderCard } from '../components/recipeCard.js';

export function renderHome() {
  const all = [...state.recipes, ...state.customRecipes];
  const greeting = getTimeGreeting();

  // Featured (faved + most cooked)
  const featured = all
    .filter(r => state.favorites.has(r.id) || (state.cookedMap[r.id]?.count || 0) > 0)
    .sort((a, b) => (state.cookedMap[b.id]?.count || 0) - (state.cookedMap[a.id]?.count || 0))
    .slice(0, 5);
  if (featured.length === 0) featured.push(...all.slice(0, 3));

  // Recent cooked
  const recentCooked = all
    .filter(r => (state.cookedMap[r.id]?.count || 0) > 0)
    .sort((a, b) => new Date(state.cookedMap[b.id]?.last || 0) - new Date(state.cookedMap[a.id]?.last || 0))
    .slice(0, 3);

  // My mastery dishes (cooked >= 6)
  const mastery = all
    .filter(r => (state.cookedMap[r.id]?.count || 0) >= 6)
    .sort((a, b) => (state.cookedMap[b.id]?.count || 0) - (state.cookedMap[a.id]?.count || 0))
    .slice(0, 3);

  // Weekly suggestions (local rules, no AI)
  const suggestions = getLocalSuggestions(all);

  return `
    <div class="top-bar">
      <span class="brand">🍳 RecipeMate</span>
      <span class="user" onclick="App.showSettings()">👤 ${state.session?.user?.email || ''} ›</span>
    </div>

    <!-- Hero with time-aware greeting -->
    <div class="hero">
      <h1>${greeting.title}</h1>
      <p>${greeting.subtitle}</p>
      <button class="btn btn-outline btn-sm"
        style="margin-top:12px;color:#fff;border-color:rgba(255,255,255,.5)"
        onclick="App.showTodayEat()">🎲 今天吃什么</button>
    </div>

    <!-- Quick scenario grid -->
    <div style="padding:14px 16px 0">
      <div class="section-title" style="margin-top:0">🍽️ 快速入口</div>
      <div class="scenario-grid">
        <div class="scenario-card" onclick="App.applyQuickScenarioFilter('quick')">
          <span class="scenario-emoji">⚡</span>
          <span class="scenario-label">快手晚餐</span>
          <span class="scenario-desc">30分钟内</span>
        </div>
        <div class="scenario-card" onclick="App.applyQuickScenarioFilter('duo')">
          <span class="scenario-emoji">👫</span>
          <span class="scenario-label">二人食</span>
          <span class="scenario-desc">一起做饭</span>
        </div>
        <div class="scenario-card" onclick="App.showTodayEat()">
          <span class="scenario-emoji">🍚</span>
          <span class="scenario-label">下饭菜</span>
          <span class="scenario-desc">超下饭</span>
        </div>
        <div class="scenario-card" onclick="App.applyQuickScenarioFilter('quick')">
          <span class="scenario-emoji">🥬</span>
          <span class="scenario-label">清淡一点</span>
          <span class="scenario-desc">少油少盐</span>
        </div>
        <div class="scenario-card" onclick="App.applyQuickScenarioFilter('quick')">
          <span class="scenario-emoji">🍱</span>
          <span class="scenario-label">明天带饭</span>
          <span class="scenario-desc">便当友好</span>
        </div>
        <div class="scenario-card" onclick="App.applyQuickScenarioFilter('weekend')">
          <span class="scenario-emoji">🍳</span>
          <span class="scenario-label">周末尝鲜</span>
          <span class="scenario-desc">慢慢做</span>
        </div>
      </div>
    </div>

    <!-- Recent cooked -->
    ${recentCooked.length > 0 ? `
    <div style="padding:12px 16px 0">
      <div class="section-title">🕐 最近做过</div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none">
        ${recentCooked.map(r => `
          <div class="recipe-card" style="min-width:170px;max-width:170px;flex-shrink:0" onclick="App.showDetail('${r.id}',false)">
            ${r.image_url
              ? `<img class="card-img" src="${r.image_url}" alt="${esc(r.title)}" loading="lazy" style="height:110px">`
              : `<div class="card-img-placeholder ph-default" style="height:110px"><span>🍳</span><span class="ph-letter">${esc((r.title||'菜')[0])}</span></div>`}
            <div class="card-body">
              <div class="card-title" style="font-size:14px">${esc(r.title)}</div>
              <div class="card-meta"><span style="font-size:11px;color:var(--text-muted)">${formatRelativeTime(r.id)} · ${state.cookedMap[r.id]?.count || 0}次</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : `
    <div style="padding:12px 16px 0">
      <div class="section-title">🕐 最近做过</div>
      <div class="empty-state" style="padding:24px 12px">
        <div class="empty-state-title">还没有做过菜</div>
        <div class="empty-state-desc">做完第一道菜后，这里会记录你的厨房足迹</div>
      </div>
    </div>`}

    <!-- My mastery dishes -->
    ${mastery.length > 0 ? `
    <div style="padding:12px 16px 0">
      <div class="section-title">⭐ 我的拿手菜</div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none">
        ${mastery.map(r => `
          <div class="recipe-card" style="min-width:170px;max-width:170px;flex-shrink:0" onclick="App.showDetail('${r.id}',false)">
            ${r.image_url
              ? `<img class="card-img" src="${r.image_url}" alt="${esc(r.title)}" loading="lazy" style="height:110px">`
              : `<div class="card-img-placeholder ph-meat" style="height:110px"><span>⭐</span><span class="ph-letter">${esc((r.title||'菜')[0])}</span></div>`}
            <div class="card-body">
              <div class="card-title" style="font-size:14px">${esc(r.title)}</div>
              <div class="card-meta"><span class="mastery-tag mastery-gold">⭐ 拿手菜 · ${state.cookedMap[r.id]?.count || 0}次</span></div>
            </div>
          </div>`).join('')}
      </div>
    </div>` : (recentCooked.length > 0 ? `
    <div style="padding:8px 16px 0">
      <div class="section-title">⭐ 我的拿手菜</div>
      <div class="empty-state" style="padding:20px 12px">
        <div class="empty-state-desc">多做几次，你的拿手菜会出现在这里</div>
      </div>
    </div>` : '')}

    <!-- Weekly suggestions -->
    ${suggestions.length > 0 ? `
    <div style="padding:12px 16px 0">
      <div class="section-title">💡 本周建议</div>
      ${suggestions.map(s => `
        <div class="suggestion-row" onclick="App.showDetail('${s.id}',false)">
          <div class="suggestion-left">
            <span class="suggestion-emoji">${s.emoji}</span>
            <div>
              <div class="suggestion-title">${esc(s.title)}</div>
              <div class="suggestion-reason">${esc(s.reason)}</div>
            </div>
          </div>
          <span class="suggestion-tag">${esc(s.tag)}</span>
        </div>
      `).join('')}
    </div>` : ''}

    <!-- Featured carousel -->
    ${featured.length > 0 ? `
    <div style="padding:12px 16px 0">
      <div class="section-title">🌟 你常做的</div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:6px;-webkit-overflow-scrolling:touch;scrollbar-width:none">
        ${featured.map(r => renderCard(r).replace('class="recipe-card"', 'class="recipe-card" style="min-width:210px;max-width:210px;flex-shrink:0"').replace('height:150px', 'height:120px')).join('')}
      </div>
    </div>` : ''}

    <div style="text-align:center;padding:12px;margin-bottom:calc(80px + var(--safe-bottom))">
      <button class="btn btn-outline btn-sm" onclick="App.navTo('recipes')" style="flex:none;padding:10px 30px">📖 浏览全部菜谱</button>
    </div>
    ${renderNav('home')}`;
}

function getTimeGreeting() {
  const h = new Date().getHours();
  const day = new Date().getDay(); // 0=Sun, 6=Sat
  if (h >= 5 && h < 10) {
    return { title: '早安，今天早餐吃什么？', subtitle: '用一顿好早餐开始新的一天 ☀️' };
  }
  if (h >= 10 && h < 17) {
    if (day === 0 || day === 6) {
      return { title: '周末慢慢做点好吃的', subtitle: '不赶时间，享受烹饪的乐趣 🍳' };
    }
    return { title: '中午想吃点什么？', subtitle: '好好吃饭，下午才有力气 💪' };
  }
  if (day === 0 || day === 6) {
    return { title: '周末晚上，做顿好的', subtitle: '今晚有时间，试试新菜吧 🥂' };
  }
  return { title: '今晚想吃点什么？', subtitle: '下班后，也可以好好吃饭 🏠' };
}

function getLocalSuggestions(all) {
  if (all.length === 0) return [];
  const suggestions = [];
  const used = new Set();

  // 1. Quick dish (<=20 min, easy)
  const quick = all.filter(r => (r.cook_time || 30) <= 20 && r.difficulty !== '困难' && !used.has(r.id));
  if (quick.length > 0) {
    const pick = quick[Math.floor(Math.random() * quick.length)];
    used.add(pick.id);
    suggestions.push({ ...pick, emoji: '⚡', tag: '快手菜', reason: '工作日晚餐，20分钟内搞定' });
  }

  // 2. Veggie dish
  const veggie = all.filter(r => {
    if (used.has(r.id)) return false;
    const tags = (r.tags || []).map(t => t.toLowerCase());
    const cat = (r.category || '').toLowerCase();
    return tags.includes('素菜') || cat.includes('素') || cat.includes('蔬');
  });
  if (veggie.length > 0) {
    const pick = veggie[Math.floor(Math.random() * veggie.length)];
    used.add(pick.id);
    suggestions.push({ ...pick, emoji: '🥬', tag: '蔬菜', reason: '补充维生素，荤素搭配更健康' });
  }

  // 3. Protein dish
  const protein = all.filter(r => {
    if (used.has(r.id)) return false;
    const cat = (r.category || '');
    const tags = (r.tags || []);
    return cat === '荤菜' || cat === '水产' || tags.includes('荤菜');
  });
  if (protein.length > 0) {
    const pick = protein[Math.floor(Math.random() * protein.length)];
    used.add(pick.id);
    suggestions.push({ ...pick, emoji: '🍖', tag: '蛋白质', reason: '优质蛋白，满足营养需求' });
  }

  // 4. Weekend dish
  const weekend = all.filter(r => {
    if (used.has(r.id)) return false;
    return (r.difficulty === '中等' || r.difficulty === '困难') && (r.cook_time || 20) >= 30;
  });
  if (weekend.length > 0) {
    const pick = weekend[Math.floor(Math.random() * weekend.length)];
    suggestions.push({ ...pick, emoji: '🍳', tag: '周末菜', reason: '周末慢慢做，享受烹饪乐趣' });
  }

  return suggestions;
}

function formatRelativeTime(rid) {
  const last = state.cookedMap[rid]?.last;
  if (!last) return '';
  const days = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days <= 7) return `${days}天前`;
  if (days <= 30) return `${Math.floor(days/7)}周前`;
  return new Date(last).toLocaleDateString();
}

export function renderNav(current) {
  return `<div class="nav">
    <button class="${current === 'home' ? 'active' : ''}" onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
    <button class="${current === 'recipes' || current === 'favorites' ? 'active' : ''}" onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
    <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
    <button class="${current === 'shop' ? 'active' : ''}" onclick="App.navTo('shop')"><span class="ico">🛒</span>清单</button>
  </div>`;
}

export function renderTodayEatModal() {
  if (!state.todayOptions) state.todayOptions = { types: [], servings: '2', avoid: '' };
  const types = state.todayOptions.types || [];
  const servings = state.todayOptions.servings || '2';
  const avoid = state.todayOptions.avoid || '';
  const TAG_LIST = ['家常菜', '快手菜', '下饭菜', '减脂', '早餐', '晚餐', '川菜', '素菜', '荤菜', '汤与粥'];

  const html = `<div class="modal-overlay" id="todayEatModal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <h3>🎲 今天吃什么？</h3>
      <p style="font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:16px">选择你的偏好，我来推荐</p>
      <label class="form-label">用餐人数</label>
      <select id="teServings" style="width:100%;padding:12px;border-radius:var(--radius-btn);border:1px solid var(--border);margin-bottom:12px;font-size:14px" onchange="App.updateTodayOptions()">
        <option value="1" ${servings === '1' ? 'selected' : ''}>1人</option>
        <option value="2" ${servings === '2' ? 'selected' : ''}>2人</option>
        <option value="3" ${servings === '3' ? 'selected' : ''}>3人</option>
        <option value="4" ${servings === '4' ? 'selected' : ''}>4人+</option>
      </select>
      <label class="form-label">忌口 / 过敏</label>
      <input id="teAvoid" placeholder="例如：海鲜、花生、牛奶（可留空）" value="${escAttr(avoid)}" style="width:100%;padding:12px;border-radius:var(--radius-btn);border:1px solid var(--border);margin-bottom:12px;font-size:14px" onchange="App.updateTodayOptions()">
      <label class="form-label">想吃类型（可多选）</label>
      <div id="teSelectedStatus" style="font-size:12px;color:var(--primary);margin-bottom:8px;font-weight:600">${types.length > 0 ? '已选择：' + types.join('、') : '未选择类型，将随机推荐'}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px" id="teTypes">
        ${TAG_LIST.map(t => {
          const isSelected = types.includes(t);
          return `<span class="filter-chip te-chip${isSelected ? ' selected' : ''}" data-tag="${t}" onclick="App.toggleTodayTag(this)">${t}</span>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="App.doTodayRecommend(true)" style="flex:1">🤖 AI 智能推荐</button>
        <button class="btn btn-outline" onclick="App.doTodayRecommend(false)" style="flex:1">📖 从菜谱库挑选</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:8px;color:var(--text-muted)" onclick="document.getElementById('todayEatModal')?.remove()">取消</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
