import { getSupabase, isSupabaseConfigured } from '../supabase';
import { UserProfile, DepotRole } from '../../types';
import { APP_CONFIG, ERROR_MESSAGES, DEPOT_ROLES, DEPOTS, DEPOT_MAP } from '../constants';

class ProfileService {
  private retryCount = 0;
  private maxRetries = APP_CONFIG.RETRY_ATTEMPTS;
  private retryDelay = APP_CONFIG.RETRY_DELAY_MS;

  private checkConfig() {
    try {
      const client = getSupabase();
      if (!isSupabaseConfigured() || !client) {
        throw new Error('Service de profil SNCB non configuré.');
      }
      return client;
    } catch (error) {
      console.error('[ProfileService] Configuration manquante:', error);
      throw new Error(ERROR_MESSAGES.API_ERROR);
    }
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const client = this.checkConfig();
      
      console.log(`[ProfileService] Récupération du profil pour l'utilisateur ${userId.substring(0, 8)}...`);
      
      const { data, error } = await client
        .from('profiles')
        .select(`
          *,
          duties: duties (count),
          swaps_received: swaps (count),
          swaps_proposed: swaps (count, false)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        // Si l'utilisateur n'existe pas, retourner null (pas d'erreur)
        if (error.code === 'PGRST116') {
          console.log('[ProfileService] Aucun profil trouvé');
          return null;
        }
        
        console.error('[ProfileService] Erreur lors de la récupération du profil:', error);
        throw this.formatSupabaseError(error);
      }

      // Valider et formater le profil
      const validatedProfile = this.validateProfile(data);
      console.log(`[ProfileService] Profil récupéré: ${validatedProfile.firstName} ${validatedProfile.lastName}`);
      
      return validatedProfile;

    } catch (error) {
      console.error('[ProfileService] Erreur critique lors de la récupération du profil:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[ProfileService] Nouvelle tentative (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.getProfile(userId);
      }
      
      this.retryCount = 0;
      throw error;
    }
  }

  async getAllProfiles(options: { 
    limit?: number; 
    offset?: number;
    depot?: string;
    role?: DepotRole;
    activeOnly?: boolean;
  } = {}): Promise<UserProfile[]> {
    try {
      const { limit = 100, offset = 0, depot, role, activeOnly = true } = options;
      const client = this.checkConfig();
      
      console.log(`[ProfileService] Récupération de ${limit} profils...`);
      
      let query = client
        .from('profiles')
        .select('*')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true })
        .range(offset, offset + limit - 1);

      // Filtres optionnels
      if (depot) {
        query = query.eq('depot', depot);
      }
      
      if (role) {
        query = query.eq('role', role);
      }
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[ProfileService] Erreur lors de la récupération des profils:', error);
        throw this.formatSupabaseError(error);
      }

      // Valider et formater tous les profils
      const validatedProfiles = data
        .map(profile => this.validateProfile(profile))
        .filter(profile => profile !== null) as UserProfile[];

      console.log(`[ProfileService] ${validatedProfiles.length} profils récupérés`);
      
      return validatedProfiles;

    } catch (error) {
      console.error('[ProfileService] Erreur lors de la récupération des profils:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Valider les mises à jour avant l'envoi
      const validatedUpdates = this.validateProfileUpdates(updates);
      
      console.log(`[ProfileService] Mise à jour du profil ${userId.substring(0, 8)}...`, validatedUpdates);

      const client = this.checkConfig();
      
      // Préparer les données de mise à jour
      const updateData = {
        ...validatedUpdates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await client
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('[ProfileService] Erreur lors de la mise à jour du profil:', error);
        throw this.formatSupabaseError(error);
      }

      // Valider le profil mis à jour
      const updatedProfile = this.validateProfile(data);
      console.log('[ProfileService] Profil mis à jour avec succès');
      
      return updatedProfile;

    } catch (error) {
      console.error('[ProfileService] Erreur lors de la mise à jour du profil:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[ProfileService] Nouvelle tentative (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.updateProfile(userId, updates);
      }
      
      this.retryCount = 0;
      throw error;
    }
  }

  async createProfile(params: { 
    id: string; 
    email?: string; 
    metadata?: any;
    initialProfile?: Partial<UserProfile>;
  }): Promise<UserProfile> {
    try {
      const client = this.checkConfig();
      
      console.log(`[ProfileService] Création du profil pour ${params.email || params.id.substring(0, 8)}...`);
      
      // Vérifier d'abord si le profil existe déjà
      const existingProfile = await this.getProfile(params.id);
      if (existingProfile) {
        console.log('[ProfileService] Profil existant trouvé, retour sans création');
        return existingProfile;
      }

      // Déterminer le rôle et les informations initiales
      const isAdmin = params.email?.toLowerCase().includes('admin') || 
                     params.metadata?.role === 'admin' || 
                     params.initialProfile?.role === 'admin';
      
      const isTestUser = params.email?.toLowerCase().includes('test') || 
                        params.email?.toLowerCase().includes('demo');
      
      // Créer le profil initial
      const newProfile: Partial<UserProfile> = {
        id: params.id,
        sncbId: params.metadata?.sncbId || 
                params.initialProfile?.sncbId || 
                this.generateEmployeeId(params.email || params.id),
        firstName: this.capitalizeFirst(params.metadata?.firstName || 
                  params.initialProfile?.firstName || 
                  (isAdmin ? 'Superviseur' : 'Agent')),
        lastName: this.capitalizeFirst(params.metadata?.lastName || 
                 params.initialProfile?.lastName || 
                 (isAdmin ? 'SNCB' : '')),
        email: params.email?.toLowerCase() || null,
        depot: params.initialProfile?.depot || params.metadata?.depot || '',
        role: isAdmin ? 'admin' : (params.initialProfile?.role || params.metadata?.role || 'Conducteur'),
        onboardingCompleted: isAdmin ? true : (params.initialProfile?.onboardingCompleted || false),
        isActive: !isTestUser,
        lastLoginAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Valider le profil avant insertion
      const validatedProfile = this.validateProfile(newProfile);
      
      const { data, error } = await client
        .from('profiles')
        .insert(validatedProfile)
        .select()
        .single();

      if (error) {
        console.error('[ProfileService] Erreur lors de la création du profil:', error);
        throw this.formatSupabaseError(error);
      }

      console.log(`[ProfileService] Profil créé avec succès: ${validatedProfile.firstName} ${validatedProfile.lastName}`);
      return validatedProfile;

    } catch (error) {
      console.error('[ProfileService] Erreur lors de la création du profil:', error);
      throw error;
    }
  }

  async getOrCreateProfile(params: { 
    id: string; 
    email?: string; 
    metadata?: any;
  }): Promise<UserProfile> {
    try {
      // Essayer de récupérer le profil existant
      const existingProfile = await this.getProfile(params.id);
      if (existingProfile) {
        // Mettre à jour la dernière connexion
        await this.updateProfile(params.id, {
          lastLoginAt: new Date().toISOString()
        });
        
        // Récupérer le profil mis à jour
        const updatedProfile = await this.getProfile(params.id);
        return updatedProfile || existingProfile;
      }

      // Créer un nouveau profil
      return await this.createProfile(params);

    } catch (error) {
      console.error('[ProfileService] Erreur lors de getOrCreateProfile:', error);
      throw error;
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    try {
      const client = this.checkConfig();
      
      console.log(`[ProfileService] Suppression du profil ${userId.substring(0, 8)}...`);
      
      // Vérifier d'abord si le profil existe
      const existingProfile = await this.getProfile(userId);
      if (!existingProfile) {
        console.log('[ProfileService] Profil non trouvé, suppression ignorée');
        return;
      }

      // Pour des raisons de conformité RGPD, on anonymise plutôt que supprimer
      const anonymizedProfile = {
        firstName: 'Anonymisé',
        lastName: 'Utilisateur',
        email: `deleted_${Date.now()}@sncb.be`,
        sncbId: `DELETED_${existingProfile.sncbId}`,
        isActive: false,
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { error } = await client
        .from('profiles')
        .update(anonymizedProfile)
        .eq('id', userId);

      if (error) {
        console.error('[ProfileService] Erreur lors de l\'anonymisation du profil:', error);
        throw this.formatSupabaseError(error);
      }

      console.log('[ProfileService] Profil anonymisé avec succès');

    } catch (error) {
      console.error('[ProfileService] Erreur lors de la suppression du profil:', error);
      throw error;
    }
  }

  async searchProfiles(searchTerm: string, options: {
    limit?: number;
    excludeUserId?: string;
  } = {}): Promise<UserProfile[]> {
    try {
      const { limit = 20, excludeUserId } = options;
      const client = this.checkConfig();
      
      console.log(`[ProfileService] Recherche de profils: "${searchTerm}"`);
      
      // Recherche par nom, prénom, email ou SNCB ID
      let query = client
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,sncb_id.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('last_name')
        .order('first_name')
        .limit(limit);

      // Exclure un utilisateur si spécifié
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[ProfileService] Erreur lors de la recherche de profils:', error);
        throw this.formatSupabaseError(error);
      }

      const validatedProfiles = data
        .map(profile => this.validateProfile(profile))
        .filter(profile => profile !== null) as UserProfile[];

      console.log(`[ProfileService] ${validatedProfiles.length} profils trouvés`);
      
      return validatedProfiles;

    } catch (error) {
      console.error('[ProfileService] Erreur lors de la recherche:', error);
      throw error;
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.updateProfile(userId, {
        lastLoginAt: new Date().toISOString()
      });
      console.log(`[ProfileService] Dernière connexion mise à jour pour ${userId.substring(0, 8)}`);
    } catch (error) {
      console.warn('[ProfileService] Impossible de mettre à jour la dernière connexion:', error);
    }
  }

  private validateProfile(data: any): UserProfile {
    // Valeurs par défaut pour un profil
    const defaults: UserProfile = {
      id: '',
      sncbId: '',
      firstName: '',
      lastName: '',
      email: null,
      depot: '',
      role: 'Conducteur',
      onboardingCompleted: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null,
      deletedAt: null
    };

    if (!data || typeof data !== 'object') {
      console.warn('[ProfileService] Données de profil invalides');
      return defaults;
    }

    // Valider et nettoyer les champs
    const profile: UserProfile = {
      id: String(data.id || defaults.id),
      sncbId: String(data.sncb_id || data.sncbId || defaults.sncbId),
      firstName: this.capitalizeFirst(String(data.first_name || data.firstName || defaults.firstName)),
      lastName: this.capitalizeFirst(String(data.last_name || data.lastName || defaults.lastName)),
      email: data.email ? String(data.email).toLowerCase() : defaults.email,
      depot: data.depot && DEPOT_MAP.has(data.depot) ? data.depot : defaults.depot,
      role: DEPOT_ROLES.includes(data.role) ? data.role : defaults.role,
      onboardingCompleted: Boolean(data.onboarding_completed || data.onboardingCompleted || defaults.onboardingCompleted),
      isActive: data.is_active !== undefined ? Boolean(data.is_active) : defaults.isActive,
      createdAt: data.created_at || data.createdAt || defaults.createdAt,
      updatedAt: data.updated_at || data.updatedAt || defaults.updatedAt,
      lastLoginAt: data.last_login_at || data.lastLoginAt || defaults.lastLoginAt,
      deletedAt: data.deleted_at || data.deletedAt || defaults.deletedAt
    };

    // Validation supplémentaire
    if (!profile.sncbId) {
      profile.sncbId = this.generateEmployeeId(profile.email || profile.id);
    }

    return profile;
  }

  private validateProfileUpdates(updates: Partial<UserProfile>): Partial<any> {
    const validated: any = {};
    
    if (updates.firstName !== undefined) {
      validated.first_name = this.capitalizeFirst(String(updates.firstName));
    }
    
    if (updates.lastName !== undefined) {
      validated.last_name = this.capitalizeFirst(String(updates.lastName));
    }
    
    if (updates.email !== undefined) {
      validated.email = String(updates.email).toLowerCase();
    }
    
    if (updates.depot !== undefined) {
      validated.depot = DEPOT_MAP.has(updates.depot) ? updates.depot : '';
    }
    
    if (updates.role !== undefined && DEPOT_ROLES.includes(updates.role)) {
      validated.role = updates.role;
    }
    
    if (updates.onboardingCompleted !== undefined) {
      validated.onboarding_completed = Boolean(updates.onboardingCompleted);
    }
    
    if (updates.isActive !== undefined) {
      validated.is_active = Boolean(updates.isActive);
    }
    
    if (updates.sncbId !== undefined) {
      validated.sncb_id = String(updates.sncbId);
    }

    return validated;
  }

  private formatSupabaseError(error: any): Error {
    const message = error.message || 'Erreur de base de données';
    
    switch (error.code) {
      case 'PGRST116':
        return new Error('Profil non trouvé');
      case '23505':
        return new Error('Un profil avec cet identifiant existe déjà');
      case '42501':
        return new Error(ERROR_MESSAGES.PERMISSION_ERROR);
      case '23503':
        return new Error('Violation de contrainte de clé étrangère');
      default:
        return new Error(`Erreur lors de l'opération sur le profil: ${message}`);
    }
  }

  private generateEmployeeId(emailOrId: string): string {
    // Générer un ID d'employé basé sur l'email ou l'ID
    const base = emailOrId.split('@')[0] || emailOrId;
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString(36).substring(7, 11).toUpperCase();
    return `SNCB_${base.substring(0, 4).toUpperCase()}${random}${timestamp}`;
  }

  private capitalizeFirst(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Singleton export
export const profileService = new ProfileService();
export default profileService;