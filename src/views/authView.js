// RecipeMate — Auth View
import { state } from '../app.js';

export function renderAuth() {
  state.authMode = state.authMode || 'login';
  const isLogin = state.authMode === 'login';
  return `<div style="padding:40px 20px">
    <div style="text-align:center;margin-bottom:30px">
      <h1 style="font-size:28px;color:#FF6B35">🍳 RecipeMate</h1>
      <p style="color:#999">登录以同步你的收藏和记录</p>
    </div>
    <div class="auth-box">
      <h2 id="authTitle">${isLogin ? '登录' : '注册'}</h2>
      <input id="authEmail" type="email" placeholder="邮箱" autocomplete="email">
      <input id="authPass" type="password" placeholder="密码（至少6位）" autocomplete="current-password">
      <button class="auth-btn" onclick="App.doAuth()">${isLogin ? '登录' : '注册'}</button>
      <div class="auth-link">
        ${isLogin
          ? '还没有账号？<span onclick="App.toggleAuth()">注册</span>'
          : '已有账号？<span onclick="App.toggleAuth()">登录</span>'}
      </div>
    </div>
  </div>`;
}
