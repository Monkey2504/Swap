
export enum PreferenceLevel {
  LIKE = 'LIKE',
  NEUTRAL = 'NEUTRAL',
  DISLIKE = 'DISLIKE'
}

export interface UserPreference {
  id: string;
  category: 'content' | 'planning';
  label: string;
  value: string;
  level: PreferenceLevel;
  priority: number;
}

export interface Duty {
  id: string;
  code: string; // e.g., "S123"
  type: 'Omnibus' | 'IC' | 'L' | 'P';
  relations: string[]; // e.g., ["24", "38"]
  compositions: string[]; // e.g., ["AM", "M7"]
  destinations: string[];
  startTime: string;
  endTime: string;
  date: string;
}

export interface UserProfile {
  id: string;
  sncbId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  depot: string;
  series: string;
  position: string;
  isFloating: boolean;
  currentDuties: Duty[];
}

export interface SwapOffer {
  id: string;
  offeredDuty: Duty;
  requestedDuty?: Duty;
  user: Partial<UserProfile>;
  matchScore: number;
  matchReasons: string[];
  type: 'suggested' | 'manual_request';
}

export interface ManualSwapRequest {
  id: string;
  date: string;
  notes: string;
  preferredType?: string;
}
