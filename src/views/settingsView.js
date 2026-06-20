// RecipeMate — Settings View
import { AI_PROVIDERS, getAIProvider, getAIKey, getAIUrl, getAIModel, saveAISettings } from '../config/aiProviders.js';
import { testAiConnection } from '../services/aiClient.js';
import { toast } from '../components/toast.js';

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

      <button class="btn btn-primary btn-block" onclick="App.saveSettings()">💾 保存</button>
      <button class="btn btn-outline btn-block" style="color:#F44336;border-color:#F44336;margin-top:4px" onclick="App.handleLogout()">🚪 退出登录</button>
      <button class="btn btn-outline btn-block" style="margin-top:4px" onclick="document.getElementById('settingsModal')?.remove()">取消</button>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
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
