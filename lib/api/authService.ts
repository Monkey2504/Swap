import { getSupabase, isSupabaseConfigured } from '../supabase';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

class AuthService {
  private static instance: AuthService;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private getClient() {
    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Configuration Supabase manquante. Vérifiez les variables d\'environnement.');
      }

      const client = getSupabase();
      if (!client) {
        throw new Error('Client Supabase non initialisé.');
      }

      return client;
    } catch (error) {
      console.error('[AuthService] Erreur lors de l\'obtention du client:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const client = this.getClient();
      
      // Validation des entrées
      if (!email || !password) {
        throw new Error('Email et mot de passe requis.');
      }

      console.log(`[AuthService] Tentative de connexion pour: ${email.substring(0, 5)}...`);
      
      const { data, error } = await client.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (error) {
        console.error('[AuthService] Erreur de connexion:', error.message);
        throw this.formatAuthError(error);
      }

      if (!data.session || !data.user) {
        throw new Error('Aucune session ou utilisateur retourné.');
      }

      console.log('[AuthService] Connexion réussie');
      this.retryCount = 0;
      return data;

    } catch (error) {
      this.handleAuthError(error, 'signIn');
      throw error;
    }
  }

  async signUp(email: string, password: string, metadata: Record<string, any>) {
    try {
      const client = this.getClient();

      // Validation
      if (!email || !password) {
        throw new Error('Email et mot de passe requis.');
      }

      if (!email.endsWith('@sncb.be')) {
        throw new Error('Seules les adresses email SNCB sont autorisées (@sncb.be).');
      }

      console.log(`[AuthService] Inscription pour: ${email}`);

      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...metadata,
            created_at: new Date().toISOString(),
            app_version: process.env.APP_VERSION || 'unknown',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('[AuthService] Erreur d\'inscription:', error.message);
        throw this.formatAuthError(error);
      }

      console.log('[AuthService] Inscription réussie (en attente de confirmation)');
      return data;

    } catch (error) {
      this.handleAuthError(error, 'signUp');
      throw error;
    }
  }

  async signOut() {
    try {
      const client = this.getClient();
      
      console.log('[AuthService] Déconnexion en cours...');
      
      const { error } = await client.auth.signOut();
      
      if (error) {
        console.warn('[AuthService] Erreur lors de la déconnexion:', error.message);
        throw this.formatAuthError(error);
      }

      console.log('[AuthService] Déconnexion réussie');
      
      // Nettoyage côté client
      localStorage.removeItem('swapact-session');
      sessionStorage.removeItem('swapact-temp');

    } catch (error) {
      console.error('[AuthService] Erreur critique lors de la déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      localStorage.removeItem('swapact-session');
      sessionStorage.removeItem('swapact-temp');
      window.location.href = '/';
    }
  }

  async getSession(): Promise<Session | null> {
    try {
      const client = this.getClient();

      // Vérifier d'abord le cache local
      const cachedSession = this.getCachedSession();
      if (cachedSession) {
        const isValid = await this.validateSession(cachedSession);
        if (isValid) {
          console.log('[AuthService] Session récupérée depuis le cache');
          return cachedSession;
        }
      }

      // Récupérer depuis Supabase avec timeout
      console.log('[AuthService] Récupération de la session depuis Supabase...');
      
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout lors de la récupération de la session')), 5000)
      );

      const sessionPromise = client.auth.getSession();
      
      const result = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: Session | null } };
      
      if (result?.data?.session) {
        console.log('[AuthService] Session valide récupérée');
        this.cacheSession(result.data.session);
        return result.data.session;
      }

      console.log('[AuthService] Aucune session active');
      return null;

    } catch (error) {
      console.warn('[AuthService] Erreur lors de la récupération de la session:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[AuthService] Nouvelle tentative (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.getSession();
      }
      
      this.retryCount = 0;
      return null;
    }
  }

  async refreshSession(): Promise<Session | null> {
    try {
      const client = this.getClient();
      
      console.log('[AuthService] Rafraîchissement de la session...');
      
      const { data, error } = await client.auth.refreshSession();
      
      if (error) {
        console.warn('[AuthService] Erreur lors du rafraîchissement:', error.message);
        return null;
      }

      if (data.session) {
        console.log('[AuthService] Session rafraîchie avec succès');
        this.cacheSession(data.session);
        return data.session;
      }

      return null;

    } catch (error) {
      console.error('[AuthService] Erreur lors du rafraîchissement de la session:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    try {
      const client = this.getClient();
      
      console.log('[AuthService] Abonnement aux changements d\'authentification');
      
      const { data } = client.auth.onAuthStateChange((event, session) => {
        console.log(`[AuthService] Événement d'authentification: ${event}`);
        
        // Mettre à jour le cache
        if (event === 'SIGNED_IN' && session) {
          this.cacheSession(session);
        } else if (event === 'SIGNED_OUT') {
          this.clearCache();
        }
        
        callback(event, session);
      });

      return data;

    } catch (error) {
      console.error('[AuthService] Erreur lors de l\'abonnement aux changements:', error);
      
      // Retourner un objet dummy avec unsubscribe
      return {
        subscription: {
          unsubscribe: () => console.log('[AuthService] Abonnement non disponible')
        }
      };
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const session = await this.getSession();
      return session?.user || null;
    } catch (error) {
      console.error('[AuthService] Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  private formatAuthError(error: any): Error {
    const message = error.message || 'Erreur d\'authentification';
    
    // Messages personnalisés selon les codes d'erreur
    switch (error.status) {
      case 400:
        return new Error('Requête invalide. Vérifiez vos identifiants.');
      case 401:
        return new Error('Non autorisé. Veuillez vous reconnecter.');
      case 403:
        return new Error('Accès refusé. Contactez votre administrateur.');
      case 429:
        return new Error('Trop de tentatives. Veuillez réessayer plus tard.');
      case 500:
        return new Error('Erreur serveur. Veuillez réessayer dans quelques instants.');
      default:
        return new Error(message);
    }
  }

  private handleAuthError(error: any, operation: string) {
    console.error(`[AuthService] Erreur lors de ${operation}:`, {
      message: error.message,
      code: error.code,
      status: error.status,
      operation
    });

    // Log supplémentaire pour le support
    if (error.status >= 500) {
      console.error('[AuthService] Erreur serveur détectée, contacter le support');
    }
  }

  private async validateSession(session: Session): Promise<boolean> {
    try {
      // Vérifier l'expiration
      const expiresAt = new Date(session.expires_at || 0).getTime();
      const now = Date.now();
      
      if (expiresAt < now) {
        console.log('[AuthService] Session expirée');
        return false;
      }

      // Vérifier qu'il reste au moins 5 minutes
      const fiveMinutes = 5 * 60 * 1000;
      if (expiresAt - now < fiveMinutes) {
        console.log('[AuthService] Session sur le point d\'expirer, rafraîchissement nécessaire');
        return false;
      }

      return true;

    } catch (error) {
      console.warn('[AuthService] Erreur lors de la validation de la session:', error);
      return false;
    }
  }

  private cacheSession(session: Session) {
    try {
      const cacheData = {
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: {
            id: session.user?.id,
            email: session.user?.email,
            user_metadata: session.user?.user_metadata
          }
        },
        timestamp: Date.now(),
        ttl: 30 * 60 * 1000 // 30 minutes
      };

      localStorage.setItem('swapact-session', JSON.stringify(cacheData));
      console.log('[AuthService] Session mise en cache');
    } catch (error) {
      console.warn('[AuthService] Erreur lors de la mise en cache de la session:', error);
    }
  }

  private getCachedSession(): Session | null {
    try {
      const cached = localStorage.getItem('swapact-session');
      if (!cached) return null;

      const { session, timestamp, ttl } = JSON.parse(cached);
      
      // Vérifier si le cache est expiré
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem('swapact-session');
        return null;
      }

      return session;
    } catch (error) {
      console.warn('[AuthService] Erreur lors de la récupération du cache:', error);
      return null;
    }
  }

  private clearCache() {
    try {
      localStorage.removeItem('swapact-session');
      sessionStorage.removeItem('swapact-temp');
      console.log('[AuthService] Cache nettoyé');
    } catch (error) {
      console.warn('[AuthService] Erreur lors du nettoyage du cache:', error);
    }
  }
}

// Singleton export
export const authService = AuthService.getInstance();
export default authService;