
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { Duty, CreateDutyDTO } from '../../types';
import { formatError } from './index';

class DutyService {
  private checkConfig() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Cloud SNCB non configuré.');
    }
    return client;
  }

  async getUserDuties(userId: string): Promise<Duty[]> {
    const client = this.checkConfig();
    const { data, error } = await client
      .from('duties')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Utilise UPSERT pour éviter les doublons basés sur la contrainte (user_id, date, code)
   */
  async createDuties(duties: CreateDutyDTO[]): Promise<Duty[]> {
    const client = this.checkConfig();
    const { data, error } = await client
      .from('duties')
      .upsert(duties, { 
        onConflict: 'user_id,date,code',
        ignoreDuplicates: false // Mettre à jour si ça existe déjà
      })
      .select();
    
    if (error) {
      console.error("[DutyService] Erreur Sync Roster:", formatError(error));
      throw error;
    }
    return data || [];
  }

  async createDuty(duty: CreateDutyDTO): Promise<Duty> {
    const result = await this.createDuties([duty]);
    return result[0];
  }

  async deleteDuty(id: string) {
    const client = this.checkConfig();
    const { error } = await client.from('duties').delete().eq('id', id);
    if (error) throw error;
  }
}

export const dutyService = new DutyService();
