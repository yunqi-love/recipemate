#!/usr/bin/env node
/**
 * RecipeMate — Multi-Source Chinese Recipe Importer
 *
 * Imports from multiple open-source Chinese recipe sources, normalizes,
 * deduplicates, merges, and writes to public/data/chinese-recipes.json.
 *
 * Usage:
 *   node scripts/import-recipes.cjs
 *   node scripts/import-recipes.cjs --skip-online   (use only local/offline sources)
 *   node scripts/import-recipes.cjs --source howtocook  (import only one source)
 *
 * Data sources:
 *   1. Proj Kitchen API — https://proj.kitchen/api (342+ recipes, CC BY-NC-SA)
 *   2. HowToCook (Anduin2017) — local markdown files (193 recipes, Unlicense)
 *   3. YunYouJun/cook — GitHub raw JSON (varies, MIT)
 *   4. Ta-da recipe dataset — GitHub raw JSON (varies)
 *
 * License: MIT (code), CC BY-NC-SA (Proj Kitchen data), Unlicense (HowToCook data)
 */

const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '..', 'public', 'data', 'chinese-recipes.json');
const REPORT = path.join(__dirname, '..', 'public', 'data', 'recipe-import-report.json');
const CONCURRENCY = 8;

// ── Config ──
const SOURCES = {
  projkitchen: {
    name: 'Proj Kitchen',
    url: 'https://proj.kitchen',
    apiBase: 'https://proj.kitchen/api',
    license: 'CC BY-NC-SA',
    attribution: 'https://github.com/GraceFeng930/ProjKitchen',
    enabled: true,
    type: 'api',
    priority: 10
  },
  howtocook: {
    name: 'HowToCook (Anduin2017)',
    url: 'https://github.com/Anduin2017/HowToCook',
    license: 'Unlicense',
    attribution: 'https://github.com/Anduin2017/HowToCook',
    enabled: true,
    type: 'local_md',
    priority: 5,
    localPath: null // set by auto-detect
  },
  yunyoujun_cook: {
    name: 'YunYouJun/cook',
    url: 'https://github.com/YunYouJun/cook',
    license: 'MIT',
    attribution: 'https://github.com/YunYouJun/cook',
    enabled: true,
    type: 'github_json',
    priority: 3,
    rawUrl: 'https://raw.githubusercontent.com/YunYouJun/cook/master/data/recipes.json'
  },
  tada: {
    name: 'Ta-da Recipe Dataset',
    url: 'https://github.com/Eimo-Bai/Ta-da-recipe-dataset',
    license: 'Unknown',
    attribution: 'https://github.com/Eimo-Bai/Ta-da-recipe-dataset',
    enabled: false, // disabled by default - check license
    type: 'github_json',
    priority: 1
  }
};

// ── CLI args ──
const args = process.argv.slice(2);
const SKIP_ONLINE = args.includes('--skip-online');
const TARGET_SOURCE = (() => {
  const idx = args.indexOf('--source');
  return idx >= 0 ? args[idx + 1] : null;
})();
const HOWTOCOOK_PATH = (() => {
  const idx = args.indexOf('--howtocook-path');
  return idx >= 0 ? args[idx + 1] : null;
})();

// ── Stats ──
const stats = {
  started_at: new Date().toISOString(),
  sources: {},
  raw_total: 0,
  after_normalize: 0,
  duplicates_merged: 0,
  duplicates_removed: 0,
  after_dedupe: 0,
  missing_ingredients: 0,
  missing_steps: 0,
  missing_title: 0,
  quality_distribution: { excellent: 0, good: 0, fair: 0, poor: 0 }
};

// ══════════════════════════════════════════════════════════════════════════════
// ── SOURCE 1: Proj Kitchen API ──
// ══════════════════════════════════════════════════════════════════════════════

async function fetchJSON(url) {
  if (SKIP_ONLINE) throw new Error('Online fetch disabled (--skip-online)');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function normalizeProjKitchenRecipe(pk) {
  const steps = (pk.steps || []).map((s, i) => {
    if (typeof s === 'string') {
      return {
        num: i + 1,
        text: s.length > 50 ? s.slice(0, 50) + '…' : s,
        detail: s
      };
    }
    return { num: s.num || i + 1, text: s.text || '', detail: s.detail || '' };
  });

  const tags = inferTags({ title: pk.name || pk.title, category: pk.category, ingredients: pk.ingredients });

  return {
    id: 'pk_' + pk.id,
    title: normalizeTitle(pk.name || pk.title || ''),
    aliases: [],
    description: `${pk.category || ''} · ${(pk.tips || '').slice(0, 80)}`.trim(),
    difficulty: normalizeDifficulty(pk.difficulty),
    cook_time: inferCookTime(pk.steps, pk.cook_time),
    image_url: null,
    ingredients: normalizeIngredients(pk.ingredients || []),
    steps,
    tools: pk.tools || [],
    tags,
    category: pk.category || '',
    source: 'projkitchen',
    sources: ['projkitchen'],
    variants: [],
    quality_score: calculateQuality({ steps, ingredients: pk.ingredients })
  };
}

async function importProjKitchen() {
  console.log('\n📡 [Proj Kitchen] Fetching recipe list...');
  const list = await fetchJSON(`${SOURCES.projkitchen.apiBase}/recipes`);
  console.log(`   Got ${list.length} recipes. Fetching details (concurrency=${CONCURRENCY})...`);

  const results = [];
  let completed = 0;

  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const detail = await fetchJSON(`${SOURCES.projkitchen.apiBase}/recipes/${encodeURIComponent(item.id)}`);
          return normalizeProjKitchenRecipe(detail);
        } catch (e) {
          console.warn(`   ⚠️  Failed detail for "${item.name}": ${e.message}`);
          return normalizeProjKitchenRecipe(item);
        }
      })
    );
    results.push(...batchResults.filter(Boolean));
    completed += batch.length;
    process.stdout.write(`\r   Progress: ${completed}/${list.length}`);
  }
  console.log('');

  stats.sources.projkitchen = { raw: list.length, imported: results.length, skipped: 0 };
  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SOURCE 2: HowToCook Markdown (local clone needed) ──
// ══════════════════════════════════════════════════════════════════════════════

function findHowToCookPath() {
  if (HOWTOCOOK_PATH && fs.existsSync(HOWTOCOOK_PATH)) return HOWTOCOOK_PATH;

  const candidates = [
    path.join(__dirname, '..', '..', 'HowToCook'),
    path.join(__dirname, '..', 'HowToCook'),
    path.join(process.env.HOME || '', 'HowToCook'),
    path.join(process.env.HOME || '', 'git', 'HowToCook'),
    '/tmp/howtocook'
  ];

  for (const p of candidates) {
    if (fs.existsSync(p) && fs.existsSync(path.join(p, 'dishes'))) {
      return p;
    }
  }
  return null;
}

/**
 * Parse a HowToCook recipe markdown file.
 * Format (simplified):
 *   # Recipe Name
 *   ## Metadata
 *   - Prep time: X min
 *   - Cook time: X min
 *
 *   ## Ingredients
 *   - ingredient 1
 *   - ingredient 2
 *
 *   ## Steps
 *   1. Step one
 *   2. Step two
 */
function parseHowToCookMarkdown(md, filename, category) {
  const lines = md.split('\n');

  // Title: first # heading, strip "的做法" etc.
  let title = '';
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)/);
    if (m) { title = m[1].trim(); break; }
  }
  if (!title) title = path.basename(filename, '.md');

  title = normalizeTitle(title);

  // Parse sections
  let section = 'header';
  const ingredients = [];
  const steps = [];
  const metadata = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect sections
    if (line.match(/^##\s+(食材|原料|材料|配料|用料|ingredients)/i)) {
      section = 'ingredients'; continue;
    }
    if (line.match(/^##\s+(步骤|做法|制作|操作|烹饪|steps|procedure)/i)) {
      section = 'steps'; continue;
    }
    if (line.match(/^##\s+/)) {
      section = 'other'; continue;
    }

    if (section === 'ingredients' && line.trim().startsWith('-')) {
      const text = line.trim().replace(/^-\s*/, '').trim();
      if (text && !text.match(/^(#|##)/)) {
        const ing = parseIngredientLine(text);
        if (ing) ingredients.push(ing);
      }
    }

    if (section === 'steps') {
      const m = line.match(/^(\d+)[\.\)、]\s*(.+)/);
      if (m) {
        steps.push({ num: parseInt(m[1]), text: m[2].trim(), detail: m[2].trim() });
      }
    }

    if (section === 'header') {
      const mm = line.match(/^-\s*(.+?)\s*[:：]\s*(.+)/);
      if (mm) {
        metadata[mm[1].trim().toLowerCase()] = mm[2].trim();
      }
    }
  }

  // Infer cook_time from metadata or steps
  let cookTime = 20;
  const prepMatch = (metadata['准备时间'] || metadata['prep time'] || '').match(/(\d+)/);
  const cookMatch = (metadata['烹饪时间'] || metadata['cook time'] || '').match(/(\d+)/);
  if (prepMatch && cookMatch) {
    cookTime = parseInt(prepMatch[1]) + parseInt(cookMatch[1]);
  } else if (cookMatch) {
    cookTime = parseInt(cookMatch[1]);
  } else {
    cookTime = inferCookTime(steps);
  }

  // Map category
  const categoryMap = {
    'meat_dish': '荤菜', 'vegetable_dish': '素菜', 'aquatic': '水产',
    'staple': '主食', 'soup': '汤与粥', 'breakfast': '早餐',
    'dessert': '甜品', 'drink': '饮品', 'condiment': '调料',
    'semi-finished': '半成品'
  };

  const mappedCategory = categoryMap[category] || category || '';

  const tags = inferTags({ title, category: mappedCategory, ingredients, steps });

  return {
    id: 'htc_' + sanitizeId(title),
    title,
    aliases: [],
    description: '',
    difficulty: inferDifficulty(steps, ingredients),
    cook_time: cookTime,
    image_url: null,
    ingredients,
    steps,
    tools: [],
    tags,
    category: mappedCategory,
    source: 'howtocook',
    sources: ['howtocook'],
    variants: [],
    quality_score: calculateQuality({ steps, ingredients }),
    _meta: { filename, category }
  };
}

/**
 * Parse a single ingredient line like:
 *   "- 番茄 2个"
 *   "- 鸡蛋 3个"
 *   "- 盐 适量"
 */
function parseIngredientLine(line) {
  // Remove leading markers and brackets
  let text = line.replace(/^[-*•]\s*/, '').trim();
  text = text.replace(/[（(][^)）]*[)）]/g, '').trim();

  // Try to split: name + amount
  // Common patterns: "食材 用量", "食材", "用量 食材"
  const amountPatterns = [
    /^(.*?)\s+(\d+[\s]*(?:克|g|斤|两|个|根|勺|匙|片|块|条|只|ml|毫升|杯|碗|适量|少许|若干|把|颗|粒|段|节|瓣|头))$/,
    /^(.*?)\s+(\d+)$/,
    /^(.+)$/  // no amount
  ];

  for (const pat of amountPatterns) {
    const m = text.match(pat);
    if (m) {
      const name = normalizeIngredientName(m[1]?.trim() || text);
      const amount = m[2]?.trim() || '';
      return { name, amount };
    }
  }
  return { name: normalizeIngredientName(text), amount: '' };
}

async function importHowToCook() {
  console.log('\n📁 [HowToCook] Looking for local clone...');
  const rootPath = findHowToCookPath();

  if (!rootPath) {
    console.log('   ❌ HowToCook repo not found locally.');
    console.log('   To include HowToCook recipes, clone the repo first:');
    console.log('     git clone --depth 1 https://github.com/Anduin2017/HowToCook');
    console.log('   Then run:');
    console.log('     node scripts/import-recipes.cjs --howtocook-path ./HowToCook');
    stats.sources.howtocook = { raw: 0, imported: 0, skipped: 0, error: 'Repo not found locally' };
    return [];
  }

  console.log(`   Found at: ${rootPath}`);
  const dishesPath = path.join(rootPath, 'dishes');

  if (!fs.existsSync(dishesPath)) {
    console.log('   ❌ dishes/ directory not found in repo');
    stats.sources.howtocook = { raw: 0, imported: 0, skipped: 0, error: 'No dishes/ directory' };
    return [];
  }

  const results = [];
  const categories = fs.readdirSync(dishesPath).filter(d => {
    const full = path.join(dishesPath, d);
    return fs.statSync(full).isDirectory() && !d.startsWith('.') && d !== 'template';
  });

  console.log(`   Found ${categories.length} categories: ${categories.join(', ')}`);
  let totalMd = 0;

  for (const cat of categories) {
    const catPath = path.join(dishesPath, cat);
    const entries = fs.readdirSync(catPath).filter(e => !e.startsWith('.'));

    for (const entry of entries) {
      const entryPath = path.join(catPath, entry);
      const stat = fs.statSync(entryPath);

      if (stat.isDirectory()) {
        // Recipe is a directory with .md files inside
        const files = fs.readdirSync(entryPath).filter(f => f.endsWith('.md'));
        for (const f of files) {
          try {
            const md = fs.readFileSync(path.join(entryPath, f), 'utf-8');
            const recipe = parseHowToCookMarkdown(md, f, cat);
            if (recipe.title) results.push(recipe);
            totalMd++;
          } catch (e) {
            // skip
          }
        }
      } else if (stat.isFile() && entry.endsWith('.md')) {
        // Recipe is a .md file directly
        try {
          const md = fs.readFileSync(entryPath, 'utf-8');
          const recipe = parseHowToCookMarkdown(md, entry, cat);
          if (recipe.title) results.push(recipe);
          totalMd++;
        } catch (e) {
          // skip
        }
      }
    }
  }

  console.log(`   Parsed ${totalMd} markdown files → ${results.length} valid recipes`);
  stats.sources.howtocook = { raw: totalMd, imported: results.length, skipped: totalMd - results.length };
  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SOURCE 3: YunYouJun/cook ──
// ══════════════════════════════════════════════════════════════════════════════

function normalizeYunYouJunRecipe(yy, source) {
  const title = normalizeTitle(yy.name || yy.title || '');
  const ingredients = (yy.ingredients || yy.materials || []).map(i => {
    if (typeof i === 'string') return parseIngredientLine(i);
    return { name: normalizeIngredientName(i.name || i), amount: i.amount || i.quantity || '' };
  });
  const steps = (yy.steps || yy.method || yy.instructions || []).map((s, i) => {
    if (typeof s === 'string') {
      return { num: i + 1, text: s.length > 50 ? s.slice(0, 50) + '…' : s, detail: s };
    }
    return { num: s.num || i + 1, text: s.text || s.description || '', detail: s.detail || s.description || '' };
  });

  const tags = inferTags({ title, category: yy.category || yy.tag, ingredients, steps });

  return {
    id: source + '_' + sanitizeId(title),
    title,
    aliases: [],
    description: (yy.description || yy.desc || yy.tip || '').slice(0, 200),
    difficulty: normalizeDifficulty(yy.difficulty || yy.level),
    cook_time: yy.cook_time || yy.time || yy.duration || inferCookTime(steps),
    image_url: yy.image || yy.img || yy.pic || null,
    ingredients,
    steps,
    tools: yy.tools || yy.utensils || [],
    tags,
    category: yy.category || yy.tag || yy.type || '',
    source,
    sources: [source],
    variants: [],
    quality_score: calculateQuality({ steps, ingredients, image_url: yy.image })
  };
}

async function importYunYouJunCook() {
  console.log('\n📡 [YunYouJun/cook] Fetching...');
  try {
    const url = SOURCES.yunyoujun_cook.rawUrl;
    const data = await fetchJSON(url);
    const recipes = Array.isArray(data) ? data : (data.recipes || data.data || []);

    const results = recipes.map(r => normalizeYunYouJunRecipe(r, 'yunyoujun_cook')).filter(r => r.title);
    console.log(`   Imported ${results.length} recipes`);
    stats.sources.yunyoujun_cook = { raw: recipes.length, imported: results.length, skipped: recipes.length - results.length };
    return results;
  } catch (e) {
    console.log(`   ⚠️  YunYouJun/cook unavailable: ${e.message}`);
    console.log('   Skipping this source. You can try again later.');
    stats.sources.yunyoujun_cook = { raw: 0, imported: 0, skipped: 0, error: e.message };
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SOURCE 4: Ta-da Recipe Dataset ──
// ══════════════════════════════════════════════════════════════════════════════

async function importTaDa() {
  console.log('\n📡 [Ta-da Recipe Dataset] Fetching...');
  try {
    // Try known dataset URLs
    const urls = [
      'https://raw.githubusercontent.com/Eimo-Bai/Ta-da-recipe-dataset/main/data/recipes.json',
      'https://raw.githubusercontent.com/Eimo-Bai/Ta-da-recipe-dataset/main/recipes.json'
    ];
    let data = null;
    for (const url of urls) {
      try {
        data = await fetchJSON(url);
        break;
      } catch (e) { /* try next */ }
    }

    if (!data) {
      console.log('   ⚠️  Ta-da dataset not accessible');
      stats.sources.tada = { raw: 0, imported: 0, skipped: 0, error: 'Not accessible' };
      return [];
    }

    const recipes = Array.isArray(data) ? data : (data.recipes || data.data || []);
    const results = recipes.map(r => normalizeYunYouJunRecipe(r, 'tada')).filter(r => r.title);
    console.log(`   Imported ${results.length} recipes`);
    stats.sources.tada = { raw: recipes.length, imported: results.length, skipped: recipes.length - results.length };
    return results;
  } catch (e) {
    console.log(`   ⚠️  Ta-da unavailable: ${e.message}`);
    stats.sources.tada = { raw: 0, imported: 0, skipped: 0, error: e.message };
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── NORMALIZATION ──
// ══════════════════════════════════════════════════════════════════════════════

function normalizeTitle(title) {
  let t = title.trim();
  // Remove common suffixes
  t = t.replace(/的?做?法$/g, '');
  t = t.replace(/[（(]家常版[)）]/g, '');
  t = t.replace(/[（(]简单版[)）]/g, '');
  t = t.replace(/[（(]懒人版[)）]/g, '');
  t = t.replace(/[（(].*?版[)）]/g, '');
  // Remove parenthetical numbering
  t = t.replace(/\d+\s*[.)]\s*$/, '');
  // Collapse whitespace
  t = t.replace(/\s+/g, '').trim();
  return t || '未知菜谱';
}

function normalizeIngredientName(name) {
  if (!name) return '';
  let n = name.trim();
  // Common synonyms
  const synonyms = {
    '西红柿': '番茄', '马铃薯': '土豆', '洋芋': '土豆',
    '香葱': '小葱', '大葱': '葱', '元葱': '洋葱',
    '芫荽': '香菜', '蕃茄': '番茄', '蕃薯': '红薯',
    '凤梨': '菠萝', '猕猴桃': '奇异果',
    '白醋': '醋', '陈醋': '醋', '香醋': '醋',
    '生抽': '酱油', '老抽': '酱油', '味极鲜': '酱油',
    '蚝油': '蚝油', '料酒': '料酒', '黄酒': '料酒',
    '白糖': '糖', '白砂糖': '糖', '冰糖': '糖', '红糖': '糖',
    '食盐': '盐', '精盐': '盐', '海盐': '盐',
    '味精': '味精', '鸡精': '鸡精',
    '玉米淀粉': '淀粉', '土豆淀粉': '淀粉', '红薯淀粉': '淀粉', '生粉': '淀粉',
    '胡椒粉': '白胡椒', '白胡椒粉': '白胡椒', '黑胡椒粉': '黑胡椒',
    '菜籽油': '食用油', '花生油': '食用油', '大豆油': '食用油', '橄榄油': '食用油',
    '葱姜蒜': '葱姜蒜', '葱姜': '葱姜',
  };
  return synonyms[n] || n;
}

function normalizeDifficulty(d) {
  if (!d) return '中等';
  const s = String(d).trim();
  if (s.includes('简单') || s.includes('容易') || s.includes('easy') || s.includes('新手')) return '简单';
  if (s.includes('困难') || s.includes('难') || s.includes('hard') || s.includes('复杂')) return '困难';
  if (s.includes('大师') || s.includes('expert')) return '大师级';
  return '中等';
}

function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return [];
  return ingredients.map(i => {
    if (typeof i === 'string') return parseIngredientLine(i);
    return {
      name: normalizeIngredientName(i.name || i.ingredient || ''),
      amount: (i.amount || i.quantity || i.count || '').trim()
    };
  }).filter(i => i.name);
}

function inferCookTime(steps, existing) {
  if (existing && existing > 0) return existing;
  if (!steps || steps.length === 0) return 20;
  if (steps.length <= 3) return 15;
  if (steps.length <= 6) return 25;
  if (steps.length <= 10) return 40;
  if (steps.length <= 15) return 60;
  return 90;
}

function inferDifficulty(steps, ingredients) {
  const sLen = (steps || []).length;
  const iLen = (ingredients || []).length;
  if (sLen <= 3 && iLen <= 4) return '简单';
  if (sLen <= 6 && iLen <= 8) return '中等';
  if (sLen <= 12) return '中等';
  return '困难';
}

function inferTags(recipe) {
  const tags = new Set();
  const title = (recipe.title || '').toLowerCase();
  const category = (recipe.category || '').toLowerCase();
  const ingNames = (recipe.ingredients || []).map(i =>
    (typeof i === 'string' ? i : (i.name || '')).toLowerCase()
  );
  const allText = title + ' ' + category + ' ' + ingNames.join(' ');

  // Category-based tags
  if (category.includes('荤') || category.includes('肉') || category === 'meat_dish') tags.add('荤菜');
  if (category.includes('素') || category.includes('蔬') || category === 'vegetable_dish') tags.add('素菜');
  if (category.includes('水产') || category.includes('海鲜') || category === 'aquatic') tags.add('水产');
  if (category.includes('主食') || category === 'staple') tags.add('主食');
  if (category.includes('汤') || category === 'soup') tags.add('汤羹');
  if (category.includes('早餐') || category === 'breakfast') tags.add('早餐');
  if (category.includes('甜品') || category === 'dessert') tags.add('甜品');
  if (category.includes('饮品') || category === 'drink') tags.add('饮品');

  // Ingredient-based tags
  const meatKeywords = ['猪肉', '牛肉', '羊肉', '鸡肉', '鸭肉', '鱼', '虾', '蟹', '排骨', '五花肉', '里脊',
    '肉末', '肉丝', '鸡腿', '鸡翅', '鸡胸', '牛腩', '培根', '火腿', '腊肉', '腊肠', '香肠',
    '猪', '牛', '羊', '鸡', '鸭', '鹅', '鱼', '虾', '蟹', '贝', '蛙'];
  if (meatKeywords.some(k => allText.includes(k))) tags.add('荤菜');

  const vegKeywords = ['番茄', '西红柿', '土豆', '豆腐', '茄子', '青椒', '豆角', '白菜', '菠菜', '黄瓜',
    '胡萝卜', '白萝卜', '西兰花', '花菜', '芹菜', '韭菜', '豆芽', '蘑菇', '木耳', '莲藕', '冬瓜',
    '南瓜', '丝瓜', '苦瓜', '青菜', '生菜', '油麦菜', '空心菜'];
  if (vegKeywords.some(k => allText.includes(k))) tags.add('素菜');

  // Quick recipe
  if ((recipe.cook_time || 20) <= 30 && (recipe.steps || []).length <= 6) tags.add('快手菜');

  // Goes well with rice
  const riceKeywords = ['下饭', '红烧', '酱', '卤', '焖', '炒'];
  if (riceKeywords.some(k => allText.includes(k))) tags.add('下饭菜');

  // Beginner friendly
  if ((recipe.steps || []).length <= 4 && (recipe.difficulty || '中等') === '简单') tags.add('适合新手');

  // Couple meal
  if ((recipe.ingredients || []).length >= 3 && (recipe.ingredients || []).length <= 8
    && !allText.includes('聚会') && !allText.includes('宴客')) tags.add('二人食');

  // Other common
  if (allText.includes('家常')) tags.add('家常菜');
  if (allText.includes('减脂') || allText.includes('低脂') || allText.includes('轻食')) tags.add('减脂');
  if (allText.includes('凉拌') || allText.includes('冷菜')) tags.add('凉拌');

  return [...tags].slice(0, 8); // max 8 tags
}

function calculateQuality(recipe) {
  let score = 0;
  if (Array.isArray(recipe.steps) && recipe.steps.length > 0) score += 20;
  if (Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) score += 20;
  if ((recipe.steps || []).length >= 3) score += 10;
  if ((recipe.ingredients || []).some(i => (i.amount || '').trim())) score += 10;
  if (recipe.image_url) score += 10;
  if (recipe.tags && recipe.tags.length > 0) score += 5;
  if (recipe.description && recipe.description.length > 5) score += 5;
  return score;
}

function sanitizeId(title) {
  return title.toLowerCase()
    .replace(/[^\w一-鿿]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60);
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DEDUPLICATION & MERGE ──
// ══════════════════════════════════════════════════════════════════════════════

function getIngredientSet(recipe) {
  return new Set(
    (recipe.ingredients || []).map(i =>
      normalizeIngredientName((i.name || '').toLowerCase())
    ).filter(Boolean)
  );
}

function titleSimilarity(a, b) {
  const na = a.toLowerCase().replace(/\s/g, '');
  const nb = b.toLowerCase().replace(/\s/g, '');
  if (na === nb) return 1.0;

  // Same after normalizing common differences
  const normalize = s => s
    .replace(/西红柿/g, '番茄').replace(/马铃薯/g, '土豆').replace(/洋芋/g, '土豆')
    .replace(/的?做?法/g, '')
    .replace(/[（(][^)）]*[)）]/g, '');
  if (normalize(na) === normalize(nb)) return 0.95;

  // Share substantial substring
  const minLen = Math.min(na.length, nb.length);
  const maxLen = Math.max(na.length, nb.length);
  // Count matching characters in sequence
  let matches = 0;
  for (let i = 0; i < Math.min(na.length, nb.length); i++) {
    if (na[i] === nb[i]) matches++;
  }
  if (minLen > 0 && matches / minLen >= 0.7) return 0.8;

  // Check if one is substring of another
  if (na.includes(nb) || nb.includes(na)) {
    if (minLen / maxLen >= 0.5) return 0.85;
  }

  return 0;
}

function ingredientsOverlap(a, b) {
  const setA = getIngredientSet(a);
  const setB = getIngredientSet(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let overlap = 0;
  for (const item of setA) {
    if (setB.has(item)) overlap++;
  }
  return overlap / Math.max(setA.size, setB.size);
}

/**
 * Dedupe and merge a flat list of recipes from all sources.
 * Strategy: hash by normalized title, merge overlapping recipes.
 */
function dedupeRecipes(recipes) {
  console.log(`\n🔄 Deduplicating ${recipes.length} recipes...`);

  // Phase 1: Group by normalized title key
  const groups = new Map();

  for (const recipe of recipes) {
    const key = normalizeTitle(recipe.title).toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(recipe);
  }

  // Phase 2: Within each group, merge or pick best
  const merged = [];
  let merges = 0;
  let removals = 0;

  for (const [key, group] of groups) {
    if (group.length === 1) {
      merged.push(group[0]);
      continue;
    }

    // Sort by quality_score descending, then by priority
    group.sort((a, b) => {
      const qs = (b.quality_score || 0) - (a.quality_score || 0);
      if (qs !== 0) return qs;
      const pa = (SOURCES[a.source] || {}).priority || 0;
      const pb = (SOURCES[b.source] || {}).priority || 0;
      return pb - pa;
    });

    const primary = group[0];
    const rest = group.slice(1);

    // Merge aliases
    const allAliases = new Set(primary.aliases || []);
    for (const r of rest) {
      allAliases.add(r.title);
      if (r.aliases) r.aliases.forEach(a => allAliases.add(a));
    }
    allAliases.delete(primary.title);
    primary.aliases = [...allAliases];

    // Merge sources
    const allSources = new Set(primary.sources || [primary.source]);
    for (const r of rest) {
      allSources.add(r.source);
      if (r.sources) r.sources.forEach(s => allSources.add(s));
    }
    primary.sources = [...allSources];

    // Keep variants for reference
    primary.variants = rest.map(r => ({
      id: r.id,
      title: r.title,
      source: r.source,
      difficulty: r.difficulty,
      cook_time: r.cook_time,
      ingredient_count: (r.ingredients || []).length,
      step_count: (r.steps || []).length,
      quality_score: r.quality_score
    }));

    // If primary quality is decent, keep it; otherwise try to enrich from variants
    if (primary.quality_score < 30) {
      for (const r of rest) {
        // Fill missing data from lower-priority variant
        if ((primary.ingredients || []).length === 0 && (r.ingredients || []).length > 0) {
          primary.ingredients = r.ingredients;
          primary.quality_score = calculateQuality(primary);
        }
        if ((primary.steps || []).length === 0 && (r.steps || []).length > 0) {
          primary.steps = r.steps;
          primary.quality_score = calculateQuality(primary);
        }
        if ((primary.description || '').length < 5 && (r.description || '').length >= 5) {
          primary.description = r.description;
        }
      }
    }

    merged.push(primary);
    merges += rest.length;
  }

  console.log(`   Groups: ${groups.size}, Merged: ${merges}, Final: ${merged.length}`);

  // Phase 3: Cross-group similarity check (expensive, only for suspicious pairs)
  // Check for near-matches across different normalized keys (e.g. 番茄炒蛋 vs 西红柿炒鸡蛋)
  let crossMerges = 0;
  for (let i = 0; i < merged.length; i++) {
    if (!merged[i]) continue;
    for (let j = i + 1; j < merged.length; j++) {
      if (!merged[j]) continue;
      const sim = titleSimilarity(merged[i].title, merged[j].title);
      if (sim >= 0.8) {
        const ingOverlap = ingredientsOverlap(merged[i], merged[j]);
        if (ingOverlap >= 0.5) {
          // Merge j into i (i is earlier, usually higher quality from sort)
          merged[i].aliases = [...new Set([...(merged[i].aliases || []), merged[j].title, ...(merged[j].aliases || [])])];
          merged[i].sources = [...new Set([...(merged[i].sources || []), ...(merged[j].sources || [])])];
          merged[i].variants.push(...(merged[j].variants || []));
          merged[i].variants.push({
            id: merged[j].id, title: merged[j].title, source: merged[j].source,
            difficulty: merged[j].difficulty, cook_time: merged[j].cook_time,
            ingredient_count: (merged[j].ingredients || []).length,
            step_count: (merged[j].steps || []).length,
            quality_score: merged[j].quality_score
          });
          // Mark j for removal
          merged[j] = null;
          crossMerges++;
        }
      }
    }
  }

  const final = merged.filter(Boolean);
  removals += crossMerges;
  console.log(`   Cross-group merges: ${crossMerges}, Removed: ${removals}, Final: ${final.length}`);

  return { recipes: final, merges: merges + crossMerges, removals };
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN ──
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🍳 RecipeMate — Multi-Source Chinese Recipe Importer');
  console.log('='.repeat(60));
  console.log('');

  const allRecipes = [];

  // Determine which sources to import
  const sourceKeys = TARGET_SOURCE
    ? [TARGET_SOURCE]
    : Object.keys(SOURCES).filter(k => SOURCES[k].enabled);

  console.log(`Active sources: ${sourceKeys.join(', ')}`);
  console.log(`Mode: ${SKIP_ONLINE ? 'offline only' : 'full (online + local)'}`);
  console.log('');

  // Source 1: Proj Kitchen
  if (sourceKeys.includes('projkitchen')) {
    try {
      const pkRecipes = await importProjKitchen();
      allRecipes.push(...pkRecipes);
    } catch (e) {
      console.log(`   ❌ Proj Kitchen import failed: ${e.message}`);
      console.log('   Running with --skip-online flag. To fetch Proj Kitchen, remove the flag.');
      stats.sources.projkitchen = { raw: 0, imported: 0, skipped: 0, error: e.message };
    }
  }

  // Source 2: HowToCook (local markdown)
  if (sourceKeys.includes('howtocook')) {
    const htcRecipes = await importHowToCook();
    allRecipes.push(...htcRecipes);
  }

  // Source 3: YunYouJun/cook
  if (sourceKeys.includes('yunyoujun_cook')) {
    const yyRecipes = await importYunYouJunCook();
    allRecipes.push(...yyRecipes);
  }

  // Source 4: Ta-da (disabled by default)
  if (sourceKeys.includes('tada')) {
    const tadaRecipes = await importTaDa();
    allRecipes.push(...tadaRecipes);
  }

  stats.raw_total = allRecipes.length;
  stats.after_normalize = allRecipes.length;

  console.log(`\n📊 Total raw recipes imported: ${allRecipes.length}`);

  if (allRecipes.length === 0) {
    console.log('❌ No recipes imported. Aborting.');
    process.exit(1);
  }

  // Deduplicate
  const { recipes: deduped, merges, removals } = dedupeRecipes(allRecipes);

  stats.duplicates_merged = merges;
  stats.duplicates_removed = removals;
  stats.after_dedupe = deduped.length;

  // Quality stats
  deduped.forEach(r => {
    const q = r.quality_score || 0;
    if (q >= 50) stats.quality_distribution.excellent++;
    else if (q >= 30) stats.quality_distribution.good++;
    else if (q >= 15) stats.quality_distribution.fair++;
    else stats.quality_distribution.poor++;

    if (!r.title) stats.missing_title++;
    if (!r.ingredients || r.ingredients.length === 0) stats.missing_ingredients++;
    if (!r.steps || r.steps.length === 0) stats.missing_steps++;
  });

  // Category distribution
  const categories = {};
  deduped.forEach(r => {
    const cat = r.category || '未分类';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  // Sort by quality then title
  deduped.sort((a, b) => {
    const qs = (b.quality_score || 0) - (a.quality_score || 0);
    if (qs !== 0) return qs;
    return (a.title || '').localeCompare(b.title || '', 'zh-CN');
  });

  // Write output
  const output = {
    version: '2.0.0',
    source: `Multiple open-source Chinese recipe sources (${Object.keys(stats.sources).filter(k => (stats.sources[k]?.imported || 0) > 0).join(', ')})`,
    license: 'Mixed — Proj Kitchen: CC BY-NC-SA, HowToCook: Unlicense, YunYouJun: MIT',
    attribution: 'See README.md for full attributions',
    generated_at: new Date().toISOString(),
    total: deduped.length,
    recipes: deduped
  };

  const outDir = path.dirname(OUTPUT);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');
  const sizeKB = Math.round(fs.statSync(OUTPUT).size / 1024);
  console.log(`\n💾 Written: ${OUTPUT} (${sizeKB} KB)`);

  // Write report
  const report = {
    generated_at: new Date().toISOString(),
    total_raw: stats.raw_total,
    total_after_dedupe: stats.after_dedupe,
    sources: {},
    duplicates_removed: stats.duplicates_removed + stats.duplicates_merged,
    recipes_missing_ingredients: stats.missing_ingredients,
    recipes_missing_steps: stats.missing_steps,
    recipes_missing_title: stats.missing_title,
    quality_distribution: stats.quality_distribution,
    categories: Object.entries(categories).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ category: k, count: v }))
  };

  for (const [key, s] of Object.entries(stats.sources)) {
    report.sources[key] = {
      name: (SOURCES[key] || {}).name || key,
      raw: s.raw || 0,
      imported: s.imported || 0,
      skipped: s.skipped || 0,
      error: s.error || null
    };
  }

  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`💾 Report: ${REPORT}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary');
  console.log('='.repeat(60));
  for (const [key, s] of Object.entries(stats.sources)) {
    const name = (SOURCES[key] || {}).name || key;
    if (s.imported > 0) {
      console.log(`  ${name}: ${s.imported} recipes`);
    } else if (s.error) {
      console.log(`  ${name}: SKIPPED (${s.error})`);
    } else {
      console.log(`  ${name}: 0 (no data available)`);
    }
  }
  console.log(`\n  Total deduplicated: ${stats.after_dedupe}`);
  console.log(`  Merged: ${stats.duplicates_merged}`);
  console.log(`  Output size: ${sizeKB} KB`);
  console.log(`\n  Excellent (≥50): ${stats.quality_distribution.excellent}`);
  console.log(`  Good (≥30): ${stats.quality_distribution.good}`);
  console.log(`  Fair (≥15): ${stats.quality_distribution.fair}`);
  console.log(`  Poor (<15): ${stats.quality_distribution.poor}`);
  console.log(`  Missing ingredients: ${stats.missing_ingredients}`);
  console.log(`  Missing steps: ${stats.missing_steps}`);

  if (deduped.length > 10) {
    console.log('\n  📋 Top categories:');
    Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 10)
      .forEach(([cat, cnt]) => console.log(`    ${cat}: ${cnt}`));
  }

  console.log('\n✅ Done!');
}

main().catch(e => {
  console.error('❌ Import failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});