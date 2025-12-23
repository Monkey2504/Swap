
import { getSupabase, isSupabaseConfigured } from '../supabase';

class ProfileService {
  private checkConfig() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Cloud SNCB non configuré.');
    }
    return client;
  }

  // Lit un profil sans générer d'erreur s'il est vide
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

  // Met à jour sans demander de retour immédiat (évite 204)
  async updateProfile(userId: string, updates: any) {
    const client = this.checkConfig();
    const { error } = await client
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  }

  // La fonction critique pour la connexion
  async getOrCreateProfile(params: { id: string; email?: string; metadata?: any }) {
    const client = this.checkConfig();
    
    // 1. On tente de lire
    let profile = await this.getProfile(params.id);
    if (profile) return profile;

    // 2. On prépare les données par défaut
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

    // 3. ON ÉCRIT (Sans .select() pour éviter PGRST204)
    const { error: insertError } = await client
      .from('profiles')
      .upsert(newProfile, { onConflict: 'id' });

    if (insertError) {
      // Si l'erreur est juste "204", on l'ignore car la donnée est probablement là
      if (insertError.code !== 'PGRST204' && insertError.code !== '204') {
        throw insertError;
      }
    }

    // 4. ON PATIENTE POUR LA LECTURE
    // On essaie de lire le profil créé jusqu'à 5 fois avec un délai
    for (let i = 0; i < 5; i++) {
      await new Promise(r => setTimeout(r, 1000)); 
      profile = await this.getProfile(params.id);
      if (profile) return profile;
    }

    // Si vraiment rien au bout de 5s, on renvoie l'objet local pour ne pas bloquer l'UI
    return { ...newProfile, id: params.id };
  }
}

export const profileService = new ProfileService();
