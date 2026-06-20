// RecipeMate — Recipe Store
import { supabase } from '../services/supabaseClient.js';
import { state, updateProficiency } from '../app.js';
import { toast } from '../components/toast.js';

export async function loadAllData() {
  const [
    { data: r },
    { data: f },
    { data: c },
    { data: s },
    { data: cr },
    { data: j }
  ] = await Promise.all([
    supabase.from('recipes').select('*').order('id'),
    supabase.from('user_favorites').select('recipe_id'),
    supabase.from('user_cooked').select('*'),
    supabase.from('shopping_items').select('*').order('created_at'),
    supabase.from('custom_recipes').select('*').order('created_at', { ascending: false }),
    supabase.from('cooking_journal').select('*').order('cooked_at', { ascending: false })
  ]);

  state.recipes = r || [];
  state.customRecipes = cr || [];
  state.journals = j || [];

  // Custom recipes override built-in ones with same ID
  const overrideIds = new Set(state.customRecipes.map(x => x.id));
  state.recipes = state.recipes.filter(r => !overrideIds.has(r.id));

  state.favorites.clear();
  if (f) f.forEach(x => state.favorites.add(x.recipe_id));

  state.cookedMap = {};
  if (c) c.forEach(x => {
    state.cookedMap[x.recipe_id] = { count: x.count, last: x.last_cooked };
  });

  updateProficiency();
  state.shopItems = s || [];
}

export function getAllRecipes() {
  return [...state.recipes, ...state.customRecipes];
}

export function getRecipeById(id) {
  return getAllRecipes().find(x => x.id === id);
}

export async function saveCustomRecipe(data, overrideId) {
  const row = {
    user_id: state.session.user.id,
    title: data.title,
    description: data.desc || '',
    difficulty: data.diff || '中等',
    cook_time: parseInt(data.time) || 20,
    image_url: data.img || null,
    ingredients: data.ing || [],
    steps: data.steps || [],
    tags: data.tags || []
  };

  let r;
  if (overrideId) {
    const { data: d, error } = await supabase.from('custom_recipes')
      .upsert({ ...row, id: overrideId }, { onConflict: 'id' })
      .select().single();
    if (error) { toast('❌ 保存失败'); return null; }
    r = d;
    state.customRecipes = state.customRecipes.filter(x => x.id !== overrideId);
    state.customRecipes.unshift(r);
    toast('✅ 菜谱已更新');
  } else {
    const { data: d, error } = await supabase.from('custom_recipes')
      .insert(row).select().single();
    if (error) { toast('❌ 保存失败'); return null; }
    r = d;
    state.customRecipes.unshift(r);
    toast('✅ 菜谱已创建');
  }

  updateProficiency();
  return r;
}

export async function updateCustomRecipe(id, updates) {
  await supabase.from('custom_recipes').update(updates).eq('id', id);
  await loadAllData();
  toast('✅ 已更新');
}

export async function deleteCustomRecipe(id) {
  await supabase.from('custom_recipes').delete().eq('id', id);
  await loadAllData();
  toast('✅ 已删除');
}

export async function toggleFav(rid) {
  if (state.favorites.has(rid)) {
    await supabase.from('user_favorites').delete()
      .eq('recipe_id', rid).eq('user_id', state.session.user.id);
    state.favorites.delete(rid);
  } else {
    await supabase.from('user_favorites').insert({
      user_id: state.session.user.id,
      recipe_id: rid
    });
    state.favorites.add(rid);
  }
}

export async function uploadImage(file) {
  const ext = file.name.split('.').pop();
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage.from('recipe-images')
    .upload(name, file, { upsert: true });
  if (error) { toast('❌ 上传失败: ' + error.message); return null; }
  return supabase.storage.from('recipe-images')
    .getPublicUrl(data.path).data.publicUrl;
}
