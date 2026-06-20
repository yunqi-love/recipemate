import{createClient as G}from"https://esm.sh/@supabase/supabase-js@2";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))s(o);new MutationObserver(o=>{for(const a of o)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function n(o){const a={};return o.integrity&&(a.integrity=o.integrity),o.referrerPolicy&&(a.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?a.credentials="include":o.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(o){if(o.ep)return;o.ep=!0;const a=n(o);fetch(o.href,a)}})();const i={session:null,recipes:[],customRecipes:[],favorites:new Set,cookedMap:{},proficiency:{},shopItems:[],journals:[],currentView:"home",currentFilter:"all",currentDetailId:null,currentDetailIsApi:!1,parentView:null,savedScrollY:0,apiResults:[],apiDetailCache:{},authMode:"login",formDirty:!1,recipeImgFile:null,cookPhotoFile:null,todayResults:null};function z(e){return e>=10?{level:"大师",cls:"prof-master",emoji:"🏆"}:e>=5?{level:"熟练",cls:"prof-expert",emoji:"💪"}:e>=2?{level:"进阶",cls:"prof-skilled",emoji:"👍"}:e>=1?{level:"初学",cls:"prof-learner",emoji:"🌱"}:{level:"新手",cls:"prof-novice",emoji:"📖"}}function C(){i.proficiency={},[...i.recipes,...i.customRecipes].forEach(t=>{const n=i.cookedMap[t.id]||{count:0};i.proficiency[t.id]=z(n.count)})}const Z=[{key:"all",label:"全部"},{key:"简单",label:"简单"},{key:"中等",label:"中等"},{key:"困难",label:"困难"},{key:"faved",label:"⭐ 已收藏"},{key:"master",label:"🏆 大师级"}],B={deepseek:{name:"DeepSeek V4（推荐✨，中文最强）",url:"https://api.deepseek.com/v1/chat/completions",model:"deepseek-chat",keyPrefix:"sk-"},groq:{name:"Groq（免费，快）",url:"https://api.groq.com/openai/v1/chat/completions",model:"llama-3.3-70b-versatile",keyPrefix:"gsk_"},silicon:{name:"硅基流动（免费额度，中文好）",url:"https://api.siliconflow.cn/v1/chat/completions",model:"deepseek-ai/DeepSeek-V3",keyPrefix:"sk-"},zhipu:{name:"智谱GLM（免费额度）",url:"https://open.bigmodel.cn/api/paas/v4/chat/completions",model:"glm-4-flash",keyPrefix:""},openai:{name:"OpenAI",url:"https://api.openai.com/v1/chat/completions",model:"gpt-4o-mini",keyPrefix:"sk-"},bailian:{name:"阿里百炼",url:"https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",model:"qwen-plus",keyPrefix:"sk-"},custom:{name:"自定义（OpenAI兼容）",url:"",model:"",keyPrefix:""}};function j(){return localStorage.getItem("rm_aiprovider")||"silicon"}function M(){return localStorage.getItem("rm_aikey")||""}function P(){const e=B[j()];return localStorage.getItem("rm_aiurl")||e.url}function R(){const e=B[j()];return localStorage.getItem("rm_aimodel")||e.model}function Q(e,t,n,s){localStorage.setItem("rm_aiprovider",e),localStorage.setItem("rm_aiurl",t.trim()),localStorage.setItem("rm_aimodel",n.trim()),localStorage.setItem("rm_aikey",s.trim())}const ee="https://nfwdloidytxgtlwhiewd.supabase.co",te="sb_publishable_TyHyw13jEY0PknZilctfNQ_d_tLZNfD",f=G(ee,te);function u(e){const t=document.getElementById("toast");t&&(t.textContent=e,t.classList.add("show"),clearTimeout(t._timeout),t._timeout=setTimeout(()=>t.classList.remove("show"),2e3))}const ie={title:"番茄炒蛋",description:"国民第一家常菜。酸甜浓郁的番茄汁裹着嫩滑的鸡蛋，色泽金黄红亮，是无数中国人学会的第一道菜。一勺番茄炒蛋配一碗白米饭，就是最朴实的幸福感。",difficulty:"简单",cook_time:10,ingredients:[{name:"番茄",amount:"中等大小 2 个（选熟透的，捏着微软的最好）"},{name:"鸡蛋",amount:"3 个"},{name:"小葱",amount:"2 根"},{name:"盐",amount:"小半勺（约2克）"},{name:"白糖",amount:"一小撮（约3克，提鲜用，吃不出甜味）"},{name:"食用油",amount:"炒菜勺 2 勺（分两次用）"}],steps:[{num:1,text:"处理食材",detail:"番茄洗净，在顶部划十字，用开水烫10秒后撕皮（懒的话不去皮也行），切成橘子瓣大小的块。鸡蛋磕入碗中，加一丢丢盐，用筷子充分打散到表面起细泡。葱切葱花。"},{num:2,text:"炒鸡蛋",detail:"大火烧热锅，倒入1勺油，晃一下让油铺满锅底。油微微冒烟时（约七八成热），倒入蛋液。蛋液边缘立刻凝固蓬松起来，用筷子快速划散，约20秒，鸡蛋七八成熟、还是嫩黄色时立刻盛出。千万别炒老！"},{num:3,text:"炒番茄出汁",detail:"锅里再倒1勺油，放入番茄块，中火翻炒。用铲子轻轻压一压番茄，帮助出汁。炒约1-2分钟，看到番茄变软、析出红色汤汁，锅底有明显汁水即可。"},{num:4,text:"合炒调味",detail:"倒回鸡蛋，撒入白糖和盐，大火快速翻炒约30秒，让每块鸡蛋都裹上番茄汁。尝一下味道，不够咸就补一点盐。撒葱花，翻两下关火出锅。"}],tags:["家常菜","快手菜","下饭菜","入门","酸甜"]};async function ne(){var o,a,c,r;const e=M(),t=P(),n=R(),s=j();if(!e)return{ok:!1,error:"未设置 API Key"};if(!t)return{ok:!1,error:"未设置 API 地址"};try{const l=await fetch(t,{method:"POST",headers:{Authorization:"Bearer "+e,"Content-Type":"application/json"},body:JSON.stringify({model:n,messages:[{role:"user",content:'回复 {"ok":true,"message":"AI连接正常"}，不要其他文字。'}],temperature:0,max_tokens:50})});if(!l.ok){let v=`HTTP ${l.status}`;try{const p=await l.json();v+=": "+(((o=p.error)==null?void 0:o.message)||JSON.stringify(p))}catch{}return{ok:!1,error:v,detail:{provider:s,url:t,model:n}}}const m=await l.json();if(m.error)return{ok:!1,error:m.error.message||JSON.stringify(m.error),detail:{provider:s,url:t,model:n}};const g=(((r=(c=(a=m.choices)==null?void 0:a[0])==null?void 0:c.message)==null?void 0:r.content)||"").trim();try{const v=JSON.parse(g.replace(/```/g,"").trim());if(v.ok)return{ok:!0,message:v.message||"AI连接正常"}}catch{if(g.includes("ok")||g.includes("正常"))return{ok:!0,message:"AI连接正常"}}return{ok:!0,message:g.slice(0,50)||"AI响应正常"}}catch(l){return{ok:!1,error:"网络错误: "+l.message,detail:{provider:s,url:t,model:n}}}}function se(e){return`你是一位专业的中国厨师和美食作家。请根据原始菜谱信息，参照标准格式，用中文创作一份完整的家常菜谱。

【标准格式范例】
${JSON.stringify(ie,null,2)}

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

原始菜谱：名称：${e.title}  分类：${e.description||""}  食材列表：${JSON.stringify((e.ingredients||[]).map(t=>typeof t=="string"?t:t.name))}  原文步骤：${JSON.stringify((e.steps||[]).map(t=>typeof t=="string"?t:t.text||""))}`}function oe(e){e=e.replace(/```(json)?\s*/g,"").replace(/```\s*/g,"").trim();const t=e.match(/\{[\s\S]*\}/);return t?t[0]:null}async function U(e){var a,c;const t=M(),n=P(),s=R();if(!t)return u("❌ 请先设置 AI Key（点击右上角👤进入设置）"),null;if(!n)return u("❌ 请先设置 API 地址"),null;u("🤖 AI 正在重构菜谱（约15秒）...");const o=se(e);for(let r=1;r<=2;r++)try{const l=await fetch(n,{method:"POST",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({model:s,messages:[{role:"user",content:o}],temperature:.7,max_tokens:2048})});if(!l.ok)return u("❌ HTTP "+l.status),null;const m=await l.json();if(m.error)return u("❌ API: "+(m.error.message||JSON.stringify(m.error))),null;if(!((c=(a=m.choices)==null?void 0:a[0])!=null&&c.message))return u("❌ 响应异常"),console.log("API raw",m),null;const g=m.choices[0].message.content||"",v=oe(g);if(!v){if(r<2){u("⚠️ 解析失败，正在重试...");continue}return u("❌ 无JSON: "+g.slice(0,60)),null}const p=JSON.parse(v);if(!p.title||!p.ingredients||!p.steps){if(r<2){u("⚠️ AI 返回不完整，正在重试...");continue}return u("❌ AI返回不完整，已保存原始菜谱（可手动编辑）"),null}const b=(p.steps||[]).map((d,w)=>typeof d=="string"?{num:w+1,text:d.length>50?d.slice(0,50)+"…":d,detail:d}:{num:d.num||w+1,text:d.text||"",detail:d.detail||""});return u("✅ AI 重构完成！"),{title:p.title||e.title,description:p.description||"",difficulty:p.difficulty||"中等",cook_time:p.cook_time||30,ingredients:p.ingredients||e.ingredients||[],steps:b,tags:p.tags||[],image_url:e.image_url||null}}catch(l){if(r<2){u("⚠️ 网络错误，正在重试...");continue}return u("❌ 网络错误: "+l.message),null}return null}async function ae(e){const t=M(),n=P(),s=R();if(!t)return null;try{const o=`根据以下条件推荐3道菜：${e}。返回严格JSON：[{"title":"菜名","reason":"推荐理由","difficulty":"简单/中等/困难","cook_time":数字,"tags":["标签1","标签2"]}]`,a=await fetch(n,{method:"POST",headers:{Authorization:"Bearer "+t,"Content-Type":"application/json"},body:JSON.stringify({model:s,messages:[{role:"user",content:o}],temperature:.8,max_tokens:800})});if(!a.ok)return null;const c=await a.json();if(!c.choices)return null;let r=c.choices[0].message.content||"";r=r.replace(/```(\w+)?/g,"").trim();const l=r.match(/\[[\s\S]*\]/);return l?JSON.parse(l[0]):null}catch{return null}}const le="https://proj.kitchen/api";function J(e){(e.steps||[]).map((n,s)=>({num:s+1,text:n.length>50?n.slice(0,50)+"…":n,detail:n}));const t=(e.steps||[]).map((n,s)=>typeof n=="string"?{num:s+1,text:n.length>50?n.slice(0,50)+"…":n,detail:n}:{num:n.num||s+1,text:n.text||"",detail:n.detail||""});return{id:"pk_"+e.id,title:e.name||e.title||"",description:`${e.category||""} · ${e.difficulty||"中等"}${e.tips?" · 💡 "+e.tips:""}`,difficulty:e.difficulty==="简单"?"简单":e.difficulty==="困难"?"困难":"中等",cook_time:ce(e.category,e.steps),image_url:null,ingredients:(e.ingredients||[]).map(n=>({name:n.name||"",amount:n.amount||""})),steps:t,tags:[e.category].filter(Boolean),source:"projkitchen",isApi:!0,_orig:e}}function ce(e,t){return!t||t.length===0?20:t.length<=3?15:t.length<=6?25:t.length<=10?40:60}async function Y(){const e=window._projKitchenCache;if(e&&e.list)return e.list;try{const t=await fetch(`${le}/recipes`);if(!t.ok)throw new Error("HTTP "+t.status);const n=await t.json();return window._projKitchenCache||(window._projKitchenCache={}),window._projKitchenCache.list=n,n}catch(t){return console.warn("Proj Kitchen list fetch failed:",t.message),[]}}async function re(e){const t=await Y();if(!t.length)return[];const n=e.toLowerCase().trim();return t.filter(o=>o.name.toLowerCase().includes(n)||(o.category||"").toLowerCase().includes(n)).map(o=>J(o))}async function K(e){const t=await Y();return t.length?t.filter(n=>e.some(s=>n.category===s||n.name.includes(s))).sort(()=>Math.random()-.5).map(n=>J(n)):[]}const L="https://www.themealdb.com/api/json/v1/1",de={牛肉:"beef",鸡肉:"chicken",猪肉:"pork",羊肉:"lamb",虾:"shrimp",虾仁:"shrimp",鱼:"fish",三文鱼:"salmon",豆腐:"tofu",鸡蛋:"egg",番茄:"tomato",西红柿:"tomato",土豆:"potato",西兰花:"broccoli",胡萝卜:"carrot",茄子:"eggplant",青椒:"pepper",蘑菇:"mushroom",洋葱:"onion",蒜:"garlic",姜:"ginger",米饭:"rice",面:"noodle",面条:"noodle",意面:"pasta",意大利面:"pasta",面包:"bread",蛋糕:"cake",汤:"soup",沙拉:"salad",咖喱:"curry",海鲜:"seafood",奶酪:"cheese",巧克力:"chocolate",玉米:"corn",菠菜:"spinach",黄瓜:"cucumber",辣椒:"chili",鸭:"duck",牛排:"steak",汉堡:"burger",披萨:"pizza",寿司:"sushi",饺子:"dumpling",炒饭:"fried rice",炒面:"chow mein",春卷:"spring roll",排骨:"ribs",红烧肉:"pork belly",丸子:"meatball",香肠:"sausage",培根:"bacon",豆:"bean",扁豆:"lentil",白菜:"cabbage",生菜:"lettuce",芹菜:"celery",南瓜:"pumpkin",红薯:"sweet potato",火锅:"hot pot",粥:"porridge"};function pe(e){e=e.toLowerCase().trim();for(const[t,n]of Object.entries(de))if(e.includes(t))return n;return e}async function ue(e){const t=pe(e);let n=[],s=await fetch(`${L}/search.php?s=${encodeURIComponent(t)}`),o=await s.json();o.meals&&(n=[...o.meals]),n.length===0&&(s=await fetch(`${L}/filter.php?i=${encodeURIComponent(t)}`),o=await s.json(),o.meals&&(n=[...o.meals])),n.length===0&&e!==t&&(s=await fetch(`${L}/search.php?s=${encodeURIComponent(e)}`),o=await s.json(),o.meals&&(n=[...o.meals]));const a=new Set;return n=n.filter(c=>a.has(c.idMeal)?!1:(a.add(c.idMeal),!0)),n.map(c=>({id:"api_"+c.idMeal,title:c.strMeal,description:(c.strArea||"")+" · "+(c.strCategory||""),difficulty:"中等",cook_time:30,image_url:c.strMealThumb+"/preview",ingredients:Array.from({length:20},(r,l)=>c["strIngredient"+(l+1)]).filter(Boolean).map(r=>({name:r,amount:""})),steps:[{num:1,text:(c.strInstructions||"").split(`\r
`).filter(Boolean).join(" ")||"暂无步骤",detail:""}],tags:[c.strCategory,c.strArea].filter(Boolean),isApi:!0,source:"themealdb",_orig:c}))}async function me(e){const t=await re(e);if(t.length>0)return{results:t,source:"projkitchen"};const n=await ue(e);return n.length>0?{results:n,source:"themealdb"}:{results:[],source:null}}async function fe(){const{data:e}=await f.auth.getSession();return i.session=e.session,i.session}async function ge(e,t,n){const{data:s,error:o}=n?await f.auth.signInWithPassword({email:e,password:t}):await f.auth.signUp({email:e,password:t});return o?(u("❌ "+o.message),!1):(i.session=s.session,n?(u("✅ 登录成功"),!0):(u("✅ 注册成功，请登录"),!1))}async function ve(){await f.auth.signOut(),i.session=null,i.favorites.clear(),i.cookedMap={},i.shopItems=[],i.journals=[],i.proficiency={},i.customRecipes=[],i.recipes=[]}async function F(){const[{data:e},{data:t},{data:n},{data:s},{data:o},{data:a}]=await Promise.all([f.from("recipes").select("*").order("id"),f.from("user_favorites").select("recipe_id"),f.from("user_cooked").select("*"),f.from("shopping_items").select("*").order("created_at"),f.from("custom_recipes").select("*").order("created_at",{ascending:!1}),f.from("cooking_journal").select("*").order("cooked_at",{ascending:!1})]);i.recipes=e||[],i.customRecipes=o||[],i.journals=a||[];const c=new Set(i.customRecipes.map(r=>r.id));i.recipes=i.recipes.filter(r=>!c.has(r.id)),i.favorites.clear(),t&&t.forEach(r=>i.favorites.add(r.recipe_id)),i.cookedMap={},n&&n.forEach(r=>{i.cookedMap[r.recipe_id]={count:r.count,last:r.last_cooked}}),C(),i.shopItems=s||[]}function ye(){return[...i.recipes,...i.customRecipes]}function S(e){return ye().find(t=>t.id===e)}async function V(e,t){const n={user_id:i.session.user.id,title:e.title,description:e.desc||"",difficulty:e.diff||"中等",cook_time:parseInt(e.time)||20,image_url:e.img||null,ingredients:e.ing||[],steps:e.steps||[],tags:e.tags||[]};let s;if(t){const{data:o,error:a}=await f.from("custom_recipes").upsert({...n,id:t},{onConflict:"id"}).select().single();if(a)return u("❌ 保存失败"),null;s=o,i.customRecipes=i.customRecipes.filter(c=>c.id!==t),i.customRecipes.unshift(s),u("✅ 菜谱已更新")}else{const{data:o,error:a}=await f.from("custom_recipes").insert(n).select().single();if(a)return u("❌ 保存失败"),null;s=o,i.customRecipes.unshift(s),u("✅ 菜谱已创建")}return C(),s}async function he(e,t){await f.from("custom_recipes").update(t).eq("id",e),await F(),u("✅ 已更新")}async function W(e){await f.from("custom_recipes").delete().eq("id",e),await F(),u("✅ 已删除")}async function be(e){i.favorites.has(e)?(await f.from("user_favorites").delete().eq("recipe_id",e).eq("user_id",i.session.user.id),i.favorites.delete(e)):(await f.from("user_favorites").insert({user_id:i.session.user.id,recipe_id:e}),i.favorites.add(e))}async function N(e){const t=e.name.split(".").pop(),n=`${Date.now()}_${Math.random().toString(36).slice(2,8)}.${t}`,{data:s,error:o}=await f.storage.from("recipe-images").upload(n,e,{upsert:!0});return o?(u("❌ 上传失败: "+o.message),null):f.storage.from("recipe-images").getPublicUrl(s.path).data.publicUrl}async function q(e,t,n){const s=i.cookedMap[e]||{count:0};await f.from("user_cooked").upsert({user_id:i.session.user.id,recipe_id:e,count:s.count+1,last_cooked:new Date().toISOString()},{onConflict:"user_id,recipe_id"}),i.cookedMap[e]={count:s.count+1,last:new Date().toISOString()},(t||n)&&(await f.from("cooking_journal").insert({user_id:i.session.user.id,recipe_id:e,photo_url:t,notes:n}),i.journals.unshift({id:Date.now().toString(),user_id:i.session.user.id,recipe_id:e,photo_url:t,notes:n,cooked_at:new Date().toISOString()})),C(),u("✅ 已记录！")}async function ke(e){await q(e,null,null)}async function we(e){const t=i.cookedMap[e]||{count:0};if(t.count<=0)return;const n=t.count-1;n===0?(await f.from("user_cooked").delete().eq("user_id",i.session.user.id).eq("recipe_id",e),delete i.cookedMap[e]):(await f.from("user_cooked").upsert({user_id:i.session.user.id,recipe_id:e,count:n,last_cooked:t.last},{onConflict:"user_id,recipe_id"}),i.cookedMap[e]={count:n,last:t.last}),C()}async function $e(e){for(const t of e.ingredients){const n=typeof t=="string"?t:t.name;if(!n||i.shopItems.find(a=>a.name===n))continue;const{data:o}=await f.from("shopping_items").insert({user_id:i.session.user.id,name:n,recipe_id:e.id}).select().single();o&&i.shopItems.push(o)}u("✅ 已加入清单")}async function Ie(e){const t=i.shopItems.find(n=>n.id===e);t&&(await f.from("shopping_items").update({checked:!t.checked}).eq("id",e),t.checked=!t.checked)}async function Ae(e){await f.from("shopping_items").delete().eq("id",e),i.shopItems=i.shopItems.filter(t=>t.id!==e)}async function xe(){await f.from("shopping_items").delete().eq("user_id",i.session.user.id),i.shopItems=[]}function _e(){i.authMode=i.authMode||"login";const e=i.authMode==="login";return`<div style="padding:40px 20px">
    <div style="text-align:center;margin-bottom:30px">
      <h1 style="font-size:28px;color:#FF6B35">🍳 RecipeMate</h1>
      <p style="color:#999">登录以同步你的收藏和记录</p>
    </div>
    <div class="auth-box">
      <h2 id="authTitle">${e?"登录":"注册"}</h2>
      <input id="authEmail" type="email" placeholder="邮箱" autocomplete="email">
      <input id="authPass" type="password" placeholder="密码（至少6位）" autocomplete="current-password">
      <button class="auth-btn" onclick="App.doAuth()">${e?"登录":"注册"}</button>
      <div class="auth-link">
        ${e?'还没有账号？<span onclick="App.toggleAuth()">注册</span>':'已有账号？<span onclick="App.toggleAuth()">登录</span>'}
      </div>
    </div>
  </div>`}function O(e){const t=i.proficiency[e.id]||z(0),n=e.difficulty==="简单"?"badge-easy":e.difficulty==="中等"?"badge-medium":"badge-hard",s=i.favorites.has(e.id)?"❤️":"🤍",o=e.isApi?`<div class="api-badge">${e.source==="projkitchen"?"🥘 ProjKitchen":e.source==="themealdb"?"🌐 TheMealDB":"🌐 在线"}</div>`:"",a=e.user_id?'<div class="api-badge" style="right:8px;left:auto;background:#4CAF50">我的</div>':"";return`<div class="recipe-card" onclick="App.showDetail('${e.id}',${!!e.isApi})">
    ${e.image_url?`<img class="card-img" src="${e.image_url}" alt="${h(e.title)}" loading="lazy">`:""}
    ${o}${a}
    <div class="card-body">
      <div class="card-row">
        <span class="card-title">${h(e.title)}</span>
        <span class="card-fav" onclick="event.stopPropagation();App.favClick('${e.id}')">${s}</span>
      </div>
      <div class="card-desc">${h(e.description||"")}</div>
      <div class="card-meta">
        <span class="badge ${n}">${h(e.difficulty||"中等")}</span>
        <span style="font-size:12px;color:#999">⏱ ${e.cook_time||20}分钟</span>
        <span class="prof-badge ${t.cls}" onclick="event.stopPropagation();App.adjustCount('${e.id}')">${t.emoji} ${t.level}</span>
        ${(e.tags||[]).slice(0,2).map(c=>`<span class="tag">${h(c)}</span>`).join("")}
      </div>
    </div>
  </div>`}function h(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Se(){var o,a;const e=[...i.recipes,...i.customRecipes],t=e.filter(c=>{var r;return i.favorites.has(c.id)||(((r=i.cookedMap[c.id])==null?void 0:r.count)||0)>0}).sort((c,r)=>{var l,m;return(((l=i.cookedMap[r.id])==null?void 0:l.count)||0)-(((m=i.cookedMap[c.id])==null?void 0:m.count)||0)}).slice(0,5);t.length===0&&t.push(...e.slice(0,3));const n=e.filter(c=>c.difficulty==="中等").sort(()=>Math.random()-.5).slice(0,3),s=e.filter(c=>c.user_id).slice(0,4);return`
    <div class="top-bar">
      <span class="brand">🍳 RecipeMate</span>
      <span class="user" onclick="App.showSettings()">👤 ${((a=(o=i.session)==null?void 0:o.user)==null?void 0:a.email)||""} ›</span>
    </div>
    <div class="hero">
      <h1>今天吃什么？</h1>
      <p>${e.length} 道菜谱 · ${i.favorites.size} 收藏 · ${Object.keys(i.cookedMap).length} 做过</p>
      <button class="btn btn-outline btn-sm"
        style="margin-top:12px;color:#fff;border-color:rgba(255,255,255,.5);flex:none"
        onclick="App.showTodayEat()">🎲 今天吃什么</button>
    </div>
    ${t.length>0?`
    <div style="padding:12px 16px 0">
      <div class="section-title" style="margin-top:0">🌟 你常做的</div>
      <div style="display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch">
        ${t.map(c=>{var r;return`
          <div class="recipe-card" style="min-width:200px;max-width:200px;flex-shrink:0" onclick="App.showDetail('${c.id}',false)">
            ${c.image_url?`<img class="card-img" src="${c.image_url}" alt="${H(c.title)}" loading="lazy" style="height:120px">`:""}
            <div class="card-body">
              <div class="card-title" style="font-size:15px">${H(c.title)}</div>
              <div class="card-meta"><span style="font-size:11px;color:#999">👨‍🍳 ${((r=i.cookedMap[c.id])==null?void 0:r.count)||0}次</span></div>
            </div>
          </div>`}).join("")}
      </div>
    </div>`:""}
    ${n.length>0?`
    <div style="padding:8px 16px 0">
      <div class="section-title">🌸 换个口味试试</div>
      ${n.map(c=>O(c)).join("")}
    </div>`:""}
    ${s.length>0?`
    <div style="padding:8px 16px 0">
      <div class="section-title">🆕 最近自建</div>
      ${s.map(c=>O(c)).join("")}
    </div>`:""}
    <div style="text-align:center;padding:10px;margin-bottom:80px">
      <button class="btn btn-outline btn-sm" onclick="App.navTo('recipes')" style="flex:none;padding:10px 30px">📖 浏览全部菜谱</button>
    </div>
    ${Te()}`}function Te(e){return`<div class="nav">
    <button class="active" onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
    <button class="" onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
    <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
    <button class="" onclick="App.navTo('shop')"><span class="ico">🛒</span>清单</button>
  </div>`}function Ee(){const e=`<div class="modal-overlay" id="todayEatModal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <h3>🎲 今天吃什么？</h3>
      <p style="font-size:12px;color:#999;text-align:center;margin-bottom:16px">选择你的偏好，我来推荐</p>

      <label class="form-label">用餐人数</label>
      <select id="teServings" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD;margin-bottom:12px;font-size:14px">
        <option value="1">1人</option>
        <option value="2" selected>2人</option>
        <option value="3">3人</option>
        <option value="4">4人+</option>
      </select>

      <label class="form-label">忌口 / 过敏</label>
      <input id="teAvoid" placeholder="例如：海鲜、花生、牛奶（可留空）" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD;margin-bottom:12px;font-size:14px">

      <label class="form-label">想吃类型（可多选）</label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px" id="teTypes">
        ${["家常菜","快手菜","下饭菜","减脂","早餐","晚餐","川菜","素菜","荤菜","汤与粥"].map(t=>`
          <span class="filter-chip te-chip" data-tag="${t}" onclick="App.toggleTodayTag(this)">${t}</span>
        `).join("")}
      </div>

      <label class="form-label">或让 AI 推荐</label>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="App.doTodayRecommend(true)" style="flex:1">🤖 AI 智能推荐</button>
        <button class="btn btn-outline" onclick="App.doTodayRecommend(false)" style="flex:1">📖 从菜谱库挑选</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:8px;color:#999" onclick="document.getElementById('todayEatModal').remove()">取消</button>
    </div>
  </div>`;document.body.insertAdjacentHTML("beforeend",e)}function H(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function De(){var o,a,c;const e=(((o=document.getElementById("searchInput"))==null?void 0:o.value)||"").trim().toLowerCase(),t=[...i.recipes,...i.customRecipes];let n;i.currentView==="favorites"?n=t.filter(r=>i.favorites.has(r.id)):n=t,(i.currentFilter==="简单"||i.currentFilter==="中等"||i.currentFilter==="困难")&&(n=n.filter(r=>r.difficulty===i.currentFilter)),i.currentFilter==="faved"&&(n=n.filter(r=>i.favorites.has(r.id))),i.currentFilter==="master"&&(n=n.filter(r=>{var l;return(((l=i.proficiency[r.id])==null?void 0:l.level)||"新手")==="大师"})),e&&(n=n.filter(r=>r.title.toLowerCase().includes(e)||(r.tags||[]).some(l=>l.toLowerCase().includes(e))||(r.ingredients||[]).some(l=>(typeof l=="string"?l:l.name||"").toLowerCase().includes(e))));const s=i.currentView==="favorites"?"❤️ 收藏":"📖 我的菜谱";return`
    <div class="top-bar">
      <span class="brand">🍳 RecipeMate</span>
      <span class="user" onclick="App.showSettings()">👤 ${((c=(a=i.session)==null?void 0:a.user)==null?void 0:c.email)||""} ›</span>
    </div>
    <div class="search-row">
      <span class="sicon">🔍</span>
      <input id="searchInput" placeholder="搜索菜名、食材..." value="${h(e||"")}" oninput="App.render()">
      ${e?`<span class="sclear" onclick="document.getElementById('searchInput').value='';App.render()">✕</span>`:""}
    </div>
    <div class="row-btns">
      <button class="act-btn primary" onclick="App.createRecipe()">➕ 自建菜谱</button>
      <button class="act-btn" onclick="App.apiSearch()">🌐 在线海量搜索</button>
    </div>
    <div class="filter-row">
      ${Z.map(r=>`<span class="filter-chip${i.currentFilter===r.key?" active":""}" onclick="App.setFilter('${r.key}')">${r.label}</span>`).join("")}
    </div>
    <div class="content">
      <div style="font-size:13px;color:#999;margin-bottom:10px">${s} · ${n.length} 道</div>
      ${n.length===0?`<div class="empty">${i.currentView==="favorites"?"还没有收藏 😢":"没有找到匹配的菜"}</div>`:n.map(r=>O(r)).join("")}
    </div>
    ${Ce(i.currentView)}`}function Ce(e){return`<div class="nav">
    <button onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
    <button class="${e==="recipes"||e==="favorites"?"active":""}" onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
    <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
    <button class="${e==="shop"?"active":""}" onclick="App.navTo('shop')"><span class="ico">🛒</span>清单</button>
  </div>`}function x(e,t){i.savedScrollY=window.scrollY,i.currentDetailId=e,i.currentDetailIsApi=!!t,i.parentView||(i.parentView=i.currentView);let n=[...i.recipes,...i.customRecipes].find(d=>d.id===e);if(!n&&t&&i.apiDetailCache[e]&&(n=i.apiDetailCache[e]),!n)return;const s=i.proficiency[e]||z(0),o=n.difficulty==="简单"?"badge-easy":n.difficulty==="中等"?"badge-medium":"badge-hard",a=i.cookedMap[e],c=a?a.count:0,r=a?a.last:null,l=Array.isArray(n.ingredients)?n.ingredients:typeof n.ingredients=="string"?JSON.parse(n.ingredients):[],m=Array.isArray(n.steps)?n.steps:typeof n.steps=="string"?JSON.parse(n.steps):[],g=i.journals.filter(d=>d.recipe_id===e),v=n.tags||[];let p="";n.source==="projkitchen"?p="🥘 ProjKitchen":n.source==="themealdb"?p="🌐 TheMealDB":n.isApi&&(p="🌐 在线");const b=i.customRecipes.some(d=>d.id===e);document.getElementById("app").innerHTML=`
    <div class="content">
      <div class="back-btn" onclick="App.goBack()">‹ 返回</div>
      ${n.image_url?`<img class="detail-img" src="${n.image_url}" alt="${h(n.title)}" loading="lazy">`:""}
      <div class="detail-title">${h(n.title)}
        ${p?`<span style="font-size:11px;color:#999;margin-left:8px;font-weight:400">${p}</span>`:""}
      </div>
      <div class="detail-desc">${h(n.description||"")}</div>
      <div class="detail-meta">
        <span class="badge ${o}">${h(n.difficulty||"中等")}</span>
        <span style="font-size:13px;color:#999">⏱ ${n.cook_time||20} 分钟</span>
        <span class="prof-badge ${s.cls}" onclick="App.adjustCount('${e}')">${s.emoji} ${s.level}（${c}次）</span>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">${v.map(d=>`<span class="tag">${h(d)}</span>`).join("")}</div>
      <div class="section-title">🥬 食材</div>
      <div class="ing-chips">
        ${l.length?l.map(d=>`<span class="ing-chip">${typeof d=="string"?h(d):`${h(d.name)}${d.amount?" — "+h(d.amount):""}`}</span>`).join(""):'<span style="color:#999">暂无食材信息</span>'}
      </div>
      <div class="section-title">📝 步骤</div>
      ${m.length?m.map(d=>{const w=typeof d=="string"?d:d.detail||d.text||"",_=typeof d=="string"?d:d.text||"";return`<div class="step-item">
          <span class="step-num">${d.num||""}</span>
          <div>
            <div class="step-text">${h(_)}</div>
            ${w!==_?`<div class="step-detail">${h(w)}</div>`:""}
          </div>
        </div>`}).join(""):'<div class="empty" style="padding:20px">暂无步骤信息</div>'}
      <div class="cooked-stats">
        累计 <b>${c}</b> 次 · <b>${s.emoji} ${s.level}</b>
        <span class="prof-adjust">
          <button onclick="App.decreaseCooked('${e}')">−</button>
          <button onclick="App.incrementCooked('${e}')">+</button>
        </span>
        ${r?`· 最近：${new Date(r).toLocaleDateString()}`:""}
      </div>
      ${t?`
      <div class="action-row">
        <button class="btn ${i.favorites.has(e)?"btn-primary":"btn-outline"}" onclick="App.favClick('${e}')">${i.favorites.has(e)?"❤️ 已收藏":"🤍 收藏"}</button>
      </div>
      <button class="btn btn-outline btn-block" style="margin-top:4px;border-color:#4CAF50;color:#4CAF50" onclick="App.aiSaveRecipe('${e}')">🤖 AI 重构并保存到我的菜谱</button>
      `:`
      <div class="action-row">
        <button class="btn ${i.favorites.has(e)?"btn-primary":"btn-outline"}" onclick="App.favClick('${e}')">${i.favorites.has(e)?"❤️ 已收藏":"🤍 收藏"}</button>
        <button class="btn btn-green" onclick="App.cookWithJournal('${e}')">📸 打卡（拍照+心得）</button>
      </div>
      <button class="btn btn-outline btn-block" onclick="App.shopClick('${e}')">🛒 加入购物清单</button>
      <button class="btn btn-outline btn-block" style="margin-top:4px;border-color:#4CAF50;color:#4CAF50" onclick="App.editCustomRecipe('${e}')">✏️ ${b?"编辑菜谱":"编辑 / 保存到我的菜谱"}</button>
      ${b?`<button class="btn btn-outline btn-block" style="margin-top:4px;border-color:#F44336;color:#F44336" onclick="App.deleteCustomRecipe('${e}')">🗑 删除菜谱</button>`:""}
      <div class="section-title">📸 打卡记录（${g.length}次）</div>
      ${g.length===0?'<div class="empty" style="padding:20px">还没有打卡记录<br>做完菜点上面按钮拍照记录吧~</div>':""}
      ${g.map(d=>`
        <div class="journal-entry">
          <div class="j-date">🕐 ${new Date(d.cooked_at).toLocaleString()}</div>
          ${d.photo_url?`<img src="${d.photo_url}" alt="成品照" loading="lazy">`:""}
          ${d.notes?`<div class="j-notes">💬 ${h(d.notes)}</div>`:""}
        </div>`).join("")}
      `}
    </div>`,window.scrollTo(0,0)}function Be(e){return`<div class="modal-overlay" id="cookModal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <h3>📸 记录这一次烹饪</h3>
      <div class="upload-area" id="cookUpload"><p>📷 点击上传成品照（可选）</p><input type="file" accept="image/*" id="cookPhoto" style="display:none" onchange="App.previewCookPhoto()"></div>
      <img id="cookPreview" class="preview-img" style="display:none">
      <label class="form-label">笔记（可选）</label>
      <textarea id="cookNotes" rows="3" placeholder="今天做得怎么样？有什么心得？"></textarea>
      <button class="btn btn-green btn-block" onclick="App.confirmCook('${e}')" style="margin-top:12px">✅ 确认记录</button>
      <button class="btn btn-outline btn-block" onclick="App.quickCook('${e}')" style="margin-top:4px">跳过，直接计数</button>
    </div>
  </div>`}function je(){var e,t;return`
    <div class="top-bar">
      <span class="brand">🛒 购物清单</span>
      <span class="user" onclick="App.showSettings()">👤 ${((t=(e=i.session)==null?void 0:e.user)==null?void 0:t.email)||""} ›</span>
    </div>
    <div class="content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <span style="font-size:14px;color:#999">${i.shopItems.length} 种食材</span>
        ${i.shopItems.length>0?'<span style="color:#F44336;font-size:13px;cursor:pointer" onclick="App.clearShop()">清空全部</span>':""}
      </div>
      ${i.shopItems.length===0?'<div class="empty">购物清单是空的 🛒</div>':""}
      ${i.shopItems.map(n=>`
        <div class="shop-item">
          <div class="shop-check ${n.checked?"checked":""}" onclick="App.toggleShop('${n.id}')"></div>
          <span class="shop-name ${n.checked?"done":""}">${Me(n.name)}</span>
          <span class="shop-del" onclick="App.removeShop('${n.id}')">🗑</span>
        </div>
      `).join("")}
    </div>
    <div class="nav">
      <button onclick="App.navTo('home')"><span class="ico">🏠</span>首页</button>
      <button onclick="App.navTo('recipes')"><span class="ico">📖</span>菜谱</button>
      <button onclick="App.navTo('favorites')" style="font-size:11px"><span class="ico">❤️</span>收藏</button>
      <button class="active"><span class="ico">🛒</span>清单</button>
    </div>`}function Me(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function Pe(){document.querySelectorAll(".modal-overlay").forEach(r=>r.remove());const e=j(),t=M(),n=P(),s=R(),o=t&&t.length>0;let a="";for(const[r,l]of Object.entries(B))a+=`<option value="${r}" ${e===r?"selected":""}>${l.name}</option>`;const c=`<div class="modal-overlay" id="settingsModal" onclick="if(event.target===this)this.remove()">
    <div class="modal-sheet">
      <h3>⚙️ 设置</h3>

      <div class="settings-group">
        <label>AI 提供商</label>
        <select id="aiProvider" onchange="App.updateSetForm()">${a}</select>
      </div>

      <div class="settings-group">
        <label>API 地址</label>
        <input id="aiUrl" value="${E(n)}" placeholder="https://api.xxx.com/v1/chat/completions">
      </div>

      <div class="settings-group">
        <label>模型名</label>
        <input id="aiModel" value="${E(s)}" placeholder="model-name">
      </div>

      <div class="settings-group">
        <label>API Key ${o?'<span style="color:#4CAF50;font-size:11px">✅ 已设置</span>':'<span style="color:#F44336;font-size:11px">⚠️ 未设置</span>'}</label>
        <input id="apiKeyInput" type="password" value="${E(t)}" placeholder="sk-...">
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
  </div>`;document.body.insertAdjacentHTML("beforeend",c)}function Re(){const e=document.getElementById("aiProvider");if(!e)return;const t=B[e.value];if(!t)return;const n=document.getElementById("aiUrl"),s=document.getElementById("aiModel");n&&(n.value=t.url),s&&(s.value=t.model)}async function Fe(){const e=document.getElementById("testResult");e&&(e.style.display="block",e.className="test-result",e.textContent="⏳ 正在测试连接...");const t=await ne();if(e)if(e.className="test-result "+(t.ok?"test-ok":"test-fail"),t.ok)e.innerHTML="✅ "+t.message;else{let n=t.error;t.detail&&(n+=`<br><small>提供商: ${E(t.detail.provider)}</small>`,n+=`<br><small>地址: ${E(t.detail.url)}</small>`,n+=`<br><small>模型: ${E(t.detail.model)}</small>`,n+='<br><small style="color:#999">（Key 未显示，请检查是否正确设置）</small>'),e.innerHTML="❌ "+t.error+"<br>"+n}}function E(e){return String(e).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function y(){const e=document.getElementById("app");if(e){if(document.querySelectorAll("#cookModal").forEach(t=>t.remove()),!i.session){e.innerHTML=_e();return}if(!(i.currentView==="detail"||i.currentView==="customForm")){if(i.currentView==="shop"){e.innerHTML=je();return}if(i.currentView==="home"){e.innerHTML=Se();return}e.innerHTML=De()}}}function Le(e){i.currentView=e,i.currentFilter="all",i.currentDetailId=null,i.parentView=null;const t=document.getElementById("searchInput");t&&(t.value=""),y()}function Oe(e){i.currentFilter=e,y()}function ze(){i.currentDetailId=null,i.currentView=i.parentView||"recipes",i.parentView=null,y(),requestAnimationFrame(()=>window.scrollTo({top:i.savedScrollY||0,behavior:"instant"}))}async function Ve(e){await be(e),i.currentDetailId?x(i.currentDetailId,i.currentDetailIsApi||!1):(i.currentView,y())}async function Ne(e){const t=S(e);t&&await $e(t)}async function qe(e){await Ie(e),y()}async function Ke(e){await Ae(e),y()}async function He(){confirm("确定清空？")&&(await xe(),y())}function Ue(e){document.body.insertAdjacentHTML("beforeend",Be(e));const t=document.getElementById("cookUpload");t&&(t.onclick=()=>document.getElementById("cookPhoto").click())}function Je(){const e=document.getElementById("cookPhoto").files[0];if(!e)return;i.cookPhotoFile=e;const t=new FileReader;t.onload=n=>{const s=document.getElementById("cookPreview");s&&(s.src=n.target.result,s.style.display="block")},t.readAsDataURL(e)}async function Ye(e){var n;(n=document.getElementById("cookModal"))==null||n.remove(),await q(e,null,null);const t=S(e);t&&x(e,t.isApi||!1)}async function We(e){var a;const t=document.getElementById("cookNotes"),n=t?t.value.trim():"";let s=null;i.cookPhotoFile&&(s=await N(i.cookPhotoFile)),(a=document.getElementById("cookModal"))==null||a.remove(),await q(e,s,n||null);const o=S(e);o&&x(e,o.isApi||!1)}function Xe(e){const t=S(e);t&&x(e,t.isApi||!1)}async function Ge(e){await ke(e);const t=S(e);t&&x(e,t.isApi||!1)}async function Ze(e){await we(e);const t=S(e);t&&x(e,t.isApi||!1)}function Qe(){i.authMode=i.authMode==="signup"?"login":"signup",y()}async function et(){var o,a,c;const e=(a=(o=document.getElementById("authEmail"))==null?void 0:o.value)==null?void 0:a.trim(),t=(c=document.getElementById("authPass"))==null?void 0:c.value;if(!e||!t){u("请填写邮箱和密码");return}const n=i.authMode!=="signup";await ge(e,t,n)&&(await F(),i.currentView="home",u("✅ 登录成功")),y()}async function tt(){var c,r;const e=(r=(c=document.getElementById("searchInput"))==null?void 0:c.value)==null?void 0:r.trim();if(!e){u("请先在搜索框输入关键词");return}const t=document.getElementById("app");t.innerHTML=`<div class="content">
    <div class="back-btn" onclick="App.navTo('recipes')">‹ 返回</div>
    <div class="section-title">🌐 搜索: "${k(e)}"</div>
    <div class="loading">🔍 正在搜索中文菜谱库...</div>
  </div>`;const{results:n,source:s}=await me(e);if(n.length===0){t.innerHTML=`<div class="content">
      <div class="back-btn" onclick="App.navTo('recipes')">‹ 返回</div>
      <div class="section-title">🌐 搜索: "${k(e)}"</div>
      <div class="empty">没有找到 😢<br>试试其他关键词，或到设置里配置 AI Key 后使用 AI 智能搜索</div>
    </div>`;return}i.apiResults=n;const o=s==="projkitchen"?"🥘 ProjKitchen（中文菜谱）":"🌐 TheMealDB（英文菜谱）";let a=`<div class="content">
    <div class="back-btn" onclick="App.navTo('recipes')">‹ 返回</div>
    <div class="section-title">${o}: "${k(e)}" · ${n.length} 个</div>`;n.forEach(l=>{a+=`<div class="recipe-card" onclick="App.showApiDetail('${l.id}')">
      ${l.image_url?`<img class="card-img" src="${l.image_url}" loading="lazy">`:""}
      <div class="api-badge">${o}</div>
      <div class="card-body">
        <div class="card-row"><span class="card-title">${k(l.title)}</span></div>
        <div class="card-desc">${k(l.description||"")}</div>
        <div class="card-meta">
          <span class="badge ${l.difficulty==="简单"?"badge-easy":l.difficulty==="困难"?"badge-hard":"badge-medium"}">${k(l.difficulty||"中等")}</span>
          <span style="font-size:12px;color:#999">⏱ ${l.cook_time||20}分钟</span>
          ${(l.tags||[]).slice(0,2).map(m=>`<span class="tag">${k(m)}</span>`).join("")}
        </div>
      </div>
    </div>`}),a+="</div>",t.innerHTML=a}function it(e){const t=(i.apiResults||[]).find(n=>n.id===e);t&&(i.currentDetailId=e,i.currentDetailIsApi=!0,i.parentView||(i.parentView=i.currentView),i.apiDetailCache[e]=t,i.recipes.push({...t,id:e,isApi:!0}),x(e,!0),i.recipes.pop())}async function nt(e){const t=i.apiDetailCache[e]||S(e);if(!t){u("❌ 菜谱数据丢失，请重新搜索");return}u("🤖 AI 正在重构菜谱（约15秒）...");const n=await U(t),s=n||{title:t.title,desc:t.description||"",diff:t.difficulty||"中等",time:t.cook_time||30,img:t.image_url||null,ing:t.ingredients||[],steps:t.steps||[],tags:t.tags||[]};n||u("⚠️ AI 未响应，保存原始菜谱（可后续手动编辑）"),await V(s,null),i.currentView="recipes",y()}function st(){i.currentView="customForm",i.formDirty=!1,i.recipeImgFile=null,document.getElementById("app").innerHTML=`
    <div class="content">
      <div class="back-btn" onclick="App.customBack()">‹ 返回</div>
      <div class="section-title" style="font-size:20px">➕ 创建自定义菜谱</div>
      <div class="auth-box" style="max-width:100%;margin:12px 0;box-shadow:none">
        <div class="upload-area" id="recipeImgUpload"><p>📷 点击上传菜品图片</p><input type="file" accept="image/*" id="recipeImg" style="display:none" onchange="App.previewRecipeImg()"></div>
        <img id="recipeImgPreview" class="preview-img" style="display:none">
        <label class="form-label">菜名 *</label><input id="rTitle" placeholder="例如：糖醋排骨">
        <label class="form-label">简介</label><input id="rDesc" placeholder="简单描述一下这道菜...">
        <div class="form-row">
          <div><label class="form-label">难度</label><select id="rDiff" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD"><option>简单</option><option selected>中等</option><option>困难</option></select></div>
          <div><label class="form-label">耗时(分钟)</label><input id="rTime" type="number" value="20" min="1"></div>
        </div>
        <label class="form-label">食材（一行一个，格式：食材名 — 用量）</label><textarea id="rIng" rows="4" placeholder="番茄 — 中等大小 2 个&#10;鸡蛋 — 3 个&#10;盐 — 小半勺"></textarea>
        <label class="form-label">步骤（一行一个）</label><textarea id="rSteps" rows="5" placeholder="1. 处理食材：番茄洗净切块&#10;2. 热锅倒油，大火烧热&#10;3. 下番茄翻炒2分钟至出汁"></textarea>
        <label class="form-label">标签（逗号分隔）</label><input id="rTags" placeholder="家常菜,快手菜,下饭菜">
        <button class="btn btn-primary btn-block" onclick="App.submitCustom()" style="margin-top:12px">💾 保存菜谱</button>
      </div>
    </div>`;const e=document.getElementById("recipeImgUpload");e&&(e.onclick=()=>document.getElementById("recipeImg").click()),document.querySelectorAll("#rTitle,#rDesc,#rIng,#rSteps,#rTags").forEach(s=>{s.oninput=()=>{i.formDirty=!0}});const t=document.getElementById("rDiff"),n=document.getElementById("rTime");t&&(t.onchange=()=>{i.formDirty=!0}),n&&(n.oninput=()=>{i.formDirty=!0})}function ot(){const e=document.getElementById("recipeImg").files[0];if(!e)return;i.recipeImgFile=e;const t=new FileReader;t.onload=n=>{const s=document.getElementById("recipeImgPreview");s&&(s.src=n.target.result,s.style.display="block")},t.readAsDataURL(e)}function at(){if(i.formDirty){if(confirm("有未保存的内容，是否保存？")){X();return}else if(!confirm("确定放弃修改吗？"))return}i.formDirty=!1,i.recipeImgFile=null,i.currentView="recipes",y()}async function X(){var r,l,m,g,v,p,b,d,w,_,D;const e=(l=(r=document.getElementById("rTitle"))==null?void 0:r.value)==null?void 0:l.trim();if(!e){u("请输入菜名");return}let t=null;i.recipeImgFile&&(t=await N(i.recipeImgFile));const n=((g=(m=document.getElementById("rIng"))==null?void 0:m.value)==null?void 0:g.trim())||"",s=n?n.split(`
`).filter(Boolean).map(I=>{const[$,...A]=I.split("—");return{name:($||I).trim(),amount:A.join("—").trim()}}):[],o=((p=(v=document.getElementById("rSteps"))==null?void 0:v.value)==null?void 0:p.trim())||"",a=o?o.split(`
`).filter(Boolean).map((I,$)=>{const A=I.match(/^(\d+)\.?\s*(.+)/);return{num:A?parseInt(A[1]):$+1,text:A?A[2]:I,detail:""}}):[],c=(((b=document.getElementById("rTags"))==null?void 0:b.value)||"").split(/[,，]/).map(I=>I.trim()).filter(Boolean);await V({title:e,desc:((w=(d=document.getElementById("rDesc"))==null?void 0:d.value)==null?void 0:w.trim())||"",diff:((_=document.getElementById("rDiff"))==null?void 0:_.value)||"中等",time:((D=document.getElementById("rTime"))==null?void 0:D.value)||"20",img:t,ing:s,steps:a,tags:c}),i.formDirty=!1,i.recipeImgFile=null,i.currentView="recipes",y()}async function lt(e){let t=i.customRecipes.find(l=>l.id===e)||i.recipes.find(l=>l.id===e);if(!t||t.isApi&&!i.customRecipes.some(l=>l.id===e)){const l=i.apiDetailCache[e];l&&(t=l)}if(!t){u("❌ 菜谱数据丢失，请重新搜索");return}const n=i.customRecipes.some(l=>l.id===e);if(!n||t.isApi){const l=t.ingredients||[],m=t.steps||[];let g={title:t.title,desc:t.description||"",diff:t.difficulty||"中等",time:t.cook_time||30,img:t.image_url,ing:l,steps:m,tags:t.tags||[]};if(t.isApi){const p=await U(t);p&&(g={title:p.title,desc:p.description||"",diff:p.difficulty||"中等",time:p.cook_time||30,img:p.image_url,ing:p.ingredients,steps:p.steps,tags:p.tags})}const v=!n&&!t.isApi?t.id:null;await V(g,v);return}const s=(t.ingredients||[]).map(l=>typeof l=="string"?l:`${l.name} — ${l.amount||""}`).join(`
`),o=(t.steps||[]).map(l=>`${l.num}. ${l.text||l}`).join(`
`);i.currentView="customForm",i.formDirty=!1,document.getElementById("app").innerHTML=`
    <div class="content">
      <div class="back-btn" onclick="App.customBack()">‹ 返回</div>
      <div class="section-title" style="font-size:20px">✏️ 编辑菜谱</div>
      <div class="auth-box" style="max-width:100%;margin:12px 0;box-shadow:none">
        <div class="upload-area" id="recipeImgUpload">
          <p>📷 更换图片</p>
          ${t.image_url?`<img src="${t.image_url}" style="max-width:100%;max-height:120px;border-radius:8px;margin-top:8px">`:""}
          <input type="file" accept="image/*" id="recipeImg" style="display:none" onchange="App.previewRecipeImg()">
        </div>
        <img id="recipeImgPreview" class="preview-img" style="display:none">
        <label class="form-label">菜名 *</label>
        <input id="rTitle" value="${k(t.title)}">
        <label class="form-label">简介</label>
        <input id="rDesc" value="${k(t.description||"")}">
        <div class="form-row">
          <div>
            <label class="form-label">难度</label>
            <select id="rDiff" style="width:100%;padding:12px;border-radius:12px;border:1px solid #DDD">
              <option ${t.difficulty==="简单"?"selected":""}>简单</option>
              <option ${t.difficulty==="中等"?"selected":""}>中等</option>
              <option ${t.difficulty==="困难"?"selected":""}>困难</option>
            </select>
          </div>
          <div>
            <label class="form-label">耗时(分钟)</label>
            <input id="rTime" type="number" value="${t.cook_time||20}" min="1">
          </div>
        </div>
        <label class="form-label">食材</label>
        <textarea id="rIng" rows="4">${k(s)}</textarea>
        <label class="form-label">步骤</label>
        <textarea id="rSteps" rows="5">${k(o)}</textarea>
        <label class="form-label">标签</label>
        <input id="rTags" value="${k((t.tags||[]).join(", "))}">
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary" onclick="App.updateCustom('${e}')">💾 保存修改</button>
          <button class="btn btn-outline" style="border-color:#F44336;color:#F44336" onclick="App.deleteCustom('${e}')">🗑 删除</button>
        </div>
      </div>
    </div>`;const a=document.getElementById("recipeImgUpload");a&&(a.onclick=()=>document.getElementById("recipeImg").click()),document.querySelectorAll("#rTitle,#rDesc,#rIng,#rSteps,#rTags").forEach(l=>{l.oninput=()=>{i.formDirty=!0}});const c=document.getElementById("rDiff"),r=document.getElementById("rTime");c&&(c.onchange=()=>{i.formDirty=!0}),r&&(r.oninput=()=>{i.formDirty=!0})}async function ct(e){var l,m,g,v,p,b,d,w,_,D,I;const t=(m=(l=document.getElementById("rTitle"))==null?void 0:l.value)==null?void 0:m.trim();if(!t){u("请输入菜名");return}let n=(i.customRecipes.find($=>$.id===e)||{}).image_url||null;i.recipeImgFile&&(n=await N(i.recipeImgFile));const s=((v=(g=document.getElementById("rIng"))==null?void 0:g.value)==null?void 0:v.trim())||"",o=s?s.split(`
`).filter(Boolean).map($=>{const[A,...T]=$.split("—");return{name:(A||$).trim(),amount:T.join("—").trim()}}):[],a=((b=(p=document.getElementById("rSteps"))==null?void 0:p.value)==null?void 0:b.trim())||"",c=a?a.split(`
`).filter(Boolean).map(($,A)=>{const T=$.match(/^(\d+)\.?\s*(.+)/);return{num:T?parseInt(T[1]):A+1,text:T?T[2]:$,detail:""}}):[],r=(((d=document.getElementById("rTags"))==null?void 0:d.value)||"").split(/[,，]/).map($=>$.trim()).filter(Boolean);await he(e,{title:t,description:((_=(w=document.getElementById("rDesc"))==null?void 0:w.value)==null?void 0:_.trim())||"",difficulty:((D=document.getElementById("rDiff"))==null?void 0:D.value)||"中等",cook_time:parseInt((I=document.getElementById("rTime"))==null?void 0:I.value)||20,image_url:n,ingredients:o,steps:c,tags:r}),i.formDirty=!1,i.recipeImgFile=null,i.currentView="recipes",y()}async function rt(e){confirm("确定删除这条菜谱？此操作不可撤销。")&&(await W(e),i.currentView="recipes",y())}async function dt(e){confirm("确定删除这条菜谱？打卡记录会保留。")&&(await W(e),i.currentDetailId=null,i.currentView="recipes",y())}function pt(){Ee()}async function ut(e){var l,m,g,v;const t=[];document.querySelectorAll(".te-chip.selected").forEach(p=>{t.push(p.dataset.tag)});const n=((l=document.getElementById("teServings"))==null?void 0:l.value)||"2",s=((g=(m=document.getElementById("teAvoid"))==null?void 0:m.value)==null?void 0:g.trim())||"";(v=document.getElementById("todayEatModal"))==null||v.remove();const o=document.getElementById("app");o.innerHTML=`<div class="content">
    <div class="back-btn" onclick="App.navTo('home')">‹ 返回首页</div>
    <div class="section-title">🎲 今天吃什么？</div>
    <div class="loading">${e?"🤖 AI 正在为你推荐...":"📖 正在从菜谱库挑选..."}</div>
  </div>`;let a=[];if(e){const p=`${n}人份，${t.length?"想吃"+t.join("、"):"不限类型"}，${s?"忌口："+s:"无忌口"}`,b=await ae(p);if(b&&b.length>0)a=b.map((d,w)=>({id:"ai_rec_"+Date.now()+"_"+w,title:d.title||d.菜名||"",description:d.reason||d.推荐理由||"",difficulty:d.difficulty||d.难度||"中等",cook_time:d.cook_time||d.耗时||30,image_url:null,ingredients:[],steps:[],tags:d.tags||d.标签||[],isApi:!0,isAi:!0,source:"ai_recommend"}));else{const d=t.length>0?t:["家常菜","快手菜"];a=await K(d),a=a.slice(0,3)}}else{const p=t.length>0?t:["家常菜"];a=await K(p),a=a.slice(0,3)}i.todayResults=a,i.apiResults=a,a.forEach(p=>{i.apiDetailCache[p.id]=p});const c=e?"🤖 AI 推荐":"📖 菜谱库挑选";let r=`<div class="content">
    <div class="back-btn" onclick="App.navTo('home')">‹ 返回首页</div>
    <div class="section-title">${c} · ${a.length} 道</div>`;a.length===0&&(r+='<div class="empty">暂时没有符合条件的菜谱 😢<br>试试调整偏好或使用 AI 推荐</div>'),a.forEach(p=>{const b=p.difficulty==="简单"?"badge-easy":p.difficulty==="困难"?"badge-hard":"badge-medium";r+=`<div class="recipe-card" onclick="App.showTodayDetail('${p.id}')">
      ${p.image_url?`<img class="card-img" src="${p.image_url}" loading="lazy">`:""}
      <div class="api-badge">${c}</div>
      <div class="card-body">
        <div class="card-row"><span class="card-title">${k(p.title)}</span></div>
        <div class="card-desc">${k(p.description||"")}</div>
        <div class="card-meta">
          <span class="badge ${b}">${k(p.difficulty||"中等")}</span>
          <span style="font-size:12px;color:#999">⏱ ${p.cook_time||20}分钟</span>
          ${(p.tags||[]).slice(0,2).map(d=>`<span class="tag">${k(d)}</span>`).join("")}
        </div>
      </div>
    </div>`}),r+="</div>",o.innerHTML=r}function mt(e){const t=(i.todayResults||i.apiResults||[]).find(n=>n.id===e);t&&(i.currentDetailId=e,i.currentDetailIsApi=!0,i.parentView||(i.parentView=i.currentView),i.apiDetailCache[e]=t,i.recipes.push({...t,id:e,isApi:!0}),x(e,!0),i.recipes.pop())}function ft(e){e.classList.toggle("selected")}function gt(){var o;const e=document.getElementById("aiProvider"),t=document.getElementById("aiUrl"),n=document.getElementById("aiModel"),s=document.getElementById("apiKeyInput");if(!e||!s){u("❌ 设置面板异常，请重新打开");return}Q(e.value,t.value,n.value,s.value),(o=document.getElementById("settingsModal"))==null||o.remove(),u("✅ 已保存，Key: "+(s.value?"已设置":"未设置"))}function k(e){return String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const vt={render:y,navTo:Le,setFilter:Oe,goBack:ze,doAuth:et,toggleAuth:Qe,handleLogout:ve,createRecipe:st,submitCustom:X,customBack:at,editCustomRecipe:lt,updateCustom:ct,deleteCustom:rt,deleteCustomRecipe:dt,previewRecipeImg:ot,showDetail:x,favClick:Ve,adjustCount:Xe,cookWithJournal:Ue,quickCook:Ye,confirmCook:We,previewCookPhoto:Je,incrementCooked:Ge,decreaseCooked:Ze,shopClick:Ne,toggleShop:qe,removeShop:Ke,clearShop:He,apiSearch:tt,showApiDetail:it,aiSaveRecipe:nt,showSettings:Pe,updateSetForm:Re,saveSettings:gt,testAI:Fe,showTodayEat:pt,doTodayRecommend:ut,showTodayDetail:mt,toggleTodayTag:ft};window.App=vt;async function yt(){await fe(),i.session&&await F(),y()}yt();
