
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration par défaut (Demo/Sandbox communautaire)
const DEFAULT_URL = "https://mhipjaushqtszeokgdgn.supabase.co";
const DEFAULT_KEY = "sb_publishable_h7S7TfbeXJ3qLy5lCtK0cw_-DQjQ6ua";

export const getSupabaseConfig = () => {
  const savedUrl = localStorage.getItem('sncb_supabase_url');
  const savedKey = localStorage.getItem('sncb_supabase_key');
  
  if (savedUrl && savedKey && savedUrl !== "null" && savedKey !== "null" && savedUrl.startsWith('http')) {
    return { url: savedUrl, key: savedKey };
  }

  return { url: DEFAULT_URL, key: DEFAULT_KEY };
};

let _supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!url && url.startsWith('https://') && !!key && key.length > 5;
};

export const resetConfig = () => {
  localStorage.removeItem('sncb_supabase_url');
  localStorage.removeItem('sncb_supabase_key');
  _supabaseInstance = null;
  window.location.reload();
};

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  
  try {
    if (!_supabaseInstance) {
      const { url, key } = getSupabaseConfig();
      _supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }
    return _supabaseInstance;
  } catch (e) {
    console.error("Erreur d'initialisation Supabase:", e);
    return null;
  }
};

export const runDiagnostic = async () => {
  const client = getSupabase();
  if (!client) return { ok: false, message: "Liaison non configurée.", type: 'config' };
  
  try {
    const { error: authError } = await client.auth.getSession();
    if (authError) return { ok: false, message: "Clé API refusée ou expirée.", type: 'invalid_key' };

    const { error: profError } = await client.from('profiles').select('id').limit(1);
    if (profError) {
      return { ok: false, message: "Erreur RLS ou table manquante.", type: 'migration_required' };
    }

    return { ok: true, message: "Serveur opérationnel.", type: 'success' };
  } catch (err: any) {
    return { ok: false, message: "Connexion impossible : " + (err.message || "Erreur réseau"), type: 'network' };
  }
};

export const SQL_SETUP_SCRIPT = `-- SCRIPT DE RÉPARATION COMMUNAUTAIRE
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
`;
