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
- 🥘 **Proj Kitchen 中文菜谱** — 342 道中文菜谱，分类浏览
- 🤖 **AI 菜谱重构** — 将外部菜谱转换为标准格式（含完整食材、步骤、火候）
- 🎲 **今天吃什么** — AI 智能推荐或菜谱库随机挑选
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
├── src/
│   ├── main.js             # 主入口 + 全局 App 对象
│   ├── app.js              # 全局状态管理
│   ├── config/
│   │   └── aiProviders.js  # AI 提供商配置
│   ├── services/
│   │   ├── supabaseClient.js      # Supabase 客户端
│   │   ├── aiClient.js            # AI 调用（菜谱重构 + 推荐）
│   │   └── recipeSources/
│   │       ├── index.js           # 数据源注册中心
│   │       ├── projKitchenSource.js  # Proj Kitchen API
│   │       └── mealDbSource.js    # TheMealDB（仅兜底）
│   ├── stores/
│   │   ├── authStore.js      # 登录/注册
│   │   ├── recipeStore.js    # 菜谱 CRUD + 收藏
│   │   ├── userStateStore.js # 打卡/熟练度
│   │   └── shoppingStore.js  # 购物清单
│   ├── views/
│   │   ├── homeView.js       # 首页（含今天吃什么）
│   │   ├── recipesView.js    # 菜谱列表
│   │   ├── detailView.js     # 菜谱详情
│   │   ├── shopView.js       # 购物清单
│   │   ├── authView.js       # 登录/注册
│   │   └── settingsView.js   # 设置（含 AI 测试）
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

### 2. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL Editor 中依次执行 `supabase/` 目录下的 SQL 文件：
   - `schema.sql` — 创建表结构
   - `phase3_migration.sql` — 添加打卡/自定义菜谱
   - `fix_rls.sql` — 修复权限
3. 将你的 Supabase URL 和 anon key 填入 `src/services/supabaseClient.js`

### 3. 配置 AI Key（可选）

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

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`（默认端口）

### 5. 构建生产版本

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

## 数据源

### 主数据源：Proj Kitchen
- 342 道中文菜谱，12 个分类
- API: `https://proj.kitchen/api/recipes`
- 详情: `https://proj.kitchen/api/recipes/:id`
- CORS 已开放，无需代理

### 兜底数据源：TheMealDB
- 仅在 Proj Kitchen 无结果时使用
- API: `https://www.themealdb.com/api/json/v1/1`

## AI 菜谱重构

正确流程：

1. 用户搜索关键词 → 搜索 Proj Kitchen 中文菜谱
2. 展示搜索结果 → 用户点击某个菜谱
3. 进入详情页 → 显示原始数据
4. 用户点击「🤖 AI 重构并保存到我的菜谱」
5. AI 将原始菜谱重构成标准格式（含完整食材用量、火候、时间）
6. 保存到自定义菜谱 → 可继续编辑、收藏、加入购物清单

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

MIT
