
export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * Transforme n'importe quel type d'erreur en chaîne de caractères lisible.
 * Empêche systématiquement l'affichage de "[object Object]".
 */
export const formatError = (err: any): string => {
  if (!err) return "Erreur indéterminée.";
  
  if (typeof err === 'string') return err;
  
  // Cas spécifique PostgrestError (Supabase)
  if (err.message && typeof err.message === 'string') {
    let output = err.message;
    if (err.details && err.details !== 'null' && typeof err.details === 'string') {
      output += ` : ${err.details}`;
    }
    if (err.hint && typeof err.hint === 'string') {
      output += ` (${err.hint})`;
    }
    return output;
  }

  // Cas des erreurs imbriquées type Auth
  if (err.error && typeof err.error === 'object') {
    return formatError(err.error);
  }

  // Fallback sécurisé
  try {
    const json = JSON.stringify(err);
    if (json !== '{}') return `Erreur technique : ${json.substring(0, 100)}`;
  } catch (e) {}

  return String(err) === "[object Object]" ? "Défaut de liaison serveur (vérifiez votre connexion)" : String(err);
};
