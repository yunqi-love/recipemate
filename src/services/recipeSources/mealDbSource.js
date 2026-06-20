// RecipeMate — TheMealDB Source (Fallback only)
// Kept for backward compatibility, but no longer the primary data source.

const MEALDB = 'https://www.themealdb.com/api/json/v1/1';

const FOOD_TRANS = {
  '牛肉': 'beef', '鸡肉': 'chicken', '猪肉': 'pork', '羊肉': 'lamb',
  '虾': 'shrimp', '虾仁': 'shrimp', '鱼': 'fish', '三文鱼': 'salmon',
  '豆腐': 'tofu', '鸡蛋': 'egg', '番茄': 'tomato', '西红柿': 'tomato',
  '土豆': 'potato', '西兰花': 'broccoli', '胡萝卜': 'carrot', '茄子': 'eggplant',
  '青椒': 'pepper', '蘑菇': 'mushroom', '洋葱': 'onion', '蒜': 'garlic',
  '姜': 'ginger', '米饭': 'rice', '面': 'noodle', '面条': 'noodle',
  '意面': 'pasta', '意大利面': 'pasta', '面包': 'bread', '蛋糕': 'cake',
  '汤': 'soup', '沙拉': 'salad', '咖喱': 'curry', '海鲜': 'seafood',
  '奶酪': 'cheese', '巧克力': 'chocolate', '玉米': 'corn', '菠菜': 'spinach',
  '黄瓜': 'cucumber', '辣椒': 'chili', '鸭': 'duck', '牛排': 'steak',
  '汉堡': 'burger', '披萨': 'pizza', '寿司': 'sushi', '饺子': 'dumpling',
  '炒饭': 'fried rice', '炒面': 'chow mein', '春卷': 'spring roll',
  '排骨': 'ribs', '红烧肉': 'pork belly', '丸子': 'meatball',
  '香肠': 'sausage', '培根': 'bacon', '豆': 'bean', '扁豆': 'lentil',
  '白菜': 'cabbage', '生菜': 'lettuce', '芹菜': 'celery', '南瓜': 'pumpkin',
  '红薯': 'sweet potato', '火锅': 'hot pot', '粥': 'porridge',
};

function translateFood(kw) {
  kw = kw.toLowerCase().trim();
  for (const [cn, en] of Object.entries(FOOD_TRANS)) {
    if (kw.includes(cn)) return en;
  }
  return kw;
}

/**
 * Search TheMealDB (fallback only, not the default source).
 */
export async function searchMealDB(kw) {
  const en = translateFood(kw);
  let meals = [];

  // Strategy 1: search by name
  let res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(en)}`);
  let data = await res.json();
  if (data.meals) meals = [...data.meals];

  // Strategy 2: filter by main ingredient
  if (meals.length === 0) {
    res = await fetch(`${MEALDB}/filter.php?i=${encodeURIComponent(en)}`);
    data = await res.json();
    if (data.meals) meals = [...data.meals];
  }

  // Strategy 3: try original Chinese keyword
  if (meals.length === 0 && kw !== en) {
    res = await fetch(`${MEALDB}/search.php?s=${encodeURIComponent(kw)}`);
    data = await res.json();
    if (data.meals) meals = [...data.meals];
  }

  // Dedup
  const seen = new Set();
  meals = meals.filter(m => {
    if (seen.has(m.idMeal)) return false;
    seen.add(m.idMeal);
    return true;
  });

  return meals.map(m => ({
    id: 'api_' + m.idMeal,
    title: m.strMeal,
    description: (m.strArea || '') + ' · ' + (m.strCategory || ''),
    difficulty: '中等',
    cook_time: 30,
    image_url: m.strMealThumb + '/preview',
    ingredients: Array.from({ length: 20 }, (_, i) => m['strIngredient' + (i + 1)])
      .filter(Boolean)
      .map(n => ({ name: n, amount: '' })),
    steps: [{
      num: 1,
      text: (m.strInstructions || '').split('\r\n').filter(Boolean).join(' ') || '暂无步骤',
      detail: ''
    }],
    tags: [m.strCategory, m.strArea].filter(Boolean),
    isApi: true,
    source: 'themealdb',
    _orig: m
  }));
}
