import { getSupabase, isSupabaseConfigured } from '../supabase';
import { UserPreference, PreferenceLevel, PreferenceType } from '../../types';
import { APP_CONFIG, ERROR_MESSAGES } from '../constants';

class PreferencesService {
  private retryCount = 0;
  private maxRetries = APP_CONFIG.RETRY_ATTEMPTS;
  private retryDelay = APP_CONFIG.RETRY_DELAY_MS;

  private checkConfig() {
    try {
      const client = getSupabase();
      if (!isSupabaseConfigured() || !client) {
        throw new Error('Service de synchronisation des préférences indisponible.');
      }
      return client;
    } catch (error) {
      console.error('[PreferencesService] Configuration manquante:', error);
      throw new Error(ERROR_MESSAGES.API_ERROR);
    }
  }

  async getUserPreferences(userId: string): Promise<UserPreference[]> {
    try {
      const client = this.checkConfig();
      
      console.log(`[PreferencesService] Récupération des préférences pour l'utilisateur ${userId.substring(0, 8)}...`);
      
      const { data, error } = await client
        .from('profiles')
        .select('preferences, preferences_updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[PreferencesService] Erreur de lecture:', error);
        
        // Si l'utilisateur n'existe pas encore, retourner un tableau vide
        if (error.code === 'PGRST116') {
          console.log('[PreferencesService] Aucun profil trouvé, utilisation des préférences par défaut');
          return [];
        }
        
        throw this.formatSupabaseError(error);
      }

      const preferences = data?.preferences || [];
      console.log(`[PreferencesService] ${preferences.length} préférences récupérées`);
      
      // Valider et nettoyer les préférences
      return this.validateAndCleanPreferences(preferences);

    } catch (error) {
      console.error('[PreferencesService] Erreur lors de la récupération des préférences:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[PreferencesService] Nouvelle tentative (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.getUserPreferences(userId);
      }
      
      this.retryCount = 0;
      throw error;
    }
  }

  async saveUserPreferences(userId: string, preferences: UserPreference[]): Promise<void> {
    try {
      if (!Array.isArray(preferences)) {
        throw new Error('Format de données invalide. Les préférences doivent être un tableau.');
      }

      // Valider et nettoyer les préférences avant sauvegarde
      const cleanedPreferences = this.validateAndCleanPreferences(preferences);
      
      console.log(`[PreferencesService] Sauvegarde de ${cleanedPreferences.length} préférences pour l'utilisateur ${userId.substring(0, 8)}...`);

      const client = this.checkConfig();
      
      // Vérifier d'abord si le profil existe
      const { data: profileExists } = await client
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      const updateData = {
        preferences: cleanedPreferences,
        preferences_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      let error;
      
      if (profileExists) {
        // Mettre à jour le profil existant
        const { error: updateError } = await client
          .from('profiles')
          .update(updateData)
          .eq('id', userId);
        error = updateError;
      } else {
        // Créer un nouveau profil avec les préférences
        const { error: insertError } = await client
          .from('profiles')
          .insert({
            id: userId,
            ...updateData,
            created_at: new Date().toISOString()
          });
        error = insertError;
      }

      if (error) {
        console.error('[PreferencesService] Erreur de sauvegarde:', error);
        throw this.formatSupabaseError(error);
      }

      console.log('[PreferencesService] Préférences sauvegardées avec succès');

    } catch (error) {
      console.error('[PreferencesService] Erreur lors de la sauvegarde des préférences:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[PreferencesService] Nouvelle tentative (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.saveUserPreferences(userId, preferences);
      }
      
      this.retryCount = 0;
      throw error;
    }
  }

  async updateUserPreference(
    userId: string, 
    preferenceId: string, 
    updates: Partial<UserPreference>
  ): Promise<UserPreference[]> {
    try {
      console.log(`[PreferencesService] Mise à jour de la préférence ${preferenceId}...`);
      
      const currentPreferences = await this.getUserPreferences(userId);
      
      const updatedPreferences = currentPreferences.map(pref => {
        if (pref.id === preferenceId) {
          return {
            ...pref,
            ...updates,
            updated_at: new Date().toISOString()
          };
        }
        return pref;
      });

      await this.saveUserPreferences(userId, updatedPreferences);
      
      return updatedPreferences;

    } catch (error) {
      console.error('[PreferencesService] Erreur lors de la mise à jour d\'une préférence:', error);
      throw error;
    }
  }

  async deleteUserPreference(userId: string, preferenceId: string): Promise<UserPreference[]> {
    try {
      console.log(`[PreferencesService] Suppression de la préférence ${preferenceId}...`);
      
      const currentPreferences = await this.getUserPreferences(userId);
      
      const updatedPreferences = currentPreferences.filter(pref => pref.id !== preferenceId);
      
      await this.saveUserPreferences(userId, updatedPreferences);
      
      return updatedPreferences;

    } catch (error) {
      console.error('[PreferencesService] Erreur lors de la suppression d\'une préférence:', error);
      throw error;
    }
  }

  async resetUserPreferences(userId: string): Promise<UserPreference[]> {
    try {
      console.log(`[PreferencesService] Réinitialisation des préférences pour l'utilisateur ${userId.substring(0, 8)}...`);
      
      await this.saveUserPreferences(userId, []);
      
      console.log('[PreferencesService] Préférences réinitialisées avec succès');
      return [];

    } catch (error) {
      console.error('[PreferencesService] Erreur lors de la réinitialisation des préférences:', error);
      throw error;
    }
  }

  private validateAndCleanPreferences(preferences: any[]): UserPreference[] {
    if (!Array.isArray(preferences)) {
      console.warn('[PreferencesService] Les préférences ne sont pas un tableau, retour tableau vide');
      return [];
    }

    const validPreferenceTypes: PreferenceType[] = ['time', 'day', 'station', 'train', 'route', 'duration'];
    const validPreferenceLevels: PreferenceLevel[] = ['required', 'high', 'medium', 'low', 'avoid', 'never'];

    return preferences
      .filter(pref => {
        // Validation de base
        if (!pref || typeof pref !== 'object') {
          console.warn('[PreferencesService] Préférence invalide ignorée:', pref);
          return false;
        }

        // Validation des champs requis
        const hasRequiredFields = pref.id && pref.type && pref.name && pref.value !== undefined && pref.level;
        if (!hasRequiredFields) {
          console.warn('[PreferencesService] Préférence incomplète ignorée:', pref);
          return false;
        }

        // Validation du type
        if (!validPreferenceTypes.includes(pref.type)) {
          console.warn('[PreferencesService] Type de préférence invalide ignoré:', pref.type);
          return false;
        }

        // Validation du niveau
        if (!validPreferenceLevels.includes(pref.level)) {
          console.warn('[PreferencesService] Niveau de préférence invalide ignoré:', pref.level);
          return false;
        }

        // Validation spécifique au type
        switch (pref.type) {
          case 'time':
            const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(pref.value)) {
              console.warn('[PreferencesService] Format d\'heure invalide ignoré:', pref.value);
              return false;
            }
            break;
            
          case 'station':
          case 'train':
            if (!Array.isArray(pref.value)) {
              console.warn('[PreferencesService] Valeur de liste invalide ignorée:', pref.value);
              return false;
            }
            break;
            
          case 'duration':
            if (typeof pref.value !== 'number' || pref.value < 0 || pref.value > 24) {
              console.warn('[PreferencesService] Durée invalide ignorée:', pref.value);
              return false;
            }
            break;
        }

        return true;
      })
      .map(pref => ({
        id: String(pref.id),
        type: pref.type as PreferenceType,
        name: String(pref.name),
        value: pref.value,
        level: pref.level as PreferenceLevel,
        description: pref.description ? String(pref.description) : undefined,
        created_at: pref.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
  }

  private formatSupabaseError(error: any): Error {
    const message = error.message || 'Erreur de base de données';
    
    switch (error.code) {
      case 'PGRST116':
        return new Error('Aucun profil trouvé');
      case '23505':
        return new Error('Un profil avec cet identifiant existe déjà');
      case '42501':
        return new Error(ERROR_MESSAGES.PERMISSION_ERROR);
      case '22P02':
        return new Error('Format de données JSON invalide');
      default:
        return new Error(`Erreur lors de l'opération sur les préférences: ${message}`);
    }
  }

  // Fonction utilitaire pour fusionner les préférences par défaut avec les préférences utilisateur
  async mergeWithDefaultPreferences(
    userId: string, 
    defaultPreferences: UserPreference[]
  ): Promise<UserPreference[]> {
    try {
      const userPreferences = await this.getUserPreferences(userId);
      
      // Créer un Map des préférences utilisateur par ID
      const userPrefMap = new Map(userPreferences.map(p => [p.id, p]));
      
      // Fusionner : préférences utilisateur écrasent les préférences par défaut du même ID
      // Sinon, ajouter les préférences par défaut non présentes chez l'utilisateur
      const merged = defaultPreferences.map(defaultPref => {
        const userPref = userPrefMap.get(defaultPref.id);
        if (userPref) {
          return userPref;
        }
        return {
          ...defaultPref,
          created_at: new Date().toISOString()
        };
      });

      // Ajouter les préférences utilisateur uniques qui ne sont pas dans les défauts
      userPreferences.forEach(userPref => {
        if (!defaultPreferences.some(dp => dp.id === userPref.id)) {
          merged.push(userPref);
        }
      });

      return merged;

    } catch (error) {
      console.error('[PreferencesService] Erreur lors de la fusion des préférences:', error);
      return defaultPreferences; // Retourner les préférences par défaut en cas d'erreur
    }
  }

  // Fonction pour exporter les préférences au format JSON
  async exportPreferences(userId: string): Promise<string> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return JSON.stringify({
        version: APP_CONFIG,
        export_date: new Date().toISOString(),
        user_id: userId.substring(0, 8) + '...', // Masquer l'ID complet
        preferences: preferences
      }, null, 2);
    } catch (error) {
      console.error('[PreferencesService] Erreur lors de l\'export des préférences:', error);
      throw new Error('Impossible d\'exporter les préférences');
    }
  }

  // Fonction pour importer des préférences
  async importPreferences(userId: string, jsonData: string): Promise<UserPreference[]> {
    try {
      const data = JSON.parse(jsonData);
      
      if (!data.preferences || !Array.isArray(data.preferences)) {
        throw new Error('Format d\'import invalide');
      }

      // Valider les préférences importées
      const importedPreferences = this.validateAndCleanPreferences(data.preferences);
      
      // Sauvegarder les préférences validées
      await this.saveUserPreferences(userId, importedPreferences);
      
      return importedPreferences;

    } catch (error) {
      console.error('[PreferencesService] Erreur lors de l\'import des préférences:', error);
      throw new Error('Import échoué: ' + (error instanceof Error ? error.message : 'Format invalide'));
    }
  }
}

// Singleton export
export const preferencesService = new PreferencesService();
export default preferencesService;