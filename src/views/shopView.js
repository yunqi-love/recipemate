// RecipeMate — Shopping List View (recipe grouping + ingredient summary + copy)
import { state } from '../app.js';
import { groupShoppingItemsByRecipe, groupShoppingItemsByIngredient, copyShoppingListText } from '../stores/shoppingStore.js';

export function renderShop() {
  const mode = state.shopViewMode || 'recipe'; // 'recipe' or 'ingredient'
  const checkedCount = state.shopItems.filter(s => s.checked).length;
  const uncheckedCount = state.shopItems.filter(s => !s.checked).length;

  let itemsHTML = '';
  if (mode === 'ingredient') {
    itemsHTML = renderIngredientView();
  } else {
    itemsHTML = renderRecipeView();
  }

  return `
    <div class="top-bar">
      <span class="brand">🛒 购物清单</span>
      <span class="user" onclick="App.showSettings()">👤 ${state.session?.user?.email || ''} ›</span>
    </div>
    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:14px;color:var(--text-muted)">${state.shopItems.length} 种 · ${uncheckedCount} 待买 · ${checkedCount} 已买</span>
        <div style="display:flex;gap:4px">
          <span class="filter-chip${mode === 'recipe' ? ' active' : ''}" onclick="App.setShopViewMode('recipe')" style="font-size:11px">按菜谱</span>
          <span class="filter-chip${mode === 'ingredient' ? ' active' : ''}" onclick="App.setShopViewMode('ingredient')" style="font-size:11px">按食材</span>
        </div>
      </div>
      ${state.shopItems.length === 0
        ? `<div class="empty-state">
            <div class="empty-state-icon">🛒</div>
            <div class="empty-state-title">购物清单是空的</div>
            <div class="empty-state-desc">在菜谱详情页点击加入购物清单</div>
          </div>`
        : itemsHTML
      }
      ${state.shopItems.length > 0 ? `
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="App.copyShoppingList()" style="flex:1;border-color:#2196F3;color:#2196F3;min-width:100px">📋 复制清单</button>
        ${checkedCount > 0 ? `<button class="btn btn-outline btn-sm" onclick="App.doClearCheckedShop()" style="flex:1;border-color:#4CAF50;color:#4CAF50;min-width:100px">✅ 清除已购（${checkedCount}）</button>` : ''}
        <button class="btn btn-outline btn-sm" onclick="App.clearShop()" style="border-color:#F44336;color:#F44336;min-width:80px">🗑 清空</button>
      </div>` : ''}
    </div>
    <div class="nav">
      <button onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
      <button onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
      <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
      <button class="active"><span class="ico">🛒</span>清单</button>
    </div>`;
}

function renderRecipeView() {
  const groups = groupShoppingItemsByRecipe();
  let html = '';
  for (const [recipeTitle, items] of Object.entries(groups)) {
    html += `<div class="shopping-group">
      <div class="shopping-group-title">📋 ${esc(recipeTitle)}</div>`;
    for (const item of items) {
      html += `
      <div class="shop-item">
        <div class="shop-check ${item.checked ? 'checked' : ''}" onclick="App.toggleShop('${item.id}')"></div>
        <span class="shop-name ${item.checked ? 'done' : ''}">${esc(item.name)}</span>
        <span class="shop-del" onclick="App.removeShop('${item.id}')">🗑</span>
      </div>`;
    }
    html += '</div>';
  }
  return html;
}

function renderIngredientView() {
  const groups = groupShoppingItemsByIngredient();
  let html = '';
  for (const [name, group] of Object.entries(groups)) {
    const allChecked = group.items.every(i => i.checked);
    const someChecked = group.items.some(i => i.checked);
    const firstItem = group.items[0];
    const recipes = [...group.recipes];
    html += `<div class="shop-item">
      <div class="shop-check ${allChecked ? 'checked' : ''}" onclick="App.toggleIngredientGroup('${escAttr(name)}', ${!allChecked})"></div>
      <div>
        <span class="shop-name ${allChecked ? 'done' : ''}">${esc(name)}</span>
        ${group.items.length > 1 ? `<span style="font-size:10px;color:var(--text-muted);margin-left:4px">×${group.items.length}</span>` : ''}
        ${recipes.length > 0 ? `<div style="font-size:10px;color:var(--text-muted)">${recipes.join('、')}</div>` : ''}
      </div>
      <span class="shop-del" onclick="App.removeShop('${firstItem.id}')">🗑</span>
    </div>`;
  }
  return html || '<div class="empty-state"><div class="empty-state-desc">暂无食材</div></div>';
}

function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
