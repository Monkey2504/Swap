
export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * Formate une erreur de manière exhaustive pour garantir un affichage textuel propre.
 * Empêche systématiquement l'affichage de "[object Object]".
 */
export const formatError = (err: any): string => {
  if (!err) return "Une erreur inconnue s'est produite.";
  
  // Si c'est déjà une chaîne de caractères
  if (typeof err === 'string') return err;
  
  // Extraction récursive du message d'erreur
  const extractMessage = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === 'string') return obj;
    
    // Liste des propriétés courantes contenant un message d'erreur
    const keys = ['message', 'error_description', 'error', 'details', 'hint', 'code', 'statusText', 'reason'];
    for (const key of keys) {
      if (obj[key] && typeof obj[key] === 'string' && obj[key] !== '[object Object]') {
        return obj[key];
      }
    }

    // Gestion spécifique des erreurs de l'API Gemini / Google
    if (obj.status === 403) return "Accès refusé : Vérifiez votre clé API Gemini.";
    if (obj.status === 401) return "Authentification échouée ou clé API invalide.";
    if (obj.status === 429) return "Trop de requêtes : Veuillez patienter un moment.";
    
    // Erreurs Supabase imbriquées
    if (obj.error && typeof obj.error === 'object') {
      return extractMessage(obj.error);
    }

    return null;
  };

  const message = extractMessage(err);
  if (message) return message;

  // Fallback ultime : sérialisation JSON partielle ou type
  try {
    const str = JSON.stringify(err);
    if (str !== '{}') return `Erreur technique : ${str.slice(0, 100)}...`;
  } catch (e) {
    // ignorer l'erreur de sérialisation
  }

  return `Erreur de type : ${typeof err}. Veuillez contacter le support.`;
};
