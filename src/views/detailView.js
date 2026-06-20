// RecipeMate — Recipe Detail View
import { state, getProficiency } from '../app.js';
import { escapeHtml } from '../components/recipeCard.js';

export function showDetail(id, isApi) {
  state.savedScrollY = window.scrollY;
  state.currentDetailId = id;
  state.currentDetailIsApi = !!isApi;
  if (!state.parentView) state.parentView = state.currentView;

  // Find recipe in all sources
  let r = [...state.recipes, ...state.customRecipes].find(x => x.id === id);
  // Check API detail cache
  if (!r && isApi && state.apiDetailCache[id]) {
    r = state.apiDetailCache[id];
  }
  if (!r) return;

  const prof = state.proficiency[id] || getProficiency(0);
  const diffCls = r.difficulty === '简单' ? 'badge-easy' : r.difficulty === '中等' ? 'badge-medium' : 'badge-hard';
  const cc = state.cookedMap[id];
  const count = cc ? cc.count : 0;
  const last = cc ? cc.last : null;

  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients
    : (typeof r.ingredients === 'string' ? JSON.parse(r.ingredients) : []);
  const steps = Array.isArray(r.steps)
    ? r.steps
    : (typeof r.steps === 'string' ? JSON.parse(r.steps) : []);
  const recipeJournals = state.journals.filter(j => j.recipe_id === id);
  const tags = r.tags || [];

  // Determine source badge
  let sourceBadge = '';
  if (r.source === 'projkitchen') sourceBadge = '🥘 ProjKitchen';
  else if (r.source === 'themealdb') sourceBadge = '🌐 TheMealDB';
  else if (r.isApi) sourceBadge = '🌐 在线';

  const isCustom = state.customRecipes.some(x => x.id === id);

  document.getElementById('app').innerHTML = `
    <div class="content">
      <div class="back-btn" onclick="App.goBack()">‹ 返回</div>
      ${r.image_url ? `<img class="detail-img" src="${r.image_url}" alt="${escapeHtml(r.title)}" loading="lazy" onerror="this.style.display='none'">` : ''}
      <div class="detail-title">${escapeHtml(r.title)}
        ${sourceBadge ? `<span style="font-size:11px;color:var(--text-muted);margin-left:8px;font-weight:400">${sourceBadge}</span>` : ''}
      </div>
      <div class="detail-desc">${escapeHtml(r.description || '')}</div>
      <div class="detail-meta">
        <span class="badge ${diffCls}">${escapeHtml(r.difficulty || '中等')}</span>
        <span style="font-size:13px;color:var(--text-muted)">⏱ ${r.cook_time || 20} 分钟</span>
        <span class="prof-badge ${prof.cls}" onclick="App.adjustCount('${id}')">${prof.emoji} ${prof.level}（${count}次）</span>
        ${count >= 6 ? '<span class="mastery-tag mastery-gold">⭐ 拿手菜</span>' : count >= 3 ? '<span class="mastery-tag mastery-silver">🔥 逐渐熟练</span>' : count >= 1 ? '<span class="mastery-tag mastery-bronze">🌱 刚开始练</span>' : ''}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
      ${steps.length > 0 ? `
      <div class="section-title">🍳 做菜前准备</div>
      ${renderPrepCard(r, steps.length, ingredients.length)}
      <div style="margin-top:8px">
        <button class="btn btn-primary btn-block" onclick="App.openCookingMode('${id}')" style="border-radius:var(--radius-btn)">👨‍🍳 开始做菜</button>
      </div>` : ''}
      <div class="section-title">🥬 食材</div>
      <div class="ing-chips">
        ${ingredients.length ? ingredients.map(i =>
          `<span class="ing-chip">${typeof i === 'string' ? escapeHtml(i) : `${escapeHtml(i.name)}${i.amount ? ' — ' + escapeHtml(i.amount) : ''}`}</span>`
        ).join('') : '<span style="color:#999">暂无食材信息</span>'}
      </div>
      <div class="section-title">📝 步骤</div>
      ${steps.length ? steps.map(s => {
        const detail = typeof s === 'string' ? s : (s.detail || s.text || '');
        const title = typeof s === 'string' ? s : (s.text || '');
        return `<div class="step-item">
          <span class="step-num">${s.num || ''}</span>
          <div>
            <div class="step-text">${escapeHtml(title)}</div>
            ${detail !== title ? `<div class="step-detail">${escapeHtml(detail)}</div>` : ''}
          </div>
        </div>`;
      }).join('') : '<div class="empty" style="padding:20px">暂无步骤信息</div>'}
      <div class="cooked-stats">
        累计 <b>${count}</b> 次 · <b>${prof.emoji} ${prof.level}</b>
        <span class="prof-adjust">
          <button onclick="App.decreaseCooked('${id}')">−</button>
          <button onclick="App.incrementCooked('${id}')">+</button>
        </span>
        ${last ? `· 最近：${new Date(last).toLocaleDateString()}` : ''}
      </div>
      ${!isApi ? `
      <div class="action-row">
        <button class="btn ${state.favorites.has(id) ? 'btn-primary' : 'btn-outline'}" onclick="App.favClick('${id}')">${state.favorites.has(id) ? '❤️ 已收藏' : '🤍 收藏'}</button>
        <button class="btn btn-green" onclick="App.cookWithJournal('${id}')">📸 打卡（拍照+心得）</button>
      </div>
      <button class="btn btn-outline btn-block" onclick="App.shopClick('${id}')">🛒 加入购物清单</button>
      <button class="btn btn-outline btn-block" style="margin-top:4px;border-color:#4CAF50;color:#4CAF50" onclick="App.editCustomRecipe('${id}')">✏️ ${isCustom ? '编辑菜谱' : '编辑 / 保存到我的菜谱'}</button>
      ${isCustom ? `<button class="btn btn-outline btn-block" style="margin-top:4px;border-color:#F44336;color:#F44336" onclick="App.deleteCustomRecipe('${id}')">🗑 删除菜谱</button>` : ''}
      <div class="section-title">📸 打卡记录（${recipeJournals.length}次）</div>
      ${recipeJournals.length === 0 ? '<div class="empty" style="padding:20px">还没有打卡记录<br>做完菜点上面按钮拍照记录吧~</div>' : ''}
      ${recipeJournals.map((j, idx) => `
        <div class="journal-entry">
          <div class="j-header">
            <div class="j-date">🕐 ${new Date(j.cooked_at).toLocaleString()} · 第${recipeJournals.length - idx}次做</div>
            <div style="display:flex;gap:4px">
              <button class="journal-action-btn" onclick="event.stopPropagation();App.showDetail('${id}',false)" title="再做一次">🔄</button>
              <button class="journal-delete-btn" onclick="event.stopPropagation();App.deleteJournalEntry('${j.id}')" title="删除">🗑</button>
            </div>
          </div>
          ${j.photo_url ? `<img src="${j.photo_url}" alt="成品照" loading="lazy">` : ''}
          ${j.notes ? `<div class="j-notes">💬 ${escapeHtml(j.notes)}</div>` : ''}
        </div>`).join('')}
      ` : `
      <div class="action-row">
        <button class="btn ${state.favorites.has(id) ? 'btn-primary' : 'btn-outline'}" onclick="App.favClick('${id}')">${state.favorites.has(id) ? '❤️ 已收藏' : '🤍 收藏'}</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:4px;border-color:#4CAF50;color:#4CAF50" onclick="App.saveApiRecipeToMyRecipes('${id}')">💾 保存到我的菜谱</button>
      `}
      <button class="btn btn-outline btn-block" style="margin-top:4px;border-color:#FF9800;color:#FF9800" onclick="App.showWeeklyMenuPicker('${id}')">📅 加入本周菜单</button>
    </div>`;
  window.scrollTo(0, 0);
}

function renderPrepCard(r, stepCount, ingCount) {
  const time = r.cook_time || 30;
  const timeLabel = time <= 15 ? '超快' : time <= 30 ? '快速' : time <= 60 ? '中等' : '慢炖';
  const tips = getPrepTips(r, time, stepCount, ingCount);
  return `<div class="prep-card">
    <div class="prep-item"><span class="prep-emoji">⏱</span> 预计${time}分钟 <span style="font-size:10px;color:var(--text-muted);margin-left:4px">${timeLabel}</span></div>
    <div class="prep-item"><span class="prep-emoji">📊</span> ${escapeHtml(r.difficulty || '中等')}</div>
    <div class="prep-item"><span class="prep-emoji">🥬</span> ${ingCount}种食材</div>
    <div class="prep-item"><span class="prep-emoji">📝</span> ${stepCount}个步骤</div>
    ${tips.length > 0 ? `<div class="prep-tips">${tips.map(t => `<span class="prep-tip">💡 ${escapeHtml(t)}</span>`).join('')}</div>` : ''}
  </div>`;
}

function getPrepTips(r, time, stepCount, ingCount) {
  const tips = [];
  const tags = (r.tags || []).map(t => t.toLowerCase());
  const cat = (r.category || '').toLowerCase();
  if (time <= 20) tips.push('下班后快速完成，适合工作日晚餐');
  if (cat.includes('荤') || tags.includes('荤菜')) tips.push('肉类提前解冻或腌制会更入味');
  if (cat.includes('素') || tags.includes('素菜')) tips.push('蔬菜最后再炒，保持脆嫩口感');
  if (stepCount <= 4) tips.push('步骤少，新手友好');
  if (ingCount <= 5) tips.push('食材不多，容易准备');
  if (time >= 60) tips.push('周末慢慢做，享受烹饪乐趣');
  if (r.difficulty === '简单') tips.push('适合刚开始学做菜的新手');
  if (tags.includes('快手菜')) tips.push('先把调料备好，下锅一气呵成');
  return tips.slice(0, 3);
}

export function renderCookModal(rid) {
  return `<div class="modal-overlay" id="cookModal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <h3>📸 记录这一次烹饪</h3>
      <div class="upload-area" id="cookUpload"><p>📷 点击上传成品照（可选）</p><input type="file" accept="image/*" id="cookPhoto" style="display:none" onchange="App.previewCookPhoto()"></div>
      <img id="cookPreview" class="preview-img" style="display:none">
      <label class="form-label">笔记（可选）</label>
      <textarea id="cookNotes" rows="3" placeholder="今天做得怎么样？有什么心得？"></textarea>
      <button class="btn btn-green btn-block" onclick="App.confirmCook('${rid}')" style="margin-top:12px">✅ 确认记录</button>
      <button class="btn btn-outline btn-block" onclick="App.quickCook('${rid}')" style="margin-top:4px">跳过，直接计数</button>
    </div>
  </div>`;
}
