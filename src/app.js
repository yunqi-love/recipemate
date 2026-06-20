// RecipeMate — Global Application State
// All modules share this single state object for consistent data access.

export const state = {
  session: null,
  recipes: [],
  customRecipes: [],
  favorites: new Set(),
  cookedMap: {},
  proficiency: {},
  shopItems: [],
  journals: [],
  currentView: 'home',
  currentFilter: 'all',
  currentDetailId: null,
  currentDetailIsApi: false,
  parentView: null,
  savedScrollY: 0,
  // API search results cache
  apiResults: [],
  apiDetailCache: {},
  // Auth mode
  authMode: 'login',
  // Form state
  formDirty: false,
  recipeImgFile: null,
  cookPhotoFile: null,
  // Proj Kitchen cache
  projKitchenRecipes: null,
  // Today's eat state
  todayOptions: { types: [], servings: '2', avoid: '' },
  todayResults: null,
  // Settings
  allowEnglishFallback: false,
  // Data source debug
  debugSearchSource: null,
  debugSearchCount: 0,
  debugDetailHasIngredients: null,
  debugLocalRecipeCount: null,
  // Search input (decoupled from DOM)
  searchKeyword: '',
  searchDebounceTimer: null,
  searchInputFocused: false,
  searchInputSelStart: 0,
  searchInputSelEnd: 0,
  // Recipe filter state (multi-dimension)
  recipeFilters: {
    quick: 'all',
    difficulty: 'all',
    time: 'all',
    type: [],
    scene: [],
    cuisine: [],
    userStatus: 'all',
    sort: 'default'
  },
  showFilterPanel: false,
  isFilterSheetOpen: false,
  draftRecipeFilters: null,
  // Search
  isSearchMode: false,
  searchResults: null,
  lastSearchSourceSummary: '',
  // Shopping
  shopViewMode: 'recipe'
};

export function getProficiency(count) {
  if (count >= 10) return { level: '大师', cls: 'prof-master', emoji: '🏆' };
  if (count >= 5)  return { level: '熟练', cls: 'prof-expert', emoji: '💪' };
  if (count >= 2)  return { level: '进阶', cls: 'prof-skilled', emoji: '👍' };
  if (count >= 1)  return { level: '初学', cls: 'prof-learner', emoji: '🌱' };
  return { level: '新手', cls: 'prof-novice', emoji: '📖' };
}

export function updateProficiency() {
  state.proficiency = {};
  const all = [...state.recipes, ...state.customRecipes];
  all.forEach(r => {
    const c = state.cookedMap[r.id] || { count: 0 };
    state.proficiency[r.id] = getProficiency(c.count);
  });
}

export const filterOptions = [
  { key: 'all', label: '全部' },
  { key: '简单', label: '简单' },
  { key: '中等', label: '中等' },
  { key: '困难', label: '困难' },
  { key: 'faved', label: '⭐ 已收藏' },
  { key: 'master', label: '🏆 大师级' }
];

export const DIFF_ORDER = { '简单': 0, '中等': 1, '困难': 2 };
