export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * Transforme n'importe quel type d'erreur en chaîne de caractères lisible.
 * Empêche systématiquement l'affichage de "[object Object]" et l'erreur React #31.
 */
export const formatError = (err: any): string => {
  if (!err) return "Une erreur inconnue est survenue.";
  
  if (typeof err === 'string') return err;
  
  // Si c'est déjà un objet Error standard
  if (err instanceof Error) {
    return err.message || "Erreur système.";
  }

  // Gestion des objets d'erreur complexes (Supabase, Gemini, etc.)
  if (typeof err === 'object') {
    // Vérifier si c'est un élément React par accident ($$typeof)
    // Rend l'erreur sécurisée pour l'affichage
    if (err.$$typeof) {
      return "Erreur d'affichage (composant React détecté au lieu d'un message).";
    }

    try {
      // Priorité aux messages explicites
      if (typeof err.message === 'string') return err.message;
      if (typeof err.error === 'string') return err.error;
      if (typeof err.error_description === 'string') return err.error_description;
      if (typeof err.details === 'string') return err.details;
      
      // Si c'est une erreur de fetch/réseau
      if (err.name === 'TypeError' && (err.message === 'Failed to fetch' || err.message?.includes('network'))) {
        return "Erreur de connexion. Vérifiez votre accès internet ou le statut du serveur.";
      }
      
      // En dernier recours, stringify mais vérifier que ce n'est pas un objet vide
      const str = JSON.stringify(err);
      return (str && str !== '{}') ? str : "Erreur technique non spécifiée.";
    } catch (e) {
      return "Erreur de traitement des données (format non reconnu).";
    }
  }

  return String(err);
};