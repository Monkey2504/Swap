
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
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (msg.includes('user already registered')) return "Cette adresse e-mail est déjà utilisée.";
    if (msg.includes('invalid login credentials')) return "Identifiants SNCB incorrects.";
    if (msg.includes('email not confirmed')) return "Veuillez confirmer votre e-mail via le lien envoyé.";
    return err.message;
  }

  // Gestion spécifique Supabase / PostgREST
  if (err.error?.message) return formatError(err.error.message);
  if (err.message && typeof err.message === 'string') return formatError(err.message);
  
  // Cas spécifique code d'erreur Supabase
  if (err.code && typeof err.code === 'string') {
    if (err.code === 'PGRST204') return "Action réussie. Propagation Cloud en cours...";
    if (err.code === '42501') return "Accès restreint par le serveur SNCB Cloud.";
    if (err.code === '23505') return "Donnée déjà existante (doublon).";
    return `Erreur technique (${err.code}): ${err.details || err.message || 'Détails indisponibles'}`;
  }

  try {
    const stringified = JSON.stringify(err);
    if (stringified === '{}') return String(err);
    return stringified;
  } catch {
    return "Une erreur technique s'est produite.";
  }
};
