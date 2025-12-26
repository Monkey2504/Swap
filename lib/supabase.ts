
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  try {
    if (!_supabaseInstance) {
      const { url, key } = getSupabaseConfig();
      _supabaseInstance = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    }
    return _supabaseInstance;
  } catch (e) {
    return null;
  }
};

export const resetConfig = () => {
  localStorage.removeItem('sncb_supabase_url');
  localStorage.removeItem('sncb_supabase_key');
  _supabaseInstance = null;
  window.location.reload();
};

export const runDiagnostic = async () => {
  const client = getSupabase();
  if (!client) return { ok: false, message: "Liaison non configurée.", type: 'config' };
  try {
    const { error: authError } = await (client.auth as any).getSession();
    if (authError) return { ok: false, message: "Clé API refusée.", type: 'invalid_key' };
    const { error: profError } = await client.from('profiles').select('id').limit(1);
    if (profError) return { ok: false, message: "Erreur table profiles.", type: 'migration_required' };
    return { ok: true, message: "Serveur opérationnel.", type: 'success' };
  } catch (err: any) {
    return { ok: false, message: "Connexion impossible : " + (err.message || "Erreur réseau"), type: 'network' };
  }
};

export const SQL_SETUP_SCRIPT = `-- CONFIGURATION ROBUSTE SNCB
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  sncb_id TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  depot TEXT,
  role TEXT DEFAULT 'Conducteur',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  preferences JSONB DEFAULT '[]',
  rgpd_consent BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.duties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  type TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  destinations JSONB DEFAULT '[]',
  relations JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- EMPÊCHE LES DOUBLONS : Un agent ne peut pas avoir deux fois le même tour le même jour
  UNIQUE(user_id, date, code)
);

CREATE TABLE IF NOT EXISTS public.swap_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_sncb_id TEXT,
  user_name TEXT,
  depot TEXT,
  duty_data JSONB NOT NULL,
  is_urgent BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.swap_offers(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_name TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(offer_id, requester_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.duties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles Public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles Update Self" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Duties Self" ON public.duties FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Swaps Public" ON public.swap_offers FOR SELECT USING (true);
CREATE POLICY "Swaps Insert Self" ON public.swap_offers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Requests Shared" ON public.swap_requests FOR SELECT USING (true);
CREATE POLICY "Requests Insert Self" ON public.swap_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
`;
