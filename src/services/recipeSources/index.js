// RecipeMate — Recipe Sources Index
// Central registry for all recipe data sources.

import { searchProjKitchen, fetchProjKitchenDetail } from './projKitchenSource.js';
import { searchMealDB } from './mealDbSource.js';

/**
 * Primary search: Proj Kitchen (Chinese recipes).
 * Fallback: TheMealDB (Western recipes).
 */
export async function searchAllSources(kw) {
  // Priority 1: Proj Kitchen (Chinese recipes)
  const pkResults = await searchProjKitchen(kw);
  if (pkResults.length > 0) {
    return { results: pkResults, source: 'projkitchen' };
  }

  // Priority 2: TheMealDB (fallback only)
  const mdResults = await searchMealDB(kw);
  if (mdResults.length > 0) {
    return { results: mdResults, source: 'themealdb' };
  }

  return { results: [], source: null };
}

/**
 * Get recipe detail from any source.
 */
export async function getSourceRecipeDetail(id) {
  if (id.startsWith('pk_')) {
    return fetchProjKitchenDetail(id);
  }
  return null;
}
