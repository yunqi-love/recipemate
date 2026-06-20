// RecipeMate — Shopping List View (with recipe grouping)
import { state } from '../app.js';
import { groupShoppingItemsByRecipe } from '../stores/shoppingStore.js';

export function renderShop() {
  const groups = groupShoppingItemsByRecipe();
  const groupTitles = Object.keys(groups);
  const checkedCount = state.shopItems.filter(s => s.checked).length;
  const uncheckedCount = state.shopItems.filter(s => !s.checked).length;

  // Build grouped HTML
  let itemsHTML = '';
  if (groupTitles.length > 0) {
    for (const [recipeTitle, items] of Object.entries(groups)) {
      itemsHTML += `<div class="shopping-group">
        <div class="shopping-group-title">📋 ${esc(recipeTitle)}</div>`;
      for (const item of items) {
        itemsHTML += `
        <div class="shop-item">
          <div class="shop-check ${item.checked ? 'checked' : ''}" onclick="App.toggleShop('${item.id}')"></div>
          <span class="shop-name ${item.checked ? 'done' : ''}">${esc(item.name)}</span>
          <span class="shop-del" onclick="App.removeShop('${item.id}')">🗑</span>
        </div>`;
      }
      itemsHTML += '</div>';
    }
  }

  return `
    <div class="top-bar">
      <span class="brand">🛒 购物清单</span>
      <span class="user" onclick="App.showSettings()">👤 ${state.session?.user?.email || ''} ›</span>
    </div>
    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:14px;color:#999">${state.shopItems.length} 种食材 · ${uncheckedCount} 待买 · ${checkedCount} 已买</span>
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
      <div style="display:flex;gap:8px;margin-top:16px">
        ${checkedCount > 0 ? `<button class="btn btn-outline btn-sm" onclick="App.doClearCheckedShop()" style="flex:1;border-color:#4CAF50;color:#4CAF50">✅ 清除已购买（${checkedCount}）</button>` : ''}
        <button class="btn btn-outline btn-sm" onclick="App.clearShop()" style="flex:1;border-color:#F44336;color:#F44336">🗑 清空全部</button>
      </div>` : ''}
    </div>
    <div class="nav">
      <button onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
      <button onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
      <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
      <button class="active"><span class="ico">🛒</span>清单</button>
    </div>`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
