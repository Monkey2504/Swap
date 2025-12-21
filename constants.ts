
import { Duty, PreferenceLevel, UserPreference } from './types';

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
    date: '2024-05-20'
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
    date: '2024-05-21'
  }
];

export const INITIAL_PREFERENCES: UserPreference[] = [
  { id: 'p1', category: 'content', label: 'Service IC (InterCity)', value: 'IC', level: PreferenceLevel.LIKE, priority: 3 },
  { id: 'p2', category: 'content', label: 'Relation 24', value: '24', level: PreferenceLevel.LIKE, priority: 2 },
  { id: 'p3', category: 'content', label: 'Omnibus (Lent)', value: 'Omnibus', level: PreferenceLevel.DISLIKE, priority: 1 },
  { id: 'p4', category: 'content', label: 'Compositions M7', value: 'M7', level: PreferenceLevel.LIKE, priority: 2 },
  { id: 'p5', category: 'content', label: 'Destination Luxembourg', value: 'Luxembourg', level: PreferenceLevel.LIKE, priority: 1 },
  { id: 'p6', category: 'planning', label: 'Lundi', value: 'Monday', level: PreferenceLevel.NEUTRAL, priority: 0 },
  { id: 'p7', category: 'planning', label: 'Matinée (Avant 07h)', value: 'Morning', level: PreferenceLevel.LIKE, priority: 1 },
  { id: 'p8', category: 'planning', label: 'Prestations de Nuit', value: 'Night', level: PreferenceLevel.DISLIKE, priority: 3 },
];

export const SNCB_DEPOTS = ['Bruxelles-Midi', 'Liège-Guillemins', 'Anvers-Central', 'Namur', 'Charleroi-Central'];

export const NOMENCLATURE = {
  types: ['IC', 'Omnibus', 'P (Heure de pointe)', 'S (Suburbain)'],
  compositions: ['AM96 (Danois)', 'AM08 (Desiro)', 'M6', 'M7', 'I11'],
  relations: ['01', '24', '38', '40', '96']
};

export const MOCK_STAFF_LIST = [
  { firstName: 'Jean', lastName: 'Dupont', series: '702', position: '12' },
  { firstName: 'Marc', lastName: 'Lambert', series: '702', position: '15' },
  { firstName: 'Sophie', lastName: 'Vandenbroeck', series: '710', position: '05' },
  { firstName: 'Thomas', lastName: 'Muller', series: 'FNR', position: 'Flottant' }
];
