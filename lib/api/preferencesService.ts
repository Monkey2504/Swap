
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { UserPreference } from '../../types';

class PreferencesService {
  private checkConfig() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Synchronisation des préférences impossible.');
    }
    return client;
  }

  async getUserPreferences(userId: string): Promise<UserPreference[] | null> {
    const client = this.checkConfig();
    const { data, error } = await client
      .from('profiles')
      .select('preferences')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error("[PreferencesService] Erreur de lecture:", error);
      throw new Error("Impossible de charger vos préférences.");
    }
    return data?.preferences || null;
  }

  async saveUserPreferences(userId: string, preferences: UserPreference[]): Promise<void> {
    const client = this.checkConfig();

    if (!Array.isArray(preferences)) {
      throw new Error("Format de données corrompu.");
    }

    const { error } = await client
      .from('profiles')
      .update({ 
        preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    if (error) {
      console.error("[PreferencesService] Erreur de sauvegarde:", error);
      throw new Error("Échec de la synchronisation Cloud.");
    }
  }
}

export const preferencesService = new PreferencesService();
