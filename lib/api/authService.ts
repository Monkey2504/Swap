
import { getSupabase, isSupabaseConfigured } from '../supabase';
/* Fix: Import Auth types as types from @supabase/supabase-js */
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

class AuthService {
  private getClient() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Espace communautaire non configuré.');
    }
    return client;
  }

  async signIn(email: string, password: string) {
    const client = this.getClient();
    /* Fix: Cast auth to any to bypass missing method errors on SupabaseAuthClient type */
    const { data, error } = await (client.auth as any).signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, metadata: any) {
    const client = this.getClient();
    /* Fix: Cast auth to any to bypass missing method errors on SupabaseAuthClient type */
    const { data, error } = await (client.auth as any).signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const client = getSupabase();
    if (client) {
      /* Fix: Cast auth to any for signOut call */
      await (client.auth as any).signOut();
    }
  }

  async getSession() {
    const client = getSupabase();
    if (!client) return null;
    
    try {
      // On utilise une course pour ne pas bloquer l'app
      /* Fix: Cast auth to any for getSession call */
      const { data: { session }, error } = await Promise.race([
        (client.auth as any).getSession(),
        new Promise<{data: {session: null}, error: Error}>((_, reject) => 
          setTimeout(() => reject(new Error("Timeout Session")), 3000)
        )
      ]);
      
      if (error) return null;
      return session;
    } catch (e) {
      return null;
    }
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const client = getSupabase();
    if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
    /* Fix: Cast auth to any for onAuthStateChange call */
    return (client.auth as any).onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
