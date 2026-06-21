// RecipeMate — Local Chinese Recipe Source
// Loads complete Chinese recipes from pre-bundled JSON (public/data/chinese-recipes.json).
// This is the PRIMARY data source — highest priority, always available offline.

let _cache = null;
let _loadPromise = null;

/**
 * Load the full Chinese recipes dataset.
 * Caches in memory after first load.
 */
export async function loadLocalChineseRecipes() {
  if (_cache) return _cache;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    // Try multiple paths: base path for prod, root for dev
    const paths = [
      (import.meta.env.BASE_URL || '/') + 'data/chinese-recipes.json',
      '/recipemate/data/chinese-recipes.json',
      '/data/chinese-recipes.json'
    ];
    for (const url of paths) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          _cache = data.recipes || [];
          console.log(`[localChineseRecipeSource] Loaded ${_cache.length} Chinese recipes from ${url}`);
          return _cache;
        }
      } catch (e) {
        // Try next path
      }
    }
    console.warn('[localChineseRecipeSource] Failed to load local JSON from all paths:', paths);
    _cache = [];
    return _cache;
  })();

  return _loadPromise;
}

/**
 * Get all locally available categories.
 */
export async function getLocalCategories() {
  const recipes = await loadLocalChineseRecipes();
  const cats = new Set();
  recipes.forEach(r => { if (r.category) cats.add(r.category); });
  return [...cats].sort();
}

/**
 * Get recipe count.
 */
export async function getLocalRecipeCount() {
  const recipes = await loadLocalChineseRecipes();
  return recipes.length;
}

/**
 * Search local Chinese recipes by keyword.
 * Searches: title, ingredients, steps, tags, category.
 */
export async function searchLocalChineseRecipes(kw) {
  const recipes = await loadLocalChineseRecipes();
  if (!recipes.length) return [];

  const q = kw.toLowerCase().trim();
  if (!q) return recipes.slice(0, 20); // Return first 20 if no keyword

  const results = recipes.filter(r => {
    // Search by title (primary)
    if (r.title.toLowerCase().includes(q)) return true;

    // Search by aliases (e.g., 西红柿炒蛋 aliases for 番茄炒蛋)
    if ((r.aliases || []).some(a => a.toLowerCase().includes(q))) return true;

    // Search by category
    if ((r.category || '').toLowerCase().includes(q)) return true;

    // Search by tags
    if ((r.tags || []).some(t => t.toLowerCase().includes(q))) return true;

    // Search by ingredients (name and amount)
    if ((r.ingredients || []).some(i =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.amount || '').toLowerCase().includes(q)
    )) return true;

    // Search by steps text
    if ((r.steps || []).some(s =>
      (s.text || s.detail || '').toLowerCase().includes(q)
    )) return true;

    // Search by description
    if ((r.description || '').toLowerCase().includes(q)) return true;

    // Search by sources attribution
    if ((r.sources || [r.source]).some(s =>
      s.toLowerCase().includes(q)
    )) return true;

    return false;
  });

  return results;
}

/**
 * Get a single recipe by ID from local source.
 */
export async function getLocalRecipeById(id) {
  const recipes = await loadLocalChineseRecipes();
  return recipes.find(r => r.id === id) || null;
}

/**
 * Search local recipes by multiple tags (OR match).
 * Used by "Today's Eat" recommendation.
 */
export async function searchLocalByTags(tags) {
  const recipes = await loadLocalChineseRecipes();
  if (!recipes.length) return [];

  if (!tags || tags.length === 0) {
    // Return shuffled subset
    return recipes.slice().sort(() => Math.random() - 0.5);
  }

  return recipes.filter(r =>
    tags.some(tag =>
      (r.category || '') === tag ||
      (r.tags || []).some(t => t === tag) ||
      r.title.includes(tag) ||
      (r.ingredients || []).some(i => (i.name || '').includes(tag))
    )
  );
}

/**
 * Get a random sample of recipes, optionally filtered by exclusion list.
 */
export async function getRandomLocalRecipes(count = 3, excludeTags = []) {
  const recipes = await loadLocalChineseRecipes();
  let pool = recipes;

  if (excludeTags.length > 0) {
    pool = recipes.filter(r =>
      !excludeTags.some(et =>
        (r.ingredients || []).some(i =>
          (i.name || '').toLowerCase().includes(et.toLowerCase())
        )
      )
    );
  }

  // Shuffle and pick
  const shuffled = pool.slice().sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
