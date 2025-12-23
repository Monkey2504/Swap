
import { Duty, PreferenceLevel, UserPreference, UserProfile } from './types';

export type DepotRole = 'Conducteur' | 'Chef de train' | 'Chef de bord' | 'Flottant';

export interface Station {
  code: string;
  name: string;
}

// StaffMember est maintenant un alias de UserProfile pour la cohérence
export type StaffMember = UserProfile;

export const APP_VERSION = '2.5.0';
export const DEPOTS = ['Bruxelles-Midi', 'Namur', 'Liège-Guillemins', 'Mons', 'Charleroi-Central', 'Gand-Saint-Pierre', 'Anvers-Central'];

export const generateId = (prefix: string = 'id'): string => {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};

export const INITIAL_PREFERENCES: UserPreference[] = [
  { 
    id: generateId('pref'), 
    category: 'content', 
    label: 'Trains IC (Rapides)', 
    value: 'IC', 
    level: PreferenceLevel.LIKE, 
    priority: 3 
  },
  { 
    id: generateId('pref'), 
    category: 'content', 
    label: 'Omnibus / L (Local)', 
    value: 'Omnibus', 
    level: PreferenceLevel.NEUTRAL, 
    priority: 1 
  },
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
  }
];

export const RGPS_RULES = {
  MIN_REST_TIME_HOURS: 11,
  MAX_SERVICE_DURATION_HOURS: 9,
  NIGHT_SHIFT_START: '22:00',
  NIGHT_SHIFT_END: '06:00'
};

export const SNCB_DEPOTS = [
  { code: 'BM', name: 'Bruxelles-Midi', region: 'Bruxelles' },
  { code: 'FNR', name: 'Namur', region: 'Wallonie' },
  { code: 'FLG', name: 'Liège-Guillemins', region: 'Wallonie' },
  { code: 'FMS', name: 'Mons', region: 'Wallonie' }
];

export const NOMENCLATURE = {
  types: [
    { code: 'IC', name: 'InterCity' },
    { code: 'L', name: 'Omnibus' },
    { code: 'P', name: 'Heure de pointe' },
    { code: 'S', name: 'Suburbain' }
  ],
  compositions: ['AM96', 'AM08', 'M6', 'M7', 'I11'],
  stations: [
    { code: "FBMZ", name: "Bruxelles-Midi" },
    { code: "FBN", name: "Bruxelles-Nord" },
    { code: "FBC", name: "Bruxelles-Central" },
    { code: "FLG", name: "Liège-Guillemins" },
    { code: "FNR", name: "Namur" },
    { code: "FMS", name: "Mons" },
    { code: "FCR", name: "Charleroi-Central" },
    { code: "FOT", name: "Ostende" },
    { code: "FTR", name: "Tournai" },
    { code: "FVI", name: "Verviers-Central" },
    { code: "FGSP", name: "Gand-Saint-Pierre" },
    { code: "FLLN", name: "Louvain-la-Neuve" }
  ] as Station[]
};

export const MOCK_STAFF_LIST: StaffMember[] = [
  { id: '1', firstName: 'Jean', lastName: 'Dupont', sncbId: '78798801', email: 'jean.dupont@sncb.be', depot: 'Bruxelles-Midi', series: '702', position: '12', role: 'Chef de train', isFloating: false, currentDuties: [], rgpdConsent: true },
  { id: '2', firstName: 'Marc', lastName: 'Lambert', sncbId: '78798802', email: 'marc.lambert@sncb.be', depot: 'Bruxelles-Midi', series: '702', position: '15', role: 'Chef de train', isFloating: false, currentDuties: [], rgpdConsent: true },
  { id: '3', firstName: 'Sophie', lastName: 'Vandevelde', sncbId: '79200110', email: 'sophie.vandevelde@sncb.be', depot: 'Namur', series: '101', position: '05', role: 'Conducteur', isFloating: false, currentDuties: [], rgpdConsent: true }
];
