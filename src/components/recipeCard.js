// RecipeMate — Recipe Card Component
import { state, getProficiency } from '../app.js';

export function renderCard(r) {
  const prof = state.proficiency[r.id] || getProficiency(0);
  const diffCls = r.difficulty === '简单' ? 'badge-easy'
    : r.difficulty === '中等' ? 'badge-medium' : 'badge-hard';
  const favIcon = state.favorites.has(r.id) ? '❤️' : '🤍';
  const source = r.isApi
    ? `<div class="api-badge">${r.source === 'projkitchen' ? '🥘 ProjKitchen' : r.source === 'themealdb' ? '🌐 TheMealDB' : '🌐 在线'}</div>`
    : '';
  const userBadge = r.user_id
    ? `<div class="api-badge" style="right:8px;left:auto;background:#4CAF50">我的</div>` : '';

  // Mastery tag
  const cc = state.cookedMap[r.id]?.count || 0;
  let masteryTag = '';
  if (cc >= 6) masteryTag = '<span class="recipe-meta-tag mastery-gold">⭐ 拿手菜</span>';
  else if (cc >= 3) masteryTag = '<span class="recipe-meta-tag mastery-silver">🔥 熟练</span>';
  else if (cc >= 1) masteryTag = '<span class="recipe-meta-tag mastery-bronze">🌱 初学</span>';

  // Quick hint tags
  const quickTags = [];
  if ((r.cook_time || 30) <= 20) quickTags.push('⚡ 快手');
  if (cc >= 1) quickTags.push(`👨‍🍳 ${cc}次`);

  return `<div class="recipe-card" onclick="App.showDetail('${r.id}',${!!r.isApi})">
    ${r.image_url ? `<img class="card-img" src="${r.image_url}" alt="${esc(r.title)}" loading="lazy">` : ''}
    ${source}${userBadge}
    <div class="card-body">
      <div class="card-row">
        <span class="card-title">${esc(r.title)}</span>
        <span class="card-fav" onclick="event.stopPropagation();App.favClick('${r.id}')">${favIcon}</span>
      </div>
      <div class="card-desc">${esc(r.description || '')}</div>
      <div class="card-meta">
        <span class="badge ${diffCls}">${esc(r.difficulty || '中等')}</span>
        <span style="font-size:12px;color:#999">⏱ ${r.cook_time || 20}分钟</span>
        <span class="prof-badge ${prof.cls}" onclick="event.stopPropagation();App.adjustCount('${r.id}')">${prof.emoji} ${prof.level}</span>
        ${(r.tags || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
        ${quickTags.map(t => `<span class="recipe-meta-tag">${esc(t)}</span>`).join('')}
      </div>
      ${masteryTag ? `<div class="card-meta" style="margin-top:4px">${masteryTag}</div>` : ''}
    </div>
  </div>`;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export { esc as escapeHtml };
