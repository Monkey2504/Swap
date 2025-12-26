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
  if (err.code === 'INTERNAL_SERVER_ERROR' || err.message?.includes('500') || (typeof err === 'object' && err.name === 'Error' && err.message?.includes('object'))) {
    return "Difficulté technique de communication avec le serveur (500).";
  }

  // Si c'est un objet Error standard
  if (err instanceof Error) return err.message;

  // Si c'est un objet complexe (Supabase, API, etc)
  if (typeof err === 'object') {
    try {
      // Extraction intelligente du message
      const extracted = err.message || err.error || err.error_description || err.msg || err.details;
      if (extracted && typeof extracted === 'string') return extracted;
      
      // Fallback sécurisé en évitant de retourner l'objet entier
      return "Erreur technique (" + (err.code || "Code indéterminé") + ")";
    } catch (e) {
      return "Erreur de format de données.";
    }
  }

  return String(err);
};