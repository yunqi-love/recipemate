// RecipeMate — Shopping List View
import { state } from '../app.js';

export function renderShop() {
  return `
    <div class="top-bar">
      <span class="brand">🛒 购物清单</span>
      <span class="user" onclick="App.showSettings()">👤 ${state.session?.user?.email || ''} ›</span>
    </div>
    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:14px;color:#999">${state.shopItems.length} 种食材</span>
        ${state.shopItems.length > 0 ? '<span style="color:#F44336;font-size:13px;cursor:pointer" onclick="App.clearShop()">清空全部</span>' : ''}
      </div>
      ${state.shopItems.length === 0 ? '<div class="empty">购物清单是空的 🛒</div>' : ''}
      ${state.shopItems.map(item => `
        <div class="shop-item">
          <div class="shop-check ${item.checked ? 'checked' : ''}" onclick="App.toggleShop('${item.id}')"></div>
          <span class="shop-name ${item.checked ? 'done' : ''}">${esc(item.name)}</span>
          <span class="shop-del" onclick="App.removeShop('${item.id}')">🗑</span>
        </div>
      `).join('')}
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
