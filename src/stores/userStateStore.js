// RecipeMate — User State Store (cooking journal, proficiency)
import { supabase } from '../services/supabaseClient.js';
import { state, updateProficiency } from '../app.js';
import { toast } from '../components/toast.js';
import { uploadImage } from './recipeStore.js';

export async function doMarkCooked(rid, photoUrl, notes) {
  const prev = state.cookedMap[rid] || { count: 0 };
  await supabase.from('user_cooked').upsert({
    user_id: state.session.user.id,
    recipe_id: rid,
    count: prev.count + 1,
    last_cooked: new Date().toISOString()
  }, { onConflict: 'user_id,recipe_id' });

  state.cookedMap[rid] = { count: prev.count + 1, last: new Date().toISOString() };

  if (photoUrl || notes) {
    await supabase.from('cooking_journal').insert({
      user_id: state.session.user.id,
      recipe_id: rid,
      photo_url: photoUrl,
      notes
    });
    state.journals.unshift({
      id: Date.now().toString(),
      user_id: state.session.user.id,
      recipe_id: rid,
      photo_url: photoUrl,
      notes,
      cooked_at: new Date().toISOString()
    });
  }

  updateProficiency();
  toast('✅ 已记录！');
}

export async function incrementCooked(rid) {
  await doMarkCooked(rid, null, null);
}

export async function decreaseCooked(rid) {
  const cur = state.cookedMap[rid] || { count: 0 };
  if (cur.count <= 0) return;

  const newCount = cur.count - 1;
  if (newCount === 0) {
    await supabase.from('user_cooked').delete()
      .eq('user_id', state.session.user.id).eq('recipe_id', rid);
    delete state.cookedMap[rid];
  } else {
    await supabase.from('user_cooked').upsert({
      user_id: state.session.user.id,
      recipe_id: rid,
      count: newCount,
      last_cooked: cur.last
    }, { onConflict: 'user_id,recipe_id' });
    state.cookedMap[rid] = { count: newCount, last: cur.last };
  }
  updateProficiency();
}

export function getJournalForRecipe(rid) {
  return state.journals.filter(j => j.recipe_id === rid);
}

export async function deleteCookingJournal(journalId) {
  const journal = state.journals.find(j => j.id === journalId);
  if (!journal) return;

  // Security: only delete own records
  if (journal.user_id !== state.session?.user?.id) {
    toast('❌ 不能删除他人的打卡记录');
    return;
  }

  // Delete from Supabase
  const { error } = await supabase.from('cooking_journal')
    .delete()
    .eq('id', journalId)
    .eq('user_id', state.session.user.id);

  if (error) {
    toast('❌ 删除失败，请稍后重试');
    console.error('Journal delete error:', error);
    return;
  }

  // Remove from local state
  state.journals = state.journals.filter(j => j.id !== journalId);
  toast('🗑 已删除打卡记录');
}
