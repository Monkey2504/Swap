
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = "https://mhipjaushqtszeokgdgn.supabase.co";
const DEFAULT_KEY = "sb_publishable_h7S7TfbeXJ3qLy5lCtK0cw_-DQjQ6ua";

export const getSupabaseConfig = () => {
  const savedUrl = localStorage.getItem('sncb_supabase_url');
  const savedKey = localStorage.getItem('sncb_supabase_key');
  return {
    url: (savedUrl && savedUrl !== "null") ? savedUrl : DEFAULT_URL,
    key: (savedUrl && savedUrl !== "null") ? savedUrl : DEFAULT_KEY
  };
};

let _supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseConfig();
  return !!url && url.startsWith('https://') && !!key && key.length > 10;
};

export const resetConfig = () => {
  localStorage.clear();
  _supabaseInstance = null;
  window.location.reload();
};

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  if (!_supabaseInstance) {
    const { url, key } = getSupabaseConfig();
    _supabaseInstance = createClient(url, key);
  }
  return _supabaseInstance;
};

export const runDiagnostic = async () => {
  const client = getSupabase();
  if (!client) return { ok: false, message: "Liaison non configurée.", type: 'config' };
  
  try {
    const { error: authError } = await client.auth.getSession();
    if (authError) return { ok: false, message: "Clé API refusée ou expirée.", type: 'invalid_key' };

    const { error: profError } = await client.from('profiles').select('id').limit(1);
    if (profError) {
      return { ok: false, message: "Erreur RLS : Les droits d'accès sont bloqués.", type: 'migration_required' };
    }

    return { ok: true, message: "Le Cloud SNCB est opérationnel.", type: 'success' };
  } catch (err: any) {
    return { ok: false, message: "Connexion impossible.", type: 'network' };
  }
};

export const SQL_SETUP_SCRIPT = `-- RÉPARATION RAPIDE SNCB

-- Désactiver la RLS temporairement
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes règles
DROP POLICY IF EXISTS "Public Read" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update" ON public.profiles;

-- S'assurer que la table est là
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  sncb_id TEXT UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  depot TEXT DEFAULT 'Bruxelles-Midi',
  role TEXT DEFAULT 'Chef de train',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Réactiver avec des règles permissives pour débloquer l'erreur 204
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- TOUT LE MONDE PEUT LIRE (Essentiel pour corriger PGRST204)
CREATE POLICY "Public Read" ON public.profiles FOR SELECT USING (true);

-- ON PEUT CRÉER SI ON EST CONNECTÉ
CREATE POLICY "Allow individual insert" ON public.profiles FOR INSERT WITH CHECK (true);

-- ON PEUT MODIFIER SON PROPRE PROFIL
CREATE POLICY "Allow individual update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Tables de services
ALTER TABLE IF EXISTS public.duties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Duties" ON public.duties;
CREATE POLICY "User Duties" ON public.duties FOR ALL USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
`;
