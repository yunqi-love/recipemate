// RecipeMate — Supabase Client
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://nfwdloidytxgtlwhiewd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_TyHyw13jEY0PknZilctfNQ_d_tLZNfD';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
