# 🍳 RecipeMate v4

中文菜谱 PWA 应用 — 支持 AI 菜谱重构、在线搜索、打卡记录。

## 功能特色

- 🔐 **Supabase 登录注册** — 邮箱注册，数据云端同步
- 📖 **菜谱管理** — 浏览、搜索、筛选菜谱
- ❤️ **收藏** — 一键收藏喜欢的菜谱
- ✏️ **自建菜谱** — 创建和编辑自己的菜谱
- 📸 **做菜打卡** — 拍照记录每次烹饪，累积熟练度
- 🏆 **熟练度系统** — 从新手到大师，记录成长
- 🛒 **购物清单** — 自动将菜谱食材加入清单
- 🏠 **本地中文菜谱库** — 342 道完整中文菜谱（食材+步骤），离线可用
- 🤖 **AI 菜谱重构** — 将外部菜谱转换为标准格式（含完整食材用量、火候、时间）
- 🎲 **今天吃什么** — 多选标签筛选 + 本地菜谱库 / AI 智能推荐
- ⚙️ **多 AI 提供商** — DeepSeek / Groq / 硅基流动 / 智谱 / OpenAI / 阿里百炼
- 📱 **PWA 支持** — 可安装到手机主屏幕

## 项目结构

```
pwa-v2/
├── index.html              # 入口 HTML
├── manifest.json           # PWA 清单
├── package.json            # 依赖和脚本
├── vercel.json             # Vercel 部署配置
├── README.md
├── public/
│   └── data/
│       └── chinese-recipes.json   # 本地中文菜谱库（342道完整菜谱）
├── scripts/
│   └── import-recipes.cjs         # 菜谱导入脚本
├── src/
│   ├── main.js             # 主入口 + 全局 App 对象
│   ├── app.js              # 全局状态管理
│   ├── config/
│   │   └── aiProviders.js  # AI 提供商配置
│   ├── services/
│   │   ├── supabaseClient.js      # Supabase 客户端
│   │   ├── aiClient.js            # AI 调用（菜谱重构 + 推荐）
│   │   └── recipeSources/
│   │       ├── index.js                   # 数据源注册中心（3层策略）
│   │       ├── localChineseRecipeSource.js # 本地中文菜谱源（主数据源）
│   │       ├── projKitchenSource.js        # Proj Kitchen API（补充）
│   │       └── mealDbSource.js             # TheMealDB（默认关闭）
│   ├── stores/
│   │   ├── authStore.js      # 登录/注册
│   │   ├── recipeStore.js    # 菜谱 CRUD + 收藏
│   │   ├── userStateStore.js # 打卡/熟练度
│   │   └── shoppingStore.js  # 购物清单
│   ├── views/
│   │   ├── homeView.js       # 首页（含今天吃什么弹窗）
│   │   ├── recipesView.js    # 菜谱列表
│   │   ├── detailView.js     # 菜谱详情
│   │   ├── shopView.js       # 购物清单
│   │   ├── authView.js       # 登录/注册
│   │   └── settingsView.js   # 设置（含 AI 测试 + 数据源调试面板）
│   ├── components/
│   │   ├── recipeCard.js     # 菜谱卡片组件
│   │   └── toast.js          # Toast 提示
│   └── styles/
│       └── main.css          # 全局样式
└── supabase/
    ├── schema.sql            # 数据库表结构
    ├── phase3_migration.sql  # 打卡/自定义菜谱迁移
    ├── fix_rls.sql           # RLS 权限修复
    └── seed_recipes.sql      # 种子菜谱数据
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 导入中文菜谱数据

```bash
node scripts/import-recipes.cjs
```

这会从 Proj Kitchen API 拉取 342 道完整的中国菜谱（含食材和步骤），生成 `public/data/chinese-recipes.json`。

### 3. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL Editor 中依次执行 `supabase/` 目录下的 SQL 文件：
   - `schema.sql` — 创建表结构
   - `phase3_migration.sql` — 添加打卡/自定义菜谱
   - `fix_rls.sql` — 修复权限
3. 将你的 Supabase URL 和 anon key 填入 `src/services/supabaseClient.js`

### 4. 配置 AI Key（可选）

1. 启动应用后点击右上角头像进入设置
2. 选择 AI 提供商（推荐硅基流动，有免费额度）
3. 填入 API Key
4. 点击「测试 AI 连接」验证配置
5. 保存设置

> **注意：API Key 仅保存在浏览器 localStorage，不会上传到任何服务器。**

推荐的免费/低价 AI 提供商：

| 提供商 | 注册地址 | 特点 |
|--------|----------|------|
| 硅基流动 | [cloud.siliconflow.cn](https://cloud.siliconflow.cn/account/ak) | 免费额度，中文好 |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com/api_keys) | 便宜好用，中文最强 |
| Groq | [console.groq.com](https://console.groq.com/keys) | 免费，速度快 |
| 智谱GLM | [open.bigmodel.cn](https://open.bigmodel.cn/usercenter/apikeys) | 免费额度 |

### 5. 启动开发服务器

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`（默认端口）

### 6. 构建生产版本

```bash
npm run build     # 输出到 dist/
npm run preview   # 预览构建结果
```

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 无需额外配置 — `vercel.json` 已配置好

或者使用 Vercel CLI：
```bash
npx vercel --prod
```

## 数据源策略（3层）

本项目使用三层数据源，优先使用本地中文完整菜谱：

### 第一层：本地中文完整菜谱（最高优先级）

- 文件：`public/data/chinese-recipes.json`
- 内容：342 道完整中国菜谱，每道菜包含完整食材列表、详细步骤
- 优势：离线可用，搜索快速，数据完整
- 生成：运行 `node scripts/import-recipes.cjs` 从 Proj Kitchen API 拉取

### 第二层：Proj Kitchen API（在线补充）

- API: `https://proj.kitchen/api`
- 作用：当本地菜谱搜不到时，作为在线补充
- 详情接口提供完整的食材和步骤

### 第三层：TheMealDB（默认关闭）

- API: `https://www.themealdb.com/api/json/v1/1`
- 默认关闭，需在设置中手动启用「英文菜谱兜底」
- 仅在中文菜谱无结果时作为最后兜底

### 搜索逻辑

```
searchAllSources(kw):
  1. searchLocalChineseRecipes(kw)     — 本地搜索（菜名/食材/步骤/标签/分类）
  2. searchProjKitchen(kw)             — Proj Kitchen API 在线补充
  3. searchMealDB(kw)                  — 仅在设置中启用 allowEnglishFallback 时使用
```

### 详情加载逻辑

```
showApiDetail(id):
  1. state.apiDetailCache[id]          — 内存缓存
  2. getSourceRecipeDetail(id)          — 调用本地源 / Proj Kitchen 详情接口
  3. state.apiResults 列表项            — 列表数据兜底
  4. getLocalRecipeById(id)            — 本地菜谱库按 id 查找
```

## AI 菜谱重构

正确流程：

1. 用户搜索关键词 → 搜索本地中文菜谱库（主数据源）
2. 展示搜索结果 → 用户点击某个菜谱
3. 进入详情页 → 显示**完整**食材和步骤
4. 用户点击「🤖 AI 重构并保存到我的菜谱」
5. 系统检查数据完整性：
   - 如果已有完整食材和步骤 → AI 将其重写成 RecipeMate 标准格式（补充火候、时间、状态判断）
   - 如果数据不完整 → 提示用户，确认后才允许 AI 补全
6. 保存到自定义菜谱前验证食材和步骤不为空
7. 保存后可继续编辑、收藏、加入购物清单

AI 输出格式：
```json
{
  "title": "中文菜名",
  "description": "50-100字简介",
  "difficulty": "简单/中等/困难",
  "cook_time": 30,
  "ingredients": [{"name": "食材名", "amount": "具体用量"}],
  "steps": [{"num": 1, "text": "步骤标题", "detail": "含火候、时间、状态判断"}],
  "tags": ["家常菜", "快手菜"]
}
```

## 今天吃什么 — 推荐逻辑

### 多选标签

- 支持多选：点击标签选中（高亮橙色），再次点击取消
- 选中的类型保存在 state 中，不会丢失
- 显示选中状态文字：「已选择：家常菜、快手菜」或「未选择类型，将随机推荐」

### 非 AI 推荐（从菜谱库挑选）

1. 从本地中文菜谱库中按标签筛选（OR 匹配）
2. 排除包含忌口食材的菜谱
3. 随机返回 3 道
4. 每道菜显示推荐理由（匹配的标签、快手/简单等）

### AI 推荐

1. 从本地菜谱库筛选 10–20 道候选菜
2. 将候选菜的 title / ingredients / tags / cook_time 传给 AI
3. 要求 AI **只能从候选菜里选 3 道**，不允许凭空编菜
4. AI 返回选中的菜谱 ID 和推荐理由
5. 前端根据 ID 找回完整菜谱展示
6. 如果 AI 失败，自动 fallback 到本地随机推荐

## 菜谱数据来源

本地中文菜谱库 (`public/data/chinese-recipes.json`) 由多个开源/公开来源整理生成。

导入方式：
```bash
npm run import:recipes          # 完整导入（含在线API）
npm run import:recipes:offline  # 仅本地来源
```

### 来源列表

| 来源 | 描述 | License | 菜谱数（约） |
|------|------|---------|-------------|
| [Proj Kitchen](https://github.com/GraceFeng930/ProjKitchen) | 开源中文菜谱 API，每道菜含完整食材和步骤 | CC BY-NC-SA | 342 |
| [HowToCook (Anduin2017)](https://github.com/Anduin2017/HowToCook) | 程序员做饭指南，社区维护的中文菜谱 | Unlicense | ~193 |
| [YunYouJun/cook](https://github.com/YunYouJun/cook) | 开源菜谱项目 | MIT | 待定 |

### HowToCook 导入说明

HowToCook 数据以 Markdown 文件形式存储，需要先将仓库克隆到本地：

```bash
git clone --depth 1 https://github.com/Anduin2017/HowToCook
node scripts/import-recipes.cjs --howtocook-path ./HowToCook
```

### 数据清洗

所有来源的数据经过以下处理：
- 统一格式转换（字段名、结构标准化）
- 食材名称同义词归一化（如：西红柿→番茄）
- 标题清理（去掉"的做法"等后缀）
- 自动推断难度、烹饪时间、标签
- 跨来源去重合并（相似菜谱保留质量最高的版本）

### 参考来源（未直接导入）

以下来源作为参考，因数据格式或 License 限制未直接导入：

- [whatToEat (ryanuo)](https://github.com/ryanuo/whatToEat) — 菜谱推荐工具
- [Ta-da Recipe Dataset](https://github.com/Eimo-Bai/Ta-da-recipe-dataset) — 菜谱数据集 demo
- [chef_new (ylx911229)](https://github.com/ylx911229/chef_new) — 菜谱数据项目

### TheMealDB

- [TheMealDB](https://www.themealdb.com) — 英文菜谱数据库
- 默认关闭，需在设置中手动启用
- 仅在中文菜谱搜索无结果时作为兜底

### License 说明

- 代码: MIT
- Proj Kitchen 数据: CC BY-NC-SA
- HowToCook 数据: Unlicense (public domain)
- YunYouJun/cook 数据: MIT
- 用户自建菜谱：用户自有

## 技术栈

- 原生 JavaScript ES Modules
- Supabase (认证 + 数据库 + 存储)
- Vite (开发服务器 + 构建)
- PWA (manifest.json)

## 数据库表

| 表名 | 用途 |
|------|------|
| `recipes` | 内置菜谱 |
| `custom_recipes` | 用户自建菜谱 |
| `user_favorites` | 用户收藏 |
| `user_cooked` | 做菜次数/熟练度 |
| `shopping_items` | 购物清单 |
| `cooking_journal` | 打卡记录（照片+心得） |
| `recipe-images` (Storage) | 菜谱/打卡图片 |

## License

代码: MIT

菜谱数据: CC BY-NC-SA（来自 [Proj Kitchen](https://github.com/GraceFeng930/ProjKitchen)）
