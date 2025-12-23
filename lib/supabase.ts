import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Récupération des clés depuis les variables d'environnement (Vercel)
// Ces variables sont lues de votre configuration Vercel (Tâche N°42)
const ENV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ENV_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// NOTE : Nous avons retiré les clés DEFAULT_URL et DEFAULT_KEY codées en dur pour la sécurité.

export const getSupabaseConfig = () => {
  // Tentative de récupérer les clés écrasées (override) depuis le localStorage
  const savedUrl = localStorage.getItem('sncb_supabase_url');
  const savedKey = localStorage.getItem('sncb_supabase_key');
  
  // La logique de priorité : 
  // 1. Clé dans localStorage (pour diagnostic/override)
  // 2. Clé dans process.env (pour Vercel/Production)
  
  return {
    url: (savedUrl && savedUrl !== "null") ? savedUrl : ENV_URL,
    // CORRECTION APPORTÉE : utilise savedKey et non savedUrl comme source de la clé
    key: (savedKey && savedKey !== "null") ? savedKey : ENV_KEY
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
  // Décommenter la ligne ci-dessous si vous voulez recharger la page après un reset
  // window.location.reload(); 
};

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  if (!_supabaseInstance) {
    const { url, key } = getSupabaseConfig();
    if (!url || !key) return null; // Sécurité supplémentaire
    _supabaseInstance = createClient(url, key);
  }
  return _supabaseInstance;
};

// ... (Les fonctions runDiagnostic et SQL_SETUP_SCRIPT restent inchangées) ...