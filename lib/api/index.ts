
export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * Formate une erreur de manière exhaustive pour garantir un affichage textuel propre.
 * Empêche systématiquement l'affichage de "[object Object]" en inspectant les structures
 * d'erreurs courantes (Supabase, PostgREST, etc.).
 */
export const formatError = (err: any): string => {
  if (!err) return "Incident technique indéterminé.";
  
  // Cas d'une chaîne directe
  if (typeof err === 'string') return err;
  
  // Si c'est un objet Error standard
  if (err instanceof Error) {
    return err.message;
  }

  // Fonction récursive pour chercher un message textuel dans un objet inconnu
  const findMessage = (obj: any): string | null => {
    if (!obj || typeof obj !== 'object') return null;
    
    // Propriétés standard dans l'ordre de pertinence
    const keys = ['message', 'error_description', 'error', 'details', 'hint', 'msg'];
    for (const key of keys) {
      const val = obj[key];
      if (typeof val === 'string' && val.trim() !== '' && val !== '[object Object]') {
        return val;
      }
    }

    // Si on a une propriété 'error' qui est elle-même un objet (cas Supabase)
    if (obj.error && typeof obj.error === 'object') {
      return findMessage(obj.error);
    }

    return null;
  };

  const extracted = findMessage(err);
  if (extracted) {
    // Traductions SNCB Contextuelles
    const msg = extracted.toLowerCase();
    if (msg.includes('invalid login credentials')) return "Identifiants (E-mail ou Mot de passe) erronés.";
    if (msg.includes('user already registered')) return "Un agent est déjà enregistré avec cet e-mail.";
    if (msg.includes('network error') || msg.includes('fetch')) return "Connexion au Cloud SNCB instable.";
    if (msg.includes('email not confirmed')) return "Veuillez confirmer votre e-mail professionnel.";
    return extracted;
  }

  // Fallback ultime : sérialisation JSON si l'objet n'est pas vide
  try {
    const stringified = JSON.stringify(err);
    if (stringified !== "{}" && stringified !== "null") {
      return `Détail technique : ${stringified.substring(0, 150)}`;
    }
  } catch (e) {
    // ignore
  }

  return "Erreur technique SNCB (Code 500). Veuillez contacter le support.";
};
