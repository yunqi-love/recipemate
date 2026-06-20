// RecipeMate — Proj Kitchen Recipe Source
// https://proj.kitchen/api — 开源中文菜谱 API，342 道菜

const API_BASE = 'https://proj.kitchen/api';

/**
 * Normalize a Proj Kitchen recipe to RecipeMate standard format.
 */
export function normalizeProjKitchenRecipe(pk) {
  const steps = (pk.steps || []).map((text, i) => ({
    num: i + 1,
    text: text.length > 50 ? text.slice(0, 50) + '…' : text,
    detail: text
  }));
  // Handle when pk.steps is already an array of objects
  const normalizedSteps = (pk.steps || []).map((s, i) => {
    if (typeof s === 'string') {
      return {
        num: i + 1,
        text: s.length > 50 ? s.slice(0, 50) + '…' : s,
        detail: s
      };
    }
    return { num: s.num || i + 1, text: s.text || '', detail: s.detail || '' };
  });

  return {
    id: 'pk_' + pk.id,
    title: pk.name || pk.title || '',
    description: `${pk.category || ''} · ${pk.difficulty || '中等'}${pk.tips ? ' · 💡 ' + pk.tips : ''}`,
    difficulty: pk.difficulty === '简单' ? '简单' : pk.difficulty === '困难' ? '困难' : '中等',
    cook_time: estimateCookTime(pk.category, pk.steps),
    image_url: null, // Proj Kitchen doesn't provide images
    ingredients: (pk.ingredients || []).map(i => ({
      name: i.name || '',
      amount: i.amount || ''
    })),
    steps: normalizedSteps,
    tags: [pk.category].filter(Boolean),
    source: 'projkitchen',
    isApi: true,
    _orig: pk
  };
}

function estimateCookTime(category, steps) {
  if (!steps || steps.length === 0) return 20;
  if (steps.length <= 3) return 15;
  if (steps.length <= 6) return 25;
  if (steps.length <= 10) return 40;
  return 60;
}

/**
 * Fetch all recipes from Proj Kitchen (list format).
 */
export async function fetchProjKitchenList() {
  const cache = window._projKitchenCache;
  if (cache && cache.list) return cache.list;

  try {
    const res = await fetch(`${API_BASE}/recipes`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (!window._projKitchenCache) window._projKitchenCache = {};
    window._projKitchenCache.list = data;
    return data;
  } catch (e) {
    console.warn('Proj Kitchen list fetch failed:', e.message);
    return [];
  }
}

/**
 * Fetch a single recipe detail from Proj Kitchen.
 */
export async function fetchProjKitchenDetail(id) {
  // Strip 'pk_' prefix if present
  const rawId = id.startsWith('pk_') ? id.slice(3) : id;
  const cache = window._projKitchenCache;
  if (cache && cache.details && cache.details[rawId]) return cache.details[rawId];

  try {
    const res = await fetch(`${API_BASE}/recipes/${encodeURIComponent(rawId)}`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const normalized = normalizeProjKitchenRecipe(data);
    if (!cache) window._projKitchenCache = {};
    if (!window._projKitchenCache.details) window._projKitchenCache.details = {};
    window._projKitchenCache.details[rawId] = normalized;
    return normalized;
  } catch (e) {
    console.warn('Proj Kitchen detail fetch failed:', e.message);
    // Fallback: try to use list data
    const list = await fetchProjKitchenList();
    const item = list.find(r => r.id === rawId);
    if (item) return normalizeProjKitchenRecipe(item);
    return null;
  }
}

/**
 * Search Proj Kitchen recipes by keyword.
 */
export async function searchProjKitchen(kw) {
  const list = await fetchProjKitchenList();
  if (!list.length) return [];

  const q = kw.toLowerCase().trim();
  const results = list.filter(r =>
    r.name.toLowerCase().includes(q) ||
    (r.category || '').toLowerCase().includes(q)
  );

  return results.map(r => normalizeProjKitchenRecipe(r));
}

/**
 * Get recipes by category.
 */
export async function getProjKitchenByCategory(category) {
  const list = await fetchProjKitchenList();
  if (!list.length) return [];

  return list
    .filter(r => r.category === category)
    .map(r => normalizeProjKitchenRecipe(r));
}

/**
 * Get all categories.
 */
export async function getProjKitchenCategories() {
  const list = await fetchProjKitchenList();
  const cats = new Set();
  list.forEach(r => cats.add(r.category));
  return [...cats].sort();
}

/**
 * Search by multiple keywords / tags.
 */
export async function searchProjKitchenByTags(tags) {
  const list = await fetchProjKitchenList();
  if (!list.length) return [];

  return list
    .filter(r => tags.some(t => r.category === t || r.name.includes(t)))
    .sort(() => Math.random() - 0.5)
    .map(r => normalizeProjKitchenRecipe(r));
}
