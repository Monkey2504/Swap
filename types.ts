
export enum PreferenceLevel {
  LIKE = 'LIKE',
  NEUTRAL = 'NEUTRAL',
  DISLIKE = 'DISLIKE'
}

export type DepotRole = 'Conducteur' | 'Chef de train' | 'Chef de bord' | 'Flottant';
// Added DepotCode to types.ts to fix import error in AppContext.tsx
export type DepotCode = string;

export interface Station {
  code: string;
  name: string;
  type: 'station' | 'depot';
  uicCode: string | null;
}

export interface UserPreference {
  id: string;
  category: 'content' | 'planning' | 'location' | 'relation' | 'station_time';
  label: string;
  value: string;
  level: PreferenceLevel;
  priority: number;
  description?: string;
}

export interface Duty {
  id: string;
  user_id?: string;
  code: string;
  type: 'Omnibus' | 'IC' | 'L' | 'P' | 'S' | 'R' | 'VK' | 'CW' | 'RT' | 'ZM' | 'FL' | 'MA';
  relations: string[];
  compositions: string[];
  destinations: string[];
  startTime: string;
  endTime: string;
  date: string;
  duration?: number;
  isNightShift?: boolean;
  // Added properties to fix missing property errors in SwapBoard and hooks
  depot?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DutyWithSwapStatus extends Duty {
  status?: 'draft' | 'published' | 'swapped';
  swapStatus?: 'pending' | 'in_progress' | 'completed';
  isSynced?: boolean;
}

export interface DutyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  duty: Duty;
}

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
  preferences: UserPreference[];
  rgpdConsent: boolean;
  role?: string;
  onboardingCompleted: boolean;
  createdAt?: string;
  lastLogin?: string;
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
  type?: 'manual_request' | 'suggested';
}

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