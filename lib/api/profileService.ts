
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
        .eq('id', userId)
        .single();
      
      if (error) return null;
      return data;
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
      first_name: isAdmin ? 'Superviseur' : (params.metadata?.firstName || ''),
      last_name: isAdmin ? 'SNCB' : (params.metadata?.lastName || ''),
      email: params.email,
      depot: '',
      role: isAdmin ? 'admin' : 'Conducteur',
      onboarding_completed: isAdmin ? true : false,
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await client
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' });

    if (insertError) throw insertError;

    return newProfile;
  }
}

export const profileService = new ProfileService();
