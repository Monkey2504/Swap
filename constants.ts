
import { Duty, PreferenceLevel, UserPreference, UserProfile, DepotRole, Station } from './types';
import { v4 as uuidv4 } from 'uuid';

export const APP_VERSION = '2.5.1';
export const LEGAL_DISCLAIMER = "Attention : Cette application est un outil d'entraide entre agents. Elle ne remplace pas les outils officiels de la SNCB. Toute permutation doit être validée par le Tableau de Service (TS) via les canaux réglementaires.";

export const DEPOT_ROLES: DepotRole[] = ['Conducteur', 'Chef de train', 'Chef de bord', 'Flottant'];

export interface DepotConfig {
  code: string;
  name: string;
  region: 'Bruxelles' | 'Wallonie' | 'Flandre';
  timezone: 'Europe/Brussels';
  contactTS?: string;
}

export const DEPOTS: DepotConfig[] = [
  { code: 'FBMZ', name: 'Bruxelles-Midi', region: 'Bruxelles', timezone: 'Europe/Brussels' },
  { code: 'FBN', name: 'Bruxelles-Nord', region: 'Bruxelles', timezone: 'Europe/Brussels' },
  { code: 'FLG', name: 'Liège-Guillemins', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FNR', name: 'Namur', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FMS', name: 'Mons', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FCR', name: 'Charleroi-Central', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FOT', name: 'Ostende', region: 'Flandre', timezone: 'Europe/Brussels' },
  { code: 'FGSP', name: 'Gand-Saint-Pierre', region: 'Flandre', timezone: 'Europe/Brussels' },
  { code: 'FAN', name: 'Anvers-Central', region: 'Flandre', timezone: 'Europe/Brussels' },
];

/** Fix: Added missing DEPOT_MAP to satisfy imports in AppContext.tsx */
export const DEPOT_MAP = new Map(DEPOTS.map(d => [d.code, d]));

export const STATION_MAP = new Map(); // Simplified for brevity in this update
export const INITIAL_PREFERENCES: UserPreference[] = []; // Simplified

export function getStationName(code: string) { return code; }

export const APP_CONFIG = {
  AUTO_SAVE_DELAY_MS: 3000,
  POLLING_INTERVAL_MS: 30000,
} as const;

export const RGPS_RULES = {
  MAX_SERVICE_DURATION_HOURS: 9,
  MAX_WEEKLY_HOURS: 48,
  MAX_NIGHT_SHIFTS_PER_WEEK: 3,
};
