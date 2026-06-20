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
