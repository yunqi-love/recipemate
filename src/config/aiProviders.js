// RecipeMate — AI Provider Configuration
export const AI_PROVIDERS = {
  deepseek: {
    name: 'DeepSeek V4（推荐✨，中文最强）',
    url: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    keyPrefix: 'sk-'
  },
  groq: {
    name: 'Groq（免费，快）',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    keyPrefix: 'gsk_'
  },
  silicon: {
    name: '硅基流动（免费额度，中文好）',
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    model: 'deepseek-ai/DeepSeek-V3',
    keyPrefix: 'sk-'
  },
  zhipu: {
    name: '智谱GLM（免费额度）',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: 'glm-4-flash',
    keyPrefix: ''
  },
  openai: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    keyPrefix: 'sk-'
  },
  bailian: {
    name: '阿里百炼',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    model: 'qwen-plus',
    keyPrefix: 'sk-'
  },
  custom: {
    name: '自定义（OpenAI兼容）',
    url: '',
    model: '',
    keyPrefix: ''
  }
};

export function getAIProvider() {
  return localStorage.getItem('rm_aiprovider') || 'silicon';
}

export function getAIKey() {
  // NEVER hardcode a default key — user must provide their own
  return localStorage.getItem('rm_aikey') || '';
}

export function getAIUrl() {
  const p = AI_PROVIDERS[getAIProvider()];
  return localStorage.getItem('rm_aiurl') || p.url;
}

export function getAIModel() {
  const p = AI_PROVIDERS[getAIProvider()];
  return localStorage.getItem('rm_aimodel') || p.model;
}

export function saveAISettings(provider, url, model, key) {
  localStorage.setItem('rm_aiprovider', provider);
  localStorage.setItem('rm_aiurl', url.trim());
  localStorage.setItem('rm_aimodel', model.trim());
  localStorage.setItem('rm_aikey', key.trim());
}
