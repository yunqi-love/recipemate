#!/usr/bin/env node
/**
 * RecipeMate — Chinese Recipe Importer
 *
 * Fetches all recipes from Proj Kitchen API with full detail (ingredients + steps),
 * converts them to RecipeMate standard format, and writes to public/data/chinese-recipes.json.
 *
 * Usage:
 *   node scripts/import-recipes.js
 *
 * Data source: https://proj.kitchen/api (开源中文菜谱 API, 342 道菜)
 * License: CC BY-NC-SA (check https://proj.kitchen for latest terms)
 */

const fs = require('fs');
const path = require('path');

const API_BASE = 'https://proj.kitchen/api';
const OUTPUT = path.join(__dirname, '..', 'public', 'data', 'chinese-recipes.json');
const CONCURRENCY = 8; // 8 parallel detail requests

/**
 * Normalize a Proj Kitchen recipe to RecipeMate standard format.
 */
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

  return {
    id: 'pk_' + pk.id,
    title: pk.name || pk.title || '',
    description: `${pk.category || ''} · ${pk.tips || ''}`.trim(),
    difficulty: pk.difficulty === '简单' ? '简单' : pk.difficulty === '困难' ? '困难' : '中等',
    cook_time: estimateCookTime(pk.steps),
    image_url: null,
    ingredients: (pk.ingredients || []).map(i => ({
      name: (i.name || '').trim(),
      amount: (i.amount || '').trim()
    })),
    steps,
    tools: pk.tools || [],
    tags: [pk.category, pk.difficulty].filter(Boolean),
    category: pk.category || '',
    source: 'projkitchen',
    created_at: new Date().toISOString()
  };
}

function estimateCookTime(steps) {
  if (!steps || steps.length === 0) return 20;
  if (steps.length <= 3) return 15;
  if (steps.length <= 6) return 25;
  if (steps.length <= 10) return 40;
  return 60;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function main() {
  console.log('🍳 RecipeMate — 中文菜谱导入器');
  console.log('数据源: Proj Kitchen API (https://proj.kitchen/api)');
  console.log('');

  // Step 1: Fetch recipe list
  console.log('📡 正在获取菜谱列表...');
  const list = await fetchJSON(`${API_BASE}/recipes`);
  console.log(`✅ 获取到 ${list.length} 道菜谱`);
  console.log('');

  // Step 2: Fetch details in batches with concurrency control
  console.log(`📡 正在获取每道菜的详细信息 (并发: ${CONCURRENCY})...`);
  const results = [];
  let completed = 0;

  // Process in batches
  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const batch = list.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const detail = await fetchJSON(`${API_BASE}/recipes/${encodeURIComponent(item.id)}`);
          return normalizeProjKitchenRecipe(detail);
        } catch (e) {
          console.warn(`  ⚠️ 无法获取 "${item.name}" (${item.id}): ${e.message}`);
          // Fallback: normalize from list data only
          return normalizeProjKitchenRecipe(item);
        }
      })
    );
    results.push(...batchResults);
    completed += batch.length;
    process.stdout.write(`\r  进度: ${completed}/${list.length} (${Math.round(completed / list.length * 100)}%)`);
  }
  console.log('');

  // Step 3: Validate results
  const withIngredients = results.filter(r => r.ingredients.length > 0).length;
  const withSteps = results.filter(r => r.steps.length > 0).length;
  console.log('');
  console.log('📊 导入统计:');
  console.log(`  总数: ${results.length}`);
  console.log(`  有食材: ${withIngredients} (${Math.round(withIngredients / results.length * 100)}%)`);
  console.log(`  有步骤: ${withSteps} (${Math.round(withSteps / results.length * 100)}%)`);

  // Show categories
  const categories = {};
  results.forEach(r => {
    const cat = r.category || '未分类';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  console.log('  分类分布:');
  for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${cat}: ${count} 道`);
  }

  // Step 4: Write output
  const output = {
    version: '1.0.0',
    source: 'Proj Kitchen API (https://proj.kitchen/api)',
    license: 'CC BY-NC-SA — 数据来自 Proj Kitchen 开源项目',
    attribution: '菜谱数据来自 https://github.com/GraceFeng930/ProjKitchen',
    generated_at: new Date().toISOString(),
    total: results.length,
    recipes: results
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), 'utf-8');
  const sizeKB = Math.round(fs.statSync(OUTPUT).size / 1024);
  console.log('');
  console.log(`💾 已写入: ${OUTPUT} (${sizeKB} KB)`);
  console.log('✅ 完成！');
}

main().catch(e => {
  console.error('❌ 导入失败:', e.message);
  process.exit(1);
});
