
export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * Formate une erreur de n'importe quel type en une chaîne lisible.
 * Empêche l'affichage de [object Object] dans l'interface.
 */
export const formatError = (err: any): string => {
  if (!err) return "Erreur inconnue";
  
  // Si c'est déjà une string
  if (typeof err === 'string') return err;
  
  // Gestion des objets Error standards (le plus fréquent)
  if (err instanceof Error) return err.message;
  
  // Gestion spécifique Supabase/PostgREST
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.error_description && typeof err.error_description === 'string') return err.error_description;
  
  // Cas spécifique code d'erreur Supabase
  if (err.code && typeof err.code === 'string') {
    if (err.code === 'PGRST204') return "Données enregistrées mais pas encore visibles (RLS). Réessayez dans 2 secondes.";
    if (err.code === '42501') return "Accès refusé (Permissions RLS). Vérifiez votre compte.";
    return `Erreur ${err.code}: ${err.details || err.message || 'Détails indisponibles'}`;
  }

  // Fallback sécurisé : on cherche une propriété 'message' ou on stringify proprement
  if (err.error && typeof err.error === 'string') return err.error;
  
  try {
    const stringified = JSON.stringify(err);
    // Si stringify renvoie un objet vide pour une Error, on utilise String()
    return stringified === '{}' ? String(err) : stringified;
  } catch {
    return String(err);
  }
};
