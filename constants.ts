
import { Duty, PreferenceLevel, UserPreference, UserProfile, DepotRole, Station } from './types';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// VERSION & MÉTADONNÉES
// ============================================================================

export const APP_VERSION = '2.5.0';
export const BUILD_DATE = '2024-03-14';
export const MIN_SUPPORTED_BROWSER = 'Chrome 88, Firefox 85, Safari 14';

// ============================================================================
// RÔLES ET PERMISSIONS
// ============================================================================

export const DEPOT_ROLES: DepotRole[] = ['Conducteur', 'Chef de train', 'Chef de bord', 'Flottant'];

export interface DepotConfig {
  code: string;
  name: string;
  region: 'Bruxelles' | 'Wallonie' | 'Flandre';
  timezone: 'Europe/Brussels';
  contactTS?: string; // Email du Tableau de Service
}

// ============================================================================
// DÉPÔTS SNCB STANDARDISÉS
// ============================================================================

export const DEPOTS: DepotConfig[] = [
  // Bruxelles
  { code: 'FBMZ', name: 'Bruxelles-Midi', region: 'Bruxelles', timezone: 'Europe/Brussels' },
  { code: 'FBN', name: 'Bruxelles-Nord', region: 'Bruxelles', timezone: 'Europe/Brussels' },
  { code: 'FBC', name: 'Bruxelles-Central', region: 'Bruxelles', timezone: 'Europe/Brussels' },
  { code: 'FLX', name: 'Bruxelles-Luxembourg', region: 'Bruxelles', timezone: 'Europe/Brussels' },
  { code: 'FBSM', name: 'Bruxelles-Schuman', region: 'Bruxelles', timezone: 'Europe/Brussels' },
  
  // Wallonie
  { code: 'FLG', name: 'Liège-Guillemins', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FNR', name: 'Namur', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FMS', name: 'Mons', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FCR', name: 'Charleroi-Central', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FLLN', name: 'Louvain-la-Neuve', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FVI', name: 'Verviers-Central', region: 'Wallonie', timezone: 'Europe/Brussels' },
  { code: 'FTR', name: 'Tournai', region: 'Wallonie', timezone: 'Europe/Brussels' },
  
  // Flandre
  { code: 'FOT', name: 'Ostende', region: 'Flandre', timezone: 'Europe/Brussels' },
  { code: 'FGSP', name: 'Gand-Saint-Pierre', region: 'Flandre', timezone: 'Europe/Brussels' },
  { code: 'FAN', name: 'Anvers-Central', region: 'Flandre', timezone: 'Europe/Brussels' },
  { code: 'FAL', name: 'Alost', region: 'Flandre', timezone: 'Europe/Brussels' },
  { code: 'FBR', name: 'Bruges', region: 'Flandre', timezone: 'Europe/Brussels' },
  { code: 'FLE', name: 'Louvain', region: 'Flandre', timezone: 'Europe/Brussels' },
];

export const DEPOT_MAP = new Map(DEPOTS.map(d => [d.code, d]));
export const DEPOT_CODES = DEPOTS.map(d => d.code);

// ============================================================================
// STATIONS ET GARES (Complet et validé)
// ============================================================================

export const STATIONS: Station[] = [
  // Gares majeures
  { code: "FBMZ", name: "Bruxelles-Midi", type: "station", uicCode: "8814001" },
  { code: "FBN", name: "Bruxelles-Nord", type: "station", uicCode: "8814002" },
  { code: "FBC", name: "Bruxelles-Central", type: "station", uicCode: "8814003" },
  { code: "FLX", name: "Bruxelles-Luxembourg", type: "station", uicCode: "8814004" },
  { code: "FBSM", name: "Bruxelles-Schuman", type: "station", uicCode: "8814005" },
  
  // Dépôts (selon cahier des charges)
  { code: "FSD", name: "Dépôt Bruxelles-Midi", type: "depot", uicCode: null },
  { code: "FL", name: "Dépôt Liège-Guillemins", type: "depot", uicCode: null },
  { code: "FNR", name: "Dépôt Namur", type: "depot", uicCode: null },
  
  // Gares principales
  { code: "FLG", name: "Liège-Guillemins", type: "station", uicCode: "8844001" },
  { code: "FNR", name: "Namur", type: "station", uicCode: "8864000" },
  { code: "FMS", name: "Mons", type: "station", uicCode: "8874000" },
  { code: "FCR", name: "Charleroi-Central", type: "station", uicCode: "8872000" },
  { code: "FOT", name: "Ostende", type: "station", uicCode: "8891707" },
  { code: "FGSP", name: "Gand-Saint-Pierre", type: "station", uicCode: "8892007" },
  { code: "FAN", name: "Anvers-Central", type: "station", uicCode: "8821006" },
  { code: "FLLN", name: "Louvain-la-Neuve", type: "station", uicCode: "8814227" },
  
  // Autres gares importantes (sélection)
  { code: "FVI", name: "Verviers-Central", type: "station", uicCode: "8844475" },
  { code: "FTR", name: "Tournai", type: "station", uicCode: "8874632" },
  { code: "FBR", name: "Bruges", type: "station", uicCode: "8892001" },
  { code: "FLE", name: "Louvain", type: "station", uicCode: "8833001" },
  { code: "FAL", name: "Alost", type: "station", uicCode: "8894200" },
  { code: "FNT", name: "Anvers-Berchem", type: "station", uicCode: "8821004" },
  { code: "FND", name: "Anvers-Nord", type: "station", uicCode: "8821800" },
  { code: "FZ", name: "Anvers-Sud", type: "station", uicCode: "8821818" },
  
  // Gares pour les préférences "temps en gare"
  { code: "FBM", name: "Bruxelles-Midi (quais)", type: "station", uicCode: null },
  { code: "FNRM", name: "Namur (temps mort)", type: "station", uicCode: null },
  { code: "FLGM", name: "Liège-Guillemins (attente)", type: "station", uicCode: null },
];

export const STATION_MAP = new Map(STATIONS.map(s => [s.code, s]));
export const STATION_CODES = STATIONS.map(s => s.code);

// ============================================================================
// NOMENCLATURE COMPLÈTE
// ============================================================================

export const SERVICE_TYPES = [
  { code: 'IC', name: 'InterCity', description: 'Trains rapides interurbains' },
  { code: 'L', name: 'Omnibus/Local', description: 'Trains locaux, toutes gares' },
  { code: 'P', name: 'Heure de pointe', description: 'Services renforcés aux heures de pointe' },
  { code: 'S', name: 'Suburbain', description: 'Trains de banlieue' },
  { code: 'R', name: 'Réserve', description: 'Service de réserve (HSBR)' },
  { code: 'VK', name: 'Vacance', description: 'Congé payé' },
  { code: 'CW', name: 'Congé sans solde', description: 'Congé sans rémunération' },
  { code: 'RT', name: 'Récupération', description: 'Jour de récupération' },
  { code: 'ZM', name: 'Mission', description: 'Service en mission' },
  { code: 'FL', name: 'Formation', description: 'Journée de formation' },
  { code: 'MA', name: 'Maladie', description: 'Arrêt maladie' },
] as const;

export const COMPOSITIONS = [
  'AM96', 'AM08', 'M6', 'M7', 'I11', 
  'I10', 'I6', 'I8', 'MR08', 'MR96'
] as const;

export const RELATIONS = [
  { number: '24', name: 'Bruxelles-Namur-Liège', stations: ['FBMZ', 'FNR', 'FLG'] },
  { number: '38', name: 'Bruxelles-Charleroi-Mons', stations: ['FBMZ', 'FCR', 'FMS'] },
  { number: '54', name: 'Bruxelles-Ostende', stations: ['FBMZ', 'FOT'] },
  { number: '28', name: 'Namur-Liège', stations: ['FNR', 'FLG'] },
  { number: '53', name: 'Bruxelles-Gand', stations: ['FBMZ', 'FGSP'] },
  { number: '500', name: 'Ceinture Bruxelles', stations: ['FBN', 'FBSM', 'FLX'] },
  { number: '43', name: 'Anvers-Bruxelles-Charleroi', stations: ['FAN', 'FBMZ', 'FCR'] },
  { number: '36', name: 'Bruxelles-Tournai', stations: ['FBMZ', 'FTR'] },
] as const;

// ============================================================================
// RÈGLES RGPS COMPLÈTES
// ============================================================================

export const RGPS_RULES = {
  // Temps de repos
  MIN_REST_BETWEEN_SERVICES_HOURS: 11,
  MIN_REST_AFTER_NIGHT_SHIFT_HOURS: 12,
  MAX_CONSECUTIVE_WORKING_DAYS: 6,
  
  // Durées
  MAX_SERVICE_DURATION_HOURS: 9,
  MAX_WEEKLY_HOURS: 48,
  MAX_MONTHLY_HOURS: 200,
  
  // Pauses
  MIN_BREAK_AFTER_6_HOURS_MINUTES: 30,
  MIN_BREAK_AFTER_9_HOURS_MINUTES: 45,
  
  // Services de nuit
  NIGHT_SHIFT_START: '22:00',
  NIGHT_SHIFT_END: '06:00',
  MAX_NIGHT_SHIFTS_PER_WEEK: 3,
  
  // Week-end
  MIN_WEEKEND_REST_DAYS_PER_MONTH: 4,
  MAX_CONSECUTIVE_WEEKEND_WORK: 2,
  
  // Réserve (HSBR)
  MAX_RESERVE_SERVICES_PER_MONTH: 8,
  MIN_NOTICE_FOR_RESERVE_HOURS: 12,
} as const;

// ============================================================================
// SWAP - STATUTS ET CONFIGURATION
// ============================================================================

export enum SwapStatus {
  DRAFT = 'draft',                    // Brouillon
  PENDING_ACCEPTANCE = 'pending_acceptance', // En attente d'acceptation du collègue
  ACCEPTED = 'accepted',              // Accepté par le collègue
  PENDING_TS_VALIDATION = 'pending_ts_validation', // En attente validation TS
  VALIDATED = 'validated',            // Validé par le TS
  REJECTED = 'rejected',              // Refusé par le collègue
  REJECTED_BY_TS = 'rejected_by_ts',  // Refusé par le TS
  CANCELLED = 'cancelled',            // Annulé par l'initiateur
  EXPIRED = 'expired',                // Expiré (48h sans réponse)
}

export const SWAP_CONFIG = {
  MAX_PENDING_SWAPS_PER_USER: 5,
  RESPONSE_TIMEOUT_HOURS: 48,         // Délai pour répondre à une demande
  TS_VALIDATION_TIMEOUT_HOURS: 72,    // Délai pour validation TS
  MIN_SERVICE_NOTICE_DAYS: 3,         // Délai minimum avant un service pour demander un swap
  MATCHING_ALGORITHM_VERSION: '2.0',
} as const;

// ============================================================================
// PRÉFÉRENCES INITIALES (Selon cahier des charges)
// ============================================================================

export const INITIAL_PREFERENCES: UserPreference[] = [
  // Contenu des services (J'aime/Neutre/J'aime pas)
  { 
    id: generateId('pref'), 
    category: 'content', 
    label: 'Trains IC (InterCity)', 
    value: 'IC', 
    level: PreferenceLevel.LIKE, 
    priority: 3,
    description: 'Trains rapides interurbains'
  },
  { 
    id: generateId('pref'), 
    category: 'content', 
    label: 'Trains L (Omnibus/Local)', 
    value: 'L', 
    level: PreferenceLevel.NEUTRAL, 
    priority: 1,
    description: 'Trains locaux, toutes gares'
  },
  { 
    id: generateId('pref'), 
    category: 'content', 
    label: 'Services de réserve (HSBR)', 
    value: 'R', 
    level: PreferenceLevel.DISLIKE, 
    priority: 2,
    description: 'Services en réserve'
  },
  
  // Relations (selon cahier des charges)
  { 
    id: generateId('pref'), 
    category: 'relation', 
    label: 'Ligne 24 (Bruxelles-Namur-Liège)', 
    value: '24', 
    level: PreferenceLevel.LIKE, 
    priority: 2 
  },
  { 
    id: generateId('pref'), 
    category: 'relation', 
    label: 'Ligne 38 (Bruxelles-Charleroi-Mons)', 
    value: '38', 
    level: PreferenceLevel.NEUTRAL, 
    priority: 1 
  },
  { 
    id: generateId('pref'), 
    category: 'relation', 
    label: 'Ligne 54 (Bruxelles-Ostende)', 
    value: '54', 
    level: PreferenceLevel.LIKE, 
    priority: 3 
  },
  { 
    id: generateId('pref'), 
    category: 'relation', 
    label: 'Ligne 28 (Namur-Liège)', 
    value: '28', 
    level: PreferenceLevel.NEUTRAL, 
    priority: 1 
  },
  { 
    id: generateId('pref'), 
    category: 'relation', 
    label: 'Ligne 53 (Bruxelles-Gand)', 
    value: '53', 
    level: PreferenceLevel.LIKE, 
    priority: 2 
  },
  { 
    id: generateId('pref'), 
    category: 'relation', 
    label: 'Ligne 500 (Ceinture Bruxelles)', 
    value: '500', 
    level: PreferenceLevel.DISLIKE, 
    priority: 3 
  },
  
  // Temps en gare (selon cahier des charges)
  { 
    id: generateId('pref'), 
    category: 'station_time', 
    label: '> 30 min à Bruxelles-Midi', 
    value: 'FBMZ_30', 
    level: PreferenceLevel.LIKE, 
    priority: 2 
  },
  { 
    id: generateId('pref'), 
    category: 'station_time', 
    label: '> 30 min à Namur', 
    value: 'FNR_30', 
    level: PreferenceLevel.NEUTRAL, 
    priority: 1 
  },
  { 
    id: generateId('pref'), 
    category: 'station_time', 
    label: '> 30 min à Liège-Guillemins', 
    value: 'FLG_30', 
    level: PreferenceLevel.LIKE, 
    priority: 2 
  },
  { 
    id: generateId('pref'), 
    category: 'station_time', 
    label: '> 30 min à Ostende', 
    value: 'FOT_30', 
    level: PreferenceLevel.DISLIKE, 
    priority: 3 
  },
  
  // Planning
  { 
    id: generateId('pref'), 
    category: 'planning', 
    label: 'Services de matinée', 
    value: 'MORNING', 
    level: PreferenceLevel.LIKE, 
    priority: 2 
  },
  { 
    id: generateId('pref'), 
    category: 'planning', 
    label: 'Services de nuit', 
    value: 'NIGHT', 
    level: PreferenceLevel.DISLIKE, 
    priority: 3 
  },
  { 
    id: generateId('pref'), 
    category: 'planning', 
    label: 'Commencer tôt', 
    value: 'START_EARLY', 
    level: PreferenceLevel.LIKE, 
    priority: 1 
  },
  { 
    id: generateId('pref'), 
    category: 'planning', 
    label: 'Finir tard', 
    value: 'END_LATE', 
    level: PreferenceLevel.DISLIKE, 
    priority: 2 
  },
];

// ============================================================================
// DONNÉES MOCK COMPLÈTES (Pour développement)
// ============================================================================

export const MOCK_USERS: UserProfile[] = [
  {
    id: '1',
    sncbId: '78798801',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@sncb.be',
    phone: '+32 470 12 34 56',
    depot: 'FBMZ',
    series: '702',
    position: '12',
    role: 'Chef de train',
    isFloating: false,
    currentDuties: [],
    preferences: INITIAL_PREFERENCES.slice(0, 5),
    rgpdConsent: true,
    onboardingCompleted: true,
    createdAt: '2024-01-15T08:00:00Z',
    lastLogin: '2024-03-14T14:30:00Z',
  },
  {
    id: '2',
    sncbId: '78798802',
    firstName: 'Marc',
    lastName: 'Lambert',
    email: 'marc.lambert@sncb.be',
    phone: '+32 470 23 45 67',
    depot: 'FBMZ',
    series: '702',
    position: '15',
    role: 'Chef de train',
    isFloating: false,
    currentDuties: [],
    preferences: INITIAL_PREFERENCES.slice(5, 10),
    rgpdConsent: true,
    onboardingCompleted: true,
    createdAt: '2024-01-20T08:00:00Z',
    lastLogin: '2024-03-14T09:15:00Z',
  },
  {
    id: '3',
    sncbId: '79200110',
    firstName: 'Sophie',
    lastName: 'Vandevelde',
    email: 'sophie.vandevelde@sncb.be',
    phone: '+32 470 34 56 78',
    depot: 'FNR',
    series: '101',
    position: '05',
    role: 'Conducteur',
    isFloating: false,
    currentDuties: [],
    preferences: INITIAL_PREFERENCES.slice(10, 15),
    rgpdConsent: true,
    onboardingCompleted: true,
    createdAt: '2024-02-10T08:00:00Z',
    lastLogin: '2024-03-14T16:45:00Z',
  },
];

// ============================================================================
// UTILITAIRES
// ============================================================================

export function generateId(prefix?: string): string {
  try {
    const id = uuidv4();
    return prefix ? `${prefix}_${id}` : id;
  } catch (error) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const fallbackId = Array.from(array, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
    
    return prefix ? `${prefix}_${fallbackId}` : fallbackId;
  }
}

export function isValidStationCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const normalized = code.trim().toUpperCase();
  return STATION_MAP.has(normalized) || 
         /^[A-Z]{2,4}$/.test(normalized);
}

export function getStationName(
  code: string, 
  language: 'fr' | 'nl' = 'fr',
  fallback: 'code' | 'unknown' | 'error' = 'code'
): string {
  const normalizedCode = code.trim().toUpperCase();
  const station = STATION_MAP.get(normalizedCode);
  
  if (station) {
    return station.name;
  }
  
  switch (fallback) {
    case 'code':
      return normalizedCode;
    case 'unknown':
      return `Gare inconnue (${normalizedCode})`;
    case 'error':
      throw new Error(`Code gare inconnu: ${normalizedCode}`);
    default:
      return normalizedCode;
  }
}

export function getStationsForDepot(depotCode: string): Station[] {
  const depot = DEPOT_MAP.get(depotCode);
  if (!depot) return [];
  
  const depotStations: Record<string, string[]> = {
    'FBMZ': ['FBMZ', 'FBN', 'FBC', 'FLX', 'FBSM'],
    'FLG': ['FLG', 'FVI', 'FNR'],
    'FNR': ['FNR', 'FCR', 'FMS', 'FLLN'],
    'FOT': ['FOT', 'FBR', 'FGSP'],
    'FAN': ['FAN', 'FNT', 'FND', 'FZ'],
  };
  
  const stationCodes = depotStations[depotCode] || [];
  return stationCodes
    .map(code => STATION_MAP.get(code))
    .filter(Boolean) as Station[];
}

export function calculateRGPSLimits(duties: Duty[]): {
  totalHours: number;
  nightShifts: number;
  consecutiveDays: number;
  weeklyHours: number;
  violations: string[];
} {
  const now = new Date();
  const violations: string[] = [];
  
  const sortedDuties = [...duties].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const totalHours = sortedDuties.reduce((sum, duty) => sum + (duty.duration || 0), 0);
  const nightShifts = sortedDuties.filter(duty => duty.isNightShift === true).length;
  
  let consecutiveDays = 0;
  let currentStreak = 0;
  let lastDate: string | null = null;
  
  for (const duty of sortedDuties) {
    if (lastDate === duty.date) continue;
    
    if (!lastDate || isConsecutiveDay(lastDate, duty.date)) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    
    consecutiveDays = Math.max(consecutiveDays, currentStreak);
    lastDate = duty.date;
  }
  
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyHours = sortedDuties
    .filter(duty => new Date(duty.date) >= sevenDaysAgo)
    .reduce((sum, duty) => sum + (duty.duration || 0), 0);
  
  if (totalHours > RGPS_RULES.MAX_MONTHLY_HOURS) {
    violations.push(`Dépassement mensuel: ${totalHours}h/${RGPS_RULES.MAX_MONTHLY_HOURS}h`);
  }
  
  if (weeklyHours > RGPS_RULES.MAX_WEEKLY_HOURS) {
    violations.push(`Dépassement hebdomadaire: ${weeklyHours}h/${RGPS_RULES.MAX_WEEKLY_HOURS}h`);
  }
  
  if (consecutiveDays > RGPS_RULES.MAX_CONSECUTIVE_WORKING_DAYS) {
    violations.push(`Jours consécutifs: ${consecutiveDays}/${RGPS_RULES.MAX_CONSECUTIVE_WORKING_DAYS}`);
  }
  
  if (nightShifts > RGPS_RULES.MAX_NIGHT_SHIFTS_PER_WEEK) {
    violations.push(`Services de nuit: ${nightShifts}/${RGPS_RULES.MAX_NIGHT_SHIFTS_PER_WEEK}`);
  }
  
  return { totalHours, nightShifts, consecutiveDays, weeklyHours, violations };
}

function isConsecutiveDay(date1: string, date2: string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24);
  return diff === 1;
}

export function timeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
}

export const APP_CONFIG = {
  DEBOUNCE_DELAY_MS: 300,
  SESSION_TIMEOUT_MINUTES: 30,
  AUTO_SAVE_DELAY_MS: 3000,
  ITEMS_PER_PAGE: 20,
  MAX_UPLOAD_SIZE_MB: 10,
  NOTIFICATION_TIMEOUT_MS: 5000,
  MAX_RETRY_ATTEMPTS: 3,
  REQUEST_TIMEOUT_MS: 10000,
  POLLING_INTERVAL_MS: 30000,
  ENABLE_OCR: true,
  ENABLE_REAL_TIME: true,
  ENABLE_PWA: true,
  ENABLE_OFFLINE: false,
} as const;

export type ServiceTypeCode = typeof SERVICE_TYPES[number]['code'];
export type CompositionType = typeof COMPOSITIONS[number];
export type RelationNumber = typeof RELATIONS[number]['number'];
export type DepotCode = typeof DEPOTS[number]['code'];

export default {
  APP_VERSION,
  DEPOTS,
  DEPOT_MAP,
  DEPOT_CODES,
  STATIONS,
  STATION_MAP,
  SERVICE_TYPES,
  COMPOSITIONS,
  RELATIONS,
  RGPS_RULES,
  SwapStatus,
  SWAP_CONFIG,
  INITIAL_PREFERENCES,
  MOCK_USERS,
  APP_CONFIG,
  generateId,
  isValidStationCode,
  getStationName,
  getStationsForDepot,
  calculateRGPSLimits,
  timeToMinutes,
  formatDuration,
};
