
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

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
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, metadata: any) {
    const client = this.getClient();
    const { data, error } = await client.auth.signUp({
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
      await client.auth.signOut();
    }
  }

  async getSession() {
    const client = getSupabase();
    if (!client) return null;
    
    try {
      // On utilise une course pour ne pas bloquer l'app
      const { data: { session }, error } = await Promise.race([
        client.auth.getSession(),
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
    return client.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
