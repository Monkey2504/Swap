export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * formatError : Transforme n'importe quel objet d'erreur en String pure.
 * C'est la garde de sécurité ultime contre l'erreur React #31.
 */
export const formatError = (err: any): string => {
  if (!err) return "Erreur inconnue.";
  
  // Si c'est déjà du texte
  if (typeof err === 'string') return err;
  
  // Si c'est une erreur Vercel 500 (INTERNAL_SERVER_ERROR)
  if (err.code === 'INTERNAL_SERVER_ERROR' || err.message?.includes('500')) {
    return "Le serveur de déploiement a rencontré une difficulté technique temporaire.";
  }

  // Si c'est un objet Error
  if (err instanceof Error) return err.message;

  // Si c'est un objet complexe (Supabase, API, etc)
  if (typeof err === 'object') {
    try {
      // Extraction intelligente du message
      const extracted = err.message || err.error || err.error_description || err.msg || err.details;
      if (extracted && typeof extracted === 'string') return extracted;
      
      // Fallback sécurisé
      return "Erreur technique (" + (err.code || "Sans code") + ")";
    } catch (e) {
      return "Erreur de communication système.";
    }
  }

  return String(err);
};