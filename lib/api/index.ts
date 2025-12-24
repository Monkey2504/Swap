
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
  
  // Gestion spécifique Supabase / PostgREST error objects
  // Ces objets ont souvent .message, .details, .hint
  if (err.message && typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    
    // Traductions communes
    if (msg.includes('user already registered')) return "Cette adresse e-mail est déjà utilisée.";
    if (msg.includes('invalid login credentials')) return "Identifiants SNCB incorrects.";
    if (msg.includes('email not confirmed')) return "Veuillez confirmer votre e-mail via le lien envoyé.";
    if (msg.includes('network error') || msg.includes('failed to fetch')) return "Erreur réseau. Vérifiez votre connexion.";
    if (msg.includes('jwt expired')) return "Votre session a expiré. Veuillez vous reconnecter.";
    
    // Retourner le message d'erreur brut si aucune traduction
    if (err.message !== "[object Object]") return err.message;
  }

  // Si c'est un objet avec une propriété 'error' imbriquée (cas fréquent chez Supabase)
  if (err.error?.message) return formatError(err.error.message);
  
  // Si c'est un objet Error standard qui n'a pas été capturé par le bloc précédent
  if (err instanceof Error && err.message !== "[object Object]") {
    return err.message;
  }

  // Cas spécifique code d'erreur Supabase
  if (err.code && typeof err.code === 'string') {
    if (err.code === 'PGRST204') return "Action réussie. Propagation Cloud en cours...";
    if (err.code === '42501') return "Accès restreint par le serveur SNCB Cloud.";
    if (err.code === '23505') return "Donnée déjà existante (doublon).";
    if (err.code === '42P01') return "Erreur de configuration serveur (Table manquante).";
    return `Erreur technique (${err.code}): ${err.details || err.message || 'Détails indisponibles'}`;
  }

  // Fallback ultime : essayer d'extraire n'importe quel texte
  if (typeof err === 'object') {
    try {
      const keys = Object.keys(err);
      if (keys.length > 0) {
        // Si l'objet a une clé 'msg' ou 'detail'
        if (err.msg) return String(err.msg);
        if (err.detail) return String(err.detail);
        
        // Sinon JSON stringify propre
        const stringified = JSON.stringify(err);
        if (stringified !== '{}') return stringified;
      }
    } catch {
      // Ignorer l'échec du stringify
    }
  }

  return String(err) === "[object Object]" ? "Erreur inconnue du serveur SNCB Cloud." : String(err);
};
