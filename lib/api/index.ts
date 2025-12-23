
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
  if (err === null || err === undefined) return "Une erreur inattendue est survenue.";
  
  // Si c'est déjà une string
  if (typeof err === 'string') return err;
  
  // Si c'est un objet Error standard
  if (err instanceof Error) return err.message;

  // Gestion spécifique Supabase / PostgREST
  if (err.error?.message) return String(err.error.message);
  if (err.message && typeof err.message === 'string') return err.message;
  if (err.error_description && typeof err.error_description === 'string') return err.error_description;
  
  // Cas spécifique code d'erreur Supabase
  if (err.code && typeof err.code === 'string') {
    if (err.code === 'PGRST204') return "Données enregistrées mais pas encore propagées sur le réseau (RLS). Réessayez dans 2 secondes.";
    if (err.code === '42501') return "Accès refusé par le serveur SNCB Cloud (Permissions RLS).";
    if (err.code === 'invalid_credentials') return "Identifiants SNCB invalides.";
    return `Erreur technique (${err.code}): ${err.details || err.message || 'Détails indisponibles'}`;
  }

  // Fallback sécurisé : on essaie de trouver une propriété textuelle
  if (err.statusText) return `Erreur serveur : ${err.statusText}`;

  try {
    const stringified = JSON.stringify(err);
    if (stringified === '{}') return String(err);
    return stringified;
  } catch {
    return "Une erreur technique s'est produite. Contactez le support.";
  }
};
