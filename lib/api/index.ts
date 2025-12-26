export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * formatError : Garantit que le retour est TOUJOURS une chaîne de caractères simple.
 * Empêche le crash React #31 (Objects are not valid as a React child).
 */
export const formatError = (err: any): string => {
  if (err === null || err === undefined) return "Une erreur inconnue est survenue.";
  
  // Si c'est déjà une string, on la retourne
  if (typeof err === 'string') return err;
  
  // Si c'est un objet Error standard
  if (err instanceof Error) return err.message || "Erreur système.";

  // Si c'est un objet complexe
  if (typeof err === 'object') {
    // Cas critique : On a reçu un élément React par erreur
    if (err.$$typeof) return "Erreur technique d'affichage.";

    try {
      // Priorité aux champs de message connus
      const msg = err.message || err.error || err.error_description || err.details || err.msg;
      if (msg && typeof msg === 'string') return msg;
      
      // Si c'est une erreur de réseau type fetch
      if (err.name === 'TypeError') return "Problème de connexion au Cloud SNCB.";

      // Fallback JSON stringify sécurisé
      const stringified = JSON.stringify(err);
      return stringified === '{}' ? "Erreur technique non détaillée." : stringified;
    } catch (e) {
      return "Erreur de format de données.";
    }
  }

  // Fallback ultime
  return String(err);
};