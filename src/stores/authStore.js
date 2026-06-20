// RecipeMate — Auth Store
import { supabase } from '../services/supabaseClient.js';
import { state } from '../app.js';
import { toast } from '../components/toast.js';

export async function checkAuth() {
  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  return state.session;
}

export async function handleAuth(email, pass, isLogin) {
  const { data, error } = isLogin
    ? await supabase.auth.signInWithPassword({ email, password: pass })
    : await supabase.auth.signUp({ email, password: pass });

  if (error) {
    toast('❌ ' + error.message);
    return false;
  }

  state.session = data.session;

  if (!isLogin) {
    toast('✅ 注册成功，请登录');
    return false; // Don't auto-login after signup
  }

  toast('✅ 登录成功');
  return true;
}

export async function handleLogout() {
  await supabase.auth.signOut();
  state.session = null;
  state.favorites.clear();
  state.cookedMap = {};
  state.shopItems = [];
  state.journals = [];
  state.proficiency = {};
  state.customRecipes = [];
  state.recipes = [];
}
