
export enum PreferenceLevel {
  LIKE = 'LIKE',
  NEUTRAL = 'NEUTRAL',
  DISLIKE = 'DISLIKE'
}

export type DepotRole = 'Conducteur' | 'Chef de train' | 'Chef de bord' | 'Flottant';
export type DepotCode = string;

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'swap_request';
  read: boolean;
  createdAt: string;
  link?: string;
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
  relations?: string[];
  compositions?: string[];
  destinations: string[];
  start_time: string;
  end_time: string;
  date: string;
  duration?: number;
  isNightShift?: boolean;
}

export interface UserProfile {
  id: string;
  sncbId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  depot: string;
  onboardingCompleted: boolean;
  role?: string;
  series?: string;
  position?: string;
  isFloating?: boolean;
  currentDuties?: Duty[];
  preferences?: UserPreference[];
  rgpdConsent?: boolean;
  createdAt?: string;
  lastLogin?: string;
}

export interface SwapOffer {
  id: string;
  offeredDuty: Duty;
  user: Partial<UserProfile>;
  matchScore: number;
  matchReasons: string[];
  status: 'active' | 'pending_ts' | 'completed' | 'cancelled' | 'pending_colleague';
  isUrgent?: boolean;
  matchType?: string;
  type?: 'manual_request' | 'suggested';
  requestCount?: number;
}

export interface Station {
  code: string;
  name: string;
  type: 'station' | 'depot';
  uicCode: string | null;
}

export type CreateDutyDTO = Omit<Duty, 'id'>;

export interface DutyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  duty: Duty;
}

export interface DutyWithSwapStatus extends Duty {
  swapStatus?: string;
}

export interface RealtimeSwapPayload {
  [key: string]: any;
}

export interface SwapRequest {
  id: string;
  offer_id: string;
  requester_id: string;
  requester_name: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at?: string;
}
