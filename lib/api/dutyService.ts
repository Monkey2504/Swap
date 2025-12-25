
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { Duty, CreateDutyDTO } from '../../types';

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
    
    if (error) {
      console.error("[DutyService] Erreur de récupération:", error);
      throw error;
    }
    return data || [];
  }

  async createDuty(duty: CreateDutyDTO): Promise<Duty> {
    const client = this.checkConfig();
    const { data, error } = await client
      .from('duties')
      .insert(duty)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async createDuties(duties: CreateDutyDTO[]): Promise<Duty[]> {
    const client = this.checkConfig();
    const { data, error } = await client
      .from('duties')
      .insert(duties)
      .select();
    
    if (error) throw error;
    return data || [];
  }

  async updateDuty(id: string, updates: Partial<Duty>): Promise<Duty> {
    const client = this.checkConfig();
    const { data, error } = await client
      .from('duties')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteDuty(id: string) {
    const client = this.checkConfig();
    const { error } = await client
      .from('duties')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
}

export const dutyService = new DutyService();
