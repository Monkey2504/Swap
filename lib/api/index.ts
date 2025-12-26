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
  if (!err) return "Une erreur inconnue est survenue.";
  
  if (typeof err === 'string') return err;
  
  // Gestion des erreurs d'API Gemini ou Supabase
  if (err.message && typeof err.message === 'string') {
    return err.message;
  }

  // Gestion des objets d'erreur complexes
  if (typeof err === 'object') {
    try {
      // Si c'est une erreur de fetch/réseau
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        return "Erreur de connexion au serveur. Vérifiez votre accès internet.";
      }
      
      // Extraction récursive si possible
      if (err.error && typeof err.error === 'string') return err.error;
      if (err.details && typeof err.details === 'string') return err.details;
      
      const str = JSON.stringify(err);
      return str !== '{}' ? str : "Erreur technique non détaillée.";
    } catch (e) {
      return "Erreur de traitement des données.";
    }
  }

  return String(err);
};
