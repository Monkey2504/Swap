import { Duty, PreferenceLevel, UserPreference } from './types';

// Définition des rôles/positions dans les dépôts
export type DepotRole = 'Conducteur' | 'Chef de train' | 'Flottant' | 'Remplaçant';

// Interface pour le personnel
export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  sncbId: string;
  depot: string;
  series: string;
  position: string;
  role: DepotRole;
  email?: string;
  phone?: string;
}

// Données de démonstration pour les prestations (duties) de l'utilisateur
export const MOCK_USER_DUTIES: Duty[] = [
  {
    id: 'd1',
    code: '1502',
    type: 'IC',
    relations: ['24', '38'],
    compositions: ['M7'],
    destinations: ['Oostende', 'Eupen'],
    startTime: '06:15',
    endTime: '14:30',
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString().split('T')[0], // J+3
    dayOfWeek: 'Lundi',
    duration: 8.25,
    isNight: false,
    isWeekend: false,
    depot: 'Bruxelles-Midi'
  },
  {
    id: 'd2',
    code: '1503',
    type: 'Omnibus',
    relations: ['40'],
    compositions: ['AM96'],
    destinations: ['Namur', 'Liege'],
    startTime: '14:45',
    endTime: '22:15',
    date: new Date(new Date().setDate(new Date().getDate() + 4)).toISOString().split('T')[0], // J+4
    dayOfWeek: 'Mardi',
    duration: 7.5,
    isNight: false,
    isWeekend: false,
    depot: 'Bruxelles-Midi'
  },
  {
    id: 'd3',
    code: '2201',
    type: 'P',
    relations: ['01'],
    compositions: ['AM08'],
    destinations: ['Anvers', 'Bruxelles'],
    startTime: '05:30',
    endTime: '09:45',
    date: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
    dayOfWeek: 'Mercredi',
    duration: 4.25,
    isNight: false,
    isWeekend: false,
    depot: 'Bruxelles-Midi'
  },
  {
    id: 'd4',
    code: '3105',
    type: 'IC',
    relations: ['96'],
    compositions: ['I11'],
    destinations: ['Charleroi', 'Luxembourg'],
    startTime: '22:30',
    endTime: '06:15',
    date: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0],
    dayOfWeek: 'Jeudi',
    duration: 7.75,
    isNight: true,
    isWeekend: false,
    depot: 'Bruxelles-Midi'
  }
];

// Préférences initiales de l'utilisateur
export const INITIAL_PREFERENCES: UserPreference[] = [
  // Préférences de contenu (trains, relations, etc.)
  { 
    id: 'p1', 
    category: 'content', 
    label: 'Service IC (InterCity)', 
    value: 'IC', 
    level: PreferenceLevel.LIKE, 
    priority: 3,
    description: 'Trains InterCity rapides et confortables'
  },
  { 
    id: 'p2', 
    category: 'content', 
    label: 'Relation 24 (Bruxelles - Eupen)', 
    value: '24', 
    level: PreferenceLevel.LIKE, 
    priority: 2,
    description: 'Ligne vers l\'est du pays'
  },
  { 
    id: 'p3', 
    category: 'content', 
    label: 'Omnibus (Lent)', 
    value: 'Omnibus', 
    level: PreferenceLevel.DISLIKE, 
    priority: 1,
    description: 'Trains omnibus avec nombreux arrêts'
  },
  { 
    id: 'p4', 
    category: 'content', 
    label: 'Compositions M7', 
    value: 'M7', 
    level: PreferenceLevel.LIKE, 
    priority: 2,
    description: 'Matériel roulant M7 moderne'
  },
  { 
    id: 'p5', 
    category: 'content', 
    label: 'Destination Luxembourg', 
    value: 'Luxembourg', 
    level: PreferenceLevel.LIKE, 
    priority: 1,
    description: 'Trajets vers le Grand-Duché'
  },
  { 
    id: 'p6', 
    category: 'content', 
    label: 'Composition AM96', 
    value: 'AM96', 
    level: PreferenceLevel.DISLIKE, 
    priority: 1,
    description: 'Ancien matériel danois'
  },
  
  // Préférences de planning (horaires, jours, etc.)
  { 
    id: 'p7', 
    category: 'planning', 
    label: 'Lundi', 
    value: 'Monday', 
    level: PreferenceLevel.NEUTRAL, 
    priority: 0,
    description: 'Premier jour de la semaine'
  },
  { 
    id: 'p8', 
    category: 'planning', 
    label: 'Matinée (Avant 07h)', 
    value: 'Morning', 
    level: PreferenceLevel.LIKE, 
    priority: 1,
    description: 'Début tôt le matin'
  },
  { 
    id: 'p9', 
    category: 'planning', 
    label: 'Prestations de Nuit', 
    value: 'Night', 
    level: PreferenceLevel.DISLIKE, 
    priority: 3,
    description: 'Travail de nuit'
  },
  { 
    id: 'p10', 
    category: 'planning', 
    label: 'Week-end', 
    value: 'Weekend', 
    level: PreferenceLevel.DISLIKE, 
    priority: 2,
    description: 'Travail le samedi et dimanche'
  },
  { 
    id: 'p11', 
    category: 'planning', 
    label: 'Après-midi (14h-18h)', 
    value: 'Afternoon', 
    level: PreferenceLevel.LIKE, 
    priority: 2,
    description: 'Horaires d\'après-midi'
  },
  { 
    id: 'p12', 
    category: 'planning', 
    label: 'Prestations courtes (< 6h)', 
    value: 'Short', 
    level: PreferenceLevel.LIKE, 
    priority: 1,
    description: 'Services de courte durée'
  },
  
  // Préférences de lieu (dépôts, destinations)
  { 
    id: 'p13', 
    category: 'location', 
    label: 'Dépôt Liège-Guillemins', 
    value: 'Liège-Guillemins', 
    level: PreferenceLevel.LIKE, 
    priority: 1,
    description: 'Préférence pour le dépôt de Liège'
  },
  { 
    id: 'p14', 
    category: 'location', 
    label: 'Dépôt Anvers-Central', 
    value: 'Anvers-Central', 
    level: PreferenceLevel.DISLIKE, 
    priority: 2,
    description: 'Éviter le dépôt d\'Anvers'
  }
];

// Liste des dépôts SNCB
export const SNCB_DEPOTS = [
  { code: 'BM', name: 'Bruxelles-Midi', region: 'Bruxelles' },
  { code: 'LG', name: 'Liège-Guillemins', region: 'Liège' },
  { code: 'AC', name: 'Anvers-Central', region: 'Anvers' },
  { code: 'NA', name: 'Namur', region: 'Namur' },
  { code: 'CC', name: 'Charleroi-Central', region: 'Charleroi' },
  { code: 'GE', name: 'Gand', region: 'Gand' },
  { code: 'HA', name: 'Hasselt', region: 'Limbourg' },
  { code: 'MO', name: 'Mons', region: 'Mons' }
];

// Nomenclature SNCB standardisée
export const NOMENCLATURE = {
  // Types de train
  types: [
    { code: 'IC', name: 'InterCity', description: 'Train rapide avec arrêts limités' },
    { code: 'Omnibus', name: 'Omnibus', description: 'Train local avec tous les arrêts' },
    { code: 'P', name: 'Heure de pointe', description: 'Service renforcé aux heures de pointe' },
    { code: 'S', name: 'Suburbain', description: 'Train de banlieue' },
    { code: 'L', name: 'L', description: 'Train local' }
  ],
  
  // Matériels roulants
  compositions: [
    { code: 'AM96', name: 'AM96 (Danois)', description: 'Ancien matériel danois' },
    { code: 'AM08', name: 'AM08 (Desiro)', description: 'Matériel Desiro moderne' },
    { code: 'M6', name: 'M6', description: 'Matériel M6' },
    { code: 'M7', name: 'M7', description: 'Matériel M7 récent' },
    { code: 'I11', name: 'I11', description: 'Matériel InterCity' },
    { code: 'MR08', name: 'MR08', description: 'Matériel régional' }
  ],
  
  // Relations principales
  relations: [
    { code: '01', name: 'Ligne 1', description: 'Bruxelles - Anvers' },
    { code: '24', name: 'Ligne 24', description: 'Bruxelles - Eupen' },
    { code: '38', name: 'Ligne 38', description: 'Bruxelles - Oostende' },
    { code: '40', name: 'Ligne 40', description: 'Namur - Liège' },
    { code: '96', name: 'Ligne 96', description: 'Charleroi - Luxembourg' },
    { code: '50', name: 'Ligne 50', description: 'Gand - Anvers' },
    { code: '36', name: 'Ligne 36', description: 'Bruxelles - Mons' }
  ],
  
  // Destinations principales
  destinations: [
    'Bruxelles', 'Anvers', 'Liège', 'Gand', 'Charleroi', 'Namur', 'Mons',
    'Oostende', 'Eupen', 'Luxembourg', 'Hasselt', 'Tournai', 'Arlon'
  ],
  
  // Tranches horaires
  timeSlots: [
    { code: 'NIGHT', name: 'Nuit', start: '22:00', end: '06:00' },
    { code: 'EARLY', name: 'Très tôt', start: '04:00', end: '07:00' },
    { code: 'MORNING', name: 'Matin', start: '07:00', end: '12:00' },
    { code: 'AFTERNOON', name: 'Après-midi', start: '12:00', end: '18:00' },
    { code: 'EVENING', name: 'Soir', start: '18:00', end: '22:00' }
  ]
};

// Liste du personnel pour la recherche/contact
export const MOCK_STAFF_LIST: StaffMember[] = [
  { 
    id: '1', 
    firstName: 'Jean', 
    lastName: 'Dupont', 
    sncbId: '78798801',
    depot: 'Bruxelles-Midi', 
    series: '702', 
    position: '12',
    role: 'Conducteur',
    email: 'jean.dupont@sncb.be',
    phone: '+32 470 12 34 56'
  },
  { 
    id: '2', 
    firstName: 'Marc', 
    lastName: 'Lambert', 
    sncbId: '78798802',
    depot: 'Bruxelles-Midi', 
    series: '702', 
    position: '15',
    role: 'Chef de train',
    email: 'marc.lambert@sncb.be',
    phone: '+32 470 23 45 67'
  },
  { 
    id: '3', 
    firstName: 'Sophie', 
    lastName: 'Vandenbroeck', 
    sncbId: '78798803',
    depot: 'Liège-Guillemins', 
    series: '710', 
    position: '05',
    role: 'Conducteur',
    email: 'sophie.vandenbroeck@sncb.be'
  },
  { 
    id: '4', 
    firstName: 'Thomas', 
    lastName: 'Muller', 
    sncbId: '78798804',
    depot: 'Anvers-Central', 
    series: 'FNR', 
    position: '00',
    role: 'Flottant'
  },
  { 
    id: '5', 
    firstName: 'Marie', 
    lastName: 'Dubois', 
    sncbId: '78798805',
    depot: 'Namur', 
    series: '701', 
    position: '08',
    role: 'Conducteur'
  },
  { 
    id: '6', 
    firstName: 'Pierre', 
    lastName: 'Claude', 
    sncbId: '78798806',
    depot: 'Charleroi-Central', 
    series: '715', 
    position: '03',
    role: 'Chef de train'
  }
];

// Jours de la semaine
export const DAYS_OF_WEEK = [
  'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'
];

// Niveaux de priorité avec description
export const PRIORITY_LEVELS = [
  { level: 0, label: 'Non prioritaire', color: 'gray', description: 'Peu important' },
  { level: 1, label: 'Faible', color: 'blue', description: 'À prendre en compte' },
  { level: 2, label: 'Moyenne', color: 'yellow', description: 'Important' },
  { level: 3, label: 'Haute', color: 'red', description: 'Très important' }
];

// Catégories de préférences
export const PREFERENCE_CATEGORIES = [
  { id: 'content', label: 'Contenu', description: 'Type de train, matériel, destination' },
  { id: 'planning', label: 'Planning', description: 'Horaires, jours, durée' },
  { id: 'location', label: 'Lieu', description: 'Dépôt, région' }
];

// Configuration des couleurs pour les types de train
export const TRAIN_TYPE_COLORS: Record<string, string> = {
  'IC': 'bg-purple-100 text-purple-800 border-purple-200',
  'Omnibus': 'bg-green-100 text-green-800 border-green-200',
  'P': 'bg-orange-100 text-orange-800 border-orange-200',
  'S': 'bg-blue-100 text-blue-800 border-blue-200',
  'L': 'bg-gray-100 text-gray-800 border-gray-200'
};

// Fonction utilitaire pour générer un ID unique
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};