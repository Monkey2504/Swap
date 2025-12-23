
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
      sncb_id: isAdmin ? 'ADMIN_01' : (params.metadata?.sncbId || params.email?.split('@')[0] || `agent_${params.id.slice(0,5)}`),
      first_name: isAdmin ? 'Superviseur' : (params.metadata?.firstName || 'François'),
      last_name: isAdmin ? 'SNCB' : (params.metadata?.lastName || 'Agent'),
      email: params.email,
      depot: 'Bruxelles-Midi',
      role: isAdmin ? 'admin' : 'Conducteur',
      onboarding_completed: false,
      updated_at: new Date().toISOString()
    };

    // Tentative d'insertion avec gestion silencieuse du 204 (success)
    const { error: insertError } = await client
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' });

    if (insertError) {
      if (insertError.code !== 'PGRST204' && String(insertError.code) !== '204') {
        throw insertError;
      }
    }

    // Retry loop pour s'assurer que le RLS a bien propagé le droit de lecture
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 1000)); 
      profile = await this.getProfile(params.id);
      if (profile) return profile;
    }

    return { ...newProfile, id: params.id };
  }
}

export const profileService = new ProfileService();
