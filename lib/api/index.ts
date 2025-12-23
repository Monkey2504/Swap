
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
  if (typeof err === 'string') return err;
  
  // Gestion spécifique Supabase/PostgREST
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.error_description && typeof err.error_description === 'string') return err.error_description;
  if (err.code && typeof err.code === 'string') {
    if (err.code === 'PGRST204') return "Données enregistrées mais pas encore visibles (RLS). Réessayez.";
    return `Erreur ${err.code}: ${err.details || 'Pas de détails'}`;
  }

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};
