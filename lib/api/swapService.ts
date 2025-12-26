
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { SwapOffer, UserPreference, UserProfile, Duty, SwapRequest } from '../../types';
import { matchSwaps as matchWithAI } from '../../services/geminiService';

class SwapService {
  private checkConfig() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Service de bourse aux échanges indisponible.');
    }
    return client;
  }

  async getAvailableSwaps(depot?: string, excludeUserId?: string): Promise<SwapOffer[]> {
    const client = this.checkConfig();
    let query = client
      .from('swap_offers')
      .select('*, swap_requests(count)')
      .eq('status', 'active');

    if (depot) query = query.eq('depot', depot);
    if (excludeUserId) query = query.neq('user_id', excludeUserId);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(item => this.mapToSwapOffer(item));
  }

  async getMyOffersWithRequests(userId: string): Promise<any[]> {
    const client = this.checkConfig();
    const { data, error } = await client
      .from('swap_offers')
      .select('*, swap_requests(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data || [];
  }

  private mapToSwapOffer(item: any): SwapOffer {
    return {
      id: item.id,
      user: { 
        id: item.user_id,
        firstName: item.user_name?.split(' ')[0] || 'Agent', 
        lastName: item.user_name?.split(' ').slice(1).join(' ') || 'SNCB', 
        sncbId: item.user_sncb_id 
      },
      offeredDuty: item.duty_data,
      matchScore: 0,
      matchReasons: [],
      status: item.status,
      isUrgent: item.is_urgent,
      requestCount: item.swap_requests?.[0]?.count || 0
    };
  }

  async publishForSwap(user: UserProfile, duty: Duty, isUrgent: boolean = false) {
    const client = this.checkConfig();
    const { error } = await client
      .from('swap_offers')
      .insert({
        user_id: user.id,
        user_sncb_id: user.sncbId,
        user_name: `${user.firstName} ${user.lastName}`.trim(),
        depot: user.depot,
        duty_data: duty,
        is_urgent: isUrgent,
        status: 'active'
      });
    if (error) throw error;
  }

  async sendSwapRequest(offerId: string, user: UserProfile): Promise<void> {
    const client = this.checkConfig();
    const { error } = await client
      .from('swap_requests')
      .insert({
        offer_id: offerId,
        requester_id: user.id,
        requester_name: `${user.firstName} ${user.lastName}`.trim(),
        status: 'pending'
      });
    if (error) {
      if (error.code === '23505') throw new Error("Vous avez déjà postulé à cette offre.");
      throw error;
    }
  }

  async acceptSwapRequest(offerId: string, requestId: string): Promise<void> {
    const client = this.checkConfig();
    // 1. Accepter la requête choisie
    const { error: err1 } = await client
      .from('swap_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);
    if (err1) throw err1;

    // 2. Marquer l'offre comme "en attente TS"
    const { error: err2 } = await client
      .from('swap_offers')
      .update({ status: 'pending_ts' })
      .eq('id', offerId);
    if (err2) throw err2;

    // 3. Refuser les autres requêtes automatiquement
    await client
      .from('swap_requests')
      .update({ status: 'rejected' })
      .eq('offer_id', offerId)
      .neq('id', requestId);
  }

  async deleteOffer(offerId: string) {
    const client = this.checkConfig();
    const { error } = await client.from('swap_offers').delete().eq('id', offerId);
    if (error) throw error;
  }

  subscribeToSwaps(callback: () => void) {
    const client = this.checkConfig();
    return client
      .channel('public:swaps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_offers' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swap_requests' }, callback)
      .subscribe();
  }

  async matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
    try {
      return await matchWithAI(preferences, offers);
    } catch (err) {
      return offers.map(o => ({ ...o, matchScore: 75, matchReasons: ["Matching Standard"] }));
    }
  }
}

export const swapService = new SwapService();
