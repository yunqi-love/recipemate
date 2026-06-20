// RecipeMate — Settings View
import { AI_PROVIDERS, getAIProvider, getAIKey, getAIUrl, getAIModel, saveAISettings } from '../config/aiProviders.js';
import { testAiConnection } from '../services/aiClient.js';
import { toast } from '../components/toast.js';
import { state } from '../app.js';

export function showSettings() {
  // Remove existing overlay first
  document.querySelectorAll('.modal-overlay').forEach(e => e.remove());

  const provider = getAIProvider();
  const key = getAIKey();
  const url = getAIUrl();
  const model = getAIModel();
  const hasKey = key && key.length > 0;

  let opts = '';
  for (const [k, v] of Object.entries(AI_PROVIDERS)) {
    opts += `<option value="${k}" ${provider === k ? 'selected' : ''}>${v.name}</option>`;
  }

  const html = `<div class="modal-overlay" id="settingsModal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <h3>⚙️ 设置</h3>

      <div class="settings-group">
        <label>AI 提供商</label>
        <select id="aiProvider" onchange="App.updateSetForm()">${opts}</select>
      </div>

      <div class="settings-group">
        <label>API 地址</label>
        <input id="aiUrl" value="${escAttr(url)}" placeholder="https://api.xxx.com/v1/chat/completions">
      </div>

      <div class="settings-group">
        <label>模型名</label>
        <input id="aiModel" value="${escAttr(model)}" placeholder="model-name">
      </div>

      <div class="settings-group">
        <label>API Key ${hasKey ? '<span style="color:#4CAF50;font-size:11px">✅ 已设置</span>' : '<span style="color:#F44336;font-size:11px">⚠️ 未设置</span>'}</label>
        <input id="apiKeyInput" type="password" value="${escAttr(key)}" placeholder="sk-...">
        <p style="font-size:11px;color:#999;margin-top:4px">Key 仅保存在浏览器本地，不会上传到服务器</p>
      </div>

      <div class="settings-group">
        <button class="btn btn-outline btn-block" onclick="App.testAI()" style="border-color:#4CAF50;color:#4CAF50">🩺 测试 AI 连接</button>
        <div id="testResult" style="display:none"></div>
      </div>

      <div class="settings-group" style="margin-top:8px">
        <label style="font-size:15px">🔬 数据源调试面板</label>
        <div style="background:#F8F8F8;border-radius:10px;padding:12px;font-size:12px;color:#666;line-height:1.8">
          <div>🏠 本地中文菜谱：<b>${state.debugLocalRecipeCount ?? '...'} 道</b></div>
          <div>🥘 Proj Kitchen API：<b>${navigator.onLine ? '📶 在线' : '⚠️ 离线'}</b></div>
          <div>🔍 最近搜索源：<b>${state.debugSearchSource || '—'}</b></div>
          <div>📊 最近搜索结果：<b>${state.debugSearchCount || 0} 条</b></div>
          <div>📝 最近详情食材：<b>${state.debugDetailHasIngredients === true ? '✅ 有' : state.debugDetailHasIngredients === false ? '❌ 缺失' : '—'}</b></div>
          <div style="margin-top:6px;font-size:10px;color:#999">💡 搜索后自动更新。详情包含食材=✅说明数据源正常。</div>
        </div>
      </div>

      <div class="settings-group" style="margin-top:8px">
        <label style="display:flex;align-items:center;gap:8px;cursor:pointer">
          <input type="checkbox" id="allowEnglishFallback" ${state.allowEnglishFallback ? 'checked' : ''} onchange="App.toggleEnglishFallback(this.checked)" style="width:auto">
          🌐 启用英文菜谱兜底（TheMealDB）
        </label>
        <p style="font-size:11px;color:#999;margin-top:4px">默认关闭。启用后会在中文菜谱无结果时搜索英文菜谱。</p>
      </div>

      <div class="settings-group" style="margin-top:8px">
        <label style="font-size:15px">🍽️ 做饭偏好</label>
        <p style="font-size:11px;color:var(--text-muted);margin-bottom:8px">帮助推荐更符合你口味的菜</p>
        <label class="form-label">常用人数</label>
        <select id="prefServings" style="width:100%;padding:10px 12px;border-radius:var(--radius-btn);border:1px solid var(--border);font-size:14px;margin-bottom:8px">
          <option value="any">不限</option><option value="1">一人食</option><option value="2">二人食</option><option value="3">家庭餐</option>
        </select>
        <label class="form-label">口味偏好（多选）</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px" id="prefFlavors">
          ${['清淡','下饭','微辣','减脂','高蛋白'].map(f => `<span class="filter-chip" data-flavor="${f}" onclick="this.classList.toggle('active')">${f}</span>`).join('')}
        </div>
        <label class="form-label">不喜欢/忌口食材</label>
        <input id="prefAvoid" placeholder="例如：香菜、葱、辣椒、内脏" style="width:100%;padding:10px 12px;border-radius:var(--radius-btn);border:1px solid var(--border);font-size:14px;margin-bottom:8px">
        <label class="form-label">平时做饭时间</label>
        <select id="prefTime" style="width:100%;padding:10px 12px;border-radius:var(--radius-btn);border:1px solid var(--border);font-size:14px;margin-bottom:8px">
          <option value="any">不限</option><option value="15m">15分钟内</option><option value="30m">30分钟内</option><option value="60m">60分钟内</option><option value="weekend">周末慢慢做</option>
        </select>
        <button class="btn btn-outline btn-block" onclick="App.savePreferences()" style="border-color:#FF9800;color:#FF9800">💾 保存偏好</button>
      </div>

      <button class="btn btn-primary btn-block" onclick="App.saveSettings()">💾 保存 AI 设置</button>
      <button class="btn btn-outline btn-block" style="color:#F44336;border-color:#F44336;margin-top:4px" onclick="App.handleLogout()">🚪 退出登录</button>
      <button class="btn btn-outline btn-block" style="margin-top:4px" onclick="document.getElementById('settingsModal')?.remove()">取消</button>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  // Load existing preferences after DOM is ready
  setTimeout(() => { if (window.App?.loadPreferencesToForm) window.App.loadPreferencesToForm(); }, 80);
}

export function updateSetForm() {
  const sel = document.getElementById('aiProvider');
  if (!sel) return;
  const p = AI_PROVIDERS[sel.value];
  if (!p) return;
  const urlEl = document.getElementById('aiUrl');
  const modelEl = document.getElementById('aiModel');
  if (urlEl) urlEl.value = p.url;
  if (modelEl) modelEl.value = p.model;
}

/**
 * Test AI connection and display result in the settings modal.
 */
export async function doTestAI() {
  const resultDiv = document.getElementById('testResult');
  if (resultDiv) {
    resultDiv.style.display = 'block';
    resultDiv.className = 'test-result';
    resultDiv.textContent = '⏳ 正在测试连接...';
  }

  const result = await testAiConnection();

  if (resultDiv) {
    resultDiv.className = 'test-result ' + (result.ok ? 'test-ok' : 'test-fail');
    if (result.ok) {
      resultDiv.innerHTML = '✅ ' + result.message;
    } else {
      let detailHtml = result.error;
      if (result.detail) {
        detailHtml += `<br><small>提供商: ${escAttr(result.detail.provider)}</small>`;
        detailHtml += `<br><small>地址: ${escAttr(result.detail.url)}</small>`;
        detailHtml += `<br><small>模型: ${escAttr(result.detail.model)}</small>`;
        detailHtml += `<br><small style="color:#999">（Key 未显示，请检查是否正确设置）</small>`;
      }
      resultDiv.innerHTML = '❌ ' + result.error + '<br>' + detailHtml;
    }
  }
}

function escAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
