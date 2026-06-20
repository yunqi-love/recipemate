// RecipeMate — Shopping Store
import { supabase } from '../services/supabaseClient.js';
import { state } from '../app.js';
import { toast } from '../components/toast.js';

export async function addToShoppingList(recipe) {
  for (const ing of recipe.ingredients) {
    const name = typeof ing === 'string' ? ing : ing.name;
    if (!name) continue;
    const exists = state.shopItems.find(s => s.name === name);
    if (exists) continue;

    const { data } = await supabase.from('shopping_items').insert({
      user_id: state.session.user.id,
      name,
      recipe_id: recipe.id
    }).select().single();

    if (data) state.shopItems.push(data);
  }
  toast('✅ 已加入清单');
}

export async function toggleShopItem(id) {
  const item = state.shopItems.find(s => s.id === id);
  if (!item) return;
  await supabase.from('shopping_items').update({ checked: !item.checked }).eq('id', id);
  item.checked = !item.checked;
}

export async function removeShopItem(id) {
  await supabase.from('shopping_items').delete().eq('id', id);
  state.shopItems = state.shopItems.filter(s => s.id !== id);
}

export async function clearShopItems() {
  await supabase.from('shopping_items').delete()
    .eq('user_id', state.session.user.id);
  state.shopItems = [];
}

export async function clearCheckedShopItems() {
  const checkedIds = state.shopItems.filter(s => s.checked).map(s => s.id);
  if (checkedIds.length === 0) {
    toast('没有已购买的食材');
    return;
  }

  for (const id of checkedIds) {
    await supabase.from('shopping_items').delete().eq('id', id);
  }
  state.shopItems = state.shopItems.filter(s => !s.checked);
  toast(`✅ 已清除 ${checkedIds.length} 件已购买食材`);
}

export function groupShoppingItemsByRecipe() {
  const groups = {};
  const allRecipes = [...state.recipes, ...state.customRecipes];

  for (const item of state.shopItems) {
    const recipe = allRecipes.find(r => r.id === item.recipe_id);
    const title = recipe ? recipe.title : '其他';
    if (!groups[title]) groups[title] = [];
    groups[title].push(item);
  }

  return groups;
}

export function groupShoppingItemsByIngredient() {
  const groups = {};
  const allRecipes = [...state.recipes, ...state.customRecipes];

  for (const item of state.shopItems) {
    const name = item.name;
    if (!groups[name]) groups[name] = { items: [], recipes: new Set() };
    groups[name].items.push(item);
    const recipe = allRecipes.find(r => r.id === item.recipe_id);
    if (recipe) groups[name].recipes.add(recipe.title);
  }

  return groups;
}

export function copyShoppingListText() {
  const groups = groupShoppingItemsByIngredient();
  let text = '🛒 购物清单\n\n';
  for (const [name, group] of Object.entries(groups)) {
    const recipes = [...group.recipes];
    text += `□ ${name}`;
    if (recipes.length > 0) text += `（${recipes.join('、')}）`;
    text += '\n';
  }
  if (!Object.keys(groups).length) text += '（空）\n';
  navigator.clipboard.writeText(text).then(() => {
    toast('📋 已复制购物清单');
  }).catch(() => {
    toast('❌ 复制失败，请手动复制');
  });
  return text;
}
