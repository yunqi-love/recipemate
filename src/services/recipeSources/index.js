// RecipeMate — Recipe Sources Index
// 3-tier data source strategy:
//   Tier 1: Local Chinese recipes (public/data/chinese-recipes.json) — PRIMARY
//   Tier 2: Proj Kitchen API detail endpoint — SUPPLEMENT
//   Tier 3: TheMealDB — MANUAL English fallback (default OFF)

import { searchLocalChineseRecipes, getLocalRecipeById } from './localChineseRecipeSource.js';
import { searchProjKitchen, fetchProjKitchenDetail, normalizeProjKitchenRecipe } from './projKitchenSource.js';
import { searchMealDB } from './mealDbSource.js';
import { state } from '../../app.js';

/**
 * Search all sources with proper priority.
 *
 * Default order (Chinese-first):
 *   1. Local Chinese recipes (pre-bundled JSON)
 *   2. Proj Kitchen API (online supplement)
 *   3. TheMealDB — ONLY if user has enabled allowEnglishFallback in settings
 */
export async function searchAllSources(kw) {
  state.debugSearchSource = null;
  state.debugSearchCount = 0;

  // Tier 1: Local Chinese recipes (always primary)
  const localResults = await searchLocalChineseRecipes(kw);
  if (localResults.length > 0) {
    state.debugSearchSource = 'local_chinese';
    state.debugSearchCount = localResults.length;
    return { results: localResults, source: 'local_chinese' };
  }

  // Tier 2: Proj Kitchen API
  const pkResults = await searchProjKitchen(kw);
  if (pkResults.length > 0) {
    state.debugSearchSource = 'projkitchen';
    state.debugSearchCount = pkResults.length;
    return { results: pkResults, source: 'projkitchen' };
  }

  // Tier 3: TheMealDB (only if user explicitly enabled English fallback)
  const allowEnglish = state.allowEnglishFallback === true;
  if (allowEnglish) {
    const mdResults = await searchMealDB(kw);
    if (mdResults.length > 0) {
      state.debugSearchSource = 'themealdb';
      state.debugSearchCount = mdResults.length;
      return { results: mdResults, source: 'themealdb' };
    }
  }

  return { results: [], source: null };
}

/**
 * Get full recipe detail by ID.
 * Tries: local JSON -> Proj Kitchen detail API -> apiDetailCache -> apiResults
 */
export async function getSourceRecipeDetail(id) {
  // 1. Local Chinese recipe
  const local = await getLocalRecipeById(id);
  if (local && local.ingredients && local.ingredients.length > 0) {
    state.debugDetailHasIngredients = true;
    return local;
  }

  // 2. Proj Kitchen detail API
  if (id.startsWith('pk_')) {
    try {
      const detail = await fetchProjKitchenDetail(id);
      if (detail && detail.ingredients && detail.ingredients.length > 0) {
        state.debugDetailHasIngredients = true;
        return detail;
      }
    } catch (e) {
      console.warn('Proj Kitchen detail fetch failed:', e.message);
    }
  }

  // 3. Fallback to cached API results
  const cached = state.apiDetailCache[id];
  if (cached && cached.ingredients && cached.ingredients.length > 0) {
    state.debugDetailHasIngredients = true;
    return cached;
  }

  // 4. Fallback to apiResults list item
  const listItem = (state.apiResults || []).find(x => x.id === id);
  if (listItem && listItem.ingredients && listItem.ingredients.length > 0) {
    state.debugDetailHasIngredients = true;
    return listItem;
  }

  state.debugDetailHasIngredients = false;
  return listItem || cached || null;
}
