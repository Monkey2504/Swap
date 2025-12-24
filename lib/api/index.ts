
export { authService } from './authService';
export { profileService } from './profileService';
export { dutyService } from './dutyService';
export { swapService } from './swapService';
export { preferencesService } from './preferencesService';

/**
 * Formate une erreur pour éviter l'affichage de [object Object]
 * Spécialement conçu pour les retours Supabase et les exceptions JS
 */
export const formatError = (err: any): string => {
  if (!err) return "Une erreur inconnue est survenue.";
  
  // Si c'est déjà une chaîne
  if (typeof err === 'string') return err;
  
  // Gestion récursive si l'objet contient une propriété 'error' (cas typique Supabase)
  if (err.error && typeof err.error === 'object') {
    return formatError(err.error);
  }

  // Erreurs Supabase / PostgREST (PostgreSQL)
  if (err.message && typeof err.message === 'string') {
    if (err.message.includes("[object Object]")) {
      // On cherche des détails plus profonds
      return err.details || err.hint || "Erreur de communication avec le serveur SNCB Cloud.";
    }
    
    // Traductions SNCB Contextuelles
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid login credentials')) return "Identifiants (E-mail/Pass) incorrects.";
    if (msg.includes('user already registered')) return "Un agent utilise déjà cet e-mail.";
    if (msg.includes('network error')) return "Connexion réseau instable. Vérifiez votre 4G/5G.";
    if (msg.includes('jwt expired')) return "Votre session a expiré. Veuillez vous reconnecter.";
    
    return err.message;
  }

  // Si c'est un objet brut sans propriété 'message'
  if (typeof err === 'object') {
    if (err.details) return String(err.details);
    if (err.code) return `Erreur Technique (Code: ${err.code})`;
    
    // Fallback : Stringify sécurisé
    try {
      const str = JSON.stringify(err);
      if (str !== "{}" && str !== "null") return str;
    } catch (e) {
      // ignore
    }
  }

  return "Une erreur technique est survenue. Contactez le support si le problème persiste.";
};
