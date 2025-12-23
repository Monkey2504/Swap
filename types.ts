
export enum PreferenceLevel {
  LIKE = 'LIKE',
  NEUTRAL = 'NEUTRAL',
  DISLIKE = 'DISLIKE'
}

export interface UserPreference {
  id: string;
  category: 'content' | 'planning' | 'location';
  label: string;
  value: string;
  level: PreferenceLevel;
  priority: number; // Utilisé pour l'ordre dans la colonne
  description?: string;
}

export interface Duty {
  id: string;
  user_id?: string;
  code: string;
  type: 'Omnibus' | 'IC' | 'L' | 'P' | 'S';
  relations: string[];
  compositions: string[];
  destinations: string[];
  startTime: string;
  endTime: string;
  date: string;
  dayOfWeek?: string;
  depot?: string;
}

// Added missing DTO for duty creation operations
export type CreateDutyDTO = Omit<Duty, 'id'>;

export interface UserProfile {
  id: string;
  sncbId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  depot: string;
  series: string;
  position: string;
  isFloating: boolean;
  currentDuties: Duty[];
  rgpdConsent: boolean;
  role?: string;
  onboardingCompleted: boolean;
}

export type SwapMatchType = 'simple' | 'block' | 'patchwork';
export type SwapStatus = 'pending_colleague' | 'accepted_colleague' | 'pending_ts' | 'validated_ts' | 'refused';

export interface SwapOffer {
  id: string;
  offeredDuty: Duty;
  requestedDuty?: Duty;
  user: Partial<UserProfile>;
  matchScore: number;
  matchReasons: string[];
  matchType: SwapMatchType;
  status: SwapStatus;
  requestCount?: number;
  // Added type property to identify manual requests vs suggested ones
  type?: 'manual_request' | 'suggested';
}

// Added missing SwapRequest interface for swap intentions
export interface SwapRequest {
  id: string;
  offer_id: string;
  requester_id: string;
  requester_name: string;
  status: 'pending' | 'accepted' | 'refused';
  created_at: string;
}

export interface RealtimeSwapPayload {
  id: string;
  user_id: string;
  user_sncb_id: string;
  user_name: string;
  depot: string;
  duty_data: Duty;
  status: string;
  is_urgent: boolean;
  created_at: string;
}
