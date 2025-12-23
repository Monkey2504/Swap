
import { getSupabase, isSupabaseConfigured } from '../supabase';
import { SwapOffer, UserPreference, UserProfile, Duty, RealtimeSwapPayload, SwapRequest } from '../../types';
import { matchSwaps as matchWithAI } from '../../services/geminiService';

class SwapService {
  private checkConfig() {
    const client = getSupabase();
    if (!isSupabaseConfigured() || !client) {
      throw new Error('Service de bourse aux échanges indisponible.');
    }
    return client;
  }

  async getAvailableSwaps(
    depot?: string, 
    excludeUserId?: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<SwapOffer[]> {
    const client = this.checkConfig();
    
    let query = client
      .from('swap_offers')
      .select(`
        *,
        swap_requests(count)
      `)
      .eq('status', 'active');

    if (depot) {
      query = query.eq('depot', depot);
    }

    if (excludeUserId) {
      query = query.neq('user_id', excludeUserId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return (data || []).map(item => this.mapToSwapOffer(item));
  }

  private mapToSwapOffer(item: any): SwapOffer {
    const nameParts = (item.user_name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Agent';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'SNCB';

    return {
      id: item.id,
      user: { 
        firstName, 
        lastName, 
        sncbId: item.user_sncb_id 
      },
      offeredDuty: item.duty_data,
      matchScore: 0,
      matchReasons: [],
      matchType: 'simple',
      status: 'pending_colleague',
      type: item.is_urgent ? 'manual_request' : 'suggested',
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

  subscribeToSwaps(depot: string, onNewSwap: (offer: RealtimeSwapPayload) => void) {
    const client = this.checkConfig();
    
    const channel = client
      .channel(`swaps-${depot}-${Date.now()}`) 
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'swap_offers',
        filter: `depot=eq.${depot}`
      }, (payload) => onNewSwap(payload.new as RealtimeSwapPayload))
      .subscribe();

    return {
      unsubscribe: () => client.removeChannel(channel)
    };
  }

  async matchSwaps(preferences: UserPreference[], offers: SwapOffer[]) {
    try {
      return await matchWithAI(preferences, offers);
    } catch (err) {
      console.warn("[SwapService] Fallback Matching Local Heuristique");
      
      const likeTypes = preferences.filter(p => p.level === 'LIKE').map(p => p.value);
      const dislikeTypes = preferences.filter(p => p.level === 'DISLIKE').map(p => p.value);

      return offers.map(o => {
        let score = 50;
        const reasons = ["Heuristique SNCB"];
        
        if (likeTypes.includes(o.offeredDuty.type)) { score += 25; reasons.push(`Type ${o.offeredDuty.type} apprécié`); }
        if (dislikeTypes.includes(o.offeredDuty.type)) { score -= 30; reasons.push(`Type ${o.offeredDuty.type} non souhaité`); }
        if (o.type === 'manual_request') { score += 15; reasons.push("Besoin urgent"); }

        return { ...o, matchScore: Math.max(0, Math.min(100, score)), matchReasons: reasons };
      });
    }
  }
}

export const swapService = new SwapService();
