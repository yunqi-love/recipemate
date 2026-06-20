// RecipeMate — Recipe Card Component (v2 with image placeholders)
import { state, getProficiency } from '../app.js';

export function renderCard(r) {
  const prof = state.proficiency[r.id] || getProficiency(0);
  const diffCls = r.difficulty === '简单' ? 'badge-easy'
    : r.difficulty === '中等' ? 'badge-medium' : 'badge-hard';
  const favIcon = state.favorites.has(r.id) ? '❤️' : '🤍';
  // Source tag: inline, not absolute — won't cover title
  let sourceTag = '';
  if (r.isApi) {
    sourceTag = `<span class="card-source-tag src-api">${r.source === 'projkitchen' ? '本地' : r.source === 'themealdb' ? '英文' : '在线'}</span>`;
  } else if (r.user_id) {
    sourceTag = '<span class="card-source-tag src-mine">我的</span>';
  }

  // Image or placeholder
  const imgHTML = r.image_url
    ? `<img class="card-img" src="${r.image_url}" alt="${esc(r.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">${getPlaceholderHTML(r)}`
    : getPlaceholderHTML(r);

  // Mastery tag
  const cc = state.cookedMap[r.id]?.count || 0;
  let masteryTag = '';
  if (cc >= 6) masteryTag = '<span class="mastery-tag mastery-gold">⭐ 拿手菜</span>';
  else if (cc >= 3) masteryTag = '<span class="mastery-tag mastery-silver">🔥 熟练</span>';
  else if (cc >= 1) masteryTag = '<span class="mastery-tag mastery-bronze">🌱 初学</span>';

  // Info tags
  const infoTags = [];
  if ((r.cook_time || 30) <= 20) infoTags.push('⚡ 快手');
  if (cc >= 1) infoTags.push(`👨‍🍳 做过${cc}次`);
  const ingCount = Array.isArray(r.ingredients) ? r.ingredients.length : 0;
  if (ingCount > 0) infoTags.push(`🥬 ${ingCount}种食材`);
  const stepCount = Array.isArray(r.steps) ? r.steps.length : 0;
  if (stepCount > 0) infoTags.push(`📝 ${stepCount}步`);

  return `<div class="recipe-card" onclick="App.showDetail('${r.id}',${!!r.isApi})">
    ${imgHTML}
    <div class="card-body">
      <div class="card-row">
        <span class="card-title">${esc(r.title)}</span>
        ${sourceTag}
        <span class="card-fav" onclick="event.stopPropagation();App.favClick('${r.id}')">${favIcon}</span>
      </div>
      ${r.description ? `<div class="card-desc">${esc(r.description)}</div>` : ''}
      <div class="card-meta">
        <span class="badge ${diffCls}">${esc(r.difficulty || '中等')}</span>
        <span style="font-size:11px;color:var(--text-muted)">⏱ ${r.cook_time || 20}分钟</span>
        ${(r.tags || []).slice(0, 2).map(t => `<span class="tag">${esc(t)}</span>`).join('')}
      </div>
      ${infoTags.length > 0 ? `<div class="card-meta" style="margin-top:6px;gap:4px">${infoTags.map(t => `<span class="recipe-meta-tag">${t}</span>`).join('')}</div>` : ''}
      ${masteryTag ? `<div class="card-meta" style="margin-top:4px">${masteryTag}</div>` : ''}
    </div>
  </div>`;
}

function getPlaceholderHTML(r) {
  const theme = getPlaceholderTheme(r);
  const emoji = getPlaceholderEmoji(r);
  const letter = (r.title || '菜')[0];
  return `<div class="card-img-placeholder ${theme}" style="${r.image_url ? 'display:none' : 'display:flex'}">
    <span>${emoji}</span>
    <span class="ph-letter">${esc(letter)}</span>
  </div>`;
}

function getPlaceholderTheme(r) {
  const cat = (r.category || '').toLowerCase();
  const tags = (r.tags || []).map(t => t.toLowerCase());
  if (cat.includes('素') || cat.includes('蔬') || tags.includes('素菜')) return 'ph-veggie';
  if (cat.includes('荤') || tags.includes('荤菜') || tags.includes('下饭菜')) return 'ph-meat';
  if (cat.includes('汤') || cat.includes('粥')) return 'ph-soup';
  if (cat.includes('主食') || cat.includes('面') || cat.includes('饭')) return 'ph-staple';
  if (cat.includes('甜品') || cat.includes('甜')) return 'ph-dessert';
  if (cat.includes('饮品') || cat.includes('饮')) return 'ph-drink';
  if (cat.includes('水产') || cat.includes('鱼') || cat.includes('虾')) return 'ph-seafood';
  return 'ph-default';
}

function getPlaceholderEmoji(r) {
  const cat = (r.category || '').toLowerCase();
  if (cat.includes('荤')) return '🍖';
  if (cat.includes('素')) return '🥬';
  if (cat.includes('汤')) return '🍲';
  if (cat.includes('主食')) return '🍚';
  if (cat.includes('甜品')) return '🍰';
  if (cat.includes('饮品')) return '🍹';
  if (cat.includes('水产')) return '🐟';
  if (cat.includes('早餐')) return '🥣';
  return '🍳';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export { esc as escapeHtml };
