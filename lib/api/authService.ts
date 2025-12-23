
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

class AuthService {
  private checkConfig() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Cloud SNCB non configuré.');
    }
    return client;
  }

  async signIn(email: string, password: string) {
    const client = this.checkConfig();
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signUp(email: string, password: string, metadata: any) {
    const client = this.checkConfig();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const client = this.checkConfig();
    await client.auth.signOut();
  }

  async getSession() {
    const client = this.checkConfig();
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    return session;
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const client = getSupabase();
    if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
    return client.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
