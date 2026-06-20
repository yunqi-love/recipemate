// RecipeMate — AI Client
// Handles AI recipe generation and normalization.
// No API keys hardcoded — user must configure in settings.

import { getAIKey, getAIUrl, getAIModel, getAIProvider, AI_PROVIDERS } from '../config/aiProviders.js';
import { toast } from '../components/toast.js';

const RECIPE_EXAMPLE = {
  "title": "番茄炒蛋",
  "description": "国民第一家常菜。酸甜浓郁的番茄汁裹着嫩滑的鸡蛋，色泽金黄红亮，是无数中国人学会的第一道菜。一勺番茄炒蛋配一碗白米饭，就是最朴实的幸福感。",
  "difficulty": "简单",
  "cook_time": 10,
  "ingredients": [
    { "name": "番茄", "amount": "中等大小 2 个（选熟透的，捏着微软的最好）" },
    { "name": "鸡蛋", "amount": "3 个" },
    { "name": "小葱", "amount": "2 根" },
    { "name": "盐", "amount": "小半勺（约2克）" },
    { "name": "白糖", "amount": "一小撮（约3克，提鲜用，吃不出甜味）" },
    { "name": "食用油", "amount": "炒菜勺 2 勺（分两次用）" }
  ],
  "steps": [
    { "num": 1, "text": "处理食材", "detail": "番茄洗净，在顶部划十字，用开水烫10秒后撕皮（懒的话不去皮也行），切成橘子瓣大小的块。鸡蛋磕入碗中，加一丢丢盐，用筷子充分打散到表面起细泡。葱切葱花。" },
    { "num": 2, "text": "炒鸡蛋", "detail": "大火烧热锅，倒入1勺油，晃一下让油铺满锅底。油微微冒烟时（约七八成热），倒入蛋液。蛋液边缘立刻凝固蓬松起来，用筷子快速划散，约20秒，鸡蛋七八成熟、还是嫩黄色时立刻盛出。千万别炒老！" },
    { "num": 3, "text": "炒番茄出汁", "detail": "锅里再倒1勺油，放入番茄块，中火翻炒。用铲子轻轻压一压番茄，帮助出汁。炒约1-2分钟，看到番茄变软、析出红色汤汁，锅底有明显汁水即可。" },
    { "num": 4, "text": "合炒调味", "detail": "倒回鸡蛋，撒入白糖和盐，大火快速翻炒约30秒，让每块鸡蛋都裹上番茄汁。尝一下味道，不够咸就补一点盐。撒葱花，翻两下关火出锅。" }
  ],
  "tags": ["家常菜", "快手菜", "下饭菜", "入门", "酸甜"]
};

/**
 * Check AI connection with a minimal test request.
 */
export async function testAiConnection() {
  const key = getAIKey();
  const url = getAIUrl();
  const model = getAIModel();
  const provider = getAIProvider();

  if (!key) return { ok: false, error: '未设置 API Key' };
  if (!url) return { ok: false, error: '未设置 API 地址' };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: '回复 {"ok":true,"message":"AI连接正常"}，不要其他文字。' }],
        temperature: 0,
        max_tokens: 50
      })
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const errBody = await res.json();
        errMsg += ': ' + (errBody.error?.message || JSON.stringify(errBody));
      } catch (e) {}
      return {
        ok: false,
        error: errMsg,
        detail: { provider, url, model }
      };
    }

    const d = await res.json();
    if (d.error) {
      return {
        ok: false,
        error: d.error.message || JSON.stringify(d.error),
        detail: { provider, url, model }
      };
    }

    const content = (d.choices?.[0]?.message?.content || '').trim();
    // Try to parse the response as JSON
    try {
      const parsed = JSON.parse(content.replace(/```/g, '').trim());
      if (parsed.ok) {
        return { ok: true, message: parsed.message || 'AI连接正常' };
      }
    } catch (e) {
      // If it contains "ok", consider it a success
      if (content.includes('ok') || content.includes('正常')) {
        return { ok: true, message: 'AI连接正常' };
      }
    }

    return { ok: true, message: content.slice(0, 50) || 'AI响应正常' };
  } catch (e) {
    return {
      ok: false,
      error: '网络错误: ' + e.message,
      detail: { provider, url, model }
    };
  }
}

function buildNormalizePrompt(sourceRecipe) {
  return `你是一位专业的中国厨师和美食作家。请根据原始菜谱信息，参照标准格式，用中文创作一份完整的家常菜谱。

【标准格式范例】
${JSON.stringify(RECIPE_EXAMPLE, null, 2)}

【创作规则】
- 菜名：保留原始菜谱的中文名，不要改动
- 描述：50-100字中文简介，包含口感、风味、适合场景
- 食材：每一种都要有具体用量，用中国厨房用语（个、根、瓣、勺、小半勺、一小撮），标注1-2人份
- 步骤：每一步都包含三个要素——火候（大火/中火/小火）、具体时间（约X分钟/X秒）、食物状态（"炒至金黄""煮至软烂""闻到香味""边缘凝固"）
- 难度：客观评估。用料少步骤短=简单，有技巧=中等，长时间炖煮/多步骤=困难
- 耗时：合理的总时间
- 标签：4-5个精准中文标签（如：家常菜、快手菜、下饭菜、减脂、川菜、粤菜等）

【重要限制】
- 不要凭空编造不存在的主食材，如果原始菜谱有食材列表，以原始食材为准
- 如果原始菜谱食材有用量，优先保留
- 如果原始菜谱步骤过短，可以补充火候、时间、状态判断

【严格输出 JSON，不要 markdown 代码块，不要额外文字】
{"title":"...","description":"...","difficulty":"简单/中等/困难","cook_time":数字,"ingredients":[{"name":"食材名","amount":"具体用量"}],"steps":[{"num":1,"text":"步骤标题","detail":"详细步骤，必须包含火候、时间、状态判断"}],"tags":["..."]}

原始菜谱：名称：${sourceRecipe.title}  分类：${sourceRecipe.description || ''}  食材列表：${JSON.stringify((sourceRecipe.ingredients || []).map(i => typeof i === 'string' ? i : i.name))}  原文步骤：${JSON.stringify((sourceRecipe.steps || []).map(s => typeof s === 'string' ? s : (s.text || '')))}`;
}

function extractJSON(content) {
  // Remove markdown code blocks
  content = content.replace(/```(json)?\s*/g, '').replace(/```\s*/g, '').trim();
  // Find JSON object
  const m = content.match(/\{[\s\S]*\}/);
  return m ? m[0] : null;
}

/**
 * AI Normalize Recipe — convert any recipe to RecipeMate standard format.
 * Returns the normalized recipe data or null on failure.
 */
export async function aiNormalizeRecipe(sourceRecipe) {
  const key = getAIKey();
  const url = getAIUrl();
  const model = getAIModel();

  if (!key) {
    toast('❌ 请先设置 AI Key（点击右上角👤进入设置）');
    return null;
  }
  if (!url) {
    toast('❌ 请先设置 API 地址');
    return null;
  }

  toast('🤖 AI 正在重构菜谱（约15秒）...');

  const prompt = buildNormalizePrompt(sourceRecipe);

  // Try up to 2 times
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!res.ok) {
        toast('❌ HTTP ' + res.status);
        return null;
      }

      const d = await res.json();
      if (d.error) {
        toast('❌ API: ' + (d.error.message || JSON.stringify(d.error)));
        return null;
      }

      if (!d.choices?.[0]?.message) {
        toast('❌ 响应异常');
        console.log('API raw', d);
        return null;
      }

      const content = d.choices[0].message.content || '';
      const jsonStr = extractJSON(content);

      if (!jsonStr) {
        if (attempt < 2) {
          toast('⚠️ 解析失败，正在重试...');
          continue;
        }
        toast('❌ 无JSON: ' + content.slice(0, 60));
        return null;
      }

      const p = JSON.parse(jsonStr);

      if (!p.title || !p.ingredients || !p.steps) {
        if (attempt < 2) {
          toast('⚠️ AI 返回不完整，正在重试...');
          continue;
        }
        toast('❌ AI返回不完整，已保存原始菜谱（可手动编辑）');
        return null;
      }

      // Normalize steps format
      const steps = (p.steps || []).map((s, i) => {
        if (typeof s === 'string') {
          return { num: i + 1, text: s.length > 50 ? s.slice(0, 50) + '…' : s, detail: s };
        }
        return { num: s.num || i + 1, text: s.text || '', detail: s.detail || '' };
      });

      toast('✅ AI 重构完成！');
      return {
        title: p.title || sourceRecipe.title,
        description: p.description || '',
        difficulty: p.difficulty || '中等',
        cook_time: p.cook_time || 30,
        ingredients: p.ingredients || sourceRecipe.ingredients || [],
        steps,
        tags: p.tags || [],
        image_url: sourceRecipe.image_url || null
      };
    } catch (e) {
      if (attempt < 2) {
        toast('⚠️ 网络错误，正在重试...');
        continue;
      }
      toast('❌ 网络错误: ' + e.message);
      return null;
    }
  }

  return null;
}

/**
 * AI recommend recipes from a candidate pool — for "today's eat" only.
 *
 * Expects input: a JSON string with {servings, preferences, avoid, candidates: [{id, title, category, tags, difficulty, cook_time, ingredients}]}
 *
 * Returns: [{id, title, reason, difficulty, cook_time, tags}] — picks from the candidate pool.
 */
export async function aiRecommend(inputData) {
  const key = getAIKey();
  const url = getAIUrl();
  const model = getAIModel();

  if (!key) return null;

  try {
    // Parse input if it's a string
    let parsed;
    if (typeof inputData === 'string') {
      try {
        parsed = JSON.parse(inputData);
      } catch (e) {
        // Legacy format: plain conditions string
        const prompt = `根据以下条件推荐3道菜：${inputData}。返回严格JSON：[{"title":"菜名","reason":"推荐理由","difficulty":"简单/中等/困难","cook_time":数字,"tags":["标签1","标签2"]}]`;
        return await _callAI(url, key, model, prompt);
      }
    } else {
      parsed = inputData;
    }

    const { servings, preferences, avoid, candidates } = parsed;

    // If no candidates given, fall back to generic recommendation
    if (!candidates || candidates.length === 0) {
      const prompt = `根据条件推荐3道菜：${servings}，${preferences}，${avoid}。返回严格JSON：[{"title":"菜名","reason":"推荐理由","difficulty":"简单/中等/困难","cook_time":数字,"tags":["标签1","标签2"]}]`;
      return await _callAI(url, key, model, prompt);
    }

    // Build prompt with real candidate data
    const candidateSummary = candidates.map((c, i) =>
      `${i}: id="${c.id}", 菜名="${c.title}", 分类="${c.category || ''}", 标签=${JSON.stringify(c.tags || [])}, 难度="${c.difficulty}", 耗时${c.cook_time || 20}分钟, 食材=${JSON.stringify(c.ingredients || [])}`
    ).join('\n');

    const prompt = `你是一位贴心的家庭厨师，请根据用户的偏好，从以下候选菜谱中挑选3道最适合的菜。

【用户偏好】
- 用餐人数：${servings || '2人份'}
- 偏好：${preferences || '不限'}
- 忌口/过敏：${avoid || '无'}

【候选菜谱列表】（只能从中选3道）
${candidateSummary}

【挑选规则】
1. 必须从候选菜谱中选择，不能编造不在列表中的菜
2. 优先匹配用户偏好标签
3. 避开用户忌口食材
4. 考虑搭配均衡（有荤有素，不重复）
5. 每道菜写15-30字推荐理由（中文）

【严格输出 JSON 数组，不要 markdown 代码块，不要额外文字】
[{"id":"候选菜谱的id","title":"菜名","reason":"推荐理由","difficulty":"简单/中等/困难","cook_time":数字,"tags":["标签"]}]`;

    return await _callAI(url, key, model, prompt);
  } catch (e) {
    console.warn('aiRecommend error:', e.message);
    return null;
  }
}

async function _callAI(url, key, model, prompt) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 800
    })
  });

  if (!res.ok) return null;
  const d = await res.json();
  if (!d.choices) return null;

  let raw = d.choices[0].message.content || '';
  raw = raw.replace(/```(\w+)?/g, '').trim();
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return null;

  return JSON.parse(m[0]);
}
