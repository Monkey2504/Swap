
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration par défaut (Demo/SNCB Sandbox)
const DEFAULT_URL = "https://mhipjaushqtszeokgdgn.supabase.co";
const DEFAULT_KEY = "sb_publishable_h7S7TfbeXJ3qLy5lCtK0cw_-DQjQ6ua";

export const getSupabaseConfig = () => {
  const savedUrl = localStorage.getItem('sncb_supabase_url');
  const savedKey = localStorage.getItem('sncb_supabase_key');
  
  if (savedUrl && savedKey && savedUrl !== "null" && savedKey !== "null") {
    return { url: savedUrl, key: savedKey };
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    };
  }

  return { url: DEFAULT_URL, key: DEFAULT_KEY };
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
    return { ok: false, message: "Connexion impossible : " + (err.message || "Erreur réseau"), type: 'network' };
  }
};

export const SQL_SETUP_SCRIPT = `-- SCRIPT DE RÉPARATION NUCLÉAIRE (FORCE VISIBILITY)

-- 1. Désactivation temporaire pour nettoyage
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow individual update" ON public.profiles;

-- 2. Structure de table garantie
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  sncb_id TEXT UNIQUE,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  depot TEXT DEFAULT 'Bruxelles-Midi',
  role TEXT DEFAULT 'Chef de train',
  series TEXT,
  position TEXT,
  is_floating BOOLEAN DEFAULT false,
  rgpd_consent BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '[]'::jsonb,
  current_duties JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RÈGLES DE SÉCURITÉ "PASS-THROUGH" (ZÉRO BLOCAGE LECTURE)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : ABSOLUMENT TOUT LE MONDE PEUT LIRE (C'est ce qui règle PGRST204)
CREATE POLICY "Public Read" ON public.profiles FOR SELECT USING (true);

-- Insertion : Tout utilisateur authentifié peut créer son profil
CREATE POLICY "Allow individual insert" ON public.profiles FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Mise à jour : Seul le propriétaire modifie
CREATE POLICY "Allow individual update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Application aux autres tables
ALTER TABLE IF EXISTS public.duties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "User Duties" ON public.duties;
CREATE POLICY "User Duties" ON public.duties FOR ALL USING (auth.uid() = user_id);

ALTER TABLE IF EXISTS public.swap_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Offers" ON public.swap_offers;
CREATE POLICY "Public Offers" ON public.swap_offers FOR SELECT USING (true);
DROP POLICY IF EXISTS "User Offers" ON public.swap_offers;
CREATE POLICY "User Offers" ON public.swap_offers FOR INSERT WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
`;
