import { getSupabase, isSupabaseConfigured } from '../supabase';
import { Duty, CreateDutyDTO, DutyWithSwapStatus } from '../../types';
import { formatError } from './index';
import { APP_CONFIG, ERROR_MESSAGES } from '../constants';

class DutyService {
  private retryCount = 0;
  private maxRetries = APP_CONFIG.RETRY_ATTEMPTS;
  private retryDelay = APP_CONFIG.RETRY_DELAY_MS;

  private checkConfig() {
    try {
      const client = getSupabase();
      if (!isSupabaseConfigured() || !client) {
        throw new Error('Service Cloud SNCB non configuré. Vérifiez la connexion.');
      }
      return client;
    } catch (error) {
      console.error('[DutyService] Configuration manquante:', error);
      throw new Error(ERROR_MESSAGES.API_ERROR);
    }
  }

  async getUserDuties(userId: string, options: { page?: number; limit?: number } = {}): Promise<DutyWithSwapStatus[]> {
    const { page = 1, limit = 50 } = options;
    
    try {
      const client = this.checkConfig();
      
      console.log(`[DutyService] Récupération des services pour l'utilisateur ${userId.substring(0, 8)}..., page ${page}`);
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await client
        .from('duties')
        .select('*, swaps:swaps(*)', { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .range(from, to);

      if (error) {
        console.error('[DutyService] Erreur lors de la récupération:', formatError(error));
        throw this.formatSupabaseError(error);
      }

      console.log(`[DutyService] ${data?.length || 0} services récupérés (total: ${count})`);
      
      // Ajouter le statut d'échange à chaque service
      const dutiesWithSwapStatus: DutyWithSwapStatus[] = (data || []).map(duty => ({
        ...duty,
        swapStatus: this.calculateSwapStatus(duty.swaps),
        hasActiveSwap: this.hasActiveSwap(duty.swaps)
      }));

      return dutiesWithSwapStatus;

    } catch (error) {
      console.error('[DutyService] Erreur critique lors de la récupération:', error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[DutyService] Nouvelle tentative (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * this.retryCount));
        return this.getUserDuties(userId, options);
      }
      
      this.retryCount = 0;
      throw error;
    }
  }

  /**
   * Utilise UPSERT pour éviter les doublons basés sur la contrainte (user_id, date, code)
   */
  async createDuties(duties: CreateDutyDTO[]): Promise<Duty[]> {
    try {
      if (!duties || duties.length === 0) {
        console.warn('[DutyService] Aucun service à créer');
        return [];
      }

      const client = this.checkConfig();

      // Validation des données
      const validDuties = duties.filter(duty => this.validateDutyData(duty));
      
      if (validDuties.length === 0) {
        throw new Error('Aucune donnée de service valide à enregistrer.');
      }

      console.log(`[DutyService] Synchronisation de ${validDuties.length} services...`);

      const { data, error } = await client
        .from('duties')
        .upsert(validDuties, { 
          onConflict: 'user_id,date,code',
          ignoreDuplicates: false // Mettre à jour si ça existe déjà
        })
        .select();

      if (error) {
        console.error("[DutyService] Erreur de synchronisation:", formatError(error));
        throw this.formatSupabaseError(error);
      }

      console.log(`[DutyService] ${data?.length || 0} services synchronisés avec succès`);
      return data || [];

    } catch (error) {
      console.error('[DutyService] Erreur lors de la création groupée:', error);
      
      // Retry logic for batch operations
      if (this.retryCount < this.maxRetries && duties.length > 0) {
        this.retryCount++;
        console.log(`[DutyService] Nouvelle tentative batch (${this.retryCount}/${this.maxRetries})...`);
        
        // Diviser le batch en plus petits morceaux en cas d'erreur
        const chunkSize = Math.ceil(duties.length / 2);
        const chunks = [];
        
        for (let i = 0; i < duties.length; i += chunkSize) {
          chunks.push(duties.slice(i, i + chunkSize));
        }
        
        const results = [];
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay));
          try {
            const chunkResult = await this.createDuties(chunk);
            results.push(...chunkResult);
          } catch (chunkError) {
            console.error('[DutyService] Erreur sur un chunk:', chunkError);
          }
        }
        
        this.retryCount = 0;
        return results;
      }
      
      this.retryCount = 0;
      throw error;
    }
  }

  async createDuty(duty: CreateDutyDTO): Promise<Duty> {
    try {
      console.log('[DutyService] Création d\'un nouveau service...');
      
      // Validation
      if (!this.validateDutyData(duty)) {
        throw new Error('Données de service invalides');
      }

      const result = await this.createDuties([duty]);
      
      if (!result || result.length === 0) {
        throw new Error('Échec de la création du service');
      }

      console.log('[DutyService] Service créé avec succès:', result[0].id);
      return result[0];

    } catch (error) {
      console.error('[DutyService] Erreur lors de la création d\'un service:', error);
      throw error;
    }
  }

  async deleteDuty(id: string): Promise<void> {
    try {
      const client = this.checkConfig();
      
      console.log(`[DutyService] Suppression du service ${id}...`);
      
      const { error } = await client
        .from('duties')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[DutyService] Erreur lors de la suppression:', formatError(error));
        throw this.formatSupabaseError(error);
      }

      console.log('[DutyService] Service supprimé avec succès');

    } catch (error) {
      console.error('[DutyService] Erreur lors de la suppression d\'un service:', error);
      throw error;
    }
  }

  async batchDeleteDuties(ids: string[]): Promise<void> {
    try {
      if (!ids || ids.length === 0) {
        return;
      }

      const client = this.checkConfig();
      
      console.log(`[DutyService] Suppression groupée de ${ids.length} services...`);
      
      const { error } = await client
        .from('duties')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('[DutyService] Erreur lors de la suppression groupée:', formatError(error));
        throw this.formatSupabaseError(error);
      }

      console.log('[DutyService] Services supprimés avec succès');

    } catch (error) {
      console.error('[DutyService] Erreur lors de la suppression groupée:', error);
      
      // Retry with smaller batches
      if (ids.length > 1) {
        console.log('[DutyService] Tentative de suppression par petits lots...');
        
        const chunkSize = Math.ceil(ids.length / 3);
        for (let i = 0; i < ids.length; i += chunkSize) {
          const chunk = ids.slice(i, i + chunkSize);
          try {
            await this.batchDeleteDuties(chunk);
          } catch (chunkError) {
            console.error('[DutyService] Erreur sur un chunk de suppression:', chunkError);
          }
        }
      } else {
        throw error;
      }
    }
  }

  async clearUserDuties(userId: string): Promise<void> {
    try {
      const client = this.checkConfig();
      
      console.log(`[DutyService] Nettoyage de tous les services pour l'utilisateur ${userId.substring(0, 8)}...`);
      
      const { error } = await client
        .from('duties')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[DutyService] Erreur lors du nettoyage:', formatError(error));
        throw this.formatSupabaseError(error);
      }

      console.log('[DutyService] Services nettoyés avec succès');

    } catch (error) {
      console.error('[DutyService] Erreur lors du nettoyage des services:', error);
      throw error;
    }
  }

  private validateDutyData(duty: CreateDutyDTO): boolean {
    try {
      if (!duty.user_id || !duty.date || !duty.start_time || !duty.end_time) {
        console.warn('[DutyService] Données manquantes:', duty);
        return false;
      }

      // Validation du format de date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(duty.date)) {
        console.warn('[DutyService] Format de date invalide:', duty.date);
        return false;
      }

      // Validation des heures (format HHMM)
      const timeRegex = /^([01][0-9]|2[0-3])[0-5][0-9]$/;
      if (!timeRegex.test(duty.start_time) || !timeRegex.test(duty.end_time)) {
        console.warn('[DutyService] Format d\'heure invalide:', duty.start_time, duty.end_time);
        return false;
      }

      // Vérifier que l'heure de fin est après l'heure de début
      const startHour = parseInt(duty.start_time.slice(0, 2));
      const startMinute = parseInt(duty.start_time.slice(2));
      const endHour = parseInt(duty.end_time.slice(0, 2));
      const endMinute = parseInt(duty.end_time.slice(2));

      const startTotal = startHour * 60 + startMinute;
      const endTotal = endHour * 60 + endMinute;

      if (endTotal <= startTotal) {
        console.warn('[DutyService] Heure de fin doit être après heure de début:', duty);
        return false;
      }

      return true;

    } catch (error) {
      console.error('[DutyService] Erreur lors de la validation:', error);
      return false;
    }
  }

  private formatSupabaseError(error: any): Error {
    const message = error.message || 'Erreur de base de données';
    
    switch (error.code) {
      case 'PGRST116':
        return new Error('Aucune donnée trouvée');
      case '23505':
        return new Error('Ce service existe déjà');
      case '42501':
        return new Error('Permission refusée. Contactez votre administrateur.');
      case '57014':
        return new Error('Requête trop longue. Veuillez réduire la quantité de données.');
      default:
        return new Error(`${message} (Code: ${error.code || 'N/A'})`);
    }
  }

  private calculateSwapStatus(swaps: any[] = []): string {
    if (!swaps || swaps.length === 0) {
      return 'available';
    }

    const activeSwap = swaps.find(swap => 
      swap.status === 'pending' || swap.status === 'approved'
    );

    if (activeSwap) {
      return activeSwap.status === 'approved' ? 'swapped' : 'pending';
    }

    return 'available';
  }

  private hasActiveSwap(swaps: any[] = []): boolean {
    return swaps?.some(swap => 
      swap.status === 'pending' || swap.status === 'approved'
    ) || false;
  }
}

// Singleton export
export const dutyService = new DutyService();
export default dutyService;