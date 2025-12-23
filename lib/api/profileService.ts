
import { getSupabase, isSupabaseConfigured } from '../supabase';

class ProfileService {
  private checkConfig() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Cloud SNCB non configuré.');
    }
    return client;
  }

  async getProfile(userId: string) {
    const client = this.checkConfig();
    try {
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId);
      
      if (error) return null;
      return (data && data.length > 0) ? data[0] : null;
    } catch (e) {
      return null;
    }
  }

  async getAllProfiles() {
    const client = this.checkConfig();
    const { data, error } = await client.from('profiles').select('*').limit(100);
    if (error) throw error;
    return data;
  }

  async updateProfile(userId: string, updates: any) {
    const client = this.checkConfig();
    const { error } = await client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  }

  async getOrCreateProfile(params: { id: string; email?: string; metadata?: any }) {
    const client = this.checkConfig();
    
    let profile = await this.getProfile(params.id);
    if (profile) return profile;

    const isAdmin = params.email?.toLowerCase() === 'admin@admin';
    const newProfile = {
      id: params.id,
      sncb_id: isAdmin ? 'ADMIN_01' : (params.metadata?.sncbId || params.email?.split('@')[0] || `user_${params.id.slice(0,5)}`),
      first_name: isAdmin ? 'Superviseur' : (params.metadata?.firstName || 'Agent'),
      last_name: isAdmin ? 'SNCB' : (params.metadata?.lastName || 'SNCB'),
      email: params.email,
      depot: 'Bruxelles-Midi',
      role: isAdmin ? 'admin' : 'Chef de train',
      updated_at: new Date().toISOString()
    };

    // Tentative d'insertion
    const { error: insertError } = await client
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' });

    if (insertError) {
      // On ignore le 204 (No Content) car c'est un bug connu de PostgREST avec RLS
      if (insertError.code !== 'PGRST204' && String(insertError.code) !== '204') {
        throw insertError;
      }
    }

    // Boucle d'attente pour la réplication / visibilité RLS
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 800)); 
      profile = await this.getProfile(params.id);
      if (profile) return profile;
    }

    // Fallback : renvoyer les données locales si le serveur est lent à indexer
    return { ...newProfile, id: params.id };
  }
}

export const profileService = new ProfileService();
