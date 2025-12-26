import { Duty, PreferenceLevel, UserPreference, UserProfile, DepotRole, Station } from './types';
import { v4 as uuidv4 } from 'uuid';

// Version de l'application
export const APP_VERSION = '2.5.1';
export const APP_BUILD_DATE = '2024-12-25';
export const MINIMUM_BROWSER_VERSION = 80; // Chrome 80+, Firefox 80+, Safari 14+

// Disclaimer légal
export const LEGAL_DISCLAIMER = "Attention : Cette application est un outil d'entraide entre agents. Elle ne remplace pas les outils officiels de la SNCB. Toute permutation doit être validée par le Tableau de Service (TS) via les canaux réglementaires.";

export const DATA_PRIVACY_NOTE = "Conformément au RGPD, vos données personnelles ne sont utilisées que pour les fonctionnalités de permutation. Vous pouvez demander leur suppression à tout moment via support@swapact.sncb.be";

// Rôles dans les dépôts
export const DEPOT_ROLES: DepotRole[] = ['Conducteur', 'Chef de train', 'Chef de bord', 'Flottant'];

// Configuration des dépôts SNCB
export interface DepotConfig {
  code: string;
  name: string;
  region: 'Bruxelles' | 'Wallonie' | 'Flandre';
  timezone: 'Europe/Brussels';
  contactTS: string;
  phoneTS: string;
  emailTS: string;
  address: string;
  color: string; // Couleur pour la carte/interface
}

export const DEPOTS: DepotConfig[] = [
  { 
    code: 'FBMZ', 
    name: 'Bruxelles-Midi', 
    region: 'Bruxelles', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Bruxelles-Midi',
    phoneTS: '02 224 88 00',
    emailTS: 'ts.bruxelles-midi@sncb.be',
    address: 'Bd de France 85, 1070 Bruxelles',
    color: '#003399'
  },
  { 
    code: 'FBN', 
    name: 'Bruxelles-Nord', 
    region: 'Bruxelles', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Bruxelles-Nord',
    phoneTS: '02 224 88 00',
    emailTS: 'ts.bruxelles-nord@sncb.be',
    address: 'Rue du Progrès 76, 1030 Bruxelles',
    color: '#0055CC'
  },
  { 
    code: 'FLG', 
    name: 'Liège-Guillemins', 
    region: 'Wallonie', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Liège-Guillemins',
    phoneTS: '04 224 88 00',
    emailTS: 'ts.liege@sncb.be',
    address: 'Place des Guillemins 2, 4000 Liège',
    color: '#D52B1E'
  },
  { 
    code: 'FNR', 
    name: 'Namur', 
    region: 'Wallonie', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Namur',
    phoneTS: '081 224 88 00',
    emailTS: 'ts.namur@sncb.be',
    address: 'Place de la Station 1, 5000 Namur',
    color: '#FF6B00'
  },
  { 
    code: 'FMS', 
    name: 'Mons', 
    region: 'Wallonie', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Mons',
    phoneTS: '065 224 88 00',
    emailTS: 'ts.mons@sncb.be',
    address: 'Place Léopold 1, 7000 Mons',
    color: '#8B4513'
  },
  { 
    code: 'FCR', 
    name: 'Charleroi-Central', 
    region: 'Wallonie', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Charleroi',
    phoneTS: '071 224 88 00',
    emailTS: 'ts.charleroi@sncb.be',
    address: 'Bd Janson 1, 6000 Charleroi',
    color: '#228B22'
  },
  { 
    code: 'FOT', 
    name: 'Ostende', 
    region: 'Flandre', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Ostende',
    phoneTS: '059 224 88 00',
    emailTS: 'ts.ostende@sncb.be',
    address: 'Stationplein 1, 8400 Oostende',
    color: '#1E90FF'
  },
  { 
    code: 'FGSP', 
    name: 'Gand-Saint-Pierre', 
    region: 'Flandre', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Gand',
    phoneTS: '09 224 88 00',
    emailTS: 'ts.gent@sncb.be',
    address: 'Sint-Pietersplein 1, 9000 Gent',
    color: '#8A2BE2'
  },
  { 
    code: 'FAN', 
    name: 'Anvers-Central', 
    region: 'Flandre', 
    timezone: 'Europe/Brussels',
    contactTS: 'TS Anvers',
    phoneTS: '03 224 88 00',
    emailTS: 'ts.antwerpen@sncb.be',
    address: 'Koningin Astridplein 27, 2018 Antwerpen',
    color: '#FFD700'
  },
];

// Map pour accéder rapidement aux dépôts par code
export const DEPOT_MAP = new Map(DEPOTS.map(d => [d.code, d]));

// Configuration des stations (codes gares SNCB)
export const STATIONS: Station[] = [
  // Stations principales
  { code: 'BRU', name: 'Bruxelles-Central', type: 'main', region: 'Bruxelles' },
  { code: 'BMZ', name: 'Bruxelles-Midi', type: 'main', region: 'Bruxelles' },
  { code: 'BN', name: 'Bruxelles-Nord', type: 'main', region: 'Bruxelles' },
  { code: 'LG', name: 'Liège-Guillemins', type: 'main', region: 'Wallonie' },
  { code: 'NMR', name: 'Namur', type: 'main', region: 'Wallonie' },
  { code: 'MNC', name: 'Mons', type: 'main', region: 'Wallonie' },
  { code: 'CRL', name: 'Charleroi-Central', type: 'main', region: 'Wallonie' },
  { code: 'OST', name: 'Ostende', type: 'main', region: 'Flandre' },
  { code: 'GSP', name: 'Gand-Saint-Pierre', type: 'main', region: 'Flandre' },
  { code: 'ANT', name: 'Anvers-Central', type: 'main', region: 'Flandre' },
  // Stations secondaires
  { code: 'AL', name: 'Alost', type: 'secondary', region: 'Flandre' },
  { code: 'AR', name: 'Arlon', type: 'secondary', region: 'Wallonie' },
  { code: 'BR', name: 'Bruges', type: 'secondary', region: 'Flandre' },
  { code: 'CR', name: 'Courtrai', type: 'secondary', region: 'Flandre' },
  { code: 'HS', name: 'Hasselt', type: 'secondary', region: 'Flandre' },
  { code: 'LW', name: 'Louvière', type: 'secondary', region: 'Wallonie' },
  { code: 'ML', name: 'Malines', type: 'secondary', region: 'Flandre' },
  { code: 'TL', name: 'Tamines', type: 'secondary', region: 'Wallonie' },
  { code: 'TR', name: 'Tournai', type: 'secondary', region: 'Wallonie' },
  { code: 'VIL', name: 'Vilvorde', type: 'secondary', region: 'Flandre' },
];

export const STATION_MAP = new Map(STATIONS.map(s => [s.code, s]));

// Niveaux de préférence
export const PREFERENCE_LEVELS: { value: PreferenceLevel; label: string; color: string; description: string }[] = [
  { value: 'required', label: 'Indispensable', color: '#10B981', description: 'Doit absolument être inclus' },
  { value: 'high', label: 'Très important', color: '#3B82F6', description: 'Fortement souhaité' },
  { value: 'medium', label: 'Important', color: '#F59E0B', description: 'Souhaitable mais pas obligatoire' },
  { value: 'low', label: 'Optionnel', color: '#6B7280', description: 'Bonus si possible' },
  { value: 'avoid', label: 'À éviter', color: '#EF4444', description: 'À éviter si possible' },
  { value: 'never', label: 'Jamais', color: '#7F1D1D', description: 'Inacceptable' },
];

// Préférences initiales par défaut
export const INITIAL_PREFERENCES: UserPreference[] = [
  {
    id: uuidv4(),
    type: 'time',
    name: 'Début de service',
    value: '07:00',
    level: 'medium',
    description: 'Heure de début préférée'
  },
  {
    id: uuidv4(),
    type: 'time',
    name: 'Fin de service',
    value: '15:00',
    level: 'medium',
    description: 'Heure de fin préférée'
  },
  {
    id: uuidv4(),
    type: 'day',
    name: 'Week-end',
    value: 'avoid',
    level: 'medium',
    description: 'Préférence pour les services du week-end'
  },
  {
    id: uuidv4(),
    type: 'station',
    name: 'Gares favorites',
    value: ['BRU', 'BMZ', 'LG'],
    level: 'medium',
    description: 'Gares où vous préférez travailler'
  },
  {
    id: uuidv4(),
    type: 'train',
    name: 'Types de train',
    value: ['IC', 'L'],
    level: 'low',
    description: 'Types de train préférés'
  }
];

// Configuration de l'application
export const APP_CONFIG = {
  AUTO_SAVE_DELAY_MS: 2000,
  POLLING_INTERVAL_MS: 15000,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  SESSION_TIMEOUT_MINUTES: 60,
  MAX_NOTIFICATIONS: 50,
  API_TIMEOUT_MS: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY_MS: 1000,
} as const;

// Règles RGPS (Règlement Général sur la Protection des Salariés)
export const RGPS_RULES = {
  MAX_SERVICE_DURATION_HOURS: 9,
  MAX_WEEKLY_HOURS: 48,
  MAX_NIGHT_SHIFTS_PER_WEEK: 3,
  MIN_REST_BETWEEN_SHIFTS_HOURS: 11,
  MIN_WEEKLY_REST_HOURS: 35,
  MAX_CONSECUTIVE_WORKING_DAYS: 6,
} as const;

// Règles spécifiques SNCB
export const SNCB_RULES = {
  MAX_SWAP_DISTANCE_KM: 100,
  MIN_NOTICE_HOURS: 24,
  MAX_SWAPS_PER_MONTH: 10,
  APPROVAL_REQUIRED: true,
  MAX_PENDING_REQUESTS: 5,
  TRADE_WINDOW_HOURS: 72,
} as const;

// Codes de service/activité
export const SERVICE_CODES = {
  IC: 'InterCity',
  L: 'L (Omnibus)',
  P: 'Train de pointe',
  S: 'Train spécial',
  T: 'Train de travaux',
  E: 'Train d\'entretien',
  X: 'Service exceptionnel',
} as const;

// Types de contraintes
export const CONSTRAINT_TYPES = [
  { value: 'medical', label: 'Médical', icon: '🏥' },
  { value: 'family', label: 'Famille', icon: '👨‍👩‍👧‍👦' },
  { value: 'training', label: 'Formation', icon: '🎓' },
  { value: 'personal', label: 'Personnel', icon: '👤' },
  { value: 'administrative', label: 'Administratif', icon: '📋' },
  { value: 'other', label: 'Autre', icon: '📝' },
];

// État des échanges
export const SWAP_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  EXPIRED: 'expired',
} as const;

// Notifications types
export const NOTIFICATION_TYPES = {
  SWAP_REQUEST: 'swap_request',
  SWAP_ACCEPTED: 'swap_accepted',
  SWAP_REJECTED: 'swap_rejected',
  SWAP_REMINDER: 'swap_reminder',
  SYSTEM_ALERT: 'system_alert',
  ANNOUNCEMENT: 'announcement',
} as const;

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre accès internet.',
  API_ERROR: 'Service temporairement indisponible. Réessayez dans quelques instants.',
  AUTH_ERROR: 'Session expirée. Veuillez vous reconnecter.',
  VALIDATION_ERROR: 'Veuillez vérifier les informations saisies.',
  PERMISSION_ERROR: 'Vous n\'avez pas les permissions nécessaires pour cette action.',
  NOT_FOUND: 'Ressource non trouvée.',
  RATE_LIMIT: 'Trop de tentatives. Veuillez réessayer plus tard.',
  UNKNOWN: 'Une erreur inattendue s\'est produite.',
} as const;

// URLs et endpoints
export const API_ENDPOINTS = {
  USERS: '/api/users',
  DUTIES: '/api/duties',
  SWAPS: '/api/swaps',
  PREFERENCES: '/api/preferences',
  NOTIFICATIONS: '/api/notifications',
  STATIONS: '/api/stations',
  VISION: '/api/vision',
  ERROR_LOG: '/api/error-log',
  HEALTH: '/api/health',
} as const;

// Fonctions utilitaires
export function getStationName(code: string): string {
  return STATION_MAP.get(code)?.name || code;
}

export function getDepotName(code: string): string {
  return DEPOT_MAP.get(code)?.name || code;
}

export function getPreferenceLevelColor(level: PreferenceLevel): string {
  return PREFERENCE_LEVELS.find(p => p.value === level)?.color || '#6B7280';
}

export function getPreferenceLevelLabel(level: PreferenceLevel): string {
  return PREFERENCE_LEVELS.find(p => p.value === level)?.label || 'Non défini';
}

export function formatServiceTime(time: string): string {
  if (!time || time.length !== 4) return '--:--';
  return `${time.slice(0, 2)}:${time.slice(2)}`;
}

export function calculateServiceDuration(start: string, end: string): number {
  const startHour = parseInt(start.slice(0, 2));
  const startMinute = parseInt(start.slice(2));
  const endHour = parseInt(end.slice(0, 2));
  const endMinute = parseInt(end.slice(2));
  
  const startTotal = startHour * 60 + startMinute;
  const endTotal = endHour * 60 + endMinute;
  
  let duration = endTotal - startTotal;
  if (duration < 0) duration += 24 * 60; // Gestion du passage minuit
    
  return Math.round(duration / 60 * 10) / 10; // Arrondi à 0.1 heure
}

export function isValidDuty(duty: Partial<Duty>): boolean {
  return !!(
    duty.id &&
    duty.date &&
    duty.startTime &&
    duty.endTime &&
    duty.startStation &&
    duty.endStation &&
    duty.type
  );
}

export function generateDutyId(): string {
  return `DUTY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateSwapId(): string {
  return `SWAP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Constantes de validation
export const VALIDATION_RULES = {
  EMPLOYEE_ID: /^[0-9]{6,8}$/,
  EMAIL: /^[^\s@]+@sncb\.be$/,
  PHONE: /^[0-9\s+\-()]{8,15}$/,
  TIME: /^([01][0-9]|2[0-3])[0-5][0-9]$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  STATION_CODE: /^[A-Z]{2,4}$/,
};

// Thèmes et couleurs
export const THEME_COLORS = {
  primary: '#003399',
  secondary: '#0055CC',
  accent: '#FFD700',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  neutral: '#6B7280',
  background: '#F3F4F6',
  surface: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#6B7280',
} as const;

// Icônes par type
export const TYPE_ICONS = {
  duty: '📋',
  swap: '🔄',
  user: '👤',
  station: '🏢',
  train: '🚂',
  time: '⏰',
  preference: '⭐',
  notification: '🔔',
  document: '📄',
  settings: '⚙️',
  help: '❓',
  logout: '🚪',
} as const;

// Exporter toutes les constantes
export default {
  APP_VERSION,
  LEGAL_DISCLAIMER,
  DEPOT_ROLES,
  DEPOTS,
  DEPOT_MAP,
  STATIONS,
  STATION_MAP,
  PREFERENCE_LEVELS,
  INITIAL_PREFERENCES,
  APP_CONFIG,
  RGPS_RULES,
  SNCB_RULES,
  SERVICE_CODES,
  CONSTRAINT_TYPES,
  SWAP_STATUS,
  NOTIFICATION_TYPES,
  ERROR_MESSAGES,
  API_ENDPOINTS,
  VALIDATION_RULES,
  THEME_COLORS,
  TYPE_ICONS,
  
  // Fonctions utilitaires
  getStationName,
  getDepotName,
  getPreferenceLevelColor,
  getPreferenceLevelLabel,
  formatServiceTime,
  calculateServiceDuration,
  isValidDuty,
  generateDutyId,
  generateSwapId,
};